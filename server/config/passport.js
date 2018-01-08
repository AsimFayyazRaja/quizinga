var configAuth=require('./auth');
var FacebookStrategy=require('passport-facebook').Strategy;
var firebase=require('firebase');
var GoogleStrategy=require('passport-google-oauth').OAuth2Strategy;
var path = require('path');
const download = require('image-downloader')
var passport=require('passport');
var easyimg = require('easyimage');
var Jimp = require("jimp");

if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
}
var ref=firebase.database().ref('quizinga');
var users=ref.child('users');

module.exports=function(passport){


  passport.serializeUser(function(user, done) {
    //console.log("serialize USER",user);
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    //console.log("deserialize USER",user);
    done(null, user);
  });

  //fb sign-in
passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function(){
      console.log("the user's fb credentials are:  ");
      console.log(profile);   //store the user here in session or firebase or whatever

      //check if user exists or not
      ref.child("users").orderByChild("email").equalTo(profile.emails[0].value).once("value",snapshot => {
        const userData = snapshot.val();
        if (userData){
          console.log(userData);
          console.log("exists!");
        }
        else{
          users.push({
            email: profile.emails[0].value,
            name: profile.displayName,
          });

          console.log("not exists, new created");
          var imageurl="https://graph.facebook.com/" + profile.id +"/picture?width=9999";
          //taking img from fb and storing to local storage
            var destii= path.join(__dirname, '../public/images/dps/' + profile.emails[0].value + ".jpg");
            console.log(destii);
            var options = {
            url: imageurl,
            dest: destii        // Save to images stock with username's email as filename
          }
          download.image(options)
            .then(({ filename, image }) => {
              console.log('File saved to', filename);
            }).catch((err) => {
              throw err
            });
        }
        return done(null,profile);
    });
    });
  }
));

//google sign-in
//make google images correct
passport.use(new GoogleStrategy({
    clientID: configAuth.googleAuth.clientID,
    clientSecret: configAuth.googleAuth.clientSecret,
    callbackURL: configAuth.googleAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function(){
      console.log("the user's google credentials are:  ");
      console.log(profile);   //store the user here in session or firebase or whatever

      var destiii= path.join(__dirname, '../public/images/dps/' + profile.emails[0].value + ".jpg");
      console.log(destiii);
      var options = {
      url: profile.photos[0].value,
      dest: destiii        // Save to images stock with username's email as filename
    }
    download.image(options)
      .then(({ filename, image }) => {
        console.log('File saved to', filename);

      }).catch((err) => {
        throw err
      });

      //check if user exists or not
      ref.child("users").orderByChild("email").equalTo(profile.emails[0].value).once("value",snapshot => {
        const userData = snapshot.val();
        if (userData){
          console.log(userData);
          console.log("exists!");
        }
        else{
          users.push({
            email: profile.emails[0].value,
            name: profile.displayName,
          });
          console.log("not exists, new created");
        }
    });
      return done(null,profile);  
    });
  }
));


};