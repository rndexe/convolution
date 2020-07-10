
/**
 * A dictionary that has tokens and their corresponding formatter function.
 */
// prettier-ignore
var FORMATTERS = {
    'DD': function (date) { return addZeroPads(2, '' + date.getUTCDate()); },
    'D': function (date) { return '' + date.getUTCDate(); },
    'MM': function (date) { return addZeroPads(2, '' + (date.getUTCMonth() + 1)); },
    'M': function (date) { return '' + (date.getUTCMonth() + 1); },
    'YYYY': function (date) { return addZeroPads(4, '' + date.getUTCFullYear()); },
    'YY': function (date) { return ('' + date.getUTCFullYear()).substr(-2); },
    'HH': function (date) { return addZeroPads(2, '' + date.getUTCHours()); },
    'H': function (date) { return '' + date.getUTCHours(); },
    'mm': function (date) { return addZeroPads(2, '' + date.getUTCMinutes()); },
    'm': function (date) { return '' + date.getUTCMinutes(); },
    'ss': function (date) { return addZeroPads(2, '' + date.getUTCSeconds()); },
    's': function (date) { return '' + date.getUTCSeconds(); },
};
/**
 * Part of the matcher, a `RegExp`, for escaping texts.
 */
var ESCAPE = '\\[[^\\[\\]]*\\]';
/**
 * Creates the matcher using formatters' tokens and the escaping strategy.
 * @returns {RegExp}
 */
function createMatcher() {
    var matchers = Object.keys(FORMATTERS).concat(ESCAPE);
    return new RegExp(matchers.join('|'), 'g');
}
/**
 * Add zero (`0`) pads to text's length match defined length.
 * @param {Number} length - Expected length of text with zero pads.
 * @param {String} text - Text that receives the zero pads if below length.
 * @returns {String}
 */
function addZeroPads(length, text) {
    if (text.length >= length)
        return text;
    return addZeroPads(length, '0' + text);
}
/**
 * Receives a `Date` and a format (with tokens based on Moment.js) in `string`
 * and returns the same format replacing the tokens for values from `Date`.
 * @example
 * formatDate(new Date(), "DD/MM/YYYY hh:mm:ss");
 * //=> "25/06/2020 11:59:28"
 *
 * formatDate(new Date(), "[Day] D [at] h'mm");
 * //=> "Day 25 at 11'59"
 * @param {Date} date - A `Date` instance.
 * @param {String} format - A string with tokens (like Moment.js tokens).
 * @returns {String}
 */
function formatDate(date, format) {
    return format.replace(createMatcher(), function (token) {
        if (FORMATTERS.hasOwnProperty(token))
            return FORMATTERS[token](date);
        return token.replace(/\[|\]/g, '');
    });
}
