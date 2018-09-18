var express = require('express');
var router = express.Router();


router.get('/',
  function(req, res) {
    if (!req.user) {
      res.redirect('/login');
    } else {
      // res.redirect('/profile');
      res.redirect('/main');
    }
  }
);

router.get('/login', function(req, res) {
  res.render('login.html')
}
);

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


/* GET home page. */
router.get('/main', function(req, res, next) {
  res.render('mainOn', { title: 'Express' });
});

/* GET home page. */
router.get('/chart', function(req, res, next) {
  res.render('charts', { title: 'Express' });
});

/* GET home page. */
router.get('/map', function(req, res, next) {
  res.render('naverMap', { title: 'Express' });
});

var schedule = require('node-schedule');
var request = require('request');
router.post('/reserve', function(req, res, next) {
  
  var date = new Date(req.body.reserve);
  date.setSeconds(date.getSeconds() + 10);

  var j = schedule.scheduleJob(date, function(){
    // console.log('The world is going to end today.');
    request.post('/action');
  });

  res.json( { "status": 'success' });
});


module.exports = router;
