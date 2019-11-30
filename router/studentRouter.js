'use strict';
var express = require('express');
var router = express.Router();
var Account = require('../data/accountSchema.js');
var Enum = require('../data/enum.js');

// get all students
router.get('/student', function(req, res){
  Account.find({accountType: Enum.accountType.student}).lean().exec(function(err, result) {
      if (err) {
          console.log('Cannot get all students');
          res.status(500).send('Cannot get all students');
      } else {
          if (result === null) {
              console.log('Collection is empty');
              res.json([]);
          } else {
              res.json(result);
          }
      }
  });
});

// get specific student by id
router.get('/student/:id', function(req, res){
  Account.findById(req.params.id).lean().exec(function(err, result) {
      if (err) {
          console.log('Cannot get student' + req.params.id);
          res.status(500).send('Cannot get student' + req.params.id);
      } else {
          if (result === null) {
              console.log('Cannot find student' + req.params.id);
              res.json({});
          } else {
              res.json(result);
          }
      }
  });
});

// add/update new student
router.post('/student', function(req, res){
    if (req.params.operation == 'create') {
        Account.create(req.params.data, function(err, result) {
          if (err) {
              console.log('Cannot create student');
              res.status(500).send(req.params.data);
          } else {
              res.json(result);
          }
        });
    } else if (req.params.operation == 'update') {
        Account.findById(req.params.data._id).then(function(err, result) {
            if (err) {
                console.log('Cannot get student' + req.params.data._id);
                res.status(500).send('Cannot get student' + req.params.data._id);
            } else {
                result.accountName = req.params.data.accountName;
                result.email = req.params.data.email;
                result.save(function(saveErr) {
                    if (saveErr) {
                        console.log('Cannot update student' + req.params.data._id);
                        res.status(500).send('Cannot update student' + req.params.data._id);
                    } else {
                        res.json(result);
                    }
                });
            }
        });
    }
});

// delete student by id
router.delete('/student/:id', function(req, res){
  Account.findByIdAndRemove(req.params.id).lean().exec(function(err, result) {
      if (err) {
          console.log('Cannot get student' + req.params.id);
          res.status(500).send('Cannot get student' + req.params.id);
      } else {
          if (result === null) {
              console.log('Cannot find student' + req.params.id);
              res.json({});
          } else {
              res.json(result);
          }
      }
  });
});

module.exports = router;
