var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var profanity = require('profanity-util');

app.set('port', 7770);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

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
    io.sockets.emit('new-name', { name: nameStr, duration:15});
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

        //Calculate schedule for playback
        var startDelay = 15;
        var finishDelay = 25;

        var cleanName = profanity.purify(data.nameString, { replace: 'true', replacementsList: [ 'SCIENCE' ] })[0];
        sendName(cleanName);
        sendVideoURL(data.videoURL);

        //TODO - tell Millumin to show booth layer

        //Report playback schedule
        socket.emit('report-playback-schedule', { videoURL: data.videoURL, startDelay: startDelay, finishDelay: finishDelay });

    });

});

http.listen(app.get('port'), function(){

    console.log('Listening to Node server..');

});