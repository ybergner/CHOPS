'use strict';
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var questions = require('../data/questions.json');

// for list page
const questionSetList = [];
const hintsMap = {};
// for question page
const questionSetMap = {};

for (let individualQ of questions.individual) {
    if (!individualQ.isHidden) {
        questionSetList.push({
            questionSetId : individualQ.questionSetId,
            name : individualQ.name,
            numOfQuestions : individualQ.numOfQuestions,
            isCollaborative : false
        });
        questionSetMap[individualQ.questionSetId] = _.omit(individualQ, 'isHidden');
        questionSetMap[individualQ.questionSetId].isCollaborative = false;
    }
}

for (let collaborativeQ of questions.collaborative) {
    if (!collaborativeQ.isHidden) {
        questionSetList.push({
            questionSetId : collaborativeQ.questionSetId,
            name : collaborativeQ.name,
            numOfQuestions : collaborativeQ.numOfQuestions,
            isCollaborative : true
        });
        questionSetMap[collaborativeQ.questionSetId] = _.omit(collaborativeQ, 'isHidden');
        questionSetMap[collaborativeQ.questionSetId].isCollaborative = true;
        hintsMap[collaborativeQ.questionSetId] = [];
        for (let index = 0; index < collaborativeQ.numOfQuestions; index++) {
            hintsMap[collaborativeQ.questionSetId][index] = {
                versionA : questionSetMap[collaborativeQ.questionSetId].questions[index].versionA.hintText,
                versionB : questionSetMap[collaborativeQ.questionSetId].questions[index].versionB.hintText
            };
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
        res.status(500).send('invalid question set id');
    }
});

module.exports = router;
