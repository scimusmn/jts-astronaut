
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

    //Outgoing messages...
    function logMessage(message){
        socket.emit('log-message', {message:'booth.js--> '+message});
    }

    function exportVisitor() {

        logMessage('exportVisitor() '+ visitorQueue[0].nameString + ', '+ visitorQueue[0].videoURL);
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

    var minWaitTime = 5; // Time guaranteed to visitor prepare after submission.
    var playbackRate = 1;
    var captureLength = 10;
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

    $("#feed-overlay").click( function(e) {
        var eventProperties = {};
        eventProperties.x = e.clientX;
        eventProperties.y = e.clientY;
        onRecordClicked(eventProperties);
    });

    var timeout = false;
    $("#btn_submitname").click( nameSubmitted(timeout) );

    $("#nameinput").keydown(function (e) {
        if (e.keyCode == 13) { //capture return key
          nameSubmitted(timeout);
        }
        if (e.keyCode == 192) { //simulate backspace
            $('#nameinput').trigger({type: 'keydown', key: 'Backspace'});
            e.preventDefault();
            e.stopPropagation();
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

            logMessage('ERROR: Camera access denied.');

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

        logMessage('stopVidRecording() '+ recorder);

        if (recorder){

            //Before attempting to create video file. Start timeout timer.
            //If waiting longer than 6 seconds, assume there was a video write error, and hard refresh entire page.
            videoCreationTimeout = setTimeout(function() {
                logMessage('ERROR: Completed videoCreationTimeout. Reloading page.');
                location.reload();
            }, 6*1000);

            recorder.stopRecording(function(url) {

                logMessage('recorder.stopRecording()');

                recorder.getDataURL(function(videoDataURL) {

                    var data = {
                        video: {
                            type: recorder.getBlob().type || 'video/webm',
                            dataURL: videoDataURL
                        }
                    };

                    logMessage('socket.emit(create-video-file)');
                    socket.emit('create-video-file', data);

                    //...Wait to hear back from node that file was successfully created...

                });

            });

        }

        //Update buttons
        recordVideo.disabled = false;

    };

    function onVideoFileReady(fileName){

        logMessage('onVideoFileReady() '+ fileName);

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

    var delay_visor = 2; //Should match duration of visor transition
    var delay_fade = 0.9; //Time to fade in/out comp
    var delay_playback = (captureLength/playbackRate) - delay_fade;
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

        setTimeout(function(){ //delay_begin
          resolumeControl('raise');

          setTimeout(function() { //delay_visor
            vidSource('booth');

            setTimeout(function() { //delay_fade
              exportVisitor();

              setTimeout(function() { //delay_playback
                vidSource('visor');

                setTimeout(function() { //delay_fade
                  resolumeControl('lower');

                  setTimeout(function() { // delay_visor
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

        logMessage('visitorSequenceFinished() Queue length: ' + visitorQueue.length);

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
            logMessage('resetReload() -> reloadTimeout completed. Reloading page.');
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

    function onRecordClicked(eventProperties){

        resetReload();
        if (recordLockout==true) return;
        recordLockout = true;

        // Track the record event
        sendKeenEvent('recording', eventProperties);

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

        /**
         * Name submission timeout
         *
         * If the user hasn't submitter a name after 10 seconds and the
         * name field is empty, submit an empty string.
         *
         * If there is any data in the name field give them another 15 seconds.
         */
        nameEntryTimeout = setTimeout(function() {

            var nameEntered = $("#nameinput").val();
            /**
             * User has not entered a name, assume they've walked away.
             * Submit a blank name so that the video will show up on the
             * helmet.
             *
             * Record a timeout event, so we know how often this is happening.
             */
            var timeout = false;
            var eventProperties = {};
            eventProperties.name = nameEntered;
            if (nameEntered == '') {
                timeout = true;
                nameSubmitted(timeout);
            }

            // User has started entering name, allow an extra 15 secs
            else {
                clearInterval(nameEntryTimeout);
                nameEntryTimeout = setTimeout(function() {
                    // If the user still hasn't submitted a name, send it
                    // through as-is.
                    timeout = true;
                    nameSubmitted(timeout);
                }, 15 * 1000);
            }

        }, 10 * 1000);

    }

    function nameSubmitted(timeout){

        clearInterval(nameEntryTimeout);
        if (nameIsSubmitted == true) return;
        nameIsSubmitted = true;

        // Name value
        var nameEntered = $("#nameinput").val();
        var eventProperties = {};
        eventProperties.name = nameEntered;
        eventProperties.timeout = timeout;

        // Send Keen event
        sendKeenEvent('name', eventProperties);

        //Push into visitor queue
        newVisitor(nameEntered, recordedVideoPath, recordedFileName);

        //Flip popup
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

    /**
     * Track an event with keen.io
     */
    function sendKeenEvent(eventType, eventProperties) {
        var collectionEvent;
        /**
         * Track the record event and also pass along click X & Y, to see
         * where visitors are clicking. This will help us understand how
         * the design is working.
         */
        if (eventType == 'recording') {
            collectionEvent = {
                event: 'recording',
                clickX: eventProperties.x,
                clickY: eventProperties.y
            };
        }

        /**
         * Track the name submission, along with:
         *  - name value
         *  - if the name entry timed out
         */
        if (eventType == 'name') {
            collectionEvent = {
                event: 'name',
                name: eventProperties.name,
                timeout: eventProperties.timeout
            };
        }

        // Add the timestamp to the event
        collectionEvent.keen = {
            timestamp: new Date().toISOString()
        }

        // Send data, with some basic error reporting
        keenClient.addEvent(eventType, collectionEvent, function(err, res){
            if (err) {
                console.log('Keen - ' + collectionEvent.event + ' submission failed');
            }
            else {
                console.log('Keen - ' + collectionEvent.event + ' event sent successfully');
            }
        });
    }

    //Init
    initCamera();
    initUI();

});
