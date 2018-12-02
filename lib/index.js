"use strict";
const reasons = require("./internal/messages").reasons;


const blc = {
    HtmlChecker: require("./public/HtmlChecker"),
    HtmlUrlChecker: require("./public/HtmlUrlChecker"),
    SiteChecker: require("./public/SiteChecker"),
    UrlChecker: require("./public/UrlChecker")
};


for (const i of Object.keys(reasons))
{
    blc[i] = reasons[i];
}


module.exports = blc;
