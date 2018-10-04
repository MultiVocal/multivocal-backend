'use strict'

const request            = require('request');
const error_webhook_url  = 'https://hooks.slack.com/services/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'

const reportErrorToSlack = (error) => {
    // HTTP request to send data to slack webhook

    const current_time = new Date();

    // const error_text = `${error.status} - ${error.message}
    // stack:
    // ${error.stack}
    //
    //
    //
    // data:
    // ${error.data}`

    const json_data = {
        "attachments": [{
            "fallback": "An error occurred.",
            "color": "#c20600",
            "author_name": "MultiVocal Backend",
            "author_icon": "https://scontent-arn2-1.cdninstagram.com/t51.2885-19/s150x150/19227138_110056859607819_125825112795512832_n.jpg",
            "title": `${error.message}`,
            "text": JSON.stringify(error, 0, 4),
            "fields": [{
                "title": "Priority",
                "value": "High",
                "short": false
            }],
            "ts": `${current_time.getTime() / 1000}`
        }],
        "fallback": "An error occurred."
    }

    const request_opts = {
        method: 'POST',
        uri: error_webhook_url,
        'content-type': 'application/json',
        body: JSON.stringify(json_data)
    }

    request(request_opts, (error, response, body) => {
        return
    })
};

module.exports = {
    reportErrorToSlack
}
