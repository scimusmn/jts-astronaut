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
    response.sendFile(__dirname + '/booth.html');
});
app.get('/name-tag', function (request, response){
    response.sendFile(__dirname + '/name-tag.html');
});
app.get('/playback', function (request, response){
    response.sendFile(__dirname + '/playback.html');
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

    logMessage('writeToDisk() Attempting: ' + fileName);

    var filePath = './public/uploads/' + fileName;

    //Write Blob data into file
    dataURL = dataURL.split(',').pop();
    fileBuffer = new Buffer(dataURL, 'base64');

    //TODO: Should this be asynchronous? Let's see if this stalls UI
    fs.writeFileSync(filePath, fileBuffer);

    logMessage('writeToDisk() Completed: '+ filePath);
}

function deleteFromDisk(fileName) {

    logMessage('deleteFromDisk() Attempting: '+fileName);

    var fullPath = './public/uploads/' + fileName;

    fs.unlink(fullPath, function (err) {
        // if (err) throw err;
        if (err){
            logMessage('deleteFromDisk() ERROR! Could not delete video '+fileName+',  '+err);
        }else{
            logMessage('deleteFromDisk() Success: '+fileName);
        }

    });

}

io.sockets.on('connection', function(socket) {

    socket.emit('handshake', { message: '' });

    socket.on('handshake-response', function(data){
        logMessage('Handshake complete with client: ' + data.clientId);
    });

    socket.on('log-message', function(data){
        logMessage(data.message);
    });

    socket.on('play-visitor', function(data){

        sendName(data);
        sendVideo(data);

    });

    socket.on('create-video-file', function (data) {

        logMessage("socket.on('create-video-file')");

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
            case 'fade-out':
                fadeOutComp();
                break;
            case 'fade-in':
                fadeInComp();
                break;
            case 'toggle-visor':
                toggleLayers([4,5], [1,2,3]);
                break;
            case 'toggle-booth':
                toggleLayers([2,3], [1,4,5]);
                break;
            case 'toggle-loop':
                toggleLayers([1], [2,3,4,5]);
                break;
        }

    });

});

http.listen(app.get('port'), function(){

    logMessage('Listening to Node server..');

});


/**
* Resolume OSC Communication
*/
var dgram, osc, udp, maskRising, compFadingOut;
osc = require('osc-min');
dgram = require("dgram");
udp = dgram.createSocket("udp4");
maskRising = false;
compFadingOut = false;

initResolume();

function initResolume() {

    //Ensure all video and camera streams are initialized
    //Set any initial settings that the project file doesn't store
    toOSC('/layer1/clip1/connect', 1);
    toOSC('/layer2/clip1/connect', 1);
    toOSC('/layer3/clip1/connect', 1);
    toOSC('/layer4/clip1/connect', 1);
    toOSC('/layer5/clip1/connect', 1);

    //Start with visor down
    lowerMask();
    toggleLayers([4,5], [1,2,3]);
    fadeInComp();

};

function raiseMask() {
    if(maskRising == false) {
        toOSC('/layer5/video/positiony/direction', 0);
        maskRising = true;
    }
};
function lowerMask() {
    if(maskRising == true) {
        toOSC('/layer5/video/positiony/direction', 1);
        maskRising = false;
    }
};
function fadeOutComp(){
    if(compFadingOut == false) {
        toOSC('/composition/video/fadeout/direction', 0);
        toOSC('/composition/video/scale/direction', 0); //optional scale down
        compFadingOut = true;
    }
}
function fadeInComp(){
    if(compFadingOut == true) {
        toOSC('/composition/video/fadeout/direction', 1);
        toOSC('/composition/video/scale/direction', 1); //optional scale up
        compFadingOut = false;
    }
}
function deckColumn(colNum) {
    toOSC('/track'+colNum+'/connect', 1);
};
function toggleLayers(shows, hides) {

    //show these layers
    for (var i = 0; i < shows.length; i++) {
        toOSC('/layer'+shows[i]+'/bypassed', 0);
    };
    //hide these layers
    for (var i = 0; i < hides.length; i++) {
        toOSC('/layer'+hides[i]+'/bypassed', 1);
    };

};

function toOSC(oscAddress, val) {

    if (val!=0&&!val) val = 'NA';

    var buf = osc.toBuffer({
        address: oscAddress,
        args: [val]
    });

    return udp.send(buf, 0, buf.length, port_osc, "localhost");

}

/**
* Logging - starts new log every hour
*/
var opts = {
    logDirectory:__dirname +'/logs',
    fileNamePattern:'roll-<DATE>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

function logMessage(message){
    log.info(message);
    console.log(message);
}

