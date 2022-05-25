
const fs = require("fs");
const util = require("util");
const http = require("http");
const https = require("https");
const crypto = require("crypto");


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
            file.id = crypto.randomBytes(8).toString("hex");

            let path = file.path || `${__dirname}/${timestamp()}.log`;

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

            tty.id = tty.stdstream;
            tty.stream = process[tty.stdstream];
        }
    }

    if (config.http) {
        for (let i = 0; i < config.http.length; i++) {
            const h = config.http[i];

            h.id = crypto.randomBytes(8).toString("hex");

            if (!h.method) {
                h.method = "POST";

            } else if (h.method === "GET") {
                console.warn(`using the http method 'GET' to send your logs is not recommended. Unfortunately, sending payloads with a GET request can be unreliable.\nSee:\nhttps://github.com/whatwg/fetch/issues/551#issue-235203784\nRemove this line in tlog.js to suppress this warning.`);
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

            if (!h.errorTags) {
                h.errorTags = [];

            } else if (!Array.isArray(h.errorTags)) {
                h.errorTags = [ h.errorTags ];
            }
        }
    }

    return config;
}

const config = parseStreams(require("./tlog.conf.js"));

function getStreamsOfTypeAndTags(tags, type) {
    const streams = config[type];
    const out = [];
    for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];

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
    return [].concat(
        getStreamsOfTypeAndTags(tags, "file"),
        getStreamsOfTypeAndTags(tags, "console"),
        getStreamsOfTypeAndTags(tags, "http")
    );
}

// convienent list of streams that we always want to send our logs to, regardless of tags
const alwaysStreams = getStreamsByTags(["all"]);

function httpRequest(options, ...args) {
    const url = new URL(options.url);
    const client = url.protocol === "https" ? https : http;
    const payload = formatOutput(...args);
    options.headers["content-length"] = payload.length;
    const request = client.request(url, options, response => {
        response.on("data", data => {
            // @TODO, if you care what the server responds with
        });
    });

    request.on("error", error => {
        const streams = getStreamsByTags(options.errorTags);

        const usedStreams = {};
        for (let i = 0; i < streams.length; i++) {
            const stream = streams[i];

            if (usedStreams[stream.id]) {
                continue;
            }

            usedStreams[stream.id] = true;

            if (stream.id !== options.id) {
                write(stream, "error writing to http: ", ...args);
            }
        }
    });

    request.write(formatOutput(...args));
    request.end();
}

function write(s, ...args) {
    if (s.stream) {
        s.stream.write(formatOutput(...args));

    } else if (s.type === "http") {
        httpRequest(s, ...args);
    }
}

// log by itself will only log to streams tagged 'all'. if you want to specifiy tags, call 'logt' instead
function log(...args) {
    for (let i = 0; i < alwaysStreams.length; i++) {
        write(alwaysStreams[i], ...args);
    }
}

// |tags| should be a string or array of strings identifying a key in the above configuration object
// which informs the logger 'where' to output the log
function logt(tags, ...args) {
    if (!args) {
        return;
    }

    if (!Array.isArray(tags)) {
        tags = [ tags ];
    }

    const usedStreams = {};
    const streams = getStreamsByTags(tags);
    for (let i = 0; i < streams.length; i++) {
        const s = streams[i];

        if (usedStreams[s.id]) {
            continue;
        }

        write(s, ...args);
        usedStreams[s.id] = true;
    }

    // now send it to the 'all' streams. we need to check if we've already done the job, because in the case a stream is tagged with both 'all' and another tag, we'd double send if we didn't de-dupe.
    for (let i = 0; i < alwaysStreams.length; i++) {
        const s = alwaysStreams[i];

        if (usedStreams[s.id]) {
            continue;
        }

        write(s, ...args);
        usedStreams[s.id] = true;
    }
}

module.exports = { log, logt };

