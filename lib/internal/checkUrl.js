"use strict";
const linkObj        = require("./linkObj");
const reasons        = require("./messages").reasons;
const simpleResponse = require("./simpleResponse");

const bhttp    = require("bhttp");
const extend   = require("extend");
const isString = require("is-string");


/*
 Checks a URL to see if it's broken or not.
 */
function checkUrl(link, baseUrl, cache, options, retry)
{
    let cached;

    if (retry === undefined)
    {
        if (isString(link) === true)
        {
            link = linkObj(link);
            linkObj.resolve(link, baseUrl, options);
        }

        // TODO :: move out to an `linkObj.invalidate()` to share with `HtmlChecker()` ?
        if (link.url.resolved === null)
        {
            link.broken       = true;
            link.brokenReason = "BLC_INVALID";
            linkObj.clean(link);
            return Promise.resolve(link);
        }

        cached = cache.get(link.url.parsed);

        if (cached !== undefined)
        {
            return Promise.resolve(cached).then(function (response)
            {
                // Cloned to avoid unexpected mutations as a result of user changes
                response = extend({}, response);

                copyResponseData(response, link, options);

                link.http.cached = true;

                return link;
            });
        }
    }

    const request = bhttp.request(link.url.resolved,  // TODO :: https://github.com/joepie91/node-bhttp/issues/3
        {
            discardResponse: true,
            headers: {"user-agent": options.userAgent},
            method: retry !== 405 ? options.requestMethod : "get"
        })
                         .then(function (response)
                         {
                             response = simpleResponse(response);

                             if (response.statusCode === 405 && options.requestMethod === "head" && options.retry405Head === true && retry !== 405)
                             {
                                 // Retry possibly broken server with "get"
                                 return checkUrl(link, baseUrl, cache, options, 405);
                             }

                             // TODO :: store ALL redirected urls in cache
                             if (options.cacheResponses === true && response.url !== link.url.resolved)
                             {
                                 cache.set(response.url, response);  // TODO :: store `request` instead to be
                                                                     // consistent?
                             }

                             return response;
                         })
                         .catch(function (error)
                         {
                             // The error will be stored as a response
                             return error;
                         });

    if (retry === undefined)
    {
        // Send response to cache -- it will be available to `cache.get()` before being resolved
        if (options.cacheResponses === true)
        {
            cache.set(link.url.parsed, request);
        }

        // Send linkObj to caller
        return request.then(function (response)
        {
            copyResponseData(response, link, options);

            link.http.cached = false;

            return link;
        });
    }
    else
    {
        return request;
    }
}


/*
 Copy data from a bhttp response object—either from a request or cache—
 into a link object.
 */
function copyResponseData(response, link, options)
{
    if (response instanceof Error === false)
    {
        copyResponseDataNonError(response, link, options);
    }
    else
    {
        copyResponseDataError(link, response);
    }

    linkObj.clean(link);
}

function copyResponseDataNonError(response, link, options)
{
    if (options.reportOnly404Errors)
    {
        if (response.statusCode !== 404)
        {
            link.broken = false;
        }
        else
        {
            link.broken       = true;
            link.brokenReason = "HTTP_" + response.statusCode;
        }
    }
    else
    {
        if (response.statusCode === 200)
        {
            link.broken = false;
        }
        else
        {
            link.broken       = true;
            link.brokenReason = "HTTP_" + response.statusCode;
        }
    }

    link.http.response = response;

    if (link.url.resolved !== response.url)
    {
        link.url.redirected = response.url;

        if (link.base.resolved !== null)
        {
            // TODO :: this needs a test
            linkObj.relation(link, link.url.redirected);
        }
    }
}

function copyResponseDataError(link, response)
{
    link.broken = true;

    if (reasons["ERRNO_" + response.code] != null)
    {
        link.brokenReason = "ERRNO_" + response.code;
    }
    else
    {
        link.brokenReason = "BLC_UNKNOWN";
    }
}


module.exports = checkUrl;
