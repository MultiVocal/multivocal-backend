'use strict'

const aws_config = require('./../../../../configs/aws_credentials.json');
const utils      = require('./utils.js');

/**
 * Adds the recordings with fewest ratings to state.recordings
 * @param  state.req
 */
const getWithFewestRatings = (state, next) => {
    const req = state.req;

    const query = [{
        $group:
            {
                _id: {},
                rating_amount: { $min: "$rating_amount" }
            }
        }
    ]

    req.mongo_client.collection('recordings').aggregate(query, (error, result) => {
        if (error) {
            return next(error);
        }

        if (!result || !result[0]) {
            return next(new Error("No recordings to be rated"));
        }

        let amount = result[0].rating_amount;
        const get_query = {
            rating_amount: amount
        };

        req.mongo_client.collection('recordings').find(get_query).toArray((error, get_result) => {
            if (error) {
                return next(error);
            }

            if (get_result.length === 1) {
                state.next_recording = get_result;
                return next();
            }

            state.recordings = get_result;

            next();
        });
    });
}

/**
 * Inserts the recording with the most extreme rating value into state.next_recording
 * @param  state.recordings
 */
const getRatingExtremes = (state, next) => {
    let recordings = state.recordings;

    // THIS VARIABLE DECIDE THE GLOBAL MAX VALUE
    // THIS SHOULD BE MOVED TO A CONFIG,
    const GLOBAL_MAX = 1.0;
    const mid_value  = GLOBAL_MAX / 2;

    if (!!state.next_recording) {
        return next();
    }

    if (!recordings[0].rating || recordings[0] === 0) {
        // If recordings have not yet been rated, get random.
        state.next_recording = utils.getRandomRecording(recordings);
        return next();
    }

    // Get recordings with most extreme rating.
    recordings.sort((a, b) => {
        return a.rating - b.rating;
    });

    let max_recording = recordings[recordings.length -1];
    let min_recording = recordings[0];


    // Get the value furthest from the center value
    const max_diff = Math.abs(mid_value - max_recording.rating);
    const min_diff = Math.abs(mid_value - min_recording.rating);

    if (max_diff === min_diff) {
        state.next_recording = utils.getRandomRecording(recordings);
        return next();
    }

    state.next_recording = (min_diff < max_diff) ? max_recording : min_recording;

    next();
}

const fetchFileFromS3 = (state, next) => {
    const req = state.req;

    let next_recording = state.next_recording;

    console.log(next_recording)
    const file_name = next_recording.file_name;

    const params = {
        Key: file_name,
        Bucket: aws_config.Bucket
    }

    req.S3.getObject(params, function(err, data) {
        if (err) {
            return next(err);
        }

        state.next_recording.file = data;

        state.recording_response = {
            status: 0,
            data: state.next_recording
        }

        next();
    })

};



module.exports = {
    getWithFewestRatings,
    getRatingExtremes,
    fetchFileFromS3
}
