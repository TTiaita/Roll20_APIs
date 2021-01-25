var SafetyTools = function() {
    "use strict";

    // Meta
    const version = "1.0";
    const lastUpdate = "2021-01-25";

    // Setup
    let listenerActive = false;
    const displayName = "SafetyTools";

    // User options
    const userOptions = (globalconfig && globalconfig.ClockTokens) || {
        "X Card": true,
        "Script Change": true,
        "Lines & Veils": true,
        "Open Door": true,
    };

    // String delimiters for user input. (Should not be something that can be typed on a keyboard)
    const strStart = "⌈";
    const strEnd = "⌉";

    // Image Sources
    const images = {
        xCard: "https://i.imgur.com/03TMsKc.png",
        scriptRewind: "https://i.imgur.com/c6ZHpa5.png",
        scriptPause: "https://i.imgur.com/B8qf2X8.png",
        scriptForward: "https://i.imgur.com/86l1JU0.png",
        openDoor: "https://i.imgur.com/ope11Zx.png"
    };

    let lines = [];
    let veils = [];
    const checkIn = {
        sentCount: 0,
        responseCount: 0,
        responses: [],
        ids: []
    }

    /** Sets up the script to be used */
    const init = function () {
        checkInstall();
        checkOptions();
        checkHandouts();

        // Initialise persistent memory if necessary
        if (!state.hasOwnProperty("SafetyTools")) {
            state["SafetyTools"] = {
                lines: [],
                veils: []
            };
        }

        lines = state["SafetyTools"].lines;
        veils = state["SafetyTools"].veils;

        checkMacros();

        registerEventHandlers();
    };

    /** 
    * Processes input from the user
    * @param {any} msg - The Roll20 chat message object/
    */
    const handleInput = function (msg) {
        if (msg.type == "api") {
            var cmds = msg.content.trim().split(/[ ]+(?![^⌈]*⌉)/g).map(function (val) {
                return val.replace(strStart, "").replace(strEnd, "");
            });
            if (cmds[0] === "!safety") {
                if (cmds.length < 2 || cmds.length > 4) {
                    sendChat("API", "Error with !safety command.");
                }

                // For debugging
                // log(cmds);

                switch (cmds[1]) {
                    case "xcard":
                        sendImage(images.xCard, "Stop scene immediately.");
                        break;
                    case "script_rewind":
                        sendImage(images.scriptRewind, "Address something already done and perform a re-do.");
                        break;
                    case "script_pause":
                        sendImage(images.scriptPause, "Take a break, then return to play.");
                        break;
                    case "script_forward":
                        sendImage(images.scriptForward, "Skip this content or fade to black.");
                        break;
                    case "door_leave":
                        sendImage(images.openDoor, msg.who + " has stepped away.")
                        break;
                    case "door_rejoin":
                        sendImage(images.openDoor, msg.who + " has rejoined the game.")
                        break;
                    case "lv_show":
                        sendList("Lines", lines, "!&#13;#AddLine", false, msg.who);
                        sendList("Veils", veils, "!&#13;#AddVeil", false, msg.who);
                        break;
                    case "lv_showAll":
                        sendList("Lines", lines, "!&#13;#AddLine", false);
                        sendList("Veils", veils, "!&#13;#AddVeil", false);
                        break;
                    case "lv_addL":
                        lines.push(cmds[2]);
                        sendList("Lines (Updated)", lines, "!&#13;#AddLine", true);
                        break;
                    case "lv_addV":
                        veils.push(cmds[2]);
                        sendList("Veils (Updated)", veils, "!&#13;#AddVeil", true);
                        break;
                    case "lv_clearL":
                        if (cmds[2] == "Yes") {
                            lines = [];
                            sendList("Lines (Updated)", lines, "!&#13;#AddLine", true);
                        }
                        break;
                    case "lv_clearV":
                        if (cmds[2] == "Yes") {
                            veils = [];
                            sendList("Veils (Updated)", veils, "!&#13;#AddVeil", true);
                        }
                        break;
                    case "checkInCall":
                        let players = findObjs({ _type: 'player', _online: true });

                        // Clear check-in data
                        checkIn.sentCount = players.length;
                        checkIn.responseCount = 0;
                        checkIn.responses = [];

                        for (let i = 0; i < players.length; i++) {
                            log("/w " + players[i].get('displayname'));
                            sendCheckIn("Check In", players[i].get('displayname'));
                        };
                        break;
                    case "checkResponse":
                        if (!checkIn.ids.includes(msg.who)) {
                            checkIn.responseCount++;
                            checkIn.responses.push([cmds[2], cmds[3]]);
                            checkIn.ids.push(msg.who);

                            let str = "/w gm <div style=\"text-align: left; border: 2px solid black;padding: 4px;background-color: white;\">"
                                + "<div><i>Player " + checkIn.responseCount + " is " + (cmds[2] == "Yes" ? "" : "NOT") + " okay.</i></div>";
                            if (cmds[3] && cmds[3].length > 0) {
                                str += "<div>" + cmds[3].trim() + "</div>";
                            }
                            str += "</div>";

                            sendChat(displayName, str, { noarchive: true });
                            if (checkIn.sentCount != checkIn.responseCount) {
                                sendChat(displayName, "/w gm " + checkIn.responseCount + " out of " + checkIn.sentCount + " players have responded.")    
                            } else {
                                sendChat(displayName, "/w gm All players have responded. [Show to all](!safety checkDisplay)")
                            }
                        }
                        break;
                    case "checkDisplay":
                        if (checkIn.sentCount != checkIn.responseCount) {
                            sendChat(displayName, "/w gm " + checkIn.responseCount + " out of " + checkIn.sentCount + " players have responded.")
                        } else {
                            let str = "<div style =\"text-align: left; border: 2px solid black; border-collapse: collapse;padding: 2px; background-color: white;\">";
                            shuffleArray(checkIn.responses);
                            for (let i = 0; i < checkIn.responses.length; i++) {
                                str += "<div style=\"text-align: left; border: 1px solid black;padding: 4px;\">"
                                    + "<div><i>Player " + (i + 1) + " is " + (checkIn.responses[i][0] == "Yes" ? "" : "NOT") + " okay.</i></div>";
                                if (checkIn.responses[i][1].length > 0) {
                                    str += "<div>" + checkIn.responses[i][1].trim() + "</div>";
                                }
                                str += "</div>";
                            }
                            str += "</div><div style=\"text-align: center;\"><i>Display order is randomised.</i></div>";
                            sendChat(displayName, str);
                        }
                        break;
                }
            }
        }
    };

    /**
     * Displays a captioned image in chat
     * @param {string} image URI to the image to use
     * @param {string} caption Text to dispaly below image
     */
    const sendImage = function(image, caption) {
        sendChat(displayName, "<div style=\"text-align: center; border: 2px solid black;padding: 4px;background-color: white;\">[IMG](" + image + ")<br/><br/>" + caption + "</div>");
    };

    /**
     * Displays a list of strings in the chat
     * @param {string} title Title of the list
     * @param {string} contents The array of strings (list items)
     * @param {string} btn If provided will display an API button with the provided command
     * @param {boolean} archive If true then the message will be archived
     */
    const sendList = function (title, contents, btn, archive, who) {
        let str = "<div style=\"text-align: left; border: 2px solid black;padding: 4px;background-color: white;\">";
        str += "<div style=\"text-align: center; font-weight: bold\">" + title + "</div>";
        if (contents.length > 0) {
            str += "<ul>";
            contents.forEach(function (v) {
                str += "<li>" + v + "</li>";
            });
            str += "</ul>";
        } else {
            str += "<div>List empty</div><br/>";
        }

        if (btn) {
            str += "<div style=\"text-align: center;\">[Add](" + btn + ")</div>";
        }
        
        str += "</div>";
        if (who) {
            str = "/w " + who + " " + str;
        }
        sendChat(displayName, str, {noarchive: !archive});
    };

    const sendCheckIn = function (text, target) {
        sendChat(displayName, "/w " + target + " <div style=\"text-align:center\"><div>" + text + "</div><br/><div>[Click here](!&#13;#SafetyCheckResponse)", { noarchive: true });
    }

    /** Prints script info to log */
    const checkInstall = function () {
        log("SafetyTools v" + version + " installed.");
    };

    /** Prints script user options to log */
    const checkOptions = function () {
        for (const [key, value] of Object.entries(userOptions)) {
            log("-" + key + ": " + value);
        }
    };

    const checkHandouts = function () {
        let info = {};
        const handouts = findObjs({ _type: 'handout', name: "Safety Tools"});
        if (handouts.length > 0) {
            info = handouts[0];
            for (let i = 1; i < handouts.length; i++) {
                handouts[i].remove();
            }
        }
        else {
            info = createObj("handout", {
                name: "Safety Tools",
                inplayerjournals: "all"
            });
            
        }

        let notes = "This is a handout describing the use of the SafetyTools API Script. Click <a href='https://drive.google.com/file/d/0B74GInw5m2ICZnhucmRQV1A0Vm8/edit'>here</a> for more info on the tools.";
        notes += "<table><thead><th colspan=1>Tool</th>"
        info.set("notes", notes);
    };

    const checkMacros = function () {
        const gmId = findObjs({ _type: 'player' })[0].id;
        const whoCanSee = "all";

        if (userOptions["Check In"]) {
            addMacro("SafetyCheck", "!safety checkInCall", gmId, whoCanSee);
            addMacro("SafetyCheckResponse", "!safety checkResponse " + strStart + "?{Are you safe and confortable with the game right now?|No|Yes}" + strEnd + " " + strStart + "?{You DO NOT have to provide reasons or comments, but if you want to then type them here}" + strEnd, gmId, whoCanSee);
        }

        if (userOptions["X Card"]) {
            addMacro("XCard", "!safety xcard", gmId, whoCanSee);
        } else {
            removeMacro("XCard");
        }

        if (userOptions["Script Change"]) {
            addMacro("⏪", "!safety script_rewind", gmId, whoCanSee);
            addMacro("⏸️", "!safety script_pause", gmId, whoCanSee);
            addMacro("⏩", "!safety script_forward", gmId, whoCanSee);
        }
        else {
            removeMacro("⏪");
            removeMacro("⏸️");
            removeMacro("⏩");
        }

        if (userOptions["Lines & Veils"]) {
            addMacro("ShowLimits", "!safety lv_show", gmId, whoCanSee);
            addMacro("ShowLimitsToAll", "!safety lv_showAll", gmId, whoCanSee);
            addMacro("AddLine", "!safety lv_addL " + strStart + "?{New Line}" + strEnd, gmId, whoCanSee);
            addMacro("AddVeil", "!safety lv_addV " + strStart + "?{New Veil}" + strEnd, gmId, whoCanSee);
            addMacro("ClearLines", "!safety lv_clearL " + strStart + "?{Clear all lines|No|Yes}" + strEnd, gmId, whoCanSee);
            addMacro("ClearVeils", "!safety lv_clearV " + strStart + "?{Clear all veils|No|Yes}" + strEnd, gmId, whoCanSee);
        } else {
            removeMacro("DisplayLimits");
            removeMacro("AddLine");
            removeMacro("AddVeil");
        }

        if (userOptions["Open Door"]) {
            addMacro("StepAway", "!safety door_leave", gmId, whoCanSee);
            addMacro("RejoinGame", "!safety door_rejoin", gmId, whoCanSee);
        } else {
            removeMacro("StepAway");
            removeMacro("RejoinGame");
        }
    };

    /** Adds the chat event handler */
    const registerEventHandlers = function () {
        if (!listenerActive) {
            on('chat:message', handleInput);
            listenerActive = true;
        }
    };

    /**
    * Either creates a new macro or updates an existing one to match the specifications
    * @param {string} mName - The Name of the macro
    * @param {string} mAction - The contents of the macro (what it does when it runs)
    * @param {string} gmId - A playereId to be recorded as the creator
    * @param {string} visibleTo - Comma-delimited list of players who should be able to see the macro
    */
    const addMacro = function (mName, mAction, gmId, whoCanSee) {
        var macro = findObjs({ type: "macro", name: mName });
        if (macro.length == 0) {
            createObj("macro", {
                name: mName,
                action: mAction,
                playerid: gmId,
                istokenaction: true,
                visibleto: whoCanSee
            });
        }
        else {
            macro[0].set({
                action: mAction,
                istokenaction: true,
                visibleto: whoCanSee
            });
            if (macro.length > 1) {
                for (var i = 1; i < macro.length; i++) {
                    macro[i].remove();
                }
            }
        }
    };

    /**
    * Deletes the specified macro, if it exists
    * @param {string} mName - The Name of the macro
    */
    const removeMacro = function (mName) {
        var macro = findObjs({ type: "macro", name: mName });
        if (macro.length > 0) {
            macro.forEach(function (m) {
                m.remove();
            });
        }
    };

    /**
     * Randomly orders an array in-place. Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     * @param {Array} array
     */
    const shuffleArray = function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    return {
        Init: init
    };
}();

// Start the script
on("ready", function () {
    'use strict';
    SafetyTools.Init();
});