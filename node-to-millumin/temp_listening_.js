var dgram, osc, outport, udp;
var sock, inport;

osc = require('osc-min');
dgram = require("dgram");

// udp = dgram.createSocket("udp4");

udp = dgram.createSocket("udp4", function(msg, rinfo) {
  var error;
  try {
    // return console.log(osc.fromBuffer(msg));
    var oMsg = osc.fromBuffer(msg);
    if (oMsg.elements[0].address == '/millumin/composition/cue'){

        if (oMsg.elements[0].args[0].value == "mask_loop"){
            restartMaskLoop();
        }

    }
  } catch (_error) {
    error = _error;
    return console.log("invalid OSC packet");
  }
});

if (process.argv[2] != null) {
  outport = parseInt(process.argv[2]);
} else {
  outport = 7000;
}

if (process.argv[2] != null) {
  inport = parseInt(process.argv[2]);
} else {
  inport = 7001;
}

//Listen for messages from Millumin
udp.bind(inport);


console.log("sending OSC messages to http://localhost:" + outport);
console.log("listening for OSC messages at port:" + inport);

launchColumn = function(column) {

  oscMessage('/millumin/action/launchColumn', column);

};

showBoothVideo = function() {

    console.log('->showBoothVideo');

    //show booth stream
    oscMessage('/millumin/action/selectLayerWithName', 'Booth');
    oscMessage('/millumin/layer/opacity/0', 100);

    //hide background loop
    oscMessage('/millumin/action/selectLayerWithName', 'Loop');
    oscMessage('/millumin/layer/opacity/0', 0.1);

    liftMask();

    //timeout delay should be slightly shorter than length of booth videos
    setTimeout(function(){
        lowerMask();
    }, 8000);

};

liftMask = function() {

    console.log('--> liftMask');

    oscMessage('/millumin/action/selectLayerWithName', 'Mask');
    oscMessage('/millumin/layer/media/timeInSeconds/0', 0.1);
    oscMessage('/millumin/action/composition/start');

};

restartMaskLoop = function(){

    console.log('--> restartMaskLoop');

    if(lowering==false){
        oscMessage('/millumin/action/selectLayerWithName', 'Mask');
        oscMessage('/millumin/layer/media/timeInSeconds/0', 4);
        oscMessage('/millumin/action/composition/start');
    }

}
var lowering = false;//temp
lowerMask = function() {

    console.log('--> lowerMask');

    oscMessage('/millumin/action/selectLayerWithName', 'Mask');
    oscMessage('/millumin/layer/media/timeInSeconds/0', 6);
    oscMessage('/millumin/action/composition/start');

    lowering = true;

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

    showBoothVideo();

}, 30000);

