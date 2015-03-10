$(document).ready(function(){

    /* Socket.IO */
    var urlSplit = document.URL.split('/');
    var address = '//'+urlSplit[2]; // Same address that served this file. e.g. '//123.456.78:8080'
    var socket = io.connect(address);

    socket.on('handshake', function(data) {
      socket.emit('handshake-response', {clientId: 'nametag'});
    });

    socket.on('new-name', function(data) {
      displayName(""+data.nameString, data.captureLength/data.playbackRate);
    });

    socket.on('error', function() { console.error(arguments) });
    socket.on('message', function() { console.log(arguments) });

    /* Display Name */
    function displayName(nameStr, displayDuration) {

        $("#name").removeClass('fit4').removeClass('fit5');
        $("#name").html(nameStr);

        if (nameStr.length > 9) {
          if (nameStr.length > 12){
            $("#name").addClass('fit5');
          } else {
            $("#name").addClass('fit4');
          }
        }

        $("#name").stop().fadeTo("fast",1);

        setTimeout(function(){

          $("#name").stop().fadeTo("slow",0);

          //After fade out, reload page just to prevent any memory leaks over time.
          setTimeout(function(){
            location.reload();
          }, 2*1000);

        }, Math.ceil(displayDuration*1000));

    }

});