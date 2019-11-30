'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
    accountId: { type : Number, required : true, unique : true },
    accountName: { type : String, required : true },
    accountType: { type : Number, required : true },
    email: { type : String },
});

module.exports = mongoose.model('account', accountSchema);
