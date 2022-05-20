'use strict';
var app = angular.module('myApp', ['ngRoute']);
app.config(function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '../template/list.html',
            controller: 'listController'
        }).
        when('/login', {
            templateUrl: '../template/login.html',
            controller: 'loginController'
        }).
        when('/questions/:questionSetId', {
            templateUrl: '../template/questionSet.html',
            controller: 'questionSetController',
            resolve: {
                questionSet: function($route, questionService) {
                    return questionService.getQuestionSetList($route.current.params.questionSetId).then(function(res) {
                        return res.data.data;
                    });
                },
                answersObject: function($route, answerService) {
                    return answerService.getAnswersByAccount(null, $route.current.params.questionSetId).then(function(res) {
                        return res.data && res.data.data && res.data.data[0] || {};
                    });
                },
                hintsObject: function($route, hintService) {
                    return hintService.getHintsByAccount(null, $route.current.params.questionSetId).then(function(res) {
                        let retObject = {
                            allSelectedHints : (res.data && res.data.data && res.data.data[0]) || { hints : [] },
                            hintText : (res.data && res.data.hintText) || []
                        }
                        return retObject;
                    });
                },
            }
        }).
        when('/action', {
            templateUrl: '../template/action/list.html',
            controller: 'actionItemsController'
        }).
        when('/action/items', {
            templateUrl: '../template/action/list.html',
            controller: 'actionItemsController'
        }).
        otherwise({
            redirectTo: '/'
        });
});

app.config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|sms|tel):/);
}]);

app.factory('questionService', ['$http', function($http) {
    return {
        getQuestionSetList : function(questionSetId) {
            if (questionSetId) {
                return $http.get('api/questionSet/' + questionSetId);
            } else {
                return $http.get('api/questionSet');
            }
        },
    };
}]);

app.factory('enums', function() {
    return {
        accountType : {
          teacher : 1,
          student : 2
        },
        answerType : {
          multipleChoice : 1,
          singleChoice : 2,
          openQuestion : 3
        }
    };
});

app.factory('answerService', ['$http', '$q', 'accountService', function($http, $q, accountService) {
    return {
        getAnswersByAccount : function(account, questionSetId) {
            if (!account) {
                account = accountService.getCurrentAccount();
            }
            if (account) {
                if (questionSetId) {
                    return $http.get('api/answer/' + account.accountId + '/' + questionSetId);
                } else {
                    return $http.get('api/answer/' + account.accountId);
                }
            } else {
                return $q.reject('No Account Information');
            }
        },
        crud : function(operation, data) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/answer', {account: account, operation: operation, data: data});
            } else {
                return $q.reject('No Account Information');
            }
        },
        giveUpAnswer : function(data) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/giveUpAnswer', {account: account, data: data});
            } else {
                return $q.reject('No Account Information');
            }
        },
        createActionItem : function(questionSetId, actionItem) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/action', {account: account, data: actionItem, questionSetId: questionSetId});
            } else {
                return $q.reject('No Account Information');
            }
        },
        getActionList: function() {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/action/list', {account: account});
            } else {
                return $q.reject('No Account Information');
            }
        },
        getActionItems: function(objectIds) {
            var account = accountService.getCurrentAccount();
            if (account && objectIds) {
                return $http.post('api/action/details', {account: account, data: objectIds});
            } else {
                return $q.reject('No Account or Ids Information');
            }
        },
        downloadReport : function() {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/getReport', {account: account}, {responseType: "arraybuffer"});
            } else {
                return $q.reject('No Account Information');
            }
        },
        checkAnswer : function(questionSetId, questionId, isA, data, otherAttempts) {
            return $http.post('api/checkAnswer', {questionSetId: questionSetId, questionId: questionId, isA: isA, data: data, otherAttempts: otherAttempts});
        },
        validateFormula: function(formula, a, b) {
            return $http.post('api/validateFormula', {formula: formula, a: a, b: b});
        }
    };
}]);

app.factory('sessionService', ['$http', '$q', 'accountService', function($http, $q, accountService) {
    return {
        getSessionsByAccount : function(account) {
            if (!account) {
                account = accountService.getCurrentAccount();
            }
            if (account) {
                return $http.get('api/session/' + account.accountId);
            } else {
                return $q.reject('No Account Information');
            }
        }
    };
}]);

app.factory('hintService', ['$http', '$q', 'accountService', function($http, $q, accountService) {
    return {
        getHintsByAccount : function(account, questionSetId) {
            if (!account) {
                account = accountService.getCurrentAccount();
            }
            if (account) {
                if (questionSetId) {
                    return $http.get('api/hint/' + account.accountId + '/' + questionSetId);
                } else {
                    return $http.get('api/hint/' + account.accountId);
                }
            } else {
                return $q.reject('No Account Information');
            }
        },
        crud : function(operation, data, questionSetId, isA, hintId, isReselect) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/hint', {account: account, operation: operation, data: data, questionSetId: questionSetId, isA : isA, hintId: hintId, isReselect: isReselect});
            } else {
                return $q.reject('No Account Information');
            }
        },
        giveUpHint : function(questionSetId, hintId) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/giveUpHint', {account: account, questionSetId: questionSetId, hintId: hintId});
            } else {
                return $q.reject('No Account Information');
            }
        }
    };
}]);

