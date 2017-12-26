var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('pages/index');
});

router.get('/about', function(req, res, next) {
    res.render('pages/about');
});

router.get('/contribute-voice', function(req, res, next) {
    res.render('pages/contribute-voice');
});

module.exports = router;