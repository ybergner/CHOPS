'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
var Account = require('./data/accountSchema.js');
var Enum = require('./data/enum.js');
var utils = require('./data/utils.js');

var answerRouter = require('./router/answerRouter.js');
var studentRouter = require('./router/studentRouter.js');
var dbUrl = 'mongodb+srv://kzheng:kzheng@cluster0-7wnfd.mongodb.net/test?retryWrites=true&w=majority';

//bodyParser set up for json object return
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//static folder set up
app.use(express.static(path.join(__dirname, './webapp')));

mongoose.connect(dbUrl, {useMongoClient: true}, function(err){
    if(err){
        console.log('Connection to Database failed');
        process.exit(1);
    }else{
        console.log('Database Connected');
        // if there is no admin account, create one
        Account.findOne({accountType: Enum.accountType.teacher}).lean().exec(function(err, result) {
            if (!result) {
                console.log('No admin account found, creating one.');
                Account.create({
                    accountId : 123,
                    accountName : 'admin',
                    accountType : Enum.accountType.teacher,
                    email : 'kzheng1111@gmail.com',
                    password : utils.encryptPassword('admin')
                }, function(err, result) {
                    if (err) {
                        console.log('Cannot create admin account.');
                        console.log(err);
                    } else {
                        console.log('Created admin account.');
                        console.log(result);
                    }
                });
            }
        });
    }
});

app.use('/api', [answerRouter, studentRouter]);

app.get('/favicon.ico', function(req, res){
    res.send('Currently no favicon');
});

app.use(function(req, res){
    res.status(404).send('404: Page Not Found');
});

app.listen(8888);

console.log('Server Started');
