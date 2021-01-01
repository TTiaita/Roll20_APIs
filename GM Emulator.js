/*
 * This script is based on the work of Tom Pigeon and Word Mill Publishing with the 'Mythic Game Master Emulator', 2006
 * https://www.drivethrurpg.com/product/20798/Mythic-Game-Master-Emulator
 */

class GMEmulator {
    constructor() {
        // State variables
        this.ready = false;       // Var to block use until loaded
        this.errorred = false;    // Var to block use due to un-resolvable errors
        this.sceneRunning = false;// Var indicating that a scene is happening 

        // Registered command list
        this.commandList = new Map();

        // Lookup values
        this.lookup = {
            fateLabels: [],
            fateChances: [],
            eventFocus: [],
            eventAction: [],
            eventSubject: [],
            fateQuery: "",
            symbol: {}
        };

        // Stored data controller
        this.moduleName = "gmemulator";
        this.storedChaosKey = "chaos";
        this.storedListsKey = "lists";
        this.storedScenesKey = "scenes";
        this.storedControlKey = "control";
        this.storedSettingsKey = "config";
    }

    //-------------------//
    // Command functions //
    //-------------------//

    // Page 9
    fateRoll(commands) {
        this.debugLog("fateRoll()");
        var chance = commands[1];
        var fate = this.generateFate(chance);
        this.sendMessage("fate", fate);
    }

    // Page 14-17
    eventRoll(commands) {
        this.debugLog("eventRoll()");
        var ev = this.generateEvent();
        this.sendMessage("event", ev);
    }

    // Page 25
    sceneRoll(commands) {
        this.debugLog("sceneRoll()");
        var scene = this.generateScene();
        this.sendMessage("scene", scene);
    }

    // Page 30
    modChaos(commands) {
        var symbol = "";
        if (commands.length == 2) {
            var newVal = 5;
            switch (commands[1]) {
                case "+":
                    newVal = Math.min(9, StateHandler.read(this.moduleName, this.storedChaosKey) + 1);
                    symbol = this.lookup.symbol.upMarker;
                    break;
                case "-":
                    newVal = Math.max(1, StateHandler.read(this.moduleName, this.storedChaosKey) - 1);
                    symbol = this.lookup.symbol.downMarker;
                    break;
                case "reset":
                    newVal = 5;
                    break;
                default:
                    this.sendMessage("error", this.displayName, "!chaos only accepts '+', '-', or 'reset' as its argument");
                    return;
            }

            StateHandler.write(this.moduleName, this.storedChaosKey, newVal);
        }
        this.sendChaos(symbol);
    }

    // Restarts the script
    reload(commands) {
        this.debugLog("reload()");
        this.runInit(true);
    }

    // Debug: Deletes all stored data and resets them to default values
    forceDeleteData(commands) {
        log("Force delete");
        this.initStoredData(true);
        this.runInit(true);
    }

    // Toggles debug mode on and off
    toggleDebug(commands) {
        log("Debug before: " + this.debug);
        log("Debug new val: " + !this.debug);
        this.debug = !this.debug;
        log("Debug mode toggled to " + this.debug);
        this.runInit(true);
    }

    // Debug: Sends an error message to demo the ChatReporter.ErrorBox function
    testError(commands) {
        this.sendMessage("error", "This is a test. <a href='!testerror'>Again</a>");
    }

    // Debug: Sends a scene message to demo the ChatReporter.SceneInfo function
    testScene(commands) {
        var scene = this.generateScene();
        this.sendMessage("scene", scene);
    }

    // Debug: Sends a note to demo the ChatReporter.NoteBox function
    testNote(commands) {
        this.sendMessage("note", "This is a test");
    }

    // Debug: Sends a fate roll message to demo the ChatReporter.FateRoll function
    testFate(commands) {
        var fate = this.generateFate(5);
        this.sendMessage("fate", fate);
    }

    // Debug: Sends an even message to demo the ChatReporter.EventInfo function
    testEvent(commands) {
        var ev = this.generateEvent();
        this.sendMessage("event", ev);
    }

    // Debug: Sends a message containing test API buttons
    testButtons(commands) {
        sendChat(this.displayName, "Test functions:\n<a href=\"!testerror\">html error</a>\n[Note](!testnote)\n[Event](!testevent)\n[Scene](!testscene)\n[Fate](!testfate)");
    }

