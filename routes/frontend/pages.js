var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('pages/index');
});

router.get('/about', function(req, res, next) {
    res.render('pages/about');
});

module.exports = router;