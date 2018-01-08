var express = require('express');
var router = express.Router();

var client="../client";


/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile('/index.html',{ root: client });
});

module.exports = router;