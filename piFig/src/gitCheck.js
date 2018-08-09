'use strict';

var { exec, execSync } = require('child_process');

console.log(__dirname);

var opts = {
  cwd: process.argv[2],
};

var call = command => {
  return execSync(command, opts);
};

setInterval(()=> {
  exec('git fetch', opts, (err, stdout, stderr)=> {
    if (err || stderr) return -1;
    else {
      var localHash = call('git rev-parse @').toString();
      var remoteHash = call('git rev-parse @{u}').toString();
      var baseHash = call('git merge-base @ @{u}').toString();
      if (remoteHash == baseHash || localHash == remoteHash) {
        console.log('Up to date.');
      } else {
        console.log('Updating...');
        call('git checkout .');
        call('git pull');
        call('git submodule init');
        call('git submodule update');
        call('sudo systemctl stop electron.service');
        call('sudo systemctl start electron.service');
        console.log();
      }
    }
  });
}, 30000);
