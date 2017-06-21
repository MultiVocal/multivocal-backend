#!/usr/bin/env node

'use strict';

const readline = require('readline');
const aws_sdk = require('aws-sdk');
const aws_config = require('../configs/aws_credentials');
const MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('../configs/db').mongo;

const mongoUrl = `mongodb://localhost:${mongoConfig.port}/${mongoConfig.db}`;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let db = null;
let s3 = null;


rl.question('You are about to clear ALL data from s3 buckets and mongo database.\nType "yes please" if you are SURE that you want to do that: ', (answer) => {
    rl.close();

    if (answer !== 'yes please') {
        process.exit(0);
    }

    MongoClient.connect(mongoUrl, (err, _db) => {
        if (err) {
            return callback(err);
        }

        db = _db;

        let s3_opts = {
            Bucket: aws_config.Bucket
        };

        aws_sdk.config.loadFromPath('./../configs/aws_credentials.json') || {};

        s3 = new aws_sdk.S3();

        s3.listObjects(s3_opts, (err, list) => {
            if (err) {
                console.log("Failed to get list from s3")
                console.log(err);
                return process.exit(1);
            }

            s3_opts.Delete = {
                Objects: []
            };

            list.Contents.forEach((content) => {
                s3_opts.Delete.Objects.push({
                    Key: content.Key
                });
            });

            s3.deleteObjects(s3_opts, (err, data) => {
                if (err) {
                    console.log("Failed to delete files from s3");
                    console.log(err);
                    return process.exit(1);
                }

                // if (data.Contents.length == 1000) emptyBucket(bucketName, callback); // do something like this - S3 can only delete 1000 files at the time

                db.collection('recordings').deleteMany({}, (err, mongoresult) => {
                    if (err) {
                        console.log("Failed to delete files from mongo");
                        console.log(err);
                        return process.exit(1);
                    }

                    console.log("Cleared all data");
                    return process.exit(0);
                });
            });
        })
    });
});
