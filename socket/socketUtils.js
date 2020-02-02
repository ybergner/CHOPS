'use strict';
var sessionRouter = require('../router/sessionRouter.js');
var utils = {};

utils.setUpSocket = function(io) {
    const accountSessionSocketMap = {}; // { accountA : {session : session, isConnect : true/fasle, socket : socket }}
    const accountQueue = [];
    var counter = 0;
    io.on('connection', function(socket) {
        socket.on('account', function(data) {
            socket._userName = data.accountId;
            accountSessionSocketMap[data.accountId] = {};
            accountSessionSocketMap[data.accountId].isConnect = false;
            accountSessionSocketMap[data.accountId].socket = socket;
            accountSessionSocketMap[data.accountId].questionSetId = data.questionSetId;
            sessionRouter.getSessionById(data.accountId, data.questionSetId).then(function(sessions) {
                console.log(sessions);
                if (sessions && sessions.length) {
                    accountSessionSocketMap[data.accountId].session = sessions[0];
                } else {
                    accountSessionSocketMap[data.accountId].session = [];
                }
                socket.emit('account received');
            });
        });

        socket.on('queueing', function() {
            if (accountQueue.length) {
                // someone in queue
                if (accountSessionSocketMap[socket._userName].session && accountSessionSocketMap[socket._userName].session._id) {
                    // account had collaborate this question set with someone before
                    let index = accountQueue.indexOf(accountSessionSocketMap[socket._userName].session.accountAId);
                    if (index == -1) {
                        index = accountQueue.indexOf(accountSessionSocketMap[socket._userName].session.accountAId);
                    }
                    if (index > -1) {
                        // found the collaborated account
                        accountSessionSocketMap[socket._userName].isConnect = true;
                        socket._roomName = accountSessionSocketMap[socket._userName].session._id;
                        let matchedAccountId = accountQueue.splice(index, 1)[0];
                        accountSessionSocketMap[matchedAccountId].isConnect = true;
                        accountSessionSocketMap[matchedAccountId].socket._roomName = accountSessionSocketMap[socket._userName].session._id;
                        // make reference the same
                        accountSessionSocketMap[matchedAccountId].session = accountSessionSocketMap[socket._userName].session;
                        socket.join(socket._roomName);
                        accountSessionSocketMap[matchedAccountId].socket.join(socket._roomName);
                        io.in(socket._roomName).emit('account matched', accountSessionSocketMap[socket._userName].session);
                    } else {
                        // did not find the collaborated account, put current account into queue
                        accountQueue.push(socket._userName);
                        socket.emit('account in queue');
                    }
                } else {
                    // first time to do this question set
                    socket._roomName = "First Time Room " + counter;
                    accountSessionSocketMap[socket._userName].isConnect = true;
                    accountSessionSocketMap[socket._userName].session = {
                        accountAId : socket._userName,
                        accountBId : matchedAccountId,
                        questionSetId : accountSessionSocketMap[socket._userName].questionSetId,
                        messages : [],
                        accountASelectedHints : {},
                        accountBSelectedHints : {}
                    };
                    let matchedAccountId = accountQueue.shift();
                    accountSessionSocketMap[matchedAccountId].socket._roomName = "First Time Room " + counter;
                    accountSessionSocketMap[matchedAccountId].isConnect = true;
                    // make reference the same
                    accountSessionSocketMap[matchedAccountId].session = accountSessionSocketMap[socket._userName].session;
                    counter++;
                    socket.join(socket._roomName);
                    accountSessionSocketMap[matchedAccountId].socket.join(socket._roomName);
                    io.in(socket._roomName).emit('account matched', accountSessionSocketMap[socket._userName].session);
                }
            } else {
                // no one is in queue, put current account into queue
                accountQueue.push(socket._userName);
                socket.emit('account in queue');
            }
        });

        socket.on('disconnect', function(){
            if (accountSessionSocketMap[socket._userName] && accountSessionSocketMap[socket._userName].isConnect) {
                sessionRouter.addOrUpdateSession(accountSessionSocketMap[socket._userName].session);
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
            let message = { accountId : socket._userName, message : data, createdDate : new Date() };
            accountSessionSocketMap[socket._userName].session.messages.push(message);
            io.in(socket._roomName).emit('new message', message);
        });

    });
    console.log('socket.io set up completed');
};

module.exports = utils;
