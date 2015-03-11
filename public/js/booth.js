
$(document).ready(function(){

    /* Socket.IO */
    var urlSplit = document.URL.split('/');
    var address = '//'+urlSplit[2]; // Same address that served this file. e.g. '//123.456.78:8080'
    var socket = io.connect(address);

    //Incoming messages...
    socket.on('handshake', function(data) {
      socket.emit('handshake-response', {clientId: 'booth'});
    });

    socket.on('video-file-ready', function(fileName) {
      onVideoFileReady(fileName);
    });

    socket.on('error', function() { console.error(arguments) });
    socket.on('message', function() { console.log(arguments) });

    //Outgoing messages...
    function exportVisitor() {

        console.log('exportVisitor');
        socket.emit('play-visitor', {nameString: visitorQueue[0].nameString, videoURL: visitorQueue[0].videoURL, captureLength:captureLength, playbackRate:playbackRate });

    }

    function deleteVideoFile(fileName){
        socket.emit('delete-video-file', {fileName:fileName});
    }

    function resolumeControl(controlStr){
        socket.emit('resolume-control', {control: controlStr});
    }


    /* ----- */
    /* Video */
    /* ----- */

    var recordVideo = $('#record-video')[0];
    var video = $('#intake_video')[0];
    var camSelector = $('#camSource_booth')[0];

    var cameraStream;
    var recorder;
    var countdownCount;
    var countdownTimer;

    var visorTransition = 2; //Time visor requires to raise or lower
    var minWaitTime = 12; // Time guaranteed to visitor prepare after submission.
    var playbackRate = 1;
    var captureLength = 15;
    var reloadTimeoutDelay = 60*2;
    var captureWidth = 640;
    var captureHeight = 480;
    var captureOptions = {
                            type: 'video',
                            video: video,
                            canvas: {
                                width: captureWidth,
                                height: captureHeight
                            }
                        };

    var visitorQueue = [];
    var recordedVideoPath = '';
    var recordedFileName = '';
    var recordLockout = false;
    var nameIsSubmitted = false;
    var reloadTimeout = {};
    var nameEntryTimeout = {};
    var videoCreationTimeout = {};

    $("#feed-overlay").click( onRecordClicked );
    $("#btn_submitname").click( nameSubmitted );

    $("#nameinput").keyup(function (e) {
    if (e.keyCode == 13) { //capture return key
      nameSubmitted();
    }
    });
    $(".dev-panel button").click( function(){
      resolumeControl( $(this).attr('id') );
    });

    //Get camera sources
    MediaStreamTrack.getSources(listcamSources);
    camSelector.onchange = resetCamera;

    function listcamSources(sourceInfos) {

        for (var i = 0; i != sourceInfos.length; ++i) {
          var sourceInfo = sourceInfos[i];
          var option = document.createElement("option");
          option.value = sourceInfo.id;

          if (sourceInfo.kind === 'video') {

            option.text = sourceInfo.label || 'camera ' + (camSelector.length + 1);
            camSelector.appendChild(option);

          }

        }

    }

    function initCamera(){

        var cameraSource = camSelector.value;
        var videoConstraints = {
                              audio: false,
                              video: {
                                mandatory: { },
                                optional: [{sourceId: cameraSource}]
                              }
                            };

        navigator.getUserMedia(videoConstraints, function(stream) {

          video.src = URL.createObjectURL(stream);
          video.onloadedmetadata = function() {

            cameraStream = stream;
            video.width = captureWidth;
            video.height = captureHeight;
            recorder = window.RecordRTC(stream, captureOptions);

          };

        }, function() {

          // alert('Camera access denied.');

        });

    }

    function resetCamera() {
        if (cameraStream) {
          cameraStream.stop();
          cameraStream = null;
        }
    }

    function startVidRecording() {

        if (!cameraStream) {
          initCamera();
        } else {
          startTimedRecording();
        }

        //Update buttons
        recordVideo.disabled = true;

    }

    function startTimedRecording() {

        countdownCount = captureLength;
        recorder.startRecording();

        countdownTimer = setInterval( function() {

          countdownCount--;
          if (countdownCount == 0) {
            clearInterval(countdownTimer);
            stopVidRecording();
          }

        }, 1000);

    }

    function stopVidRecording() {

        if (recorder){

            //Before attempting to create video file. Start timeout timer.
            //If waiting longer than 5 seconds, assume there was a video write error, and hard refresh entire page.
            videoCreationTimeout = setTimeout(function() {

              location.reload();

            }, 5*1000);

            recorder.stopRecording(function(url) {

                recorder.getDataURL(function(videoDataURL) {

                    var data = {
                        video: {
                            type: recorder.getBlob().type || 'video/webm',
                            dataURL: videoDataURL
                        }
                    };

                    console.log("create-video-file", videoDataURL);
                    socket.emit('create-video-file', data);

                    //Wait to hear back from node that file was successfully created...

                });

            });

        }

        //Update buttons
        recordVideo.disabled = false;

    };

    function onVideoFileReady(fileName){

        clearTimeout(videoCreationTimeout);

        //Base url
        var href = location.href.replace( location.href.split('/').pop(), '' );
        href = href.replace( href.split('/')[3], '' );
        href = href.slice(0, - 1);
        href = href + '/uploads/' + fileName;

        console.log('onVideoFileReady() : ' + href);

        recordedVideoPath = href;
        recordedFileName = fileName;
        closeRecordButtonTween();
        askForName();

    }


    /* ------------- */
    /* --- QUEUE --- */
    /* ------------- */

    var delay_visor = visorTransition; //Should match duration of visor transition
    var delay_fade = 0.9; //Time to fade in/out comp
    var delay_playback = (captureLength/playbackRate) - (delay_fade*2);
    var delay_totalSequence = delay_visor+delay_playback+(delay_fade*4); //Total of visor open/close sequence
    var cur_source = 'visor';

    function newVisitor(nameEntered, recordedURL, recordedFilename){

        var now = new Date();
        visitorQueue.push({nameString:nameEntered, videoURL:recordedURL, fileName:recordedFilename, timestamp:now });

        if (visitorQueue.length == 1) {
          cueVisitorSequence(minWaitTime);
        }

        clearReload();

    }

    function cueVisitorSequence(delay_begin){

        if (cur_source != 'visor') {
          vidSource('visor');
        }

        setTimeout(function(){
          resolumeControl('raise');
          setTimeout(function() {
            vidSource('booth');
            setTimeout(function() {
              exportVisitor();
              setTimeout(function() {
                vidSource('visor');
                setTimeout(function() {
                  resolumeControl('lower');
                  setTimeout(function() {
                    visitorSequenceFinished();
                  }, delay_visor*1000);
                }, delay_fade*1000);
              }, delay_playback*1000);
            }, delay_fade*1000);
          }, delay_visor*1000);
        }, delay_begin*1000);

    }

    function vidSource(src) {
        cur_source = src;
        resolumeControl('fade-out');
        setTimeout(function(){
          resolumeControl('toggle-'+src);
          resolumeControl('fade-in');
        }, delay_fade*1000);
    }

    function visitorSequenceFinished() {

        deleteVideoFile(visitorQueue[0].fileName);
        URL.revokeObjectURL(visitorQueue[0].videoURL);
        visitorQueue.shift();

        console.log('visitorSequenceFinished() Queue length:',visitorQueue.length);

        if (visitorQueue.length > 0){

          cueVisitorSequence( minWaitTime );

        } else {

          resetReload();

        }

    };

    function resetReload() {

        clearReload();

        reloadTimeout = setTimeout(function() {

          if (cur_source == 'visor' && visitorQueue.length == 0){

            //Raise visor with looping video
            resolumeControl('lower');
            resolumeControl('toggle-loop');

            //After sending signal to show screensaver, force refresh the page.
            location.reload();

          } else {
            clearReload();
          }

        }, reloadTimeoutDelay*1000)

    }

    function clearReload() {

        if(reloadTimeout) clearTimeout(reloadTimeout);

        if (cur_source == 'loop'){
          vidSource('visor');
          resolumeControl('lower');
        }

    }


    /* ---------- */
    /* --- UI --- */
    /* ---------- */

    function initUI(){

        TweenLite.set($("#enter-name").parent(), {perspective:1100});
        TweenLite.set($("#enter-name .popup-content"), {transformStyle:"preserve-3d"});
        TweenLite.set($(".back"), {rotationY:-180, rotationZ:180});
        TweenLite.set([$(".back"), $(".front")], {backfaceVisibility:"hidden"});

        $("#enter-name").hide();
        $('img').attr('draggable', false);
        TweenMax.set( $( "#facemask" ), { css: { opacity:0  } } );

    }

    function onRecordClicked(){
        resetReload();
        if (recordLockout==true) return;
        recordLockout = true;
        startRecordButtonTween();
        setTimeout(startVidRecording, 250);
    }

    function startRecordButtonTween() {

        TweenMax.set( $( "#record-video" ), { css: { scale:1  } } );
        TweenMax.to( $( "#record-video" ), 0.5, { css: { scale:0.8 }, delay:0.0, ease:Power2.easeOut });
        TweenMax.to( $( "#facemask" ), 1, { css: { opacity:0.8 }, delay:0.5, ease:Power2.easeOut });

        $('#circle').circleProgress({
          value: 1,
          animation: {  duration: (captureLength*1000)+500,
                        easing: "linear"
                      },
          startAngle: -Math.PI/2,
          size: 220,
          thickness: 40,
          reverse: false,
          fill: {
              gradient: ["#B41418 ", "#B41418"]
          },
          emptyFill: "rgba(240, 240, 240, .3)"
        });

        TweenMax.set( $( "#circle" ), { css: { scale:0.5 } } );
        TweenMax.to( $( "#circle" ), 0.5, { css: { scale:1 }, delay:0.2, ease:Power2.easeOut});

        //Border pulsing
        TweenMax.to( $( "#recording-border" ), 0.75, { css: { borderColor:"#B41418" }, delay:0.5} );
        TweenMax.to($( "#recording-border" ), 0.75, { css: { borderColor:"rgba(240, 240, 240, .5)" }, delay:1.35, repeat:99, yoyo:true, ease:Power1.easeIn});

    }

    function closeRecordButtonTween() {

        TweenMax.to( $( "#count" ), 0.4, { css: { opacity:0 }, delay:0.0, ease:Power2.easeOut});
        TweenMax.to( $( "#record-video" ), 0.5, { css: { scale:1 }, delay:0.1, ease:Power2.easeOut});
        TweenMax.to( $( "#circle" ), 0.5, { css: { scale:0.5 }, delay:0.0, ease:Power2.easeIn});
        TweenMax.to($( "#recording-border" ), 0.5, { css: { borderColor:"rgba(0,0,0,0)" }, ease:Linear.easeNone});

    }

    function askForName() {

        //Show popup
        $( "#nameinput" ).val('');
        $( "#enter-name" ).show();

        //Blur background
        $( "#intake_video" ).addClass('effect-blur');

        TweenMax.to( $( "#facemask" ), 1, { css: { opacity:0 }, ease:Power2.easeOut});
        TweenMax.set( $( "#enter-name" ), { css: { opacity:0  } } );
        TweenMax.set( $( "#enter-name .popup-content" ), { css: { scale:0.7, opacity:0  } } );
        TweenMax.to( [$( "#enter-name" ), $( "#enter-name .popup-content" )], 0.5, { css: { scale:1, opacity:1 }, ease:Power2.easeIn, onComplete:function(){
            $("#nameinput").focus();
        }});

        nameIsSubmitted = false;

        //Timeout if no name submitted within 30 seconds
        nameEntryTimeout = setTimeout(function() {
          nameSubmitted();
        }, 30*1000);

    }

    function nameSubmitted(){

        clearInterval(nameEntryTimeout);
        if (nameIsSubmitted == true) return;
        nameIsSubmitted = true;

        //Push into visitor queue
        var nameEntered = $("#nameinput").val();
        newVisitor(nameEntered, recordedVideoPath, recordedFileName);

        //Flip Popup
        TweenLite.to($( "#enter-name .popup-content" ), 0.8, {delay:0.1, rotationX:-180, ease:Power2.easeOut});
        setTimeout(returnToCameraView, 5000);

    }

    function returnToCameraView(){

        //Hide name popup
        TweenMax.to( $( "#enter-name" ), 0.5, { css: { opacity:0 }, delay:0.2, ease:Power2.easeIn});
        TweenMax.to( $( "#enter-name .popup-content" ), 0.7, { css: { scale:0.7, opacity:0 }, ease:Power2.easeIn, onComplete:function(){
          //Reset fields
          $("#nameinput").val('');
          $( "#enter-name" ).hide();
          //Reset flipped state
          TweenLite.set($( "#enter-name .popup-content" ), {rotationX:0});

        }});
        $( "#intake_video" ).removeClass('effect-blur');

        recordLockout = false;

    }

    //Init
    initCamera();
    initUI();

});
