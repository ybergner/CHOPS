'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var individualAnswerSchema = new Schema({
    questionId: { type : Number, required : true },
    answer: {}, // mixed schema type,
    collaborationAnswer: { type : String, trim : true },
    createdDate : { type : Date, default : Date.now }
}, { _id : false });

var answerSchema = new Schema({
    accountId: { type : Number, required : true },
    lastUpdatedDate: { type : Date },
    answers : { type : [individualAnswerSchema] },
    questionSetId: { type : String, trim : true },
    isCollaborative : { type : Boolean },
    currentGiveUpNumber : { type : Number }
});

module.exports = mongoose.model('answer', answerSchema);
