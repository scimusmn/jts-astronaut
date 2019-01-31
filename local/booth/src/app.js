'use strict';

var remote = require('electron').remote;

var process = remote.process;

var config = remote.getGlobal('config');

//include the essential files for the application
var obtains = [
  'µ/components/camera.js',
  'µ/components/progress.js',
  'µ/components/keyboard.js',
  'µ/components/',
  './src/swearFilter.js',
  'electron',
];

obtain(obtains, (camera, progress, keyboard, { Card }, swears, { ipcRenderer: comm })=> {

  exports.app = {};

  var sent = false;

  var data = [];

  var fadeInt;
  var dir = 1;
  var val = 0;
  window.lastURL = null;

  var recordTime = config.recordTime;

  //create the function used when the application starts.
  exports.app.start = ()=> {

    console.log('started');

    //flag for tracking the recording state.
    var recording = false;

    var advanceTO = null;

    // set the function that is called when the name request card is shown.
    µ('#nameCard').onShow = ()=> {
      // focus the input text box, so text is entered there.
      µ('input')[0].focus();

      // automatically submit the name form if idle for 60 seconds.
      advanceTO = setTimeout(µ('#submit').onclick, 60000);
    };

    var alertTO;

    // when the name request card is hidden...
    µ('#nameCard').onHide = ()=> {

      // capture the first 20 characters of the name from the name entry text field.
      var name = µ('#nameEntry').value;

      // clear the name entry field.
      µ('#nameEntry').value = '';

      //check if there are any commands in the name
      var cmds = name.split(':');

      if (cmds[0] == 'shutdown' && cmds[1]) {
        var data = (cmds[2] && cmds.slice(2)) || true;
        comm.send('shutdown', {
          [cmds[1]]: data,
        });
      } else {
        // show the 'watch the helmet' alert bar
        µ('#alert').show = true;

        var delayTime = 5000;

        var alertTime = Date.now() + delayTime;

        µ('#alert').textContent = `Your video will appear on the Helmet in ${delayTime / 1000} seconds`;

        var updateAlert = setInterval(()=> {
          var updateTime = Math.ceil((alertTime - Date.now()) / 1000);
          µ('#alert').textContent = `Your video will appear on the Helmet in ${updateTime} seconds`;
        }, 1000);

        // set a timeout to post the video to the helmet. After 5 seconds...
        alertTO = setTimeout(()=> {
          // hide the alert card.
          µ('#alert').show = false;
          clearInterval(updateAlert);

          // send the video to the playback window
          comm.send('interwindow', {
            target: 'playback',
            channel: 'video',
            data: {
              url: window.lastURL,
              length: recordTime,
            },
          });

          // revoke the video url from this window, once it's passed to the playback.
          URL.revokeObjectURL(window.lastURL);

          // send the name to each of the nametag windows, after swear filtering
          for (var i = 0; i < 3; i++) {
            comm.send('interwindow', {
              target: 'name_' + (i + 1),
              channel: 'nametag',
              data: {
                name: swears.filter(name.substr(0, 20)) || config.defaultName,
              },
            });
          }
        }, delayTime);
      }

      // if we're automating, start another record after 2 seconds.
      if (config.automate) {
        setTimeout(timedRecord, 2000);
      }
    };

    // when the submit button is click in the name entry window...
    µ('#submit').onclick = ()=> {
      // clear the 60 second automatic advance timeout.
      clearTimeout(advanceTO);

      // hide the name entry card.
      µ('#nameCard').show = false;

      //manage some classes for CSS animations
      µ('cam-era')[0].classList.remove('blur');
      µ('#face-outline').classList.remove('shadowed');
      µ('#guidance').classList.remove('hide');

      //hide the keyboard.
      µ('key-board')[0].show = false;

    };

    // when we get a message back about the next shutdown
    comm.on('nextShutdown', (evt, data)=> {
      //pop up a alert message box
      µ('#alert').show = true;

      var options = {
        year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      };

      //make the string to show the new shutdown time
      var sdTime = new Date(data);
      µ('#alert').textContent = `Next shutdown scheduled for ${sdTime.toLocaleDateString('en-US', options)}`;

      //stop showing the alert after 5 seconds
      alertTO = setTimeout(()=> {
        µ('#alert').show = false;
      }, 5000);
    });

    //receive messages from the main process
    comm.on('report', (evt, data)=> {
      console.log(data);
    });

    var cycleCount = 0;

    //once the camera stops recording, pass in the dataURL of the video
    µ('#mainCam').onRecordEnd = (dataURL)=> {
      recording = false;

      //deactivate the record icon
      µ('#record-video').classList.remove('active');

      //display the keyboard and name entry field.
      µ('key-board')[0].show = true;
      µ('#nameCard').show = true;

      //put the keyboard focus into the nameEntry text area
      µ('#nameEntry').focus();

      //blur the camera image in the background
      µ('cam-era')[0].classList.add('blur');

      //store the video for later use
      window.lastURL = dataURL;

      µ('cam-era')[0].clear();

      //if we're automatically recording, set the name field to the number of times we've recorded
      if (config.automate) {
        µ('#nameEntry').value = 'Name ' + (cycleCount++);
        setTimeout(µ('#submit').onclick, 2000);
      }
    };

    var recordTO;
    var updateInt;
    var startTime;

    //function called to start recording
    var timedRecord = ()=> {
      //only call if we're not recording
      if (!recording) {
        recording = true;
        clearTimeout(recordTO);

        //make the record button active, put the shadow around the face outline,
        // hide the on screen prompt, and start recording.
        µ('#record-video').classList.add('active');
        µ('#face-outline').classList.add('shadowed');
        µ('#guidance').classList.add('hide');
        µ('#mainCam').record();

        //record the current time
        startTime = (new Date()).getTime();

        //set a timeout to end recording
        recordTO = setTimeout(()=> {
          clearInterval(updateInt);
          µ('progress-ring')[0].progress = 0;
          µ('#mainCam').stopRecord();
          µ('#center-icon').textContent = '';
        }, recordTime * 1000);

        //update the progress ring and countdown text every half second
        updateInt = setInterval(()=> {
          µ('#center-icon').textContent = recordTime - Math.floor(((new Date()).getTime() - startTime) / 1000);
          µ('#center-icon').textContent = µ('#center-icon').textContent.padStart(2, '0');
          µ('progress-ring')[0].progress = ((new Date()).getTime() - startTime) / (recordTime * 1000);
        }, 500);
      }
    };

    // if the progress ring is click while recording, after more than 4 seconds
    µ('progress-ring')[0].onclick = ()=> {
      if (recording && Date.now() - startTime > 4000) {
        //stop the recording, and stop updating the recording time left.
        clearInterval(updateInt);
        µ('progress-ring')[0].progress = 0;
        µ('#mainCam').stopRecord();
        µ('#center-icon').textContent = '';
      }
    };

    // if the record icon, or the prompt is click, start recording
    µ('#record-video').onclick = timedRecord;

    µ('#guidance').onclick = timedRecord;

    // µ('input')[0].onkeypress = (e)=> {
    //   console.log(e.key);
    // };

    document.onkeypress = (e)=> {
      //toggle the keyboard if the '\' is pressed
      if (e.key == '\\') µ('#nameCard').show = µ('key-board')[0].show = !µ('key-board')[0].show;
    };

    document.onkeydown = e=> {
      //if right arrow is pressed, toggle the autorecorder
      if (e.which == 38) {
        if (config.automate = !config.automate) {
          timedRecord();
        }
      }
    };

    document.onkeyup = (e)=> {
      if (e.which == 27 && e.getModifierState('Shift') || e.which == 81 && e.getModifierState('Control')) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 13) {
        µ('#submit').onclick();
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });

    //if we're automating, start recording right away.
    if (config.automate) {
      setTimeout(timedRecord, 5000);
    }
  };

  provide(exports);
});
