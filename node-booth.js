var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var profanity = require('profanity-util');

var port_node = 7770;
var port_osc = 7770;

app.set('port', port_node);
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


/* - Resolume Communication - */
/*
var dgram, osc, outport_millumin, outport_nametag, udp;
osc = require('osc-min');
dgram = require("dgram");
udp = dgram.createSocket("udp4");

function initResolume() {

    //TODO:
    //Ensure all video and camera streams are initialized
    //Set any initial settings that the project file doesn't store

};

function raiseMask() {
    toOSC('/layer2/video/positiony/direction', 1);
};

function lowerMask() {
    toOSC('/layer2/video/positiony/direction', 0);
};

function toggleUnderMaskSource(showBooth) {
    if (showBooth){
        toOSC('/layer1/bypassed', 1);
        toOSC('/layer2/bypassed', 0);
    } else {
        toOSC('/layer1/bypassed', 0);
        toOSC('/layer2/bypassed', 1);
    }
};

function toOSC(oscAddress, val) {

    if (val!=0&&!val) val = 'NA';

    var buf = osc.toBuffer({
        address: oscAddress,
        args: [val]
    });

    console.log('sending OSC message:', oscAddress, val);
    return udp.send(buf, 0, buf.length, port_osc, "localhost");

}
*/

