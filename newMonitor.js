'use strict';

var { remote, ipcRenderer: comm } = require('electron');

var config = remote.getGlobal('config');

var process = remote.process;

var µ = query=>document.querySelector(query);

document.addEventListener('DOMContentLoaded', function (event) {
  console.log('here');
  var windows = null;

  windows = config.windows;
  config.windows.forEach(wind=> {
    let newOpt = document.createElement('option');
    newOpt.textContent = wind.label;
    newOpt.value = wind.label;
    µ('#windowOpts').appendChild(newOpt);
  });

  µ('#windows').onchange = ()=> {
    var wnd = config.windows.find(wind=>wind.label == µ('#windows').value);
    µ('#demo').src = wnd.file;
  };

  µ('#save').onmousedown = ()=> {
    if (µ('#windows').value) {
      comm.send('window-select', {
        window: µ('#windows').value,
      });
    } else {
      //µ('#growl').message('Please select a window', 'warn');
    }
  };

  process.on('SIGINT', ()=> {
    process.nextTick(function () { process.exit(0); });
  });
});
