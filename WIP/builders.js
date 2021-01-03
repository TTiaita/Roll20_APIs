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
        style = {};
    }

    /** 
     * Resolves the css object.
     * @return {*} a css data object.
     * @memberof cssBuilder
    */
    apply = function() {
        return style;
    }

    /** 
     * Sets the 'width' property
     * @param {string} val the string value to assign to 'wdith'.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
    */
    width = function(val) {
        style["width"] = val;
        return this;
    }

    /** 
     * Sets the 'font-style' property.
     * @param {bool} val if true, makes italics, otherwise makes normal.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
    */
    italics = function(val) {
        style["font-style"] = val ? "italics" : "normal";
        return this;
    }

    /** 
     * Sets the 'font-decoration' property.
     * @param {bool} val if true, makes underlined, otherwise makes normal.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
    */
    underline = function(val) {
        style["text-decoration"] = val ? "underline" : "none";
        return this;
    }

    /** 
     * Sets the 'font-decoration' property.
     * @param {bool} val if true, makes underlined, otherwise makes normal.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
    */
    strikethrough = function(val) {
        style["text-decoration"] = val ? "line-through" : "none";
        return this;
    }

    /** 
     * Sets the 'font-weight' property.
     * @param {bool} val if true, makes bold, otherwise makes normal.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
    */
    bold = function(val) {
        style["font-weight"] = val ? "bold" : "normal";
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
        var bWidth = "2px ";
        style["border-width"] = (top ? bWidth : "0px ") + (right ?  bWidth : "0px ") + (bottom ?  bWidth : "0px ") + (left ?  bWidth : "0px ");
        style["border-collapse"] = "collapse";
        style["border-color"] = "black";
        style["border-style"] = "solid";
        return this;
    }

    /**
     * Sets the 'color' property.
     * @param {string} val the colour value.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
     */
    fontColour = function(col) {
        style["color"] = col;
        return this;
    }

    /**
     * Sets the 'background-color' property.
     * @param {string} val the colour value.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
     */
    backgroundColour = function(col) {
        style["background-color"] = col;
        return this;
    }

    /**
     * Sets the 'text-align' property to centre.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
     */
    alignCentre = function() {
        style["text-align"] = "center";
        return this;
    }

    /**
     * Sets the 'text-align' property to left.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
     */
    alignLeft = function() {
        style["text-align"] = "left";
        return this;
    }

    /**
     * Sets the 'text-align' property to right.
     * @returns {*} current object for chaining.
     * @memberof cssBuilder
     */
    alignRight = function() {
        style["text-align"] = "right";
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
        style["margin"] = top + "px " + right + "px " + bottom + "px " + left + "px";
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
        style["padding"] = top + "px " + right + "px " + bottom + "px " + left + "px";
        return this;
    };
};

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
     * Appends a new html element.
     * @param {string} tag the tag name (a, table, dive, etc).
     * @param {string} contents the innerHTML of the element.
     * @param {string} style a space-delimited string of css style names to apply to the object.
     * @param {*} attr an object of html attributes to set for the element
     * @return {*} returns current object for chaining.
     */
    addTag(tag, contents, style, attr) {
        this.html = null;
        let css = style ? this._getStyleFromClasses(style) : null;
        this.data.push(this._createElement(tag, messageBuilder.tagType.open, contents, css, attr));
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
    addSingle(tag, contents, style, attr) {
        return this.addTag(tag, contents, style, attr).closeTag();
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
        var i = 0;
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
        classString.trim().split(/[ ]+/).forEach((clazz) => {
            if (!this.styles[clazz]) {
                return;
            }
            css = { ...css, ...this.styles[clazz] };
        });
        return css;
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

/*
Example:

// Using css class to construct a css styyle object.
let allStyles = {
    headScene: css().backgroundColour("66ccff").apply(),
    headInstruct: css().backgroundColour("bfbfbf").apply(),
    headFate: css().backgroundColour("cc66ff").apply(),
    headEvent: css().backgroundColour("33cc33").apply(),
    headError: css().backgroundColour("red").apply(),
    rowMain: css().backgroundColour("white").apply(),
    rowAlt: css().backgroundColour("d9d9d9").apply(),
    rowHead: css().bold(true).alignCentre().apply(),
    cellBlue: css().fontColour("blue").apply(),
    cell: css().padding(2, 2, 5, 5).apply(),
    table: css().width("100%").border(true, true, true, true).apply(),
    b: css().bold(true).apply(),
    i: css().italics(true).apply()
};

// Initialising a messageBuilder object with a css style object.
let test = new messageBuilder(allStyles);

// Constucting the HTML data
test.addTag("table", null, "table")
        .addTag("thead", null, "rowHead headFate")
            .addSingle("th", "this one has text", null, {colspan: 2})
        .closeTag("thead")
        .addTag("tr", "", "rowMain").addSingle("td", "Key 1", "cell").addSingle("td", "value one", "cell")
        .addTag("tr", "", "rowAlt").addSingle("td", "Key 2", "cell").addSingle("td", "value two", "cell")
    .closeTag(true); // Note that since there is no '<true>' tag to close, this will close all open elements

// 
log("css test: " + test.toString());
*/
