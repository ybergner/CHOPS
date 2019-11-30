'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerSchema = new Schema({
    questionId: { type : String, required : true },
    answer: { type : String, trim : true },
    accountId: { type : String, required : true },
    lastUpdatedDate: { type : Date },
    questionSetId: { type : String }
});

module.exports = mongoose.model('answer', answerSchema);
