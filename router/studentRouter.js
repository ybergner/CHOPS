'use strict';
var express = require('express');
var router = express.Router();
var Account = require('../data/accountSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');

async function validateTeacher(data) {
    let res = await Account.findOne({accountType: Enum.accountType.teacher, _id: data._id}).lean().then();
    if (res) {
        return true;
    }
    return false;
}

router.post('/validatePassword', function(req, res){
    let encryptedPassword = utils.encryptPassword(req.params.password);
    Account.findOne({accountId : req.params.accountId, password : encryptedPassword}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot validate password');
            res.status(500).send('Cannot validate password');
        } else {
            if (result === null) {
                res.status(404).send('Invalid password');
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.account)});
            }
        }
    });
});

// get all students
router.post('/student', function(req, res){
    validateTeacher(req.params.account).then(function(isValid) {
        if (!isValid) {
            res.status(404).send('No Permission');
        } else {
            Account.find({accountType: Enum.accountType.student}).lean().exec(function(err, result) {
              if (err) {
                  console.log('Cannot get all students');
                  res.status(500).send('Cannot get all students');
              } else {
                  if (result === null) {
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

// add/update new student
router.post('/student', function(req, res){
    validateTeacher(req.params.account).then(function(isValid) {
        if (!isValid) {
            res.status(404).send('No Permission');
        } else {
            if (req.params.operation == 'create') {
                req.params.password = utils.encryptPassword(req.params.password);
                Account.create(req.params.data, function(err, result) {
                  if (err) {
                      console.log('Cannot create student');
                      res.status(500).send(req.params.data);
                  } else {
                      res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.account)});
                  }
                });
            } else if (req.params.operation == 'update') {
                Account.findById(req.params.data._id).then(function(err, result) {
                    if (err) {
                        console.log('Cannot get student' + req.params.data._id);
                        res.status(500).send('Cannot get student' + req.params.data._id);
                    } else {
                        result.accountId = req.params.data.accountId;
                        result.accountName = req.params.data.accountName;
                        result.email = req.params.data.email;
                        result.password = utils.encryptPassword(req.params.data.password);
                        result.save(function(saveErr) {
                            if (saveErr) {
                                console.log('Cannot update student ' + req.params.data._id);
                                res.status(500).send('Cannot update student ' + req.params.data._id);
                            } else {
                                res.json({success : true});
                            }
                        });
                    }
                });
            }
        }
    });
});

// delete student by id
router.delete('/student/:id', function(req, res) {
    validateTeacher(req.params.account).then(function(isValid) {
        if (!isValid) {
            res.status(404).send('No Permission');
        } else {
            Account.findByIdAndRemove(req.params._id).lean().exec(function(err, result) {
              if (err) {
                  console.log('Cannot get student ' + req.params._id);
                  res.status(500).send('Cannot get student ' + req.params._id);
              } else {
                  if (result === null) {
                      console.log('Cannot find student ' + req.params._id);
                      res.status(500).send(req.params._id);
                  } else {
                      res.json({success : true});
                  }
              }
            });
        }
    });
});

module.exports = router;
