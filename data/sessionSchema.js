'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    accountId : { type : Number, required : true },
    message : { type : String, trim : true },
    createdDate : { type : Date, default : Date.now }
}, { _id : false });

var sessionSchema = new Schema({
    accountAId : { type : Number, required : true },
    accountBId : { type : Number, required : true },
    accountAName : { type : String, trim : true },
    accountBName : { type : String, trim : true },
    questionSetId : { type : String, trim : true },
    messages : { type : [messageSchema] },
    lastUpdatedDate : { type : Date },
    currentGiveUpNumber : { type : Number }
});

module.exports = mongoose.model('session', sessionSchema);
