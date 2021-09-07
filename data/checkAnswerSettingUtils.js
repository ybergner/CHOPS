'use strict';
const { evaluate } = require('mathjs');
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

utils.checkTwoVariableFormula = function(answerA, formula, answerB) {
	if (formula.includes('<=')){
		let a = Number(answerA), b = Number(answerB), expression = formula.split('<=');
    	let updateFormula = `(${expression[0]}) - (${expression[1]})`;
    	if (evaluate(updateFormula, {a : a, b: b}) <= 0) {
        	return {
            	feedback: 'The answers are corrected based on formula',
            	isCorrected: true
        	}
    	} else {
        	return {
            	feedback: 'The answers are wrong based on formula',
            	isCorrected: false
        	}
		}
	}
	else if (formula.includes('>=')){
		let a = Number(answerA), b = Number(answerB), expression = formula.split('>=');
    	let updateFormula = `(${expression[0]}) - (${expression[1]})`;
    	if (evaluate(updateFormula, {a : a, b: b}) >= 0) {
        	return {
            	feedback: 'The answers are corrected based on formula',
            	isCorrected: true
        	}
    	} else {
        	return {
            	feedback: 'The answers are wrong based on formula',
            	isCorrected: false
        	}
		}
	}
	else if (formula.includes('>')){
		let a = Number(answerA), b = Number(answerB), expression = formula.split('>');
    	let updateFormula = `(${expression[0]}) - (${expression[1]})`;
    	if (evaluate(updateFormula, {a : a, b: b}) > 0) {
        	return {
            	feedback: 'The answers are corrected based on formula',
            	isCorrected: true
        	}
    	} else {
        	return {
            	feedback: 'The answers are wrong based on formula',
            	isCorrected: false
        	}
		}
	}
	else if (formula.includes('<')){
		let a = Number(answerA), b = Number(answerB), expression = formula.split('<');
    	let updateFormula = `(${expression[0]}) - (${expression[1]})`;
    	if (evaluate(updateFormula, {a : a, b: b}) < 0) {
        	return {
            	feedback: 'The answers are corrected based on formula',
            	isCorrected: true
        	}
    	} else {
        	return {
            	feedback: 'The answers are wrong based on formula',
            	isCorrected: false
        	}
		}
	}
	else if (formula.includes('=')){
		let a = Number(answerA), b = Number(answerB), expression = formula.split('=');
    	let updateFormula = `(${expression[0]}) - (${expression[1]})`;
    	if (evaluate(updateFormula, {a : a, b: b}) === 0) {
        	return {
            	feedback: 'The answers are corrected based on formula',
            	isCorrected: true
        	}
    	} else {
        	return {
            	feedback: 'The answers are wrong based on formula',
            	isCorrected: false
        	}
		}
	}
};

module.exports = utils;
