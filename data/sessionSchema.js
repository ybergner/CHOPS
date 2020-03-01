'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    accountId : { type : Number, required : true },
    message : { type : String, trim : true },
    createdDate : { type : Date, default : Date.now }
});

var selectedHintsSchema = new Schema({
    questionId: { type : Number, required : true },
    selectedHints: { type : [String] }
});

var sessionSchema = new Schema({
    accountAId : { type : Number, required : true },
    accountBId : { type : Number, required : true },
    questionSetId : { type : String, trim : true },
    messages : { type : [messageSchema] },
    lastUpdatedDate : { type : Date },
    accountASelectedHints: { type : [selectedHintsSchema] },
    accountBSelectedHints: { type : [selectedHintsSchema] },
});

module.exports = mongoose.model('session', sessionSchema);
