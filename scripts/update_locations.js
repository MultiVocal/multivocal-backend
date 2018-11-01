// ObjectId("59a4630e91338a44c768ba3f")
'use strict'

const MongoClient = require('mongodb').MongoClient;
const ObjectId    = require('mongodb').ObjectId
const mongoConfig = require('../configs/db.js').mongo;
const db = require('../db.js');

const location_id = new ObjectId('59a4630e91338a44c768ba3f');

let database = null;

// Connect to mongo
var mongoUrl = `mongodb://localhost:${mongoConfig.port}/${mongoConfig.db}`;

db.connect(mongoUrl, function(err){
    if (err) {
        console.log("Failed to connect to db!");
        process.exitCode = 1;
    }

    database = db.get();

    updateLocation(location_id);
});

const insertData = (objects) => {
    if (objects.length === 0) {
        console.log("Finished inserting documents");
        process.exitCode = 0;
    }

    let current_obj = objects.pop();

    database.collection('transcriptions').insert(current_obj, (err, result) => {
        if (err) {
            console.log(`Failed to insert document with transcription_id: ${current_obj.transcription_id}`)
        }

        insertData(data);
    })
}
