'use strict';
var xl = require('excel4node');
var express = require('express');
var router = express.Router();
var Answer = require('../data/answerSchema.js');
var utils = require('../data/utils.js');
var studentRouter = require('./studentRouter.js');

// add/update new answer
router.post('/getReport', function(req, res) {
    studentRouter.validateTeacher(req.body.account).then(function(isValid) {
        if (!isValid) {
            res.status(404).send('No Permission');
        } else {
            Answer.find({}).lean().exec(function(err, result) {
                if (err) {
                    console.log('Cannot get answers');
                    res.status(500).send('Cannot get answers');
                } else {
                    if (!result) {
                        console.log('Cannot find answers');
                        res.status(500).send('Cannot find answers');
                    } else {
                        generateAndSendReportSheet(res, result);
                    }
                }
            });
        }
    });
});

var generateAndSendReportSheet = function(res, result) {
    // Create a new instance of a Workbook class
    var wb = new xl.Workbook();

    let answerMap = {};

    for (let ans of result) {
        if (!answerMap[ans.questionSetId]) {
            answerMap[ans.questionSetId] = {};
        }
        if (!answerMap[ans.questionSetId][ans.accountId + '']) {
            answerMap[ans.questionSetId][ans.accountId + ''] = [];
        }
        answerMap[ans.questionSetId][ans.accountId + ''][ans.questionId - 1] = ans;
    }

    var headerStyle = wb.createStyle({
        font : { bold : true }
    });

    for (let questionSetId in answerMap) {
        // Add Worksheets to the workbook
        var ws = wb.addWorksheet(questionSetId);
        ws.cell(1, 1).string('Quiz Id').style(headerStyle);
        ws.cell(1, 2).string('Submit Time').style(headerStyle);
        ws.column(2).setWidth(20);
        ws.cell(1, 3).string('Student Id').style(headerStyle);
        var firstRun = true;
        var rowNum = 2;
        for (let accountId in answerMap[questionSetId]) {
            let individualAnswers = answerMap[questionSetId][accountId];
            for (let i = 0; i < individualAnswers.length; i++) {
                let columnNumToStart = i + 4;
                if (firstRun) {
                    ws.cell(1, columnNumToStart).string('Q' + (i + 1)).style(headerStyle);
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
            }
            firstRun = false;
            ws.cell(rowNum, 1).string(questionSetId);
            ws.cell(rowNum, 2).date(individualAnswers[individualAnswers.length - 1].lastUpdatedDate).style({numberFormat: 'yyyy-mm-dd hh:mm:ss'});
            ws.cell(rowNum, 3).number(individualAnswers[0].accountId);
            rowNum++;
        }
    }

    wb.write('ExcelFile.xlsx', res);
}


module.exports = router;
