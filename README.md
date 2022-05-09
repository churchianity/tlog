
# Usage

```js
    const { log, logt } = require("log4jesus");
```

## log
send log data to targets tagged with 'all'
```js
    log("use", ["exactly", "like"], `console.log ${420 * 69}`)
```

## logt
send log data to only targets tagged with one of the tags in the array passed as a first arguement.
first argument can be a string or array of strings.
```js
    // send only to targets with the 'verbose' tag
    logt("verbose", "Download progress:", downloadProgress / totalDownloads);

    // send to targets with the 'info' and 'error' tags
    logt(["error", "info"], "failed to parse json at: ", filePath)
```

# Configuration
log4jesus supports 3 types of targets for your log data:
- file
- console
- http

to determine what logs go to which target, edit the file `log4jesus.json`.
there are three arrays defined in that file, associated with a key of either 'file', 'console' or 'http.
in each case, the array should be an array of objects with a `tags` property (which should be a string or array of strings), as well as some other details about how this target should operate.

## 'file' details
- path: optional string to the file to create

## 'console' details
- stdstream: required value of 'stdout', 'stderr', or 'stdin'. It's not usually desired to make it 'stdin'.

## 'http' details
our http object is an extension of the [nodejs http/https options object](https://nodejs.org/api/http.html#httprequesturl-options-callback). The object is passed faithfully to http/s.request, so anything you add that is valid for http/s.request will be valid here.

Add a 'url' field to the object to specify the url for the request, which should include both the port and protocol - you usually won't need to set 'hostname' or 'host', or 'path' or 'port' or 'protocol'.

You may commonly have to set the 'headers' object, and the 'content-type' header inside of that object, depending on your server. If it's not provided it's set to 'text/plain'.

## timestamps
all logs are prefixed with an ISO 8601 timestamp. You can change this easily by editing the `timestamp` function, but for now it is not configurable from the config file.

