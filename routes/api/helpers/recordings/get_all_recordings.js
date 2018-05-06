'use strict'

const getAllTranscriptions = (state, next) => {
    const mongo_client = state.mongo_client;

    mongo_client.collection('transcriptions').find({}).toArray((err, transcriptions) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        state.transcriptions = transcriptions;
        next();
    });
}

const getAllRecordings = (state, next) => {
    const mongo_client = state.mongo_client;

    mongo_client.collection('recordings').find({}).toArray((err, recordings) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        state.recordings = recordings;
        next();
    });
}

const mapRecordings = (state, next) => {
    const transcriptions = state.transcriptions;
    const recordings     = state.recordings;

    let recording_map = transcriptions.map((t) => ({
        transcription_id: t.transcription_id,
        recordings: recordings.filter((r) => t.transcription_id === r.transcription_id)
    }));

    state.recordings_response = {
        status: 0,
        data: {
            recording_map
        }
    }

    next();
}


module.exports = {
    getAllTranscriptions,
    getAllRecordings,
    mapRecordings
}
