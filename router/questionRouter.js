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

glob('data/questions/**/*.@(json|tex)', function(err1, files) {
    if (err1) {
        console.log('Someting wrong with glob, cannot read files from folder.');
        console.log(err1);
    }
    let questionMap = {};
    let allPromises = [];
    let latexMap = {};
    files.forEach(function(file) {
        allPromises.push(fsPromises.readFile(file, 'utf8').then(function(data) {
            if (data) {
                if (file.endsWith('json')) {
                    let obj = JSON.parse(data);
                    questionMap[file.substring(file.lastIndexOf('/') + 1)] = obj;
                } else {
                    latexMap[file.substring(file.lastIndexOf('/') + 1)] = data
                }
            } else {
                console.log('cannot read individual file: ' + file);
            }
            return data;
        }));
    });
    Promise.all(allPromises).then(function(values) {
        setUpMapping(questionMap, latexMap);
    });
});

var setUpMapping = function(questionMap, latexMap) {
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
                    questions.push(_.cloneDeep(questionMap[fileName]));
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
                    individualQ.questions[index].solutionImgPath = individualQ.questions[index].checkAnswerSettings.solutionImgPath;
                    if (individualQ.questions[index].type === 'multipleOpenQuestion') {
                        individualQ.questions[index].maxAttempts = {};
                        individualQ.questions[index].checkAnswers = {};
                        for (let letter in individualQ.questions[index].checkAnswerSettings) {
                            if (letter !== 'solutionImgPath') {
                                individualQ.questions[index].maxAttempts[letter] = individualQ.questions[index].checkAnswerSettings[letter].maxAttempts;
                                individualQ.questions[index].checkAnswers[letter] = function(answer) {
                                    return checkAnswerSettingUtils[individualQ.questions[index].checkAnswerSettings[letter].methodName](answer, individualQ.questions[index].checkAnswerSettings[letter].methodParams);
                                };
                            }
                        }
                    } else {
                        individualQ.questions[index].maxAttempts = individualQ.questions[index].checkAnswerSettings.maxAttempts;
                        individualQ.questions[index].checkAnswers = function (answer) {
                            return checkAnswerSettingUtils[individualQ.questions[index].checkAnswerSettings.methodName](answer, individualQ.questions[index].checkAnswerSettings.methodParams);
                        };
                    }
                } else {
                    individualQ.questions[index].hasCheckAnswerSettings = false;
                }
                if (individualQ.questions[index].latex && latexMap[individualQ.questions[index].latex]) {
                    individualQ.questions[index].latex = latexMap[individualQ.questions[index].latex];
                } else {
                    delete individualQ.questions[index].latex;
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
                    questions.push(_.cloneDeep(questionMap[fileName]));
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
                    collaborativeQ.questions[index].versionA.solutionImgPath = collaborativeQ.questions[index].versionA.checkAnswerSettings.solutionImgPath;
                    if (collaborativeQ.questions[index].type === 'multipleOpenQuestion') {
                        collaborativeQ.questions[index].versionA.hasTwoSideChecks = {};
                        collaborativeQ.questions[index].versionA.maxAttempts = {};
                        collaborativeQ.questions[index].versionA.checkAnswers = {};
                        for (let letter in collaborativeQ.questions[index].versionA.checkAnswerSettings) {
                            if (letter !== 'solutionImgPath') {
                                collaborativeQ.questions[index].versionA.hasTwoSideChecks[letter] = collaborativeQ.questions[index].versionA.checkAnswerSettings[letter].hasTwoSideChecks;
                                collaborativeQ.questions[index].versionA.maxAttempts[letter] = collaborativeQ.questions[index].versionA.checkAnswerSettings[letter].maxAttempts;
                                collaborativeQ.questions[index].versionA.checkAnswers[letter] = function(answer, otherAnswer) {
                                    return checkAnswerSettingUtils[collaborativeQ.questions[index].versionA.checkAnswerSettings[letter].methodName](answer, collaborativeQ.questions[index].versionA.checkAnswerSettings[letter].methodParams, otherAnswer);
                                };
                            }
                        }
                    } else {
                        collaborativeQ.questions[index].versionA.hasTwoSideChecks = collaborativeQ.questions[index].versionA.checkAnswerSettings.hasTwoSideChecks;
                        collaborativeQ.questions[index].versionA.maxAttempts = collaborativeQ.questions[index].versionA.checkAnswerSettings.maxAttempts;
                        collaborativeQ.questions[index].versionA.checkAnswers = function (answer, otherAnswer) {
                            return checkAnswerSettingUtils[collaborativeQ.questions[index].versionA.checkAnswerSettings.methodName](answer, collaborativeQ.questions[index].versionA.checkAnswerSettings.methodParams, otherAnswer);
                        };
                    }
                } else {
                    collaborativeQ.questions[index].versionA.hasCheckAnswerSettings = false;
                }
                if (collaborativeQ.questions[index].versionB.checkAnswerSettings) {
                    collaborativeQ.questions[index].versionB.hasCheckAnswerSettings = true;
                    collaborativeQ.questions[index].versionB.solutionImgPath = collaborativeQ.questions[index].versionB.checkAnswerSettings.solutionImgPath;
                    if (collaborativeQ.questions[index].type === 'multipleOpenQuestion') {
                        collaborativeQ.questions[index].versionB.hasTwoSideChecks = {};
                        collaborativeQ.questions[index].versionB.maxAttempts = {};
                        collaborativeQ.questions[index].versionB.checkAnswers = {};
                        for (let letter in collaborativeQ.questions[index].versionB.checkAnswerSettings) {
                            if (letter !== 'solutionImgPath') {
                                collaborativeQ.questions[index].versionB.hasTwoSideChecks[letter] = collaborativeQ.questions[index].versionB.checkAnswerSettings[letter].hasTwoSideChecks;
                                collaborativeQ.questions[index].versionB.maxAttempts[letter] = collaborativeQ.questions[index].versionB.checkAnswerSettings[letter].maxAttempts;
                                collaborativeQ.questions[index].versionB.checkAnswers[letter] = function(answer, otherAnswer) {
                                    return checkAnswerSettingUtils[collaborativeQ.questions[index].versionB.checkAnswerSettings[letter].methodName](answer, collaborativeQ.questions[index].versionB.checkAnswerSettings[letter].methodParams, otherAnswer);
                                };
                            }
                        }
                    } else {
                        collaborativeQ.questions[index].versionB.hasTwoSideChecks = collaborativeQ.questions[index].versionB.checkAnswerSettings.hasTwoSideChecks;
                        collaborativeQ.questions[index].versionB.maxAttempts = collaborativeQ.questions[index].versionB.checkAnswerSettings.maxAttempts;
                        collaborativeQ.questions[index].versionB.checkAnswers = function (answer, otherAnswer) {
                            return checkAnswerSettingUtils[collaborativeQ.questions[index].versionB.checkAnswerSettings.methodName](answer, collaborativeQ.questions[index].versionB.checkAnswerSettings.methodParams, otherAnswer);
                        };
                    }
                } else {
                    collaborativeQ.questions[index].versionB.hasCheckAnswerSettings = false;
                }
                if (collaborativeQ.questions[index].versionA.latex && latexMap[collaborativeQ.questions[index].versionA.latex]) {
                    collaborativeQ.questions[index].versionA.latex = latexMap[collaborativeQ.questions[index].versionA.latex];
                } else {
                    delete collaborativeQ.questions[index].versionA.latex;
                }
                if (collaborativeQ.questions[index].versionB.latex && latexMap[collaborativeQ.questions[index].versionB.latex]) {
                    collaborativeQ.questions[index].versionB.latex = latexMap[collaborativeQ.questions[index].versionB.latex];
                } else {
                    delete collaborativeQ.questions[index].versionB.latex;
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

router.getQuestionType = function(questionSetId, questionId) {
    return questionSetMap[questionSetId].questions[questionId - 1].type;
};

router.checkAnswers = function(answerObject, questionSetId, questionId, isA, letter, otherAnswerObject) {
    let answer, otherAnswer;
    if (questionSetMap[questionSetId].questions[questionId - 1].type == 'singleChoice') {
        answer = answerObject.singleChoice;
        if (otherAnswerObject) {
            otherAnswer = otherAnswerObject.singleChoice;
        }
    } else if (questionSetMap[questionSetId].questions[questionId - 1].type == 'multipleChoice') {
        answer = [];
        for (const property in answerObject.multipleChoice) {
            if (answerObject.multipleChoice[property]) {
                answer.push(property);
            }
        }
        answer.sort();
        if (otherAnswerObject) {
            otherAnswer = [];
            for (const property in otherAnswerObject.multipleChoice) {
                if (otherAnswerObject.multipleChoice[property]) {
                    otherAnswer.push(property);
                }
            }
            otherAnswer.sort();
        }
    } else if (questionSetMap[questionSetId].questions[questionId - 1].type == 'openQuestion') {
        answer = answerObject.openQuestion;
        if (otherAnswerObject) {
            otherAnswer = otherAnswerObject.openQuestion;
        }
    } else if (questionSetMap[questionSetId].questions[questionId - 1].type == 'multipleOpenQuestion') {
        answer = answerObject.multipleOpenQuestion[letter];
        if (otherAnswerObject) {
            otherAnswer = otherAnswerObject.multipleOpenQuestion[letter];
        }
        if (!questionSetMap[questionSetId].isCollaborative) {
            return questionSetMap[questionSetId].questions[questionId - 1].checkAnswers[letter](answer);
        } else if (isA) {
            return questionSetMap[questionSetId].questions[questionId - 1].versionA.checkAnswers[letter](answer, otherAnswer);
        } else {
            return questionSetMap[questionSetId].questions[questionId - 1].versionB.checkAnswers[letter](otherAnswer, answer);
        }
    }
    if (!questionSetMap[questionSetId].isCollaborative) {
        return questionSetMap[questionSetId].questions[questionId - 1].checkAnswers(answer);
    } else if (isA) {
        return questionSetMap[questionSetId].questions[questionId - 1].versionA.checkAnswers(answer, otherAnswer);
    } else {
        return questionSetMap[questionSetId].questions[questionId - 1].versionB.checkAnswers(otherAnswer, answer);
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
