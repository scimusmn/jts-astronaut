if (!window) var window = global;

if (!window.setupDir)
  window.setupDir = (process.platform != 'linux') ?  `${__dirname}/../ForBoot/setup/` :
                      (process.arch == 'x64') ? '/usr/local/setup/' :
                      '/boot/setup/';

if (!window.appDataDir)
  window.appDataDir = (process.platform != 'linux') ?  `${__dirname}/../ForBoot/appData/` :
                      (process.arch == 'x64') ? '/usr/local/appData/' :
                      '/boot/appData/';

var obs = [
  `${__dirname}/hotspot.js`,
  `${__dirname}/wifi.js`,
  `${__dirname}/staticIP.js`,
  `${__dirname}/preventSleep.js`,
  `${__dirname}/softShutdown.js`,
  `${window.setupDir}/machineConfig.js`,
  `${__dirname}/createService.js`,
   'fs',
  `${__dirname}/keyLogger.js`,
  `${__dirname}/driveWatch.js`,
  'child_process',
];

obtain(obs, (hotspot, wifi, staticIP, preventSleep, soft, { config }, services, fs, { keyboards }, { monitor }, { exec, execSync })=> {
  var pfg = config.piFig;
  if (pfg) {
    var confDir = window.setupDir + '/.currentConfig.json';
    let curCfg = {};
    if (fs.existsSync(confDir)) {
      let data = fs.readFileSync(confDir); //file exists, get the contents
      curCfg = JSON.parse(data);
    }

    function configsMatch(cur, cfg) {
      if (!cur) return false;
      else {
        let ret = true;
        for (key in cfg) {
          if (cfg.hasOwnProperty(key)) {
            if (!cur[key] || cur[key] != cfg[key]) ret = false;
          }
        }

        return ret;
      }
    }

    var serviceFolder = __dirname.substring(0, __dirname.indexOf('/src')) + '/services';
    var mainDir = __dirname.substring(0, __dirname.indexOf('/piFig/src'));

    if (!curCfg.serviceFolder) {
      curCfg.serviceFolder = serviceFolder;
      curCfg.mainDir = mainDir;
    } else {
      serviceFolder = curCfg.serviceFolder;
      mainDir = curCfg.mainDir;
    }

    monitor.begin();

    monitor.on('connected', (which)=> {
      monitor.mount(which);
    });

    monitor.on('mounted', (which)=> {

      if (fs.existsSync(`${which.mountpoints[0].path}/update/update.js`)) {
        var update = require(`${which.mountpoints[0].path}/update/update.js`).updatePaths;

        var paths = {
          appData: appDataDir,
          app: mainDir,
          setup: setupDir,
        };

        for (var key in update) {
          if (update.hasOwnProperty(key)) {
            if (key == 'app' || key == 'appData' || key == 'setup') {
              if (update[key].length) {
                var base = `${which.mountpoints[0].path}/update/${key}/`;
                update[key].forEach(path=> {
                  if (path[path.length - 1] == '/') path.length--;
                  execSync(`cp -rf "${base + path}" "${paths[key] + path}"`);
                });
              }

            }
          }
        }

        exec('sudo systemctl stop electron.service', ()=> {
          exec('sudo systemctl start electron.service');
        });

        monitor.unmount(which);
      } else monitor.unmount(which);
    });

    if (pfg.wifiHotspot && !configsMatch(curCfg.wifiHotspot, pfg.wifiHotspot)) {
      console.log('Configuring wifi hotspot...');
      hotspot.configure(pfg.wifiHotspot);
      curCfg.wifiHotspot = pfg.wifiHotspot;
    }

    if (pfg.wifi && !configsMatch(curCfg.wifi, pfg.wifi)) {
      console.log('Configuring wifi...');
      wifi.configure(pfg.wifi);
      curCfg.wifi = pfg.wifi;
    }

    if (pfg.preventSleep && !configsMatch(curCfg.preventSleep, pfg.preventSleep)) {
      console.log('Prevent display sleep...');
      preventSleep.configure(pfg.preventSleep);
      curCfg.preventSleep = pfg.preventSleep;
    }

    if (pfg.staticIP && !configsMatch(curCfg.staticIP, pfg.staticIP)) {
      console.log('Configuring staticIP...');
      staticIP.configure(pfg.staticIP);
      curCfg.staticIP = pfg.staticIP;
    }

    if (pfg.wifiUser && !configsMatch(curCfg.wifiUser, pfg.wifiUser)) {
      console.log('Configuring wifi with user credentials...');
      wifi.configure(pfg.wifiUser);
      curCfg.wifiUser = pfg.wifiUser;
    }

    if (!configsMatch(curCfg.autostart, pfg.autostart)) {
      console.log('Configuring autostart...');
      if (pfg.autostart) services.configure(
        'electron',
        'Autostart main application',
        `/usr/bin/startx ${mainDir}/node_modules/.bin/electron ${mainDir}`
      );
      else if (curCfg.autostart) services.disable('electron');
      curCfg.autostart = pfg.autostart;
    }

    if (!configsMatch(curCfg.autostartNode, pfg.autostartNode)) {
      console.log('Configuring node autostart...');
      if (pfg.autostartNode) services.configure(
        'node',
        'Autostart main application',
        `/usr/bin/node ${mainDir}`
      );
      else if (curCfg.autostartNode) services.disable('node');
      curCfg.autostartNode = pfg.autostartNode;
    }

    if (!configsMatch(curCfg.softShutdown, pfg.softShutdown)) {
      if (pfg.softShutdown) {
        var shtd = pfg.softShutdown;
        soft.configure(shtd.controlPin);
        services.configure('powerCheck',
          'Control soft shutdown',
          `/usr/bin/node ${serviceFolder}/powerCheck.js ${shtd.monitorPin} ${shtd.delayTime}`
        );
      } else {
        services.disable('powerCheck');
      }

      curCfg.softShutdown = pfg.softShutdown;
    }

    if (!configsMatch(curCfg.gitWatch, pfg.gitWatch)) {
      if (pfg.gitWatch) services.configure(
        'gitTrack',
        'Autotrack git repo',
        `/usr/bin/node ${serviceFolder}/gitCheck.js ${mainDir}`
      );
      else services.disable('gitTrack');

      curCfg.gitWatch = pfg.gitWatch;
    }

    if (!curCfg.watchPiFig) {
      console.log('Setting up autowatch...');
      if (pfg.autostart) services.configure(
        'piFig',
        'Monitor piFig file on startup',
        `/usr/bin/node ${mainDir}/piFig/install.js`
      );

      curCfg.watchPiFig = true;
    }

    fs.writeFileSync(confDir, JSON.stringify(curCfg));
  }

  keyboards.on('keydown', (code, states)=> {
    if (states[1] && states[29]) services.stop('electron');
  });

});
