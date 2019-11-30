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
                answers: function($route, answerService) {
                    return answerService.getAnswersByAccount(null, $route.current.params.questionSetId).then(function(res) {
                        return res.data.data;
                    });
                },
                hintsObject: function($route, hintService) {
                    return hintService.getHintsByAccount(null, $route.current.params.questionSetId).then(function(res) {
                        let retObject = {
                            allSelectedHints : (res.data && res.data.data) || [],
                            hintText : (res.data && res.data.hintText) || []
                        }
                        return retObject;
                    });
                },
            }
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
        downloadReport : function() {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/getReport', {account: account}, {responseType: "arraybuffer"});
            } else {
                return $q.reject('No Account Information');
            }
        },
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
        crud : function(operation, data) {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/hint', {account: account, operation: operation, data: data});
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
        }
    };
}]);

app.factory('socketService', function() {
    return {
        socketSetup : function(scope) {
            let socket = io({ reconnection: false });
            socket.emit('account', {accountId : scope.account.accountId, questionSetId : scope.currentQuestionSet.questionSetId});
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
                    scope.session = data.session;
                    scope.isA = scope.session.accountAId == scope.account.accountId;
                    angular.extend(scope.currentQuestionSet, data.questionSet);
                    scope.checkAnswer(scope.currentQuestion);
                    scope.$apply();
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
                    scope.checkAnswer(scope.currentQuestion);
                }
                scope.isConnect = true;
                scope.waiting = false;
                $('.toast').toast('hide');
                scope.chatBox.toastMessage = 'Connected with another collaborator.';
                scope.$apply();
                $('.toast').toast('show');
                scope.chatEl = document.getElementById("message-box");
            });
            socket.on('leave', function(id) {
                console.log('account id ' + id + ' left');
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
        }
    };
});

app.controller('loginController', ['$scope', 'accountService', '$location', function($scope, accountService, $location) {
    $scope.account = accountService.getCurrentAccount();
    if ($scope.account) {
        // redirect
        $location.path('/');
    }
    $scope.submit = function() {
        if ($scope.accountId && $scope.password) {
            accountService.loginAccount({
                accountId : $scope.accountId,
                password : $scope.password
            }).then(function(account) {
                $scope.account = account;
                // redirect
                $location.path('/');
            }, function(error) {
                $scope.accountId = null;
                $scope.password = null;
            });
        }
    }
}]);

app.controller('listController', ['$scope', 'accountService', '$location', 'enums', 'questionService', 'answerService', function($scope, accountService, $location, enums, questionService, answerService) {
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
                            if (!$scope.answerQuestionMap[ans.questionSetId]) {
                                $scope.answerQuestionMap[ans.questionSetId] = [];
                            }
                            $scope.answerQuestionMap[ans.questionSetId].push(ans);
                            break;
                        }
                    }
                }
            });
        }
    });

    $scope.doQuestionSet = function(questionSet) {
        $location.path('/questions/' + questionSet.questionSetId);
    };
}]);

app.controller('questionSetController', ['$scope', 'questionSet', 'answers', 'hintsObject', 'accountService', 'answerService', 'hintService', '$location', '$q', 'enums', 'socketService', function($scope, questionSet, answers, hintsObject, accountService, answerService, hintService, $location, $q, enums, socketService) {
    $scope.account = $scope.account || accountService.getCurrentAccount();
    $scope.currentQuestionSet = questionSet;
    $scope.answers = answers || [];
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

    $scope.currentQuestion = 1;
    $scope.isTeacher = $scope.account && $scope.account.accountType === enums.accountType.teacher;
    $scope.previousAnswers = angular.copy($scope.answers);
    $scope.currentHints = {};
    $scope.originalCurrentHints = {};
    var checkAnswer = $scope.checkAnswer =  function(questionId) {
        if (!$scope.answers[questionId - 1]) {
            $scope.answers[questionId - 1] = {
                questionId : questionId,
                questionSetId : $scope.currentQuestionSet.questionSetId,
                answer : {},
                isCollaborative : $scope.currentQuestionSet.isCollaborative
            }
            if ($scope.currentQuestionSet.questions[questionId - 1].type === 'multipleChoice') {
                $scope.answers[questionId - 1].answer.multipleChoice = {};
            }
        }
        if ($scope.session) {
            $scope.currentHints = {questionId : questionId, selectedHints : [], questionSetId : $scope.currentQuestionSet.questionSetId, isA : $scope.isA};
            $scope.originalCurrentHints = {questionId : questionId, selectedHints : [], questionSetId : $scope.currentQuestionSet.questionSetId, isA : $scope.isA};
            for (let selectedHints of $scope.hintsObject.allSelectedHints) {
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
        }
    };

    checkAnswer($scope.currentQuestion);

    $scope.next = function() {
        if ($scope.currentQuestion < $scope.currentQuestionSet.numOfQuestions) {
            $scope.currentQuestion++;
            checkAnswer($scope.currentQuestion);
        }
    };

    $scope.prev = function() {
        if($scope.currentQuestion > 1) {
            $scope.currentQuestion--;
            checkAnswer($scope.currentQuestion);
        }
    };

    $scope.home = function() {
        if ($scope.socket) {
            $scope.socket.disconnect();
        }
        $location.path('/');
    };

    $scope.validateAnswer = function(index) {
        if (!angular.isNumber(index)) {
            index = $scope.currentQuestion - 1;
        }
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
                let operation = $scope.originalCurrentHints._id ? 'update' : 'create';
                hintService.crud(operation, $scope.currentHints).then(function(res) {
                    if (operation == 'create') {
                        $scope.currentHints._id = res.data.data._id;
                        $scope.originalCurrentHints = res.data.data;
                        $scope.hintsObject.allSelectedHints.push(res.data.data);
                        $scope.currentHintsText = res.data.hintText.hintText;
                        $scope.hintsObject.hintText.push(res.data.hintText);
                    } else {
                        $scope.originalCurrentHints.selectedHints = res.data.data.selectedHints;
                        angular.extend($scope.currentHintsText, res.data.hintText.hintText);
                    }
                });
            }
        }
    };

    $scope.checkHints = function(hint) {
        return $scope.originalCurrentHints.selectedHints && $scope.originalCurrentHints.selectedHints.includes(hint);
    };

    $scope.disableHints = function() {
        return ($scope.currentHints.selectedHints && $scope.currentHints.selectedHints.length > $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxHintAllowedPerPerson) ||
            ($scope.originalCurrentHints.selectedHints && $scope.originalCurrentHints.selectedHints.length == $scope.currentQuestionSet.questions[$scope.currentQuestion - 1].maxHintAllowedPerPerson);
    }

    $scope.toggleHints = function(hint) {
        let index = $scope.currentHints.selectedHints.indexOf(hint);
        if (index > -1) {
            $scope.currentHints.selectedHints.splice(index, 1);
        } else {
            $scope.currentHints.selectedHints.push(hint);
        }
    };

    $scope.submit = function() {
        let promises = [];
        for (let i = 0; i < $scope.currentQuestionSet.numOfQuestions; i++) {
            if (!$scope.isTeacher && $scope.validateAnswer(i)) {
                if (!$scope.previousAnswers[i]) {
                    promises.push(answerService.crud('create', $scope.answers[i]));
                } else if(!angular.equals($scope.previousAnswers[i], $scope.answers[i])) {
                    promises.push(answerService.crud('update', $scope.answers[i]));
                }
            }
        }
        $q.all(promises).then(function(){
            if ($scope.socket) {
                $scope.socket.disconnect();
            }
            $location.path('/');
        });
    };

}]);
