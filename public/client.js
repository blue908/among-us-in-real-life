let socket;

let players = [];
let thisPlayerName = "";
let thisPlayer;

let triesToReconnect = true;
let gameUIButtonsAreSetUp = false;

let gameInProgress = false;
let meetingInProgress = false;
let votingInProgress = false;

let hostInButtonView = false;
let buttonOnCooldown = false;

let selectedSabotageDelay = 0;
let currentBeginSabotageTimeout;

let startingSabotageCooldown = 35;
let currentSabotageCooldown = 0;
let currentSabotageCooldownInterval = 0;

let selectedSilenceTarget = "";
let executionerTarget = "";

let currentSabotage;
let currentSabotageCountdownInterval;

let allSettings = {};

let connectionStatusText = document.getElementById("connectionStatusText");

document.getElementById('joinGame').addEventListener('click', () => {
    joinGame();
});

function joinGame(){
    let enteredName = document.getElementById('nameInputBox').value;

    if(!enteredName){
        alert("😠 actually enter something");
        return;
    }
    if(enteredName.length > 20){
        alert("🙄 sorry, that's too long. the max is 20 characters...");
        return;
    }
    if(!/^[a-zA-Z ]+$/.test(enteredName)){
        alert("🤦 you can only use letters when making your name...");
        return;
    }

    thisPlayerName = enteredName;

    document.getElementById('nameInput').style.display = 'none';
    document.getElementById('players').style.display = 'block';

    if(thisPlayerName !== "host")
        setUpLeaveGameButton();

    if(thisPlayerName === "host")
        setUpHostControls();

    setupWebSocket(false);
}

function setupWebSocket(isReconnecting){
    socket = new WebSocket('ws://' + location.host);
    socket.onopen = () => {
        connectionStatusText.innerText = "😁 connected";

        socket.send(JSON.stringify({
            type: "join",
            playerName: thisPlayerName,
            isReconnecting : isReconnecting
        }));

        //if the user is recconecting, they may have missed some messages
        //so this resyncs them
        /*
        socket.send(JSON.stringify({
            type: "resync_client"
        }))
            */
    }

    socket.onmessage = (event) => {
        try{
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            if(data.type === "players_update"){
                playersUpdate(data.players);
            }
            if(data.type === "start_game"){
                startGame(data);
            }
            if(data.type === "end_game"){
                endGame(data);
            }
            if(data.type === "team_won"){
                teamWon(data);
            }
            if(data.type === "begin_meeting"){
                beginMeeting(data);
            }
            if(data.type === "begin_voting"){
                beginVoting(data.players);
            }
            if(data.type === "vote_result"){
                endVoting(data);
            }
            if(data.type === "end_meeting"){
                endMeeting(data);
            }
            if(data.type === "start_sabotage"){
                startSabotage(data.sabotage);
            }
            if(data.type === "remove_sabotage"){
                removeSabotage();
            }
            if(data.type === "silence_trigger"){
                alert("⚠️⚠️ YOU HAVE BEEN SILENCED SHHHHHHHH ⚠️⚠️");
                alert("🤫🤫 you are not allowed to speak or communicate in any way during this upcoming meeting! you have to stay quiet! 🤐🤐");
            }
            if(data.type === "generic_alert"){
                alert(data.message);
            }
            if(data.type === "taskbar_update"){
                console.log("ok i got the message")
                updateTaskbar(data.ratio);
            }
            if(data.type === "resync_client"){
                resyncClient(data);
            }
            if(data.type === "give_settings"){
                getSettings(data.allSettings);
            }
        } catch(error) {
            console.error("An error was caught while processing the message: ", error);
        }
        
    }

    socket.onclose = () => {
        if(triesToReconnect){
            connectionStatusText.innerText = "😭 diconnected, trying to reconnect";
            console.log("WebSocket disconnected. Trying to reconnect.");

            //if the have connected before, wait one second and reconnect them
            //idk if the if(playerName) is neccesary
            if(thisPlayerName){
                setTimeout(() => {
                    setupWebSocket(true);
                }, 1000);   
            }
        } else {
            connectionStatusText.innerText = "🤷 diconnected, i'm not going to try to reconnect tho";
            console.log("WebSocket disconnected. NOT trying to reconnect.");
        }
    }

    socket.onerror = () => {
        console.log("There was an error with the WebSocket");
    }
}


