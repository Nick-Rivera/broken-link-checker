"use strict";
const errno       = require("errno").code;
const statusCodes = require("http").STATUS_CODES;

const errors = {
    EXPECTED_HTML(type)
    {
        type = type == null ? type : '"' + type + '"';
        return 'Expected type "text/html" but got ' + type;
    }, HTML_RETRIEVAL: "HTML could not be retrieved"
};

const reasons = {
    BLC_EXTERNAL: "External URL Exclusion",
    BLC_INTERNAL: "Internal URL Exclusion",
    BLC_HTML: "HTML Exclusion",
    BLC_INVALID: "Invalid URL",
    BLC_KEYWORD: "Keyword Exclusion",
    BLC_ROBOTS: "Robots Exclusion",
    BLC_SAMEPAGE: "Same-page URL Exclusion",
    BLC_SCHEME: "Scheme Exclusion",
    BLC_UNKNOWN: "Unknown Error",

    ERRNO_ENOTFOUND: "no matching dns record (ENOTFOUND)"
};


for (const i of Object.keys(errno))
{
    reasons["ERRNO_" + i] = `${errno[i].description} (${i})`;
}


for (const i in Object.keys(statusCodes))
{
    reasons["HTTP_" + i] = `${statusCodes[i]} (${i})`;
}


module.exports = {
    errors: errors, reasons: reasons
};
