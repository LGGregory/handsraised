'use strict';
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoURL = 'mongodb://handsraised:RUHacks2018@ds135750.mlab.com:35750/handsraised';



app.use(bodyParser.urlencoded({extended: true}));


app.set('view engine', 'ejs');

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

    app.use(session({
        secret: 'handsraised',
        genid: function (req) {
            return genuuid(); // use UUIDs for session IDs
        },
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        store: new MongoStore({
            db: db,
            touchAfter: 24 * 3600 // time period in seconds
        })
    }));

});



app.get('/', function (req, res) {

    res.render('index.ejs');
});

app.get('/:create', function (req, res) {
    res.sendFile(__dirname + '/views/' + req.params.create);

});

app.post('/join_session', function (req, res) {
    const session_key = req.body.session_key;
    console.log(session_key);
    doesSessionExist(session_key, function (bo) {
        if (bo) {
            var query = {student_name: req.body.student_name};
            db.collection(session_key).count(query, function (err, num) { //TODO: Students Rejoin maybe?
                if (num === 0) {
                    db.collection(session_key).save(req.body, function (err, res) {
                        if (err)
                            return console.log(err);
                        console.log('Stored ' + req.body.student_name + " in " + session_key);

                    });
                }
            });
        }
    });

//db.collection(req.body.session_key).find(query).toArray(function(err, results))
    res.render('raise.ejs', );
});

function displaySession(session_key, res, callback) {
    db.collection('session_keys').findOne({session_key: session_key}, function (err, data) {
        if (err)
            return console.log(err);
        db.collection(session_key).find({hand: 'raised'}).toArray(function (err, raised) { //TODO: true false 
            if (err)
                return console.log(err);
            data.raised = raised;
            res.render('session.ejs', {data: data});

            if (callback != null)
                callback();
        });

    });

}

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
                    db.collection('session_keys').save(session_info, function (err, ret) {
                        if (err)
                            return console.log(err);
                        console.log('saved to database');
                        db.collection('session_keys').findOne({session_key: session_info.session_key}, function (err, data) {
                            if (err)
                                return console.log(err);
                            db.collection(session_info.session_key).find({hand: 'raised'}).toArray(function (err, raised) {
                                if (err)
                                    return console.log(err);
                                data.raised = raised;
                                res.render('session.ejs', {data: data});


                            });

                        });
                        // displaySession(session_info.session_key, res);
                    });


                }
            });
        });
    });
});

app.get('/session.ejs', function (req, res) {



});

app.post('/lead_session', function (req, res) {
    var session_info = req.body;
    doesSessionExist(session_info.session_key, function (bo) {
        if (bo) {
            var query = {session_key: session_info.session_key};
            db.collection('session_keys').findOne(query, function (err, document) {

                console.log(document);

                bcrypt.compare(session_info.password, document.passhash, function (err, ret) {
                    if (ret) {
                        // Passwords match
                        console.log('Log in.');

                        displaySession(session_info.session_key, res);
                    } else {
                        // Passwords don't match
                        console.log('No log in');
                    }

                });




            });
        } else { //Notify non-existence
            console.log('Does not exist.');
        }
    });
});

app.post('/raise_hand', function (req, res) {
    var session_info = req.body;
    
    
    res.render('raise.ejs', {data: data});

});

app.get('/session.html', function (req, res) {
    res.sendFile(__dirname + '/views/session.html');
    db.collection('session_keys').find().toArray(function (err, res) {
        if (err)
            return console.log(err);
        console.log(res);
    });
});

function doesSessionExist(session_key, callback) {
    var boolExists;
    var query = {session_key: session_key};
    db.collection('session_keys').count(query, function (err, num) {
        console.log(query);
        console.log(num);
        console.log(session_key);
        if (num == 1) {
            //then the session exists , so reprompt 
            boolExists = true;
        } else {
            //then the session does not exist
            boolExists = false;
        }

        callback(boolExists);
    });
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


function initSession(body, callback) {
    bcrypt.hash('myPassword', 10, function (err, hash) {
        db.collection(body.session_key).insert();
    });
}

function endSession(session_key, callback) {
    callback(db.collection(session_key).drop());
}

