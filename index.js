'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

var answerRouter = require('./router/answerRouter.js');
var questionRouter = require('./router/questionRouter.js');
var studentRouter = require('./router/studentRouter.js');

//bodyParser set up for json object return
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//static folder set up
app.use(express.static(path.join(__dirname, './webapp')));

app.use('/api', [answerRouter, questionRouter, studentRouter]);

app.get('/favicon.ico', function(req, res){
    res.send('Currently no favicon');
});

app.use(function(req, res){
    res.status(404).send('404: Page Not Found');
});

app.listen(8888);

console.log('Server Started');
