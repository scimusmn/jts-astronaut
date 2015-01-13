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
        var cleanName = scrapeProfanities(data.nameString);
        sendName(cleanName);
        sendVideoURL(data.videoURL);

        //TODO - tell Millumin to show booth layer

        //Report the schedule for playback
        var startDelay = 15;
        var finishDelay = 25;
        socket.emit('report-playback-schedule', { videoURL: data.videoURL, startDelay: startDelay, finishDelay: finishDelay });

    });

});

function scrapeProfanities(str) {
    str = profanity.purify(str, { replace: 'true', replacementsList: [ 'SCIENCE' ] })[0];
    return str;
}

http.listen(app.get('port'), function(){

    console.log('Listening to Node server..');

});