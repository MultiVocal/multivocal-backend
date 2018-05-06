'use strict';

const ObjectId = require('mongodb').ObjectId;
const utils    = require('./utils.js');

const validateRecordingFile = (state, next) => {
    const req = state.req;

    if (!req.file || req.body.file) {
        let error_obj = {
            reason: "Missing data"
        }
        error_obj.status = 422;

        return next(error_obj);
    }

    state.file             = req.file || req.body.file;
    state.S3               = req.S3;

    next();
}

const validateRecordingObject = (state, next) => {
    const req = state.req;

    if (!req.body.transcription_id || !req.body.client_id) {
        let error_obj = {
            reason: "Request was missing data",
            data: {
                transcription_id: transcription_id,
                client_id: client_id
            }
        }
        error_obj.status = 422;

        return next(error_obj);
    }

    state.mongo_client     = req.mongo_client;
    state.transcription_id = req.body.transcription_id;
    state.client_id        = req.body.client_id;
    state.notes            = req.body.notes;
    state.S3               = req.S3;

    next();
}

const uploadFileToS3 = (state, next) => {
    const S3         = state.S3;
    const file       = state.file;
    const aws_config = state.aws_config;
    const file_name  = `${new ObjectId().toString()}.wav`;

    state.file_name  = file_name;

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name.toString(),
        Body: file.buffer
    }

    S3.upload(s3_opts, (err, data) => {
        if (err) {
            return next(err);
        }

        state.upload_response = {
            status: 0,
            message: "succesfully added file",
            file_name
        }

        next();
    });
}

const createRecordingObject = (state, next) => {
    const file_name        = state.file_name;
    const transcription_id = state.transcription_id;
    const notes            = state.notes;
    const client_id        = state.client_id;

    state.recording = {
        file_name,
        transcription_id,
        notes,
        client_id: new ObjectId(client_id),
        upload_time: new Date(),
        verified: false,
        rating: null,
        rating_amount: 0
    }

    next();
}

const insertRecordingInDb = (state, next) => {
    const mongo     = state.mongo_client;
    const recording = state.recording;

    mongo.collection('recordings').insert(recording, (err, result) => {

        if (err) {
            return next(err);
        }

        state.submit_response = {
            status: 0,
            message: "succesfully submitted response"
        }

        next();
    });
}

const reportUploadToSlack = (state, next) => {
    const file_name = state.file_name;
    const S3        = state.S3;

    utils.reportUploadToSlack(file_name, S3, (err, report) => {
        next();
    });
}

module.exports = {
    validateRecordingFile,
    validateRecordingObject,
    uploadFileToS3,
    createRecordingObject,
    insertRecordingInDb,
    reportUploadToSlack
}
