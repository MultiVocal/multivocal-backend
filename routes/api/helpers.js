'use strict'

const request = require('request');
const aws_sdk = require('aws-sdk');
const aws_config = require('../../configs/aws_credentials.json');
const webhook_url = 'https://hooks.slack.com/services/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';

const reportUploadToSlack = (file_name, s3, callback) => {
    // get URL for the file
    var params = {
        Bucket: aws_config.Bucket,
        Key: file_name.toString()
    };
    var s3_url = s3.getSignedUrl('getObject', params);

    // HTTP request to send data to slack webhook

    const current_time = new Date();

    const json_data = {
        "fields": [
            {
                "title": "New Upload",
                "value": ``,
                "short": false // Optional flag indicating whether the `value` is short enough to be displayed side-by-side with other values
            },
            {
                "title": "Metadata",
                "value": `upload time: ${current_time}`,
                "short": false
            }
        ],
        "pretext": `${s3_url}`,
        "fallback": "A new recording was uploaded."
    }

    const request_opts = {
        method: 'POST',
        uri: webhook_url,
        'content-type': 'application/json',
        body: JSON.stringify(json_data)
    }

    request(request_opts, (error, response, body) => {
        if (response.statusCode == 201) {
            console.log("reported to slack");
            return callback(undefined, 'yyay');
        } else {
            console.log('error: ' + response.statusCode)
            console.log(body)
            return callback(body)
        }
    })
};

module.exports = {
    reportUploadToSlack
}
