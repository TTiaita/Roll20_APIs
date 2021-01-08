/*
 * This script is based on the work of Tom Pigeon and Word Mill Publishing with the 'Mythic Game Master Emulator', 2006
 * https://www.drivethrurpg.com/product/20798/Mythic-Game-Master-Emulator
 */

var GMEmulator = GMEmulator || (function(){
    "use strict";

    /**
     * Builder class for creating css styles.
     * @class css
     */
    class cssBuilder{
        // CSS order: top right bottom left
        
        /**
         * Creates an instance of cssBuilder.
         * @memberof cssBuilder
         */
        constructor() {
            this.style = {};
        }

        /** 
         * Resolves the css object.
         * @return {*} a css data object.
         * @memberof cssBuilder
        */
        apply = function() {
            return this.style;
        }

        /** 
         * Sets the 'width' property
         * @param {string} val the string value to assign to 'wdith'.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
        */
        width = function(val) {
            this.style["width"] = val;
            return this;
        }

        /** 
         * Sets the 'font-style' property.
         * @param {bool} val if true, makes italics, otherwise makes normal.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
        */
        italics = function(val) {
            this.style["font-style"] = val ? "italics" : "normal";
            return this;
        }

        /** 
         * Sets the 'font-decoration' property.
         * @param {bool} val if true, makes underlined, otherwise makes normal.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
        */
        underline = function(val) {
            this.style["text-decoration"] = val ? "underline" : "none";
            return this;
        }

        /** 
         * Sets the 'font-decoration' property.
         * @param {bool} val if true, makes underlined, otherwise makes normal.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
        */
        strikethrough = function(val) {
            this.style["text-decoration"] = val ? "line-through" : "none";
            return this;
        }

        /** 
         * Sets the 'font-weight' property.
         * @param {bool} val if true, makes bold, otherwise makes normal.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
        */
        bold = function(val) {
            this.style["font-weight"] = val ? "bold" : "normal";
            return this;
        }

        /**
         * Sets the border related properties.
         * @param {bool} top whether or not to show a border at the top.
         * @param {bool} bottom whether or not to show a border at the bottom.
         * @param {bool} left whether or not to show a border at the left.
         * @param {bool} right whether or not to show a border at the right.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        border = function(top, bottom, left, right) {
            const bWidth = "2px ";
            this.style["border-width"] = (top ? bWidth : "0px ") + (right ?  bWidth : "0px ") + (bottom ?  bWidth : "0px ") + (left ?  bWidth : "0px ");
            this.style["border-collapse"] = "collapse";
            this.style["border-color"] = "black";
            this.style["border-style"] = "solid";
            return this;
        }

        /**
         * Sets the 'color' property.
         * @param {string} val the colour value.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        fontColour = function(col) {
            this.style["color"] = col;
            return this;
        }

        /**
         * Sets the 'background-color' property.
         * @param {string} val the colour value.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        backgroundColour = function(col) {
            this.style["background-color"] = col;
            return this;
        }

        /**
         * Sets the 'text-align' property to centre.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        alignCentre = function() {
            this.style["text-align"] = "center";
            return this;
        }

        /**
         * Sets the 'text-align' property to left.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        alignLeft = function() {
            this.style["text-align"] = "left";
            return this;
        }

        /**
         * Sets the 'text-align' property to right.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        alignRight = function() {
            this.style["text-align"] = "right";
            return this;
        }

        /**
         * Sets the 'margin' property.
         * @param {int} top the margin value in pixels.
         * @param {int} bottom the margin value in pixels.
         * @param {int} left the margin value in pixels.
         * @param {int} right the margin value in pixels.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        margin = function(top, bottom, left, right) {
            this.style["margin"] = top + "px " + right + "px " + bottom + "px " + left + "px";
            return this;
        }

        /**
         * Sets the 'padding' property.
         * @param {int} top the padding value in pixels.
         * @param {int} bottom the padding value in pixels.
         * @param {int} left the padding value in pixels.
         * @param {int} right the padding value in pixels.
         * @returns {*} current object for chaining.
         * @memberof cssBuilder
         */
        padding = function(top, bottom, left, right) {
            this.style["padding"] = top + "px " + right + "px " + bottom + "px " + left + "px";
            return this;
        };
    }

    /**
     * Builder for constructing html for use in Roll20 messages
     * @class messageBuilder
     */
    class messageBuilder {
        /**
         * @constructor
         * @param {*} style the css style object
         */
        constructor(style) {
            this.styles = style || {};
            this.data = [];
            this.html = null;
        }

        /** Enum used to flag type of tags. selfclose cur */
        static tagType = { open: 0, close: 1, selfclose: 2 };

        /**
         * Sets the css styles used by the messageBuilder.
         * @param {*} styles the css object.
         */
        setCSS(styles) {
            this.styles = styles;
        }

        /**
         * Extends the css styles used by the messageBuilder.
         * @param {*} style the css object. 
         */
        addStyles(style) {
            this.style = {...this.style, ...style };
        }

        /**
         * Appends a new html element. Guidedally uses the style that amtches the tag, if exists.
         * @param {string} tag the tag name (a, table, dive, etc).
         * @param {string} style a space-delimited string of css style names to apply to the object. These styles supercede the implict tag style.
         * @param {string} contents the innerHTML of the element.
         * @param {*} attr an object of html attributes to set for the element
         * @return {*} returns current object for chaining.
         */
        addTag(tag, style, contents, attr) {
            this.html = null;
            var styleList = tag;
            if (style && style.toString().length > 0) {
                styleList += " " + style;
            }
            let css = this._getStyleFromClasses(styleList);
            this.data.push(this._createElement(tag, messageBuilder.tagType.open, contents ? contents.toString() : "", css, attr));
            return this;
        }
        
        /**
         * Appends a new html element and immediately closes it.
         * @param {string} tag the tag name (a, table, dive, etc).
         * @param {string} contents the innerHTML of the element.
         * @param {string} style a space-delimited string of css style names to apply to the object.
         * @param {*} attr an object of html attributes to set for the element
         * @return {*} returns current object for chaining.
         */
        addSingle(tag, style, contents, attr) {
            return this.addTag(tag, style, contents, attr).closeTag();
        }

        /**
         * Appends closing tag/s for element/s already apended
         * @param {*} until (optional) if provided closes tags until the specifed element. If not provided closes last opened tag.
         * @return {*} returns current object for chaining.
         */
        closeTag(until) {
            this.html = null;
            if (until) {
                let stop = false;
                let current = false;
                do {
                    current = this._getLastOpened();
                    if (current) {
                        stop = current.tag == until.toString().trim();
                        current.closed = true;
                        this.data.push(this._createElement(current.tag, messageBuilder.tagType.close));
                    }
                } while (!stop && current);
            }
            else {
                let current = this._getLastOpened();
                current.closed = true;
                this.data.push(this._createElement(current.tag, messageBuilder.tagType.close));
            }
            return this;
        }

        /**
         * Converts the html data to a string for output to Roll20.
         * @return {*} \
         */
        toString() {
            if (this.html) {
                return this.html;
            }
            let str = "";
            this.data.forEach((elem) => {
                let tag;
                switch (elem.type) {
                    case messageBuilder.tagType.open:
                        tag = "<" + elem.tag;
                        if (elem.css) {
                            tag += " " + this._getStyleString(elem.css);
                        }
                        if (elem.attr) {
                            tag += " " + this._getAttrString(elem.attr);
                        }
                        tag += ">" + elem.contents;
                        break;
                    case messageBuilder.tagType.close:
                        tag = "</" + elem.tag + ">";
                        break;
                    case messageBuilder.tagType.selfclose:
                        tag = "<" + elem.tag;
                        if (style) {
                            tag += this._getStyleString(elem.css);
                        }
                        if (elem.attr) {
                            tag += this._getAttrString(elem.attr);
                        }
                        tag += " />" + contents;
                        break;
                }
                str += tag;
            });
            return str;
        }

        /**
         * Retrieves a css object which is the combination of all styles in the input string.
         * @private
         * @param {string} classString a space-delimited string of css style names.
         * @return {*} a css data object.
         */
        _getStyleFromClasses(classString) {
            let css = {};
            let used = false;
            classString.trim().split(/[ ]+/).forEach((clazz) => {
                if (!this.styles[clazz]) {
                    return;
                }
                css = { ...css, ...this.styles[clazz] };
                used = true;
            });
            return used ? css : null;
        }

        /**
         * Converts css data into a formatted html string
         * @private
         * @param {*} cssData a css data object.
         * @return {string} a string formatted to be used as the 'style' attribute of an HTML element.
         */
        _getStyleString(cssData) {
            let str = "style=\"";
            let used = false;
            for (let property of Object.keys(cssData)) {
                if (cssData.hasOwnProperty(property)) {
                    str += property + ":" + cssData[property] + "; ";
                    used = true;
                }
            }
            str = str.trim() + "\"";
            return used ? str : "";
        }

        /**
         * Converts an attribute object into a formatted html string
         * @private
         * @param {*} attr an object with properties matching the attributres to set.
         * @return {string} a string formatted to be used in an HTML element's opening tag.
         */
        _getAttrString(attr) {
            let str = "";
            let used = false;
            for (let property of Object.keys(attr)) {
                if (attr.hasOwnProperty(property)) {
                    let prop = attr[property].toString().includes(' ') ? "'" + attr[property] + "'" : attr[property];
                    str += property + "=" + prop + " ";
                    used = true;
                }
            }
            return used ? str.trimRight() : "";
        }

        /**
         * Finds the last html tag that was appened and is not yet closed (FILO).
         * @private
         * @return {*} the element data. NULL if no unclosed tag exists.
         */
        _getLastOpened() {
            let elem = null;
            for (let i = this.data.length - 1; i >= 0; i--) {
                if (!this.data[i].closed) {
                    elem = this.data[i];
                    break;
                }
            }
            return elem;
        }

        /**
         * Creates an html element object
         * @private
         * @param {string} tag the tag name (a, table, dive, etc).
         * @param {int} type the messageBuilder.tagType enum value. 
         * @param {string} contents the innerHTML of the element.
         * @param {*} css the css data object for the element.
         * @param {*} attr an object of html attributes to set for the element.
         * @return {*} the html element data.
         */
        _createElement(tag, type, contents, css, attr) {
            let closed = type != messageBuilder.tagType.open;
            return {
                tag: tag.trim().toLowerCase(),
                type: type,
                closed: closed,
                contents: contents ? contents.trim() : "",
                css: closed ? null : css,
                attr: attr ? attr : null
            };
        }
    }

    /**
     * Static class for handling persistent data storage
     * @class StateHandler
     */
    class StateHandler {
        // Returns the stored value or null if module or key do not exist
        static read(module, key) {
            if (this.moduleExists(module) && this.keyExists(module, key)) {
                return state[module.toLowerCase()][key.toLowerCase()];
            }
            return null;
        }

        // Creates or updates the stored value
        static write(module, key, value) {
            this.initModule(module)
            state[module.toLowerCase()][key.toLowerCase()] = value;
        }

        // Creates a module if it does not already exist
        static initModule(module) {
            if (!this.moduleExists(module.toLowerCase())) {
                state[module.toLowerCase()] = {};
            }
        }

        // Returns true if the specified module exists
        static moduleExists(module) {
            return state.hasOwnProperty(module.toLowerCase());
        }

        // Returns true if the specified module and key exists
        static keyExists(module, key) {
            return this.moduleExists && state[module.toLowerCase()].hasOwnProperty(key.toLowerCase());
        }
    }

    // State variables
    let ready = false,      // Var to block use until loaded
    errorred = false;       // Var to block use due to un-resolvable errors

    // Stored data controller
    const data = {
        module: "gmemulator",
        chaos: "chaos",
        lists: "lists",
        scenes: "scenes",
        control: "control",
        settings: "config"
    };

    let scenes = StateHandler.read(data.module, data.scenes),
    control = StateHandler.read(data.module, data.control),
    lists = StateHandler.read(data.module, data.lists),

    macroTemp = null, // Used to trick roll20 into letting me use roll queries from API buttons

    // Registered command list
    commandList = new Map();

    // Lookup values
    const lookup = {
        fateLabels: [],
        fateChances: [],
        eventFocus: [],
        eventAction: [],
        eventSubject: [],
        fateQuery: "",
        symbol: {}
    },

    //-------------------//
    // Command functions //
    //-------------------//

    fateRoll = function(commands) {
        debugLog("fateRoll()");
        const chance = commands[1];
        const fate = generate.fate(chance);
        let msg = startMessage();
        buildFateMessage(msg, fate);
       if (fate.event) {
            buildHelpMessage(msg, "A random event occurs or the situation changes. Use the event below to determine what happenes.");
            buildEventMessage(msg, fate.event);
        }
        sendMessage(msg, true);
    },

    eventRoll = function(commands) {
        debugLog("eventRoll()");
        const ev = generate.randomEvent();
        let msg = startMessage();
        msg = buildEventMessage(msg, ev).closeTag(true);
        sendMessage(msg, true);
    },

    sceneRoll = function(commands) {
        debugLog("sceneRoll()");
        const scene = generate.scene();
        let msg = startMessage();
        buildSceneMessage(msg, scene, true);
        sendMessage(msg, true);
    },

    modChaos = function(commands) {
        let symbol = "";
        const msg = startMessage();
        let newVal = 5;
        if (commands.length == 2) {
            switch (commands[1]) {
                case "+":
                    newVal = Math.min(9, getChaos() + 1);
                    symbol = lookup.symbol.upMarker;
                    break;
                case "-":
                    newVal = Math.max(1, getChaos() - 1);
                    symbol = lookup.symbol.downMarker;
                    break;
                case "reset":
                    newVal = 5;
                    break;
                default:
                    sendMessage(buildErrorMessage(msg, "!chaos only accepts '+', '-', or 'reset' as its argument"));
                    return;
            }
            setChaos(newVal);
        }
        sendMessage(buildChaosMessage(msg, newVal, symbol), true);
    },

    // Restarts the script
    reload = function(commands) {
        debugLog("reload()");
        init.runAll(true);
    },

    // Debug: Deletes all stored data and resets them to default values
    forceDeleteData = function(commands) {
        log("Force delete");
        init.storedData(true);
        init.runAll(true);
        let m = startMessage();
        sendMessage(buildTitleMessage(m, "Stored data deleted."), true);
    },

    // Toggles debug mode on and off
    toggleDebug = function(commands) {
        setDebug(!getDebug());
        let m = startMessage();
        sendMessage(buildTitleMessage(m, getDebug() ? "Debug mode enabled" : "Debug mode disabled"), true);
        log("Debug mode toggled to " + getDebug());
        init.runAll(true);
    },

    // Debug: Sends an error message to demo the Formatter.ErrorBox function
    testError = function(commands) {
        let msg = startMessage();
        sendMessage(buildErrorMessage(msg, "An error occured."));
    },

    testNote = function(commands) {
        let msg = startMessage();
        buildTitleMessage(msg, "Note");
        sendMessage(buildHelpMessage(msg, "The note contents are here."));
    },

    testContinue = function(commands) {
        let msg = startMessage();
        buildInputMessage(msg, "This would be an explanation", true);
        sendMessage(msg);
    },

    // Debug: Sends a message containing test API buttons
    testButtons = function(commands) {
        let m = startMessage();
        buildChoiceMessage(m, "Test functions", [
            ["Error", "!testerror"],
            ["Note", "!testnote"],
            ["Event", "!gme_event"],
            ["Scene", "!gme_scene"],
            ["Fate", "!&#13;#Fate"],
            ["Continue", "!testcontinue"],
            ["Choice", "!testchoice"],
            ["Input", "!testinput"]
        ]);
        sendMessage(m);
    },

    testChoice = function(commands) {
        let msg = startMessage();
        buildChoiceMessage(msg, "Is this working?", [["Yes", "!yes"], ["No", "!no"], ["Kinda", "!kinda"], ["sorta", "!sorta"], ["Maybe?", "!maybe"]])
        log(msg.closeTag(true).toString());
        sendMessage(msg);
    },

    // Debug: Shows current debug status
    testDebug = function(commands) {
        let m = startMessage();
        sendMessage(buildTitleMessage(m, getDebug() ? "Debug mode enabled" : "Debug mode disabled"), true);
    },

    testInput = function(commands) {
        let msg = startMessage();
        sendMessage(buildInputMessage(msg, "Please add a description of the scene."));
    },

    reportStatus = function(commands) {
        let m = startMessage();
        
        buildTitleMessage(m, "GM Emulator");

        if (control.currentMode == control.modes.passive) {
            buildHelpMessage(m, "Guided mode is disabled.");
            buildHelpMessage(m, "<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_auto on</span><br/>Enables guided mode.");
            buildHelpMessage(m, "<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_auto off</span><br/>Disables guided mode.", "rowAlt");
        } else {
            buildHelpMessage(m, "Guided mode is enabled.");
            buildHelpMessage(m, "<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_auto on</span><br/>Enables guided mode.");
            buildHelpMessage(m, "<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_auto off</span><br/>Disables guided mode.", "rowAlt");

            buildTitleMessage(m, "Guided Mode Commands", "headScene");
            buildHelpMessage(m, "#GM_Emulator (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_input</span>)<br/>Use the guided guidance mode.");
            buildHelpMessage(m, "#Lists (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_menu</span>)<br/>Displays the campaign lists.", "rowAlt");
        }

        buildTitleMessage(m, "Commands", "headScene");
        buildHelpMessage(m, "#Event (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_event</span>)<br/>Generate a random event.");
        buildHelpMessage(m, "#Scene (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_scene</span>)<br/>Generate a scene.", "rowAlt");
        buildHelpMessage(m, "#Fate<br/>Randomly answer a yes/no question.");
        buildHelpMessage(m, "#Chaos_Up (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_chaos +</span>)<br/>Increase the Chaos level");
        buildHelpMessage(m, "#Chaos_Down (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_chaos -</span>)<br/>Decrease the Chaos level", "rowAlt");
        buildHelpMessage(m, "#Chaos (<span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_chaos</span>)<br/>Display the current Chaos level");


        if (getDebug()) {
            buildTitleMessage(m, "Current State");
            buildHelpMessage(m, "CurrentMode: " + control.currentMode);
            buildHelpMessage(m, "CurrentState: " + control.currentState);
            buildHelpMessage(m, "CurrentMenuState: " + control.currentMenuState);
        }
        sendMessage(m);
    },

    showLists = function(commands) {
        if (control.currentMenuState == control.menuStates.none) {
            control.currentMenuState = control.menuStates.listChar;
        }
        return userInput(["!gme_input"]);
    },

    userInput = function(commands) {
        if (control.currentMode == control.modes.passive) {
            // If not in automated mode, report that to user.
            let m = startMessage();
            buildTitleMessage(m, "GM Emulator");
            buildHelpMessage(m, "Guided mode is disabled");
            buildHelpMessage(m, "If you want to enable guided mode type <span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_auto on</span> in chat or click [here](!gme_auto on).");
            sendMessage(m);
        }
        else {
            if (control.currentMenuState != control.menuStates.none) {
                if (commands.length > 1) {
                    switch (commands[1]) {
                        case "menuChars":
                            control.currentMenuState = control.menuStates.listChar;
                            break;
                        case "menuThreads":
                            control.currentMenuState = control.menuStates.listThread;
                            break;
                        case "startScene":
                            control.currentMenuState = control.menuStates.none;
                            if (control.currentState == control.states.sceneLists) {
                                control.currentState = control.states.sceneStart;
                            }
                            return userInput(["!gme_input"]);
                    }
                }
                let m = startMessage();
                switch (control.currentMenuState) {
                    case control.menuStates.listThread:
                        buildListMessage(m, "threads", "Thread List", "Threads are storylines and plot hooks. As the adventure continues, more threads may develop as subplots grow. A thread is considered 'open' as long as it remains unresolved. Usually, the adventure is over as soon as the main thread is solved, or all of the open threads are closed.", lookup.symbol.complete);
                        buildChoiceMessage(m, "Use the buttons below to navigate.", [[(control.currentState == control.states.sceneLists ? "Begin next scene" : "Return to scene"), "!gme_input startScene"], ["Character list", "!gme_input menuChars"]]);
                        break;
                    case control.menuStates.listChar:
                        buildListMessage(m, "chars", "Character List", "Keep track of all of the NPCs who pop up during an adventure. At the end of each scene during an adventure, you will review this list and add any more NPCs who premiered during that scene and remove anyone who has exited the adventure (usually, this means they’re dead).", lookup.symbol.dead);
                        buildChoiceMessage(m, "Use the buttons below to navigate.", [[(control.currentState == control.states.sceneLists ? "Begin next scene" : "Return to scene"), "!gme_input startScene"], ["Threads list", "!gme_input menuThreads"]]);
                        break;
                }

                sendMessage(m);
            }
            else {
                // If not in a menu
                switch (control.currentState) {
                    case control.states.idle:
                        if (commands.length > 1 && commands[1].toLowerCase() == "continue") {
                            control.currentState = control.states.sceneStart;
                            return userInput(commands);
                        }
                        else
                        {
                            let m = startMessage();
                            sendMessage(buildInputMessage(m, "Starting scene " + StateHandler.read(data.module, data.scenes).index + 1, true));
                        }
                        break;
                    case control.states.sceneStart:
                            addScene(generate.scene());
                            control.currentState = control.states.sceneDesc;
                            let m = startMessage();
                            buildSceneMessage(m, currentScene(), true);
                            buildInputMessage(m, "Add a description of the scene setup.");
                            sendMessage(m, true);
                            break;
                    case control.states.sceneDesc:
                        if (commands.length > 1) {
                            currentScene().setup = commands[1];
                            control.currentState = control.states.sceneRunning;
                            let m = startMessage();
                            buildTitleMessage(m, "Scene " + scenes.index, "headInput");
                            buildHelpMessage(m, "<b>Setup:</b><br/>" + currentScene().setup);
                            buildHelpMessage(m, "Play out the scene. When the action is finished use the 'GM_Emulator' macro, type <span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_input</span> in chat, or click [here](!gme_input).");
                            sendMessage(m, true);
                        } else {
                            let m = startMessage();
                            buildSceneMessage(m, currentScene(), true);
                            buildInputMessage(m, "Add a description of the scene setup.");
                            sendMessage(m, true);
                        }
                        break;
                    case control.states.sceneRunning:
                        if (commands.length > 1) {
                            if(commands[1] == "endScene") {
                                control.currentState = control.states.sceneEnd;
                                let m = startMessage();
                                buildInputMessage(m, "Describe how the scene concluded.");
                                sendMessage(m, true);
                            } else {
                                let m = startMessage();
                                buildHelpMessage(m, "Continue playing out the scene. When the action is finished use the 'GM_Emulator' macro, type <span style='font-family: Consolas; background-color: #e6e6e6;'>!gme_input</span> in chat, or click [here](!gme_input).");
                                sendMessage(m);
                            }
                        } else {
                            let m = startMessage();
                            buildChoiceMessage(m, "Are you ready to end the scene?", [["Yes", "!gme_input endScene"], ["No", "!gme_input no"]]);
                            sendMessage(m);
                        }
                        break;
                    case control.states.sceneEnd:
                        if (commands.length > 1) {
                            currentScene().ending = commands[1];
                            control.currentState = control.states.sceneChaos;
                            let m = startMessage();
                            buildChoiceMessage(m, "Were the PCs in control of the scene?", [["Yes", "!gme_input shiftDown"], ["No", "!gme_input shiftUp"]]);
                            sendMessage(m, true);
                        } else {
                            let m = startMessage();
                            buildInputMessage(m, "Describe how the scene concluded.");
                            sendMessage(m, true);
                        }
                        break;
                    case control.states.sceneChaos:
                        if (commands.length > 1 && ["shiftUp", "shiftDown"].includes(commands[1])) {
                            currentScene().chaosShift = commands[1];
                            let m = startMessage();
                            buildTitleMessage(m, "Chaos shifts");
                            if (commands[1] == "shiftUp") {
                                setChaos(getChaos() + 1);
                                buildChaosMessage(m, getChaos(), lookup.symbol.upMarker);
                            }
                            else {
                                setChaos(getChaos() - 1);
                                buildChaosMessage(m, getChaos(), lookup.symbol.downMarker);
                            }
                            control.currentState = control.states.sceneSummary;
                            sendMessage(m, true);
                            return userInput(["!gme_input"]);
                        } else {
                            let m = startMessage();
                            buildChoiceMessage(m, "Were the PCs in control of the scene?", [["Yes", "!gme_input shiftDown"], ["No", "!gme_input shiftUp"]]);
                            sendMessage(m, true);
                        }
                        break;
                    case control.states.sceneSummary:
                        if (commands.length > 1 && commands[1] == "Continue") {
                            control.currentState = control.states.sceneLists;
                            control.currentMenuState = control.menuStates.listThread;
                            return userInput(["!gme_input"]);
                        } else {
                            let m = startMessage();
                            buildTitleMessage(m, "Scene " + currentScene().index + " Summary", "headScene");
                            buildHelpMessage(m, "<b>Setup:</b><br/>" + currentScene().setup);
                            buildHelpMessage(m, "<b>Ending:</b><br/>" + currentScene().ending);
                            buildChaosMessage(m, getChaos(), currentScene().chaosShift == "shiftUp" ? lookup.symbol.upMarker : lookup.symbol.downMarker);
                            buildInputMessage(m, "Now that the scene is complete, you should review your lists.", true);
                            sendMessage(m, true);
                        }
                        break;
                }
            }
        }
    },

    listUpdate = function(commands) {
        switch(commands.length) {
            case 3: {
                let curList = getCurrentList();
                if (!curList) {
                    return;
                }
                switch(commands[1]) {
                    case "add":
                        return listUpdate([commands[0], "add", curList, commands[2]]);
                    case "edit":
                        let args = macroTemp;
                        macroTemp = null;
                        return listUpdate([commands[0], "edit", commands[2], args[0], args[1]]);
                }
            }
            case 4: {
                let list = lists[commands[2]];
                switch(commands[1]) {
                    case "add":
                        list.push(commands[3]);
                        break;
                    case "delete":
                        list.splice(commands[3], 1);
                        break;
                }
                return userInput(["!gme_input"]);
            }
            case 5: {
                //"TEST: !gme_list|edit|Gamma, the lich|chars|2"
                let list = lists[commands[3]];
                log("Test: " + list);
                switch(commands[1]) {
                    case "complete":
                        log("Complete list: " + list)
                        list[commands[4]] = commands[2] + list[commands[4]];
                        break;
                    case "edit":
                        list[commands[4]] = commands[2];
                        break;
                }
                return userInput(["!gme_input"]);
            }
        }
    },

    toggleAuto = function(commands) {
        let m = startMessage();
        if (control.currentMode == control.modes.passive) {
            control.currentMode = control.modes.auto;
            buildTitleMessage(m, "GM Emulator");
            buildHelpMessage(m, "Guided mode enabled.");
            sendMessage(m);
            userInput(["!gme_input"]);
        }
        else {
            control.currentMode = control.modes.passive;
            buildTitleMessage(m, "GM Emulator");
            buildHelpMessage(m, "Guided mode disabled.");
            sendMessage(m);
        }
    },

    setMacroTemp = function(commands) {
        macroTemp = commands.slice(1);
    },

    //----------------//
    // Roll Functions //
    //----------------//
    generate = (function() {
        // Creates an event
        const randomEvent = function() {
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
        const scene = function() {
            var scene = {
                roll: 0,
                outcome: "",
                interrupt: false,
                modified: false,
                chaos: StateHandler.read(data.module, data.chaos),
                event: 0,
                setup: null,
                ending: null,
                chaosShift: null,
                index: null
            }

            scene.roll = randomInteger(10);
            if (scene.roll > scene.chaos) {
                scene.outcome = "As expected";
            }
            else {
                if (scene.roll % 2 == 0) {
                    scene.outcome = "Altered"
                    scene.modified = true;
                }
                else {
                    scene.outcome = "Interrupted!"
                    scene.interrupt = true;
                    scene.event = generate.randomEvent();
                }
            }
            return scene;
        };

        // Creates a fate result
        const fate = function(chance) {
            var fate = {
                roll: randomInteger(100),
                chance: chance,
                chanceText: lookup.fateLabels[chance],
                chaos: StateHandler.read(data.module, data.chaos),
                outcome: "",
                event: null
            }
            var ranges = lookup.fateChances[fate.chaos - 1][chance];
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
        const flags = function() {
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
                stringEnd: "⌉",
                add: "➕",
                remove: "╳",
                edit: "✎",
                complete: "✔️",
                dead: "🕱",
                revive: "🤍"
            };
        },

        // Initialises the state global object
        storedData = function(force) {
            if (!StateHandler.moduleExists(data.module) || force) {
                if (force) { log("Force reseting storedData"); }
                // Sets up the expected keys-values
                var defaults = [
                    [data.chaos, 5],
                    [data.settings, { debug: false, displayName: "GM" }],
                    [data.lists, { chars: [], threads: [] }],
                    [data.scenes, { 
                        scenes: [], 
                        index: 0
                    }],
                    [data.control, {
                        modes: { 
                            passive: 0,     // Emulator is acting as a random table roller, only responding to !scene, !fate, !event, and !chaos.
                            auto: 1         // Emulator is actively controlling the flow of scenes.
                        },
                        states: {
                            idle: 0,            // Guided mode has not been initiated before
                            sceneStart: 1,      // A scene has been initiated. Waiting on player to click 'continue'.
                            sceneDesc: 2,       // Scene generated and displayed. Waiting on player to provide scene description.
                            sceneRunning: 3,    // Players take over the moment-by-moment running of the scene as it progresses. Waiting on players to call !gme_endscene
                            sceneEnd: 4,        // The scene has been ended. Waiting on players to provide ending description.
                            sceneChaos: 5,      // Asks players to determine if chaos shifts up or down. Waiting on player y/n.
                            sceneSummary: 6,    // Sumarises the scene that has just ended. Waiting on player input to begin new scene or move to review mode.
                            sceneLists: 7,    // Asks the players to update threads list.
                            sceneChars: 8,      // Asks the players to review characters list.
                        },
                        menuStates: {
                            none: 0,
                            menuLists: 1,   // Displays the list menu. Waiting on player input to begin/resume scene or open specific list.
                            listChar: 2,    // Displays contents of the Characters list with add/update/remove buttons. Waiting on player input to start/resume scene or return to menu.
                            listThread: 3   // Displays contents of the Threads listwith add/update/remove buttons. Waiting on player  input to start/resume scene or return to menu.
                        },
                        currentMode: 0,
                        currentState: 0,
                        currentMenuState: 0
                    }]
                ];

                // Creates module the first time
                StateHandler.initModule(data.module);

                // Defaults values that are missing 
                defaults.forEach((a) => {
                    if (!StateHandler.keyExists(data.module, a[0]) || force) {
                        if (force) { log(a[0] + " overwritten with " + JSON.stringify(a[1]))}
                        StateHandler.write(data.module, a[0], a[1]);
                    }
                });
            }

            scenes = StateHandler.read(data.module, data.scenes),
            control = StateHandler.read(data.module, data.control);
            lists = StateHandler.read(data.module, data.lists);
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
            manageMacro("Lists", "!gme_menu", gm.id);

            // Used for guided mode
            manageMacro("GM_Emulator", "!gme_input", gm.id);
            manageMacro("gme_input", "!gme_input " + lookup.symbol.stringStart + "?{Input}" + lookup.symbol.stringEnd, gm.id);
            manageMacro("gme_list_add", "!gme_list add " + lookup.symbol.stringStart + "?{Input}" + lookup.symbol.stringEnd, gm.id);
            manageMacro("gme_list_edit", "!gme_list edit " + lookup.symbol.stringStart + "?{Input}" + lookup.symbol.stringEnd, gm.id);
        },

        // Registers all commands
        commands = function() {
            // Clear registered commands
            commandList = new Map();

            // Core commands for controlling the emulator
            registerCommand("!gme", reportStatus, 1, 1);
            registerCommand("!gme_chaos", modChaos, 1, 2);
            registerCommand("!gme_fate", fateRoll, 2, 2);
            registerCommand("!gme_event", eventRoll, 1, 1);
            registerCommand("!gme_scene", sceneRoll, 1, 1);
            registerCommand("!gme_reload", reload, 1, 1);

            // Commands for automated use
            registerCommand("!gme_auto", toggleAuto, 2, 2);
            registerCommand("!gme_input", userInput, 1, 2);
            registerCommand("!gme_list", listUpdate, 3, 5);
            registerCommand("!gme_macro", setMacroTemp, 2, 99);
            registerCommand("!gme_menu", showLists, 1, 1);

            // Commands only used for debugging
            registerCommand("!gme_debug", toggleDebug, 1, 1);
            registerCommand("!gme_isdebug", testDebug, 1, 1);
            registerCommand("!!gme_reset", forceDeleteData, 1, 1);
            if (getDebug()) {
                registerCommand("!testerror", testError, 1, 1);
                registerCommand("!testnote", testNote, 1, 1);
                registerCommand("!testchoice", testChoice, 1, 1);
                registerCommand("!testcontinue", testContinue, 1, 1);
                registerCommand("!testinput", testInput, 1, 1);
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
            let msg = startMessage();
            sendMessage(buildHelpMessage(msg, "<i>GM Emulator</i> is initialising."));

            flags();
            storedData(false);
            lookups();
            macros();
            commands();
            if (!isReload) {
                eventHandlers();
            }

            if (errorred) {
                msg = startMessage();
                sendMessage(buildErrorMessage(msg, "An unrecoverable error occurred during set up. Please restart the API script."));
            }
            else {
                msg = startMessage();
                sendMessage(buildHelpMessage(msg, "<i>GM Emulator</i> is now ready for use."));
                ready = true;
            }
        };
        
        return {
            runAll: runAll,
            storedData: storedData
        };
    }()),
    
    //--------------------------//
    // Global storage accessors //
    //--------------------------//

    // Retrieves name used when the emulator sends chat messages. Readonly.
    getDisplayName = function() {
        return StateHandler.read(data.module, data.settings).displayName;
    },

    // Retrieves current debug state. Default is false.
    getDebug = function() {
        return StateHandler.read(data.module, data.settings).debug;
    },

    // Sets the debug state.
    setDebug = function(val) {
        const setting = StateHandler.read(data.module, data.settings);
        setting.debug = !!val;
        StateHandler.write(data.module, data.settings, setting);
    },

    // Retrieves the current Chaos level
    getChaos = function() {
        return StateHandler.read(data.module, data.chaos);
    },

    getCurrentList = function() {
        let l = null;
        switch (control.currentMenuState) {
            case control.menuStates.listChar:
                l = "chars";
                break;
            case control.menuStates.listThread:
                l = "threads";
                break;
        }
        return l;
    },

    // Sets the current Chaos level
    setChaos = function(val) {
        StateHandler.write(data.module, data.chaos, Math.min(Math.max(val, 1), 9));
    },

    currentScene = function() {
        return scenes.scenes[scenes.index];
    },

    addScene = function(scene) {
        scenes.scenes.push(scene);
        scenes.index = scenes.scenes.length - 1;
        scene.index = scenes.scenes.length;
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
            sendChat("error", "Cannot Initialise command '" + commandText + "'. " + error);
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
    sendMessage = function(msg, archive) {
        if (msg instanceof messageBuilder) {
            sendChat(getDisplayName(), msg.closeTag(true).toString(), null, archive ? {noarchive: true} : null);
        }
        else {
            sendChat(getDisplayName(), msg, null, archive ? {noarchive: true} : null);
        }
    },

    styles = {
        table: new cssBuilder().width("100%").border(true, true, true, true).backgroundColour("white").apply(),
        headScene: new cssBuilder().backgroundColour("#66ccff").apply(),
        headInstruct: new cssBuilder().backgroundColour("#bfbfbf").apply(),
        headFate: new cssBuilder().backgroundColour("#cc66ff").apply(),
        headEvent: new cssBuilder().backgroundColour("#33cc33").apply(),
        headError: new cssBuilder().backgroundColour("red").apply(),
        headInput: new cssBuilder().backgroundColour("#66ffcc").apply(),
        rowMain: new cssBuilder().backgroundColour("white").apply(),
        rowAlt: new cssBuilder().backgroundColour("#d9d9d9").apply(),
        helpText: new cssBuilder().alignCentre().italics(true).backgroundColour("white").apply(),
        thead: new cssBuilder().border(true, true, true, true).bold(true).alignCentre().apply(),
        td: new cssBuilder().padding(2, 2, 5, 5).apply(),
        centre: new cssBuilder().alignCentre().apply(),
        b: new cssBuilder().bold(true).apply(),
        i: new cssBuilder().italics(true).apply(),
        li: new cssBuilder().alignLeft().apply(),
        strikethrough: new cssBuilder().strikethrough(true).apply(),
        btn: new cssBuilder().padding(1,1,1,1).margin(1, 1, 1, 1).alignCentre().apply(),
        seperate: new cssBuilder().border(false, true, false, false).apply(),
        bordered: new cssBuilder().border(true, true, true, true).apply()
    },

    /**
     * Begins a new message formatter.
     * @returns {messageBuilder}
     */
    startMessage = function() {
        return new messageBuilder(styles).addTag("table", "table").addTag("tbody");
    },

    /**
     * Adds a formatted Fate Result to the message.
     * @param {messageBuilder} msg Message object
     * @param {*} fate Fate data
     * @returns {messageBuilder}
     */
    buildFateMessage = function(msg, fate) {
        return msg
            .addTag("tr", "thead headFate").addSingle("td", "", "Fate" ,{colspan: 2}).closeTag()
            .addTag("tr", "rowMain").addSingle("td", "b", "Chaos").addSingle("td", "", fate.chaos).closeTag()
            .addTag("tr", "rowAlt").addSingle("td", "b", "Chance").addSingle("td", "", fate.chanceText).closeTag()
            .addTag("tr", "rowMain" + (fate.event? " seperate": "")).addSingle("td", "b", "Outcome").addSingle("td", "", "(" + fate.roll + ") " + fate.outcome).closeTag();
    },

    /**
     * Adds a formatted Event Result to the message.
     * @param {messageBuilder} msg Message object
     * @param {*} event Event data
     * @returns {messageBuilder}
     */
    buildEventMessage = function(msg, ev) {
        return msg
            .addTag("tr", "thead headEvent").addSingle("td", "", "Event", {colspan: 2}).closeTag()
            .addTag("tr", "rowMain").addSingle("td", "b", "Focus").addSingle("td", "", "(" + ev.focusRoll + ") " + ev.focusText).closeTag()
            .addTag("tr", "rowAlt").addSingle("td", "b", "Action").addSingle("td", "", "(" + ev.actionRoll + ") " + ev.actionText).closeTag()
            .addTag("tr", "rowMain").addSingle("td", "b", "Subject").addSingle("td", "", "(" + ev.subjectRoll + ") " + ev.subjectText).closeTag();
    },

    /**
     * Adds a formatted Scene Result to the message.
     * @param {messageBuilder} msg Message object
     * @param {*} scene Scene data
     * @returns {messageBuilder}
     */
    buildSceneMessage = function(msg, scene, expandOutcome) {
        msg
            .addTag("tr", "thead headScene").addSingle("td", "", "Scene" + (scene.index ? " " + scene.index : ""), {colspan: 2}).closeTag()
            .addTag("tr", "rowMain").addSingle("td", "b", "Chaos").addSingle("td", "", scene.chaos).closeTag()
            .addTag("tr", "rowAlt").addSingle("td", "b", "Roll").addSingle("td", "",  scene.roll).closeTag()
            .addTag("tr", "rowMain").addSingle("td", "b", "Outcome").addSingle("td", "", scene.outcome).closeTag();

        if (expandOutcome) {
            if (scene.interrupt) {
                buildHelpMessage(msg, "The next scene is not what you expected. Use the event below to determine what happens instead.");
                buildEventMessage(msg, scene.event);
            }
            else if (scene.modified) {
                buildHelpMessage(msg, "The scene is altered. Think of how the scene is different than expected.<br />Consult [Fate](!&#13;#Fate) if you need to.");
            }
            else {
                buildHelpMessage(msg, "The scene begins as you envisioned it.");
            }
        }
        return msg;
    },

    /**
     * Adds a formatted Chaos Report to the message.
     * @param {messageBuilder} msg Message object.
     * @param {int} chaosLevel The chaos amount to report.
     * @param {string} symbol The symbol, if any, to add to the chaos number.
     * @returns {messageBuilder}
     */
    buildChaosMessage = function(msg, chaosLevel, symbol) {
        return msg.addTag("tr", "centre")
            .addSingle("td", "", "<i>The current Chaos level is </i><span style='font-weight: bold; color: red'>" + chaosLevel + "</span>" + symbol, {colspan: 2}).closeTag();
    },

    /**
     * Adds a formatted user selection to the message.
     * @param {messageBuilder} msg Message object.
     * @param {string} question The text to display.
     * @param {Array} options An array of [string, string] arrays storing the options, where the first is the display name, and the second the action. 
     * @returns {messageBuilder}
     */
    buildChoiceMessage = function(msg, question, options) {
        msg
            .addTag("tr", "thead headInput").addSingle("td", "", "Input required", { colspan: 2}).closeTag()
            .addTag("tr", "centre seperate").addSingle("td", "", question, { colspan: 2}).closeTag();
        for (let i = 0; i < options.length; i++) {
            let opt = options[i];
            // Displays two buttons per row
            if(i % 2 == 0) {
                msg.addTag("tr", "rowAlt");
            }
            msg.addSingle("td", "centre", "[" + opt[0] + "](" + opt[1] + ")");
            if(i % 2 == 1) {
                msg.closeTag();
            } else if (i == options.length - 1) {
                msg.addSingle("td");
            }
        }
        return msg;
    },

    buildInputMessage = function(msg, instruction, continueBtn) {
        msg.addTag("tr", "thead headInput").addSingle("td", "", "Input required", { colspan: 2}).closeTag();
        if (instruction) {
            msg.addTag("tr", "centre seperate").addSingle("td", "", instruction, { colspan: 2}).closeTag();
        }

        if (continueBtn) {
            msg.addTag("tr", "bordered centre").addSingle("td", "", "[Click here to continue](!gme_input " + lookup.symbol.stringStart + "Continue" + lookup.symbol.stringEnd + ")", {colspan: 2}).closeTag()
        }   
        else {
            msg.addTag("tr", "bordered centre").addSingle("td", "", "[Click here](!&#13;#gme_input)", {colspan: 2}).closeTag();
        }

        return msg;
    },

    /**
     * Adds a formatted Help Box to the message.
     * @param {messageBuilder} msg Message object.
     * @param {string} err The error text to display.
     * @returns {messageBuilder}
     */
    buildHelpMessage = function(msg, text, format) {
        return msg.addTag("tr", "helpText bordered " + format).addSingle("td", "", text, {colspan: 2}).closeTag();
    },

    /**
     * Adds a formatted header to the message.
     * @param {messageBuilder} msg Message object.
     * @param {string} text The text to display.
     * @returns {messageBuilder}
     */
    buildTitleMessage = function(msg, text, titleType) {
        return msg.addTag("tr", "thead " + (titleType ? titleType : "headInstruct")).addSingle("td", "", text, {colspan: 2}).closeTag();
    },

    /**
     * Adds a formatted Error to the message.
     * @param {messageBuilder} msg Message object.
     * @param {string} err The error text to display.
     * @returns {messageBuilder}
     */
    buildErrorMessage = function(msg, err) {
        return msg
            .addTag("tr", "thead headError").addSingle("td", "", "Error", {colspan: 2}).closeTag()
            .addTag("tr").addSingle("td", "", err, {colspan: 2}).closeTag();
    },

    buildListBtnsMessage = function(msg, list, id, strikeSymbol) {
        msg
            .addSingle("span", "btn", "[" + lookup.symbol.remove + "](!gme_list delete "  + list + " " + id + ")")
            .addSingle("span", "btn", "[" + lookup.symbol.edit + "](!gme_macro " + list + " " + id + "&#13;#gme_list_edit)");
        if (strikeSymbol) {
            msg.addSingle("span", "btn", "[" + strikeSymbol + "](!gme_list complete " + strikeSymbol + " " + list + " " + id + ")");
        }
        return msg;
    },

    buildListMessage = function(msg, listName, title, descriptor, strikeSymbol) {
        msg.addTag("tr", "thead headInstruct").addSingle("td", "th", title, {colspan: 2}).closeTag();
        buildHelpMessage(msg, descriptor);
        msg.addTag("tr", "seperate centre rowAlt").addSingle("td", "", "[" + lookup.symbol.add + " Add new entry.](!&#13;#gme_list)", {colspan: 2}).closeTag();

        let listData = lists[listName];
        if (listData.length > 0) {
            for(let i = 0; listData && i < listData.length; i++) {
                log("listData[" + i + "] = " + listData[i]);
                let complete = listData[i].startsWith(strikeSymbol);
                msg.addTag("tr", i % 2 == 0 ? "rowMain" : "rowAlt")
                    .addTag("td", "li", "", {colspan: 2})
                        .addSingle("span", (complete ? "strikethrough" : ""), (complete ? listData[i].slice(2) : listData[i]) + "<br/>");
                        log((complete ? listData[i].slice(1) : listData[i]) + "<br/>");
                        if (!complete) { 
                            buildListBtnsMessage(msg, listName, i, strikeSymbol);
                        }
                msg.closeTag("tr");
            }
        } else {
            buildHelpMessage(msg, "<i>List is empty. Use button above to add entries.</i>");
        }
        return msg;
    },

    //----------------//
    // Event Handlers //
    //----------------//
    handleInput = function(msg) {
        if (msg.type == "api") {
            var target = msg.who;
            var cmds = msg.content.trim().split(/[ ]+(?![^⌈]*⌉)/g).map(function(val) {
                return val.replace(lookup.symbol.stringStart, "").replace(lookup.symbol.stringEnd, "");
            });

            if (commandList.has(cmds[0])) {
                // Block commands unless everything is ready
                if (errorred) {
                    let m = startMessage();
                    sendMessage(buildErrorMessage(m, "An unrecoverable error occurred during set up. Please restart the API script."));
                    log("ready: " + ready);
                    return;
                }
                else if (!ready) {
                    let m = startMessage();
                    sendMessage(buildHelpMessage(m, "GME is still loading. Please wait."));
                    return;
                }

                var commandObj = commandList.get(cmds[0])
                debugLog("CommandObject:" + cmds[0] + (cmds.length > 1 ? ", args: \"" + cmds.slice(1).join("\", \"") + "\"" : ""));
                if (!argCheck(cmds, commandObj.MinArgs, commandObj.MaxArgs)) {
                    let m = startMessage();
                    sendMessage(buildErrorMessage(m, "Command '" + cmds[0] + "' requires a minimum of " + commandObj.MinArgs + " arguments and a maximum of " + commandObj.MaxArgs + "."));
                    return;
                }

                commandObj.Action.call(this, cmds)
            }
            // If no matching command is found then it is ignored by this code.
        }
    };

    return { init: init.runAll };
}());

// Initialise on script load
on("ready", function () {
    sendChat("", "-----------------------");
    GMEmulator.init(false);
    sendChat("Api", "!gme");
});
