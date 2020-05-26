'use strict';
var xl = require('excel4node');
var express = require('express');
var router = express.Router();
var Answer = require('../data/answerSchema.js');
var Hint = require('../data/hintSchema.js');
var utils = require('../data/utils.js');
var studentRouter = require('./studentRouter.js');

router.post('/getReport', function(req, res) {
    studentRouter.validateTeacher(req.body.account).then(function(isValid) {
        if (!isValid) {
            res.status(404).send('No Permission');
        } else {
            Promise.all([Answer.find({}).lean(), Hint.find({}).lean()]).then(function(arr){
                generateAndSendReportSheet(arr[0], arr[1], res);
            }).catch(function(err) {
                console.log(err);
                res.status(500).send('Server errors');
            });
        }
    });
});

var generateAndSendReportSheet = function(answers, hints, res) {
    // Create a new instance of a Workbook class
    var wb = new xl.Workbook();

    let answerMap = {};

    for (let ans of answers) {
        if (!answerMap[ans.questionSetId]) {
            answerMap[ans.questionSetId] = {};
        }
        if (!answerMap[ans.questionSetId][ans.accountId + '']) {
            answerMap[ans.questionSetId][ans.accountId + ''] = {};
        }
        if (ans.currentGiveUpNumber && !answerMap[ans.questionSetId][ans.accountId + ''][ans.currentGiveUpNumber + '']) {
            answerMap[ans.questionSetId][ans.accountId + ''][ans.currentGiveUpNumber + ''] = {
                answers : [],
                hints : []
            };
        } else if (!ans.currentGiveUpNumber && !answerMap[ans.questionSetId][ans.accountId + ''].current) {
            answerMap[ans.questionSetId][ans.accountId + ''].current = {
                answers : [],
                hints : []
            };
        }

        let ansRef = ans.currentGiveUpNumber ? answerMap[ans.questionSetId][ans.accountId + ''][ans.currentGiveUpNumber + ''] : answerMap[ans.questionSetId][ans.accountId + ''].current;
        ansRef.lastUpdatedDate = ans.lastUpdatedDate;
        for (let individualAnswer of ans.answers) {
            ansRef.answers[individualAnswer.questionId - 1] = individualAnswer;
        }
    }

    for (let hint of hints) {
        if (!answerMap[hint.questionSetId]) {
            answerMap[hint.questionSetId] = {};
        }
        if (!answerMap[hint.questionSetId][hint.accountId + '']) {
            answerMap[hint.questionSetId][hint.accountId + ''] = {};
        }
        if (hint.currentGiveUpNumber && !answerMap[hint.questionSetId][hint.accountId + ''][hint.currentGiveUpNumber + '']) {
            answerMap[hint.questionSetId][hint.accountId + ''][hint.currentGiveUpNumber + ''] = {
                answers : [],
                hints : []
            };
        } else if (!hint.currentGiveUpNumber && !answerMap[hint.questionSetId][hint.accountId + ''].current) {
            answerMap[hint.questionSetId][hint.accountId + ''].current = {
                answers : [],
                hints : []
            };
        }

        let ansRef = hint.currentGiveUpNumber ? answerMap[hint.questionSetId][hint.accountId + ''][hint.currentGiveUpNumber + ''] : answerMap[hint.questionSetId][hint.accountId + ''].current;

        if (!ansRef.lastUpdatedDate) {
            ansRef.lastUpdatedDate = hint.lastUpdatedDate;
        }
        for (let individualHint of hint.hints) {
            ansRef.hints[individualHint.questionId - 1] = individualHint;
        }
    }

    var headerStyle = wb.createStyle({
        font : { bold : true }
    });
    for (let questionSetId in answerMap) {
        // Add Worksheets to the workbook
        var ws = wb.addWorksheet(questionSetId);
        ws.cell(1, 1).string('Quiz Id').style(headerStyle);
        ws.cell(1, 2).string('Student Id').style(headerStyle);
        ws.cell(1, 3).string('Answer Submit Time').style(headerStyle);
        ws.column(3).setWidth(20);
        ws.cell(1, 4).string('Give Up').style(headerStyle);
        var firstRun = true;
        var rowNum = 2;
        for (let accountId in answerMap[questionSetId]) {
            for (let currentGiveUpNumber in answerMap[questionSetId][accountId]) {
                let individualAnswers = answerMap[questionSetId][accountId][currentGiveUpNumber].answers;
                let individualHints = answerMap[questionSetId][accountId][currentGiveUpNumber].hints;
                for (let i = 0; i < individualAnswers.length; i++) {
                    let columnNumToStart = i * 2 + 5;
                    if (firstRun) {
                        ws.cell(1, columnNumToStart).string('Question ' + (i + 1)).style(headerStyle);
                        ws.cell(1, columnNumToStart + 1).string('Hint ' + (i + 1)).style(headerStyle);
                    }
                    if (individualAnswers[i].answer.singleChoice) {
                        ws.cell(rowNum, columnNumToStart).string(individualAnswers[i].answer.singleChoice);
                    } else if (individualAnswers[i].answer.multipleChoice) {
                        let arr = [];
                        for (let key in individualAnswers[i].answer.multipleChoice) {
                            if (individualAnswers[i].answer.multipleChoice[key]) {
                                arr.push(key);
                            }
                        }
                        ws.cell(rowNum, columnNumToStart).string(arr.sort().join());
                    } else if (individualAnswers[i].answer.openQuestion) {
                        ws.cell(rowNum, columnNumToStart).string(individualAnswers[i].answer.openQuestion);
                    }
                    if (individualHints[i] && individualHints[i].selectedHints) {
                        ws.cell(rowNum, columnNumToStart + 1).string(individualHints[i].selectedHints.sort().join());
                    }
                }
                firstRun = false;
                ws.cell(rowNum, 1).string(questionSetId);
                ws.cell(rowNum, 2).string(accountId);
                ws.cell(rowNum, 3).date(answerMap[questionSetId][accountId][currentGiveUpNumber].lastUpdatedDate).style({numberFormat: 'yyyy-mm-dd hh:mm:ss'});
                if (currentGiveUpNumber === 'current') {
                    ws.cell(rowNum, 4).string('No');
                } else {
                    ws.cell(rowNum, 4).string('Yes');
                }
                rowNum++;
            }
        }
    }

    wb.write('ExcelFile.xlsx', res);
}


module.exports = router;
