'use strict';

const ObjectId = require('mongodb').ObjectId;

const validateId = (state, next) => {
    const req = state.req;

    if (!req.params || !req.params.transcription_id) {
        let error = new Error('Missing or invalid transcription_id query parameter');
        error.status(400);
        return next(error)
    }

    state.transcription_id = req.params.transcription_id
    state.mongo_client     = req.mongo_client;
    next();
}

const fetchRecordings = (state, next) => {
    const mongo_client     = state.mongo_client;
    const transcription_id = state.transcription_id;

    const query = {
        transcription_id,
        deleted: {
            $ne: true
        }
    }

    mongo_client.collection('recordings').find(query).toArray((error, recordings) => {
        if (error) {
            // TODO error handling
            console.log(error)
            return next(err);
        }

        state.recordings_response = {
            status: 0,
            data: {
                transcription_id,
                files: recordings.map(t => t.file_name)
            }
        }
        
        next();
    });
}

module.exports = {
    validateId,
    fetchRecordings
}
