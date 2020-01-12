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

app.factory('enum', function() {
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
}]);

app.factory('answerService', ['$http', function($http) {
    return {};
}]);

app.factory('accountService', ['$http, enum', function($http, enum) {
    var account;
    return {
        getCurrentAccount : function() {
            return account;
        },
        validatePassword : function(data) {
            return $http.post('api/validatePassword', {
                accountId : data.accountId,
                password : data.password
            }).then(function(res) {
                account = res.data.data;
                return account;
            });
        },
        getStudentByAccount : function(data) {
            if (account && account.accountType == enum.accountType.teacher) {
                return $http.post('api/students', {account: account});
            }
        },
        crud : function(operation, data) {
            if (account && account.accountType == enum.accountType.teacher) {
                return $http.post('api/student', {account: account, operation : operation, data: data});
            }
        }
    }
}]);

app.controller('testController', ['$scope', '$http', function($scope, $http){
    $http.post('api/validatePassword', {
        accountId : 123,
        password : 'admin'
    }).then(function(res) {
        $scope.account = res.data.data;
    });
    $scope.click = function(){
        $http.post('api/student', {account: $scope.account, operation: 'delete', studentId : 9999999}).then(function(res) {
            console.log(res);
        });
    }
}]);
