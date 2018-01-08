var express = require('express');
var router = express.Router();
var base64Img = require('base64-img');
var multer  = require('multer')
var upload=multer({dest: 'uploads/'});
var fs=require("fs");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
router.use(bodyParser.json());
var firebase=require('firebase');

var passport=require('passport');

require('../config/passport')(passport);

var client="../client";

var client="../client";


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

var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

var ref=firebase.database().ref('node-client');
var messagesRef=ref.child('messages');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//user loging out
router.get('/logout', function(req, res, next) {

  if(req.session.passport!=undefined)
  {
    req.session.topic=null;
    req.session.passport.user = null;
    res.sendFile('/index.html',{ root: client });
}
  else{
    res.sendFile('/index.html',{ root: client });
  }
  //console.log(req.session.topicname + req.session.passport.user);
});


//sign in with google
router.get('/auth/google',passport.authenticate('google', {scope: ['email', 'profile']}));
router.get('/auth/google/callback',

passport.authenticate('google',{ successRedirect:'/home',failureRedirect:'/'}));

//sign in with facebook
router.get('/auth/facebook',passport.authenticate('facebook', {scope: ['email', 'user_friends']}));
router.get('/auth/facebook/callback',

passport.authenticate('facebook',{ successRedirect:'/home',failureRedirect:'/'}));


module.exports = router;