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

var datetime = require('node-datetime');

if (!firebase.apps.length) {
  firebase.initializeApp({
    serviceAccount: "./quizinga-ba468aeb643e.json",
    databaseURL: "https://quizinga-183118.firebaseio.com/"
  });
  
}


const ref=firebase.database().ref('quizinga');

const usersref=ref.child('users');

var postsRef=ref.child('posts');


var client="../client";
const ques=ref.child('questions');

//var quesRef=ques.child('topic + type');

var client="../client";

router.get('/viewposts',function(req,res,next){
    if(req.user){
        res.sendFile('/viewposts.html',{root:client});
    }else{
        res.sendStatus(404);
    }
});

function getmaxposts(addpost){
    return new Promise(function(resolve,reject){
    addpost.orderByChild("key").limitToLast(1).once("value",function(snapshot){
        //console.log("limit to last: ",snapshot.val());
        if(snapshot.val()==null || snapshot.val()==undefined){
            resolve(0);
        }else{
            var x;
            for(key in snapshot.val()){
                x=key;
                x++;
            }
            resolve(x);
        }
    });
    });
}

//adding a new post
router.post('/addpost',upload.any(),function(req,res,next){
    if(req.body.post){
    console.log("The topic in which post will be added is: "
    +req.session.topicname + req.session.topictype);
    console.log("got post text: "+ req.body.post);
    var img=req.body.img;
    console.log("req.body: ",req.body);
    var file=req.files;
    var filename="post";
    if(req.session.topicname && req.session.topictype){
    var addpost=postsRef.child(req.session.topicname+req.session.topictype);
    getmaxposts(addpost).then(function(num){        //custom ID for each post
        usersref.orderByChild("email").equalTo(req.user.emails[0].value)
        .once("value",function(snapshot){
            var username;
            for(key in snapshot.val()){
                username=snapshot.val()[key].name;
            }
            var toadd=addpost.child(num);
            var dt = datetime.create();
            var formatted = dt.format('d/m/Y H:M:S');  
            console.log("NUM:" , num);          
            toadd.set({             //saving post in the db
                key: num,
                user: req.user.emails[0].value,
                post: req.body.post,
                post_date: formatted,
                likes: [],
                username: username
            });
        });
        if(file[0]!=null){          //saving image associated with a post
            var x=num.toString();
            var filename=req.session.topicname + req.session.topictype +x;
            fs.rename(file[0].path,'public/images/posts/'+filename+".jpg",function(err){
              if(err)throw(err);
              console.log("File uploaded to server");
              res.send("added");
            });
            }else{
                res.send("added");
            }
    });
    }else{
        res.send("not added");
    }
    }else{
        res.send("not added");
    }
});

function retrieveposts(postref){
    var Posts=[];
    var keys=[];
    var j=0;
    var asyncLoop = require('node-async-loop');
    return new Promise(function(resolve,reject){
        postref.once("value",function(snapshot){
            if(snapshot.val()){
                asyncLoop(snapshot.val(), function (item, next)
                {
                    if(item!=undefined || item!=null){
                    console.log("item: ",item);
                    Posts.push({
                        key: item.key,
                        post: item.post,
                        username: item.username,
                        user: item.user,
                        date: item.post_date,
                        likes: item.likes,
                        comments: item.comments,
                        img: null
                    });
                    j++;
                    next();}
                    else{
                        next();
                    }
                }, function (err)
                {
                    if (err)
                    {
                        console.error('Error: ' + err.message);
                        return;
                    }
                    console.log('Finished!');
                    resolve(Posts);
                });
            }else{
                resolve(null);
            }
        });
    });
}

//user's dp for each post
function getuserimgs(posts,req){
    return new Promise(function(resolve,reject){
        var asyncLoop = require('node-async-loop');
        asyncLoop(posts, function (item, next){
            var imgpath= path.join(__dirname, '../public/images/dps/' + 
            item.user + ".jpg");
            base64Img.base64(imgpath, function(err, data) {
                if(err){
                    console.log(err.message);
                }else{
                    item.userimg=data;
                }
                next();
            });
        },function(err){
            if(err){
                console.log("error: ",err.message);
            }
            console.log("got user imgs");
            resolve(posts);
        });
    });
}

function getcmntimgs(posts,req){
    var asyncLoop = require('node-async-loop');
    return new Promise(function(resolve,reject){
            console.log("going in loop");
            console.log(posts);
            for(var c=0;c<posts.length;c++){
                console.log("in going for async ", posts[c].comments);
                if(posts[c].comments==null){
                    console.log(posts[c].comments[0]);
                    console.log("wapis idr se");
                    continue;
                }
                else{
                    console.log("getting cmnts");
                    asyncLoop(posts[c].comments, function (item1, next1){
                        if(item1!=null){
                            console.log(item1.post);
                            var imgpath1= path.join(__dirname, '../public/images/dps/' + 
                            item1.user + ".jpg");
                            base64Img.base64(imgpath1, function(err, data1) {
                                if(err){
                                    console.log(err.message);
                                }else{
                                    item1.cmntuserimg=data1;
                                }
                                console.log("doing: ",item1.comment);
                                next1();
                            });
                        }
                        else{
                            next1();
                        }
                    },function(err){
                        if(err){
                            console.log(err.message);
                        }
                        console.log("got comment's images");
                        resolve(posts);
                    });
                }
                console.log("c: ",c);
        }
        if(c>=posts.length){
            resolve(posts);
        }
    });
}

