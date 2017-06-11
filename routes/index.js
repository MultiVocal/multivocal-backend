'use strict';

const express = require('express');
const router = express.Router();
const multer  = require('multer');
const upload = multer();
const aws_sdk = require('aws-sdk');
const uuid = require('uuid/v1');
const ObjectId = require('mongodb').ObjectId;
const aws_config = require('../configs/aws_credentials.json');

/* Post transcription to the database */
router.post('/transcription', upload.single('file'), (req, res, next) => {
    let file               = req.file || req.body.file;
    let transcription_id   = req.body.transcription_id;
    let transcription_text = req.body.transcription_text;

    if (!file || !transcription_id || !transcription_text) {
        // res.status(422);
        let error_obj = {
            reason: "Request was missing data",
            data: {
                file: !!file,
                transcription_id: !!transcription_id,
                transcription_text: !!transcription_text
            }
        }

        return res.send(error_obj);
    }

    // 1: Create object to insert in mongodb
    // 2: Use mongodb dep to inserrt
    // 3: Return  op result
    let file_name = uuid();
    let s3 = req.S3;

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name,
        Body: file.buffer,

    }

    s3.upload(s3_opts, (err, data) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        let mongo_obj = {
            file_name,
            transcription_id,
            transcription_text,
            upload_time: new Date(),
            verified: false
        }

        req.mongo_client.collection('transcriptions').insert(mongo_obj, (err, result) => {

            if (err) {
                // TODO: Some sweet error handling
                console.log(err)
                return next(err);
            }

            let response = {
                status: 0,
                message: "succesfully added file"
            }

            return res.send(response);
        });
    });
});

/* Get transcription from db */
router.get('/transcription/:transcription_id', (req, res, next) => {
    let transcription_id = req.params.transcription_id;
    //TODO: validate id
    const query = {
        transcription_id
    }

    req.mongo_client.collection('transcriptions').find(query).toArray((error, transcriptions) => {
        if (error) {
            // TODO error handling
            console.log(error)
            return next(err);
        }

        let response = {
            status: 0,
            data: {
                transcription_id,
                files: transcriptions.map(t => t.file_name)
            }
        }

        return res.send(response);
    });
});

module.exports = router;
