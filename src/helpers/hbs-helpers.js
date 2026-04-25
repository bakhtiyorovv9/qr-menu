// src/helpers/hbs-helpers.js

const hbsHelpers = {
    // {{#if (eq a b)}}
    eq(a, b) {
        return String(a) === String(b);
    },

    // {{toString value}}
    toString(v) {
        return v ? v.toString() : "";
    },

    // {{#times rating}}★{{/times}}
    times(n, options) {
        let out = "";
        for (let i = 0; i < n; i++) out += options.fn(this);
        return out;
    },

    // {{#timesLeft rating 5}}☆{{/timesLeft}}
    timesLeft(n, max, options) {
        let out = "";
        for (let i = n; i < max; i++) out += options.fn(this);
        return out;
    },

    // {{#repeat 5}}★{{/repeat}}
    repeat(n, options) {
        let out = "";
        for (let i = 0; i < n; i++) out += options.fn(this);
        return out;
    },

    // {{firstLetter name}}  →  "A"
    firstLetter(str) {
        return str ? String(str)[0].toUpperCase() : "?";
    },

    // {{firstChar name}}  →  "A"
    firstChar(str) {
        return str ? String(str)[0].toUpperCase() : "?";
    },

    // {{addOne @index}}  →  1, 2, 3 ...
    addOne(n) {
        return n + 1;
    },

    // {{imageUrl this.image}}
    imageUrl(imagePath) {
        if (!imagePath) return "";
        if (imagePath.startsWith("/uploads/")) return imagePath;
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
            return imagePath;
        return `/uploads/${imagePath}`;
    },
};

export default hbsHelpers;
