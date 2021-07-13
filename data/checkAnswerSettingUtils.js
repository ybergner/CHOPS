'use strict';
var utils = {};
// all method should return { feedback: string, isCorrected: boolean }, you dont need to pass feedback if you dont want to for corrected answer, defaul will be just showned 'Corrected'

utils.matchExact = function(answer, params) {
    if (answer == params) {
        return {
            //feedback: 'Corrected.',
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
            feedback: 'Custom Corrected answer feedback',
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
            feedback: 'You got it.',
            isCorrected: true
        };
    } else {
        return {
            feedback: 'Your answer is too big',
            isCorrected: false
        };
    }
};


module.exports = utils;