app.factory('accountService', ['$http', '$q', 'enums', function($http, $q, enums) {
    return {
        getCurrentAccount : function() {
            let accountInfo = localStorage.getItem('accountInfo');
            if (accountInfo) {
                accountInfo = JSON.parse(accountInfo);
                let now = new Date();
                let lastUpdatedDate = new Date(accountInfo.lastUpdatedDate);
                let timeoutPeriod = 1000 * 3600 * 5; // 5 hours
                if ((now.getTime() - lastUpdatedDate.getTime()) < timeoutPeriod) {
                    return accountInfo.account;
                } else {
                    // session time out
                    localStorage.removeItem('accountInfo');
                }
            }
            return null;
        },
        loginAccount : function(data) {
            return $http.post('api/validatePassword', {
                accountId : data.accountId,
                password : data.password
            }).then(function(res) {
                let account = res.data.data;
                localStorage.setItem('accountInfo', JSON.stringify({account: account, lastUpdatedDate: new Date()}));
                return account;
            });
        },
        logoutAccount : function() {
            localStorage.removeItem('accountInfo');
        },
        getStudents : function() {
            let account = this.getCurrentAccount();
            if (account && account.accountType == enums.accountType.teacher) {
                return $http.post('api/students', {account: account});
            } else {
                return $q.reject('No Permissions');
            }
        },
        crud : function(operation, data) {
            let account = this.getCurrentAccount();
            if (account && account.accountType == enums.accountType.teacher) {
                return $http.post('api/student', {account: account, operation: operation, data: data});
            } else {
                return $q.reject('No Permissions');
            }
        },
        createStudent: function(data) {
            return $http.post('api/createStudent', {
                accountId : data.accountId,
                password : data.password
            }).then(function(res) {
                let account = res.data.data;
                localStorage.setItem('accountInfo', JSON.stringify({account: account, lastUpdatedDate: new Date()}));
                return account;
            });
        }
    };
}]);

app.factory('socketService', function() {
    return {
        socketSetup : function(scope) {
            let socket = io({ reconnection: false });
            socket.emit('account', {account : scope.account, questionSetId : scope.currentQuestionSet.questionSetId});
            socket.on('account already has socket', function(){
                console.log('account already connected with socket.');
                $('.toast').toast('hide');
                scope.chatBox.toastMessage = 'This account had been connected in another session.';
                scope.$apply();
                $('.toast').toast('show');
            });
            socket.on('account received', function(data){
                console.log('account set up completed in socket.');
                scope.socket = socket;
                if (data.session) {
                    scope.otherAttemptAnswers = data.otherAttemptAnswers;
                    scope.session = data.session;
                    scope.isA = scope.session.accountAId == scope.account.accountId;
                    angular.extend(scope.currentQuestionSet, data.questionSet);
                    scope.checkAnswer(scope.currentQuestion, true);
                    scope.$apply();
                } else {
                    scope.checkIfPreviousGiveUp();
                }
            });
            socket.on('account in queue', function() {
                console.log('account waiting in queue');
                scope.waiting = true;

                scope.$apply();
            });
            socket.on('account matched', function(data) {
                console.log('account matched');
                if (!scope.session) {
                    scope.session = data.session;
                    scope.isA = scope.session.accountAId == scope.account.accountId;
                    angular.extend(scope.currentQuestionSet, data.questionSet);
                    scope.checkAnswer(scope.currentQuestion, true);
                }
                scope.isConnect = true;
                scope.showMessage = true;
                scope.waiting = false;
                $('.toast').toast('hide');
                let collaboratorName = scope.isA ? scope.session.accountBName : scope.session.accountAName;
                scope.chatBox.toastMessage = 'Connected with another collaborator ' + collaboratorName + '.';
                scope.$apply();
                $('.toast').toast('show');
                scope.chatEl = document.getElementById("message-box");
            });
            socket.on('leave', function(id) {
                console.log('account id ' + id + ' left');
                $('#attemptModal').modal('hide');
                $('#warningOtherCheckModal').modal('hide');
                scope.waiting = true;
                scope.isConnect = false;
                scope.showMessage = false;
                $('.toast').toast('hide');
                scope.chatBox.toastMessage = 'Collaborator disconnected.';
                scope.$apply();
                $('.toast').toast('show');
            });
            socket.on('new message', function(message){
                scope.session.messages.push(message);
                if (!scope.showMessage && message.accountId != scope.account.accountId) {
                    scope.chatBox.unreadMessage++;
                }
                scope.$apply();
                scope.chatEl.scrollTop = scope.chatEl.scrollHeight;
            });
            socket.on('unmatched check answer', function(question){
                console.log('unmatched check answer');
                setTimeout(function() {
                    $('#attemptModal').modal('hide');
                    $('#warningOtherCheckModal').modal('show');
                }, 500);
                scope.errorOtherCurrentlyCheckQuestion = question;
                scope.$apply();
            });
            socket.on('check answer', function(data){
                console.log('getting check answer');
                scope.errorOtherCurrentlyCheckQuestion = '';
                let questionArr = data.question.split('-');
                let letter = questionArr[1];
                if (!scope.otherAttemptAnswers[scope.currentQuestion - 1]) {
                    scope.otherAttemptAnswers[scope.currentQuestion - 1] = [];
                }
                if (letter) {
                    let hasAnsObjCreated = false;
                    for (let ans of scope.otherAttemptAnswers[scope.currentQuestion - 1]) {
                        if (ans.multipleOpenQuestion && ans.multipleOpenQuestion[letter] == null) {
                            ans.multipleOpenQuestion[letter] = data.answer.multipleOpenQuestion[letter];
                            hasAnsObjCreated = true;
                            break;
                        }
                    }
                    if (!hasAnsObjCreated) {
                        let newAns = {multipleOpenQuestion : {}};
                        newAns.multipleOpenQuestion[letter] = data.answer.multipleOpenQuestion[letter];
                        scope.otherAttemptAnswers[scope.currentQuestion - 1].push(newAns);
                    }
                } else {
                    scope.otherAttemptAnswers[scope.currentQuestion - 1].push(data.answer);
                }
                setTimeout(function() {
                    $('#attemptModal').modal('hide');
                }, 500);
                scope.checkAttempt(letter, true);
            });
            socket.on('give up leaving', function(id){
                console.log('account id ' + id + ' give up leaving');
                $('#attemptModal').modal('hide');
                $('#warningOtherCheckModal').modal('hide');
                $('.toast').toast('hide');
                scope.chatBox.toastMessage = 'Collaborator give up this session, you will be redirect to home page after 3 seconds.';
                scope.$apply();
                scope.giveUp(true);
                $('.toast').toast('show');
                setTimeout(function() {
                    scope.home(true);
                }, 3000);
            });
            socket.on('give up completed', function(message){
                console.log('account self set up completed');
                let counter = 0;
                let interval = setInterval(function() {
                    if (!scope.waitForApiCall || counter > 3) {
                        clearInterval(interval);
                        scope.home(true);
                    } else {
                        counter++;
                    }
                }, 1000);
            });
        }
    };
});

