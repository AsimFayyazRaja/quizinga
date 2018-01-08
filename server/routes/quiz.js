var express = require('express');
var router = express.Router();
var base64Img = require('base64-img');
var multer  = require('multer')
var upload=multer({dest: 'uploads/'});
var fs=require("fs");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
router.use(bodyParser.json());
var promise=require('Promise');
var rn = require('random-number');
var client="../client";
var sync    = require('synchronize');
var deasync=require('deasync');

var firebase=require('firebase');
var ques;    //all ques of the quiz topic
var indexes=[];   //all indexes of the questions given to the user up till now
var answer;     //answer of the current question
var quecount=0;  //current question number
var correct=0;    //correct answers
var wrong=0;    //wrong answers
var choices=[];   //choices index generated randomnly till yet
var queindices=[];        //random ques number
var tosend={      //question set to send to the client
  question: null,
  options: [0,0,0,0],
  count: 0,
  correct: 0
};

if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
}


const ref=firebase.database().ref('quizinga');
var queRef=ref.child('questions');    //users topics

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.user!=null)
  res.sendFile('/createquiz.html',{ root: client });
  else
  res.sendFile('/error.html',{ root: client });
});


router.get('/givequiz',function(req,res,next){
  console.log(req.query);       //storing in session the name and type of quiz being given
  indexes=[];
  choices=[];
  correct=0;
  req.session.quiztopicname=req.query.topicname;
  req.session.quiztopictype=req.query.topictype;
  queindices=[];
  quecount=0;
  getMaxQuestionNumber(req).then(function(num){
    var arr1=[];
    for(var x=0;x<=num;x++){
      arr1[x]=x;
    }
    queindices=getRand(arr1);
    console.log("que indices are: ",queindices);
    req.session.quizquestioncount=0;
    res.send();
  });
  
  //res.redirect('givequiz.html');
});

//generates a random number from 0 to the last question entered's number
function getMaxQuestionNumber(req){
  return new Promise(function(resolve,reject){
  queRef.child(req.session.quiztopicname+req.session.quiztopictype).
  orderByChild("number").limitToLast(1).once("value",function(snapshot){
    var data=snapshot.val();
    var max=0;
    for(key in snapshot.val()){
      max=data[key].number;
    }
    console.log("max is", max);
    resolve(max);
  });
  });
}


//gets a random question number
function getRandomQuestionNumber(indexes,max){
  return new Promise(function(resolve,reject){
    var k=0;
    
      var options = {     //rand for ques
        min: 0,
        max:  max,    //last child added's "number"
        integer: true
      };
      var randomnumber=rn(options);     //random number here
      var i;
      for(i=0;i<indexes.length;i++){
        k=0;
        if(randomnumber==indexes[i]){
          k++;
          randomnumber=rn(options);      //if exists, generate again and compare from start
          i=0;
          if(k==max){
            reject("error");
          }
        }
      }
      indexes[indexes.length]=randomnumber;
      resolve(randomnumber);
    });
  }

  //gets a question whose number is generated randomnly
  function getQuestion(req,rndnumber){
    console.log("toget que num is: ", rndnumber);
    return new Promise(function(resolve,reject){
      queRef.child(req.session.quiztopicname+req.session.quiztopictype).
      orderByChild("number").equalTo(rndnumber).once("value",function(snapshot){
        console.log("in getQuestion");
        var arr={
          answer: null,
          que: null,
          wrong1: null,
          wrong2: null,
          wrong3: null
        };    
        data=snapshot.val();
        console.log("data is", data);
        for(key in snapshot.val()){
          arr.que=data[key].question;
          arr.answer=data[key].correct;
          arr.wrong1=data[key].wrong1;
          arr.wrong2=data[key].wrong2;
          arr.wrong3=data[key].wrong3;
        }
        /*console.log("INDEXES");
        for(var m=0;m<indexes.length;m++){
          console.log(indexes[m]);
        }*/
        console.log("que got is: ",arr);
        resolve(arr);
      });
  });
}


function getRand(array){     //generates an array of random indices
  var newArray=[];
  var times=array.length;
  for(var i=0;i<times;i++){
    var ran=~~(array.length*Math.random());
    newArray[i]=array.splice(ran,1)[0]
  }
  console.log("getRand() result");
  return newArray
}

/*
function getRand(){     //generates an array of random indices
  var array=[0,1,2,3]
  var newArray=[];
  var times=array.length;
  for(var i=0;i<times;i++){
    var ran=~~(array.length*Math.random());
    newArray[i]=array.splice(ran,1)[0]
  }
  console.log("getRand() result");
  return newArray
}
*/

//puts the option on the randomnly generated index
function putChoice(tosend,option,index){
  return new Promise(function(resolve,reject){
    tosend.options[index]=option;
    //console.log("putting an option",tosend);
    resolve();
  });
}

router.get('/checkanswer',function(req,res,next){
  console.log("option choosen: ", req.query.optionchoosed);
  console.log("correct option: ", req.session.correctanswer);
  if(req.query.optionchoosed==req.session.correctanswer){
    correct++;
    res.send("correct");
  }else{
    res.send("wrong");
  }
});

//do score scene here at the end of quiz and all
router.get('/getquestions',function(req,res,next){
  if(req.session.quizquestioncount>=10){
    var correctcount={
      attempted: req.session.quizquestioncount,
      correct: correct
    };
    res.send(correctcount);
  }else{
  var temp;
  choices=[];
  req.session.quizquestioncount++;
  getQuestion(req,queindices[quecount++]).then(function(docs){
    console.log('docs are', docs);
    temp=docs;
    tosend.question=docs.que;
    choices=[];
    var arr2=[0,1,2,3];
    var indices=getRand(arr2);      //indices for options of questions
    //console.log("indices are", indices);
    Promise.all([putChoice(tosend,docs.wrong1,indices[0]),
    putChoice(tosend,docs.wrong2,indices[1]),
    putChoice(tosend,docs.answer,indices[2]),
    putChoice(tosend,docs.wrong3,indices[3])]).then(function(){
      req.session.correctanswer=docs.answer;
      tosend.correct=correct;
      console.log("complete response is");
      console.log(tosend);
      tosend.count=req.session.quizquestioncount;
      res.send(tosend);
    });
  });
  }
});

module.exports = router;