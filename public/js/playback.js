$(document).ready(function(){

    /* Socket.IO */
    var urlSplit = document.URL.split('/');
    var address = '//'+urlSplit[2]; // Same address that served this file. e.g. '//123.456.78:8080'
    var socket = io.connect(address);

    socket.on('handshake', function(data) {
      socket.emit('handshake-response', {clientId: 'playback'});
    });

    socket.on('video-playback', function(data) {
      startVideoPlayback(data.videoURL, data.playbackRate);
    });

    socket.on('error', function() { console.error(arguments) });
    socket.on('message', function() { console.log(arguments) });


    /* Video Playback */
    var videoOut = document.getElementById('playback_video');

    function startVideoPlayback(videoURL, rate) {

        //Start playback
        videoOut.src = videoURL;
        videoOut.play();

        //Slow down playback
        videoOut.playbackRate = rate;

        videoOut.onended = function(e) {
          clearPlaybackVideo(videoURL);
        };

    };

    function clearPlaybackVideo(videoURL) {

        videoOut.src = '';
        URL.revokeObjectURL(videoURL);

    }
});