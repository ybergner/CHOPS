'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerSchema = new Schema({
    questionId: { type : Number, required : true },
    answer: {}, // mixed schema type
    accountId: { type : Number, required : true },
    lastUpdatedDate: { type : Date },
    questionSetId: { type : String, trim : true },
    isCollaborative : { type : Boolean }
});

module.exports = mongoose.model('answer', answerSchema);