//-------- game state updates -----------------


/**
 * updates the player list ui, the players value, and thisPlayer
 * @param {*} smallUpdate true: just adjusts the connection values and add any new players, 
 * false: just set players to whatever the data says
 */
function playersUpdate(newPlayers, smallUpdate = true, updateDead = false){
    if(smallUpdate){
        let newSmallPlayers = newPlayers;

        //try to the find existing player corresponding to each new player
        //if found, update connection status
        //if not found, add the new player
        newSmallPlayers.forEach( (newSmallPlayer) => {
            let oldBigPlayer = players.find(p => p.playerName === newSmallPlayer.playerName);
            if(oldBigPlayer){
                oldBigPlayer.isConnected = newSmallPlayer.isConnected;
                if(updateDead){
                    oldBigPlayer.isAlive = newSmallPlayer.isAlive;
                }
            } else {
                players.push(newSmallPlayer);
            }
        })

        players.forEach(oldBigPlayer => {
            //if oldBigPlayer isn't found anywhere in newSmallPlayers, remove that player
            if(!newSmallPlayers.find( newSmallPlayer => newSmallPlayer.playerName == oldBigPlayer.playerName)){
                let indexToRemove = players.findIndex(player => player.playerName === oldBigPlayer.playerName);
                players.splice(indexToRemove, 1);
            }
        })
    } else {
        players = newPlayers;
    }

    thisPlayer = players.find( element => element.playerName === thisPlayerName);

    let playerList = document.getElementById("playerList");
    playerList.innerHTML = "";
    players.forEach(element => {
        let newChild = document.createElement("li");
        newChild.textContent = element.playerName;

        if(!element.isConnected){
            newChild.style.color = "rgb(116, 116, 116)";
            newChild.style.textDecoration = "line-through";
        } 
        if(!element.isAlive){
            newChild.style.color = "#594559";
        }
            
        playerList.appendChild(newChild);
    });

    if(thisPlayer?.role?.specialProperties?.includes("executioner"))
        executionerPlayersUpdateHandler();
}

function startGame(data){
    gameInProgress = true;

    executionerTarget = "";
    selectedSilenceTarget = "";

    playersUpdate(data.players, false);
    updateTaskbar(0, false);
    getSettings(data.allSettings);

    if(thisPlayerName !== "host")
    {
        showRoleMenu(true);
        filltaskContainer();
        setUpGameUIButtons();
    } else {
        changeEmergencyMeetingButtonState();
    }
}

function endGame(data){
    if(meetingInProgress)
        endMeeting();
    gameInProgress = false;

    //data.players is actually a small player array
    //but this still replaces the whole array, removing unnececary information
    //like everyone's tasks and roles
    if(data)
        playersUpdate(data.players, false, true)
    else
        playersUpdate(smallifyPlayers(), false, true)
    if(thisPlayerName !== "host")
        document.getElementById("gameUI").style.display = "none"
    else
        changeEmergencyMeetingButtonState();
}

function beginMeeting(data){
    meetingInProgress = true;
    
    if(thisPlayerName !== "host"){
        document.getElementById("meeting").style.display = "block";
        document.getElementById("tasks").style.display = "none";
        //document.getElementById("interactionButtons").style.display = "none";
        document.getElementById("reportBodyButton").style.display = "none";

        document.getElementById("meetingText").textContent = data.message;

        if(thisPlayer.role.specialProperties?.includes("silencer")){
            if(selectedSilenceTarget !== ""){
                socket.send(JSON.stringify({
                    type: "silence_trigger",
                    target: selectedSilenceTarget
                }))
                selectedSilenceTarget = "";
            }   
        }
    } else {
        changeEmergencyMeetingButtonState();
    }
    
}

