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