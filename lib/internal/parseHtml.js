"use strict";
const isStream           = require("is-stream");
const isString           = require("is-string");
const parse5             = require("parse5");
const defaultTreeAdapter = require("parse5/lib/tree-adapters/default");
const ParserStream       = require("parse5-parser-stream");

const treeAdapter             = Object.create(defaultTreeAdapter);
treeAdapter.createElement_old = treeAdapter.createElement;
treeAdapter.createElement     = function (tagName, namespaceURI, attrs)
{
    const result = treeAdapter.createElement_old(tagName, namespaceURI, attrs);

    if (result.attrs != null)
    {
        result.attrMap = getAttrMap(result.attrs);
    }

    return result;
};

const options = {sourceCodeLocationInfo: true, treeAdapter: treeAdapter};


/*
 Convert attributes array to a map.

 Note: parse5 will have already handled multiple attrs of the
 same name.
 */
function getAttrMap(attrs)
{
    const map      = {};
    const numAttrs = attrs.length;

    for (let i = 0; i < numAttrs; i++)
    {
        map[attrs[i].name] = attrs[i].value;
    }

    return map;
}


/*
 Parse an HTML stream/string and return a tree.
 */
function parseHtml(input)
{
    return new Promise(function (resolve, reject)
    {
        if (isStream(input) === true)
        {
            const parser = new ParserStream(options);

            parser.on("finish", () => resolve(parser.document));

            // The ParserStream can only handle string streams.
            input.setEncoding("utf8");
            input.pipe(parser);
        }
        else if (isString(input) === true)
        {
            resolve(parse5.parse(input, options));
        }
        else
        {
            reject("Invalid input");
        }
    });
}


module.exports = parseHtml;
