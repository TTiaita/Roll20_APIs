/*
 * This script is based on the work of Tom Pigeon and Word Mill Publishing with the 'Mythic Game Master Emulator', 2006
 * https://www.drivethrurpg.com/product/20798/Mythic-Game-Master-Emulator
 */

var GMEmulator = GMEmulator || (function(){
    "use strict";
    // State variables
    var ready = false,      // Var to block use until loaded
    errorred = false,       // Var to block use due to un-resolvable errors
    sceneRunning = false,   // Var indicating that a scene is happening 

    control = {
        modes: { 
            passive: 0,     // Emulator is acting as a random table roller, only responding to !scene, !fate, !event, and !chaos.
            auto: 1         // Emulator is actively controlling the flow of scenes.
        },
        states: {
            idle: 0,            // Automatic mode has not been initiated before
            sceneStart: 1,      // A scene has been initiated. Waiting on player to click 'continue'.
            sceneDesc: 2,       // Scene generated and displayed. Waiting on player to provide scene description.
            sceneRunning: 3,    // Players take over the moment-by-moment running of the scene as it progresses. Waiting on players to call !gme_endscene
            sceneEnd: 4,        // The scene has been ended. Waiting on players to provide conclusion description.
            sceneChaos: 5,      // Asks players to determine if chaos shifts up or down. Waiting on player y/n.
            sceneThreads: 6,    // Asks the players to update threads.
            sceneSummary: 7,    // Sumarises the scene that has just ended. Waiting on player input to begin new scene or move to review mode.
        },
        menuStates: {
            none: 0,
            menuLists: 1,   // Displays the list menu. Waiting on player input to begin/resume scene or open specific list.
            listChar: 2,    // Displays contents of the Characters list with add/update/remove buttons. Waiting on player input to start/resume scene or return to menu.
            listThread: 3   // Displays contents of the Threads listwith add/update/remove buttons. Waiting on player  input to start/resume scene or return to menu.
        },
        currentMode: 0,
        currentState: 0,
        currentScene: {}   
    },

    // Registered command list
    commandList = new Map(),

    // Lookup values
    lookup = {
        fateLabels: [],
        fateChances: [],
        eventFocus: [],
        eventAction: [],
        eventSubject: [],
        fateQuery: "",
        symbol: {}
    },

    // Stored data controller
    moduleName = "gmemulator",
    storedChaosKey = "chaos",
    storedListsKey = "lists",
    storedScenesKey = "scenes",
    storedControlKey = "control",
    storedSettingsKey = "config",

    //-------------------//
    // Command functions //
    //-------------------//

    // Page 9
    fateRoll = function(commands) {
        debugLog("fateRoll()");
        var chance = commands[1];
        var fate = generate.fate(chance);
        sendMessage("fate", fate);
    },

    // Page 14-17
    eventRoll = function(commands) {
        debugLog("eventRoll()");
        var ev = generate.randomEvent();
        sendMessage("event", ev);
    },

    // Page 25
    sceneRoll = function(commands) {
        debugLog("sceneRoll()");
        var scene = generate.scene();
        sendMessage("scene", scene);
    },

    // Page 30
    modChaos = function(commands) {
        var symbol = "";
        if (commands.length == 2) {
            var newVal = 5;
            switch (commands[1]) {
                case "+":
                    newVal = Math.min(9, StateHandler.read(moduleName, storedChaosKey) + 1);
                    symbol = lookup.symbol.upMarker;
                    break;
                case "-":
                    newVal = Math.max(1, StateHandler.read(moduleName, storedChaosKey) - 1);
                    symbol = lookup.symbol.downMarker;
                    break;
                case "reset":
                    newVal = 5;
                    break;
                default:
                    sendMessage("error", getDisplayName(), "!chaos only accepts '+', '-', or 'reset' as its argument");
                    return;
            }

            StateHandler.write(moduleName, storedChaosKey, newVal);
        }
        sendChaos(symbol);
    },

    // Restarts the script
    reload = function(commands) {
        debugLog("reload()");
        init.runAll(true);
    },

    // Debug: Deletes all stored data and resets them to default values
    forceDeleteData = function(commands) {
        log("Force delete");
        init.storedDate(true);
        init.runAll(true);
    },

    // Toggles debug mode on and off
    toggleDebug = function(commands) {
        log("Debug before: " + getDebug());
        log("Debug new val: " + !getDebug());
        setDebug(!getDebug());
        log("Debug mode toggled to " + getDebug());
        init.runAll(true);
    },

    // Debug: Sends an error message to demo the Formatter.ErrorBox function
    testError = function(commands) {
        sendMessage("error", "This is a test. <a href='!testerror'>Again</a>");
    },

    // Debug: Sends a scene message to demo the Formatter.SceneInfo function
    testScene = function(commands) {
        var scene = generate.scene();
        sendMessage("scene", scene);
    },

    // Debug: Sends a note to demo the Formatter.NoteBox function
    testNote = function(commands) {
        sendMessage("note", "This is a test");
    },

    // Debug: Sends a fate roll message to demo the Formatter.FateRoll function
    testFate = function(commands) {
        var fate = generate.fate(5);
        sendMessage("fate", fate);
    },

    // Debug: Sends an even message to demo the Formatter.EventInfo function
    testEvent = function(commands) {
        var ev = generate.randomEvent();
        sendMessage("event", ev);
    },

    // Debug: Sends a message containing test API buttons
    testButtons = function(commands) {
        sendChat(getDisplayName(), "Test functions:\n<a href=\"!testerror\">html error</a>\n[Note](!testnote)\n[Event](!testevent)\n[Scene](!testscene)\n[Fate](!testfate)");
    },

    // Debug: Shows current debug status
    testDebug = function(commands) {
        sendChat("API", "Debug = " + getDebug());
    },

    //
    startScene = function(commands) {
        debugLog("startScene()");
        if (sceneRunning && commands.length == 1) {
            sendMessage("error", "A new scene cannot be started while one is running.<br />[End current scene.](!gme_endscene)");
        }
        else {
            if (commands.length == 1) {
                debugLog("startScene() BeginNew");
                var scene = generate.scene();
                currentScene = { data: scene, desc: false, end: false, chaos: false };
                var msg = Formatter.instruction("Beginning new scene...");
                if (scene.interrupt) {
                    msg += Formatter.noteBox("[Click here to continue](!gme_startscene interrupt) INTERRUPT");
                }
                else {
                    //msg += Formatter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                    msg += Formatter.noteBox("[Click here to continue](!gme_startscene normal)" + (currentScene.data.modified ? " ALTERED" : ""));
                }
                sendMessage("custom", msg);
                sceneRunning = true;
            }
            else if (commands.length == 2) {
                switch (commands[1].trim().toLowerCase()) {
                    case "interrupt":
                        debugLog("startScene() Describe (Interrupt)");
                        var msg = Formatter.sceneInfo(currentScene.data);
                        msg += Formatter.noteBox("The scene is interrupted! Use the event below to determine what happens instead.", true);
                        msg += Formatter.eventInfo(currentScene.data.event);
                        msg += Formatter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                        sendChat(getDisplayName(), msg);
                        break;
                    case "normal":
                        debugLog("startScene() Describe(Normal)");
                        var msg = Formatter.sceneInfo(currentScene.data);
                        if (currentScene.data.modified) {
                            msg += Formatter.noteBox("The scene is altered. Think of what is different than expected. Consult [Fate](!&#13;#Fate) if needed.", true);
                        }
                        else {
                            msg += Formatter.noteBox("The scene proceeds as you expected.", true);
                        }
                        msg += Formatter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                        sendChat(getDisplayName(), msg);
                        break;
                }
            }
            else {
                switch (commands[1].toLowerCase()) {
                    case "desc":
                        debugLog("startScene() StartPlay");
                        currentScene.desc = commands[2].replace(lookup.symbol.stringStart, "").replace(lookup.symbol.stringEnd, "");
                        log("desc: " + currentScene.desc);
                        var msg = Formatter.instruction("The scene begins...");
                        msg += Formatter.noteBox(currentScene.desc, true);
                        msg += Formatter.chaosBox(getChaos(), null, true);
                        msg += Formatter.noteBox("Run !gme_endscene or click [here](!gme_endscene) when the scene is over.");
                        log(msg);
                        sendMessage("custom", msg);
                        break;
                }
            }
        }
    },

    //
    endScene = function(commands) {
        if (sceneRunning) {
            if (!currentScene.end && commands.length == 1) {
                log("endScene() Entry");
                var msg = Formatter.instruction("Ending scene...");
                msg += Formatter.noteBox("[Click here to continue](!&#13;#EndSceneDesc)");
                sendMessage("custom", msg);
            }
            else if (commands.length == 2) {

            }
            else if (commands.length == 3) {
                switch (commands[1].toLowerCase()) {
                    case "desc":
                        debugLog("endScene() EndDesc");
                        currentScene.end = commands[2].replace(lookup.symbol.stringStart, "").replace(lookup.symbol.stringEnd, "");
                        log("end: " + currentScene.end);
                        var msg = Formatter.instruction("The scene");
                        msg += Formatter.sceneInfo(currentScene.data);
                        msg += Formatter.noteBox("<i>The setup:</i><br>" + currentScene.desc, true);
                        msg += Formatter.noteBox("<i>The conclusion:</i><br>" + currentScene.end, true);
                        msg += Formatter.choice("Were the PCs in control for most of the scene?", [["Yes", "!gme_endscene chaos -"], ["No", "!gme_endscene chaos +"]]);
                        log(msg);
                        sendMessage("custom", msg);
                        break;
                    case "chaos":
                        Log("endScene() Chaos");
                        currentScene.setChaos( commands[2]);
                        var symbol = "";
                        if (commands[2] === "+") {
                            setChaos( Math.min(9, getChaos() + 1));
                            symbol = lookup.symbol.upMarker;
                        }
                        else {
                            setChaos(Math.max(1, getChaos() - 1));
                            symbol = lookup.symbol.downMarker;
                        }
                        var msg = Formatter.getChaos() + Formatter.chaosBox(getChaos(), symbol, true);
                        msg += Formatter.instruction("Scene over");
                        msg += Formatter.choice("Do you want to review your lists before continuing?", [["Yes", ""], ["No", ""]]);
                        sendMessage("custom", msg);
                        break;
                }
            }
        }
        else {
            sendMessage("error", "No scene is currently running. Use [!gme_startscene] to begin one.");
        }
    },

    //----------------//
    // Roll Functions //
    //----------------//
    generate = (function() {
        // Creates an event
        var randomEvent = function() {
            var ev = {
                rolls: [randomInteger(100), randomInteger(100), randomInteger(100)],
                focusText: "",
                focusRoll: 0,
                actionText: "",
                actionRoll: 0,
                subjectText: "",
                subjectRoll: 0
            };

            for (var i = 0; i < lookup.eventFocus.length; i++) {
                var e = lookup.eventFocus[i];
                if (ev.rolls[0] <= e[0]) {
                    ev.focusText = e[1];
                    ev.focusRoll = ev.rolls[0];
                    break;
                }
            }
            ev.actionText = lookup.eventAction[ev.rolls[1] - 1];
            ev.actionRoll = ev.rolls[1];
            ev.subjectText = lookup.eventSubject[ev.rolls[2] - 1];
            ev.subjectRoll = ev.rolls[2];
            debugLog("ev1: " + ev + " F: " + ev.focusRoll + " " + ev.focusText + " A: " + ev.actionRoll + " " + ev.actionText + " S: " + ev.subjectRoll + " " + ev.subjectText)

            return ev;
        };
    
        // Creates a scene
        var scene = function() {
            var scene = {
                roll: 0,
                outcome: "",
                interrupt: false,
                modified: false,
                chaos: StateHandler.read(moduleName, storedChaosKey),
                event: 0
            }

            scene.roll = randomInteger(10);
            if (scene.roll > scene.getChaos()) {
                scene.outcome = "Scene begins as expected";
            }
            else {
                if (scene.roll % 2 == 0) {
                    scene.outcome = "Scene is modified."
                    scene.modified = true;
                }
                else {
                    scene.outcome = "Scene is interrupted."
                    scene.interrupt = true;
                    scene.event = generate.randomEvent();
                }
            }
            return scene;
        };

        // Creates a fate result
        var fate = function(chance) {
            var fate = {
                roll: randomInteger(100),
                chance: chance,
                chanceText: lookup.fateLabels[chance],
                chaos: StateHandler.read(moduleName, storedChaosKey),
                outcome: "",
                event: null
            }
            var ranges = lookup.fateChances[fate.getChaos() - 1][chance];
            if (fate.roll >= ranges[2]) { fate.outcome = "Extreme No"; }
            else if (fate.roll >= ranges[1]) { fate.outcome = "No" }
            else if (fate.roll > ranges[0]) { fate.outcome = "Yes" }
            else if (fate.roll <= ranges[0]) { fate.outcome = "Extreme Yes" }
            var rollStr = fate.roll.toString();
            if (rollStr.length == 2 && rollStr.substring(0, 1) === rollStr.substring(1, 2)) {
                fate.event = generate.randomEvent();
            }
            return fate;
        };
        return {
            fate: fate,
            randomEvent: randomEvent,
            scene: scene
        };
    }()),
    
    //--------------------------//
    // Initialisation Functions //
    //--------------------------//
    init = (function() {
        // 
        var flags = function() {
            ready = false;
            errorred = false;
        },

        // Initialises the lookup tables
        lookups = function() {
            lookup.fateLabels = ["Impossible", "No way", "Very unlikely", "Unlikely", "50/50", "Somewhat likely", "Likely", "Very likely", "Near sure thing", "A sure thing", "Has to be"];
            lookup.fateChances = [
                [[0, -20, 77], [0, 0, 81], [1, 5, 82], [1, 5, 82], [2, 10, 83], [4, 20, 85], [5, 25, 86], [9, 45, 90], [10, 50, 91], [11, 55, 92], [16, 80, 97]],
                [[0, 0, 81], [1, 5, 82], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [11, 55, 92], [13, 65, 94], [18, 85, 97]],
                [[0, 0, 81], [1, 5, 82], [2, 5, 83], [3, 15, 84], [5, 25, 86], [9, 45, 90], [10, 50, 91], [13, 65, 94], [15, 75, 96], [16, 80, 97], [18, 90, 99]],
                [[1, 8, 82], [2, 10, 83], [3, 15, 84], [4, 20, 85], [7, 35, 88], [10, 50, 91], [11, 55, 92], [15, 75, 96], [16, 80, 97], [16, 85, 97], [19, 95, 100]],
                [[1, 5, 82], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [16, 85, 97], [18, 90, 99], [18, 90, 99], [19, 95, 100]],
                [[2, 10, 86], [5, 25, 86], [9, 45, 90], [10, 50, 91], [13, 65, 94], [16, 80, 97], [16, 85, 97], [18, 90, 99], [19, 95, 100], [19, 95, 100], [20, 100, 101]],
                [[3, 15, 84], [7, 35, 88], [10, 50, 91], [11, 55, 92], [15, 75, 96], [16, 85, 97], [18, 90, 99], [19, 95, 100], [19, 95, 100], [19, 95, 100], [20, 100, 101]],
                [[5, 25, 86], [10, 50, 91], [13, 65, 94], [15, 75, 96], [16, 85, 97], [18, 90, 99], [19, 95, 100], [19, 95, 100], [20, 100, 101], [22, 101, 101], [26, 101, 101]],
                [[10, 50, 91], [15, 75, 96], [16, 85, 97], [18, 90, 99], [19, 95, 100], [19, 95, 100], [20, 100, 101], [21, 101, 101], [23, 101, 101], [25, 101, 101], [26, 101, 101]]
            ];
            lookup.eventFocus = [
                [7, "Remote event"],
                [28, "NPC action"],
                [35, "Introduce a new NPC"],
                [45, "Move toward a thread"],
                [52, "Move away from a thread"],
                [55, "Close a thread"],
                [67, "PC negative"],
                [75, "PC positive"],
                [83, "Ambiguous event"],
                [92, "NPC negative"],
                [100, "NPC positive"]
            ];
            lookup.eventAction = [
                "Attainment", "Starting", "Neglect", "Fight", "Recruit", "Triumph", "Violate", "Oppose", "Malice", "Communicate", "Persecute", "Increase", "Decrease", "Abandon", "Gratify",
                "Inquire", "Antagonise", "Move", "Waste", "Truce", "Release", "Befriend", "Judge", "Desert", "Dominate", "Procrastinate", "Praise", "Separate", "Take", "Break", "Heal",
                "Delay", "Stop", "Lie", "Return", "Immitate", "Struggle", "Inform", "Bestow", "Postpone", "Expose", "Haggle", "Imprison", "Release", "Celebrate", "Develop", "Travel",
                "Block", "Harm", "Debase", "Overindulge", "Adjourn", "Adversity", "Kill", "Disrupt", "Usurp", "Create", "Betray", "Agree", "Abuse", "Oppress", "Inspect", "Ambush", "Spy",
                "Attach", "Carry", "Open", "Carelessness", "Ruin", "Extravagance", "Trick", "Arrive", "Propose", "Divide", "Refuse", "Mistrust", "Deceive", "Cruelty", "Intolerance",
                "Trust", "Excitement", "Activity", "Assist", "Care", "Negligence", "Passion", "Work hard", "Control", "Attract", "Failure", "Pursue", "Vengeance", "Proceedings",
                "Dispute", "Punish", "Guide", "Transform", "Overthrow", "Oppress", "Change"
            ];
            lookup.eventSubject = [
                "Goals", "Dreams", "Environment", "Outside", "Inside", "Reality", "Allies", "Enemies", "Evil", "Good", "Emotions", "Opposition", "War", "Peace", "The innocent", "Love",
                "The spiritual", "The intellectual", "New ideas", "Joy", "Messages", "Energy", "Balance", "Tension", "Friendship", "The physical", "A project", "Pleasures", "Pain",
                "Possessions", "Benefits", "Plans", "Lies", "Expectations", "Legal matters", "Bureaucracy", "Business", "A path", "News", "Exterior factors", "Advice", "A plot",
                "Competition", "Prison", "Illness", "Food", "Attention", "Success", "Failure", "Travel", "Jealousy", "Dispute", "Home", "Investment", "Suffering", "Wishes", "Tactics",
                "Stalemate", "Randomness", "Misfortune", "Death", "Disruption", "Power", "A burden", "Intrigues", "Fears", "Ambush", "Rumor", "Wounds", "Extravagance", "A representative",
                "Adversities", "Opulence", "Liberty", "Military", "The mundane", "Trials", "Masses", "Vehicle", "Art", "Victory", "Dispute", "Riches", "Status quo", "Technology",
                "Hope", "Magic", "Illusions", "Portals", "Danger", "Weapons", "Animals", "Weather", "Elements", "Nature", "The public", "Leadership", "Fame", "Anger", "Information"
            ];
            lookup.fateQuery = "?{How likely?|Impossible, 0|No way, 1|Very unlikely, 2|Unlikely, 3|50/50, 4|Somewhat likely, 5|Likely, 6|Very likely, 7|Near sure thing, 8|A sure thing, 9|Has to be, 10}";
            lookup.symbol = {
                upMarker: "▲",
                downMarker: "▼",
                stringStart: "⌈",
                stringEnd: "⌉"
            };
        },

        // Initialises the state global object
        storedDate = function(force) {
            if (!StateHandler.moduleExists(moduleName) || force) {
                // Sets up the expected keys-values
                var defaults = [
                    [storedChaosKey, 5],
                    [storedSettingsKey, { debug: false, displayName: "GM" }],
                    [storedListsKey, { lists: new Map() }],
                    [storedScenesKey, { scenes: [] }]
                ];

                // Creates module the first time
                StateHandler.initModule(moduleName);

                // Defaults values that are missing 
                defaults.forEach((a) => {
                    if (!StateHandler.keyExists(moduleName, a[0]) || force) {
                        StateHandler.write(moduleName, a[0], a[1]);
                    }
                });
            }
        },

        // Initialises the macros used
        macros = function() {
            var gm = findObjs({ _type: 'player' })[0];
            manageMacro("Fate", "!gme_fate " + lookup.fateQuery, gm.id);
            manageMacro("Chaos_Up", "!gme_chaos +", gm.id);
            manageMacro("Chaos_Down", "!gme_chaos -", gm.id);
            manageMacro("Chaos", "!gme_chaos", gm.id);
            manageMacro("Scene", "!gme_scene", gm.id);
            manageMacro("Event", "!gme_event", gm.id);
            manageMacro("Reload", "!gme_reload", gm.id);

            // Used for automatic mode
            manageMacro("AddSceneDesc", "!gme_startscene desc " + lookup.symbol.stringStart + "?{Add a description of the scene}" + lookup.symbol.stringEnd, gm.id);
            manageMacro("EndSceneDesc", "!gme_endscene desc " + lookup.symbol.stringStart + "?{How was the scene concluded?}" + lookup.symbol.stringEnd, gm.id);
        },

        // Registers all commands
        commands = function() {
            // Clear registered commands
            commandList = new Map();

            // Core commands for controlling the emulator
            registerCommand("!gme_chaos", modChaos, 1, 2);
            registerCommand("!gme_fate", fateRoll, 2, 2);
            registerCommand("!gme_event", eventRoll, 1, 1);
            registerCommand("!gme_scene", sceneRoll, 1, 1);
            registerCommand("!gme_reload", reload, 1, 1);

            // Commands for automated use
            registerCommand("!gme_startscene", startScene, 1, 3);
            registerCommand("!gme_endscene", endScene, 1, 3);

            // Commands only used for debugging
            registerCommand("!gme_debug", toggleDebug, 1, 1);
            registerCommand("!gme_isdebug", testDebug, 1, 1);
            registerCommand("!testreset", forceDeleteData, 1, 1);
            if (getDebug()) {
                registerCommand("!testerror", testError, 1, 1);
                registerCommand("!testnote", testNote, 1, 1);
                registerCommand("!testscene", testScene, 1, 2);
                registerCommand("!testevent", testEvent, 1, 1);
                registerCommand("!testfate", testFate, 1, 1);
                registerCommand("!testbuttons", testButtons, 1, 1);
            }

            debugLog(commandList.size + " known Commands:")
            commandList.forEach((val, key) => {
                debugLog("-> " + key);
            });
        },

        // Registers the chat event handler. Should never be run more than once per instance of the API.
        eventHandlers = function() {
            on('chat:message', handleInput);
        },

        // Runs all initialisation functions
        runAll = function(isReload) {
            sendChat("API", Formatter.noteBox("<i>GM Emulator</i> is initialising."));

            storedDate(false);
            flags();
            lookups();
            macros();
            commands();
            if (!isReload) {
                eventHandlers();
            }

            if (errorred) {
                sendChat("API", Formatter.errorBox("Setup Error", "An unrecoverable error occurred during set up. Please restart the API script."));
            }
            else {
                sendChat("API", Formatter.noteBox("<i>GM Emulator</i> is now ready for use."));
                ready = true;
            }
        };
        
        return {
            runAll: runAll
        };
    }()),
    
    //--------------------------//
    // Global storage accessors //
    //--------------------------//

    // Retrieves name used when the emulator sends chat messages. Readonly.
    getDisplayName = function() {
        return StateHandler.read(moduleName, storedSettingsKey).displayName;
    },

    // Retrieves current debug state. Default is false.
    getDebug = function() {
        return StateHandler.read(moduleName, storedSettingsKey).debug;
    },

    // Sets the debug state.
    setDebug = function(val) {
        var setting = StateHandler.read(moduleName, storedSettingsKey);
        setting.setDebug(!!val);
        StateHandler.write(moduleName, storedSettingsKey, setting);
    },

    // Retrieves the current Chaos level
    getChaos = function() {
        return StateHandler.read(moduleName, storedChaosKey);
    },

    // Sets the current Chaos level
    setChaos = function(val) {
        StateHandler.write(moduleName, storedChaosKey, val);
    },

    //------------------//
    // Helper Functions //
    //------------------//

    // Adds a new macro to the Roll20 game, or updates it to the correct values if it already exists
    manageMacro = function(mName, mAction, gmId) {
        var macro = findObjs({ type: "macro", name: mName });
        if (macro.length == 0) {
            createObj("macro", {
                name: mName,
                action: mAction,
                playerid: gmId,
                visibleto: "all"
            });
            debugLog("Added macro: " + mName);
        }
        else {
            //debugLog("Macro '" + mName + "' found. Action: " + macro[0].action + ". Object: " + macro);
            macro[0].set({
                action: mAction,
                visibleto: "all"
            });
            if (macro.length > 1) {
                for (var i = 1; i < macro.length; i++) {
                    macro[i].remove();
                }
            }
        }
    },

    // Adds a new API command which will be actioned by the script. Players trigger these by typing the command text in the Roll20 chat or using the provided macros.
    //Param:    commandText string
    registerCommand = function(commandText, action, minArgs, maxArgs) {
        var error = null;
        if (!commandText.startsWith("!")) { error = "All command texts must start with a '!'"; }
        else if (typeof action != "function") { error = "The 'Action' parameter must be a function."; }
        else if (typeof minArgs != "number" || parseInt(minArgs) < 1) { error = "The 'MinArgs' parameter must be an integer >= 1."; }
        else if (typeof maxArgs != "number" || parseInt(maxArgs) < 1) { error = "The 'MaxArgs' parameter must be an integer >= 1."; }
        else if (!error && action.length != 1) { error = "The 'action' function must take only one parameter (the string[] commands)." }

        if (error) {
            sendMessage("error", getDisplayName(), "Cannot Initialise command '" + commandText + "'. " + error);
            errorred = true;
            return;
        }

        var command =
        {
            Action: action,
            MinArgs: parseInt(minArgs),
            MaxArgs: parseInt(maxArgs)
        };
        commandList.set(commandText, command);
        debugLog("Command '" + commandText + "' registered.");
    },

    // Prints a message to the log if the debug config is set to true
    debugLog = function(msg) {
        if (getDebug()) { log(msg); }
    },

    // Returns true if the commands array conforms to the min and max arguents permitted
    argCheck = function(cmdArray, min = 1, max = 1) {
        return Array.isArray(cmdArray) && cmdArray.length >= min && cmdArray.length <= max;
    },

    //-------------------//
    // Display functions //
    //-------------------//
    sendMessage = function(msg) {
        sendChat(getDisplayName(), msg);
    },

    css = function(){
        // CSS order: top right bottom left
        style = {},
    
        apply = function() {
            return style;
        },
    
        width = function(val) {
            style["width"] = val;
            return this;
        },
    
        italics = function(val) {
            style["font-style"] = val ? "italics" : "normal";
            return this;
        }, 
    
        underline = function(val) {
            style["text-decoration"] = val ? "underline" : "none";
            return this;
        },
    
        strikethrough = function(val) {
            style["text-decoration"] = val ? "line-through" : "none";
            return this;
        },
    
        bold = function(val) {
            style["font-weight"] = val ? "bold" : "normal";
            return this;
        },
    
        border = function(top, bottom, sides) {
            var bWidth = "2px ";
            style["border-width"] = (top ? bWidth : "0px ") + (sides ?  bWidth : "0px ") + (bottom ?  bWidth : "0px ") + (sides ?  bWidth : "0px ");
            style["border-collapse"] = "collapse";
            style["border-color"] = "black";
            style["border-style"] = "solid";
            return this;
        },
    
        fontColour = function(col) {
            style["color"] = col;
            return this;
        },
    
        backgroundColour = function(col) {
            style["background-color"] = col;
            return this;
        },
    
        alignCentre = function() {
            style["text-align"] = "center";
            return this;
        },
    
        alignLeft = function() {
            style["text-align"] = "left";
            return this;
        },
    
        alignRight = function() {
            style["text-align"] = "right";
            return this;
        },
    
        margin = function(left, right, top, bottom) {
            style["margin"] = top + "px " + right + "px " + bottom + "px " + left + "px";
            return this;
        },
    
        padding = function(left, right, top, bottom) {
            style["padding"] = top + "px " + right + "px " + bottom + "px " + left + "px";
            return this;
        };
    
        return {
            apply: apply,
            width: width,
            italics: italics,
            underline: underline,
            strikethrough: strikethrough,
            bold: bold,
            border: border,
            fontColour: fontColour ,
            backgroundColour:  backgroundColour,
            alignCentre:  alignCentre,
            alignLeft:  alignLeft,
            alignRight: alignRight,
            margin: margin,
            padding: padding
        };
    };

    styles = {
        headScene: css().backgroundColour("#66ccff").apply(),
        headInstruct: css().backgroundColour("#bfbfbf").apply(),
        headFate: css().backgroundColour("#cc66ff").apply(),
        headEvent: css().backgroundColour("#33cc33").apply(),
        headError: css().backgroundColour("red").apply(),
        rowMain: css().border(false, false, true).backgroundColour("white").apply(),
        rowAlt: css().border(false, false, true).backgroundColour("#d9d9d9").apply(),
        rowHead: css().border(true, true, true).bold(true).alignCentre().apply(),
        cellBlue: css().fontColour("blue").apply(),
        cell: css().padding(5, 5, 2, 2).apply(),
        b: css().bold(true).apply(),
        i: css().italics(true).apply()
    },

    /** Sends a Roll20 Chat message warning that an error has occured loading the script. Bypasses HtmlBuilder for safety. */
    sendUnloadedError = function() {
        sendMessage("<table style=\"width: 100%; border-width: 2px 2px 2px 2px ; border-collapse: collapse; border-color: black; border-style: solid; color: black;\"><thead style=\"\"><th style=\"background-color: red;\">Error<tbody style=\"\"><tr style=\"border-width: 0px 2px 0px 2px ; border-collapse: collapse; border-color: black; border-style: solid; background-color: white;\"><td style=\"padding: 2px 5px 2px 5px;\">An unrecoverable error occurred during set up. Please restart the API script.</td></tr></tbody></th></thead></table>");
    },
    
    /** Sends a Roll20 Chat message warning that the script is not finished initialising. Bypasses HtmlBuilder for safetty. */
    sendUnloadedWait = function() {
        sendMessage("<table style=\"width: 100%; border-width: 2px 2px 2px 2px ; border-collapse: collapse; border-color: black; border-style: solid; color: black;\"><tr style=\"border-width: 0px 2px 0px 2px ; border-collapse: collapse; border-color: black; border-style: solid; background-color: white;\"><td style=\"padding: 2px 5px 2px 5px;\">API script <i>Game Master Emulator</i> is still loading. Please wait.</td></tr></table>");
    }
    //----------------//
    // Event Handlers //
    //----------------//
    handleInput = function(msg) {
        if (msg.type == "api") {
            var target = msg.who;
            
            var cmds = msg.content.trim().split(/[ ]+(?![^⌈]*⌉)/g);

            if (commandList.has(cmds[0])) {
                // Block commands unless everything is ready
                if (errorred) {
                    sendUnloadedError();
                    return;
                }
                else if (!ready) {
                    sendUnloadedWait();
                    return;
                }

                var commandObj = commandList.get(cmds[0])
                debugLog("CommandObject:" + cmds[0]);
                if (!argCheck(cmds, commandObj.MinArgs, commandObj.MaxArgs)) {
                    sendMessage("error", "Command '" + cmds[0] + "' requires a minimum of " + commandObj.MinArgs + " arguments and a maximum of " + commandObj.MaxArgs + ".");
                    return;
                }

                commandObj.Action.call(this, cmds)
            }

            // If no matching command is found then it is ignored by this code.
        }
    };
}());



// Initialise on script load
on("ready", function () {
    GMEmulator.init.runAll(false);
});