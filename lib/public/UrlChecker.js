"use strict";
const checkUrl     = require("../internal/checkUrl");
const parseOptions = require("../internal/parseOptions");

const isString      = require("is-string");
const maybeCallback = require("maybe-callback");
const RequestQueue  = require("limited-request-queue");
const UrlCache      = require("urlcache");
const urlobj        = require("urlobj");


class UrlChecker
{
    constructor(options, handlers)
    {
        const thisObj = this;

        this.handlers = handlers || {};
        this.options  = parseOptions(options);

        this.cache = new UrlCache({
            expiryTime: this.options.cacheExpiryTime, normalizeUrls: false
        });

        this.linkQueue = new RequestQueue({
            maxSockets: this.options.maxSockets,
            maxSocketsPerHost: this.options.maxSocketsPerHost,
            rateLimit: this.options.rateLimit
        }, {
            item(input, done)
            {
                // TODO :: make this more reusable
                function handle_checkUrl(result)
                {
                    maybeCallback(thisObj.handlers.link)(result, input.data.customData);

                    // Auto-starts next queue item, if any
                    // If not, fires "end"
                    done();
                }

                if (input.data.linkObj !== undefined)
                {
                    checkUrl(input.data.linkObj, null, thisObj.cache, thisObj.options).then(handle_checkUrl);
                }
                else
                {
                    // TODO :: send url object -- remove orgUrl?
                    checkUrl(input.data.orgUrl, input.data.baseUrl, thisObj.cache, thisObj.options).then(handle_checkUrl);
                }
            }, end()
            {
                maybeCallback(thisObj.handlers.end)();
            }
        });
    }

    clearCache()
    {
        return this.cache.clear();
    }

    dequeue(id)
    {
        return this.linkQueue.dequeue(id);
    }

    enqueue(url, baseUrl, customData)
    {
        // Undocumented internal use: enqueue(linkObj)
        if (isString(url) === false && url.broken_link_checker === true)
        {
            return this.linkQueue.enqueue({
                url: url.url.parsed, data: {customData: customData, linkObj: url}
            });
        }
        // Documented use: enqueue(url, baseUrl)
        // or erroneous and let linkQueue sort it out
        else
        {
            return this.linkQueue.enqueue({
                url: urlobj.resolve(baseUrl || "", urlobj.parse(url)),  // URL must be absolute
                data: {orgUrl: url, baseUrl: baseUrl, customData: customData}
            });
        }
    }

    numActiveLinks()
    {
        return this.linkQueue.numActive();
    }

    numQueuedLinks()
    {
        return this.linkQueue.numQueued();
    }

    pause()
    {
        return this.linkQueue.pause();
    }

    resume()
    {
        return this.linkQueue.resume();
    }

    __getCache()
    {
        return this.cache;
    }
}


module.exports = UrlChecker;
