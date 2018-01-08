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
var path=require('path');
var client="../client";
var datetime = require('node-datetime');


if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
  
}


const ref=firebase.database().ref('quizinga');

const follows=ref.child('follows');


const usersref=ref.child('users');

const topicref=ref.child('topics');

/* GET home page. */
router.get('/',function(req, res, next) {
  if(req.user!=null){
    //console.log("REQ.USER IS: ",req.user);
    res.sendFile('/home.html',{ root: client });
  }
  else
  res.sendFile('/error.html',{ root: client });
});

router.get('/gethome',function(req,res,next){
  
});


//search's users given on a name
function searchusers(req,usersref,str){
  var data=[];
  var asyncLoop = require('node-async-loop');
  return new Promise(function(resolve,reject){
    usersref.orderByChild("name").equalTo(str).once("value",function(snapshot){
      if(snapshot.val()){
        asyncLoop(snapshot.val(), function (item, next){
          if(item.value.email==req.user.emails[0].value){
            console.log("equals");
            next();
          }else{
          console.log("current doing: ",item.value);
          if(item!=null || item!=undefined){
            var imgpath= path.join(__dirname, '../public/images/dps/' + 
            item.value.email + ".jpg");
            base64Img.base64(imgpath, function(err, data1) {
                if(err){
                    console.log(err.message);
                }else{
                  data.push({
                    username: item.value.name,
                    email: item.value.email,
                    userimg: data1
                  });
                  var ema=req.user.emails[0].value;     //follower
                  ema=ema.substring(0,ema.indexOf("@"));
                
                  var email=data[data.length-1].email;      //following                                 //following
                  email=email.substring(0,email.indexOf("@"));
                
                  follows.child(ema+email)
                  .once("value",function(snapshot){
                    console.log(follows.child(ema+email).toString());
                    if(snapshot.numChildren()>0){
                      console.log("follows");
                      data[data.length-1].userflag=true;    //following this person
                    }else{
                      console.log("not follows");
                      data[data.length-1].userflag=false;   //not following him/her
                    }
                    next();
                    });
                }
                next();
            });
          }
        }
        },function(err){
          if(err)
          console.log(err.message);
          console.log("users found!");
          resolve(data);
        });
      }
      else{
        resolve(data);
      }
    });
  });
}

//search's topic given on a name
function searchtopics(req,topicref,str,data){
  var ema=req.user.emails[0].value;
  ema=ema.substring(0,ema.indexOf("@"));
  var asyncLoop = require('node-async-loop');
  return new Promise(function(resolve,reject){
    topicref.orderByChild("name").equalTo(str.toUpperCase())
    .once("value",function(snapshot){
      if(snapshot.val()){
        asyncLoop(snapshot.val(), function (item, next){
          if(item!=null || item!=undefined){
            console.log(item.value);
            //console.log("current doing: ",item.name +item.type);
            if(item.value.type=="private" || item.value.type=="public"){
              next();
            }else{
              var imgpath= path.join(__dirname, '../public/images/topics/' + 
              item.value.name + item.value.type + ".jpg");
                base64Img.base64(imgpath, function(err, data1) {
                  if(err){
                      console.log(err.message);
                  }
                  data[data.length]={
                    description: item.value.description,
                    type: item.value.type,  
                    username: item.value.username,
                    user: item.value.user,
                    name: item.value.name,
                    topicimg: data1    
                  };
                    follows.child(ema+data[data.length-1].name+data[data.length-1].type)
                    .once("value",function(snapshot){
                      console.log(follows.child(data.name+data.type+ema).toString());
                      if(snapshot.numChildren()>0){
                        console.log("follows");
                        data[data.length-1].followflag=true;
                      }else{
                        console.log("not follows");
                        data[data.length-1].followflag=false;
                      }
                      next();
                      });
              });
            }
          }
        },function(err){
          if(err)
          console.log(err.message);
          console.log("topics found!");
          resolve(data);
        });
      }
      else{
        resolve(data);
      }
    });
  });
}

//follow a person
router.post('/followuser',function(req,res,next){
  var email=req.body.email;
  var name= req.body.name;
  var ema=req.user.emails[0].value;     //follower
  ema=ema.substring(0,ema.indexOf("@"));

  email=email;                                      //following
  email=email.substring(0,email.indexOf("@"));

  //follower+following node
  follows.child(ema+email).once("value",function(snapshot){
    if(snapshot.numChildren()>0){   //already following, unfollow now
      follows.child(ema+email).remove(function(err){
        if(err){
          console.log(err.message);
          res.send("Can't unfollow");
        }else{
          res.send("Unfollowed");
        }
      });
    }else{      //not following already, follow now
      var dt = datetime.create();
      var formatted = dt.format('d/m/Y H:M:S');
      
      follows.child(ema+email).set({
        follower_name: req.user.displayName,
        follower_email: req.user.emails[0].value,
        following_name: name,
        following_email: req.body.email,
        date: formatted
      },function(err){
        if(err){
          console.log(err.message);
          res.send("Can't follow"); 
        }else{
          res.send("Followed");
        }
      });
    }
  });

});

router.post('/searchthis',function(req,res,next){
  var str=req.body.str;
  searchusers(req,usersref,str).then(function(result){
    return searchtopics(req,topicref,str,result);
  }).then(function(data){
    if(data==[] || data==null){
      res.send(null);
    }else
    res.send(data);
  })
});

router.get('/givequiz', function(req, res, next) {
  //console.log("in give quiz");
  if(req.user!=null)
  res.sendFile('/givequiz.html',{ root: client });
  else
  res.sendFile('/error.html',{ root: client });
});

module.exports = router;