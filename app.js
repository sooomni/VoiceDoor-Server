var createError = require('http-errors');
var favicon = require('serve-favicon')
var bodyParser = require('body-parser');
//jws secret key 발급하는 모듈
var jwt = require('jsonwebtoken');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//현재 작업중인 js
var main = require('./routes/main');
var member = require('./routes/member');
var doorlock = require('./routes/doorlock');
var otp = require('./routes/otp');
var config = require('./config/secretkey_config.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('jwt-secret', config.secret); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/main', main);
app.use('/member', member);
app.use('/doorlock', doorlock);
app.use('/otp', otp);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
