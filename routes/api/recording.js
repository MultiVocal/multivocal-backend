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

const upload_recording                = require('./helpers/recordings/upload_recording.js');
const get_next_recording              = require('./helpers/recordings/get_next_recording.js');
const get_recordings_by_transcription = require('./helpers/recordings/get_recordings_by_transcription.js');
const get_all_recordings              = require('./helpers/recordings/get_all_recordings.js');
const edit_recordings                 = require('./helpers/recordings/edit_recording.js');
const delete_recording                = require('./helpers/recordings/delete_recording.js');


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

/* Get recordings based on transcription_id from db */
router.get('/recordings/transcription/:transcription_id', (req, res, next) => {
    let state = {
        req
    }

    Chains(state)
        .then(get_recordings_by_transcription.validateId)
        .then(get_recordings_by_transcription.fetchRecordings)
        .then((state, next) => {
            res.send(state.recordings_response)
        })
        .catch((error, state) => {
            next(error);
        });
});

/* GET file names for all recordings */
router.get('/recordings', (req, res, next) => {
    let state = {
        req,
        mongo_client: req.mongo_client
    }

    Chains(state)
        .then(get_all_recordings.getAllTranscriptions)
        .then(get_all_recordings.getAllRecordings)
        .then(get_all_recordings.mapRecordings)
        .then((state, next) => {
            res.send(state.recordings_response)
        })
        .catch((error, state) => {
            next(error);
        });
});

/* Edit recording */
router.put('/recording/:file_name/edit', upload.single('file'), (req, res, next) => {
    let state = {
        req,
        aws_config,
        mongo_client: req.mongo_client
    }

    Chains(state)
        .then(edit_recordings.verifyEdit)
        .then(edit_recordings.uploadFileToS3)
        .then(edit_recordings.updateFileInDB)
        .then((state, next) => {
            res.send(state.recordings_response)
        })
        .catch((error, state) => {
            next(error);
        });
});

/* Delete recording from db */
router.delete('/recording/:file_name', (req, res, next) => {
    let state = {
        req,
        aws_config,
        mongo_client: req.mongo_client
    }

    Chains(state)
        .then(delete_recording.verifyDeleteRecording)
        .then(delete_recording.removeFromS3)
        .then(delete_recording.removeFromDb)
        .then((state, next) => {
            res.send(state.delete_response)
        })
        .catch((error, state) => {
            next(error);
        });
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
