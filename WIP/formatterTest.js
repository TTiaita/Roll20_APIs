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

class myHTML {
    constructor(style) {
        this.styles = style || {};
        this.data = [];
        this.html = null;
    }

    static tagType = { open: 0, close: 1, selfclose: 2 };

    setCSS(styles) {
        this.styles = styles;
    }

    addTag(tag, contents, style, attr) {
        this.html = null;
        let css = style ? this._getStyleFromClasses(style) : null;
        this.data.push(this._createElement(tag, myHTML.tagType.open, contents, css, attr));
        return this;
    }

    addSingle(tag, contents, style, attr) {
        return this.addTag(tag, contents, style, attr).closeTag();
    }

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
                    this.data.push(this._createElement(current.tag, myHTML.tagType.close));
                }
            } while (!stop && current);
        }
        else {
            let current = this._getLastOpened();
            current.closed = true;
            this.data.push(this._createElement(current.tag, myHTML.tagType.close));
        }
        return this;
    }

    toString() {
        if (this.html) {
            return this.html;
        }
        let str = "";
        var i = 0;
        this.data.forEach((elem) => {
            let tag;
            switch (elem.type) {
                case myHTML.tagType.open:
                    tag = "<" + elem.tag;
                    if (elem.css) {
                        tag += " " + this._getStyleString(elem.css);
                    }
                    if (elem.attr) {
                        tag += " " + this._getAttrString(elem.attr);
                    }
                    tag += ">" + elem.contents;
                    break;
                case myHTML.tagType.close:
                    tag = "</" + elem.tag + ">";
                    break;
                case myHTML.tagType.selfclose:
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

    _createElement(tag, type, contents, css, attr) {
        let closed = type != myHTML.tagType.open;
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

on("ready", function () {
    
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
        cell: css().padding(5, 5, 2, 2).apply(),
        table: css().width("100%").border(true, true, true, true).apply(),
        b: css().bold(true).apply(),
        i: css().italics(true).apply()
    };

    let cssTest = new myHTML(allStyles);
    cssTest.addTag("table", null, "table")
            .addTag("thead", null, "rowHead headFate")
                .addTag("th", "this one has text", null, {colspan: 2})
            .closeTag("thead")
            .addTag("tr", "", "rowMain").addSingle("td", "Key 1").addSingle("td", "value one")
            .addTag("tr", "", "rowAlt").addSingle("td", "Key 2").addSingle("td", "value two")
        .closeTag(true);
    log("css test: " + cssTest.toString());
});