//getting imgs by recursion
function getimgs(posts,i,post,req,res){
    if(post!=undefined || post!=null){
    var imgpath= path.join(__dirname, '../public/images/posts/' + 
    req.session.topicname +req.session.topictype + post.key + ".jpg");
    base64Img.base64(imgpath, function(err, data) {
        if(err){
        //console.log(err);
        posts[i++].img=null;
        if(i>=posts.length){
            //console.log(posts);
            console.log("didn't get pic");
            res.send(posts);
            return posts;
        }else{
            console.log("didn't get pic");
            getimgs(posts,i,posts[i],req,res);
        }
    }
        else if(data){
            console.log("got pic");
            //console.log("i: ",i);
            posts[i++].img=data;
            if(i>=posts.length){
                //console.log(posts);
                res.send(posts);
                return posts;
            }else{
                console.log("got pic");
                getimgs(posts,i,posts[i],req,res);
            }
        }
    });
    }else{
        console.log("the post is null");
        i++;
        if(i>=posts.length){
            //console.log(posts);
            res.send(posts);
            return posts;
        }else{
            getimgs(posts,i,posts[i],req,res);
        }
    }
}

//gets all posts of a topic
router.get('/getallposts',function(req,res,next){
    var tosend=[];
    var i=0;
    var postref=postsRef.child(req.session.topicname + req.session.topictype);
    retrieveposts(postref).then(function(resp){
        console.log(resp);
        if(resp!=null)
        return getuserimgs(resp,req);
    }).then(function(respo){
        return getcmntimgs(respo,req); 
    }).then(function(arr){
        getimgs(arr,i,arr[i],req,res);  
    });
    /*getposts(postref).then(function(posts){
        console.log("posts: ", posts);
        
    });*/
});

function topicpic(req){
    return new Promise(function(resolve,reject){
    var imgpath= path.join(__dirname, '../public/images/topics/' + 
    req.session.topicname +req.session.topictype +".jpg");
    base64Img.base64(imgpath, function(err, data) {
        if(err)
        console.log(err);
        else if(data){
            console.log("done with the topic pic");
            resolve(data);
        }
    });
    });
}

router.get('/topicname',function(req,res,next){
    var topic={
        name: req.session.topicname,
        type: req.session.topictype
    };
    topicpic(req).then(function(data){
        topic.img=data;
        //console.log("topic: ",topic);
        res.send(topic);
    });
});

router.post('/topicspost',function(req,res,next){
    if(req.user){
        console.log(req.body.topic);
        req.session.topicname=req.body.topic.name;
        req.session.topictype=req.body.topic.type;
        res.send("viewpostsnow");
    }else{
        console.log(req.user);
        res.sendStatus(404);
    }
});
//liking a post
router.post('/likepost',function(req,res,next){
    var postref=postsRef.child(req.session.topicname+req.session.topictype);
    postref.child(req.body.postid).once("value",function(snapshot){
        var updateddata;
        var flag=false;
        console.log(snapshot.val());
            updateddata={
                post: snapshot.val().post,
                user: snapshot.val().user,
                username: snapshot.val().username,
                date: snapshot.val().post_date,
                likes: snapshot.val().likes,
                key: snapshot.val().key,
                comments: snapshot.val().comments,
                img: null   
            };
            if(updateddata.comments==undefined || updateddata.comments==null){
                updateddata.comments=[];
            }
            if(updateddata.likes){
            for(var i=0;i<updateddata.likes.length;i++){
                if(updateddata.likes[i].user==req.user.emails[0].value){
                    console.log("removing like");
                    flag=true;
                    updateddata.likes.splice(i, 1);     //unliking
                }
            }
            if(!flag){          //add like here
                updateddata.likes.push({
                    user: req.user.emails[0].value,
                    username: req.user.displayName
                });
            }
            var addnewlike=postref.child(req.body.postid);
            addnewlike.set({
                comments: updateddata.comments,
                post: updateddata.post,
                user: updateddata.user,
                username: updateddata.username,
                post_date: updateddata.date,
                likes: updateddata.likes,
                key: updateddata.key,
                img: null
            });
            res.send();
        }else{
            updateddata.likes=[];
            updateddata.likes.push({
                user: req.user.emails[0].value,
                username: req.user.displayName
            });
            var newlike=postref.child(req.body.postid);
            //console.log(newlike.toString());
            //console.log(updateddata.post);
            console.log("in new like: ",snapshot.val());
            if(snapshot.val().comments){
                var cmnt=snapshot.val().comments;
            }
            else if(snapshot.val().comments == null || snapshot.val().comments==undefined){
                var cmnt=[];
            }
            newlike.set({
                key: snapshot.val().key,
                post: snapshot.val().post,
                comments: cmnt,
                user: snapshot.val().user,
                username: snapshot.val().username,
                post_date: snapshot.val().post_date,
                likes: updateddata.likes,
                img: null
            });
            res.send();
        }
    });
});

