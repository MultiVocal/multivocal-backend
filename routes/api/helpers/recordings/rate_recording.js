'use strict';

const verifyRateRecording = (state, next) => {
    const req = state.req;

    let rating = req.body.new_rating;
    let file_name = req.body.file_name;

    if (!rating || !file_name) {
        let error_obj = {
            reason: "Request was missing data, or the data was invalid",
            data: {
                file_name: file_name,
                rating: rating
            }
        }

        error_obj.status = 422;

        return next(error_obj);
    }

    state.rating = req.body.new_rating;
    state.file_name = req.body.file_name;

    next();
}

    const addRatingToDb = (state, next) => {
    const file_name    = state.file_name;
    const mongo_client = state.mongo_client;
    const rating       = state.rating;

    const query = {
        filter: {
            file_name: file_name
        },
        update: {
            $set: {
                rating
            },
            $inc: {
                rating_amount: 1
            }
        }
    }

    mongo_client.collection('recordings').updateOne(query.filter, query.update, (err, result) => {
        if (err) {
            console.log(err);
            return next(err);
        }

        state.rate_response = {
            status: 0,
            message: "succesfully rated file"
        }

        next();
    });
}

module.exports = {
    verifyRateRecording,
    addRatingToDb
};
