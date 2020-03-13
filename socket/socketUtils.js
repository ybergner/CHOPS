'use strict';
var sessionRouter = require('../router/sessionRouter.js');
var questionRouter = require('../router/questionRouter.js');
var utils = {};

utils.setUpSocket = function(io) {
    const accountSessionSocketMap = {}; // { accountA : {session : session, isConnect : true/fasle, socket : socket }}
    const accountQueue = [];
    var counter = 0;
    io.on('connection', function(socket) {
        socket.on('account', function(data) {
            if (accountSessionSocketMap[data.accountId]) {
                socket._userName = "invalid_socket";
                socket.emit('account already has socket', {});
            } else {
                socket._userName = data.accountId;
                accountSessionSocketMap[data.accountId] = {};
                accountSessionSocketMap[data.accountId].isConnect = false;
                accountSessionSocketMap[data.accountId].socket = socket;
                accountSessionSocketMap[data.accountId].questionSetId = data.questionSetId;
                sessionRouter.getSessionById(data.accountId, data.questionSetId).then(function(sessions) {
                    if (sessions && sessions.length) {
                        accountSessionSocketMap[data.accountId].session = sessions[0] || {};
                        let isA = accountSessionSocketMap[data.accountId].session.accountAId === data.accountId;
                        let accountSelectedHints = isA ? accountSessionSocketMap[data.accountId].session.accountASelectedHints : accountSessionSocketMap[data.accountId].session.accountBSelectedHints;
                        let hintText = [];
                        for (let selectedHints of accountSelectedHints) {
                            let hintsText = questionRouter.getHint(accountSessionSocketMap[data.accountId].questionSetId, selectedHints.questionId, isA);
                            let selectedHintsText = {};
                            for (let key of selectedHints.selectedHints) {
                                selectedHintsText[key] = hintsText[key];
                            }
                            hintText.push({
                                questionId : selectedHints.questionId,
                                hintText : selectedHintsText
                            });
                        }
                        socket.emit('account received', {
                            session : accountSessionSocketMap[data.accountId].session,
                            questionSet : questionRouter.getQuestionSet(data.questionSetId, isA),
                            hintText : hintText
                        });
                    } else {
                        accountSessionSocketMap[data.accountId].session = {};
                        socket.emit('account received', {});
                    }
                });
            }
        });

        socket.on('queueing', function() {
            if (socket._userName == "invalid_socket") {
                socket.emit('account already has socket', {});
                return;
            }
            if (accountQueue.length) {
                // someone in queue
                if (accountSessionSocketMap[socket._userName].session && accountSessionSocketMap[socket._userName].session._id) {
                    // account had collaborate this question set with someone before
                    let index = accountQueue.indexOf(accountSessionSocketMap[socket._userName].session.accountAId);
                    if (index == -1) {
                        index = accountQueue.indexOf(accountSessionSocketMap[socket._userName].session.accountBId);
                    }
                    if (index > -1) {
                        // found the collaborated account
                        accountSessionSocketMap[socket._userName].isConnect = true;
                        socket._roomName = accountSessionSocketMap[socket._userName].session._id.toString();
                        let matchedAccountId = accountQueue.splice(index, 1)[0];
                        accountSessionSocketMap[matchedAccountId].isConnect = true;
                        accountSessionSocketMap[matchedAccountId].socket._roomName = accountSessionSocketMap[socket._userName].session._id.toString();
                        // make reference the same
                        accountSessionSocketMap[matchedAccountId].session = accountSessionSocketMap[socket._userName].session;
                        socket.join(socket._roomName);
                        accountSessionSocketMap[matchedAccountId].socket.join(socket._roomName);
                        let isA = accountSessionSocketMap[socket._userName].session.accountAId == socket._userName;
                        socket.emit('account matched', {
                            session : accountSessionSocketMap[socket._userName].session,
                            questionSet : questionRouter.getQuestionSet(accountSessionSocketMap[socket._userName].questionSetId, isA)
                        });
                        accountSessionSocketMap[matchedAccountId].socket.emit('account matched', {
                            session : accountSessionSocketMap[socket._userName].session,
                            questionSet : questionRouter.getQuestionSet(accountSessionSocketMap[socket._userName].questionSetId, !isA)
                        });
                    } else {
                        // did not find the collaborated account, put current account into queue
                        accountQueue.push(socket._userName);
                        socket.emit('account in queue', {});
                    }
                } else {
                    // first time to do this question set
                    socket._roomName = "First Time Room " + counter;
                    let index = -1;
                    for (let i = 0; i < accountQueue.length; i++) {
                        if (!accountSessionSocketMap[accountQueue[i]].session._id) {
                            index = i;
                            break;
                        }
                    }
                    if (index > -1) {
                        let matchedAccountId = accountQueue.splice(index, 1)[0];
                        accountSessionSocketMap[socket._userName].isConnect = true;
                        accountSessionSocketMap[socket._userName].session = {
                            accountAId : socket._userName,
                            accountBId : matchedAccountId,
                            questionSetId : accountSessionSocketMap[socket._userName].questionSetId,
                            messages : [],
                            accountASelectedHints : [],
                            accountBSelectedHints : []
                        };
                        accountSessionSocketMap[matchedAccountId].socket._roomName = "First Time Room " + counter;
                        accountSessionSocketMap[matchedAccountId].isConnect = true;
                        // make reference the same
                        accountSessionSocketMap[matchedAccountId].session = accountSessionSocketMap[socket._userName].session;
                        counter++;
                        socket.join(socket._roomName);
                        accountSessionSocketMap[matchedAccountId].socket.join(socket._roomName);
                        let isA = true;
                        socket.emit('account matched', {
                            session : accountSessionSocketMap[socket._userName].session,
                            questionSet : questionRouter.getQuestionSet(accountSessionSocketMap[socket._userName].questionSetId, isA)
                        });
                        accountSessionSocketMap[matchedAccountId].socket.emit('account matched', {
                            session : accountSessionSocketMap[socket._userName].session,
                            questionSet : questionRouter.getQuestionSet(accountSessionSocketMap[socket._userName].questionSetId, !isA)
                        });
                    } else {
                        // no one is in queue, put current account into queue
                        accountQueue.push(socket._userName);
                        socket.emit('account in queue', {});
                    }
                }
            } else {
                // no one is in queue, put current account into queue
                accountQueue.push(socket._userName);
                socket.emit('account in queue', {});
            }
        });

        socket.on('disconnect', function() {
            if (accountSessionSocketMap[socket._userName] && (accountSessionSocketMap[socket._userName].isConnect || accountSessionSocketMap[socket._userName].session._id)) {
                sessionRouter.addOrUpdateSession(accountSessionSocketMap[socket._userName].session);
            }
            if (accountSessionSocketMap[socket._userName] && accountSessionSocketMap[socket._userName].isConnect) {
                if (accountSessionSocketMap[socket._userName].session.accountAId == socket._userName) {
                    // mark other connected socket as disconnected to avoid duplicate saving operations
                    accountSessionSocketMap[accountSessionSocketMap[socket._userName].session.accountBId].isConnect = false;
                    // requeue other account
                    accountQueue.push(accountSessionSocketMap[socket._userName].session.accountBId);
                } else {
                    accountSessionSocketMap[accountSessionSocketMap[socket._userName].session.accountAId].isConnect = false;
                    accountQueue.push(accountSessionSocketMap[socket._userName].session.accountAId);
                }
            }
            var index = accountQueue.indexOf(socket._userName);
            if (index > -1) {
                accountQueue.splice(index, 1);
            }
            delete accountSessionSocketMap[socket._userName];
            if (socket._roomName) {
                socket.to(socket._roomName).emit('leave', socket._userName);
            }
        });

        socket.on('new message', function(data){
            if (socket._userName == "invalid_socket") {
                socket.emit('account already has socket', {});
                return;
            }
            let message = { accountId : socket._userName, message : data, createdDate : new Date() };
            accountSessionSocketMap[socket._userName].session.messages.push(message);
            io.in(socket._roomName).emit('new message', message);
        });

        socket.on('select hints', function(data){
            if (socket._userName == "invalid_socket") {
                socket.emit('account already has socket', {});
                return;
            }
            let alreadySelectedHints = [];
            let validHints = [].concat(data.selectedHints);
            let selfAccountSelectedHints;
            let isA = false;
            if (accountSessionSocketMap[socket._userName].session.accountAId == socket._userName) {
                // user is account A
                selfAccountSelectedHints =  accountSessionSocketMap[socket._userName].session.accountASelectedHints;
                isA = true;
            } else {
                // user is account B
                selfAccountSelectedHints =  accountSessionSocketMap[socket._userName].session.accountBSelectedHints;
            }
            if (validHints.length) {
                let isExisted = false;
                for (let selectedHints of selfAccountSelectedHints) {
                    if (selectedHints.questionId == data.questionId) {
                        isExisted = true;
                        for (let hint of validHints) {
                            if (!selectedHints.selectedHints.includes(hint)) {
                                selectedHints.selectedHints.push(hint);
                            }
                        }
                        break;
                    }
                }
                if (!isExisted) {
                    selfAccountSelectedHints.push({questionId : data.questionId, selectedHints : validHints});
                }
                let hintsText = questionRouter.getHint(accountSessionSocketMap[socket._userName].questionSetId, data.questionId, isA);
                let selectedHintsText = {};
                for (let key of validHints) {
                    selectedHintsText[key] = hintsText[key];
                }
                let hintText = {
                    questionId : data.questionId,
                    hintText : selectedHintsText
                };
                socket.emit('new hints selected',
                { questionId : data.questionId, selectedHints : validHints, accountId : socket._userName, hintText : hintText });
            }
        });

    });
    console.log('socket.io set up completed');
};

module.exports = utils;
