var express = require('express');
var router = express.Router();
var base64Img = require('base64-img');
var multer  = require('multer')
var upload=multer({dest: 'uploads/'});
var fs=require("fs");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
router.use(bodyParser.json());
var changeCase=require('change-case');
var url = require('url');

var firebase=require('firebase');


if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
}


const ref=firebase.database().ref('quizinga');
const ques=ref.child('questions');

//var quesRef=ques.child('topic + type');

var client="../client";




router.get('/', function(req, res, next) {
    if(req.user!=null &&req)
  res.sendFile('/questions.html',{ root: client });
  else{
    res.sendFile('/error.html',{ root: client });
  }
});

//add ques images and all on FIREBASE.STORAGE
router.post('/upload-que',upload.any(),function(req,res,next){
  var date=Date.now();
  console.log(req.body);
  if(req.files){
    var file=req.files;
    var filename="question";
    if(req.body.type=='question'){
        fs.rename(file[0].path,'public/images/questions/'+req.body.type+date,function(err){
            if(err)throw(err);
            console.log("File uploaded to server");
        });
    }else{
        filename="option";
        fs.rename(file[0].path,'public/images/options/'+req.body.type+date,function(err){
            if(err)throw(err);
            console.log("File uploaded to server");
        });
    }
}
});

//sets up the question page for the user
router.get('/currentcount',function(req,res,next){
    var toreturn={
        topicName: req.session.topic.name,
        topicType: req.session.topic.type,
        count: null
    };
    if(req.session.topic){
        ques.child(req.session.topic.name + req.session.topic.type).once("value", function(snapshot) {
          toreturn.count=snapshot.numChildren() +1;
          console.log(toreturn);
          res.send(toreturn);
        });
    }//else{
       // res.send("notfound");
   // }
});

router.post('/addintopic',function(req,res,next){
    console.log(req.body.topic);
    req.session.topic=req.body.topic;
    res.send("can add now");
});

router.get('/existsornot',function(req,res,next){
    var que=req.query.str;
    que=changeCase.sentenceCase(que);
    que=que+"?";
    ques.child(req.session.topic.name + req.session.topic.type).orderByChild("question").equalTo(que).once("value",snapshot => {
        const userData = snapshot.val();
        if (userData){
          console.log("exists!");
          res.send("The question exists already!");
        }else{
            res.send("Can add this question");
        }
    });
});

//have a record here that where the question is being added, topic name etc.
router.post('/addanew',upload.any(),function(req,res,next){
    if(req.session.topic){
    var date=Date.now();
    var file=req.files;
    var que=req.body.ques;
    var crct=req.body.crct;
    var w1=req.body.wr1;
    var w2= req.body.wr2;
    var w3= req.body.wr3;

    

    if((crct==w1 || crct==w2 || crct==w3 || w1==w2 || w2==w3 || w1==w3 || que==w2 || que==w1 || que==w3 || crct==que) || (que==undefined || crct==undefined || w1==undefined || w2==undefined || w3==undefined))
    {
            console.log("fail");
            res.send("failure");
    }
    else{
    for(var i=0;i<file.length;i++){
        if(file[i].fieldname=="que"){
            fs.rename(file[i].path,'public/images/questions/'+"question"+date,function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
            });
        } else if(file[i].fieldname=="cans"){
            fs.rename(file[i].path,'public/images/options/'+"correct"+date,function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
            });
        } else if(file[i].fieldname=="wrong1"){
            fs.rename(file[i].path,'public/images/options/'+"wrong1"+date,function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
            });
        } else if(file[i].fieldname=="wrong2"){
            fs.rename(file[i].path,'public/images/options/'+"wrong2"+date,function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
            });
        } else if(file[i].fieldname=="wrong3"){
            fs.rename(file[i].path,'public/images/options/'+"wrong3"+date,function(err){
                if(err)throw(err);
                console.log("File uploaded to server");
            });
        }
    }
    
    var quesRef=ques.child(req.session.topic.name + req.session.topic.type);
    var num=0;
    ques.child(req.session.topic.name + req.session.topic.type).once("value",function(snapshot){
        console.log(snapshot.val());
        //console.log(snapshot.numChildren());
        num=snapshot.numChildren();
        console.log(num);
        //console.log(num.toFixed);
        //num=snapshot.numChildren()+1;
        que=changeCase.sentenceCase(que);
        que=que+"?";
        crct=changeCase.sentenceCase(crct);
        w1=changeCase.sentenceCase(w1);
        w2=changeCase.sentenceCase(w2);
        w3=changeCase.sentenceCase(w3);
        quesRef.push({
            number: num,        //unique auto-inrement type key for each question
            question: que,
            correct: crct,
            wrong1: w1,
            wrong2: w2,
            wrong3: w3
          });
        res.send("success");
    });
        
}
    }else{
        res.send("topic error");
    }

});

module.exports = router;
