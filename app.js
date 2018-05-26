'use strict';
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoURL = 'mongodb://handsraised:RUHacks2018@ds135750.mlab.com:35750/handsraised';
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

app.get('/:create', function (req, res) {
    res.sendFile(__dirname + '/views/' + req.params.create);

});
/*
 app.get('/session.html', function (req, res) {
 res.sendFile(__dirname + '/views/create.html');
 });
 
 app.get('/create.html', function (req, res) {
 res.sendFile(__dirname + '/views/create.html');
 });
 */
app.post('/join_session', function (req, res) {
    var cursor = db.collection('session_keys').find();



    res.sendFile(__dirname + '/views/raise.html');
});

app.post('/create_session', function (req, res) {
    var session_info = req.body;
    bcrypt.hash(session_info.password, 10, function (err, hash) {
        if (err)
            return console.log(err);
        delete session_info["password"];
        session_info.passhash = hash;
        buildSessionKey(session_info.session_name, function (sname) {
            var query = {session_name: sname};
            db.collection('session_keys').count(query, function (err, num) {

                session_info.session_key = sname;
                console.log(session_info);

                if (num != 0) {
                    //then the session exists , so reprompt 
                    res.redirect('/create_session.html');
                    console.log('Redirected back to create session');

                } else {
                    //then the session does not exist and we can create it
                    db.collection('session_keys').save(session_info, function (err, result) {
                        if (err)
                            return console.log(err);
                        console.log('saved to database');
                    });
                }
            });
        });
    });
});

app.post('/lead_session', function (req, res) {
    var session_info = req.body;



});


app.get('/session.html', function (req, res) {
    res.sendFile(__dirname + '/views/session.html');
    db.collection('session_keys').find().toArray(function (err, res) {
        if (err)
            return console.log(err);
        console.log(res);
    });
});





function doesSessionExist(session_key, callback){
    var boolean = false;          
    var query = {session_name: session_key};
    db.collection('session_keys').count(query, function (err, num) {
        console.log(query);
        console.log(num);
        console.log(session_key);

        if (num == 1) {
            //then the session exists , so reprompt 
            const boolExists = true;   
        
        }else{
           //then the session does not exist
           boolExists = false;
           
        }

    callback(boolExists);
}

function buildSessionKey(name, callback) {
    // Check if string exists to grow? Counter per string?
    db.collection('counter').findOne({}, function (err, document) {
        var newValue = document.value + 1;
        var update = {$set: {"value": newValue}};
        db.collection('counter').updateOne({}, update, function (err, res) {
            var sname = name + '-' + document.value;
            callback(sname);
        });
    });
}

<<<<<<< HEAD

=======
function initSession(body, callback) {
    bcrypt.hash('myPassword', 10, function (err, hash) {
        db.collection(body.session_key).insert();
    });
}

function endSession(session_key, callback) {
    callback(db.collection(session_key).drop());
}
>>>>>>> 61aff4b6d5af602c478514964fe42274e8571b6b
