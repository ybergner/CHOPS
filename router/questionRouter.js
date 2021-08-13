'use strict';
var glob = require('glob');
var fsPromises = require('fs').promises;
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var questions = require('../data/questions.json');
var checkAnswerSettingUtils = require('../data/checkAnswerSettingUtils.js');

// for list page
const questionSetList = [];
const hintsMap = {};
// for question page
const questionSetMap = {};

glob('data/questions/*.json', function(err1, files) {
    if (err1) {
        console.log('Someting wrong with glob, cannot read files from folder.');
        console.log(err1);
    }
    let questionMap = {};
    let allPromises = [];
    files.forEach(function(file) {
        allPromises.push(fsPromises.readFile(file, 'utf8').then(function(data) {
            if (data) {
                var obj = JSON.parse(data);
                questionMap[file.substring(file.lastIndexOf('/') + 1)] = obj;
            } else {
                console.log('cannot read individual file: ' + file);
            }
            return data;
        }));
    });
    Promise.all(allPromises).then(function(values) {
        setUpMapping(questionMap);
    });
});

var setUpMapping = function(questionMap) {
    for (let individualQ of questions.individual) {
        if (!individualQ.isHidden) {
            questionSetList.push({
                questionSetId : individualQ.questionSetId,
                name : individualQ.name,
                numOfQuestions : individualQ.numOfQuestions || individualQ.questions.length,
                isCollaborative : false
            });
            let questions = [];
            individualQ.questions.forEach(function(fileName) {
                if (questionMap[fileName]) {
                    questions.push(questionMap[fileName]);
                } else {
                    console.log('something wrong with questions.json macthing questions in question set ' + individualQ.questionSetId);
                    process.exit(1);
                }
            });
            individualQ.questions = questions;
            individualQ.numOfQuestions = individualQ.numOfQuestions || individualQ.questions.length;
            questionSetMap[individualQ.questionSetId] = _.omit(individualQ, 'isHidden');
            questionSetMap[individualQ.questionSetId].isCollaborative = false;
            for (let index = 0; index < individualQ.questions.length; index++) {
                if (individualQ.questions[index].checkAnswerSettings) {
                    individualQ.questions[index].hasCheckAnswerSettings = true;
                    individualQ.questions[index].maxAttempts = individualQ.questions[index].checkAnswerSettings.maxAttempts;
                    individualQ.questions[index].checkAnswers = function (answer) {
                        return checkAnswerSettingUtils[individualQ.questions[index].checkAnswerSettings.methodName](answer, individualQ.questions[index].checkAnswerSettings.methodParams);
                    };
                } else {
                    individualQ.questions[index].hasCheckAnswerSettings = false;
                }
            }
        }
    }

    for (let collaborativeQ of questions.collaborative) {
        if (!collaborativeQ.isHidden) {
            questionSetList.push({
                questionSetId : collaborativeQ.questionSetId,
                name : collaborativeQ.name,
                numOfQuestions : collaborativeQ.numOfQuestions || collaborativeQ.questions.length,
                isCollaborative : true
            });
            let questions = [];
            collaborativeQ.questions.forEach(function(fileName) {
                if (questionMap[fileName]) {
                    questions.push(questionMap[fileName]);
                } else {
                    console.log('something wrong with questions.json macthing questions in question set ' + collaborativeQ.questionSetId);
                    process.exit(1);
                }
            });
            collaborativeQ.questions = questions;
            collaborativeQ.numOfQuestions = collaborativeQ.numOfQuestions || collaborativeQ.questions.length;
            questionSetMap[collaborativeQ.questionSetId] = _.omit(collaborativeQ, 'isHidden');
            questionSetMap[collaborativeQ.questionSetId].isCollaborative = true;
            hintsMap[collaborativeQ.questionSetId] = [];
            for (let index = 0; index < collaborativeQ.questions.length; index++) {
                hintsMap[collaborativeQ.questionSetId][index] = {
                    versionA : questionSetMap[collaborativeQ.questionSetId].questions[index].versionA.hintText,
                    versionB : questionSetMap[collaborativeQ.questionSetId].questions[index].versionB.hintText
                };
                if (collaborativeQ.questions[index].versionA.checkAnswerSettings) {
                    collaborativeQ.questions[index].versionA.hasCheckAnswerSettings = true;
                    collaborativeQ.questions[index].versionA.maxAttempts = collaborativeQ.questions[index].versionA.checkAnswerSettings.maxAttempts;
                    collaborativeQ.questions[index].versionA.checkAnswers = function (answer) {
                        return checkAnswerSettingUtils[collaborativeQ.questions[index].versionA.checkAnswerSettings.methodName](answer, collaborativeQ.questions[index].versionA.checkAnswerSettings.methodParams);
                    };
                } else {
                    collaborativeQ.questions[index].versionA.hasCheckAnswerSettings = false;
                }
                if (collaborativeQ.questions[index].versionB.checkAnswerSettings) {
                    collaborativeQ.questions[index].versionB.hasCheckAnswerSettings = true;
                    collaborativeQ.questions[index].versionB.maxAttempts = collaborativeQ.questions[index].versionB.checkAnswerSettings.maxAttempts;
                    collaborativeQ.questions[index].versionB.checkAnswers = function (answer) {
                        return checkAnswerSettingUtils[collaborativeQ.questions[index].versionB.checkAnswerSettings.methodName](answer, collaborativeQ.questions[index].versionB.checkAnswerSettings.methodParams);
                    };
                } else {
                    collaborativeQ.questions[index].versionB.hasCheckAnswerSettings = false;
                }
            }
        }
    }
}

