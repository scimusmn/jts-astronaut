var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

app.set('port', 7770);
app.use(express.static(path.join(__dirname, 'public')));

//Serve client-side files
app.get('/booth', function (request, response){
    response.sendFile(__dirname + '/index-booth.html');
});
app.get('/name-tag', function (request, response){
    response.sendFile(__dirname + '/index-name-tag.html');
});
app.get('/playback', function (request, response){
    response.sendFile(__dirname + '/index-playback.html');
});


// Send user's name to all connected clients
function sendName(nameStr) {
    console.log("sendName:", nameStr);
    io.sockets.emit('new-name', { name: nameStr, duration:7});
}

// Send video url to all connected clients
function sendVideoURL(videoURL) {
    console.log("sendVideoURL:", videoURL);
    io.sockets.emit('video-playback', { videoURL: videoURL});
}

io.sockets.on('connection', function(socket) {

    socket.emit('handshake', { message: '' });

    socket.on('handshake-response', function(data){
        console.log('handshake complete with client: ', data.clientId);
    });

    socket.on('play-visitor-video', function(data){

        console.log('play-visitor-video: ', data);
        sendName(data.nameString);
        sendVideoURL(data.videoURL);

        //TODO - tell Millumin to show booth layer

    });

});

http.listen(app.get('port'), function(){

    console.log('Listening to Node server..');

});