app.controller('loginController', ['$scope', 'accountService', '$location', function($scope, accountService, $location) {
    $scope.account = accountService.getCurrentAccount();
    if ($scope.account) {
        // redirect
        $location.path('/');
    }
    $scope.createStudent = function() {
        if ($scope.accountId && $scope.password) {
            $scope.error = null;
            accountService.createStudent({
                accountId : $scope.accountId,
                password : $scope.password
            }).then(function(account) {
                $scope.account = account;
                // redirect
                $location.path('/');
            }, function(error) {
                $scope.error = error.data;
            });
        }
    }
    $scope.submit = function() {
        if ($scope.accountId && $scope.password) {
            $scope.error = null;
            accountService.loginAccount({
                accountId : $scope.accountId,
                password : $scope.password
            }).then(function(account) {
                $scope.account = account;
                // redirect
                $location.path('/');
            }, function(error) {
                $scope.error = error.data;
                $scope.password = null;
            });
        }
    }
}]);

app.controller('listController', ['$scope', 'accountService', '$location', 'enums', 'questionService', 'answerService', 'sessionService', function($scope, accountService, $location, enums, questionService, answerService, sessionService) {
    $scope.account = accountService.getCurrentAccount();
    $scope.accountTypeEnum = enums.accountType;
    if (!$scope.account) {
        // redirect
        $location.path('/login');
    }
    $scope.logout = function() {
        accountService.logoutAccount();
        $location.path('/login');
    };
    $scope.isTeacher = $scope.account && $scope.account.accountType === enums.accountType.teacher;
    if ($scope.isTeacher) {
        var refreshStudentList = function() {
            accountService.getStudents().then(function(res){
                $scope.allStudents = res.data.data;
            });
        };
        $scope.createFormInfo = {};
        $scope.createAccount = function() {
            if ($scope.createFormInfo.accountId && $scope.createFormInfo.accountName && $scope.createFormInfo.accountType && $scope.createFormInfo.email && $scope.createFormInfo.password) {
                accountService.crud('create', $scope.createFormInfo).then().finally(function() {
                    $scope.createFormInfo = { accountType : enums.accountType.student };
                    $('#createAccount').collapse('hide');
                    refreshStudentList();
                });
            }
        };
        $scope.validateFormulaInfo = {};
        $scope.validateFormulaHistory = [];
        $scope.validateFormula = function() {
            answerService.validateFormula($scope.validateFormulaInfo.formula, $scope.validateFormulaInfo.a, $scope.validateFormulaInfo.b).then(function(res) {
                $scope.validateFormulaHistory.push({formula: $scope.validateFormulaInfo.formula, a: $scope.validateFormulaInfo.a, b: $scope.validateFormulaInfo.b, isCorrected: res.data.data});
            }, function(err) {
                $scope.validateFormulaHistory.push({formula: $scope.validateFormulaInfo.formula, a: $scope.validateFormulaInfo.a, b: $scope.validateFormulaInfo.b, isError: true});
            });
        }
        $scope.isValiateFormulaValid = function() {
            if ($scope.validateFormulaInfo.formula && $scope.validateFormulaInfo.a && $scope.validateFormulaInfo.b) {
                if (!Number.isFinite(Number($scope.validateFormulaInfo.a)) || !Number.isFinite(Number($scope.validateFormulaInfo.b))) {
                    return false;
                }
                if (!$scope.validateFormulaInfo.formula.includes('=') && !$scope.validateFormulaInfo.formula.includes('a') && !$scope.validateFormulaInfo.formula.includes('b')) {
                    return false;
                }
                return true;
            }
            return false;
        }
        $scope.allStudents = [];
        refreshStudentList();
        $scope.editAccount = function(student) {
            $scope.editStudent = angular.copy(student);
        };
        $scope.updateAccount = function() {
            if ($scope.editStudent.accountId && $scope.editStudent.accountName && $scope.editStudent.accountType && $scope.editStudent.email && $scope.editStudent.password) {
                accountService.crud('update', $scope.editStudent).then().finally(function() {
                    $('#editAccount').modal('hide');
                    refreshStudentList();
                });
            }
        };
        $scope.deleteAccount = function() {
            if ($scope.editStudent.accountId && $scope.editStudent.accountType) {
                accountService.crud('delete', $scope.editStudent).then().finally(function() {
                    $('#editAccount').modal('hide');
                    refreshStudentList();
                });
            }
        };
        $scope.downloadReport = function() {
            answerService.downloadReport().then(function(res) {
                var blob = new Blob([res.data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = "Report_" +  (new Date()).getTime() + ".xlsx";
                link.click();
                URL.revokeObjectURL(link.href);
            });
        };

        $scope.checkActions = function() {
            $location.path('/action');
        };
    }
    $scope.questionSetList = [];
    $scope.answerQuestionMap = {};
    questionService.getQuestionSetList().then(function(res){
        $scope.questionSetList = res.data.data;
        if (!$scope.isTeacher) {
            answerService.getAnswersByAccount().then(function(res){
                var answers = res.data.data;
                for (let ans of answers) {
                    for (let questionSet of $scope.questionSetList) {
                        if (ans.questionSetId == questionSet.questionSetId) {
                            if (!ans.isSubmitted) {
                                $scope.doQuestionSet(questionSet);
                            }
                            $scope.answerQuestionMap[ans.questionSetId] = ans.answers;
                            break;
                        }
                    }
                }
                sessionService.getSessionsByAccount().then(function(sessionRes){
                    var sessions = sessionRes.data.data;
                    for (let session of sessions) {
                        if (!$scope.answerQuestionMap[session.questionSetId]) {
                            $scope.doQuestionSet(session);
                        }
                    }
                }, function(sessionErr) {console.log(sessionErr)});
            });
        }
    }, function(err) {console.log(err)});

    $scope.doQuestionSet = function(questionSet) {
        $location.path('/questions/' + questionSet.questionSetId);
    };
}]);

app.controller('actionItemsController', ['$scope', '$routeParams', 'accountService', '$location', 'enums', 'answerService', function($scope, $routeParams, accountService, $location, enums, answerService) {
    $scope.account = accountService.getCurrentAccount();
    $scope.isList = !$location.path().includes('items');
    let objectIds = $routeParams.objectIds ? $routeParams.objectIds.split(',') : [];
    if (!$scope.account) {
        // redirect
        $location.path('/login').search('objectIds', null);
    } else if ($scope.account.accountType !== enums.accountType.teacher) {
        $location.path('/').search('objectIds', null);
    } else if (!$scope.isList && !objectIds.length) {
        $location.path('/action').search('objectIds', null);
    }
    $scope.logout = function() {
        accountService.logoutAccount();
        $location.path('/login').search('objectIds', null);
    };
    $scope.home = function() {
        $location.path('/').search('objectIds', null);
    };
    $scope.backToList = function() {
        $location.path('/action').search('objectIds', null);
    }
    $scope.items = [];
    $scope.selectedItems = [];
    $scope.toggle = function(item) {
        let index = $scope.selectedItems.indexOf(item.id);
        if (index !== -1) {
            $scope.selectedItems.splice(index, 1);
        } else {
            $scope.selectedItems.push(item.id);
        }
    };
    $scope.goToItemPage = function() {
        $location.path('/action/items').search('objectIds', $scope.selectedItems.join(','));
    }
    $scope.sortBy = $scope.isList ? 'questionSetId' : 'createdDate';
    $scope.reverse = false;
    $scope.toggleSorting = function(field) {
        if ($scope.sortBy === field) {
            $scope.reverse = !$scope.reverse;
        } else {
            $scope.sortBy = field;
            $scope.reverse = false;
        }
    };
    function constructAnswerMessage(answer) {
        if (answer.openQuestion) {
            return "Open Question: " + answer.openQuestion
        } else if (answer.singleChoice) {
            return "Single Choice: " + answer.singleChoice;
        } else if (answer.multipleChoice) {
            return "Multiple Choice: " + Object.keys(answer.multipleChoice).join(', ');
        } else if (answer.multipleOpenQuestion) {
            let output = '';
            for (let key in answer.multipleOpenQuestion) {
                output += key + ': ' + answer.multipleOpenQuestion[key] + ', ';
            }
            return "Multiple Open Question: " + output.slice(0, -2);
        } else {
            return answer;
        }
    }
    $scope.displayDetails = function(action) {
        let message = action.answer;
        switch (action.action) {
            case 'send message':
                message = "Message: " + action.answer.message;
                break;
            case 'check answer':
            case 'next':
            case 'prev':
            case 'submit':
                message = constructAnswerMessage(action.answer);
                break;
            case 'selected hints':
                message = "Hints: " + action.answer.join(', ');
                break;
            default:
                break;
        }
        return message;
    };

    if ($scope.isList) {
        answerService.getActionList().then(function(res) {
            $scope.items = res.data.data;
        });
    } else {
        answerService.getActionItems(objectIds).then(function(res) {
            $scope.items = res.data.data;
        });
    }

}]);

app.controller('questionSetController', ['$scope', 'questionSet', 'answersObject', 'hintsObject', 'accountService', 'answerService', 'hintService', '$location', '$q', 'enums', 'socketService', function($scope, questionSet, answersObject, hintsObject, accountService, answerService, hintService, $location, $q, enums, socketService) {
    $scope.account = $scope.account || accountService.getCurrentAccount();
    $scope.currentQuestionSet = questionSet;
    $scope.answersObject = answersObject;
    $scope.answers = $scope.answersObject.answers || [];
    $scope.attemptedAnswerFeedback = [];
    $scope.otherAttemptAnswers = [];
    $scope.hintsObject = hintsObject;
    if (!$scope.currentQuestionSet) {
        $location.path('/');
    }
    $scope.logout = function() {
        accountService.logoutAccount();
        if ($scope.socket) {
            $scope.socket.disconnect();
        }
        $location.path('/login');
    };

    $scope.$on('$destroy', function() {
        window.onbeforeunload = undefined;
    });

    $scope.$on('$locationChangeStart', function(event, next, current) {
        createActionItem('leave', $scope.currentQuestion);
    });

    window.onbeforeunload = function (event) {
        createActionItem('leave', $scope.currentQuestion);
    };

    $scope.currentQuestion = 1;
    $scope.isTeacher = $scope.account && $scope.account.accountType === enums.accountType.teacher;
    $scope.previousAnswers = angular.copy($scope.answers);
    $scope.currentHints = {};
    $scope.originalCurrentHints = {};
    $scope.solutionImgPath = [];
    let latexComponentContainer;
    var checkAnswer = $scope.checkAnswer =  function(questionId, fromSession) {
        if (!$scope.answers[questionId - 1]) {
            $scope.answers[questionId - 1] = {
                questionId : questionId,
                answer : {}
            }
            $scope.previousAnswers[questionId - 1] = {
                questionId : questionId,
                answer : {}
            }
            if ($scope.currentQuestionSet.questions[questionId - 1].type === 'multipleChoice') {
                $scope.answers[questionId - 1].answer.multipleChoice = {};
                $scope.previousAnswers[questionId - 1].answer.multipleChoice = {};
            } else if ($scope.currentQuestionSet.questions[questionId - 1].type === 'multipleOpenQuestion') {
                $scope.answers[questionId - 1].answer.multipleOpenQuestion = {};
                $scope.previousAnswers[questionId - 1].answer.multipleOpenQuestion = {};
            }
        } else if (!$scope.answers[questionId - 1].answer) {
            $scope.answers[questionId - 1].answer = {};
            $scope.previousAnswers[questionId - 1].answer = {};
            if ($scope.currentQuestionSet.questions[questionId - 1].type === 'multipleChoice') {
                $scope.answers[questionId - 1].answer.multipleChoice = {};
                $scope.previousAnswers[questionId - 1].answer.multipleChoice = {};
            } else if ($scope.currentQuestionSet.questions[questionId - 1].type === 'multipleOpenQuestion') {
                $scope.answers[questionId - 1].answer.multipleOpenQuestion = {};
                $scope.previousAnswers[questionId - 1].answer.multipleOpenQuestion = {};
            }

        }
        if ($scope.answers[questionId - 1].collaborationAnswer && !isNaN($scope.answers[questionId - 1].collaborationAnswer)) {
            $scope.answers[questionId - 1].collaborationAnswer = Number($scope.answers[questionId - 1].collaborationAnswer);
        }
        getAttemptAnswerFeeback();
        if ($scope.currentQuestionSet.questions[questionId - 1].latex) {
            if (fromSession) {
                setTimeout(() => updateLatex(questionId));
            } else {
                updateLatex(questionId);
            }
        }
        if ($scope.session) {
            $scope.currentHints = {questionId : questionId, selectedHints : []};
            $scope.originalCurrentHints = {questionId : questionId, selectedHints : []};
            for (let selectedHints of $scope.hintsObject.allSelectedHints.hints) {
                if (selectedHints.questionId == questionId) {
                    $scope.originalCurrentHints = selectedHints;
                    $scope.currentHints = angular.copy(selectedHints);
                    break;
                }
            }
            $scope.currentHintsText = {};
            for (let hintText of $scope.hintsObject.hintText) {
                if (hintText.questionId === questionId) {
                    $scope.currentHintsText = hintText.hintText;
                    break;
                }
            }
            if ($scope.isReselect) {
                $scope.isReselect = false;
            }
            $scope.showReselectHints = false;
        }
    };

    function updateLatex(questionId) {
        if (!latexComponentContainer) {
            latexComponentContainer = document.getElementById('latex-view');
        }
        if (latexComponentContainer) {
            if (latexComponentContainer.firstChild) {
                latexComponentContainer.removeChild(latexComponentContainer.firstChild);
            }
            let latexComponent = document.createElement('latex-js');
            latexComponent.textContent = $scope.currentQuestionSet.questions[questionId - 1].latex;
            latexComponentContainer.appendChild(latexComponent);
        }
    }

    checkAnswer($scope.currentQuestion);

    $scope.next = function() {
        if ($scope.currentQuestion < $scope.currentQuestionSet.numOfQuestions) {
            createActionItem('next', $scope.currentQuestion, $scope.answers[$scope.currentQuestion - 1].answer);
            if ($scope.isTeacher || $scope.answersObject.isSubmitted) {
                $scope.currentQuestion++;
                checkAnswer($scope.currentQuestion);
            } else {
                checkAnswerDiffAndUpdate('next');
            }
        }
    };

    $scope.prev = function() {
        if($scope.currentQuestion > 1) {
            createActionItem('prev', $scope.currentQuestion, $scope.answers[$scope.currentQuestion - 1].answer);
            if ($scope.isTeacher || $scope.answersObject.isSubmitted) {
                $scope.currentQuestion--;
                checkAnswer($scope.currentQuestion);
            } else {
                checkAnswerDiffAndUpdate('prev');
            }
        }
    };

    $scope.checkAttempt = function(letter, skipTwoSideCheck) {
        if (skipTwoSideCheck || !$scope.currentQuestionSet.questions[$scope.currentQuestion - 1].hasTwoSideChecks ||
            (letter && !$scope.currentQuestionSet.questions[$scope.currentQuestion - 1].hasTwoSideChecks[letter])) {
            if ($scope.isTeacher) {
                if (!$scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
                    $scope.answers[$scope.currentQuestion - 1].attemptedAnswers = [];
                }
                if (letter) {
                    pushLetterIntoAttemptedAnswers(letter);
                } else {
                    $scope.answers[$scope.currentQuestion - 1].attemptedAnswers.push(angular.copy($scope.answers[$scope.currentQuestion - 1].answer));
                }
                getAttemptAnswerFeeback(letter);
            } else {
                checkAnswerDiffAndUpdate('checkAnswer', letter);
            }
            if (!letter && !$scope.currentQuestionSet.questions[$scope.currentQuestion - 1].hasTwoSideChecks && $scope.currentHints.selectedHints.length) {
                $scope.showReselectHints = true;
            }
        } else {
            let currentWaitingCheckAttempt = {
                question: letter ? $scope.currentQuestion + '-' + letter : $scope.currentQuestion + '',
                answer: $scope.answers[$scope.currentQuestion - 1].answer
            }
            $scope.socket.emit('new check attempt', currentWaitingCheckAttempt);
            $('#attemptModal').modal('show');
        }
    }

    $scope.cancelAttempts = function() {
        $scope.socket.emit('clear check attempt', {});
        $('#attemptModal').modal('hide');
    }

    function pushLetterIntoAttemptedAnswers(letter) {
        for (let ans of $scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
            if (ans.multipleOpenQuestion && ans.multipleOpenQuestion[letter] == null) {
                ans.multipleOpenQuestion[letter] = $scope.answers[$scope.currentQuestion - 1].answer.multipleOpenQuestion[letter];
                return;
            }
        }
        let newAns = {multipleOpenQuestion : {}};
        newAns.multipleOpenQuestion[letter] = $scope.answers[$scope.currentQuestion - 1].answer.multipleOpenQuestion[letter];
        $scope.answers[$scope.currentQuestion - 1].attemptedAnswers.push(newAns);
    }

    $scope.getCurrentAnswerString = function(answerObject, letter) {
        if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type == 'singleChoice') {
            return answerObject.singleChoice;
        } else if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type == 'multipleChoice') {
            let answer = [];
            for (let property in answerObject.multipleChoice) {
                if (answerObject.multipleChoice[property]) {
                    answer.push(answerObject.multipleChoice[property]);
                }
            }
            answer.sort();
            return answer.join(',');
        } else if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type == 'openQuestion') {
            return answerObject.openQuestion;
        } else if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type == 'multipleOpenQuestion') {
            return answerObject.multipleOpenQuestion[letter];
        }
    }

    function getAttemptAnswerFeeback(letter) {
        if (!$scope.answers[$scope.currentQuestion - 1].attemptedAnswers || !$scope.answers[$scope.currentQuestion - 1].attemptedAnswers.length) {
            return;
        }
        if (!$scope.attemptedAnswerFeedback[$scope.currentQuestion - 1] || $scope.attemptedAnswerFeedback[$scope.currentQuestion - 1].length !== $scope.answers[$scope.currentQuestion - 1].attemptedAnswers.length || letter) {
            answerService.checkAnswer($scope.currentQuestionSet.questionSetId, $scope.currentQuestion, $scope.isA, $scope.answers[$scope.currentQuestion - 1].attemptedAnswers, $scope.otherAttemptAnswers[$scope.currentQuestion - 1]).then(function(res) {
                $scope.attemptedAnswerFeedback[$scope.currentQuestion - 1] = res.data.data;
            });
        }
    }

    function checkAnswerDiffAndUpdate(nextAction, letter) {
        let data = {
            _id : $scope.answersObject._id,
            answers : $scope.answers,
            questionSetId: $scope.currentQuestionSet.questionSetId,
            isCollaborative : $scope.currentQuestionSet.isCollaborative
        };
        if (!$scope.isTeacher && !$scope.answersObject.isSubmitted) {
            if ((!$scope.previousAnswers[$scope.currentQuestion - 1]) ||
                nextAction === 'checkAnswer' ||
                ($scope.answers[$scope.currentQuestion - 1].collaborationAnswer != $scope.previousAnswers[$scope.currentQuestion - 1].collaborationAnswer) ||
                ($scope.answers[$scope.currentQuestion - 1].answer.singleChoice && !angular.equals($scope.answers[$scope.currentQuestion - 1].answer.singleChoice, $scope.previousAnswers[$scope.currentQuestion - 1].answer.singleChoice)) ||
                ($scope.answers[$scope.currentQuestion - 1].answer.openQuestion && !angular.equals($scope.answers[$scope.currentQuestion - 1].answer.openQuestion, $scope.previousAnswers[$scope.currentQuestion - 1].answer.openQuestion)) ||
                ($scope.answers[$scope.currentQuestion - 1].answer.multipleChoice && !angular.equals($scope.answers[$scope.currentQuestion - 1].answer.multipleChoice, $scope.previousAnswers[$scope.currentQuestion - 1].answer.multipleChoice)) ||
                ($scope.answers[$scope.currentQuestion - 1].answer.multipleOpenQuestion && !angular.equals($scope.answers[$scope.currentQuestion - 1].answer.multipleOpenQuestion, $scope.previousAnswers[$scope.currentQuestion - 1].answer.multipleOpenQuestion))) {
                let action = $scope.answersObject._id ? 'update' : 'create';
                if (nextAction === 'checkAnswer') {
                    if (!$scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
                        $scope.answers[$scope.currentQuestion - 1].attemptedAnswers = [];
                    }
                    if (letter) {
                        pushLetterIntoAttemptedAnswers(letter);
                    } else {
                        $scope.answers[$scope.currentQuestion - 1].attemptedAnswers.push(angular.copy($scope.answers[$scope.currentQuestion - 1].answer));
                    }
                }
                answerService.crud(action, data).then(function(res) {
                    if (action === 'create') {
                        $scope.answersObject = angular.copy(res.data.data);
                    }
                    $scope.previousAnswers[$scope.currentQuestion - 1] = angular.copy($scope.answers[$scope.currentQuestion - 1]);
                    if(nextAction === 'prev') {
                        $scope.currentQuestion--;
                        checkAnswer($scope.currentQuestion);
                    } else if (nextAction === 'next') {
                        $scope.currentQuestion++;
                        checkAnswer($scope.currentQuestion);
                    } else if (nextAction === 'checkAnswer') {
                        getAttemptAnswerFeeback(letter);
                        if (!letter) {
                            createActionItem('check answer', $scope.currentQuestion, $scope.answers[$scope.currentQuestion - 1].answer);
                        } else {
                            let item = {multipleOpenQuestion : {}};
                            item.multipleOpenQuestion[letter] = $scope.answers[$scope.currentQuestion - 1].answer.multipleOpenQuestion[letter]
                            createActionItem('check answer', $scope.currentQuestion, item);
                        }
                    }
                });
            } else {
                if(nextAction === 'prev') {
                    $scope.currentQuestion--;
                    checkAnswer($scope.currentQuestion);
                } else if (nextAction === 'next') {
                    $scope.currentQuestion++;
                    checkAnswer($scope.currentQuestion);
                }
            }
        }
    }

    function createActionItem(action, questionId, item) {
        if (!$scope.isTeacher && !$scope.answersObject.isSubmitted) {
            let actionItem = {
                questionId: questionId,
                action: action,
                answer : item,
                createdDate : new Date()
            };
            answerService.createActionItem($scope.currentQuestionSet.questionSetId, actionItem).then();
        }
    };

    $scope.home = function(useApply) {
        if ($scope.socket) {
            $scope.socket.disconnect();
        }
        $location.path('/');
        if (useApply) {
            $scope.$apply();
        }
    };

    $scope.checkIfPreviousGiveUp = function() {
        let promises = [];
        if ($scope.answersObject._id && !$scope.answersObject.currentGiveUpNumber) {
            promises.push(answerService.giveUpAnswer($scope.answersObject));
        }
        if ($scope.hintsObject.allSelectedHints._id && !$scope.hintsObject.allSelectedHints.currentGiveUpNumber) {
            promises.push(hintService.giveUpHint($scope.currentQuestionSet.questionSetId, $scope.hintsObject.allSelectedHints._id));
        }
        if (promises.length > 0) {
            $q.all(promises).then(function(){
                $scope.home();
            });
        }
    };

    $scope.validateAnswer = function(letter) {
        let index = $scope.currentQuestion - 1;

        if (!letter && $scope.currentQuestionSet.questions[index].hasCollaborationAnswer && isNaN($scope.answers[index].collaborationAnswer)){
            return false;
        }
        if ($scope.answers[index] && $scope.answers[index].answer) {
            if ($scope.answers[index].answer.singleChoice) {
                return $scope.answers[index].answer.singleChoice && $scope.answers[index].answer.singleChoice !== '';
            } else if ($scope.answers[index].answer.openQuestion) {
                return $scope.answers[index].answer.openQuestion && $scope.answers[index].answer.openQuestion !== '';
            } else if ($scope.answers[index].answer.multipleChoice) {
                for (let key of Object.keys($scope.answers[index].answer.multipleChoice)) {
                    if ($scope.answers[index].answer.multipleChoice[key]) {
                        return true;
                    }
                }
            } else if ($scope.answers[index].answer.multipleOpenQuestion) {
                if (letter) {
                    return $scope.answers[index].answer.multipleOpenQuestion[letter] && $scope.answers[index].answer.multipleOpenQuestion[letter] !== '';
                } else if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].multipleOpenQuestionSymbol) {
                    for (let symbol of $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].multipleOpenQuestionSymbol) {
                        if (!$scope.answers[index].answer.multipleOpenQuestion[symbol] || $scope.answers[index].answer.multipleOpenQuestion[symbol] === '') {
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    };

    if ($scope.currentQuestionSet.isCollaborative && !$scope.isTeacher) {
        socketService.socketSetup($scope);
    }

    $scope.showMessage = false;
    $scope.chatBox = {message : '', toastMessage : '', unreadMessage : 0};

    $scope.toggleMessage = function() {
        $scope.showMessage = !$scope.showMessage;
        if ($scope.showMessage) {
            $scope.chatBox.unreadMessage = 0;
            setTimeout(function() {
                $scope.chatEl.scrollTop = $scope.chatEl.scrollHeight;
            }, 100);
        }
    };

    $scope.collaborate = function() {
        if ($scope.socket && angular.isUndefined($scope.waiting)) {
            $scope.socket.emit('queueing');
        }
    };

    $scope.sendMessage = function() {
        if ($scope.socket && $scope.chatBox.message && $scope.chatBox.message !== '') {
            $scope.socket.emit('new message', $scope.chatBox.message);
            createActionItem('send message', $scope.currentQuestion, { message : $scope.chatBox.message });
            $scope.chatBox.message = '';
        }
    };

    $scope.selectHints = function() {
        if ($scope.socket && $scope.currentQuestionSet.isCollaborative && $scope.session) {
            let submitHints = [];
            for (let hint of $scope.currentHints.selectedHints) {
                if (!$scope.originalCurrentHints.selectedHints.includes(hint)) {
                    submitHints.push(hint);
                }
            }
            if (submitHints.length &&
                submitHints.length + $scope.originalCurrentHints.selectedHints.length <= $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxHintAllowedPerPerson) {
                let operation = $scope.hintsObject.allSelectedHints._id ? 'update' : 'create';
                hintService.crud(operation, $scope.currentHints, $scope.currentQuestionSet.questionSetId, $scope.isA, $scope.hintsObject.allSelectedHints._id, $scope.isReselect).then(function(res) {
                    createActionItem('selected hints', $scope.currentQuestion, submitHints);
                    for (let individualHint of res.data.data.hints) {
                        if (individualHint.questionId == $scope.currentHints.questionId) {
                            $scope.currentHints.createdDate = individualHint.createdDate;
                            $scope.originalCurrentHints = individualHint;
                            $scope.hintsObject.allSelectedHints = res.data.data;
                            $scope.currentHintsText = res.data.hintText.hintText;
                            let index = -1;
                            for (let i = 0; i < $scope.hintsObject.hintText.length; i++) {
                                if ($scope.hintsObject.hintText[i].questionId == res.data.hintText.questionId) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index > -1) {
                                $scope.hintsObject.hintText.splice(index, 1, res.data.hintText);
                            } else {
                                $scope.hintsObject.hintText.push(res.data.hintText);
                            }
                            return;
                        }
                    }
                    if ($scope.isReselect) {
                        $scope.isReselect = false;
                    }
                });
            }
        }
    };

    $scope.reselectHints = function() {
        $scope.showReselectHints = false;
        $scope.isReselect = true;
        $scope.originalCurrentHints = angular.copy($scope.originalCurrentHints);
        $scope.currentHints = angular.copy($scope.currentHints);
        $scope.originalCurrentHints.selectedHints = [];
        $scope.currentHints.selectedHints = [];
        $scope.currentHintsText = {};
        createActionItem('reselected hints', $scope.currentQuestion);
    };

    $scope.checkHints = function(hint) {
        return $scope.originalCurrentHints.selectedHints && $scope.originalCurrentHints.selectedHints.includes(hint);
    };

    $scope.currentCheckHints = function(hint) {
        return $scope.currentHints.selectedHints && $scope.currentHints.selectedHints.includes(hint);
    };

    $scope.disableHints = function() {
        return ($scope.currentHints.selectedHints && $scope.currentHints.selectedHints.length > $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxHintAllowedPerPerson) ||
            ($scope.originalCurrentHints.selectedHints && $scope.originalCurrentHints.selectedHints.length == $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxHintAllowedPerPerson);
    }

    $scope.showMultipleOpenQuestionButton = function(letter) {
        let hasSettings = $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type === 'multipleOpenQuestion' && $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].hasCheckAnswerSettings && !$scope.answersObject.isSubmitted;
        if (hasSettings) {
            if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxAttempts[letter] && $scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
                return $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxAttempts[letter] > $scope.getCurrentMultipleOpenQuestionAttempts(letter);
            }
        }
        return hasSettings;
    }

    $scope.getCurrentMultipleOpenQuestionAttempts = function(letter) {
        let count = 0;
        if ($scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
            for (let ans of $scope.answers[$scope.currentQuestion - 1].attemptedAnswers) {
                if (ans && ans.multipleOpenQuestion[letter] != null) {
                    count++;
                }
            }
        }
        return count;
    };

    $scope.showSolution = function() {
        if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].solutionImgPath && !$scope.solutionImgPath[$scope.currentQuestion - 1]) {
            if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].type === 'multipleOpenQuestion') {
                let allAtLeastOneAttempt = $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].multipleOpenQuestionSymbol.every(function(letter) {
                    return $scope.getCurrentMultipleOpenQuestionAttempts(letter) > 0;
                });
                if (allAtLeastOneAttempt) {
                    return $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].multipleOpenQuestionSymbol.some(function(letter) {
                        return $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxAttempts[letter] <= $scope.getCurrentMultipleOpenQuestionAttempts(letter);
                    });
                }
                return false;
            } else {
                return $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxAttempts &&
                $scope.answers[$scope.currentQuestion - 1].attemptedAnswers &&
                $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxAttempts <= $scope.answers[$scope.currentQuestion - 1].attemptedAnswers.length;
            }
        }
        return false;
    };

    $scope.showSolutionImg = function() {
        if ($scope.currentQuestionSet.questions[$scope.currentQuestion - 1].solutionImgPath) {
            $scope.solutionImgPath[$scope.currentQuestion - 1] = $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].solutionImgPath;
            createActionItem('show solutions', $scope.currentQuestion);
        }
    };

    $scope.toggleHints = function(hint) {
        let index = $scope.currentHints.selectedHints.indexOf(hint);
        if (index > -1) {
            $scope.currentHints.selectedHints.splice(index, 1);
        } else {
            $scope.currentHints.selectedHints.push(hint);
        }
    };

    $scope.giveUp = function(fromOthers) {
        let promises = [];
        if ($scope.answersObject._id && !$scope.answersObject.currentGiveUpNumber) {
            promises.push(answerService.giveUpAnswer($scope.answersObject));
        }
        if ($scope.hintsObject.allSelectedHints._id && !$scope.hintsObject.allSelectedHints.currentGiveUpNumber) {
            promises.push(hintService.giveUpHint($scope.currentQuestionSet.questionSetId, $scope.hintsObject.allSelectedHints._id));
        }
        let waitForSocketGiveUpCompleted = false;
        if (!fromOthers && $scope.socket && !$scope.session.currentGiveUpNumber) {
            waitForSocketGiveUpCompleted = true;
            $scope.waitForApiCall = true;
            $scope.socket.emit('giveUpSession');
        }
        $q.all(promises).then(function(){
            $('#giveUpModal').modal('hide');
            $scope.waitForApiCall = false;
            createActionItem('abort', $scope.currentQuestion);
            if (!fromOthers && !waitForSocketGiveUpCompleted) {
                $scope.home();
            }
        });
    };

    $scope.submit = function() {
        createActionItem('submit', $scope.currentQuestion, $scope.answers[$scope.currentQuestion - 1].answer);
        let data = {
            _id : $scope.answersObject._id,
            answers : $scope.answers,
            questionSetId: $scope.currentQuestionSet.questionSetId,
            isCollaborative : $scope.currentQuestionSet.isCollaborative,
            isSubmitted : true
        };
        if (!$scope.isTeacher && !$scope.answersObject.isSubmitted) {
            let action = $scope.answersObject._id ? 'update' : 'create';
            answerService.crud(action, data).then(function(){
                $('#submitModal').modal('hide');
                $scope.home();
            });
        } else {
            $('#submitModal').modal('hide');
            $scope.home();
        }
    };

}]);
