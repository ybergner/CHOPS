'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
    accountId: { type : String, required : true, unique : true },
    accountName: { type : String, required : true },
    accountType: { type : Number, required : true },
    email: { type : String },
    password: { type : String, required : true }
});

module.exports = mongoose.model('account', accountSchema);
