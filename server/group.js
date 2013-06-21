var utils  = require('./util.js');

var groups            = new Array();
var groupIdRecyclyBin = new Array();
var nextGroupId       = 0;

function getNextGroupId() {
    if (groupIdRecyclyBin.length > 0) {
        return groupIdRecyclyBin.shift();
    } else {
        return nextGroupId++;
    }
}

function exists(name) {
    for (var id in groups) {
        if (name == groups[id].name) {
            return groups[id];
        }
    }
    return null;
}

function create(name) {
    var group = exists(name);
    if (!group) {
        group = new Object();
        group.id = getNextGroupId();
        group.name = name;
        group.users = new Array();
        groups[group.id] = group;
        utils.log('group', ('New group #' + group.name + ' created').info);
    }
    return group;
}

function remove(group) {
    if (groups[group.id]) {
        delete groups[group.id];
        groupIdRecyclyBin.push(group.id);
    }
}

function join(name, user) {
    var group = create(name);
    group.users.push(user);
    utils.log('group', ('User (' + user.id + ', ' + user.name + ') joined group #' + group.name).info);
    return group;
}

function leave(name, user) {
    var group = exists(name);
    if (group) {
        for (var i = 0; i < group.users.length; i++) {
            if (user.name == group.users[i].name) {
                group.users.splice(i, 1);
                utils.log('group', ('Removed user (' + user.id + ', ' + user.name + ') from group #' + group.name).info);
                break;
            }
        }
        if (group.users.length == 0) {
            remove(group);
            utils.log('group', ('Empty group #' + group.name + ' removed').info);
        }
        return true;
    }
    return false;
}

function reset() {
    for (var id in groups) {
        delete groups[id];
    }
}

module.exports = {
    join: join,
    leave: leave,
    reset: reset
};
