var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var fs = require("fs");
var uuid = require('node-uuid');
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

function writeToDisk(dataURL, fileName) {

    var filePath = './public/uploads/' + fileName;

    //Write Blob data into file
    dataURL = dataURL.split(',').pop();
    fileBuffer = new Buffer(dataURL, 'base64');

    //TODO: Should this be asynchronous? Let's see if this stalls UI
    fs.writeFileSync(filePath, fileBuffer);

    console.log('written to disk. filePath', filePath);
}

function deleteFromDisk(fileName) {

    var fullPath = './public/uploads/' + fileName;

    fs.unlink(fullPath, function (err) {
        if (err) throw err;
        console.log('successfully deleted '+fileName);
    });

}

io.sockets.on('connection', function(socket) {

    socket.emit('handshake', { message: '' });

    socket.on('handshake-response', function(data){
        console.log('handshake complete with client: ', data.clientId);
    });

    socket.on('play-visitor', function(data){

        sendName(data);
        sendVideo(data);

    });

    socket.on('create-video-file', function (data) {

        console.log('create video!');

        //Generate universally unique identifier for filename
        var fileName = uuid.v4();

        writeToDisk(data.video.dataURL, fileName + '.webm');
        socket.emit('video-file-ready', fileName + '.webm');

    });

    socket.on('delete-video-file', function (data) {

        deleteFromDisk(data.fileName);

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

http.listen(app.get('port'), function(){

    console.log('Listening to Node server..');

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