function findpost(req,postid,postsRef){
    return new Promise(function(resolve,reject){
        var newref=postsRef.child(req.session.topicname + req.session.topictype)
        .child(postid);
        console.log(newref.toString());
        newref.once("value",function(snapshot){
            console.log(snapshot.val());
            var resp={
                key: snapshot.val().key,
                likes: snapshot.val().likes,
                post_date: snapshot.val().post_date,   
                user: snapshot.val().user,
                username: snapshot.val().username,
                post: snapshot.val().post
            };
            if(snapshot.val().comments){
                resp.comments=snapshot.val().comments;
                resp.commentskey=snapshot.val().comments.length;
            }
            else if(snapshot.val().comments==undefined || snapshot.val().comments==null){
                resp.comments=[];
                resp.commentskey=0;
            }
            resolve(resp);
        });
    });
}

function addcomment(req,resp,cmnt){
    var cmntdt = datetime.create();
    var cmntdate = cmntdt.format('d/m/Y H:M:S');
    return new Promise(function(resolve,reject){
        resp.comments.push({
            key: resp.commentskey,
            comment: cmnt,
            user: req.user.emails[0].value,
            username: req.user.displayName,
            comment_date: cmntdate,
            likes: []
        });
        resp.commentskey=undefined;
        resolve(resp);
    });
}

function setpost(req,postsRef,postid,toadd){
    return new Promise(function(resolve,reject){
    var newref=postsRef.child(req.session.topicname + req.session.topictype)
    .child(postid);
    if(toadd.likes==null || toadd.likes==undefined){
    newref.set({
        key: toadd.key,
        likes: [],
        post_date: toadd.post_date,
        comments: toadd.comments,
        user: toadd.user,
        username: toadd.username,
        post: toadd.post
    },function(err){
        resolve(false);
    });
    resolve(true);
    }else{
        newref.set({
            key: toadd.key,
            likes: toadd.likes,
            post_date: toadd.post_date,
            comments: toadd.comments,
            user: toadd.user,
            username: toadd.username,
            post: toadd.post
        },function(err){
            resolve(false);
        });
        resolve(true);
    }
    });
}

//commenting a post
router.post('/commentpost',function(req,res,next){
    var cmnt=req.body.comment;
    var postid=req.body.postid;
    findpost(req,postid,postsRef).then(function(resp){       //finds the post
        console.log("resp: ",resp);
        return addcomment(req,resp,cmnt);                //adds comment on its data
    }).then(function(toadd){
        console.log("toadd: ",toadd);
        return setpost(req,postsRef,postid,toadd);               //sets the post again
    }).then(function(status){
        if(status){
            res.send("done");
        }else{
            res.send("failed");
        }
    })
});

function likecomment(req,respo,commentid){
    var flag=false;
    var asyncLoop = require('node-async-loop');
    return new Promise(function(resolve,reject){
        if(respo.comments){
        asyncLoop(respo.comments, function (item, next){
            if(item.key==commentid){
                if(item.likes==null || item.likes==undefined){
                    item.likes=[];     //first like on a comment
                    item.likes.push({
                        user: req.user.emails[0].value,
                        username: req.user.displayName
                    });
                }else if(item.likes){
                    for(var j=0;j<item.likes.length;j++){
                        if(item.likes[j].user==req.user.emails[0].value){
                            item.likes.splice(j,1);        //unliking comment
                            flag=true;
                        }
                    }
                    if(!flag){
                        item.likes.push({
                            user: req.user.emails[0].value,
                            username: req.user.displayName
                        });
                    }
                }
            }
            next();
        },function (err)
        {
            if (err)
            {
                console.error('Error: ' + err.message);
                return;
            }
            console.log('comment liked');
            resolve(respo);
        });
        }
    });
}

router.post('/likecomment',function(req,res,next){
    var commentid=req.body.commentid;
    var postid=req.body.postid;
    findpost(req,postid,postsRef).then(function(respo){
        console.log("respo: ",respo);
        return likecomment(req,respo,commentid);
    }).then(function(addnow){
        console.log("addnow: ",addnow);
        return setpost(req,postsRef,postid,addnow);
    }).then(function(liked){
        if(liked){
            res.send("liked");
        }else{
            res.send("unliked");
        }
    });
});

module.exports = router;