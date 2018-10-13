"use strict";
const pkg = require("../../package.json");

const userAgent = require("default-user-agent");

const defaultOptions =
          {
              acceptedSchemes: ["http", "https"],
              cacheExpiryTime: 3600000,
              cacheResponses: true,
              excludedKeywords: [],
              excludedSchemes: ["data", "geo", "javascript", "mailto", "sms", "tel"],
              excludeExternalLinks: false,
              excludeInternalLinks: false,
              excludeLinksToSamePage: true,
              filterLevel: 1,
              hideOkLinks: false,
              honorRobotExclusions: true,
              maxSockets: Infinity,
              maxSocketsPerHost: 1,
              reportOnly404Errors: false,
              rateLimit: 0,
              requestMethod: "head",
              retry405Head: true,
              tags: require("./tags"),
              userAgent: userAgent(pkg.name, pkg.version)
          };


module.exports = defaultOptions;
