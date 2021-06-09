const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
var results = [];
var Session = require('../sessionSchema.js');
var Account = require('../accountSchema.js');
var dbUrl = '';
var mongoose = require('mongoose');
var questionRouter = require('../../router/questionRouter.js')
var questionSetIds = [];

function readCSV() {
    let allPromise = [];
    questionSetIds = questionRouter.getAllAvailableQuestionSetIds();
    fs.createReadStream('data/sessionGenerator/sessions.csv')
      .pipe(csv( { headers: ['StudentA', 'StudentB', 'QuestionSetId'], skipLines: 1 }))
      .on('data', function(data) {
          allPromise.push(processRows(data));
          results.push(data);
      })
      .on('end', function() {
          Promise.all(allPromise).then(function() {
              //console.log(results);
              const csvWriter = createCsvWriter({
                  path: 'data/sessionGenerator/sessions_results.csv',
                  header: [{id: 'StudentA', title: 'StudentA'}, {id: 'StudentB', title: 'StudentB'}, {id: 'QuestionSetId', title: 'QuestionSetId'}, {id: 'Result', title: 'Result'}]
              });
              csvWriter.writeRecords(results).then(() => {
                  console.log('Successfully write result into new file.');
              }).finally(() => {
                  process.exit(1);
              });
          });
      });
};

function processRows(data) {
    let promise = new Promise(function(resolve, reject) {
        if (!questionSetIds.includes(data.QuestionSetId)) {
            data.Result = 'Cannot find question set with questionSetId';
            resolve();
        } else {
            Account.find({ accountId : { $in : [data.StudentA, data.StudentB] } }).lean().exec(function(err, accounts) {
                if (err || !accounts || accounts.length !== 2) {
                    data.Result = 'Cannot find students with ids.';
                    resolve();
                } else {
                    Session.findOne({ $or : [{ accountAId : { $in : [data.StudentA, data.StudentB] } }, { accountBId : { $in : [data.StudentA, data.StudentB] } }],
                        currentGiveUpNumber: null, questionSetId: data.QuestionSetId }).lean().exec(function(err, result) {
                            if (err) {
                                console.log('Error while checking if any of student has session alive.');
                                console.log(data);
                                data.Result = 'Error while checking if any of student has session alive.';
                                resolve();
                            } else if (result) {
                                data.Result = 'Students already have sessions connected with someone else.';
                                resolve();
                            } else {
                                let session = {
                                    accountAId : data.StudentA,
                                    accountBId : data.StudentB,
                                    accountAName : accounts.find(acc => acc.accountId == data.StudentA).accountName,
                                    accountBName : accounts.find(acc => acc.accountId == data.StudentB).accountName,
                                    questionSetId : data.QuestionSetId,
                                    lastUpdatedDate : new Date()
                                };
                                Session.create(session, function(err, result) {
                                  if (err || !result) {
                                      console.log('Cannot create session.');
                                      console.log('Session to be saved : ');
                                      console.log(session);
                                      data.Result = 'Cannot create session with this row due to db issue.';
                                      resolve();
                                  } else {
                                      data.Result = 'Success.';
                                      resolve();
                                  }
                                });
                            }
                    });
                }
            });
        }
    });
    return promise;
};


mongoose.connect(dbUrl, {useNewUrlParser: true}, function(err){
    if (err) {
        console.log(err);
        console.log('Connection to Database failed');
        process.exit(1);
    } else {
        console.log('Database Connected');
        readCSV();
    }
});
