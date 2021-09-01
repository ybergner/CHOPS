'use strict';
var utils = {};
// all method should return { feedback: string, isCorrected: boolean }, you dont need to pass feedback if you dont want to for corrected answer, defaul will be just showned 'Corrected'

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

utils.matchBothSumLessThan = function(answer, params, otherAnswer) {
    if (Number(answer) + Number(otherAnswer) < params) {
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

utils.matchSingleChoiceExample = function(answer, params, otherAnswer) {
    if (answer == 'b' && otherAnswer == 'b' || answer == 'c' && otherAnswer == 'c') {
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


module.exports = utils;
