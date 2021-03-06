var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var mongoConfig = require('./configs/db.js').mongo;
var aws_sdk = require('aws-sdk');
var aws_config = require('./configs/aws_credentials.json');
var db = require('./db.js');
var ejsLayouts = require("express-ejs-layouts");

var recording = require('./routes/api/recording');
var transcriptions = require('./routes/api/transcriptions');
var error_reporter = require('./error_reporter')


var app = express();

var logging_format = (process.env.NODE_ENV === 'development') ? 'dev' : 'combined';

app.use(express.static(__dirname + '/public'));
app.use(ejsLayouts);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(logging_format));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
     setupMongo((err, mongo) => {
         req.mongo_client = mongo;
         return next();
    });
});

app.use(function(req, res, next) {
    setupS3((err, s3_client) => {
        req.S3 = s3_client;
        return next();
    });
});

// Backend paths
app.use('/api', recording);
app.use('/transcriptions', transcriptions);

// Frontend paths
var pages = require('./routes/frontend/pages.js');
app.use('/', pages);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  err.path   = req.path;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err.stack);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);

  error_reporter.reportErrorToSlack(err)
});

const setupMongo = (callback) => {
    // Setup mongo connection pool

    var mongoUrl = `mongodb://${mongoConfig.user}:${mongoConfig.pwd}@localhost:${mongoConfig.port}/${mongoConfig.db}`;

    if (process.env.NODE_ENV === 'development') {
        mongoUrl = `mongodb://localhost:${mongoConfig.port}/${mongoConfig.db}`;
    }


    db.connect(mongoUrl, function(err){
        if (err) {
            console.log("Failed to connect to db!");
            return callback(err);
        }

        return callback(undefined, db.get());
    });
}

const setupS3 = (callback) => {
    // Setup aws client
    // if (process.env.NODE_ENV === 'development') {
        aws_sdk.config.loadFromPath('./configs/aws_credentials.json') || {};
    // }

    var s3_client = new aws_sdk.S3();
    return callback(undefined, s3_client)
}

module.exports = app;