function beginVoting(newPlayers){
    votingInProgress = true;
    document.getElementById("iDiedButton").style.display = 'none';

    let votingList = document.getElementById("votingList");
    let votingPanel = document.getElementById("votingPanel");
    votingList.innerHTML = "";
    votingPanel.style.display ="block";

    //mostly for updating dead
    playersUpdate(newPlayers, true, true);

    players.forEach(player => {
        let clone = document.getElementById("votingCandidateTemplate").content.cloneNode(true);
        let votingCandidate = clone.querySelector(".votingCandidate");
        let candidateName = clone.querySelector(".candidateName");
        let voteButton = clone.querySelector(".voteButton");
        
        candidateName.textContent = player.playerName;

        if(!player.isAlive){
            candidateName.style.color = "#594559";
            votingCandidate.style.backgroundColor = "#302530";
            voteButton.style.display = "none";
            votingList.appendChild(clone);
        } else {
            if(thisPlayer.isAlive)
                voteButton.addEventListener('click', () => onVoteButtonClick(player.playerName))
            else
                voteButton.style.display = "none";
                votingList.prepend(clone);
        }

        if(thisPlayer.isAlive)
            document.getElementById("skipButton").style.display = "block";
        //the skip vote button gets its eventListener in setUpGameUIButtons()
    })
}

function endVoting(data){
    votingInProgress = false;

    //if the vote resulted in the executioner's target getting voted
    if(data.result === executionerTarget){
        socket.send(JSON.stringify({
            type: "generic_alert",
            toEveryone: true,
            message: "⚖️💀"+thisPlayer.playerName+" wins! 💀⚖️\nthey were the "+thisPlayer.role.roleName.toUpperCase()+" and "+data.result+" was their target! the game will still continue without either of them."
        }));
        //when their target gets voted, the executioner dies
        socket.send(JSON.stringify({
            type: "player_died",
            playerName: thisPlayerName
        }));
    }
        
    alert(data.message);
}

function onVoteButtonClick(playerName){
    if(!confirm("vote for "+playerName+"?"))
        return;

    Array.from(document.querySelectorAll(".voteButton")).forEach( button => {
        button.remove();
    })

    document.getElementById("skipButton").style.display = "none";

    socket.send(JSON.stringify({
        type: "vote_player",
        voterName: thisPlayerName,
        targetName: playerName,
    }));
}

function endMeeting(data){
    meetingInProgress = false;

    //mostly for updating dead
    if(data)
        playersUpdate(data.players, true, true);

    if(thisPlayerName !== "host"){
        document.getElementById("meeting").style.display = "none";
        document.getElementById("votingPanel").style.display = "none";

        document.getElementById("tasks").style.display = "block";
        document.getElementById("interactionButtons").style.display = "block";
        
        if(thisPlayer.isAlive){
            document.getElementById("iDiedButton").style.display = "inline-block";
            document.getElementById("reportBodyButton").style.display = "inline-block";
        }
        
        
    } else {
        startButtonCooldown();
    }
}

function teamWon(data){
    if(data.goodWon){
        alert(data.message)
    } else {
        alert(data.message)
    }
}


//--------- tasks ------------------


function filltaskContainer(){
    let tasks = thisPlayer.tasks;

    taskContainer.innerHTML = "";
    tasks.forEach( (task) => {
        addTasktoTaskContainer(task);
    })
}

function addTasktoTaskContainer(task, isSabotageTask = false){
    let taskContainer = document.getElementById("taskContainer");
    let taskTemplate = document.getElementById("taskTemplate")

    let clone = taskTemplate.content.cloneNode(true).querySelector(".task");

    clone.querySelector(".taskTitle").textContent = task.name;
    clone.querySelector(".taskLocationText").textContent = task.location;
    clone.querySelector(".taskDesc").innerHTML = task.desc;

    if(isSabotageTask)
    {
        clone.classList.add("sabotageTask");

        let isUrgent = 'timeLeft' in task;
        if(isUrgent)
            clone.classList.add("urgentSabotageTask");

        clone.querySelector(".taskLocationText").classList.add("sabotageLocationText");
        clone.querySelector(".taskCheckbox").addEventListener("input", fixSabotage);
        taskContainer.prepend(clone);
    }
    else{
        clone.querySelector(".taskCheckbox").addEventListener("input", updateNumTasksCompleted);
        taskContainer.appendChild(clone);
    }
}

function updateNumTasksCompleted(){
    const checkBoxes = document.querySelectorAll(".taskCheckbox");
    const numChecked = Array.from(checkBoxes).filter(cb => cb.checked).length;

    console.log(numChecked+" tasks completed.")
    socket.send(JSON.stringify({
        type: "update_completed_tasks",
        tasksCompleted: numChecked,
        playerName: thisPlayerName
    }))
}

