var utils  = require('./util.js');

var users             = new Array();
var userIdRecyclyBin  = new Array();
var nextUserId        = 0;

function getNextUserId() {
    if (userIdRecyclyBin.length > 0) {
        return userIdRecyclyBin.shift();
    } else {
        return nextUserId++;
    }
}

function getUserByName(name) {
    for (var id in users) {
        if (name == users[id].name) {
            return users[id].user;
        }
    }
    return null;
}

function isValidName(name) {
    if (!name || !(typeof name == 'string')) {
        return false;
    }
    for (var id in users) {
        if (name == users[id].name) {
            return false;
        }
    }
    return true;
}

function create(connection, name, color) {
    if (isValidName(name)) {
        var user = new Object();
        user.id = getNextUserId();
        user.name = name;
        user.color = color || config.defaultColor;
        users[user.id] = {
            user: user,
            conn: connection
        };
        utils.log('user', ('User (' + user.id + ', ' + user.name + ') created').info);
        return user;
    }
    return null;
}

function remove(user) {
    if (users[user.id]) {
        delete users[user.id];
        userIdRecyclyBin.push(user.id);
        utils.log('user', ('User (' + user.id + ', ' + user.name + ') removed').info);
    }
}

function broadcast(message, ignore) {
    for (var id in users) {
        if (ignore && id == ignore.id) {
            continue;
        }
        users[id].conn.send(message);
    }
}

function reset() {
    for (var id in users) {
        users[id].conn.close();
        delete users[id];
    }
}

module.exports = {
    isValidName: isValidName,
    create: create,
    remove: remove,
    broadcast: broadcast,
    reset: reset
};
