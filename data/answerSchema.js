'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerSchema = new Schema({
    questionId: { type : Number, required : true },
    answer: { type : String, trim : true },
    accountId: { type : Number, required : true },
    lastUpdatedDate: { type : Date },
    questionSetId: { type : Number },
    selectedHint: { type : [String] }
});

module.exports = mongoose.model('answer', answerSchema);
