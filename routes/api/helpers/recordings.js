'use strict'

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

        let amount = result[0].rating_amount;
        const get_query = {
            rating_amount: amount
        };

        req.mongo_client.collection('recordings').find(get_query).toArray((error, get_result) => {
            if (error) {
                return next(error);
            }

            state.recordings = get_result;

            next();
        });
    });
}

const getRatingExtremes = (state, next) => {

}

module.exports = {
    getWithFewestRatings
}
