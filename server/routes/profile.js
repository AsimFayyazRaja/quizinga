var express = require('express');
var router = express.Router();
var base64Img = require('base64-img');
var multer  = require('multer')
var upload=multer({dest: 'uploads/'});
var fs=require("fs");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
router.use(bodyParser.json());
var fs=require('fs');
var base64Img = require('base64-img');
var client="../client";
const get = require('simple-get');
var path=require('path');


/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.user!=null)
  res.sendFile('/profile.html',{ root: client });
  else{
    res.sendFile('/error.html',{ root: client });
  }
});

router.get('/userprofile',function(req,res,next){

  if(req.user!=null){
  var user={
    name: req.user.displayName,
    img: null
  };
  
  //picking up image from FS and converting it to base64 and sending back data
  var imgpath= path.join(__dirname, '../public/images/dps/' + req.user.emails[0].value + ".jpg");
  if(imgpath!=null){
        base64Img.base64(imgpath, function(err, data) {
        //console.log(data);        //prints image
        user.img=data;
        res.send(user);
    });
  }
}else{
  res.sendFile('/error.html',{ root: client });
}
});

router.post('/upload-dp',upload.any(),function(req,res,next){
    var date=Date.now();
    console.log(req.body);
    if(req.files!=[] || req.files!=null){
          var file=req.files;
          var filename="dp";
          if(file[0]!=null)
          fs.rename(file[0].path,'public/images/dps/'+filename+date,function(err){
              if(err)throw(err);
              console.log("File uploaded to server");           
            });
        }
       res.send("blekh");
  });
  

module.exports = router;