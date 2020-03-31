'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hintSchema = new Schema({
    questionId: { type : Number, required : true },
    selectedHints: { type : [String] },
    accountId: { type : Number, required : true },
    lastUpdatedDate: { type : Date },
    questionSetId: { type : String, trim : true },
    isA : { type : Boolean }
});

module.exports = mongoose.model('hint', hintSchema);
