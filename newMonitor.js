'use strict';

var remote = require('electron').remote;

var config = remote.getGlobal('config');

var process = remote.process;

var obtains = [
  'µ/components/',
  'electron',
];

obtain(obtains, (comps, { ipcRenderer: comm })=> {

  exports.app = {};

  exports.app.start = ()=> {

    // comm.send('interwindow', {
    //   target: 'playback',
    //   channel: 'video',
    //   data: {
    //     url: lastURL,
    //     length: recordTime,
    //   },
    // });

    var windows = null;

    windows = config.windows;
    config.windows.forEach(wind=> {
      let newOpt = µ('+drop-opt', µ('#windows'));
      newOpt.textContent = wind.label;
      newOpt.value = wind.label;
    });

    µ('#windows').onSelect = (node, index)=> {
      µ('#demo').src = windows[index].file;
    };

    µ('#save').onclick = ()=> {
      if (µ('#windows').value) {
        comm.send('window-select', {
          window: µ('#windows').value,
        });
      } else {
        µ('#growl').message('Please select a window', 'warn');
      }
    };

    document.onkeypress = (e)=> {
    };

    document.onkeyup = (e)=> {
      if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
