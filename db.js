'use strict'

const MongoClient = require('mongodb').MongoClient;

let state = {
    db: null
}

const connect = (url, callback) => {
    if (state.db) {
        return callback();
    }

    MongoClient.connect(url, (err, db) => {
        if (err) {
            return callback(err);
        }

        state.db = db;
        callback();
    });
}

const get = () => {
    return state.db;
}

const close = (callback) => {
    if (state.db) {
        state.db.close((err, result) => {
            if (err) {
                return callback(err);
            }

            state.db = null;
            callback();
        })
    }
}

module.exports = {
    connect: connect,
    get: get,
    close: close
}
