// Includes
var config = require('./config.js');
var users  = require('./user.js');
var groups = require('./group.js');
var utils  = require('./util.js');

// Make sure all connections are closed and exit the process
function shutdown(reason) {
    utils.log('server', 'Gracefully shutting down'.info);
    groups.reset();
    users.reset();
    process.exit();
}

// Make sure we gracefully shutdown on an uncaught exception
process.on('uncaughtException', function(error) {
    utils.log('server', (
        'Uncaught exception:\n' + 
        error
    ).error);
    shutdown();
});

// ^ Also on SIGINT (Ctrl^C)
process.on('SIGINT', function() {
    shutdown();
});

// Create server..
var server = utils.createServer(config.serverPort);
// ..and wait for requests
server.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    var user       = null;

    utils.log('server', ('New connection established from ' + connection.remoteAddress).info);

    connection.on('message', function(message) {
        if (message.type == 'utf8') {
            var data = null;
            try {
                data = JSON.parse(message.utf8Data);
            } catch (error) {
                utils.log('server', (
                    'What: Unable to parse json\n' +
                    'Data: ' + message.utf8Data + '\n' +
                    + error
                ).error);
            }
            if (data) {
                handleObject(data);
            }
        } else {
            utils.log('server', (
                'What: Invalid message type\n' +
                'Type: ' + message.type
            ).error);
        }
    });

    connection.on('close', function(reasonCode, description) {
        if (user) {
	        users.remove(user);
            users.broadcast(JSON.stringify({
                type: 'disconnecteduser',
                time: utils.time(),
                name: user.name,
                color: user.color
            }), user);
        }
        utils.log('server', ('Connection closed from ' + connection.remoteAddress).info);
    });

    function handleObject(object) {
        if (object.type) {
            switch (object.type) {
                case 'auth':    handleAuth(object);    break;
                case 'message': handleMessage(object); break;
                case 'command': handleCommand(object); break;
                default: {
                    utils.log('server', (
                        'What: Invalid object\n' +
                        'Object: ' + JSON.stringify(object)
                    ).error);
		}
            }
        } else {
            utils.log('server', (
                'What: No object type\n' +
                'Object: ' + JSON.stringify(object)
            ).error);
        }
    }

    function handleAuth(data) {
        if (!users.isValidName(data.name)) {
            connection.send(JSON.stringify({
                type: 'error',
                time: utils.time(),
                msg: 'Username is unavailable'
            }));
            return;
        }

	    user = users.create(connection, data.name, data.color);

        connection.send(JSON.stringify({
            type: 'auth',
            time: utils.time(),
            name: user.name,
            color: user.color
        }));

        utils.log('server', ('New user (' + user.id + ', ' + user.name + ') authenticated from '
            + connection.remoteAddress).info);
    }

    function handleMessage(message) {
        if (!message.data) {
            utils.log('server', (
                'What: Invalid message\n' +
                'Message: ' + JSON.stringify(message)
            ).error);
            return;
        }
        users.broadcast(JSON.stringify({
            type: 'message',
            time: utils.time(),
            group: message.group,
            name: user.name,
            color: user.color,
            msg:  message.data
        }));
    }

    function handleCommand(command) {
        var data = command.data.trim();
        var args = data.split(' ');
        var command = args.shift();
        switch (command) {
            case 'join':  handleJoin(args[0]);  break;
            case 'leave': handleLeave(args[0]); break;
            default: {
                utils.log('server', (
                    'What: Unknown command\n' +
                    'Command: ' + command + '\n' +
                    'Args: ' + args
                ).error);
            }
        }
    }

    function handleJoin(groupName) {
        group = groups.join(groupName, user);
        if (group) {
            var groupUsers = new Array();
            for (var i in group.users) {
                groupUsers.push({
                    name: group.users[i].name,
                    color: group.users[i].color
                });
            }
            connection.send(JSON.stringify({
                type: 'join',
                time: utils.time(),
                name: groupName,
                users: groupUsers
            }));
            users.broadcast(JSON.stringify({
                type: 'connecteduser',
                time: utils.time(),
                group: group.name,
                name: user.name,
                color: user.color
            }), user);
        } else {
            utils.log('server', ('Unable to join group').warn);
        }
    }

    function handleLeave(groupName) {
        var leftGroup = groups.leave(groupName, user);
        if (leftGroup == true) {
            connection.send(JSON.stringify({
                type: 'leave',
                time: utils.time(),
                name: groupName
            }));
            users.broadcast(JSON.stringify({
                type: 'disconnecteduser',
                time: utils.time(),
                group: groupName,
                name: user.name,
                color: user.color
            }), user);
        } else {
            utils.log('server', ('Unable to leave group').warn);
        }
    }
});
