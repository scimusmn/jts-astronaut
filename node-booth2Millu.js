//SETUP NODE
var dgram, osc, outport_millumin, outport_nametag, udp;
osc = require('osc-min');
dgram = require("dgram");

udp = dgram.createSocket("udp4");

outport_millumin = 7000;

console.log("sending Millumin OSC messages to http://localhost:" + outport_millumin);

function initMillumin() {

    //Ensure all video and camera streams are initialized
    toOSC('/millumin/action/launchColumn', 1);

};

function showBoothVideo() {

    console.log('--> showBoothVideo');
    toOSC('/millumin/layer/opacity/2', 100.0); //show booth stream
    toOSC('/millumin/layer/opacity/1', 0.01); //hide background loop

    liftMask();

    //timeout should be slightly faster than booth video
    setTimeout(function(){
        lowerMask();
    }, 10000);

};

function showBackgroundLoop() {

    console.log('--> showBackgroundLoop');
    toOSC('/millumin/layer/opacity/2', 0.01); //hide booth stream
    toOSC('/millumin/layer/opacity/1', 100.0); //show background loop

    liftMask();

    setTimeout(function(){
        lowerMask();
    }, 15000);

};

function liftMask() {

    console.log('--> liftMask');
    toOSC('/millumin/action/selectLayerWithName', 'Mask');
    toOSC('/millumin/layer/media/timeInSeconds/0', 0.01);
    toOSC('/millumin/action/composition/start');

};

function lowerMask() {

    console.log('--> lowerMask');
    toOSC('/millumin/action/selectLayerWithName', 'Mask');
    toOSC('/millumin/layer/media/timeInSeconds/0', 595);
    toOSC('/millumin/action/composition/start');

};

function toOSC(oscAddress, val) {

    if (!val) val = 'NA';

    var buf = osc.toBuffer({
        address: oscAddress,
        args: [val]
    });

    console.log('sending OSC message:', oscAddress, val);
    return udp.send(buf, 0, buf.length, outport_millumin, "localhost");

}

initMillumin();

setInterval(function(){

    if (Math.random()<.5) {
        showBackgroundLoop();
    } else {
        showBoothVideo();
    }

}, 30000);


