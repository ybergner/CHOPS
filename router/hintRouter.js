'use strict';
var express = require('express');
var router = express.Router();
var Hint = require('../data/hintSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');
var questionRouter = require('./questionRouter.js');

// get answers by student id
router.get('/hint/:accountId', function(req, res) {
    Hint.find({accountId: req.params.accountId}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get hint ' + req.params.accountId);
            res.status(500).send('Cannot get hint ' + req.params.accountId);
        } else {
            if (!result) {
                console.log('Cannot find hint ' + req.params.accountId);
                res.json({});
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint)});
            }
        }
    });
});

// get answers by student id
router.get('/hint/:accountId/:questionSetId', function(req, res) {
    Hint.find({accountId: req.params.accountId, questionSetId: req.params.questionSetId}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get hint ' + req.params.accountId);
            res.status(500).send('Cannot get hint ' + req.params.accountId);
        } else {
            if (!result) {
                console.log('Cannot find hint ' + req.params.accountId);
                res.json({});
            } else {
                let hintText = [];
                for (let selectedHints of result) {
                    let hintsText = questionRouter.getHint(selectedHints.questionSetId, selectedHints.questionId, selectedHints.isA);
                    let selectedHintsText = {};
                    for (let key of selectedHints.selectedHints) {
                        selectedHintsText[key] = hintsText[key];
                    }
                    hintText.push({
                        questionId : selectedHints.questionId,
                        hintText : selectedHintsText
                    });
                }
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint), hintText : hintText});
            }
        }
    });
});

// add/update new answer
router.post('/hint', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.student) {
        if (req.body.operation == 'create' && !req.body.data._id) {
            req.body.data.accountId = req.body.account.accountId;
            req.body.data.lastUpdatedDate = new Date();
            if (req.body.data.selectedHints && req.body.data.selectedHints.length) {
                let hintsText = questionRouter.getHint(req.body.data.questionSetId, req.body.data.questionId, req.body.data.isA);
                let selectedHintsText = {};
                for (let key of req.body.data.selectedHints) {
                    selectedHintsText[key] = hintsText[key];
                }
                let hintText = {
                    questionId : req.body.data.questionId,
                    hintText : selectedHintsText
                };
                Hint.create(req.body.data, function(err, result) {
                  if (err || !result) {
                      console.log('Cannot create hint');
                      res.status(500).send(req.body.data);
                  } else {
                      res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint), hintText : hintText});
                  }
                });
            } else {
                res.status(404).send('selectedHints cannot be empty');
            }
        } else if (req.body.operation == 'update' || req.body.data._id) {
            if (req.body.data.selectedHints && req.body.data.selectedHints.length) {
                Hint.findById(req.body.data._id).then(function(result) {
                    if (!result) {
                        console.log('Cannot get hint ' + req.body.data._id);
                        res.status(500).send('Cannot get hint ' + req.body.data._id);
                    } else {
                        let validHints = [];
                        for (let selectedHints of result.selectedHints) {
                            for (let hint of req.body.data.selectedHints) {
                                if (!selectedHints.includes(hint)) {
                                    validHints.push(hint);
                                }
                            }
                        }
                        if (validHints.length) {
                            let hintsText = questionRouter.getHint(req.body.data.questionSetId, req.body.data.questionId, req.body.data.isA);
                            let selectedHintsText = {};
                            for (let key of req.body.data.selectedHints) {
                                selectedHintsText[key] = hintsText[key];
                            }
                            let hintText = {
                                questionId : req.body.data.questionId,
                                hintText : selectedHintsText
                            };
                            result.selectedHints = req.body.data.selectedHints;
                            result.lastUpdatedDate = new Date();
                            result.save(function(saveErr) {
                                if (saveErr) {
                                    console.log('Cannot update hint ' + req.body.data._id);
                                    res.status(500).send('Cannot update hint ' + req.body.data._id);
                                } else {
                                    res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint), hintText : hintText});
                                }
                            });
                        } else {
                            res.status(404).send('selectedHints cannot be the same');
                        }
                    }
                });
            } else {
                res.status(404).send('selectedHints cannot be empty');
            }
        } else {
            res.status(404).send('invalid operation');
        }
    } else {
        res.status(404).send('Only student can submit hint');
    }
});

router.deleteHintsByAccountId = function(accountId) {
    return Hint.deleteMany({accountId : accountId}).then(function(result) {
        if (!result) {
            console.log('Cannot find hint by account id: ' + id);
            return null;
        } else {
            return result;
        }
    });
};

module.exports = router;
