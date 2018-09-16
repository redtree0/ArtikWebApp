var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/main', function(req, res, next) {
  res.render('mainOn', { title: 'Express' });
});

/* GET home page. */
router.get('/chart', function(req, res, next) {
  res.render('messages', { title: 'Express' });
});


module.exports = router;