function updateTaskbar(ratio, animate = true){
    const fill = document.getElementById("custom-progress-fill");

    if(animate){
        if (fill && ratio >= 0 && ratio <= 1) {
            fill.style.width = (ratio * 100) + "%";
        }
    } else {
         // temporarily disable transition
        fill.style.transition = "none";
        fill.style.width = (ratio * 100) + "%";

        void fill.offsetWidth; // forces reflow
        fill.style.transition = ""; // restores to CSS-defined value
    }
}

//-------- host -----------------


function setUpHostControls(){
    document.getElementById("hostControls").style.display = 'block';
    document.getElementById("startGameButton").addEventListener('click', () =>{

        let numDisconnectedPlayers = 0;
        if(players.forEach((player) => {
            if(!player.isConnected)
                numDisconnectedPlayers++;
        }))

        if(players.length < 3)
            if(!confirm("there are less than 3 players. start the game anyway?"))
                return;

        if(numDisconnectedPlayers > 0)
            if(!confirm("there are "+numDisconnectedPlayers+" disconnected players. start the game anyway?"))
                return;
        
        socket.send(JSON.stringify({
            type: "start_game"
        }));
    });

    document.getElementById("endGameButton").addEventListener('click', () =>{
        if(!confirm("are you sure you want to end the game?"))
            return;
        socket.send(JSON.stringify({
            type: "end_game"
        }));
    });

    
    document.getElementById("swapHostView").addEventListener('click', ()=> {
        swapHostView();
    })

    document.getElementById("emergencyMeetingButton").addEventListener('click', ()=> {
        socket.send(JSON.stringify({
            type: "begin_meeting",
            reporterName: "host"
        }))
    })

    document.getElementById("endMeetingButton").addEventListener('click', ()=> {
        if(!confirm("are you sure you want to end the meeting?"))
            return;
        socket.send(JSON.stringify({
            type: "end_meeting"
        }));
    });

    document.getElementById("everyoneIsHereButton").addEventListener('click', ()=> {
        document.getElementById("everyoneIsHereButton").style.display = 'none';
        socket.send(JSON.stringify({
            type: "begin_voting"
        }));
    });

    changeEmergencyMeetingButtonState();
    document.addEventListener("keydown", emergencyMeetingOnSpacebar);
}

function swapHostView(){
    let button = document.getElementById("swapHostView");
    let controlPanel = document.getElementById("hostControlPanel");
    let buttonPanel = document.getElementById("hostMeetingPanel");
    let playerList = document.getElementById("players");
    
    if(hostInButtonView){
        hostInButtonView = false;
        button.style.backgroundColor = '#e2b3b3b0';
        button.textContent = "📢";

        controlPanel.style.display = "block";
        playerList.style.display = "block";
        buttonPanel.style.display = "none";

    } else {
        hostInButtonView = true;
        button.style.backgroundColor = '#8e9ce4b0';
        button.textContent = "💻";

        controlPanel.style.display = "none";
        playerList.style.display = "none";
        buttonPanel.style.display = "flex";       
    }
}

/**
 * @param {boolean} disabling whether this should disable or enable the button
 * @param {string} text the text that the button should show if it gets disabled
 */
function changeEmergencyMeetingButtonState(){
    let enableStartMeeting = false;
    let enableEndMeeting = false;
    let startMeetingButton = document.getElementById("emergencyMeetingButton");
    let endMeetingButton = document.getElementById("endMeetingButton");
    let everyoneIsHereButton = document.getElementById("everyoneIsHereButton");

    if(!gameInProgress){
        startMeetingButton.textContent = "the game hasn't started";
    }
    if(currentSabotage){
        startMeetingButton.textContent = "cannot call emergency meeting during sabotage";
    }
    else if(meetingInProgress) {
        startMeetingButton.textContent = "meeting in progress";
        enableEndMeeting = true;
    } else if(buttonOnCooldown) {
        //do nothing, startButtonCooldown is already managing the text
    } else{
        startMeetingButton.textContent = "emergency meeting!"
        enableStartMeeting = true;
    }

    if(enableStartMeeting){
        startMeetingButton.style.backgroundColor = "#007bff";
        startMeetingButton.disabled = false; 
    } else {
        startMeetingButton.style.backgroundColor = "#3f3f3f";
        startMeetingButton.disabled = true; 
    }

    if(enableEndMeeting){
        endMeetingButton.style.opacity = 1;
        endMeetingButton.disabled = false; 

        everyoneIsHereButton.style.opacity = 1;
        everyoneIsHereButton.disabled = false; 
    } else {
        endMeetingButton.style.opacity = 0;
        endMeetingButton.disabled = true; 

        everyoneIsHereButton.style.display = 'block';
        everyoneIsHereButton.style.opacity = 0;
        everyoneIsHereButton.disabled = true; 
    }
}

