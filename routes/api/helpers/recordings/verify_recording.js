'use strict'

const verifyVerificationRequest = (state, next) => {
    const req     = state.req;
    let file_name = req.params.file_name;

    state.file_name = file_name;

    if (!file_name) {
        res.status(422)
        let error_obj = {
            reason: "Request was missing data, or the data was invalid",
            data: {
                file_name: file_name,
                rating: rating
            }
        }

        return next(new Error(error_obj))
    }
    next();
};

const postVerification = (state, next) => {
    const req       = state.req;
    const file_name = state.file_name;

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
}

module.exports = {
    verifyVerificationRequest,
    postVerification
}
