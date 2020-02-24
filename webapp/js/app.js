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
                isHidden : false,
                isCollaborative : false,
                answers : []
            },
            {
                questionSetId : 'Temp_collaborative',
                name : 'Test Temp',
                numOfQuestions : 3,
                isHidden : false,
                isCollaborative : true,
                answers : []
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
                return $http.post('api/answer', {account: account, operation: operation, data: data});
            } else {
                return $q.reject('No Account Information');
            }
        },
        setCurrentQuestionSet : function(questionSet) {
            currentQuestionSet = questionSet;
        },
        getCurrentQuestionSet : function() {
            return currentQuestionSet;
        },
        downloadReport : function() {
            var account = accountService.getCurrentAccount();
            if (account) {
                return $http.post('api/getReport', {account: account}, {responseType: "arraybuffer"});
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
            socket.on('account received', function(){
                console.log('account set up completed in socket.');
                scope.socket = socket;
            });
            socket.on('account in queue', function() {
                console.log('account waiting in queue');
                scope.waiting = true;
                scope.$apply();
            });
            socket.on('account matched', function(data) {
                console.log('account matched');
                console.log(data);
                scope.session = data;
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
                scope.showMessage = false;
                $('.toast').toast('hide');
                scope.chatBox.toastMessage = 'Collaborator disconnected.';
                scope.$apply();
                $('.toast').toast('show');
            });
            socket.on('new message', function(message){
                scope.session.messages.push(message);
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

app.controller('questionSetController', ['$scope', 'accountService', 'answerService', '$location', '$q', 'enums', 'socketService', function($scope, accountService, answerService, $location, $q, enums, socketService) {
    $scope.account = $scope.account || accountService.getCurrentAccount();
    $scope.currentQuestionSet = answerService.getCurrentQuestionSet();
    if (!$scope.currentQuestionSet) {
        $scope.currentQuestionSet = { answers : [] };
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
    $scope.previousAnswers = angular.copy($scope.currentQuestionSet.answers);

    var checkAnswer = function(questionId) {
        if (!$scope.currentQuestionSet.answers[questionId - 1]) {
            $scope.currentQuestionSet.answers[questionId - 1] = {
                questionId : questionId,
                questionSetId : $scope.currentQuestionSet.questionSetId,
                answer : {},
                selectedHints : [],
                isCollaborative : $scope.currentQuestionSet.isCollaborative
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
        for (let key of Object.keys($scope.currentQuestionSet.answers[index].answer)) {
            if ($scope.currentQuestionSet.answers[index].answer[key] && $scope.currentQuestionSet.answers[index].answer[key] !== '') {
                return true;
            }
        }
        return false;
    };

    if ($scope.currentQuestionSet.isCollaborative) {
        if (!$scope.isTeacher) {
            socketService.socketSetup($scope);
        }
        $scope.templateFolderPath = 'template/questions/collaborative/';
    } else {
        $scope.templateFolderPath = 'template/questions/individual/';
    }

    $scope.showMessage = false;
    $scope.chatBox = {message : '', toastMessage : ''};

    $scope.toggleMessage = function() {
        $scope.showMessage = !$scope.showMessage;
        if ($scope.showMessage) {
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

    $scope.submit = function() {
        let promises = [];
        for (let i = 0; i < $scope.currentQuestionSet.numOfQuestions; i++) {
            if (!$scope.isTeacher && $scope.validateAnswer(i)) {
                if (!$scope.previousAnswers[i]) {
                    promises.push(answerService.crud('create', $scope.currentQuestionSet.answers[i]));
                } else if(!angular.equals($scope.previousAnswers[i], $scope.currentQuestionSet.answers[i])) {
                    promises.push(answerService.crud('update', $scope.currentQuestionSet.answers[i]));
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
