var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('pages/index');
});

router.get('/about', function(req, res, next) {
    res.render('pages/about');
});

router.get('/contact', function(req, res, next) {
    res.render('pages/contact');
});

router.get('/events', function(req, res, next) {
    res.render('pages/events');
});

router.get('/contribute-voice', function(req, res, next) {
    res.render('pages/contribute-voice');
});

router.get('/rate-voices', function(req, res, next) {
    res.render('pages/rate-voices');
});

module.exports = router;