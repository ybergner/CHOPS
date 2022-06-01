'use strict';
var express = require('express');
var router = express.Router();
var Session = require('../data/sessionSchema.js');
var Action = require('../data/actionSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');
var questionRouter = require('./questionRouter.js');

// get sessions by student id
router.get('/session/:accountId', function(req, res) {
    let questionSetIds = questionRouter.getAllAvailableQuestionSetIds();
    Session.find({ $or : [{accountAId : req.params.accountId}, {accountBId : req.params.accountId}], currentGiveUpNumber: null, questionSetId: {$in: questionSetIds}}).lean().exec(function(err, result) {
        if (err) {
            console.log('Cannot get session ' + req.params.accountId);
            res.status(403).send('Cannot get session ' + req.params.accountId);
        } else {
            if (!result) {
                console.log('Cannot find session ' + req.params.accountId);
                res.json({});
            } else {
                res.json({success : true, data : utils.convertToFrontEndObject(result, Enum.schemaType.session)});
            }
        }
    });
});

router.post('/session/list', function(req, res) {
    if (req.body.account && req.body.account.accountType == Enum.accountType.teacher) {
        Session.find({}).lean().then(function(sessions) {
            let response = [], promise = [];
            if (sessions) {
                for (let session of sessions) {
                    response.push({
                        accountAId: session.accountAId,
                        accountAName: session.accountAName,
                        accountBId: session.accountBId,
                        accountBName: session.accountBName,
                        questionSetId: session.questionSetId,
                        createdDate: session.createdDate || session.lastUpdatedDate,
                        isGiveUp: !!session.currentGiveUpNumber
                    });
                    promise.push(Action.find({accountId: {$in: [session.accountAId, session.accountBId] }, questionSetId: session.questionSetId}, '_id').lean());
                }
            }
            Promise.all(promise).then(function(actionIdList) {
                actionIdList.forEach(function(item, i) {
                    let actionIds = item.map(function(d) {
                        return d._id;
                    });
                    response[i].actionIds = actionIds;
                });
            }).finally(function() {
                res.json({success: true, data: response});
            });
        });
    } else {
        res.status(403).send('Forbidden');
    }
});

router.getSessionById = function(accountId, questionSetId) {
    var queryObject = { $or : [{accountAId : accountId}, {accountBId : accountId}], currentGiveUpNumber: null};
    if (questionSetId) {
        queryObject.questionSetId = questionSetId;
    }
    return Session.find(queryObject).then(function(result) {
        if (!result) {
            console.log('Cannot find session from ' + accountId);
            return null;
        } else {
            return result;
        }
    });
};

router.deleteSessionByAccountId = function(accountId) {
    return Session.deleteMany({$or : [{accountAId : accountId}, {accountBId : accountId}]}).then(function(result) {
        if (!result) {
            console.log('Cannot find session by account id: ' + accountId);
            return null;
        } else {
            return result;
        }
    });
};

router.getSessionCurrentGiveUpNumber = function(data) {
    if (!data.currentGiveUpNumber) {
        return Session.find({accountAId : data.accountAId, accountBId : data.accountBId, currentGiveUpNumber: {$ne: null}}).then(function(result) {
            if (!result) {
                console.log('Cannot find session from ' + data);
                return 1;
            } else {
                return result.length + 1;
            }
        });
    }
}

// add/update session, it is called when a socket ends
router.addOrUpdateSession = function(data) {
    if (data._id) {
        Session.findById(data._id).then(function(result) {
            if (!result) {
                console.log('Cannot get session ' + data._id);
                console.log('Session to be saved : ');
                console.log(data);
            } else {
                result.currentGiveUpNumber = data.currentGiveUpNumber;
                result.messages = data.messages;
                result.lastUpdatedDate = new Date();
                result.save(function(saveErr) {
                    if (saveErr) {
                        console.log('Cannot update session ' + data._id);
                        console.log('Session to be saved : ');
                        console.log(data);
                    }
                });
            }
        });
    } else {
        data.lastUpdatedDate = new Date();
        Session.create(data, function(err, result) {
          if (err || !result) {
              console.log('Cannot create session');
              console.log('Session to be saved : ');
              console.log(data);
          } else {
              data.messages = result.message;
              data._id = result._id;
          }
        });
    }
};

module.exports = router;
