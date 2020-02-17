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
var dbUrl = 'mongodb+srv://kzheng:kzheng@cluster0-7wnfd.mongodb.net/test?retryWrites=true&w=majority';

//bodyParser set up for json object return
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//static folder set up
app.use(express.static(path.join(__dirname, './webapp')));

mongoose.connect(dbUrl, {useMongoClient: true}, function(err){
    if(err){
        console.log(err);
        console.log('Connection to Database failed');
        process.exit(1);
    }else{
        console.log('Database Connected');
        studentRouter.setUpAdmin();
        socketUtils.setUpSocket(io);
    }
});

app.use('/api', [answerRouter, studentRouter, sessionRouter]);

app.get('/favicon.ico', function(req, res){
    res.send('Currently no favicon');
});

app.use(function(req, res){
    res.sendFile('app.html', { root : __dirname + '/webapp' });
});

server.listen(8888);

console.log('Server Started');
