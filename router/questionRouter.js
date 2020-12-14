'use strict';
var glob = require('glob');
var fsPromises = require('fs').promises;
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var questions = require('../data/questions.json');

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
            }
        }
    }
}

router.getQuestionSet = function(questionSetId, isA) {
    if (questionSetMap[questionSetId]) {
        if (!questionSetMap[questionSetId].isCollaborative) {
            return questionSetMap[questionSetId];
        } else {
            let questionSet = _.cloneDeep(questionSetMap[questionSetId]);
            for (let question of questionSet.questions) {
                delete question.versionA.hintText;
                delete question.versionB.hintText;
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
}

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
