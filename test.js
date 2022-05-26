
const { log, logt } = require("./tlog");

log("use", ["exactly", "like"], `console.log ${17 * 15}`)

const downloadProgress = 51;
const totalDownloads = 106;
// send only to targets with the 'verbose' tag (and implicitly targets with the 'all' tag)
logt("verbose", "Download progress:", downloadProgress / totalDownloads);

const filePath = "/example-non-existant-file.json";
// send to targets with the 'info' and 'error' tags (and implicitly targets with the 'all' tag)
logt(["error", "info"], "failed to parse json at: ", filePath)

