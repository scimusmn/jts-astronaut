var inport, osc, sock, udp;

osc = require('osc-min');
udp = require("dgram");

inport = 7005;

console.log("OSC listener running at http://localhost:" + inport);

sock = udp.createSocket("udp4", function(msg, rinfo) {
  var error;
  try {
    return onMessageReceived(osc.fromBuffer(msg));
  } catch (_error) {
    error = _error;
    return console.log("invalid OSC packet");
  }
});

var onMessageReceived = function(msg){

    if (msg.address == '/nametag'){

        var nameStr = msg.args[0].value;
        var displaySeconds = parseFloat(msg.args[1].value);

        console.log('Display name "'+nameStr+'" for', displaySeconds, 'seconds.');

        //TODO: Begin displaying name

    }else{
        console.log('Unrecognized OSC address:', msg.address);
    }

}

sock.bind(inport);
