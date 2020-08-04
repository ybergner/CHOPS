'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var Enum = require('./data/enum.js');
var utils = require('./data/utils.js');
var socketUtils = require('./socket/socketUtils.js');
var answerRouter = require('./router/answerRouter.js');
var studentRouter = require('./router/studentRouter.js');
var sessionRouter = require('./router/sessionRouter.js');
var hintRouter = require('./router/hintRouter.js');
var spreadSheetRouter = require('./router/spreadSheetRouter.js');
var questionRouter = require('./router/questionRouter.js');
var dbUrl = '';
var port = process.env.PORT || 8888;

//bodyParser set up for json object return
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//static folder set up
app.use(express.static(path.join(__dirname, './webapp')));

mongoose.connect(dbUrl, {useNewUrlParser: true}, function(err){
    if (err) {
        console.log(err);
        console.log('Connection to Database failed');
        process.exit(1);
    } else {
        console.log('Database Connected');
        studentRouter.setUpAdmin();
        socketUtils.setUpSocket(io);
    }
});

app.use('/api', [answerRouter, studentRouter, sessionRouter, spreadSheetRouter, questionRouter, hintRouter]);

app.get('/favicon.ico', function(req, res){
    res.send('Currently no favicon');
});

app.use(function(req, res){
    res.sendFile('app.html', { root : __dirname + '/webapp' });
});

server.listen(port);

console.log('Server Started, listening on port: ' + port);
