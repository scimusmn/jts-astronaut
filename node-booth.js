// Load the HTTPS module
// We require HTTPS so that we can save the camera settings
var https = require('https');

// Load Self Signed certificate
var fs = require('fs');
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Init app with the Express framework
var express = require('express');
var app = express();

// Load a HTTPS server at port 7771
var node_port = 7771;
var httpsServer = https.createServer(options, app);
httpsServer.listen(node_port);

// Setup socket.io communication for sending messages
// between the display devices
var socket = require('socket.io');
var io = socket.listen(httpsServer, {
    "log level" : 3,
    "match origin protocol" : true,
});

var profanity = require('profanity-util');

var port_osc = 7770;

app.set('port', node_port);

var path = require('path');
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


function sendName(data) {

    // check that string is not empty or full of spaces
    if (/\S/.test(data.nameString)) {
        data.nameString = profanity.purify(data.nameString, { replace: 'true', replacementsList: [ 'SCIENCE' ] })[0];
    } else {
        data.nameString = "I<3SPACE!";
    }

    io.sockets.emit('new-name', data);

}

function sendVideo(data) {

    io.sockets.emit('video-playback', data);

}

io.sockets.on('connection', function(socket) {

    console.log('Before handshake');
    socket.emit('handshake', { message: '' });

    socket.on('handshake-response', function(data){
        console.log('handshake complete with client: ', data.clientId);
    });

    socket.on('play-visitor-video', function(data){

        sendName(data);
        sendVideo(data);

    });

    socket.on('resolume-control', function(data){

        switch(data.control) {
            case 'raise':
                raiseMask();
                break;
            case 'lower':
                lowerMask();
                break;
            case 'toggle-booth':
                toggleUnderMaskSource(true);
                break;
            case 'toggle-loop':
                toggleUnderMaskSource(false);
                break;
        }

    });

});

/**
* Resolume OSC Communication
*/
var dgram, osc, udp, maskRising;
osc = require('osc-min');
dgram = require("dgram");
udp = dgram.createSocket("udp4");
maskRising = false;

initResolume();

function initResolume() {

    //Ensure all video and camera streams are initialized
    //Set any initial settings that the project file doesn't store
    toOSC('/layer1/clip1/connect', 1);
    toOSC('/layer2/clip1/connect', 1);
    toOSC('/layer3/clip1/connect', 1);

    toggleUnderMaskSource(false);
    raiseMask();

};

function raiseMask() {
    if(maskRising == false) {
        toOSC('/layer3/video/positiony/direction', 0);
        maskRising = true;
    }
};
function lowerMask() {
    if(maskRising == true) {
        toOSC('/layer3/video/positiony/direction', 1);
        maskRising = false;
    }
};

function toggleUnderMaskSource(showBooth) {

    if (!showBooth){
        toOSC('/layer1/clip1/connect', 1);
        toOSC('/layer2/bypassed', 1);
    } else {
        toOSC('/layer1/clip2/connect', 1);
        toOSC('/layer2/bypassed', 0);
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


