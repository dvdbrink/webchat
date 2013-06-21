var colors = require('colors');

colors.setTheme({
    info:  'blue',
    data:  'grey',
    warn:  'yellow',
    debug: 'green',
    error: 'red',
    cat:   'magenta'
});

var padTwo = function (number) {
    return (number < 10 ? '0' : '') + number
}

var time = function () {
    var date = new Date();
    var time = padTwo(date.getHours()) + ':' + padTwo(date.getMinutes()) + ':' + padTwo(date.getSeconds());
    return time;
}

var log = function (category, message) {
    var lines = message.split('\n');
    var timestamp = (time() + spaces(1)).data;
    var header = (category + spaces(6 - category.length + 1)).cat;
    if (message && lines.length > 0) {
        console.log(timestamp + header + lines[0].bold);
        for (var i = 1; i < lines.length; i++) {
            // prepend nine spaces for alignment
            console.log(spaces(9 + 7) + lines[i].bold);
        }
    } else {
        console.log(timestamp + 'No log message provided'.warn.bold);
    }
}

var spaces = function (length) {
    var spaces = '';
    for (var i = 0; i < length; i++) {
        spaces = spaces + ' ';
    }
    return spaces;
}

var createServer = function (port) {
    var http = require('http').createServer(function(request, response) {});
    http.listen(port, function() {});

    var WebSocketServer = require('websocket').server;
    var wss = new WebSocketServer({
        httpServer: http
    });
      
    log('server', ('Listening for connections on ' + port).info);

    return wss;
}

module.exports = {
    time: time,
    log: log,
    createServer: createServer
};
