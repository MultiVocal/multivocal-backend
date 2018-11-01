'use strict';

const express = require('express');
const router = express.Router();
const ObjectId   = require('mongodb').ObjectId;

router.get('/', (req, res, next) => {

    var randomNumber = Math.floor(Math.random() * (500 - 1 + 1)) + 1;
    req.mongo_client.collection('transcriptions').find().limit(-1).skip(randomNumber).toArray((err, result) => {
        if (err) {
            return next(err);
        }

        if (!result || result.length === 0) {
            return next(new Error('No transcriptions found'));
        }

        const response = {
            status: 0,
            message: result
        }

        return res.send(response);
    });
})

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
