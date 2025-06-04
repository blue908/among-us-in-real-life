const readline = require('readline');


const http = require('http');
const express = require('express');
const fs = require('fs');
const WebSocket = require('ws');
const { log } = require('console');

const hostname = '127.0.0.1';
const port = 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

app.use(express.static('public'));
app.get('/tutorial', (req, res) => {
    const filePath = __dirname + '/public/tutorial.pdf';
    res.sendFile(filePath);
});

const colors = {
    gray: '\x1b[90m',

    red: '\x1b[31m',
    darkRed: '\x1b[31;2m',
    brightRed: '\x1b[91m',
    
    orange: '\x1b[38;5;214m',

    yellow: '\x1b[33m',

    green: '\x1b[32m',

    cyan: '\x1b[36m',

    blue: '\x1b[34m',

    purple: '\x1b[35m',
    brightPurple: '\x1b[95m',
    
    reverse: '\x1b[7m',
    reset: '\x1b[0m',
};

let roles;
let tasks;
let sabotages;
let gameSettings;

let currentSabotage;
let currentTwoPlayerFixChecks = 0;
let currentSabotageTimeout;

let taskbarUpdateTimeout;

let gameInProgress = false;
let meetingInProgress = false;
let votingInProgress = false;

let votes = {};

let players = [];
class Player {
    constructor(playerName) {
      this.playerName = playerName;
      this.isConnected = true;
      this.isAlive = true;

      this.tasksCompleted = 0;
      this.tasks = null;
      this.role = null;
      this.numVotes = null;
    }
}

