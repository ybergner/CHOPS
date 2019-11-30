'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSchema = new Schema({
    questionType: { type : Number, required : true },
    question: { type : String, required : true },
    // This is only meant for single/multiple choice questions
    defaultAnswer: { type : [String], default: undefined }
});

module.exports = mongoose.model('question', questionSchema);
