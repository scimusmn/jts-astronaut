require('../common/src/muse/main.js');

var setupDir = (process.platform != 'linux') ?  `${__dirname}/../ForBoot/setup/` :
                    (process.arch == 'x64') ? '/usr/local/setup/' :
                    '/boot/setup/';

var appDataDir = (process.platform != 'linux') ?  `${__dirname}/../ForBoot/appData/` :
                    (process.arch == 'x64') ? '/usr/local/appData/' :
                    '/boot/appData/';

var obtains = [
  `${__dirname}/src/driveWatch.js`,
  'child_process',
  'fs',
];

obtain(obtains, ({ monitor }, { execSync, exec }, fs)=> {
  monitor.begin();
  console.log('start drivewatch');

  monitor.on('connected', (which)=> {
    console.log(which.device);
    monitor.mount(which);
  });

  monitor.on('mounted', (which)=> {
    console.log('just mounted');

    if (fs.existsSync(`${which.mountpoints[0].path}/update/update.js`)) {
      var update = require(`${which.mountpoints[0].path}/update/update.js`).updatePaths;

      var paths = {
        appData: appDataDir,
        app: __dirname.substring(0, __dirname.indexOf('/piFig')) + '/',
        setup: setupDir,
      };

      console.log(paths.app);

      for (var key in update) {
        if (update.hasOwnProperty(key)) {
          if (key == 'app' || key == 'appData' || key == 'setup') {
            if (update[key].length) {
              var base = `${which.mountpoints[0].path}/update/${key}/`;
              update[key].forEach(path=> {
                if (path[path.length - 1] == '/') path.length--;
                console.log(paths[key] + path);
                execSync(`cp -rf "${base + path}" "${paths[key] + path}"`);
              });
            }

          }
        }
      }

      monitor.unmount(which);
    } else monitor.unmount(which);
  });
});
