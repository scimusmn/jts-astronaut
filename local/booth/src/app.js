'use strict';

var remote = require('electron').remote;

var process = remote.process;

var config = remote.getGlobal('config');

//remote.getCurrentWindow().closeDevTools();

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

  var recordTime = 15;

  exports.app.start = ()=> {

    console.log('started');

    var recording = false;

    µ('#nameCard').onShow = ()=> {
      µ('input')[0].focus();
    };

    var alertTO;

    µ('#nameCard').onHide = ()=> {
      µ('#alert').show = true;
      var name = µ('#nameEntry').value.substr(0, 20);
      µ('#nameEntry').value = '';
      alertTO = setTimeout(()=> {
        µ('#alert').show = false;

        comm.send('interwindow', {
          target: 'playback',
          channel: 'video',
          data: {
            url: window.lastURL,
            length: recordTime,
          },
        });

        URL.revokeObjectURL(window.lastURL);

        for (var i = 0; i < 3; i++) {
          comm.send('interwindow', {
            target: 'name_' + (i + 1),
            channel: 'nametag',
            data: {
              name: swears.filter(name) || 'i<3space',
            },
          });
        }
      }, 5000);

      if (config.automate) {
        setTimeout(timedRecord, 2000);
      }
    };

    µ('#submit').onclick = ()=> {
      µ('#nameCard').show = false;

      µ('cam-era')[0].classList.remove('blur');
      µ('#face-outline').classList.remove('shadowed');
      µ('key-board')[0].show = false;
      µ('#guidance').classList.remove('hide');

    };

    comm.send('list-windows', {});

    comm.on('window-list', (evt, data)=> {
      console.log(data);
    });

    comm.on('report', (evt, data)=> {
      console.log(data);
    });

    var cycleCount = 0;

    µ('#mainCam').onRecordEnd = (dataURL)=> {
      recording = false;

      µ('#record-video').classList.remove('active');

      µ('key-board')[0].show = true;
      µ('#nameCard').show = true;

      µ('#nameEntry').focus();

      µ('cam-era')[0].classList.add('blur');

      window.lastURL = dataURL;

      µ('cam-era')[0].clear();

      if (config.automate) {
        µ('#nameEntry').value = 'Name ' + (cycleCount++);
        setTimeout(µ('#submit').onclick, 2000);
      }
    };

    var recordTO;
    var updateInt;
    var time;

    var timedRecord = ()=> {
      if (!recording) {
        recording = true;
        clearTimeout(recordTO);
        µ('#record-video').classList.add('active');
        µ('#face-outline').classList.add('shadowed');
        µ('#guidance').classList.add('hide');
        µ('#mainCam').record();

        time = (new Date()).getTime();

        recordTO = setTimeout(()=> {
          clearInterval(updateInt);
          µ('progress-ring')[0].progress = 0;
          µ('#mainCam').stopRecord();
          µ('#center-icon').textContent = '';
        }, recordTime * 1000);

        updateInt = setInterval(()=> {
          µ('#center-icon').textContent = recordTime - Math.floor(((new Date()).getTime() - time) / 1000);
          µ('#center-icon').textContent = µ('#center-icon').textContent.padStart(2, '0');
          µ('progress-ring')[0].progress = ((new Date()).getTime() - time) / (recordTime * 1000);
        }, 500);
      }
    };

    µ('#record-video').onclick = timedRecord;

    µ('#guidance').onclick = timedRecord;

    // µ('input')[0].onkeypress = (e)=> {
    //   console.log(e.key);
    // };

    document.onkeypress = (e)=> {
      //if (e.key == ' ') console.log('Space pressed'), hardware.digitalWrite(13, 1);
      // if (e.key == 'r') µ('#mainCam').record();
      // else if (e.key == 's') µ('#mainCam').stopRecord();
      // else if (e.key == 't') timedRecord();
      if (e.key == '\\') µ('#nameCard').show = µ('key-board')[0].show = !µ('key-board')[0].show;
    };

    document.onkeydown = e=> {
      if (e.which == 38) {
        if (config.automate = !config.automate) {
          timedRecord();
        }
      }
    };

    document.onkeyup = (e)=> {
      if (e.which == 27 && e.getModifierState('Shift')) {
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

    if (config.automate) {
      setTimeout(timedRecord, 5000);
    }
  };

  provide(exports);
});
