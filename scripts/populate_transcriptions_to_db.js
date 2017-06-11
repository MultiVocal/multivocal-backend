'use strict'

const MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('../configs/db.js').mongo;
const db = require('../db.js');

// JSON file containing all transcription ids and their text
const data = require('/home/mads/code/fred/voice/txt.done.data.json');

let database = null;

// Connect to mongo
var mongoUrl = `mongodb://localhost:${mongoConfig.port}/${mongoConfig.db}`;

db.connect(mongoUrl, function(err){
    if (err) {
        console.log("Failed to connect to db!");
        process.exitCode = 1;
    }

    database = db.get();

    insertData(data);
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
