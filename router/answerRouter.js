'use strict';
var express = require('express');
var router = express.Router();
var Answer = require('../data/answerSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');

// get answers by student id
router.get('/answer/:studentId', function(req, res){
    Answer.find({accountId: params.studentId}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get answer ' + req.params.studentId);
            res.status(500).send('Cannot get answer ' + req.params.studentId);
        } else {
            if (result === null) {
                console.log('Cannot find student ' + req.params.studentId);
                res.json({});
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
            }
        }
    });
});

// add/update new answer
router.post('/answer', function(req, res) {
    if (req.params.operation == 'create') {
        Answer.create(req.params.data, function(err, result) {
          if (err) {
              console.log('Cannot create student');
              res.status(500).send(req.params.data);
          } else {
              res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
          }
        });
    } else if (req.params.operation == 'update') {
        Answer.findById(req.params.data._id).then(function(err, result) {
            if (err) {
                console.log('Cannot get answer' + req.params.data._id);
                res.status(500).send('Cannot get answer' + req.params.data._id);
            } else {
                result.answer = req.params.data.answer;
                result.lastUpdatedDate = new Date();
                result.selectedHint = req.params.data.selectedHint;
                result.save(function(saveErr) {
                    if (saveErr) {
                        console.log('Cannot update answer ' + req.params.data._id);
                        res.status(500).send('Cannot update answer ' + req.params.data._id);
                    } else {
                        res.json({success : true});
                    }
                });
            }
        });
    }
});

/*
let bulkWriteArray = [];
let now = new Date();
for (let answer of req.params.data) {
    bulkWriteArray.push(
        {
            updateOne : {
                filter: { _id : answer._id },
                update: { answer : answer.answer, lastUpdatedDate : now }
            }
        }
    );
}
if (bulkWriteArray.length) {
    Answer.bulkWrite(bulkWriteArray).then(function(bulkWriteResult) {
        res.json({success : true, data : bulkWriteResult});
    }).catch(function(err){
        console.log(err);
        res.status(500).send('Cannot bulk update answer');
    });
} else {
    res.status(500).send('Cannot bulk update answer: no answer to update');
}
*/

module.exports = router;
