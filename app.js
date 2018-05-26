'use strict';
var express = require('express');
var app = express();

var port = process.env.PORT || 3000;

app.listen(port, function(){
  console.log("server is running on port " + port);
});

app.get('/', function(req, res){
  res.send("<h1>Default page</h1>");
});

app.get('/:dateParam', function(req, res){
  var dateParam = req.params.dateParam;

  if(Number(dateParam)){
    var date = "3";

    if(date != "Invalid date"){
      res.json({
        unix: dateParam,
        natural: date
    });
    } else{
      res.json({
        unix: null,
        natural: null
    });
    }
  }

  else{
    var date = "3";
    if(date){
      res.json({
        unix: date.unix(),
        natural: date.format("MMMM D, YYYY")
      });
    }
    else{
      res.json({
        unix: null,
        natural: null
      });
    }
  }
});
