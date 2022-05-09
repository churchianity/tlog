
const fs = require("fs");
const util = require("util");
const http = require("http");
const https = require("https");


function timestamp() {
    return new Date().toISOString();
}

function formatOutput(...args) {
    return `${timestamp()} - ${util.format(...args)}\n`;
}

function parseStreams(config) {
    if (config.file) {
        for (let i = 0; i < config.file.length; i++) {
            const file = config.file[i];
            let path = file.path || `${__dirname}/${timestamp()}-log.txt`;

            try {
                file.stream = fs.createWriteStream(path, { flags: "a", autoClose: true });

            } catch (e) {
                console.error(`failed to open file at: ${path} for writing. Check the path in the config, and permissions for that directory and this process`);
                process.exit(1);
            }
        }
    }

    if (config.console) {
        for (let i = 0; i < config.console.length; i++) {
            const tty = config.console[i];

            if (
                !(tty.stdstream === "stdout"
                || tty.stdstream === "stderr"
                || tty.stdstream === "stdin")
            ) {
                console.error(tty, "console items in config must have a key 'stdstream' set to one of the following: 'stdout', 'stderr', or 'stdin'. Check your config.")
                process.exit(1);
            }

            tty.stream = process[tty.stdstream];
        }
    }

    if (config.http) {
        for (let i = 0; i < config.http.length; i++) {
            const h = config.http[i];

            if (!h.method) {
                h.method = "POST";

            } else if (h.method === "GET") {
                console.warn(`using the http method 'GET' to send your logs is not recommended - in particular if you are intending to send a request body. Some system libraries are known to strip the payload completely off of GET requests, making this unreliable, despite the http 1.1 standard technically allowing it. See: https://github.com/whatwg/fetch/issues/551#issue-235203784`);
            }

            if (!h.url) {
                console.error(`Please specify a 'url' on your http object in your configuration. The url should be full - the protocol and port should be included`);
                process.exit(1);
            }

            if (!h.headers || !h.headers["content-type"]) {
                h.headers = {
                    "content-type": "text/plain"
                };
            }
        }
    }
}

function loadAndParseConfig(configFilePath) {
    let config;
    try {
        const fileContents = fs.readFileSync(configFilePath, { encoding: "utf-8", flag: "r" });
        try {
            config = JSON.parse(fileContents);

        } catch (e) {
            console.error(`invalid JSON in your configuration file: ${configFilePath}`);
            process.exit(1);
        }
    } catch(e) {
        // no config file, warn about it, make a default
        console.warn(`no configuration file found at: ${configFilePath}. Using a default config.`);
        config = {
            "file": [
                {
                    "tags": "all"
                },
            ],
            "console": [
                {
                    "tags": "error",
                    "stdstream": "stderr"
                },
                {
                    "tags": "warn",
                    "stdstream": "stdout"
                },
                {
                    "tags": "info",
                    "stdstream": "stdout"
                },
                {
                    "tags": "verbose",
                    "stdstream": "stdout"
                },
                {
                    "tags": [ "all", "log" ],
                    "stdstream": "stdout"
                }
            ],
            "http": [
                {
                    "tags": "none",
                    "url": "http://localhost:8080"
                }
            ]
        };
    }

    parseStreams(config);

    return config;
}

const configFilePath = __dirname + "/log4jesus.json";
const config = loadAndParseConfig(configFilePath);

function getStreamsOfTypeAndTags(tags, type) {
    const streams = config[type];
    const out = [];
    for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];

        if (!Array.isArray(stream.tags)) {
            stream.tags = [ stream.tags ];
        }

        for (let j = 0; j < stream.tags.length; j++) {
            for (let k = 0; k < tags.length; k++) {
                if (stream.tags[j] === tags[k]) {
                    out.push({ type, ...stream });
                }
            }
        }
    }
    return out;
}

function getStreamsByTags(tags) {
    if (!Array.isArray(tags)) {
        tags = [ tags ];
    }

    return [].concat(
        getStreamsOfTypeAndTags(tags, "file"),
        getStreamsOfTypeAndTags(tags, "console"),
        getStreamsOfTypeAndTags(tags, "http")
    );
}

// convienent list of streams that we always want to send our logs to, regardless of tags
const alwaysStreams = getStreamsByTags("all");

function httpRequest(options, payload) {
    const url = new URL(options.url);
    const client = url.protocol === "https" ? https : http;
    options.headers["content-length"] = payload.length;
    const request = client.request(url, options, response => {
        response.on("data", data => {
            // @TODO, if you care what the server responds with
        });
    });

    request.on("error", error => {
        // @TODO, if you care about errors on the request
    });

    request.write(payload);
    request.end();
}

// log by itself will only log to streams tagged 'all'. if you want to specifiy tags, call 'logt' instead
function log(...args) {
    const output = formatOutput(...args);

    for (let i = 0; i < alwaysStreams.length; i++) {
        const s = alwaysStreams[i];

        if (s.stream) {
            s.stream.write(output);

        } else if (s.type === "http") {
            httpRequest(s, output);
        }
    }
}

// |tags| should be a string or array of strings identifying a key in the above configuration object
// which informs the logger 'where' to output the log
function logt(tags, ...args) {
    if (!args) {
        log(tags);
        return;
    }

    if (!Array.isArray(tags)) {
        tags = [ tags ];
    }

    const streams = getStreamsByTags(tags);
    for (let i = 0; i < streams.length; i++) {
        const s = streams[i];

        if (s.stream) {
            s.stream.write(output);

        } else if (s.type === "http") {
            httpRequest(s, output);
        }
    }
}

module.exports = { log, logt };