    // Debug: Shows current debug status
    testDebug(commands) {
        sendChat("API", "Debug = " + this.debug);
    }

    //
    startScene(commands) {
        this.debugLog("startScene()");
        if (this.sceneRunning && commands.length == 1) {
            this.sendMessage("error", "A new scene cannot be started while one is running.<br />[End current scene.](!gme_endscene)");
        }
        else {
            if (commands.length == 1) {
                this.debugLog("startScene() BeginNew");
                var scene = this.generateScene();
                this.currentScene = { data: scene, desc: false, end: false, chaos: false };
                var msg = ChatReporter.instruction("Beginning new scene...");
                if (scene.interrupt) {
                    msg += ChatReporter.noteBox("[Click here to continue](!gme_startscene interrupt) INTERRUPT");
                }
                else {
                    //msg += ChatReporter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                    msg += ChatReporter.noteBox("[Click here to continue](!gme_startscene normal)" + (this.currentScene.data.modified ? " ALTERED" : ""));
                }
                this.sendMessage("custom", msg);
                this.sceneRunning = true;
            }
            else if (commands.length == 2) {
                switch (commands[1].trim().toLowerCase()) {
                    case "interrupt":
                        this.debugLog("startScene() Describe (Interrupt)");
                        var msg = ChatReporter.sceneInfo(this.currentScene.data);
                        msg += ChatReporter.noteBox("The scene is interrupted! Use the event below to determine what happens instead.", true);
                        msg += ChatReporter.eventInfo(this.currentScene.data.event);
                        msg += ChatReporter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                        sendChat(this.displayName, msg);
                        break;
                    case "normal":
                        this.debugLog("startScene() Describe(Normal)");
                        var msg = ChatReporter.sceneInfo(this.currentScene.data);
                        if (this.currentScene.data.modified) {
                            msg += ChatReporter.noteBox("The scene is altered. Think of what is different than expected. Consult [Fate](!&#13;#Fate) if needed.", true);
                        }
                        else {
                            msg += ChatReporter.noteBox("The scene proceeds as you expected.", true);
                        }
                        msg += ChatReporter.noteBox("[Click here to continue](!&#13;#AddSceneDesc)");
                        sendChat(this.displayName, msg);
                        break;
                }
            }
            else {
                switch (commands[1].toLowerCase()) {
                    case "desc":
                        this.debugLog("startScene() StartPlay");
                        this.currentScene.desc = commands[2].replace(this.lookup.symbol.stringStart, "").replace(this.lookup.symbol.stringEnd, "");
                        log("desc: " + this.currentScene.desc);
                        var msg = ChatReporter.instruction("The scene begins...");
                        msg += ChatReporter.noteBox(this.currentScene.desc, true);
                        msg += ChatReporter.chaosBox(this.chaos, null, true);
                        msg += ChatReporter.noteBox("Run !gme_endscene or click [here](!gme_endscene) when the scene is over.");
                        log(msg);
                        this.sendMessage("custom", msg);
                        break;
                }
            }
        }
    }

