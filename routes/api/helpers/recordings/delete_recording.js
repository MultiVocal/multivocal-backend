'use strict';

const verifyDeleteRecording = (state, next) => {
    const req     = state.req;
    let file_name = req.params.file_name;

    if (!file_name) {
        let error_obj = {
            reason: "Request was missing data",
            data: {
                file_name: !!file_name
            }
        }

        error_obj.status = 422;

        return next(error_obj);
    }

    state.file_name = req.params.file_name;
    state.S3        = req.S3;

    next();
}

const removeFromS3 = (state, next) => {
    const S3         = state.S3;
    const file_name  = state.file_name;
    const aws_config = state.aws_config;

    let s3_opts = {
        Bucket: aws_config.Bucket,
        Key: file_name
    }

    S3.deleteObject(s3_opts, (err, data) => {
        if (err) {
            console.log(err); // TODO same as other places - do proper error handling in the app.js file
            return next(err);
        }

        next();
    });
}

const removeFromDb = (state, next) => {
    const file_name    = state.file_name;
    const mongo_client = state.mongo_client;

    const query = {
        filter: {
            file_name: file_name
        },
        update: {
            $set: {
                deleted: true
            }
        }
    }

    mongo_client.collection('recordings').updateOne(query.filter, query.update, (err, result) => {
        if (err) {
            console.log(err);
            return next(err);
        }

        state.delete_response = {
            status: 0,
            message: "succesfully deleted file"
        }

        next();
    });
}

module.exports = {
    verifyDeleteRecording,
    removeFromS3,
    removeFromDb
}
