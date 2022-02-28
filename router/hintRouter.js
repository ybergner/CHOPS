'use strict';
var express = require('express');
var router = express.Router();
var Hint = require('../data/hintSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');
var questionRouter = require('./questionRouter.js');

// get answers by student id
router.get('/hint/:accountId', function(req, res) {
    let questionSetIds = questionRouter.getAllAvailableQuestionSetIds();
    Hint.find({accountId: req.params.accountId, currentGiveUpNumber: null, questionSetId: {$in: questionSetIds}}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get hint ' + req.params.accountId);
            res.status(403).send('Cannot get hint ' + req.params.accountId);
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
    Hint.find({accountId: req.params.accountId, questionSetId: req.params.questionSetId, currentGiveUpNumber: null}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get hint ' + req.params.accountId);
            res.status(403).send('Cannot get hint ' + req.params.accountId);
        } else {
            if (!result) {
                console.log('Cannot find hint ' + req.params.accountId);
                res.json({});
            } else {
                let hintText = [];
                for (let res of result) {
                    for (let individualHint of res.hints) {
                        let hintsText = questionRouter.getHint(res.questionSetId, individualHint.questionId, res.isA);
                        let selectedHintsText = {};
                        if (individualHint.selectedHints.length) {
                            for (let key of individualHint.selectedHints[individualHint.selectedHints.length - 1]) {
                                selectedHintsText[key] = hintsText[key];
                            }
                        }
                        hintText.push({
                            questionId : individualHint.questionId,
                            hintText : selectedHintsText
                        });
                    }
                }
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint), hintText : hintText});
            }
        }
    });
});

// add/update new answer
router.post('/hint', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.student) {
        if (req.body.operation == 'create' && !req.body.data.createdDate) {
            let newHint = {};
            newHint.accountId = req.body.account.accountId;
            newHint.lastUpdatedDate = new Date();
            newHint.questionSetId = req.body.questionSetId;
            newHint.isA = req.body.isA;
            newHint.hints = [];
            let individualH = {
                questionId : req.body.data.questionId,
                selectedHints : [req.body.data.selectedHints]
            };
            newHint.hints.push(individualH);
            if (req.body.data.selectedHints && req.body.data.selectedHints.length) {
                let hintsText = questionRouter.getHint(req.body.questionSetId, req.body.data.questionId, req.body.isA);
                let selectedHintsText = {};
                for (let key of req.body.data.selectedHints) {
                    selectedHintsText[key] = hintsText[key];
                }
                let hintText = {
                    questionId : req.body.data.questionId,
                    hintText : selectedHintsText
                };
                Hint.create(newHint, function(err, result) {
                  if (err || !result) {
                      console.log('Cannot create hint');
                      res.status(403).send(req.body.data);
                  } else {
                      res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint), hintText : hintText});
                  }
                });
            } else {
                res.status(404).send('selectedHints cannot be empty');
            }
        } else if (req.body.operation == 'update' || req.body.data.createdDate) {
            if (req.body.data.selectedHints && req.body.data.selectedHints.length) {
                Hint.findById(req.body.hintId).then(function(result) {
                    if (!result) {
                        console.log('Cannot get hint ' + req.body.hintId);
                        res.status(403).send('Cannot get hint ' + req.body.hintId);
                    } else {
                        let validHints = [];
                        let dbIndividualHint;
                        let isReselect = req.body.isReselect;
                        for (let hint of result.hints) {
                            if (hint.questionId == req.body.data.questionId) {
                                dbIndividualHint = hint;
                                break;
                            }
                        }
                        if (dbIndividualHint && !isReselect) {
                            for (let hint of req.body.data.selectedHints) {
                                if (!dbIndividualHint.selectedHints[dbIndividualHint.selectedHints.length - 1].includes(hint)) {
                                    validHints.push(hint);
                                }
                            }
                        } else {
                            validHints = req.body.data.selectedHints;
                        }
                        if (validHints.length) {
                            let hintsText = questionRouter.getHint(result.questionSetId, req.body.data.questionId, result.isA);
                            let selectedHintsText = {};
                            for (let key of req.body.data.selectedHints) {
                                selectedHintsText[key] = hintsText[key];
                            }
                            let hintText = {
                                questionId : req.body.data.questionId,
                                hintText : selectedHintsText
                            };
                            if (!dbIndividualHint) {
                                dbIndividualHint = {questionId: req.body.data.questionId, selectedHints: [req.body.data.selectedHints]};
                                result.hints.push(dbIndividualHint);
                            } else if (isReselect) {
                                dbIndividualHint.selectedHints.push(req.body.data.selectedHints);
                            } else {
                                dbIndividualHint.selectedHints[dbIndividualHint.selectedHints.length - 1] = req.body.data.selectedHints;
                            }
                            result.lastUpdatedDate = new Date();
                            result.save(function(saveErr) {
                                if (saveErr) {
                                    console.log('Cannot update hint ' + result._id);
                                    res.status(403).send('Cannot update hint ' + result._id);
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

router.post('/giveUpHint', function(req, res) {
    Hint.find({accountId: req.body.account.accountId, questionSetId: req.body.questionSetId, currentGiveUpNumber: {$ne: null}}).lean().exec(function(err, results) {
        if (err) {
            console.log('Cannot get hint ' + req.body.account.accountId);
            res.status(403).send('Cannot get hint ' + req.body.account.accountId);
        } else if (results) {
            Hint.findById(req.body.hintId).then(function(result) {
                if (!result) {
                    console.log('Cannot get hint ' + req.body.hintId);
                    res.status(403).send('Cannot get hint ' + req.body.hintId);
                } else {
                    result.lastUpdatedDate = new Date();
                    result.currentGiveUpNumber = results.length + 1;
                    result.save(function(saveErr) {
                        if (saveErr) {
                            console.log('Cannot update hint ' + result._id);
                            res.status(403).send('Cannot update hint ' + result._id);
                        } else {
                            res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.hint)});
                        }
                    });
                }
            });
        }
    });
});

router.deleteHintsByAccountId = function(accountId) {
    return Hint.deleteMany({accountId : accountId}).then(function(result) {
        if (!result) {
            console.log('Cannot find hint by account id: ' + accountId);
            return null;
        } else {
            return result;
        }
    });
};

module.exports = router;
