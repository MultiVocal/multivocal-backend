'use strict'

const request     = require('request');
const aws_sdk     = require('aws-sdk');
const aws_config  = require('../../../../configs/aws_credentials.json');
const webhook_url = 'https://hooks.slack.com/services/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'; // Put this in a config...

/**
 * Returns a random entry from an array of recordings
 * @param  Array    recordings
 * @return Object
 */
const getRandomRecording = (recordings) => {
    const min  = 0;
    const max  = Math.floor(recordings.length - 1);
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;

    return recordings[rand];
}

const reportUploadToSlack = (file_name, s3, callback) => {
    // get URL for the file
    var params = {
        Bucket: aws_config.Bucket,
        Key: file_name.toString(),
        Expires: 604800
    };
    var s3_url = s3.getSignedUrl('getObject', params);

    // HTTP request to send data to slack webhook

    const current_time = new Date();

    const json_data = {
        "attachments": [{
            "fallback": "A new recording was uploaded.",
            "color": "#36a64f",
            "author_name": "MultiVocal Backend",
            "author_icon": "https://scontent-arn2-1.cdninstagram.com/t51.2885-19/s150x150/19227138_110056859607819_125825112795512832_n.jpg",
            "title": "New Upload",
            "title_link": `${s3_url}`,
            "text": `Uploaded at \n${current_time}`,
            "fields": [{
                "title": "Priority",
                "value": "High",
                "short": false
            }],
            "ts": `${current_time.getTime() / 1000}`
        }],
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
            return callback(undefined, 'success');
        } else {
            return callback(body)
        }
    })
};

module.exports = {
    getRandomRecording,
    reportUploadToSlack
}
