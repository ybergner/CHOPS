'use strict';
var app = angular.module('myApp', ['ngRoute']);
app.config(function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '../template/test.html',
            controller: 'testController'
        });
});

app.config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|sms|tel):/);
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
        getAnswersByAccount : function() {
            var account = accountService.getCurrentAccount();
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
        }
    };
}]);

app.factory('accountService', ['$http', '$q', 'enums', function($http, $q, enums) {
    var account;
    return {
        getCurrentAccount : function() {
            return account;
        },
        logoutAccount : function() {
            account = null;
        },
        loginAccount : function(data) {
            return $http.post('api/validatePassword', {
                accountId : data.accountId,
                password : data.password
            }).then(function(res) {
                account = res.data.data;
                return account;
            });
        },
        getStudents : function(data) {
            if (account && account.accountType == enums.accountType.teacher) {
                return $http.post('api/students', {account: account});
            } else {
                return $q.reject('No Permissions');
            }
        },
        crud : function(operation, data) {
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

app.controller('testController', ['$scope', 'accountService', 'answerService', 'sessionService', 'socketService',
    function($scope, accountService, answerService, sessionService, socketService) {
    accountService.loginAccount({
        accountId : 123,
        password : 'admin'
    }).then(function(account) {
        $scope.account = account;
    });
    $scope.click = function(){
        answerService.getAnswersByAccount().then(function(res) {
            console.log(res);
        });
        socketService.socketSetup();
    }
}]);
