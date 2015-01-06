var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index-name-tag.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Send current time to all connected clients
function sendName() {
    var rName = Math.random().toString(36).substring(7);
    console.log("sendName:", rName);
    io.sockets.emit('new-name', { name: rName });
}

// Send current time every 10 secs
setInterval(sendName, 10000);

// Emit welcome message on connection
io.sockets.on('connection', function(socket) {
    socket.emit('handshake', { message: '' });

    socket.on('handshake-response', function(data){
        console.log('handshake complete with client: ', data.clientId);
    });

});

app.listen(7770);