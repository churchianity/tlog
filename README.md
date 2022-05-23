
# Usage

```js
    const { log, logt } = require("./tlog");
```

## log
send log data to targets tagged with 'all'
```js
    log("use", ["exactly", "like"], `console.log ${17 * 35}`)
```

## logt
send log data to only targets tagged with one of the tags in the array passed as a first argument.
first argument can be a string or array of strings.
```js
    // send only to targets with the 'verbose' tag
    logt("verbose", "Download progress:", downloadProgress / totalDownloads);

    // send to targets with the 'info' and 'error' tags
    logt(["error", "info"], "failed to parse json at: ", filePath)
```

# Configuration
tlog supports 3 types of targets for your log data:
- file
- console
- http

to determine what logs go to which target, edit the file `tlog.conf.js`.
there are three arrays defined in that file, associated with a key of either 'file', 'console' or 'http'.
in each case, the array should be an array of objects with a `tags` property (which should be a string or array of strings), as well as some other details about how this target should operate.

# Details
## 'file' object details
- path: optional string path to the file to create. defaults to the `data` directory, as a `.log` file named a ISO 8601 timestamp at time of creation.

## 'console' object details
- stdstream: required value of 'stdout', 'stderr', or 'stdin'. It's not usually desired to make it 'stdin'. outputs sent to stdstreams are automatically de-duplicated. even if there are multiple console outputs with the tag relevant to your logs that share the same stdstream, the output will only happen once.

## 'http' object details
our http object is an extension of the [nodejs http/https options object](https://nodejs.org/api/http.html#httprequesturl-options-callback). The object is passed faithfully to http(s).request, so anything you add that is valid for http(s).request will be valid here.

Whichever method you choose, the data of the log will be sent in the request body.

Add a 'url' field to the object to specify the url for the request, which should include both the port and protocol - you usually won't need to set 'hostname' or 'host', or 'path' or 'port' or 'protocol'. Certain combinations of port/protocol/path/host/hostname can behave strangely - it's recommended to specify as much information as possible in the 'url' field.

You may commonly have to set the 'headers' object, and the 'content-type' header inside of that object, depending on your server. If it's not provided it's set to 'text/plain'.

The configuration file is a .js file to enable using environment variables, as you may have sensitive information in your url(s).

### Handling Http Errors
Network requests can fail at runtime, and often those failures are also something you want to log.
Specify the `errorTags` property on the http object, and errors will attempt to be written to the target(s) specified when they occur.
If the target that failed is tagged with one of the tags on its own `errorTags` property, it will skip itself.
This feature is pretty limited and needs elaboration.

# Other Configuration Options/Settings
## timestamps
all logs are prefixed with an ISO 8601 timestamp. You can change this easily by editing the `timestamp` function, but for now it is not configurable from the config file.

## output formatting
by default, we format output using `util.format`, the same way console output is normally formatted. You can change this if you want by editing the `formatOutput` function, but for now it is not configurable from the config file.

