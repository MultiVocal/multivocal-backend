'use strict';

const express             = require('express');
const router              = express.Router();
const multer              = require('multer');
const upload              = multer();
const aws_sdk             = require('aws-sdk');
const Chains              = require('c4s');
const ObjectId            = require('mongodb').ObjectId;
const aws_config          = require('../../configs/aws_credentials.json');
const helpers             = require('./helpers.js');

const upload_recording    = require('./helpers/recordings/upload_recording.js');
const get_next_recording  = require('./helpers/recordings/get_next_recording.js');


/* Post transcription to the database */
router.post('/recording', upload.single('file'), (req, res, next) => {
    let state = {
        req,
        aws_config
    }

    Chains(state)
        .then(upload_recording.validateRecording)
        .then(upload_recording.uploadFileToS3)
        .then(upload_recording.createRecordingObject)
        .then(upload_recording.insertRecordingInDb)
        .then(upload_recording.reportUploadToSlack)
        .then((state, next) => {
            res.send(state.upload_response);
        })
        .catch((error, state) => {
            next(error);
        });
});

router.get('/recordings/next', (req, res, next) => {
    // TODO figure out a good way of fetching the next recording to fetch
    // It should be based on two things:
    // 1. How many ratings does it have
    // 2. How extreme are the ratings (both positive and negative)
    // Figure out the ratios and stuff
    // We'll be using the field "rating_amount" for recordings to sort by.
    // We need to add an index for it in mongo, as well as a script for doing it on new deployments.
    //
    // Also, at a later point we might want to be able to choose from
    // transcription_sets & location

    let state = {
        req
    }

    Chains(state)
        // TODO needs a validation function
        .then(get_next_recording.getWithFewestRatings)
        .then(get_next_recording.getRatingExtremes)
        .then((state, next) => {
            res.send(state.next_recording)
        })
        .catch((error, state) => {
            next(error);
        });
});

/* Get transcription from db */
router.get('/recordings/:transcription_id', (req, res, next) => {
    let transcription_id = req.params.transcription_id;
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

/* GET file names for all recordings */
router.get('/recordings', (req, res, next) => {
    req.mongo_client.collection('transcriptions').find({}).toArray((err, _transcriptions) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        let transcriptions = _transcriptions;

        req.mongo_client.collection('recordings').find({}).toArray((err, _recordings) => {
            if (err) {
                // TODO error handling
                console.log(err)
                return next(err);
            }

            let recordings = _recordings;

            transcriptions = transcriptions.map((t) => ({
                transcription_id: t.transcription_id,
                recordings: recordings.filter((r) => t.transcription_id === r.transcription_id)
            }));

            let response = {
                status: 0,
                data: {
                    transcriptions
                }
            }

            return res.send(response);
        });
    });
});

/* Edit recording */
router.put('/recording/:file_name/edit', upload.single('file'), (req, res, next) => {
    let file      = req.file || req.body.file;
    let file_name = req.params.file_name;

    // Validate params
    if (!file_name || !file) {
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
                file_name: file_name
            },
            update: {
                $set: {
                    last_edited: new Date()
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

    if (!file_name) {
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
                file_name: file_name
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

    if (!rating || !file_name) {
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
            file_name: file_name
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

/* Verify recording*/
router.put('/recording/:file_name/verify', (req, res, next) => {
    let file_name = req.params.file_name;

    if (!file_name) {
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
            file_name: file_name
        },
        update: {
            $set: {
                verified: true
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
            message: "succesfully verified recording"
        }

        return res.send(response);
    });
});



/*  */

module.exports = router;
