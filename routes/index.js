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

module.exports = router;
