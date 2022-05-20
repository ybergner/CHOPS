'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var actionItemSchema = new Schema({
    questionId: { type : Number, required : true },
    action: { type : String, trim : true },
    answer : {},
    createdDate : { type : Date, default : Date.now }
}, { _id : false });

var actionSchema = new Schema({
    accountId : { type : String, required : true },
    accountName : { type: String },
    questionSetId : { type : String, trim : true },
    actionItems : { type : [actionItemSchema] }
});

module.exports = mongoose.model('action', actionSchema);
