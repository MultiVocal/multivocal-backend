'use strict'

const verifyEdit = (state, next) => {
    const req = state.req;

    let file      = req.file || req.body.file;
    let file_name = req.params.file_name;

    // Validate params
    if (!file_name || !file) {
        let error_obj = {
            reason: "Request was missing data",
            data: {
                file_name: file_name,
                file: file
            }
        }

        error_obj.status = 422;

        return next(error_obj);
    }

    state.file      = req.file || req.body.file;
    state.file_name = req.params.file_name;
    state.S3        = req.S3;

    next();
}

const uploadFileToS3 = (state, next) => {
    const S3         = state.S3;
    const file       = state.file;
    const file_name  = state.file_name;
    const aws_config = state.aws_config;

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name,
        Body: file.buffer
    }

    // An upload to an existing key will simply overwrite it
    // TODO: Before uploading, make sure that it already exists?
    S3.upload(s3_opts, (err, data) => {
        if (err) {
            // TODO error handling
            console.log(err)
            return next(err);
        }

        next();
    });
}

const updateFileInDB = (state, next) => {
    const file_name    = state.file_name;
    const mongo_client = state.mongo_client;

    let mongo_query = {
        filter: {
            file_name: file_name
        },
        update: {
            $set: {
                last_edited: new Date()
            }
        }
    }

    // Update document in mongo to have a "last_edited" field
    mongo_client.collection('recordings').update(mongo_query.filter, mongo_query.update, (err, result) => {
        if (err) {
            // TODO: Some sweet error handling
            console.log(err)
            return next(err);
        }

        state.recordings_response = {
            status: 0,
            message: "succesfully replaced file"
        }
    });
}

module.exports = {
    verifyEdit,
    uploadFileToS3,
    updateFileInDB
}
