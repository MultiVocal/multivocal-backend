'use strict';

const express = require('express');
const router = express.Router();
const ObjectId   = require('mongodb').ObjectId;

router.get('/:set_id', (req, res, next) => {
    const set_id = req.params.set_id;

    const query = {
        set_id: new ObjectId(set_id)
    };

    req.mongo_client.collection('transcriptions').find(query).toArray((err, result) => {
        if (err) {
            return next(err);
        }

        if (!result || result.length === 0) {
            return next(new Error("No transcriptions found for that set"));
        }

        const response = {
            status: 0,
            result
        }

        return res.send(response);
    });
})


module.exports = router;
