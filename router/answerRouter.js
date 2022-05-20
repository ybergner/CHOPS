'use strict';
var express = require('express');
var router = express.Router();
var Answer = require('../data/answerSchema.js');
var Action = require('../data/actionSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');
var questionRouter = require('./questionRouter.js');
const { checkTwoVariableFormula } = require('../data/checkAnswerSettingUtils.js');

// get answers by student id
router.get('/answer/:accountId', function(req, res) {
    let questionSetIds = questionRouter.getAllAvailableQuestionSetIds();
    Answer.find({accountId: req.params.accountId, currentGiveUpNumber: null, questionSetId: {$in: questionSetIds}}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get answer ' + req.params.accountId);
            res.status(403).send('Cannot get answer ' + req.params.accountId);
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

// get answers by student id
router.get('/answer/:accountId/:questionSetId', function(req, res) {
    Answer.find({accountId: req.params.accountId, questionSetId: req.params.questionSetId, currentGiveUpNumber: null}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get answer ' + req.params.accountId);
            res.status(403).send('Cannot get answer ' + req.params.accountId);
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


// check answers
router.post('/checkAnswer', function(req, res) {
    if (req.body.data && req.body.data.length) {
        let feedbacks = [], type = questionRouter.getQuestionType(req.body.questionSetId, req.body.questionId), otherAttemptObject = req.body.otherAttempts ? req.body.otherAttempts : [];
        if (type === 'multipleOpenQuestion') {
            for (let index in req.body.data) {
                let fb = {}, attempt = req.body.data[index], otherAttempt = otherAttemptObject[index];
                for (let letter in attempt.multipleOpenQuestion) {
                    if (attempt.multipleOpenQuestion[letter] != null) {
                        fb[letter] = questionRouter.checkAnswers(attempt, req.body.questionSetId, req.body.questionId, req.body.isA, letter, otherAttempt);
                    }
                }
                feedbacks.push(fb);
            }
        } else {
            for (let index in req.body.data) {
                let attempt = req.body.data[index], otherAttempt = otherAttemptObject[index];
                feedbacks.push(questionRouter.checkAnswers(attempt, req.body.questionSetId, req.body.questionId, req.body.isA, null, otherAttempt));
            }
        }
        res.json({success : true, data : feedbacks});
    } else {
        res.status(403).send('Getting empty data');
    }
});

// add/update new answer
router.post('/answer', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.student) {
        if (req.body.operation == 'create' && !req.body.data._id) {
            req.body.data.accountId = req.body.account.accountId;
            req.body.data.lastUpdatedDate = new Date();
            Answer.create(req.body.data, function(err, result) {
              if (err || !result) {
                  console.log('Cannot create answer');
                  res.status(403).send(req.body.data);
              } else {
                  res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
              }
            });
        } else if (req.body.operation == 'update' || req.body.data._id) {
            Answer.findById(req.body.data._id).then(function(result) {
                if (!result) {
                    console.log('Cannot get answer ' + req.body.data._id);
                    res.status(403).send('Cannot get answer ' + req.body.data._id);
                } else {
                    result.answers = req.body.data.answers;
                    result.isSubmitted = req.body.data.isSubmitted;
                    result.lastUpdatedDate = new Date();
                    result.save(function(saveErr) {
                        if (saveErr) {
                            console.log('Cannot update answer ' + req.body.data._id);
                            res.status(403).send('Cannot update answer ' + req.body.data._id);
                        } else {
                            res.json({success : true});
                        }
                    });
                }
            });
        } else {
            res.status(404).send('invalid operation');
        }
    } else {
        res.status(404).send('Only student can submit answer');
    }

});

// add/update new answer
router.post('/giveUpAnswer', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.student) {
        if (req.body.data._id && !req.body.data.currentGiveUpNumber) {
            Answer.find({accountId: req.body.account.accountId, questionSetId: req.body.data.questionSetId, currentGiveUpNumber: {$ne: null}}).lean().exec(function(err, results) {
                if (err) {
                    console.log(err);
                    res.status(403).send('system error');
                } else if (results) {
                    Answer.findById(req.body.data._id).then(function(result) {
                        if (!result) {
                            console.log('Cannot get answer ' + req.body._id);
                            res.status(403).send('Cannot get answer ' + req.body._id);
                        } else {
                            result.lastUpdatedDate = new Date();
                            result.currentGiveUpNumber = results.length + 1;
                            result.isSubmitted = true;
                            result.save(function(saveErr) {
                                if (saveErr) {
                                    console.log('Cannot update answer ' + result._id);
                                    res.status(403).send('Cannot update answer ' + result._id);
                                } else {
                                    res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.answer)});
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.status(404).send('invalid operation');
        }
    } else {
        res.status(404).send('Only student can give up answer');
    }

});

router.post('/action/list', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.teacher) {
        Action.find({}).lean().then(function(actions) {
            let response = [];
            if (actions) {
                for (let action of actions) {
                    response.push({
                        id: action._id,
                        accountId: action.accountId,
                        accountName: action.accountName,
                        questionSetId: action.questionSetId,
                        count: action.actionItems.length
                    });
                }
            }
            res.json({success: true, data: response});
        });
    } else {
        res.status(403).send('Forbidden');
    }
});

router.post('/action/details', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.teacher) {
        Action.find({ '_id': {$in : req.body.data} }).lean().then(function(actions) {
            let response = [];
            if (actions) {
                for (let action of actions) {
                    for (let item of action.actionItems) {
                        response.push({
                            accountId: action.accountId,
                            accountName: action.accountName,
                            questionSetId: action.questionSetId,
                            questionId: item.questionId,
                            action: item.action,
                            answer: item.answer,
                            createdDate: item.createdDate
                        });
                    }
                }
            }
            res.json({success: true, data: response});
        });
    } else {
        res.status(403).send('Forbidden');
    }
});

// add/update new action
router.post('/action', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.student) {
        Action.findOne({accountId: req.body.account.accountId, questionSetId: req.body.questionSetId}).then(function(result) {
            if (!result) {
                // create new action
                let action = {
                    accountId : req.body.account.accountId,
                    accountName : req.body.account.accountName,
                    questionSetId : req.body.questionSetId,
                    actionItems : []
                };
                action.actionItems.push(req.body.data);
                Action.create(action, function(err, result) {
                    if (err || !result) {
                        console.log('Cannot create action');
                        res.status(403).send('Cannot create action');
                    } else {
                        res.json({success : true});
                    }
                });
            } else {
                // update existing action
                if (!result.accountName) {
                    result.accountName = req.body.account.accountName;
                }
                result.actionItems.push(req.body.data);
                result.save(function(saveErr) {
                    if (saveErr) {
                        console.log('Cannot update action ' + result._id);
                        res.status(403).send('Cannot update action ' + result._id);
                    } else {
                        res.json({success : true});
                    }
                });
            }
        });
    } else {
        res.status(404).send('Only student can save action');
    }
});

// get answers by student id
router.post('/validateFormula', function(req, res) {
    if (req.body.formula && req.body.a && req.body.b) {
        res.json({success : true, data : checkTwoVariableFormula(req.body.a, req.body.formula, req.body.b).isCorrected});
    } else {
        res.status(403).send('Getting empty data');
    }
});

router.deleteActionsByAccountId = function(accountId) {
    return Action.deleteMany({accountId : accountId}).then(function(result) {
        if (!result) {
            console.log('Cannot find actions by account id: ' + accountId);
            return null;
        } else {
            return result;
        }
    });
};

router.deleteAnswersByAccountId = function(accountId) {
    return Answer.deleteMany({accountId : accountId}).then(function(result) {
        if (!result) {
            console.log('Cannot find answers by account id: ' + accountId);
            return null;
        } else {
            return result;
        }
    });
};

module.exports = router;
