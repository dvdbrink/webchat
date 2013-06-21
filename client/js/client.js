var Client = (function() {
    function Client() {
        this.socket             = null;
        // Flags
        this.connected          = false;
        this.authenticated      = false;
        // Event callbacks
        this.onError            = null;
        this.onConnect          = null;
        this.onDisconnect       = null;
        this.onAuthentication   = null;
        this.onJoinGroup        = null;
        this.onLeaveGroup       = null;
        this.onMessage          = null;
        this.onConnectedUser    = null;
        this.onDisconnectedUser = null;
    }

    Client.prototype.connect = function(ip, port) {
        this.socket = new WebSocket('ws://' + ip + ':' + port);

        var that = this;

        this.socket.onerror = function(event) {
            throw event.data;
        };

        this.socket.onopen = function(event) {
            that.connected = true;
            if (that.onConnect) {
                that.onConnect();
            }
        };

        this.socket.onclose = function(event) {
            if (that.connected == true) {
                that.connected = false;
                if (that.onDisconnect) {
                    that.onDisconnect();
                }
            } else {
                if (this.onError) {
                    this.onError('Unable to connect to server on ' + ip + ':' + port);
                }
            }
        };

        this.socket.onmessage = function(event) {
            var data = null;
            try {
                console.log('Packet: %s', event.data);
                data = JSON.parse(event.data);
            } catch(error) {
                if (this.onError) {
                    this.onError(error);
                }
            }
            if (data) {
                that.handleObject(data);
            }
        };
    };

    Client.prototype.disconnect = function() {
        if (this.connected == true) {
            this.socket.close();
            this.connected = false;
            this.authenticated = false;
        } else {
            throw 'Unable to disconnect. Not connected';
        }
    };

    Client.prototype.authenticate = function(name, color) {
        if (this.connected == true) {
            this.name  = name;
            this.color = color;
            this.socket.send(JSON.stringify({
                type:  'auth',
                name:  this.name,
                color: this.color
            }));
        } else {
            throw 'Unable to login. Not connected';
        }
    };

    Client.prototype.send = function(type, group, data) {
        if (this.connected && this.authenticated) {
            this.socket.send(JSON.stringify({
                type:  type,
                group: group,
                data:  data
            }));
        } else {
            throw 'Unable to send data. (connected: ' + this.connected + ', authenticated: ' + this.authenticated + ')';
        }
    };

    Client.prototype.handleObject = function(message) {
        console.log(message.type);
        switch (message.type) {
        case 'error':
            this.handleError(message);
            break;
        case 'auth':
            this.handleAuth(message);
            break;
        case 'join':
            this.handleJoinGroup(message);
            break;
        case 'leave':
            this.handleLeaveGroup(message);
            break;
        case 'connecteduser':
            this.handleConnectedUser(message);
            break;
        case 'disconnecteduser':
            this.handleDisconnectedUser(message);
            break;
        case 'message':
            this.handleMessage(message);
            break;
        default:
            throw 'Unknown message type (' + message.type + ' )';
        }
    };

    Client.prototype.handleError = function(data) {
        if (this.onError) {
            this.onError(data.time, data.msg);
        }
    };

    Client.prototype.handleAuth = function(data) {
        this.authenticated = true;
        if (this.onAuthentication) {
            this.onAuthentication(data.time, data.name, data.color);
        }
    };

    Client.prototype.handleJoinGroup = function(data) {
        if (this.onJoinGroup) {
            this.onJoinGroup(data.time, data.name, data.users);
        }
    };

    Client.prototype.handleLeaveGroup = function(data) {
        if (this.onLeaveGroup) {
            this.onLeaveGroup(data.time, data.name);
        }
    };

    Client.prototype.handleConnectedUser = function(data) {
        if (this.onConnectedUser) {
            this.onConnectedUser(data.time, data.group, data.name, data.color);
        }
    };

    Client.prototype.handleDisconnectedUser = function(data) {
        if (this.onDisconnectedUser) {
            this.onDisconnectedUser(data.time, data.group, data.name, data.color);
        }
    };

    Client.prototype.handleMessage = function(data) {
        if (this.onMessage) {
            this.onMessage(data.time, data.group, data.name, data.color, data.msg);
        }
    };

    return Client;
})();
