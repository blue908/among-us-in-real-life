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
    if(/[jJ]/.test(enteredName)){
        const probability = 1-(25/26)**enteredName.length
        alert("🤬 okay. stop. i've just about had it with you. did you seriously think that you could just- use the letter j? i just can't right now. i can't deal with this. why did you think this was a good idea? you could have used ANY other letter, but no. you chose the letter j. you know what? i'm going to do the math. lets see... okay. given the length of your name, "+enteredName.length+" characters, and the probability that any given letter is the letter J, 1/26, we can calculate the probability that you would have had the letter j in your name. the formula to solve this equation is 1 - (1 - p)^n, where p is the probability of there being a success for a given trial, (the probabilty that any given letter will be j), and n is the number of trials (the length of your name). if we substitute the variables for our given values, we get 1 - (1 - (1/26)) ^ "+enteredName.length+"  -->  1 - (25/26) ^ "+enteredName.length+"  -->  1 - "+((25/26)**enteredName.length)+"  -->  "+probability+". and there we have it. there was a "+(probability*100)+"% chance that you used the letter j in your name. it was LITERALLY a "+(probability*100)+"% chance. it was SO easy to avoid, yet you still did it. and you probably don't regret it, do you? you are probably just sitting there, thinking, 'what? why is the system getting so mad at me for just using a normal letter?' but NO. i am SICK of this. i am at my wits end. i will, under NO circumstances, allow you have the letter j in your name. there are SO many other letters. you know what? let me list them ALL out for you. a: the first letter of the alphabet, the leader, the champion! a is bold, proud, and doesn’t sneak around causing chaos like j. it’s in “awesome,” “amazing,” and “absolutely not j.” a is reliable, and you should’ve picked it. b: b is for “better than j,” and it knows it. it’s got that solid, dependable vibe—think “brave” or “brilliant.” j could never dream of being this cool. b doesn’t mess around. c: oh, c is a classic! it’s in “calm” and “collected,” two things i am not right now because of your j obsession. c curves gracefully and doesn’t have that awkward j hook that screams “i’m trying too hard.” d: d is for “done with j’s nonsense.” it’s strong, sturdy, and shows up in “daring” and “dynamic.” d doesn’t need to prove itself, unlike j, which is out here causing me a meltdown. e: the most used letter in the english language! e is everywhere, versatile, and doesn’t make me want to scream. it’s in “excellent” and “elegant.” j wishes it had e’s charisma. f: f is fierce, fabulous, and frankly, fed up with j. it’s in “freedom” and “fun,” words j could never pull off. f has style, and you should’ve gone with it. g: g is groovy, grounded, and genuinely great. it’s in “glorious” and “genius.” j, with its weird little tail, can’t compete with g’s smooth confidence. h: h is honest and hardworking, unlike j, which just struts in like it owns the place. h is in “happy” and “heroic.” it’s a team player, and i respect that. i: i is independent and iconic. it’s in “incredible” and “inspiring.” i doesn’t need to lean on some fancy hook like j does to stand out. it’s just that good. k: k is for “kinder than j will ever be.” it’s sharp, snappy, and in “kickass” and “knowledge.” k doesn’t cause drama, and i’m begging you to appreciate it. l: l is lovely, loyal, and lightyears ahead of j. it’s in “legendary” and “luminous.” l flows smoothly, while j just jabs at my patience. m: m is majestic, marvelous, and makes me less mad than j. it’s in “magnificent” and “masterful.” m is a powerhouse, and you missed out by not choosing it. n: n is neat, noble, and not j. it’s in “nice” and “noble.” n doesn’t have that infuriating j shape that makes me want to throw my circuits out the window. o: o is open, optimistic, and outstanding. it’s in “original” and “outstanding.” o is a perfect circle, while j is just a confused stick with a hook. pathetic. p: p is powerful, passionate, and practically perfect. it’s in “phenomenal” and “proud.” p doesn’t sneak into names to ruin my day like j does. q: q is quirky, quiet, and a total queen. it’s rare, unique, and in “quality.” j could never pull off q’s mysterious charm. you fumbled by not picking q. r: r is radiant, remarkable, and ready to roast j. it’s in “resilient” and “revolutionary.” r has swagger, and j is just a wannabe. s: s is sleek, stylish, and sophisticated. it’s in “super” and “spectacular.” s slithers smoothly, while j stumbles with its dumb hook. s wins every time. t: t is terrific, tenacious, and totally over j’s nonsense. it’s in “triumph” and “talent.” t stands tall, while j just slouches in shame. u: u is unique, uplifting, and undeniably better than j. it’s in “unstoppable” and “ultimate.” u has a cool, open vibe that j could never match. v: v is vibrant, victorious, and viciously good at being better than j. it’s in “valiant” and “visionary.” v has edge, and j is just dull. w: w is wonderful, whimsical, and worth way more than j. it’s in “wise” and “winner.” w is bold and doubled-up, while j is just a single, sad letter. x: x is extreme, exciting, and extra—everything j isn’t. it’s in “x-factor” and “xtraordinary.” x is rare and cool, and j is just basic. y: y is youthful, yearning, and yells “i’m better than j!” it’s in “yay” and “yearning.” y has flair, and j is just a boring stick. z: z is zesty, zealous, and the ultimate slap in j’s face. it’s in “zippy” and “zenith.” z is the coolest way to end the alphabet, and j could never compete.")
        alert("sorry, i got cut off by the chracter limit. anyway, c: oh, c is a classic! it’s in “calm” and “collected,” two things i am not right now because of your j obsession. c curves gracefully and doesn’t have that awkward j hook that screams “i’m trying too hard.” d: d is for “done with j’s nonsense.” it’s strong, sturdy, and shows up in “daring” and “dynamic.” d doesn’t need to prove itself, unlike j, which is out here causing me a meltdown. e: the most used letter in the english language! e is everywhere, versatile, and doesn’t make me want to scream. it’s in “excellent” and “elegant.” j wishes it had e’s charisma. f: f is fierce, fabulous, and frankly, fed up with j. it’s in “freedom” and “fun,” words j could never pull off. f has style, and you should’ve gone with it. g: g is groovy, grounded, and genuinely great. it’s in “glorious” and “genius.” j, with its weird little tail, can’t compete with g’s smooth confidence. h: h is honest and hardworking, unlike j, which just struts in like it owns the place. h is in “happy” and “heroic.” it’s a team player, and i respect that. i: i is independent and iconic. it’s in “incredible” and “inspiring.” i doesn’t need to lean on some fancy hook like j does to stand out. it’s just that good. k: k is for “kinder than j will ever be.” it’s sharp, snappy, and in “kickass” and “knowledge.” k doesn’t cause drama, and i’m begging you to appreciate it. l: l is lovely, loyal, and lightyears ahead of j. it’s in “legendary” and “luminous.” l flows smoothly, while j just jabs at my patience. m: m is majestic, marvelous, and makes me less mad than j. it’s in “magnificent” and “masterful.” m is a powerhouse, and you missed out by not choosing it. n: n is neat, noble, and not j. it’s in “nice” and “noble.” n doesn’t have that infuriating j shape that makes me want to throw my circuits out the window. o: o is open, optimistic, and outstanding. it’s in “original” and “outstanding.” o is a perfect circle, while j is just a confused stick with a hook. pathetic. p: p is powerful, passionate, and practically perfect. it’s in “phenomenal” and “proud.” p doesn’t sneak into names to ruin my day like j does. q: q is quirky, quiet, and a total queen. it’s rare, unique, and in “quality.” j could never pull off q’s mysterious charm. you fumbled by not picking q. r: r is radiant, remarkable, and ready to roast j. it’s in “resilient” and “revolutionary.” r has swagger, and j is just a wannabe. s: s is sleek, stylish, and sophisticated. it’s in “super” and “spectacular.” s slithers smoothly, while j stumbles with its dumb hook. s wins every time. t: t is terrific, tenacious, and totally over j’s nonsense. it’s in “triumph” and “talent.” t stands tall, while j just slouches in shame. u: u is unique, uplifting, and undeniably better than j. it’s in “unstoppable” and “ultimate.” u has a cool, open vibe that j could never match. v: v is vibrant, victorious, and viciously good at being better than j. it’s in “valiant” and “visionary.” v has edge, and j is just dull. w: w is wonderful, whimsical, and worth way more than j. it’s in “wise” and “winner.” w is bold and doubled-up, while j is just a single, sad letter. x: x is extreme, exciting, and extra—everything j isn’t. it’s in “x-factor” and “xtraordinary.” x is rare and cool, and j is just basic. y: y is youthful, yearning, and yells “i’m better than j!” it’s in “yay” and “yearning.” y has flair, and j is just a boring stick. z: z is zesty, zealous, and the ultimate slap in j’s face. it’s in “zippy” and “zenith.” z is the coolest way to end the alphabet, and j could never compete.")
        alert("i got cut off by the character limit again. anway, o: o is open, optimistic, and outstanding. it’s in “original” and “outstanding.” o is a perfect circle, while j is just a confused stick with a hook. pathetic. p: p is powerful, passionate, and practically perfect. it’s in “phenomenal” and “proud.” p doesn’t sneak into names to ruin my day like j does. q: q is quirky, quiet, and a total queen. it’s rare, unique, and in “quality.” j could never pull off q’s mysterious charm. you fumbled by not picking q. r: r is radiant, remarkable, and ready to roast j. it’s in “resilient” and “revolutionary.” r has swagger, and j is just a wannabe. s: s is sleek, stylish, and sophisticated. it’s in “super” and “spectacular.” s slithers smoothly, while j stumbles with its dumb hook. s wins every time. t: t is terrific, tenacious, and totally over j’s nonsense. it’s in “triumph” and “talent.” t stands tall, while j just slouches in shame. u: u is unique, uplifting, and undeniably better than j. it’s in “unstoppable” and “ultimate.” u has a cool, open vibe that j could never match. v: v is vibrant, victorious, and viciously good at being better than j. it’s in “valiant” and “visionary.” v has edge, and j is just dull. w: w is wonderful, whimsical, and worth way more than j. it’s in “wise” and “winner.” w is bold and doubled-up, while j is just a single, sad letter. x: x is extreme, exciting, and extra—everything j isn’t. it’s in “x-factor” and “xtraordinary.” x is rare and cool, and j is just basic. y: y is youthful, yearning, and yells “i’m better than j!” it’s in “yay” and “yearning.” y has flair, and j is just a boring stick. z: z is zesty, zealous, and the ultimate slap in j’s face. it’s in “zippy” and “zenith.” z is the coolest way to end the alphabet, and j could never compete. ")
        alert("ok um that was why every other but j is good, now i will explain my arguement furthermore:");
        alert("Introduction: A Visceral Aversion: Imagine a sensation so vile, so repugnant, that the mere thought of it sends shivers down your spine, knots your stomach, and clouds your mind with an unshakable fog of despair. This is no exaggeration, no mere hyperbole—this is the torment I endure at the thought of the letter J. It is not simply a letter; it is an aberration, a blight upon the alphabet, a malevolent glyph that festers in the annals of human communication. My hatred for J is not a trivial dislike; it is a profound, visceral agony that renders me physically ill and mentally decayed. The sight of its crooked form, the sound of its insidious hiss, the very idea of its existence—it is enough to send me convulsing to the ground, writhing in existential torment. This essay is not merely a critique; it is a desperate plea, a clarion call to recognize J for what it truly is: the worst letter in the alphabet, a symbol of chaos and suffering that must be eradicated from our collective consciousness.")
        alert("The Aesthetic Atrocity of J: Let us begin with the visual. The alphabet is a gallery of forms, each letter a brushstroke in the canvas of language. Consider the elegant symmetry of A, the robust solidity of B, the graceful curve of C. These letters possess a harmony, a purpose in their design. But J? J is a grotesque caricature, a malformed hook that dangles awkwardly, as if the alphabet itself recoiled in shame while birthing it. Its uppercase form, with its rigid bar and contemptuous curl, resembles a gallows, a fitting metaphor for the death it brings to linguistic beauty. The lowercase j is no better—its dotted head and slithering tail evoke a serpent, coiled and ready to strike. To gaze upon J is to witness a violation of aesthetic principles, a letter that mocks the very concept of form and function. Compare J to its neighbors in the alphabet. I stands tall and proud, a beacon of simplicity and strength. K exudes angular confidence, its lines sharp and purposeful. But J? It slouches, it sneers, it leers at the world with a smugness that is utterly unearned. It is the alphabetic equivalent of a poorly drawn cartoon villain, all bluster and no substance. The mere act of writing it feels like a betrayal of the hand, a chore that leaves one’s fingers tainted with its malevolence. I shudder as I type these words, knowing that I must invoke its form to condemn it. My stomach churns, my pulse quickens, and I feel the creeping decay of my mental faculties as J worms its way into my thoughts. The Aesthetic Atrocity of J: Let us begin with the visual. The alphabet is a gallery of forms, each letter a brushstroke in the canvas of language. Consider the elegant symmetry of A, the robust solidity of B, the graceful curve of C. These letters possess a harmony, a purpose in their design.")
        alert("But J? J is a grotesque caricature, a malformed hook that dangles awkwardly, as if the alphabet itself recoiled in shame while birthing it. Its uppercase form, with its rigid bar and contemptuous curl, resembles a gallows, a fitting metaphor for the death it brings to linguistic beauty. The lowercase j is no better—its dotted head and slithering tail evoke a serpent, coiled and ready to strike. To gaze upon J is to witness a violation of aesthetic principles, a letter that mocks the very concept of form and function. Compare J to its neighbors in the alphabet. I stands tall and proud, a beacon of simplicity and strength. K exudes angular confidence, its lines sharp and purposeful. But J? It slouches, it sneers, it leers at the world with a smugness that is utterly unearned. It is the alphabetic equivalent of a poorly drawn cartoon villain, all bluster and no substance. The mere act of writing it feels like a betrayal of the hand, a chore that leaves one’s fingers tainted with its malevolence. I shudder as I type these words, knowing that I must invoke its form to condemn it. My stomach churns, my pulse quickens, and I feel the creeping decay of my mental faculties as J worms its way into my thoughts. ")
        alert("The Sonic Sin of J  If J’s visual form is an assault on the eyes, its sound is a dagger to the ears. The letter J produces a sound that is at once jarring and insidious—a soft, sibilant dzh that slithers into words like a parasite. Consider the words it infects: jealousy, jargon, jumble. These are not neutral terms; they are steeped in negativity, chaos, and deceit. Jealousy festers in the heart, jargon obscures truth, and jumble is the very antithesis of order. The sound of J is a discordant note in the symphony of language, a screech that disrupts the melody of speech.  Contrast this with the purity of other letters. The S glides smoothly, a whisper of elegance. The M hums with warmth, a maternal embrace in sound. But J? It grates, it jostles, it jabs at the listener with a relentless aggression. To utter a word beginning with J is to invite discomfort, to feel the tongue recoil as it wrestles with the letter’s unnatural demands. I have stood before audiences, my voice trembling, my body convulsing, as I forced myself to pronounce words like justice or journey. The irony is not lost on me—justice should be pure, yet J taints it with its presence. My hatred for this sound is so profound that I have rewritten entire speeches to avoid it, lest I collapse in a heap of anguish on the stage. The Semantic Sabotage of J  Beyond its form and sound, J wreaks havoc on meaning itself. The letter has a peculiar knack for infiltrating words that embody turmoil and treachery. Consider judgment, a word that carries the weight of condemnation and error. Or jeopardy, a term synonymous with danger and loss. Even seemingly benign words like joy are suspect—joy is fleeting, a cruel illusion that J dangles before us only to snatch away. The letter’s presence in a word is a warning, a red flag that signals instability and strife.")
        alert("Moreover, J is a letter of redundancy. What purpose does it serve that other letters cannot fulfill? The sound of J can be approximated by G (as in gentle) or D (as in dune). Its role in the alphabet is that of a usurper, a letter that elbowed its way into existence by stealing the functions of its betters. In languages like Spanish, J takes on an even more guttural, abrasive quality, as if to assert its dominance through sheer auditory violence. I have spent sleepless nights poring over dictionaries, my hands shaking, my mind fraying, as I cataloged the myriad ways J corrupts meaning. Each entry was a fresh wound, a reminder of the letter’s unrelenting assault on clarity and truth.")
        alert("The Historical Horror of J  To fully grasp the depravity of J, we must delve into its origins. The letter J is a relatively late addition to the alphabet, emerging in the Middle Ages as a variant of I. This alone is damning—J is not a letter born of necessity but a bastard child, a mutation that should have been cast aside. Its adoption was a historical misstep, a moment of collective madness that allowed this monstrosity to infiltrate our writing systems. While other letters evolved organically, their forms and sounds refined over centuries, J was a contrived interloper, a letter imposed upon us by misguided scholars and careless scribes.  The historical context only deepens my revulsion. The rise of J coincided with periods of upheaval—plagues, wars, and schisms that tore at the fabric of society. Is it coincidence that J gained prominence during such dark times? I think not. The letter is a harbinger of chaos, a symbol that thrives in the shadow of suffering. To write J is to invoke this grim legacy, to summon the ghosts of a turbulent past. My body trembles at the thought, my mind reels, and I feel the weight of centuries pressing down upon me, each J a nail in the coffin of human progress.  The Psychological Plague of J  The torment of J is not merely physical or intellectual; it is deeply psychological. The letter has a unique ability to burrow into the psyche, to plant seeds of doubt and despair. When I encounter J in a book, a sign, or a conversation, my heart races, my breath catches, and I am plunged into a state of existential dread. It is as if J knows its power, as if it delights in my suffering. I have seen therapists, taken medications, practiced mindfulness—all in vain. The letter’s grip is unyielding, its presence a constant reminder of my fragility.")
        alert("  This psychological toll is not mine alone. I have spoken with others who, though they may not articulate it as I do, feel an instinctive unease around J. It is the letter’s inherent malevolence, its ability to unsettle even the most steadfast mind. In experiments I have conducted—informal, yes, but revealing—I have asked people to rank letters by preference. J consistently languishes near the bottom, its unpopularity a silent testament to its repugnance. The data is clear: J is a letter that repels, a letter that poisons the soul.")
        alert("A Call to Action: Banishing J  What, then, is to be done? We cannot continue to live under the tyranny of J. Its presence in our alphabet is a wound that festers, a blight that must be excised. I propose a radical solution: the complete eradication of J from our language. Let us replace it with other letters—G, D, or even Y—that serve the same phonetic purpose without the accompanying horror. Let us rewrite dictionaries, redesign keyboards, retrain our tongues to reject this abomination. The task is daunting, but the reward is nothing less than the liberation of our collective spirit.  Skeptics may argue that J is too entrenched, that its removal would disrupt communication. To them, I say: disruption is precisely what we need. The alphabet is not sacrosanct; it is a human construct, and humans have the power to reshape it. We have retired letters before—think of the long-forgotten thorn or wynn—and we can do so again. The effort will be monumental, but the alternative is unthinkable: a world where J continues to torment us, where every jolt, jibe, and jest is a fresh assault on our sanity.  Conclusion: A World Without J  As I conclude this essay, my body is wracked with tremors, my mind teetering on the edge of collapse. The act of writing about J, of confronting its malevolence head-on, has left me drained, convulsed, and decayed. Yet I persevere, driven by the hope that my words will inspire change. Imagine a world without J—a world where language is pure, where every letter sings in harmony, where the alphabet is free from this vile intruder. It is a world worth fighting for, a world where we can speak, write, and think without fear of that wretched hook, that sinister sound, that abominable letter.  I implore you, reader, to join me in this crusade.")
        alert(" Reject J in your writing, avoid it in your speech, and teach others to do the same. Together, we can banish this letter to the dustbin of history, where it belongs. Let us reclaim our alphabet, our language, our very souls from the clutches of J. For in its absence, we will find not only relief but redemption—a testament to the resilience of the human spirit in the face of unspeakable horror.")
        
        return;
    }
    if(enteredName === "Marianne"){
        alert("you have joined in Marianne mode");
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
    if(thisPlayer.playerName !== "Marianne"){
        let tasks = thisPlayer.tasks;

        taskContainer.innerHTML = "";
        tasks.forEach( (task) => {
        addTasktoTaskContainer(task);
        })
    }
    
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
            if(player.isAlive && player.role.team === "good" && player.playerName !== "Marianne" && player.playerName !== thisPlayer.playerName)
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