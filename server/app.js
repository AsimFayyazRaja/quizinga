var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var firebase=require('firebase');
var index = require('./routes/index');
var users = require('./routes/users');
var questions=require('./routes/questions');
var home=require('./routes/home');
var topics=require('./routes/topics');
var profile=require('./routes/profile');
var posts=require('./routes/posts');
var secret='blekh';
var session = require('express-session');
var quiz = require('./routes/quiz');

var passport=require('passport');

var cookieSession = require('cookie-session');



if (!firebase.apps.length) {
  var config = {
    apiKey: "AIzaSyA4U-gkLkujV47jEt3ZAkv25iLpCh1LCIc",
    authDomain: "quizinga-183118.firebaseapp.com",
    databaseURL: "https://quizinga-183118.firebaseio.com",
    projectId: "quizinga-183118",
    storageBucket: "quizinga-183118.appspot.com",
    messagingSenderId: "513426237704"
  };
  firebase.initializeApp(config);
    
}


var way="/home/asim/Desktop/MEAN/quizinga/client/";

var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());

var engines = require('consolidate');
app.use(express.static(way));
app.engine('html', engines.mustache);

app.use(session({secret: "huihui", resave: true, saveUninitialized: true}));

app.use(passport.initialize());

app.use(passport.session());

app.use(bodyParser.json());


var ref=firebase.database().ref('node-client');
var messagesRef=ref.child('messages');
/*
messagesRef.push({
  name: 'Asima',
  admin: true,
  count: 2,
  text: 'Sup dude?'
});
*/
// view engine setup


app.use(function(req,res,next){
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With, Content-Type,Accept,Authorization,sid*");
  res.header("Access-Control-Allow-Methods"," POST, GET, OPTIONS, DELETE, PUT");
next();
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
var client= "../client";
app.use(express.static(path.join(__dirname, client)));

app.use('/', index);
app.use('/users', users);
app.use('/questions', questions);
app.use('/topics', topics);
app.use('/profile', profile);
app.use('/quiz', quiz);
app.use('/posts', posts);


app.use('/home', home);

app.use('/home',function(req,res,next){
  res.sendFile('/home.html',{root: client});
});

app.use('/test',function(req,res,next){
  res.sendFile('/test.html',{root: client});
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
var server = app.listen(8000,function(){
  console.log("Server is running");
});


module.exports = app;