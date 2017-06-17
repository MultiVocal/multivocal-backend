'use strict';

const express = require('express');
const router = express.Router();
const multer  = require('multer');
const upload = multer();
const aws_sdk = require('aws-sdk');
const ObjectId = require('mongodb').ObjectId;
const aws_config = require('../../configs/aws_credentials.json');

/* Post transcription to the database */
router.post('/recording', upload.single('file'), (req, res, next) => {
    let file               = req.file || req.body.file;
    let transcription_id   = req.body.transcription_id;
    let client_id          = req.body.client_id;
    let notes              = req.body.notes || [];

    if (!file || !transcription_id) {
        res.status(422);
        let error_obj = {
            reason: "Request was missing data",
            data: {
                file: !!file,
                transcription_id: !!transcription_id
            }
        }

        return res.send(error_obj);
    }

    // 1: Create object to insert in mongodb
    // 2: Use mongodb dep to inserrt
    // 3: Return  op result
    let file_name = new ObjectId();

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name.toString(),
        Body: file.buffer
    }

    req.S3.upload(s3_opts, (err, data) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        let mongo_obj = {
            file_name,
            transcription_id,
            notes,
            client_id,
            upload_time: new Date().getTime(),
            verified: false,
            rating: null
        }

        req.mongo_client.collection('recordings').insert(mongo_obj, (err, result) => {

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
router.get('/recordings/:transcription_id', (req, res, next) => {
    let transcription_id = req.params.transcription_id;
    //TODO: validate id
    const query = {
        transcription_id,
        deleted: {
            $ne: true
        }
    }

    req.mongo_client.collection('recordings').find(query).toArray((error, transcriptions) => {
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

/* Edit recording */
router.put('/recording/:file_name/edit', upload.single('file'), (req, res, next) => {
    let file      = req.file || req.body.file;
    let file_name = req.params.file_name;

    // Validate params
    if (!file_name || !ObjectId.isValid(file_name) || !file) {
        res.status(422)

        let error_obj = {
            reason: "Request was missing data",
            data: {
                file_name: file_name,
                file: file
            }
        }

        return res.send(error_obj);
    }

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name,
        Body: file.buffer
    }

    // An upload to an existing key will simply overwrite it
    // TODO: Before uploading, make sure that it already exists?
    req.S3.upload(s3_opts, (err, data) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        let mongo_query = {
            filter: {
                file_name: new ObjectId(file_name)
            },
            update: {
                $set: {
                    last_edited: new Date().getTime()
                }
            }
        }

        // Update document in mongo to have a "last_edited" field
        req.mongo_client.collection('recordings').update(mongo_query.filter, mongo_query.update, (err, result) => {
            if (err) {
                // TODO: Some sweet error handling
                console.log(err)
                return next(err);
            }

            let response = {
                status: 0,
                message: "succesfully replaced file"
            }

            return res.send(response);
        });
    });
});

/* Delete recording from db */
router.delete('/recording/:file_name', (req, res, next) => {
    let file_name = req.params.file_name;

    if (!file_name|| !ObjectId.isValid(file_name)) {
        res.status(422)
        let error_obj = {
            reason: "Request was missing data",
            data: {
                file_name: !!file_name
            }
        }

        return res.send(error_obj);
    }

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name
    }

    req.S3.deleteObject(s3_opts, (err, data) => {
        if (err) {
            console.log(err); // TODO same as other places - do proper error handling in the app.js file
            return next(err);
        }

        const query = {
            filter: {
                file_name: new ObjectId(file_name)
            },
            update: {
                $set: {
                    deleted: true
                }
            }
        }
        req.mongo_client.collection('recordings').updateOne(query.filter, query.update, (err, result) => {
            if (err) {
                console.log(err);
                return next(err);
            }

            const response = {
                status: 0,
                message: "succesfully deleted file"
            }

            return res.send(response);
        });
    })
});

/* Set a rating for a recording*/
router.put('/recording/:file_name/rate/:rating', (req, res, next) => {
    let rating = req.params.rating;
    let file_name = req.params.file_name;

    if (!rating || !ObjectId.isValid(file_name)) {
        res.status(422)
        let error_obj = {
            reason: "Request was missing data, or the data was invalid",
            data: {
                file_name: file_name,
                rating: rating
            }
        }

        return res.send(error_obj);
    }

    const query = {
        filter: {
            file_name: new ObjectId(file_name)
        },
        update: {
            $set: {
                rating
            }
        }
    }

    req.mongo_client.collection('recordings').updateOne(query.filter, query.update, (err, result) => {
        if (err) {
            console.log(err);
            return next(err);
        }

        const response = {
            status: 0,
            message: "succesfully rated file"
        }

        return res.send(response);
    });
});

/*  */

module.exports = router;