function startButtonCooldown(){
    buttonOnCooldown = true;
    changeEmergencyMeetingButtonState();
    button = document.getElementById("emergencyMeetingButton");
    timeLeft = 15;

    button.textContent = timeLeft + " seconds remaining";
    const timerInterval = setInterval(() => {
        if (timeLeft <= 1 || meetingInProgress || !gameInProgress) {
            clearInterval(timerInterval);
            buttonOnCooldown = false;
            changeEmergencyMeetingButtonState();
        } else {
            timeLeft--;
            button.textContent = timeLeft + " seconds remaining";
        }
    }, 1000);
}

function emergencyMeetingOnSpacebar(event) {
    if (hostInButtonView && (event.key === " " || event.key === "Spacebar")) { 
        document.getElementById("emergencyMeetingButton").click();
    }
}


//-------- everyones ui -----------------


function setUpGameUIButtons(){
    document.getElementById("gameUI").style.display = "block";
    document.getElementById("aliveInteractionButtons").style.display = "inline-block";
    document.getElementById("reportBodyButton").style.display = "inline-block";
    document.getElementById("iDiedButton").style.display = "inline-block";

    if(!gameUIButtonsAreSetUp){
        document.getElementById("reportBodyButton").addEventListener('click', () => {
            if(!confirm("are you sure you want to report a body and start a meeting?"))
                return;
            socket.send(JSON.stringify({
                type: "begin_meeting",
                reporterName: thisPlayerName
            }));
        });

        document.getElementById("iDiedButton").addEventListener('click', () => {
            if(!confirm("are you sure you want to mark yourself as dead? this cannot be undone."))
                return;
            document.getElementById("aliveInteractionButtons").style.display = 'none';
            socket.send(JSON.stringify({
                type: "player_died",
                playerName: thisPlayerName
            }));
        });

        document.getElementById("roleButton").addEventListener('click', () => {
            showRoleMenu();
        });

        document.getElementById("skipButton").addEventListener('click', () =>{
            onVoteButtonClick("skipVote");
        });

        //if you click on the dark background of any overlay, it hides it
        document.querySelectorAll(".overlayBackground").forEach( (element) => {
            element.addEventListener('click', (event) => {
                //makes sure the click was on the tinted black backround rather than the actual ui
                if (event.target === element) {
                    element.style.display = 'none';
                }
            });
        })

        document.getElementById("openSabotageMenuButton").addEventListener('click', () => {
            document.getElementById("roleOverlay").style.display = 'none'

            updateSabotageStatus();
            document.getElementById("sabotageOverlay").style.display = 'flex';
        })

        document.getElementById("openSilenceMenuButton").addEventListener('click', () => {
            document.getElementById("roleOverlay").style.display = 'none'

            showSilenceMenu();
        })

        let saboMenu = document.getElementById("sabotageOverlay");    

        document.getElementById("cancelSabotageButton").addEventListener('click', () => {
            endSabotageDelayPrematurely();
        });

        Array.from(saboMenu.querySelectorAll(".sabotageDelayButton")).forEach( delayButton => {
            delayButton.addEventListener('click', () => {
                changeSabotageDelay(delayButton.textContent);
            });

        });
        
        gameUIButtonsAreSetUp = true;
    }
}

function showRoleMenu(dontShowActions){
   
    //dont show role actions if dontShowActions is true
    if(dontShowActions)
        document.getElementById("actionsContainer").style.display = "none";
    else{
        document.getElementById("actionsContainer").style.display = "block";

        if(thisPlayer.role.team == "evil"){
            document.getElementById("openSabotageMenuButton").style.display = "inline";
        } else {
            document.getElementById("openSabotageMenuButton").style.display = "none";
        }

        if(thisPlayer.role.specialProperties?.includes("silencer")){
            document.getElementById("openSilenceMenuButton").style.display = "inline";
        } else {
            document.getElementById("openSilenceMenuButton").style.display = "none";
        }
    }

    document.getElementById("roleInfoText").innerHTML = getRoleAlertMessage();
    document.getElementById("roleOverlay").style.display = "flex";
}

