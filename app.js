'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mongoURL = 'mongodb://handsraised:RUHacks2018@ds135750.mlab.com:35750/handsraised';
app.use(bodyParser.urlencoded({extended: true}));

var MongoClient = require('mongodb').MongoClient;
var port = process.env.PORT || 3000;
var db;
MongoClient.connect(mongoURL, function (err, client) {
    if (err)
        return console.log(err);
    db = client.db('handsraised');

    app.listen(port, function () {
        console.log("server is running on port " + port);
    });

});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/create.html', function (req, res) {
    res.sendFile(__dirname + '/views/create.html');
});

app.get('/session.html', function (req, res) {
    res.sendFile(__dirname + '/views/create.html');
});

app.get('/create.html', function (req, res) {
    res.sendFile(__dirname + '/views/create.html');
});

app.post('/join_session', function (req, res) {
    var cursor = db.collection('session_keys').find();

    res.sendFile(__dirname + '/views/raise.html');
});

app.post('/create_session', function (req, res) {
    db.collection('session_keys').save(req.body, function (err, result) {
        if (err)
            return console.log(err);
        console.log('saved to database');
    });

    var query = { session_name: "First" };
    
    db.collection('session_keys').find(query).toArray(function (err, res) {
        if (err)
            return console.log(err);
        console.log(res);
    });
    
    res.redirect('/session.html');
        res.sendFile(__dirname + '/views/session.html');
});

app.get('/session.html', function (req, res) {
    res.sendFile(__dirname + '/views/session.html');
    db.collection('session_keys').find().toArray(function (err, res) {
        if (err)
            return console.log(err);
        console.log(res);
    });
});

/*
 
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
 */