router.getQuestionSet = function(questionSetId, isA) {
    if (questionSetMap[questionSetId]) {
        let questionSet = _.cloneDeep(questionSetMap[questionSetId]);
        if (!questionSet.isCollaborative) {
            for (let question of questionSet.questions) {
                delete question.checkAnswerSettings;
                delete question.checkAnswers;
            }
            return questionSet;
        } else {
            for (let question of questionSet.questions) {
                delete question.versionA.hintText;
                delete question.versionB.hintText;
                delete question.versionA.checkAnswerSettings;
                delete question.versionA.checkAnswers;
                delete question.versionB.checkAnswerSettings;
                delete question.versionB.checkAnswers;
                if (isA === true) {
                    _.assign(question, question.versionA);
                } else if (isA === false) {
                    _.assign(question, question.versionB);
                }
                delete question.versionA;
                delete question.versionB;
            }
            return questionSet;
        }
    }
    return null;
};

router.getHint = function(questionSetId, questionId, isA) {
    let hints = hintsMap[questionSetId][questionId - 1];
    return isA ? hints.versionA : hints.versionB;
};

router.getAllAvailableQuestionSetIds = function() {
    return Object.keys(questionSetMap);
};

router.checkAnswers = function(answerObject, questionSetId, questionId, isA) {
    let answer;
    if (questionSetMap[questionSetId].questions[questionId - 1].type == 'singleChoice') {
        answer = answerObject.singleChoice;
    } else if (questionSetMap[questionSetId].questions[questionId - 1].type == 'multipleChoice') {
        answer = [];
        for (const property in answerObject.multipleChoice) {
            if (answerObject.multipleChoice[property]) {
                answer.push(property);
            }
        }
        answer.sort();
    } else if (questionSetMap[questionSetId].questions[questionId - 1].type == 'openQuestion') {
        answer = answerObject.openQuestion;
    }
    if (!questionSetMap[questionSetId].isCollaborative) {
        return questionSetMap[questionSetId].questions[questionId - 1].checkAnswers(answer);
    } else if (isA) {
        return questionSetMap[questionSetId].questions[questionId - 1].versionA.checkAnswers(answer);
    } else {
        return questionSetMap[questionSetId].questions[questionId - 1].versionB.checkAnswers(answer);
    }
};

// get all questionSets
router.get('/questionSet', function(req, res) {
    res.json({success : true, data : questionSetList});
});

// get answers by student id
router.get('/questionSet/:questionSetId', function(req, res) {
    let questionSet = router.getQuestionSet(req.params.questionSetId);
    if (questionSet) {
        res.json({success : true, data : questionSet});
    } else {
        res.status(403).send('invalid question set id');
    }
});

module.exports = router;
