var ArtikCloud = require('artikcloud-js');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2').Strategy;
var fs = require('fs');
var express = require('express');
var nunjucks = require('nunjucks');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('node-uuid');
var async = require('async');

var routes = require('./routes/index');
// var users = require('./routes/users');
var artik = require('./routes/artik');


//
// Configuration
//
try {
    var file = fs.readFileSync("config.json", "utf8");
    var config = JSON.parse(file);

    if (config.debug) {
      console.log(JSON.stringify(config));
    }

    var deviceTypes = config.devices;

    if (config.debug) {
      console.log(deviceTypes);
    }
} catch(e) {
    console.error("File config.json not found or is invalid. " + e);
    process.exit(1);
}

//
// ArtikCloud OAuth2 Setup
// Create an Application with the callback URL: http://localhost:4444/login/artikcloud/callback
// Copy the clientID and clientSecret in config.json
//
passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: 'https://accounts.artik.cloud/authorize',
      tokenURL: 'https://accounts.artik.cloud/token',
      clientID: config.oauth.clientID,
      clientSecret: config.oauth.clientSecret,
      callbackURL: config.oauth.callbackURL
    },
    function(accessToken, refreshToken, profile, callback) {
      console.log(accessToken + ", " + refreshToken);
      var _defaultClient = new ArtikCloud.ApiClient();
      _defaultClient.authentications['artikcloud_oauth'].accessToken = accessToken;
      var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
      _usersApi.getSelf(
        // User info found
        function (error, user) {
          if (error) {
            console.log("Couldnt retrieve User Profile: " + error);
            callback(error, null);
          } else {
            // Store the User Profile with the Tokens in the callback data
            var data = user.data;
            data.accessToken = accessToken;
            data.refreshToken = refreshToken;
            console.log("data");
            console.log(JSON.stringify(data));
            if (config.debug) {
              console.log("Got User information: " + JSON.stringify(data));
            }
            callback(null, data);
          }
        }
      );
    }
  )
);

passport.serializeUser(function(user, callback) {
  callback(null, user);
});

passport.deserializeUser(function(obj, callback) {
  callback(null, obj);
});

var app = express();

// view engine setup
app.use(express.static('public'))
nunjucks.configure('views', {
  autoescape: false,
  express: app,
  watch: true,
  noCache: true
});

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  genid: function(req) {
    return uuid.v1() // use UUIDs for session IDs
  },
  resave: false,
  saveUninitialized: true,
  secret: config.sessionSecret,
  cookie: {} // secure cookies should be enabled with https
}));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());


app.get('/login/artikcloud', passport.authenticate('oauth2'));

app.get('/login/artikcloud/callback',
passport.authenticate('oauth2', { failureRedirect: '/login/artikcloud'}),
function(req, res) {
  res.redirect('/');
}
);

// var test =artik(passport);
//url관점에서 모듈화
app.use('/', artik);
app.use('/', routes);
// app.use('/', test);

// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.html', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error.html', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
