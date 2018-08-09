'use strict';

var { exec, execSync } = require('child_process');

var { Gpio } = require('onoff');

var pwrInd = new Gpio(parseInt(process.argv[2]), 'in', 'both');

pwrInd.watch(function (err, value) {
  if (value == 0) {
    execSync('sudo systemctl stop electron.service');
    setTimeout(()=> {
      execSync('sudo shutdown now');
    }, parseInt(process.argv[3]));
  }
});

process.on('exit', (code)=> {
  pwrInd.unexport();
});
