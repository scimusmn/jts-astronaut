'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var obtains = [
  'electron',
];

obtain(obtains, ({ ipcRenderer: comm })=> {

  exports.app = {};

  var sent = false;

  var data = [];

  var fadeInt;
  var dir = 1;
  var val = 0;

  exports.app.start = ()=> {

    console.log('started');

    comm.on('video', (evt, data)=> {
      µ('#playback').onloadedmetadata = ()=> {
        //µ('#playback').loop = true;
        µ('#playback').play();
        µ('#screen-saver').classList.add('fade');
        setTimeout(()=> {
          µ('#screen-saver').classList.remove('fade');
        }, data.length - 2000);
        URL.revokeObjectURL(data.url);
      };

      µ('#playback').src = data.url;
    });

    µ('#playback').onended = ()=> {
      for (var i = 0; i < 3; i++) {
        comm.send('interwindow', {
          target: 'name_' + (i + 1),
          channel: 'nametag',
          data: {
            name: '',
          },
        });
      }

      µ('#screen-saver').play();

      µ('#playback').src = null;
    };

    document.onkeypress = (e)=> {

    };

    document.onkeyup = (e)=> {
      if (e.which == 27 && e.getModifierState('Shift') || e.which == 81 && e.getModifierState('Control')) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
