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
        when('/questions', {
            templateUrl: '../template/questionSet.html',
            controller: 'questionSetController'
        });
});

app.config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|sms|tel):/);
}]);

app.factory('questionSetMapping', function() {
    return {
        list : [
            {
                questionSetId : 'Temp',
                name : 'Test Temp',
                numOfQuestions : 3,
                answers : [],
                isHidden : false
            }
        ]
    };
});

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
    var currentQuestionSet;
    return {
        getAnswersByAccount : function(account) {
            if (!account) {
                account = accountService.getCurrentAccount();
            }
            if (account) {
                return $http.get('api/answer/' + account.accountId);
            } else {
                return $q.reject('No Account Information');
            }
        },
        crud : function(operation, data) {
            var account = accountService.getCurrentAccount();
            if (account) {
                $http.post('api/answer', {account: account, operation: operation, data: data});
            } else {
                return $q.reject('No Account Information');
            }
        },
        setCurrentQuestionSet : function(questionSet) {
            currentQuestionSet = questionSet;
        },
        getCurrentQuestionSet : function() {
            return currentQuestionSet;
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
        getStudents : function(data) {
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

app.factory('sessionService', ['$http', '$q', function($http, $q) {
    return {
        getSessionByAccount : function() {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.get('api/session/' + account.accountId);
            } else {
                return $q.reject('No Account Information');
            }
        },
    };
}]);

app.factory('socketService', ['accountService', function(accountService) {
    var socket;
    return {
        socketSetup : function() {
            socket = io({ reconnection: false });
            socket.emit('account', accountService.getCurrentAccount());
            socket.on('account received', function(){console.log('account connected to socket')});
        }
    };
}]);

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

app.controller('listController', ['$scope', 'accountService', '$location', 'enums', 'questionSetMapping', 'answerService', function($scope, accountService, $location, enums, questionSetMapping, answerService) {
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
    $scope.isTeacher = $scope.account.accountType === enums.accountType.teacher;
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
        }
    } else {
        answerService.getAnswersByAccount().then(function(res){
            var answers = res.data.data;
            for (let ans of answers) {
                for (let questionSet of $scope.questionSetList) {
                    if (ans.questionSetId == questionSet.questionSetId) {
                        questionSet.answers[ans.questionId - 1] = ans;
                        break;
                    }
                }
            }
        });
    }
    $scope.questionSetList = angular.copy(questionSetMapping.list);

    $scope.doQuestionSet = function(questionSet) {
        answerService.setCurrentQuestionSet(questionSet);
        $location.path('/questions');
    };
}]);

app.controller('questionSetController', ['$scope', 'accountService', 'answerService', '$location', '$q', '$window', function($scope, accountService, answerService, $location, $q, $window) {
    $scope.account = $scope.account || accountService.getCurrentAccount();
    $scope.currentQuestionSet = answerService.getCurrentQuestionSet();
    if (!$scope.currentQuestionSet) {
        $scope.currentQuestionSet = { answers : [] };
        $location.path('/');
    }
    $scope.logout = function() {
        accountService.logoutAccount();
        $location.path('/login');
    };

    $scope.currentQuestion = 1;
    $scope.previousAnswers = angular.copy($scope.currentQuestionSet.answers);

    var checkAnswer = function(questionId) {
        if (!$scope.currentQuestionSet.answers[questionId - 1]) {
            $scope.currentQuestionSet.answers[questionId - 1] = {
                questionId : questionId,
                questionSetId : $scope.currentQuestionSet.questionSetId,
                answer : {}
                //selectedHint: { type : [String] },
                //isCollaborative : { type : Boolean }
            }
        }
    };

    checkAnswer($scope.currentQuestion);

    $scope.next = function() {
        if($scope.currentQuestion < $scope.currentQuestionSet.numOfQuestions) {
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

    $scope.submit = function() {
        if (!Object.keys($scope.currentQuestionSet.answers[$scope.currentQuestion - 1].answer).length) {
            return;
        }
        let promises = [];
        for (let i = 0; i < $scope.currentQuestionSet.numOfQuestions; i++) {
            if (!$scope.previousAnswers[i]) {
                promises.push(answerService.crud('create', $scope.currentQuestionSet.answers[i]));
            } else if(!angular.equals($scope.previousAnswers[i], $scope.currentQuestionSet.answers[i])) {
                promises.push(answerService.crud('update', $scope.currentQuestionSet.answers[i]));
            }
        }
        $q.all(promises).then(function(){
            $location.path('/');
        });
    };

}]);
