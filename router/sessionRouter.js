'use strict';
var express = require('express');
var router = express.Router();
var Session = require('../data/sessionSchema.js');
var Enum = require('../data/enum.js');
var utils = require('../data/utils.js');

router.getSessionById = function(accountId, questionSetId) {
    var queryObject = { $or : [{accountAId : accountId}, {accountBId : accountId}] };
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

// add/update session, it is called when a socket ends
router.addOrUpdateSession = function(data) {
    if (data._id) {
        Session.findById(data._id).then(function(result) {
            if (!result) {
                console.log('Cannot get session ' + data._id);
                console.log('Session to be saved : ');
                console.log(data);
            } else {
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
          }
        });
    }
};

module.exports = router;
