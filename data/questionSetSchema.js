'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSetSchema = new Schema({
    questions: [{ type : Schema.Types.ObjectId, ref : 'question' }]
});

module.exports = mongoose.model('questionSet', questionSetSchema);
