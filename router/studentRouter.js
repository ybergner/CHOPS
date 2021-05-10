'use strict';
var express = require('express');
var router = express.Router();
var Account = require('../data/accountSchema.js');
var answerRouter = require('./answerRouter.js');
var sessionRouter = require('./sessionRouter.js');
var hintRouter = require('./hintRouter.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');

async function validateTeacher(data) {
    let res = await Account.findOne({accountType: Enum.accountType.teacher, _id: data._id}).lean().then();
    if (res) {
        return true;
    }
    return false;
}

router.validateTeacher = validateTeacher;

router.post('/validatePassword', function(req, res){
    Account.findOne({accountId : req.body.accountId, password : req.body.password}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot validate password');
            res.status(401).send('Cannot validate password');
        } else {
            if (!result) {
                res.status(401).send('Invalid password');
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.account)});
            }
        }
    });
});

// get all students
router.post('/students', function(req, res){
    validateTeacher(req.body.account).then(function(isValid) {
        if (!isValid) {
            res.status(401).send('No Permission');
        } else {
            Account.find({accountType: Enum.accountType.student}).lean().exec(function(err, result) {
              if (err) {
                  console.log('Cannot get all students');
                  res.status(403).send('Cannot get all students');
              } else {
                  if (!result) {
                      console.log('Collection is empty');
                      res.json([]);
                  } else {
                      res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.account)});
                  }
              }
            });
        }
    });
});

// add/update/delete new student
router.post('/student', function(req, res){
    validateTeacher(req.body.account).then(function(isValid) {
        if (!isValid) {
            res.status(401).send('No Permission');
        } else {
            if (req.body.operation == 'create') {
                req.body.data.accountType = Enum.accountType.student;
                Account.create(req.body.data, function(err, result) {
                  if (err) {
                      console.log('Cannot create student');
                      res.status(403).send(req.body.data);
                  } else {
                      res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.account)});
                  }
                });
            } else if (req.body.operation == 'update') {
                Account.findOne({accountId : req.body.data.accountId, accountType: Enum.accountType.student}).exec(function(err, result) {
                    if (err || !result) {
                        console.log('Cannot get student' + req.body.data.accountId);
                        res.status(403).send('Cannot get student' + req.body.data.accountId);
                    } else {
                        result.accountId = req.body.data.accountId;
                        result.accountName = req.body.data.accountName;
                        result.accountType = Enum.accountType.student;
                        result.email = req.body.data.email;
                        result.password = req.body.data.password;
                        result.save(function(saveErr) {
                            if (saveErr) {
                                console.log('Cannot update student ' + req.body.data.accountId);
                                res.status(403).send('Cannot update student ' + req.body.data.accountId);
                            } else {
                                res.json({success : true});
                            }
                        });
                    }
                });
            } else if (req.body.operation == 'delete') {
                Account.deleteOne({accountId : req.body.data.accountId, accountType: Enum.accountType.student}).exec(function(err, result) {
                  if (err) {
                      console.log('Cannot get student ' + req.body.data.accountId);
                      res.status(403).send('Cannot get student ' + req.body.data.accountId);
                  } else {
                      if (!result) {
                          console.log('Cannot find student ' + req.body.data.accountId);
                          res.status(403).send(req.body.data.accountId);
                      } else {
                          answerRouter.deleteAnswersByAccountId(req.body.data.accountId);
                          answerRouter.deleteActionsByAccountId(req.body.data.accountId);
                          hintRouter.deleteHintsByAccountId(req.body.data.accountId);
                          //sessionRouter.deleteSessionByAccountId(req.body.data.accountId);
                          res.json({success : true});
                      }
                  }
                });
            }
        }
    });
});

router.setUpAdmin = function() {
    // if there is no admin account, create one
    Account.findOne({accountType: Enum.accountType.teacher}).lean().exec(function(err, result) {
        if (!result) {
            console.log('No admin account found, creating one.');
            Account.create({
                accountId : 123,
                accountName : 'admin',
                accountType : Enum.accountType.teacher,
                email : 'test@gmail.com',
                password : 'admin'
            }, function(err, result) {
                if (err) {
                    console.log('Cannot create admin account.');
                    console.log(err);
                } else {
                    console.log('Created admin account.');
                    console.log(result);
                }
            });
        } else {
            console.log("Found admin account.");
        }
    });
}

module.exports = router;