    //
    endScene(commands) {
        if (this.sceneRunning) {
            if (!this.currentScene.end && commands.length == 1) {
                log("endScene() Entry");
                var msg = ChatReporter.instruction("Ending scene...");
                msg += ChatReporter.noteBox("[Click here to continue](!&#13;#EndSceneDesc)");
                this.sendMessage("custom", msg);
            }
            else if (commands.length == 2) {

            }
            else if (commands.length == 3) {
                switch (commands[1].toLowerCase()) {
                    case "desc":
                        this.debugLog("endScene() EndDesc");
                        this.currentScene.end = commands[2].replace(this.lookup.symbol.stringStart, "").replace(this.lookup.symbol.stringEnd, "");
                        log("end: " + this.currentScene.end);
                        var msg = ChatReporter.instruction("The scene");
                        msg += ChatReporter.sceneInfo(this.currentScene.data);
                        msg += ChatReporter.noteBox("<i>The setup:</i><br>" + this.currentScene.desc, true);
                        msg += ChatReporter.noteBox("<i>The conclusion:</i><br>" + this.currentScene.end, true);
                        msg += ChatReporter.choice("Were the PCs in control for most of the scene?", [["Yes", "!gme_endscene chaos -"], ["No", "!gme_endscene chaos +"]]);
                        log(msg);
                        this.sendMessage("custom", msg);
                        break;
                    case "chaos":
                        this.debugLog("endScene() Chaos");
                        this.currentScene.chaos = commands[2];
                        var symbol = "";
                        if (commands[2] === "+") {
                            this.chaos = Math.min(9, this.chaos + 1);
                            symbol = this.lookup.symbol.upMarker;
                        }
                        else {
                            this.chaos = Math.max(1, this.chaos - 1);
                            symbol = this.lookup.symbol.downMarker;
                        }
                        var msg = ChatReporter.chaosBox(this.chaos, symbol, true);
                        msg += ChatReporter.instruction("Scene over");
                        msg += ChatReporter.choice("Do you want to review your lists before continuing?", [["Yes", ""], ["No", ""]]);
                        this.sendMessage("custom", msg);
                        break;
                }
            }
        }
        else {
            this.sendMessage("error", "No scene is currently running. Use [!gme_startscene] to begin one.");
        }
    }

    //----------------//
    // Roll Functions //
    //----------------//

    // Creates an event
    generateEvent() {
        var ev = {
            rolls: [randomInteger(100), randomInteger(100), randomInteger(100)],
            focusText: "",
            focusRoll: 0,
            actionText: "",
            actionRoll: 0,
            subjectText: "",
            subjectRoll: 0
        };

        for (var i = 0; i < this.lookup.eventFocus.length; i++) {
            var e = this.lookup.eventFocus[i];
            if (ev.rolls[0] <= e[0]) {
                ev.focusText = e[1];
                ev.focusRoll = ev.rolls[0];
                break;
            }
        }
        ev.actionText = this.lookup.eventAction[ev.rolls[1] - 1];
        ev.actionRoll = ev.rolls[1];
        ev.subjectText = this.lookup.eventSubject[ev.rolls[2] - 1];
        ev.subjectRoll = ev.rolls[2];
        this.debugLog("ev1: " + ev + " F: " + ev.focusRoll + " " + ev.focusText + " A: " + ev.actionRoll + " " + ev.actionText + " S: " + ev.subjectRoll + " " + ev.subjectText)

        return ev;
    }

