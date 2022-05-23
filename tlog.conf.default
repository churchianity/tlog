
module.exports = {
    "file": [
        {
            "tags": "httpErrors"
        }
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
            "url": process.env.MY_SERVER_URL,
            "errorTags": "httpErrors",
            "method": "POST",
            "headers": {
                "content-type": "text/plain"
            }
        }
    ]
};

