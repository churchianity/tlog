
const { log, logt } = require("./log4jesus");


log("use", ["exactly", "like"], `console.log ${420 * 69}`)


const downloadProgress = 51;
const totalDownloads = 106;
// send only to targets with the 'verbose' tag
logt("verbose", "Download progress:", downloadProgress / totalDownloads);

const filePath = "/example-non-existant-file.json";
// send to targets with the 'info' and 'error' tags
logt(["error", "info"], "failed to parse json at: ", filePath)

