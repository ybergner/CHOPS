'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var individualHintSchema = new Schema({
    questionId: { type : Number, required : true },
    selectedHints: { type : [String] },
    createdDate : { type : Date, default : Date.now }
}, { _id : false });

var hintSchema = new Schema({
    accountId: { type : String, required : true },
    lastUpdatedDate: { type : Date },
    questionSetId: { type : String, trim : true },
    isA : { type : Boolean },
    hints : { type : [individualHintSchema] },
    currentGiveUpNumber : { type : Number }
});

module.exports = mongoose.model('hint', hintSchema);
