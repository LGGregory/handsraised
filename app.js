'use strict';
const url = require('url-parse');
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoURL = 'mongodb://handsraised:RUHacks2018@ds135750.mlab.com:35750/handsraised';
const app = express();

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

    /*,
     store: new MongoStore({
     db: db,
     touchAfter: 24 * 3600 // time period in seconds
     })
     */
});

app.use(session({
    secret: 'handsraised'
}));

app.get('/', function (req, res) {
    res.render('index.ejs');
});
/*
 app.get('/:create', function (req, res) {
 res.sendFile(__dirname + '/views/' + req.params.create);
 
 });*/



app.post('/join_session', function (req, res) {
    const session_key = req.body.session_key;
    var session_info = req.body;
    doesSessionExist(session_key, function (bo) {
        if (bo) {
            var query = {student_name: session_info.student_name};
            db.collection(session_key).count(query, function (err, num) { //TODO: Students Rejoin maybe?
                if (num === 0) {
                    db.collection(session_key).save(session_info, function (err, data) {
                        if (err)
                            return console.log(err);
                        req.session.session_key = session_info.session_key;
                        req.session.student_name = session_info.student_name;
                        displayRaise(session_info.session_key, session_info.student_name, res);
                        console.log(">" + session_info.student_name + " joined " + session_info.session_key);
                    });
                }
            });
        } else {
            res.redirect('/error.html');
        }
    });

//db.collection(req.body.session_key).find(query).toArray(function(err, results))

});

function displaySession(session_key, res, callback) {
    db.collection('session_keys').findOne({session_key: session_key}, function (err, data) {
        if (err)
            return console.log(err);
        //hand : {raised : true}

        var query = {hand: {$exists: true}};

        db.collection(session_key).find(query).toArray(function (err, raised) { //TODO: true false 
            if (err)
                return console.log(err);
            console.log(raised);
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
                if (num != 0) {
                    //then the session exists , so reprompt 
                    res.redirect('/create_session.html');
                    console.log('Redirected back to create session');
                } else {
                    //then the session does not exist and we can create it
                    db.collection('session_keys').save(session_info, function (err, ret) {
                        if (err)
                            return console.log(err);
                        req.session.session_key = session_info.session_key;
                        res.redirect('/run_session');
                    });
                }
            });
        });
    });
});

app.get('/create_session', function (req, res) {
    if (req.session.session_key) {
        res.redirect('/run_session');
    } else {
        res.end('<html><body><h3>Session Timed Out.</h3><br><br><a href="/">Go Home.</a></body></html>');
    }
});

app.get('/create.html', function (req, res) {
    res.sendFile(__dirname + '/views/' + 'create.html');
});

app.post('/end_session', function (req, res) {
    var session_info = req.body;
    var query = {session_key: session_info.session_key};
    db.collection('session_keys').deleteOne(query, function (err, obj) {
        if (err)
            return console.log(err);
        if (obj.deletedCount > 0) {
            db.listCollections({name: session_info.session_key}).toArray(function (err, items) {
                if (err)
                    return console.log(err);
                if (items.length > 0) {
                    db.collection(session_info.session_key).drop(function (err, delOK) {
                        if (err)
                            return console.log(err);
                    });
                }
            });
        }
    });

    res.redirect('/');

});

function renderSession(session_key, page) {
    db.collection('session_keys').findOne({session_key: session_key}, function (err, data) {
        if (err)
            return console.log(err);
        db.collection(session_key).find({hand: {raised: true}}).toArray(function (err, raised) {
            if (err)
                return console.log(err);
            data.raised = raised;
            page.render('session.ejs', {data: data});


        });

    });
}

app.post('/lead_session', function (req, res) {
    var session_info = req.body;
    doesSessionExist(session_info.session_key, function (bo) {
        if (bo) {
            var query = {session_key: session_info.session_key};
            db.collection('session_keys').findOne(query, function (err, document) {

                bcrypt.compare(session_info.password, document.passhash, function (err, ret) {
                    if (ret) {
                        // Passwords match
                        req.session.session_key = session_info.session_key;
                        res.redirect('/run_session');
                    } else {
                        //TODO Password not matching
                        // Passwords don't match
                    }
                });
            });
        } else { //Notify non-existence
            console.log('Does not exist.');
        }
    });
});

app.get('/raise_hand', function (req, res) {
    if (req.session.session_key && req.session.student_name) {
        doesSessionExist(req.session.session_key, function (bo) {
            if (bo)
                displayRaise(req.session.session_key, req.session.student_name, res);
            else
                res.redirect('/error.html');
        });

    } else {
        res.end('How did you get here? <a href="index.ejs">Go Home.</a>');
    }

});

app.get('/error.html', function (req, res) {
    res.sendFile(__dirname + '/views/' + 'error.html');
});

app.get('/login.html', function (req, res) {
    res.sendFile(__dirname + '/views/' + 'login.html');
});

app.get('/lead_session', function (req, res) {
    if (req.session.session_key) {
        res.redirect('/run_session');
    } else {
        res.end('How did you get here? <a href="index.ejs">Go Home.</a>');
    }
});

app.get('/run_session', function (req, res) {
    if (req.session.session_key) {
        displaySession(req.session.session_key, res);
    } else {
        res.end('How did you get here? <a href="index.ejs">Go Home.</a>');
    }
});

app.post('/raise_hand', function (req, res) {
    var session_info = req.body;
    var query = {student_name: session_info.student_name};
    var hand = {raised: true};
    hand.time = (new Date()).getTime();
    var update = {$set: {"hand": hand}};
    db.collection(session_info.session_key).updateOne(query, update, function (err, data) {
        if (err)
            console.log(err);
        displayRaise(session_info.session_key, session_info.student_name, res);
    });
});

app.get('/session.html', function (req, res) {
    res.redirect('/run_session');
});

app.post('/answer_student', function (req, res) {
    var session_info = req.body;
    var query = {student_name: session_info.student_name};
    var update = {$unset: {hand: ""}};
    db.collection(session_info.session_key).update(query, update, function (err, result) {
        if (err)
            console.log(err);
        res.redirect('/run_session');
    });

});

function displayRaise(session_key, student_name, page) {
    db.collection(session_key).findOne({student_name: student_name}, function (err, document) {
        page.render('raise.ejs', {data: document});
    });
}

function doesSessionExist(session_key, callback) {
    var boolExists;
    var query = {session_key: session_key};
    db.collection('session_keys').count(query, function (err, num) {
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

