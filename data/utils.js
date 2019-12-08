'use strict';
var Enum = require('./enum.js');
var utils = {};
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'abcd1234';

var convertAccount = function(dbObject) {
    if (dbObject) {
        let res = {};
        res.accountId = dbObject.accountId;
        res.accountName = dbObject.accountName;
        res.accountType = dbObject.accountType;
        res.email = dbObject.email;
        res.password = utils.decryptPassword(dbObject.password);
        return res;
    }
    return dbObject;
};

var convertAnswer = function(dbObject) {
    if (dbObject) {
        let res = {};
        res.questionId = dbObject.questionId;
        res.answer = dbObject.answer;
        res.accountId = dbObject.accountId;
        res.lastUpdatedDate = dbObject.lastUpdatedDate;
        res.questionSetId = dbObject.questionSetId;
        res.selectedHint = dbObject.selectedHint;
        return res;
    }
    return dbObject;
};

var convert = function(dbObject, schemaType) {
    if (schemaType) {
        if (schemaType === Enum.schemaType.account) {
            return convertAccount(dbObject);
        } else if (schemaType === Enum.schemaType.answer) {
            return convertAnswer(dbObject);
        }
    }
    return dbObject;
}

utils.convertToFrontEndObject = function(dbObjects, schemaType) {
    if (Array.isArray(dbObjects)) {
        let res = [];
        for (let obj of dbObjects) {
            res.push(convert(obj, schemaType));
        }
        return res;
    } else {
        return convert(dbObjects, schemaType);
    }
};

utils.encryptPassword = function(pw) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(pw, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

utils.decryptPassword = function(dbPw) {
    var decipher = crypto.createDecipher(algorithm, password);
    var decrypted = decipher.update(dbPw, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = utils;