//-------- files ----------------
function getAllGameSettingsFromFile() {
    try {
      const data = fs.readFileSync('allGameSettings.json', 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('there was an error with getting the settings from allGameSettings.json:', error.message);
      return null;
    }
}

function setAllGameSettingsVariables(info) {
    if(info !== null){
        roles = info.roles;
        addRedundantInformationToRoles(roles);

        tasks = info.tasks;
        multipleLocationsToIndividualTasks(tasks);
        sabotages = info.sabotages;

        gameSettings = info.gameSettings;
    } else {
        console.log("tried to set the settings but info was null")
    }
}

setAllGameSettingsVariables(getAllGameSettingsFromFile())

//-------- websocket ----------------
wss.on('connection', (ws, req) => {
    let thisPlayerName = "";
    /**@type Player*/
    let thisPlayer;
    const ip = req.socket.remoteAddress;
    ws.on('message', (message) => {
        console.log(colors.gray+`Received message: ${message}`+colors.reset);
        try{
            const data = JSON.parse(message);

            if(data.type === 'join'){
                thisPlayerName = data.playerName;
                ws.playerName = thisPlayerName;
                if(!data.isReconnecting)
                    console.log(colors.green+`${thisPlayerName} joined`+colors.reset);
                else
                    console.log(colors.green+`${thisPlayerName} reconnected`+colors.reset);
                
            
                if(!(thisPlayerName === "host")){
                    let index = players.findIndex((p) => p.playerName === thisPlayerName)
                
                    if(index === -1)
                    {   
                        //if there is no player of that name, make a new player
                        thisPlayer = new Player(thisPlayerName);
                        players.push(thisPlayer);
                    
                    } else {
                        //otherwise, just set player to whatever player has the same name
                        thisPlayer = players[index];
                        thisPlayer.isConnected = true;
                    }   
                }
                sendOutPlayerInfo();
                resyncClient(ws);
            }
            if(data.type === 'remove_player'){
                removePlayer(data.playerName);
            }
            if(data.type === "start_game"){
                startGame();
            }
            if(data.type === "end_game"){
                endGame();
            }
            if(data.type === "player_died"){
                playerDied(data.playerName);
            }
            if(data.type === "begin_meeting"){
                beginMeeting(data);
            }
            if(data.type === "begin_voting"){
                beginVoting();
            }
            if(data.type === "vote_player"){
                votePlayer(data);
            }
            if(data.type === "end_meeting"){
                endMeeting();
            }
            if(data.type === "get_role"){
                sendRole(ws, thisPlayer);
            }
            if(data.type === "update_completed_tasks"){
                updateCompletedTasks(data);
            }
            if(data.type === "trigger_sabotage"){
                startSabotage(data, thisPlayer);
            }
            if(data.type === "fix_sabotage"){
                removeSabotage();
            }
            if(data.type === "change_two_player_fix_sabotage_check"){
                twoPlayerFixSabotageInput(data.isChecked);
            }
            if(data.type === "silence_trigger"){
                silenceTrigger(data.target);
            }
            if(data.type === "generic_alert"){
                genericAlert(data);
            }
            if(data.type === "request_settings"){
                giveSettings(ws);
            }
            if(data.type === "resync_client"){
                resyncClient(ws)
            }
            
        } catch(error) {
            console.error("An error was caught while processing the message: ", error);
        }
    })

    ws.on('close', () => {    
            console.log(colors.orange+`${thisPlayerName} has disconnected.`+colors.reset);
            if(thisPlayer)
                thisPlayer.isConnected = false;
        
        sendOutPlayerInfo();
    })
    
})

//-------- players ----------------

function removePlayer(playerName) {
    const index = players.findIndex((p) => p.playerName === playerName);
    if (index !== -1) {
      players.splice(index, 1);
      console.log(`${playerName} has been removed.`);
    } else {
      console.log(`Player ${playerName} not found.`);
    }
}

function playerDied(playerName, updatePlayerList = true){
    let player = players.find( (p) => p.playerName === playerName);
    
    if(!player){
        console.error(colors.red+"tried to kill a player but they couldn't be found"+colors.reset);
    } else if(player.isAlive === false) {
        console.error(colors.red+"tried to kill " + playerName +", but they were already dead"+colors.reset);
    } else {
        player.isAlive = false;
        console.log(colors.darkRed+playerName+" has died"+colors.reset);
    }
    
    if(updatePlayerList)
        sendOutPlayerInfo();
}

function sendOutPlayerInfo(){
    let smallPlayers = smallifyPlayers();

    broadcast({
        type: "players_update",
        players: smallPlayers
    });

    if(gameInProgress){
        ifWinnerSendOutWinner();
    }   
}

function smallifyPlayers(){
    //players but only name, connection status, and alive status info
    let smallPlayers = [];
    players.forEach((element) => {
        smallPlayers.push({
            playerName: element.playerName,
            isConnected: element.isConnected,
            isAlive: element.isAlive
        })
    })
    return smallPlayers;
}


//-------- winning ----------------


function ifWinnerSendOutWinner(){
    let winner = getWinner();
        if(winner === "good")
        {
            console.log(colors.green+colors.reverse+"the good team has won! all imposters have been eliminated!"+colors.reset);
            broadcast({
                type: "team_won",
                goodWon: true,
                message: "😇 the good team has won! all imposters have been eliminated!",
                //passes the players bc client's endGame() needs list of players
                players: smallifyPlayers()
            })
            endGame();
        }
        if(winner === "evil")
        {
            console.log(colors.red+colors.reverse+"the evil team has won... there aren't enough good players to go on..."+colors.reset);
            broadcast({
                type: "team_won",
                goodWon: false,
                message: "😈 the evil team has won... there aren't enough good players to go on...",
                //passes the players bc client's endGame() needs list of players
                players: smallifyPlayers()
            })
            endGame();
        }
}

/**
 * @returns the name of the team that won (good/evil), or "none" if no one won
 */
function getWinner(){
    let numEvil = 0;
    let numNeutral = 0;
    let numGood = 0;

    players.forEach(player => {
        if(player.role !== null && player.isAlive)
        { 
            if(player.role.team === "evil")
                numEvil++;
            if(player.role.team === "neutral")
                numNeutral++;
            if(player.role.team === "good")
                numGood++;
        }
    })

    if(numEvil === 0 && numGood > 0)
        return "good";
    if(numEvil >= numGood && numEvil > 0)
        return "evil";
    return "none";
}


//-------- game state ----------------


function startGame(){
    if(gameInProgress)
        endGame();
    if(players.length < gameSettings.numEvil + gameSettings.numNeutral){
        console.log(colors.red+"tried to start game but there are too few players for the role numbers selected."+colors.reset);
        return;
    }
    console.log(colors.blue+colors.reverse+"starting game!"+colors.reset);
    gameInProgress = true;
    
    setEveryoneToAlive();
    distributeRoles();
    distributeTasks();
    
    broadcast({
        type: "start_game",
        players: players,
        allSettings: {
            tasks: tasks,
            roles: roles,
            sabotages: sabotages,
            gameSettings: gameSettings
        }
    })
}

function endGame(){
    gameInProgress = false;
    meetingInProgress = false;

    removeSabotage();
    
    console.log(colors.blue+colors.reverse+"the game ended"+colors.reset);
    
    setEveryoneToAlive();
    //remove all info like roles and tasks
    players = smallifyPlayers();
    broadcast({
        type: "end_game",
        players: players
    })
}

function beginMeeting(data){
    meetingInProgress = true;
    removeSabotage();

    let reporterName = data.reporterName;
    let message = ""

    if(reporterName === "host")
        message = "someone has pressed the emergency meeting button!";
    else
        message = reporterName+" has reported a dead body!";

    console.log(colors.brightPurple+message+colors.reset);
    broadcast({
        type: "begin_meeting",
        message: message,
        
    });
}

function endMeeting(){
    meetingInProgress = false;
    endVoting();

    console.log(colors.brightPurple+"the meeting has ended"+colors.reset);
    
    broadcast({
        type: "end_meeting",
        players: smallifyPlayers()
    });
    ifWinnerSendOutWinner();
}

function beginVoting(){
    votingInProgress = true;
    votes = {};
    console.log(colors.cyan+"everyone is here, starting voting"+colors.reset);

    players.forEach( player => {
        votes[player.playerName] = 0;
    })
    votes["skipVote"] = 0;

    broadcast({
        type: "begin_voting",
        players: smallifyPlayers()
    });
}

function endVoting(){
    votingInProgress = false;
    let max = 0;
    let maxName = "";
    let isTie = false;

    //finds the player with most votes and also if there was a tie
    for (let key in votes) {
        let val = votes[key];
        if(val > max){
            isTie = false;
            max = val;
            maxName = key;
        } else if (val === max) {
            isTie = true;
        }
    }

    let result;

    if(isTie){
        result = "tieVote"
    } else {
        result = maxName;
    }

    let message;

    if(result === "tieVote")
        message = "there was a tie (no one is eliminated)";
    else if(result === "skipVote")
        message = "the vote was skipped";
    else{
        message = result+" has been eliminated";
        if(gameSettings.confirmEjects){
            const resultPlayer = (players.find( player => player.playerName === result))
            const ejectedRole = resultPlayer?.role.roleName;

            message += "\ntheir role was: " + ejectedRole?.toUpperCase();

            if(resultPlayer.role?.specialProperties?.includes("jester"))
                message += "\n\n🎈🎉🤡 "+result+" wins! 🤡🎉🎈\n(the game will still continue)"
        }
        playerDied(result,false);
    }
        
    console.log(colors.cyan+message+colors.reset);

    broadcast({
        type: "vote_result",
        result: result,
        message: message, 
    });

}


//-------- tasks ----------------


function distributeTasks(){
    let tasksCopy = structuredClone(tasks);

    players.forEach(player => {
        if(player.playerName !== "Marianne")
        {   
            playerTasks = structuredClone(pickElementsFromWeightedArray(tasksCopy, gameSettings.tasksPerPlayer));

            //goes through the task clone and modifies the weights of each task if it was selected
            tasksCopy.forEach( task => {
                playerTasks.forEach( playerTask => {
                    if(playerTask.name === task.name && playerTask.location === task.location){
                        task.weight *= gameSettings.weightMultiplierAfterTaskWasChosen; 
                    }
                })
            });

            evaluateTasksDescription(playerTasks);

            player.tasks = playerTasks;
        }
        
        player.tasksCompleted = 0;
    })
}

function evaluateTasksDescription(inputTasks){

    const helpers = {
        randint: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        shuffle: shuffleArray,
        choose: (array, count = 1) => {
            const shuffled = shuffleArray(array);
            return count === 1 ? shuffled[0] : shuffled.slice(0, count);
        },
        range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
        chance: (probability) => Math.random() < probability,
        toLetter: number => String.fromCharCode(65 + number-1)
    };

    inputTasks.forEach( task => {
        task.desc = task.desc.replace(/(?<!\{)\{\{(.*?)\}\}(?!\})/g, (match, p1) => {
            let resultOfEval = "";
            try{
                const isLikelyBlock = p1.trim().startsWith('{');
                const code = isLikelyBlock ? p1 : `return (${p1})`;
                
                // Create a new function with helpers as arguments
                const func = new Function(...Object.keys(helpers), code);
                // Call the function with helper values
                resultOfEval = func(...Object.values(helpers));
            } catch(error) {
                console.error("An error was caught when evaluating JS in a task. The JS was: "+p1+".\n", error);
                resultOfEval = "ERROR"
            }
            
            return resultOfEval;
        })
    })
}

function checkForTaskWin(){

    if(getRatioOfTasksDone() === 1)
    {
        console.log(colors.green+colors.reverse+"the good team has won! all tasks have been completed!"+colors.reset)
        broadcast({
            type: "team_won",
            goodWon: true,
            message: "😇 the good team has won! all tasks have been completed!",
        })
        endGame();
    }
}

function updateCompletedTasks(data){
    let player = players.find(p => p.playerName === data.playerName);

    console.log(colors.yellow+player.playerName+" has completed "+data.tasksCompleted+(player.role.team === "good" ? "" : " fake")+" tasks"+colors.reset);
    player.tasksCompleted = data.tasksCompleted;
    
    
    if(player.role.team === "good" && !taskbarUpdateTimeout){
        setTaskbarUpdateTimeout();
    }
        
    checkForTaskWin();
}

function setTaskbarUpdateTimeout(){
    taskbarUpdateTimeout = setTimeout( () => {
        broadcast({
            type: "taskbar_update",
            ratio: getRatioOfTasksDone()
        })
        taskbarUpdateTimeout = null;
    }, 30_000)
}

/**
 * 
 * @returns {number} number of tasks completed divided by total number of tasks
 */
function getRatioOfTasksDone(){
    let numGoodPlayers = 0;
    let numTasksDone = 0;

    players.forEach( player => {
        if(player?.role?.team === "good"){
            numGoodPlayers++;
            numTasksDone += player.tasksCompleted;
        }
    });

    const totalTasks = numGoodPlayers * gameSettings.tasksPerPlayer;
    return numTasksDone/totalTasks;
}

//-------- roles ----------------


function sendRole(ws, thisPlayer){
    ws.send(JSON.stringify({
        type: "get_role",
        role: thisPlayer.role
    }))
}

function distributeRoles(){
    let numEvil;
    let numNeutral;
    
    if("advancedRoleNumbers" in gameSettings){
        const roleNums = pickElementsFromWeightedArray(gameSettings.advancedRoleNumbers, 1)[0];
        numEvil = Math.floor(roleNums.numEvil);
        numNeutral = Math.floor(roleNums.numNeutral);      

        //numbers after a decimal is the probability of an extra role
        if(Math.random() < (roleNums.numEvil % 1))
            numEvil++;

        if(Math.random() < (roleNums.numNeutral % 1))
            numNeutral++;

    } else {
        numEvil = gameSettings.numEvil;
        numNeutral = gameSettings.numNeutral;
    }

    players.forEach(player => {
        player.role = null;
    })
    
    let rolesClone = structuredClone(roles);
    let chosenIndices = [];
    let n = 0;
    while(n < numEvil + numNeutral)
    {
        const randPlayerIndex = Math.floor(Math.random() * players.length);
        if(!chosenIndices.includes(randPlayerIndex)){ //if it hasn't chosen this index already
            let teamToAssign;
            if(n < numEvil)
                teamToAssign = "evil";
            else 
                teamToAssign = "neutral";
            
            let chosenRole = pickElementsFromWeightedArray(Object.values(roles[teamToAssign]), 1)[0];

            const playerToAssignRoleTo = players[randPlayerIndex];
            if(playerToAssignRoleTo.playerName === "Marianne"){
                if(teamToAssign === "evil")
                    continue; //cannot be evil
                else
                    playerToAssignRoleTo.role = roles.neutral.executioner;
            } else {
                playerToAssignRoleTo.role = chosenRole;
            }
            
            chosenRole.weight *= gameSettings.weightMultiplierAfterRoleWasChosen;

            chosenIndices.push(randPlayerIndex);
            n++;
        }
    }
    //give all the leftover players good roles
    players.forEach(player => {
        if(player.role == null){
            let keys = Object.keys(roles.good);
            let keyIndex = Math.floor(Math.random()*keys.length);

            player.role = roles.good[keys[keyIndex]];
        }
    })

    players.forEach( player => {
        console.log(player.playerName+": "+player.role.roleName)
    })

}

//-------- settings ----------------


function giveSettings(ws){
    ws.send(JSON.stringify({
        type: "give_settings",
        allSettings: {
            tasks: tasks,
            sabotages: sabotages,
            roles: roles,
            gameSettings: gameSettings
        }
    }))
}


//-------- voting ----------------


function votePlayer(data){
    let targetName = data.targetName;
    let voterName = data.voterName;

    votes[targetName]++;

    console.log(colors.cyan+voterName+" voted for "+targetName+" ("+votes[targetName]+" votes) "+colors.reset);

    if(checkIfEveryoneVoted()){
        endMeeting();
    }
}

function checkIfEveryoneVoted(){
    let numAlivePlayers = 0;
    let numVotes = 0;

    players.forEach( player => {
        if(player.isAlive)
            numAlivePlayers++;
    })

    for (let key in votes){
        numVotes += votes[key];
    }

    return numVotes >= numAlivePlayers;
}


//-------- sabotage ----------------


function startSabotage(data, saboteur){
    console.log(colors.orange+saboteur.playerName+" started a "+data.sabotageName+" sabotage!"+(data.delay > 0?(" (it was delayed by "+ data.delay+" seconds)"):"")+colors.reset)
    
    if(!gameInProgress || meetingInProgress || currentSabotage){
        console.log(colors.red+"the sabotage was canceled because the game state makes the request invalid"+colors.reset);
        return;
    }
    
    let sabotage = sabotages.find(s => s.name === data.sabotageName);
 
    currentSabotage = sabotage;
    if(currentSabotage.timeLeft){
        currentSabotageTimeout = setTimeout(sabotageWin, currentSabotage.timeLeft*1000);
    }

    broadcast({
        type: "start_sabotage",
        sabotage: currentSabotage
    })
}

function sabotageWin(){
    console.log(colors.red+colors.reverse+"the evil team has won... the sabotage reached the end of it's timer..."+colors.reset);
    broadcast({
        type: "team_won",
        goodWon: false,
        message: "😈 the evil team has won... the sabotage reached the end of it's timer...",
        //passes the players bc client's endGame() needs list of players
        players: smallifyPlayers()
    });
    endGame();
}

function removeSabotage(){
    if(currentSabotage){
        console.log(colors.orange+"the sabotage was fixed"+colors.reset);
    }

    currentSabotage = null;
    currentTwoPlayerFixChecks = 0;
    clearTimeout(currentSabotageTimeout);

    broadcast({
        type: "remove_sabotage"
    })
}

function twoPlayerFixSabotageInput(isChecked){
    if(isChecked){
        currentTwoPlayerFixChecks++;
    } else {
        currentTwoPlayerFixChecks--;
    }

    console.log(colors.orange+"the sabotage is "+currentTwoPlayerFixChecks+"/2 of the way fixed"+colors.reset)

    if(currentTwoPlayerFixChecks>=2){
        removeSabotage();
    }
}


//-------- silence ----------------

function silenceTrigger(target){
    console.log(colors.darkRed+target+" has been silenced"+colors.reset)
    sendMessageToPlayer({type: "silence_trigger"}, target)
}

//-------- specific utilities ----------------

function genericAlert(data){
    if(data.toEveryone){
        console.log("sending generic alert to everyone")
        broadcast({
            type: "generic_alert",
            message: data.message
        })
    } else {
        console.log("sending generic alert to player "+data.recipient)
        sendMessageToPlayer({
            type: "generic_alert",
            message: data.message
        }, data.recipient)
    }
}

function sendMessageToPlayer(data, targetPlayerName){
    wss.clients.forEach(client => {
        if(client.playerName === targetPlayerName) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcast(data)
{
    //console.log(`broadcasting: ${JSON.stringify(data)}`)
    wss.clients.forEach(client => {
        if(client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function resyncClient(ws){
    ws.send(JSON.stringify({
        type: "resync_client",
        players: players,
        gameInProgress: gameInProgress,
        meetingInProgress: meetingInProgress,
        votingInProgress: votingInProgress,
        currentSabotage, currentSabotage,
        allSettings: {
            tasks: tasks,
            roles: roles,
            sabotages: sabotages,
            gameSettings: gameSettings
        }
    }))
}

function setEveryoneToAlive(){
    players.forEach((player) => {
        player.isAlive = true;
    })
}

//-------- generic utilities ----------------


function shuffleArray(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // random index
        [result[i], result[j]] = [result[j], result[i]]; // swap elements
    }
    return result;
}

/**
 * sometimes creates an infinite/extremely long loop if some weights are very low and the ratio of numsSelections and is high
 */
function pickElementsFromWeightedArray(items, numSelections) {
    // Create an array of cumulative weights
    let cumulativeWeights = [];
    let totalWeight = 0;

    items.forEach( task => {
        if(!("weight" in task)){
            task.weight = 1; //if the weight wasn't defined, defaults to 1
        }
    })

    items.forEach(item => {
        totalWeight += item.weight;
        cumulativeWeights.push(totalWeight);
    });

    function pickOne() {
        let rand = Math.random() * totalWeight;
       
        for (let i = 0; i < items.length; i++) {
            if (rand < cumulativeWeights[i]) {
                return items[i];
            }
        }
    }

    let selected = new Set(); // Ensures unique picks

    while (selected.size < numSelections) {
        let element = pickOne();
        selected.add(element);
    }

    return Array.from(selected);
}

/**
 * for every task that has an array of locations, remove that task and add a new task for each of those locations
 * @param {Array} tasks the array of tasks to mutate
 */
function multipleLocationsToIndividualTasks(tasks){
    for(let i = tasks.length-1; i >= 0; i--){
        let task = tasks[i];
        let locations = task.location;
        if(Array.isArray(locations)){
            locations.forEach( (location) => {
                let newTask = {
                    name: task.name,
                    location: location,
                    desc: task.desc
                }
                if('weight' in task)
                    newTask.weight = task.weight;

                tasks.push(newTask)
            })
            tasks.splice(i,1);
        }
    }
}

function addRedundantInformationToRoles(roles){
    for(let team in roles){
        for(let role in roles[team]){
            roles[team][role]['team']= team;
            roles[team][role]['roleName']= role;
        }
    }
}

/**
 * changes any occurances of "->" to be "🡒"
 * @param {array} tasks the task array to mutate
 */
function unicodeArrowConverter(tasks){
    tasks.forEach((task) => {
        task.location = task.location.replace(/\->/, "🡒");
    })
}

//-------- console commands ----------------;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
    const command = input.trim().toLowerCase();

    if(command === 'update')
    {
        console.log("updating settings...")
        setAllGameSettingsVariables(getAllGameSettingsFromFile());
    }
    else if(command === 'roles')
        console.log(JSON.stringify(roles,null,2))
        
    else
        console.log(`unknown command: ${command}`)
})

//console.log(JSON.stringify(getAllGameSettingsFromFile()))
server.listen(port);