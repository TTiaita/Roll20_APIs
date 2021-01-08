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