function showSilenceMenu(){
    document.getElementById("silenceOverlay").style.display = 'flex';

    
    let silenceList = document.getElementById("silenceList");
    //let votingPanel = document.getElementById("votingPanel");
    silenceList.innerHTML = "";
    //votingPanel.style.display ="block";

    //mostly for updating dead
    //playersUpdate(newPlayers, true, true);

    players.forEach(player => {
        let clone = document.getElementById("votingCandidateTemplate").content.cloneNode(true);
        let votingCandidate = clone.querySelector(".votingCandidate");
        let candidateName = clone.querySelector(".candidateName");
        let voteButton = clone.querySelector(".voteButton");
        
        candidateName.textContent = player.playerName;
        voteButton.textContent = "silence"

        if(!player.isAlive){
            candidateName.style.color = "#594559";
            votingCandidate.style.backgroundColor = "#302530";
            voteButton.style.display = "none";
            silenceList.appendChild(clone);
        } else {
            if(thisPlayer.isAlive){
                //if this is the current target, make sure their button is the right color
                if(player.playerName === selectedSilenceTarget){
                    voteButton.style.backgroundColor = "#1d2933";
                    voteButton.textContent = "silenced";
                }

                voteButton.addEventListener('click', () => {
                    //remove selection if the user clicks a button that was already selected
                    if(player.playerName === selectedSilenceTarget){
                        voteButton.style.backgroundColor = "#007bff";
                        voteButton.textContent = "silence";

                        selectedSilenceTarget = "";
                    } else {
                         //makes the clicked button gray, and the others back to blue
                        silenceList.querySelectorAll(".voteButton").forEach( (button) => {
                            if(button != voteButton){
                                button.style.backgroundColor = "#007bff";
                                button.textContent = "silence";
                            }
                            else{
                                button.style.backgroundColor = "#1d2933";
                                button.textContent = "silenced";
                            }
                        });
                        selectedSilenceTarget = player.playerName;
                    }                   
                })
            }
            else
                voteButton.style.display = "none";
            silenceList.prepend(clone);
        }

        if(thisPlayer.isAlive)
            document.getElementById("skipButton").style.display = "block";
        //the skip vote button gets its eventListener in setUpGameUIButtons()
    })
}

function setUpLeaveGameButton(){
    const leaveGameButton = document.getElementById("leaveGameButton");
    leaveGameButton.style.display = "block";
    leaveGameButton.addEventListener( "click", () => {
        if(!confirm("are you sure you want to leave the game? this will delete your player, so you wont be able to reconnect to it. you can still join the game again though."))
            return;
        socket.send(JSON.stringify({
            type: "remove_player",
            playerName: thisPlayerName
        }));
        triesToReconnect = false;
        socket.close();
        location.reload();
    })
}

function setAbilityToReportBodies(canReportBodies){
    let reportButton = document.getElementById("reportBodyButton")
    if(canReportBodies){
        reportButton.style.backgroundColor = "#007bff"
        reportButton.style.textDecoration = "none";
        reportButton.disabled = false;
    } else {
        reportButton.style.backgroundColor = "#3f3f3f"
        reportButton.style.textDecoration = "line-through";
        reportButton.disabled = true;
    }
}

//-------- executioner ----------------

function executionerPlayersUpdateHandler(){
    if(executionerTarget){
        let targetPlayer = players.find( player => player.playerName === executionerTarget);

        if(!targetPlayer.isAlive){
            executionerTarget = getNameOfNewExecutionerTarget();
        }
    } else {
        executionerTarget = getNameOfNewExecutionerTarget();
    }
}

function getNameOfNewExecutionerTarget(){
    if(thisPlayer.isAlive){
        let candidates = [];

        players.forEach( player => {
            if(player.isAlive && player.role.team === "good" && player.playerName !== thisPlayer.playerName)
                candidates.push(player.playerName);
        })

        return candidates[Math.floor( Math.random() * candidates.length)]
    } else {
        return ""; //dead executioners cannot have get a new target
    }
    
}

//-------- evil sabotage ------------------


