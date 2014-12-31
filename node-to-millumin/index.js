
//VIDEO STATES
var videoState = '';
var BOOTH_VIDEO = 'booth_video';
var MIRROR_MASK = 'mirror_mask';
var BG_LOOP = 'bg_loop';

//SETUP NODE
var dgram, osc, outport, udp;
osc = require('osc-min');
dgram = require("dgram");

udp = dgram.createSocket("udp4");

if (process.argv[2] != null) {
  outport = parseInt(process.argv[2]);
} else {
  outport = 7000;
}

console.log("sending OSC messages to http://localhost:" + outport);

launchColumn = function(column) {

  oscMessage('/millumin/action/launchColumn', column);

};

showBoothVideo = function() {

    console.log('->showBoothVideo');

    videoState = BOOTH_VIDEO;

    //show booth stream
    oscMessage('/millumin/layer/opacity/2', 100.0);

    //hide background loop
    oscMessage('/millumin/layer/opacity/1', 0.01);

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
    oscMessage('/millumin/layer/opacity/2', 0.01);

    //show background loop
    oscMessage('/millumin/layer/opacity/1', 100.0);

    liftMask();

    setTimeout(function(){
        lowerMask();
    }, 15000);

};

liftMask = function() {

    console.log('--> liftMask');

    oscMessage('/millumin/action/selectLayerWithName', 'Mask');
    oscMessage('/millumin/layer/media/timeInSeconds/0', 0.01);
    oscMessage('/millumin/action/composition/start');

};

lowerMask = function() {

    console.log('--> lowerMask');

    oscMessage('/millumin/action/selectLayerWithName', 'Mask');
    oscMessage('/millumin/layer/media/timeInSeconds/0', 595);
    oscMessage('/millumin/action/composition/start');

};

oscMessage = function (oscAddress, val) {

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
    return udp.send(buf, 0, buf.length, outport, "localhost");

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

