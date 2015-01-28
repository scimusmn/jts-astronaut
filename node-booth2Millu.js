//SETUP NODE
var dgram, osc, outport_millumin, outport_nametag, udp;
osc = require('osc-min');
dgram = require("dgram");

udp = dgram.createSocket("udp4");

outport_millumin = 7770;

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

    if (val!=0&&!val) val = 'NA';

    var buf = osc.toBuffer({
        address: oscAddress,
        args: [val]
    });

    console.log('sending OSC message:', oscAddress, val);
    return udp.send(buf, 0, buf.length, outport_millumin, "localhost");

}

// initMillumin();

setInterval(function(){

    //To set Position Y Timeline:
    // Use 3 floating point values (to set the in point, current value and out point). 0.0 is the start of the clip. 1.0 is the end.
    // /layer2/video/positiony/values, (Float 0.0 - 1.0) range (-16384.0 - 16384.0)

    //To set Timeline speed:
    // /layer2/video/positiony/speed, (Float 0.0 - 1.0) range (0.0 - 10.0)

    // if (Math.random() < .5) {
    //     toOSC('/layer2/video/positiony/direction', 0); //Lower mask
    // } else {
    //     toOSC('/layer2/video/positiony/direction', 1); //Raise mask
    // }

    if ((Math.random() < .5)){
        console.log('CATS, lyr 2');
        toOSC('/layer1/bypassed', 1);
        toOSC('/layer2/bypassed', 0);
    } else {
        console.log('SPACE, lyr 1');
        toOSC('/layer1/bypassed', 0);
        toOSC('/layer2/bypassed', 1);
    }

}, 3500);