function changeSabotageDelay(num){
    document.getElementById("sabotageDelayText").textContent = "delay: "+num;
    selectedSabotageDelay = num;
}

function beginSabotageDelay(sabotageName, delay){
    document.getElementById("evilSabotageSchedule").textContent = sabotageName+" sabotage delayed by "+selectedSabotageDelay+"s, it should start soon, or you can override it."
    document.getElementById("cancelSabotageButton").style.display = "inline-block";

    clearTimeout(currentBeginSabotageTimeout);
    currentBeginSabotageTimeout = setTimeout(() => {
        triggerSabotage(sabotageName, delay)
    }, selectedSabotageDelay*1000);
}

/**
 * for evil to send the sabotage
 */
function triggerSabotage(sabotageName, delay){    
    document.getElementById("evilSabotageSchedule").textContent = "no sabotage scheduled";
    document.getElementById("cancelSabotageButton").style.display = "none";

    if(!currentSabotage && !meetingInProgress && currentSabotageCooldown === 0 && gameInProgress){
        socket.send(JSON.stringify({
            type: "trigger_sabotage",
            sabotageName: sabotageName,
            delay: delay
        }))
    }

}

function endSabotageDelayPrematurely(){
    document.getElementById("evilSabotageSchedule").textContent = "no sabotage scheduled";
    document.getElementById("cancelSabotageButton").style.display = "none";

    if(currentBeginSabotageTimeout)
        clearTimeout(currentBeginSabotageTimeout); 
}

function startSabotageCooldownTimer(){
    currentSabotageCooldown = startingSabotageCooldown;
    let cooldownText = document.getElementById("sabotageCooldownText")

    currentSabotageCooldownInterval = setInterval(()=>{
        cooldownText.textContent = currentSabotageCooldown;
        currentSabotageCooldown--;

        if(currentSabotageCooldown <= 0){
            cooldownText.textContent = "";
            updateSabotageStatus();
            clearInterval(currentSabotageCooldownInterval);
        }
           
    }, 1000)
}

function updateSabotageStatus(){
    let statusText = document.getElementById("evilSabotageStatus");
    let message;

    if(!gameInProgress)
        message = "the game hasn't started";
    else if(meetingInProgress)
        message = "there is a meeting in progress";
    else if(currentSabotage)
        message = "there is already a sabotage in progress";
    else if(currentSabotageCooldown > 0)
        message = "the sabotage is on cooldown"
    else
        message = "ready"

    statusText.textContent = message;
}


//-------- all players' sabotage -----------------


/**
 * for all players to get the sabotage
 */
function startSabotage(sabotage){
    currentSabotage = sabotage;
    addTasktoTaskContainer(sabotage, true);

    if(thisPlayerName === "host")
        changeEmergencyMeetingButtonState();
    
    if(sabotage.specialProperties)
        handleSabotageSpecialProperties(sabotage.specialProperties);

    if(sabotage.timeLeft){
        sabotageCountdown(sabotage);
    }
}

/**
 * 
 * @param {string[]} properties the list of properties to look at
 * @param {boolean} sabotageBeginning whether the sabotage is begining or ending
 */
function handleSabotageSpecialProperties(properties, sabotageBeginning = true){
    properties.forEach(property => {
        if(property === "no_reporting_bodies"){
            if(sabotageBeginning)
                setAbilityToReportBodies(false);
            else
                setAbilityToReportBodies(true);
        } else if(property === "two_player_fix"){
            if(sabotageBeginning){
                let checkbox = document.querySelector(".sabotageTask").querySelector(".taskCheckbox");
                
                checkbox.removeEventListener('input', fixSabotage);
                checkbox.addEventListener('input', () =>{
                    changeTwoPlayerFixSabotageCheck(checkbox.checked);
                })
            }
        }
    })
}

function sabotageCountdown(sabotage){
    let sabotageElement = document.querySelector(".sabotageTask")
    let titleElement = sabotageElement.querySelector(".taskTitle");

    let name = sabotage.name;
    let timeLeft = sabotage.timeLeft;

    updateTimer();
    currentSabotageCountdownInterval = setInterval(updateTimer, 1000)

    function updateTimer(){
        titleElement.textContent = name + " ("+timeLeft+")";
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(currentSabotageCountdownInterval);
            console.log("Timer stopped.");
        }
    }
}

