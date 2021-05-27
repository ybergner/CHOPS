var mongoose = require('mongoose');
var dbUrl = '';
var Account = require('../accountSchema.js');
var Action = require('../actionSchema.js');
var Answer = require('../answerSchema.js');
var Hint = require('../hintSchema.js');
var Session = require('../sessionSchema.js');

mongoose.connect(dbUrl, {useNewUrlParser: true}, function(err){
    if (err) {
        console.log(err);
        console.log('Connection to Database failed');
        process.exit(1);
    } else {
        console.log('Database Connected');
        Account.find({}, function(err, results) {
            if (results && results.length) {
                results.forEach(function(result) {
                    result.accountId = result.accountId.replace('temp', '');
                    result.save(function(err) {
                        if (!err) {
                            console.log('updated account temp');
                        }
                    });
                });
            }
        });

        Action.find({}, function(err, results) {
            if (results && results.length) {
                results.forEach(function(result) {
                    result.accountId = result.accountId.replace('temp', '');
                    result.save(function(err) {
                        if (!err) {
                            console.log('updated action temp');
                        }
                    });
                });
            }
        });

        Answer.find({}, function(err, results) {
            if (results && results.length) {
                results.forEach(function(result) {
                    result.accountId = result.accountId.replace('temp', '');
                    result.save(function(err) {
                        if (!err) {
                            console.log('updated answer temp');
                        }
                    });
                });
            }
        });

        Hint.find({}, function(err, results) {
            if (results && results.length) {
                results.forEach(function(result) {
                    result.accountId = result.accountId.replace('temp', '');
                    result.save(function(err) {
                        if (!err) {
                            console.log('updated hint temp');
                        }
                    });
                });
            }
        });

        Session.find({}, function(err, results) {
            if (results && results.length) {
                results.forEach(function(result) {
                    result.accountAId = result.accountAId.replace('temp', '');
                    result.accountBId = result.accountBId.replace('temp', '');
                    if (result.messages && result.messages.length) {
                        result.messages.forEach(function(item, i) {
                            item.accountId = item.accountId.replace('temp', '');
                        });
                    }
                    result.save(function(err) {
                        if (!err) {
                            console.log('updated session temp');
                        }
                    });
                });
            }
        });


        //process.exit(1);
    }
});
