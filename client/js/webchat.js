// Should only be used during development
window.onerror = function(msg, url, lineno) {
    alert(url + '(' + lineno + '): ' + msg);
}

$(document).ready(function() {
    var client       = null;
    // Error elements
    var errorDiv     = $('#error');
    var errorField   = $('#error span');
    // Login elements
    var loginDiv     = $('#login');
    var nameField    = $('#name');
    var colorField   = $('#color');
    var loginBtn     = $('#connect');
    // Chat elements
    var chatDiv      = $('#chat');
    var messageField = $('#message');
    var sendBtn      = $('#send');

    // Put the initial focus on the name field..
    nameField.focus();
    // ..and initialize a random color in the color field
    colorField.attr('value', getRandomColor());

    // Login button should be disabled..
    // ..unless the name field contains at least 3 characters
    nameField.keyup(function(event) {
        if (nameField.val().length >= 3) {
            loginBtn.attr('disabled', false);
            if (event.keyCode == 13) {
                loginBtn.click();
            }
        } else {
            loginBtn.attr('disabled', true);
        }
    });

    // Login after button click
    loginBtn.click(function() {
        var name = nameField.val();
        var color = colorField.val();
        if (name != '' && color != '') {
            login(name, color);
        }
    });

    // Display tab on click event
    // $('#grouplist a').click() does not work for some unknown reason
    $(document).on('click', '#grouplist a', function(event) {
        event.preventDefault();
        $(this).tab('show');
    });

    // Send button should be disabled..
    // ..unless the message field contains at least single character
    messageField.keyup(function(event) {
        if (messageField.val().length > 0) {
            sendBtn.attr('disabled', false);
            if (event.keyCode == 13) {
                sendBtn.click();
            }
        } else {
            sendBtn.attr('disabled', true);
        }
    });

    // Send message on button click
    sendBtn.click(function() {
        var message = messageField.val();
        if (message != '') {
            if (message.indexOf('/') == 0) {
                var command = message.substring(1, message.length);
                client.send('command', getActiveGroup(), command);
            } else {
                client.send('message', getActiveGroup(), message);
            }
            messageField.val('');
        }
        sendBtn.attr('disabled', true);
    });

    // Prevent disconnect on page refresh. Give the user an option.
    $(this).keydown(function(event) {
        if (event.keyCode == 116) {
            if (chatDiv.is(':visible')) {
                var result = window.confirm(
                    'Refreshing the page will disconnect you from the chat. ' +
                    'Do you want to continue?'
                );
                if (result == false) {
                    event.preventDefault();
                }
            }
        }
    });

    function login(name, color) {
        if (client == null) {
            client = new Client();

            client.onConnect = function() {
                client.authenticate(name, color);
            };

            client.onError = showError;
            client.onAuthentication = enableChat;
            client.onDisconnect = disableChat;
            client.onJoinGroup = addGroup;
            client.onLeaveGroup = removeGroup;
            client.onConnectedUser = addConnectedUser;
            client.onDisconnectedUser = removeDisconnectedUser;
            client.onMessage = addMessage;

            client.connect('82.73.191.160', 1337);
        } else if (client.connected == false) {
            client.connect('82.73.191.160', 1337);
        } else {
            client.login(name, color);
        }
    }

    function showError(time, message) {
        errorField.text(message);
        errorDiv.show();
    }

    function enableChat() {
        loginDiv.hide();
        chatDiv.show();
        messageField.focus();
    }

    function disableChat() {
        loginDiv.show();
        chatDiv.hide();
        nameField.focus();
        showError('Disconnected from the server');
    }

    function addGroup(time, name, users) {
        $('#groups').append('<div id=\'' + name + '\' class=\'tab-pane\'><div class=\'row-fluid\'><div class=\'span10\'><div class=\'messagebox\'></div></div><div class=\'span2\'><ul class=\'userlist unstyled\'></ul></div></div></div>');
        $('#grouplist').append('<li><a data-target=\'#' + name + '\'>' + name + '</a></li>');
        $('#grouplist a:last').tab('show');
        for (i in users) {
            addUser(time, name, users[i].name, users[i].color);
        }
    }

    function removeGroup(time, name) {
        $('#groups #' + name).remove();
        $('#grouplist li:has(a[data-target=\'#' + name + '\'])').remove();
        $('#grouplist a:first').tab('show');
    }

    function addConnectedUser(time, group, name, color) {
        addMessage(time, group, name, color, '<span class=\'message\'><span style=\'color: ' + color + ';\'>' + name + '</span> connected</span>');
        addUser(time, group, name, color);
    }

    function removeDisconnectedUser(time, group, name, color) {
        addMessage(time, group, name, color, '<span class=\'message\'><span style=\'color: ' + color + ';\'>' + name + '</span> disconnected</span>');
        removeUser(time, group, name, color);
    }

    function addUser(time, group, name, color) {
        $('#groups #' + group + ' .userlist').append('<li style=\'color:' + color + ';\'>' + name + '</li>');
    }

    function removeUser(time, group, name, color) {
        $('#groups #' + group + ' .userlist li').filter(function() { return $.text([this]) === name; }).remove();
    }

    function addMessage(time, group, name, color, message) {
        $('#groups #' + group + ' .messagebox').append('<p><span class=\'time\'>' + time + '</span><span class=\'user\' style=\'color:' + color + ';\'>' + name + ':</span><span class=\'message\'>' + message + '</span></p>');
        $('#groups #' + group + ' .messagebox').scrollTop($('#groups #' + group + ' .messagebox')[0].scrollHeight);
        messageField.focus();
    }

    function getRandomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    function getActiveGroup() {
        return $('#grouplist li.active a')[0].text;
    }
});
