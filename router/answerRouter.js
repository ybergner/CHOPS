'use strict';
var express = require('express');
var router = express.Router();
var Answer = require('../data/answerSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');

// get answers by student id
router.get('/answer/:accountId', function(req, res){
    Answer.find({accountId: req.params.accountId}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get answer ' + req.params.accountId);
            res.status(500).send('Cannot get answer ' + req.params.accountId);
        } else {
            if (!result) {
                console.log('Cannot find answer ' + req.params.accountId);
                res.json({});
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
            }
        }
    });
});

// add/update new answer
router.post('/answer', function(req, res) {
    if (req.body.operation == 'create' && !req.body.data._id) {
        req.body.data.accountId = req.body.account.accountId;
        req.body.data.lastUpdatedDate = new Date();
        Answer.create(req.body.data, function(err, result) {
          if (err || !result) {
              console.log('Cannot create answer');
              res.status(500).send(req.body.data);
          } else {
              res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
          }
        });
    } else if (req.body.operation == 'update' || req.body.data._id) {
        Answer.findById(req.body.data._id).then(function(result) {
            if (!result) {
                console.log('Cannot get answer ' + req.body.data._id);
                res.status(500).send('Cannot get answer ' + req.body.data._id);
            } else {
                result.answer = req.body.data.answer;
                result.lastUpdatedDate = new Date();
                result.selectedHint = req.body.data.selectedHint;
                result.markModified('answer');
                result.save(function(saveErr) {
                    if (saveErr) {
                        console.log('Cannot update answer ' + req.body.data._id);
                        res.status(500).send('Cannot update answer ' + req.body.data._id);
                    } else {
                        res.json({success : true});
                    }
                });
            }
        });
    }
});

module.exports = router;