    // Creates a scene
    generateScene() {
        var scene = {
            roll: 0,
            outcome: "",
            interrupt: false,
            modified: false,
            chaos: StateHandler.read(this.moduleName, this.storedChaosKey),
            event: 0
        }

        scene.roll = randomInteger(10);
        if (scene.roll > scene.chaos) {
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
                scene.event = this.generateEvent();
            }
        }
        return scene;
    }

    // Creates a fate result
    generateFate(chance) {
        var fate = {
            roll: randomInteger(100),
            chance: chance,
            chanceText: this.lookup.fateLabels[chance],
            chaos: StateHandler.read(this.moduleName, this.storedChaosKey),
            outcome: "",
            event: null
        }
        var ranges = this.lookup.fateChances[fate.chaos - 1][chance];
        if (fate.roll >= ranges[2]) { fate.outcome = "Extreme No"; }
        else if (fate.roll >= ranges[1]) { fate.outcome = "No" }
        else if (fate.roll > ranges[0]) { fate.outcome = "Yes" }
        else if (fate.roll <= ranges[0]) { fate.outcome = "Extreme Yes" }
        var rollStr = fate.roll.toString();
        if (rollStr.length == 2 && rollStr.substring(0, 1) === rollStr.substring(1, 2)) {
            fate.event = this.generateEvent();
        }
        return fate;
    }

    //--------------------------//
    // Initialisation Functions //
    //--------------------------//

    // Initialises all lookup tables
    initFlags() {
        this.ready = false;
        this.errorred = false;
    }

    // Initialises the lookup tables
    initLookups() {
        this.lookup.fateLabels = ["Impossible", "No way", "Very unlikely", "Unlikely", "50/50", "Somewhat likely", "Likely", "Very likely", "Near sure thing", "A sure thing", "Has to be"];
        this.lookup.fateChances = [
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
        this.lookup.eventFocus = [
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
        this.lookup.eventAction = [
            "Attainment", "Starting", "Neglect", "Fight", "Recruit", "Triumph", "Violate", "Oppose", "Malice", "Communicate", "Persecute", "Increase", "Decrease", "Abandon", "Gratify",
            "Inquire", "Antagonise", "Move", "Waste", "Truce", "Release", "Befriend", "Judge", "Desert", "Dominate", "Procrastinate", "Praise", "Separate", "Take", "Break", "Heal",
            "Delay", "Stop", "Lie", "Return", "Immitate", "Struggle", "Inform", "Bestow", "Postpone", "Expose", "Haggle", "Imprison", "Release", "Celebrate", "Develop", "Travel",
            "Block", "Harm", "Debase", "Overindulge", "Adjourn", "Adversity", "Kill", "Disrupt", "Usurp", "Create", "Betray", "Agree", "Abuse", "Oppress", "Inspect", "Ambush", "Spy",
            "Attach", "Carry", "Open", "Carelessness", "Ruin", "Extravagance", "Trick", "Arrive", "Propose", "Divide", "Refuse", "Mistrust", "Deceive", "Cruelty", "Intolerance",
            "Trust", "Excitement", "Activity", "Assist", "Care", "Negligence", "Passion", "Work hard", "Control", "Attract", "Failure", "Pursue", "Vengeance", "Proceedings",
            "Dispute", "Punish", "Guide", "Transform", "Overthrow", "Oppress", "Change"
        ];
        this.lookup.eventSubject = [
            "Goals", "Dreams", "Environment", "Outside", "Inside", "Reality", "Allies", "Enemies", "Evil", "Good", "Emotions", "Opposition", "War", "Peace", "The innocent", "Love",
            "The spiritual", "The intellectual", "New ideas", "Joy", "Messages", "Energy", "Balance", "Tension", "Friendship", "The physical", "A project", "Pleasures", "Pain",
            "Possessions", "Benefits", "Plans", "Lies", "Expectations", "Legal matters", "Bureaucracy", "Business", "A path", "News", "Exterior factors", "Advice", "A plot",
            "Competition", "Prison", "Illness", "Food", "Attention", "Success", "Failure", "Travel", "Jealousy", "Dispute", "Home", "Investment", "Suffering", "Wishes", "Tactics",
            "Stalemate", "Randomness", "Misfortune", "Death", "Disruption", "Power", "A burden", "Intrigues", "Fears", "Ambush", "Rumor", "Wounds", "Extravagance", "A representative",
            "Adversities", "Opulence", "Liberty", "Military", "The mundane", "Trials", "Masses", "Vehicle", "Art", "Victory", "Dispute", "Riches", "Status quo", "Technology",
            "Hope", "Magic", "Illusions", "Portals", "Danger", "Weapons", "Animals", "Weather", "Elements", "Nature", "The public", "Leadership", "Fame", "Anger", "Information"
        ];
        this.lookup.fateQuery = "?{How likely?|Impossible, 0|No way, 1|Very unlikely, 2|Unlikely, 3|50/50, 4|Somewhat likely, 5|Likely, 6|Very likely, 7|Near sure thing, 8|A sure thing, 9|Has to be, 10}";
        this.lookup.symbol = {
            upMarker: "▲",
            downMarker: "▼",
            stringStart: "⌈",
            stringEnd: "⌉"
        };
    }

    // Initialises the state global object
    initStoredData(force) {
        if (!StateHandler.moduleExists(this.moduleName) || force) {
            // Sets up the expected keys-values
            var defaults = [
                [this.storedChaosKey, 5],
                [this.storedSettingsKey, { debug: false, displayName: "GM" }],
                [this.storedListsKey, { lists: new Map() }],
                [this.storedScenesKey, { scenes: [] }]
            ];

            // Creates module the first time
            StateHandler.initModule(this.moduleName);

            // Defaults values that are missing 
            defaults.forEach((a) => {
                if (!StateHandler.keyExists(this.moduleName, a[0]) || force) {
                    StateHandler.write(this.moduleName, a[0], a[1]);
                }
            });
        }
    }

    // Initialises the macros used
    initMacros() {
        var gm = findObjs({ _type: 'player' })[0];
        this.updateMacro("Fate", "!gme_fate " + this.lookup.fateQuery, gm.id);
        this.updateMacro("Chaos_Up", "!gme_chaos +", gm.id);
        this.updateMacro("Chaos_Down", "!gme_chaos -", gm.id);
        this.updateMacro("Chaos", "!gme_chaos", gm.id);
        this.updateMacro("Scene", "!gme_scene", gm.id);
        this.updateMacro("Event", "!gme_event", gm.id);
        this.updateMacro("Reload", "!gme_reload", gm.id);

        // Used for automatic mode
        this.updateMacro("AddSceneDesc", "!gme_startscene desc " + this.lookup.symbol.stringStart + "?{Add a description of the scene}" + this.lookup.symbol.stringEnd, gm.id);
        this.updateMacro("EndSceneDesc", "!gme_endscene desc " + this.lookup.symbol.stringStart + "?{How was the scene concluded?}" + this.lookup.symbol.stringEnd, gm.id);
    }

    // Registers all commands
    initCommands() {
        // Clear registered commands
        this.commandList = new Map();

        // Core commands for controlling the emulator
        this.registerCommand("!gme_chaos", this.modChaos, 1, 2);
        this.registerCommand("!gme_fate", this.fateRoll, 2, 2);
        this.registerCommand("!gme_event", this.eventRoll, 1, 1);
        this.registerCommand("!gme_scene", this.sceneRoll, 1, 1);
        this.registerCommand("!gme_reload", this.reload, 1, 1);

        // Commands for automated use
        this.registerCommand("!gme_startscene", this.startScene, 1, 3);
        this.registerCommand("!gme_endscene", this.endScene, 1, 3);

        // Commands only used for debugging
        this.registerCommand("!gme_debug", this.toggleDebug, 1, 1);
        this.registerCommand("!gme_isdebug", this.testDebug, 1, 1);
        this.registerCommand("!testreset", this.forceDeleteData, 1, 1);
        if (this.debug) {
            this.registerCommand("!testerror", this.testError, 1, 1);
            this.registerCommand("!testnote", this.testNote, 1, 1);
            this.registerCommand("!testscene", this.testScene, 1, 2);
            this.registerCommand("!testevent", this.testEvent, 1, 1);
            this.registerCommand("!testfate", this.testFate, 1, 1);
            this.registerCommand("!testbuttons", this.testButtons, 1, 1);
        }

        this.debugLog(this.commandList.size + " known Commands:")
        this.commandList.forEach((val, key) => {
            this.debugLog("-> " + key);
        });
    }

    // Registers the chat event handler. Should never be run more than once per instance of the API.
    initEventHandlers() {
        var self = this;
        on('chat:message', (msg) => self.handleInput(msg));
    }

    // Runs all initialisation functions
    runInit(isReload) {
        sendChat("API", ChatReporter.noteBox("<i>GM Emulator</i> is initialising."));

        this.initStoredData(false);
        this.initFlags();
        this.initLookups();
        this.initMacros();
        this.initCommands();
        if (!isReload) {
            this.initEventHandlers();
        }

        if (this.errorred) {
            sendChat("API", ChatReporter.errorBox("Setup Error", "An unrecoverable error occurred during set up. Please restart the API script."));
        }
        else {
            sendChat("API", ChatReporter.noteBox("<i>GM Emulator</i> is now ready for use."));
            this.ready = true;
        }
    }

    //--------------------------//
    // Global storage accessors //
    //--------------------------//

    // Retrieves name used when the emulator sends chat messages. Readonly.
    get displayName() {
        return StateHandler.read(this.moduleName, this.storedSettingsKey).displayName;
    }

    // Retrieves current debug state. Default is false.
    get debug() {
        return StateHandler.read(this.moduleName, this.storedSettingsKey).debug;
    }

    // Sets the debug state.
    set debug(val) {
        var setting = StateHandler.read(this.moduleName, this.storedSettingsKey);
        setting.debug = !!val;
        StateHandler.write(this.moduleName, this.storedSettingsKey, setting);
    }

    // Retrieves the default load behaviour. Default is false;
    get forceReset() {
        return StateHandler.read(this.moduleName, this.storedSettingsKey).debug;
    }

    // Sets the default load behaviour.
    set forceReset(val) {
        var setting = StateHandler.read(this.moduleName, this.storedSettingsKey);
        setting.forceReset = !!val;
        StateHandler.write(this.moduleName, this.storedSettingsKey, setting);
    }

    // Retrieves the current Chaos level
    get chaos() {
        return StateHandler.read(this.moduleName, this.storedChaosKey);
    }

    // Sets the current Chaos level
    set chaos(val) {
        StateHandler.write(this.moduleName, this.storedChaosKey, val);
    }

    //------------------//
    // Helper Functions //
    //------------------//

    // Adds a new macro to the Roll20 game, or updates it to the correct values if it already exists
    updateMacro(mName, mAction, gmId) {
        var macro = findObjs({ type: "macro", name: mName });
        if (macro.length == 0) {
            createObj("macro", {
                name: mName,
                action: mAction,
                playerid: gmId,
                visibleto: "all"
            });
            this.debugLog("Added macro: " + mName);
        }
        else {
            //this.debugLog("Macro '" + mName + "' found. Action: " + macro[0].action + ". Object: " + macro);
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
    }

    // Adds a new API command which will be actioned by the script. Players trigger these by typing the command text in the Roll20 chat or using the provided macros.
    //Param:    commandText string
    registerCommand(commandText, action, minArgs, maxArgs) {
        var error = null;
        if (!commandText.startsWith("!")) { error = "All command texts must start with a '!'"; }
        else if (typeof action != "function") { error = "The 'Action' parameter must be a function."; }
        else if (typeof minArgs != "number" || parseInt(minArgs) < 1) { error = "The 'MinArgs' parameter must be an integer >= 1."; }
        else if (typeof maxArgs != "number" || parseInt(maxArgs) < 1) { error = "The 'MaxArgs' parameter must be an integer >= 1."; }
        else if (!error && action.length != 1) { error = "The 'action' function must take only one parameter (the string[] commands)." }

        if (error) {
            this.sendMessage("error", this.displayName, "Cannot Initialise command '" + commandText + "'. " + error);
            this.errorred = true;
            return;
        }

        var command =
        {
            Action: action,
            MinArgs: parseInt(minArgs),
            MaxArgs: parseInt(maxArgs)
        };
        this.commandList.set(commandText, command);
        this.debugLog("Command '" + commandText + "' registered.");
    }

    // Prints a message to the log if the debug config is set to true
    debugLog(msg) {
        if (this.debug) { log(msg); }
    }

    // Returns true if the commands array conforms to the min and max arguents permitted
    argCheck(cmdArray, min = 1, max = 1) {
        return Array.isArray(cmdArray) && cmdArray.length >= min && cmdArray.length <= max;
    }

    //-------------------//
    // Display functions //
    //-------------------//

    // Sends a message to the users via Roll20 chat
    sendMessage(type, output) {
        switch (type) {
            case "error":
                this.sendError(output);
                break;
            case "scene":
                this.sendScene(output);
                break;
            case "event":
                this.sendEvent(output);
                break;
            case "fate":
                this.sendFate(output);
                break;
            case "note":
                this.sendNote(output);
                break;
            case "chaos":
                this.sendchaos(output);
                break;
            case "custom":
                sendChat(this.displayName, output);
                break;
        }
    }

    // Formats and displays an error message
    sendError(text) {
        this.debugLog("throwError: " + text);
        sendChat(this.displayName, ChatReporter.errorBox("An error occured", text.trim()));
    }

    // Formats and displays the current Chaos level
    sendChaos(symbol) {
        sendChat(this.displayName, ChatReporter.chaosBox(StateHandler.read(this.moduleName, this.storedChaosKey), symbol));
    }

    // Formats and displays a note message
    sendNote(text) {
        sendChat(this.displayName, ChatReporter.noteBox(text.trim()));
    }

    // Formats and dispays a scene description
    sendScene(scene) {
        var html = ChatReporter.sceneInfo(scene);
        if (scene.interrupt) {
            html += ChatReporter.noteBox("The scene is interrupted! Use the event below to determine what happens instead.", true);
            html += ChatReporter.eventInfo(scene.event);
        }
        else if (scene.modified) {
            html += ChatReporter.noteBox("The scene is altered. Think of what is different than expected. Consult [Fate](!gme_fate) if needed.", true);
        }
        sendChat(this.displayName, html);
    }

    // Formats and dispays an event description
    sendEvent(ev) {
        sendChat(this.displayName, ChatReporter.eventInfo(ev));
    }

    // Formats and displays a fate result
    sendFate(fate) {
        var html = ChatReporter.fateRoll(fate);
        if (fate.event) {
            html += ChatReporter.noteBox("You rolled doubles! A random event occurs or the current scenario changes.", true);
            html += ChatReporter.eventInfo(fate.event);
        }
        sendChat(this.displayName, html);
    }

    //----------------//
    // Event Handlers //
    //----------------//
    handleInput(msg) {
        if (msg.type == "api") {
            var target = msg.who;

            // Block commands unless everything is ready
            if (this.errorred) {
                this.sendMessage("error", "An unrecoverable error occurred during set up. Please restart the API script.")
                return;
            }
            else if (!this.ready) {
                this.sendMessage("note", "API script still loading");
                return;
            }
            var cmds = msg.content.trim().split(/[ ]+(?![^⌈]*⌉)/g);
            log("cmd matches " + cmds.length);
            var logMsg = "Command: " + cmds[0];
            cmds.slice(1).forEach((cmd) => {
                logMsg += "\n--> " + cmd;
            });
            this.debugLog(logMsg);

            if (this.commandList.has(cmds[0])) {
                var commandObj = this.commandList.get(cmds[0])
                this.debugLog("CommandObject:" + cmds[0]);
                if (!this.argCheck(cmds, commandObj.MinArgs, commandObj.MaxArgs)) {
                    this.sendMessage("error", "Command '" + cmds[0] + "' requires a minimum of " + commandObj.MinArgs + " arguments and a maximum of " + commandObj.MaxArgs + ".");
                    return;
                }

                commandObj.Action.call(this, cmds)
            }

            // If no matching command is found then it is ignored by this code.
        }
    }
}

class ChatReporter {
    static errorBox(headerText, bodyText) {
        let output = new HtmlBuilder("table.errorbox", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            errorbox: {
                "background": "#fff",
                "border": "solid 1px #000",
                "border-collapse": "collapse",
                "width": "100%"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "red",
                "color": "#000",
                "font-weight": "bold",
                "text-align": "center"
            }
        })
            .append("tr").append("th.tblHead", headerText);
        output.append("body").append("tr").append("td", bodyText);
        return output.toString();
    }

    static noteBox(text, border) {
        let output = new HtmlBuilder("table.notebox", "");
        output.setCss({
            notebox: {
                "background": "#fff",
                "border-style": (border ? "solid" : "none"),
                "border-width": (border ? "0px 2px" : "0px"),
                "border-color": "black",
                "border-collapse": "collapse",
                "width": "100%"
            },
            note: {
                "text-align": "center",
                "padding": "5px"
            }
        });
        output.append("body").append("tr.note").append("td", text);
        return output.toString();
    }

    static chaosBox(chaos, symbol, border) {
        let output = new HtmlBuilder("table.notebox", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            notebox: {
                "background": "#fff",
                "border": (border ? "solid 2px black" : "none"),
                "width": "100%"
            },
            note: {
                "text-align": "center",
                "padding": "5px"
            },
            chaos: {
                "color": "red",
                "font-weight": "bold",
                "font-style": "none"
            },
            blk: {
                "color": "black"
            }
        });
        output.append("body").append("tr.note").append("td").append("span.blk", "Current Chaos level is ").append("span.chaos", chaos).append("span.blk", symbol);
        return output.toString();
    }

    static sceneInfo(scene) {
        let output = new HtmlBuilder("table.sceneinfo", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            sceneinfo: {
                "background": "#fff",
                "border": "solid 2px #000",
                "border-collapse": "collapse",
                "width": "100%"
            },
            lbl: {
                "font-weight": "bold",
                "padding": "5px"
            },
            row: {
                "border": "none",
                "padding": "5px"
            },
            altRow: {
                "background": "#d9d9d9",
                "border": "none",
                "padding": "5px"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "#66ccff",
                "color": "#000",
                "font-weight": "bold",
            }
        }).append("tr").append("th.tblHead", "Scene Info", { colspan: 2 });
        output.append("body")
            .append("tr.row").append("td.lbl", "Chaos").append("td", scene.chaos)
            .append("tr.altRow").append("td.lbl", "Roll").append("td", scene.roll)
            .append("tr.row").append("td.lbl", "Outcome").append("td", scene.outcome);

        return output.toString();
    }

    static eventInfo(ev) {
        let output = new HtmlBuilder("table.eventinfo", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            eventinfo: {
                "background": "#fff",
                "border": "solid 2px #000",
                "border-collapse": "collapse",
                "width": "100%"
            },
            lbl: {
                "font-weight": "bold",
                "padding": "5px"
            },
            row: {
                "border": "none",
                "padding": "5px"
            },
            altRow: {
                "background": "#d9d9d9",
                "border": "none",
                "padding": "5px"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "#33cc33",
                "color": "#000",
                "font-weight": "bold",
            }
        }).append("tr").append("th.tblHead", "Event!", { colspan: 2 });
        output.append("body")
            .append("tr.row").append("td.lbl", "Focus").append("td", "(" + ev.focusRoll + ") " + ev.focusText)
            .append("tr.altRow").append("td.lbl", "Action").append("td", "(" + ev.actionRoll + ") " + ev.actionText)
            .append("tr.row").append("td.lbl", "Subject").append("td", "(" + ev.subjectRoll + ") " + ev.subjectText);
        return output.toString();
    }

    static fateRoll(fate) {
        let output = new HtmlBuilder("table.eventinfo", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            eventinfo: {
                "background": "#fff",
                "border": "solid 2px #000",
                "border-collapse": "collapse",
                "width": "100%"
            },
            lbl: {
                "font-weight": "bold",
                "padding": "5px"
            },
            row: {
                "border": "none",
                "padding": "5px"
            },
            altRow: {
                "background": "#d9d9d9",
                "border": "none",
                "padding": "5px"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "#cc66ff",
                "color": "#000",
                "font-weight": "bold",
            }
        }).append("tr").append("th.tblHead", "Fate result", { colspan: 2 });
        output.append("body")
            .append("tr.row").append("td.lbl", "Chaos").append("td", fate.chaos)
            .append("tr.altRow").append("td.lbl", "Likelyhood").append("td", fate.chanceText)
            .append("tr.row").append("td.lbl", "Outcome").append("td", "(" + fate.roll + ") " + fate.outcome);
        return output.toString();
    }

    static instruction(text) {
        let output = new HtmlBuilder("table.instruction", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            instruction: {
                "background": "#fff",
                "border": "solid 1px #000",
                "border-collapse": "collapse",
                "width": "100%"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "#bfbfbf",
                "color": "#000",
                "font-weight": "bold",
                "text-align": "center"
            }
        }).append("th", text);
        return output.toString();
    }

    static choice(question, options) {
        let output = new HtmlBuilder("table.choice", "", {
            "border": "solid 5px #f00"
        });
        output.setCss({
            choice: {
                "background": "#fff",
                "border-style": "solid",
                "border-color": "black",
                "border-width": "0px 2px 2px, 2px",
                "border-collapse": "collapse",
                "width": "100%"
            },
            row: {
                "border": "none",
                "padding": "5px",
                "text-align": "center"
            },
            altRow: {
                "background": "#d9d9d9",
                "border": "none",
                "padding": "5px"
            },
            tblHead: {
                "text-align": "center"
            },
        });
        output.append("thead", "", {
            style: {
                "background": "#cc66ff",
                "color": "#000",
                "font-weight": "bold",
            }
        }).append("tr").append("th.tblHead", question, { colspan: 2 });
        output.append("body");
        for (var i = 1; i <= options.length; i++) {
            var option = options[i - 1];
            if (i % 2 == 1) {
                output.append("tr.row");
            }
            output.append("td", "[" + option[0] + "](" + option[1] + ")");
        }
        return output.toString();
    }
}

// Initialise on script load
on("ready", function () {
    var GM = GM || new GMEmulator();
    GM.runInit(false);
});