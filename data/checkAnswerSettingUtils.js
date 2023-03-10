'use strict';
const { evaluate } = require('mathjs');
var utils = {};
// all method should return { feedback: string, isCorrected: boolean }, you dont need to pass feedback if you dont want to for corrected answer, defaul will be just showned 'Corrected'

utils.guiding3 = function(answerA, params, answerB) {
    if (answerA == 'a' && answerB == 'd' || answerA == 'b' && answerB == 'c' || answerA == 'd' && answerB == 'a' || answerA == 'c' && answerB == 'b') {
        return {
            feedback: 'Great! You were able to communicate with your partner and select choices that sample all the dishes.',
            isCorrected: true
        }
    } else {
        return {
            feedback: 'Hmm, that’s not quite right. You and your partner selected choices that do not sample all of the dishes. You may try again.',
            isCorrected: false
        }
    }
};

utils.guiding1 = function(answer, params) {
    if (answer >= params[0] && answer <= params[1]) {
        return {
            feedback: 'Great! You were able to communicate with your partner and arrive at the correct sum.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Hmm, that’s not quite right. You can’t answer the question unless you communicate with your partner and find out the number that they have been assigned. You may try again.',
            isCorrected: false
        };
    }
};

utils.guiding4 = function(answer, params) {
    if (answer >= params[0] && answer <= params[1]) {
        return {
            feedback: 'Great! You were able to negotiate a strategy with your partner and use the strategy effectively to come up with the correct answer. Hopefully you noticed that there were several different ways that you could have solved the problem.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Hmm, that’s not quite right. Either you didn’t get the information that you needed, or you made a mistake in your area calculation. You may try again.',
            isCorrected: false
        };
    }
};





utils.matchExact = function(answer, params) {
    if (answer == params) {
        return {
            feedback: 'Your answer is correct.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Your answer is wrong.',
            isCorrected: false
        }
    }
};

utils.matchInList = function(answer, params) {
    if (params.some(function(p) {
        return p == answer;
    })) {
        return {
            feedback: 'Your answer is correct.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Your answer is wrong.',
            isCorrected: false
        }
    }
};

utils.matchInRange = function(answer, params) {
    if (answer >= params[0] && answer <= params[1]) {
        return {
            feedback: 'Your answer is correct.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Your answer is wrong.',
            isCorrected: false
        };
    }
};

utils.matchBothSumLessThan = function(answerA, params, answerB) {
    if (Number(answerA) + Number(answerB) < params) {
        return {
            feedback: 'You and your partner got it right',
            isCorrected: true
        }
    } else {
        return {
            feedback: 'The combination of your answers is too big, check with each other and try another value',
            isCorrected: false
        }
    }
};

utils.matchSingleChoiceExample = function(answerA, params, answerB) {
    if (answerA == 'b' && answerB == 'b' || answerA == 'c' && answerB == 'c') {
        return {
            feedback: 'You and your partner got it right',
            isCorrected: true
        }
    } else {
        return {
            feedback: 'The combination of your answers is wrong, check with each other and try another value',
            isCorrected: false
        }
    }
};

utils.ChooseSameABC = function(answerA, params, answerB) {
    if (answerA == 'a' && answerB == 'a' || answerA == 'b' && answerB == 'b' || answerA == 'c' && answerB == 'c') {
        return {
            feedback: 'You and your partner got it right! There are more than one correct combination, you can try again!',
            isCorrected: true
        }
    } else {
        return {
            feedback: 'The combination of your answers is wrong, try to fix one selection with your partner and calculate the other.',
            isCorrected: false
        }
    }
};

utils.checkTwoVariableFormula = function(answerA, formula, answerB) {
    let a = Number(answerA), b = Number(answerB), expression = formula.replace(' ', '').split(';');
    let pattern = /[!=><]=/;
    for (let exp of expression) {
        if (!pattern.test(exp)) {
            // if no special case found, replace all = to == to make exvaluate work
            exp = exp.replace('=', '==');
        }
        if (!evaluate(exp, {a : a, b: b})) {
            return {
                feedback: 'Sorry. Those answers taken together do not satisfy the problem constraints.',
                isCorrected: false
            }
        }
    }
    return {
        feedback: 'Good work! These values satisfy the constraints.',
        isCorrected: true
    }
};

module.exports = utils;
