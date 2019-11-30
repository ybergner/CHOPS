'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSchema = new Schema({
    questionType: { type : Number, required : true },
    question: { type : String, required : true },
    defaultAnswer: { type : String }
});

module.exports = mongoose.model('question', questionSchema);
