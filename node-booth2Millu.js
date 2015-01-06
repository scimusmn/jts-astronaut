
//VIDEO STATES
var videoState = '';
var BOOTH_VIDEO = 'booth_video';
var MIRROR_MASK = 'mirror_mask';
var BG_LOOP = 'bg_loop';

//SETUP NODE
var dgram, osc, outport_millumin, outport_nametag, udp;
osc = require('osc-min');
dgram = require("dgram");

udp = dgram.createSocket("udp4");

outport_millumin = 7000;
outport_nametag = 7005;

console.log("sending Millumin OSC messages to http://localhost:" + outport_millumin);
console.log("sending nametag OSC messages to http://localhost:" + outport_nametag);

launchColumn = function(column) {

  sendOSC('/millumin/action/launchColumn', column);

};

showBoothVideo = function() {

    console.log('->showBoothVideo');

    videoState = BOOTH_VIDEO;

    //show booth stream
    sendOSC('/millumin/layer/opacity/2', 100.0);

    //hide background loop
    sendOSC('/millumin/layer/opacity/1', 0.01);

    liftMask();

    //timeout delay should be slightly shorter than length of booth videos
    setTimeout(function(){
        lowerMask();
    }, 10000);

};

showBackgroundLoop = function() {

    console.log('->showBackgroundLoop');

    videoState = BG_LOOP;

    //hide booth stream
    sendOSC('/millumin/layer/opacity/2', 0.01);

    //show background loop
    sendOSC('/millumin/layer/opacity/1', 100.0);

    liftMask();

    setTimeout(function(){
        lowerMask();
    }, 15000);

};

liftMask = function() {

    console.log('--> liftMask');

    sendOSC('/millumin/action/selectLayerWithName', 'Mask');
    sendOSC('/millumin/layer/media/timeInSeconds/0', 0.01);
    sendOSC('/millumin/action/composition/start');

};

lowerMask = function() {

    console.log('--> lowerMask');

    sendOSC('/millumin/action/selectLayerWithName', 'Mask');
    sendOSC('/millumin/layer/media/timeInSeconds/0', 595);
    sendOSC('/millumin/action/composition/start');

};

toMillumin = function (oscAddress, val) {

    var buf;

    if(val){
        buf = osc.toBuffer({
            address: oscAddress,
            args: [val]
        });
    } else {
        buf = osc.toBuffer({
            address: oscAddress,
            args: []
        });
    }

    console.log('sending OSC message:', oscAddress, val);

    return udp.send(buf, 0, buf.length, outport_millumin, "localhost");

}

//ensure all video and streams are initialized
launchColumn(1);

setInterval(function(){

    if (videoState == BOOTH_VIDEO) {
        showBackgroundLoop();
    } else {
        showBoothVideo();
    }

}, 30000);

setInterval(function(){

    var nameTxt = 'Tragvar the annihilator';
    var displaySeconds = 7.5;

    var buf;
    buf = osc.toBuffer({
        address: "/nametag",
        args: [
            nameTxt,
            displaySeconds
        ]
    });

    udp.send(buf, 0, buf.length, outport_nametag, "localhost");

}, 5000);