function fixSabotage(){
    socket.send(JSON.stringify({
        type: "fix_sabotage"
    }));
}

function changeTwoPlayerFixSabotageCheck(isChecked){
    socket.send(JSON.stringify({
        type: "change_two_player_fix_sabotage_check",
        isChecked: isChecked
    }))
}

function removeSabotage(){
    if(currentSabotage){
        if(currentSabotage.specialProperties)
            handleSabotageSpecialProperties(currentSabotage.specialProperties, false);
        
        currentSabotage = null;
        clearInterval(currentSabotageCountdownInterval);
    
        if(thisPlayerName === "host")
            changeEmergencyMeetingButtonState();
    
        let sabotageElement = document.querySelector(".sabotageTask");
       
        if(!sabotageElement)
            console.error("tried to remove sabotage element but it wasn't there")
    
        sabotageElement.remove();
    
        
        if(thisPlayer && thisPlayer.role.team === "evil"){
            startSabotageCooldownTimer();
        }
    } else {
        console.log("removeSabotage was called, but there wasn't a sabotage active. not doing anything...")
    }
    
}

/**
 * updates the imposter's sabotage UI based on allSettings.sabotages
*/
function updateSabotageUi(){
    let sabos = allSettings.sabotages;
    let saboContainer = document.getElementById("sabotageTriggerContainer");

    saboContainer.innerHTML = "";
    sabos.forEach( (sabotage) => {
        let newButton = document.createElement('button');
        newButton.textContent = sabotage.name;

        newButton.addEventListener('click', () => {
            beginSabotageDelay(newButton.textContent, selectedSabotageDelay);

            let sabotageMenu = document.getElementById("sabotageOverlay");
            sabotageMenu.style.display = 'none';
        });

        saboContainer.appendChild(newButton);
    });
}


//-------- settings --------------

function requestSettings(){
    socket.send(JSON.stringify({
        type: "request_settings"
    }))
}

function getSettings(newSettings){
    /*
    allSettings.tasks = newSettings.tasks;
    allSettings.roles = newSettings.roles;
    allSettings.sabotages = newSettings.sabotages;
    allSettings.gameSettings = newSettings.gameSettings;
    */
   allSettings = newSettings;

    updateSabotageUi();
}


//-------- utilities -----------------

function getListOfPlayersOfTeam(targetTeam){
    let namesList = [];
    players.forEach( player => {
        if(player.role.team === targetTeam)
            namesList.push(player.playerName);
    })
    return namesList;
}

function getRoleAlertMessage(){
    let message = "";

    message += thisPlayer.role.roleName.toUpperCase()+" ("+thisPlayer.role.team.toUpperCase()+")<br>"+thisPlayer.role.message;

    if(thisPlayer.role.team === "evil" && getListOfPlayersOfTeam("evil").length > 1)
        message += "<br><br>teammates: "+(getListOfPlayersOfTeam("evil").filter( e => e !== thisPlayerName).join(" "));

    if(thisPlayer.role.specialProperties?.includes("executioner"))
        message += "<br><br>your target is: "+ executionerTarget;

    return message;
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


//-------- misc -----------------


function resyncClient(data){
    //the gameInProgress and meetingInProgress variables are what the client thinks the game status is
    //but data.gameInProgress and data.meetingInProgress are what they ACTUALLY are
    //so the client tries to adjust its state to match what data says

    playersUpdate(data.players, false);
    if(gameInProgress && !data.gameInProgress){
        endGame();
    }else if(!gameInProgress && data.gameInProgress){
        startGame({
            players: data.players,
            allSettings: data.allSettings
        });
    }
    if(meetingInProgress && !data.meetingInProgress){
        endMeeting();
    }
    else if(!meetingInProgress && data.meetingInProgress){
        //information about who started the meeting is unknown, so it just says "someone"
        //i should probably change this
        beginMeeting({
            message: "someone started an emergency meeting!"
        });
    }
    if(currentSabotage && !data.currentSabotage){
        removeSabotage();
    } else if(!currentSabotage && data.currentSabotage){
        startSabotage(data.currentSabotage);
    }
    if(votingInProgress && !data.votingInProgress){
        endVoting("the voting has ended but idk what the result was bc you weren't connected when it ended");
    } else if(!votingInProgress && data.votingInProgress){
        beginVoting(data.players);
    }
}