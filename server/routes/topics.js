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

var datetime = require('node-datetime');


if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
  
}


const ref=firebase.database().ref('quizinga');

var topicsRef=ref.child('topics');

var follows=ref.child('follows');

var client="../client";
const get = require('simple-get');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.user!=null)
  res.sendFile('/topics.html',{ root: client });
  else
  res.sendFile('/error.html',{ root: client });
});

router.get('/mytopics',function(req,res,next){

  var topicdata;
  var topics=[];
  var scoresRef=ref.child('topics');    //users topics
  console.log(req.session.passport.user.emails[0].value);
  ref.child("topics").orderByChild("user").equalTo(req.session.passport.user.emails[0].value).once("value",snapshot => {
    var userData = snapshot.val();
    //console.log(userData);
    for(key in snapshot.val()){
      console.log(userData[key]);
      topicdata={
        name: userData[key].name,
        type: userData[key].type
      };
      //console.log(topicdata);
      topics.push(topicdata);
    }
    //console.log(topics);
    res.send(topics);
  });
});

function topicexists(toadd,ref){      //topic exists or not
  return new Promise(function(resolve,reject){
    ref.child("topics").child(toadd.user.toUpperCase()+toadd.type)
    .once("value",function(snapshot){
      if(snapshot.val()){
        resolve(true);
      }else{
        resolve(false);
      }
    });
  });
}

router.post('/addmytopic',function(req,res,next){     //adding user's own quiz
  ref.child("users").orderByChild("email").
  equalTo(req.session.passport.user.emails[0].value).once("value",function(snapshot){
    var data=snapshot.val();
    var email;
    var name;
    console.log(data);
    for(key in snapshot.val()){     //getting username and user email
      email=data[key].email;
      name=data[key].name;
      console.log(name+ " " +email);
    }
    var em=email;
    var toadd={
      user: email.substring(0,email.indexOf("@")),
      type: req.body.type,
      name: name
    };
    console.log("trim: ",toadd);
    topicexists(toadd,ref).then(function(status){
      console.log(status);
      if(!status){
      console.log("to add is: ", toadd);    //adding quiz in topic
      var topicadd=topicsRef.child(toadd.user.toUpperCase()+toadd.type);
      topicadd.set({
        username: req.user.displayName,
        user: em,
        name: toadd.name.toUpperCase(),
        type: toadd.type
      },function(error){
          console.log(error);
      });
      var add={
        name: toadd.user.toUpperCase(),
        type: toadd.type
      };
      req.session.topic=add;
      res.send("added");
    }else{
      res.send("not added");
    }
    });
    
  });
});

router.get('/yourtopics', function(req, res, next) {
  if(req.user!=null)
  res.sendFile('/yourtopics.html',{ root: client });
  else
  res.sendFile('/error.html',{ root: client });
});

router.get('/getalltopics',function(req,res,next){
  var topicdata;
  var topics=[];
  ref.child("topics").once("value",snapshot => {    //get all topics
    var topicData = snapshot.val();
    //console.log(topicData);
    for(key in snapshot.val()){         //iterating
      //console.log(topicData[key]);
      if(topicData[key].type=="public" || topicData[key].type=="private"){
        continue;
      }
      topicdata={
        desc: topicData[key].description,
        name: topicData[key].name,
        type: topicData[key].type
      };
      //console.log(topicdata);
      topics.push(topicdata);     //making an array of all topics
    }
    console.log(topics);
    res.send(topics);
  });
});

//ajax call's response that a specific topic exists or not before
router.get('/existsornot',function(req,res,next){
  var que=req.query.str;
  que=que.toUpperCase();
  ref.child("topics").orderByChild("name").equalTo(que).once("value",snapshot => {
      const userData = snapshot.val();
      if (userData){
        console.log("exists!");
        res.send("The topic exists already!");
      }else{
          res.send("Can add this topic");
      }
  });
});

router.get('/alltopics', function(req, res, next) {
  if(req.user!=null)
  res.sendFile('/alltopics.html',{ root: client });
  else
  res.sendFile('/error.html',{ root: client });
});

//follow topic
router.post('/followtopic',function(req,res,next){
  console.log(req.body.topic);
  var top=req.body.topic;
  var ema=req.user.emails[0].value;
  ema=ema.substring(0,ema.indexOf("@"));
  var tofollow=follows.child(ema+top);
  tofollow.once("value",function(snapshot){
    if(snapshot.numChildren()>0){
      tofollow.remove(function(err){
        if(err){
          console.log(err.message);
          res.send("can't unfollow");
        }else{
          res.send("Unfollowed");
        }
      });
    }else{
      var dt = datetime.create();
      var formatted = dt.format('d/m/Y H:M:S');
      tofollow.set({
        topic: top,
        user: req.user.emails[0].value,
        follow_date: formatted
      },function(err){
        if(err){
        console.log(err.message);
        res.send("not followed");
        }
        else{
          res.send("Followed");
        }
      });
    }
  });
});

router.post('/addimage',upload.any(),function(req,res,next){
    var date=Date.now();
    //console.log(req.files);
    if(req.files!=[] || req.files!=null){
        var topic=req.body.topic;
        console.log(req.body);
        var desc=req.body.desc;
        var type=req.body.type;
        var topicname=req.body.topicname;
        var img=req.body.img;
        console.log(type);
        console.log(topicname);
        if(topicname=="undefined" || type=="undefined" || desc=="undefined"){
          console.log("topic not added");
          res.send("not added");
        }
        else if(img=='undefined'){
          console.log("No image selected");
          res.send("add an image for the topic");
        }
        else{
          ref.child("topics").child(topicname.toUpperCase()+type).once("value",snapshot => {
            const userData = snapshot.val();
            if (userData){
              console.log(userData);
              console.log("exists!");
              res.send("not added");
            }
          
            else{
              var topicadd=topicsRef.child(topicname.toUpperCase()+type);
              console.log("not exists!");
                topicadd.set({
                username: req.user.displayName,
                user: req.user.emails[0].value,
                name: topicname.toUpperCase(),
                type: type,
                description: desc
              },function(error){
                  console.log(error);
              });
              var toadd={
                  name: topicname.toUpperCase(),
                  type: type
              };
              req.session.topic=toadd;
              var file=req.files;
              var filename="topic";
              if(file[0]!=null)
              fs.rename(file[0].path,'public/images/topics/'+toadd.name+type+".jpg",function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
                res.send("topic added successfully");   
            });
          }
          });
        }
  }
  });
  

module.exports = router;