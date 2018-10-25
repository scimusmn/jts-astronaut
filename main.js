'use strict';
const electron = require('electron');

var ipcMain = electron.ipcMain;

if (!window) var window = global;

window.appDataDir = (process.platform != 'linux') ?  `${__dirname}/ForBoot/appData` :
                (process.arch == 'x64') ? '/usr/local/appData' :
                '/boot/appData';

global.config = require(appDataDir + '/config.js');

if (config.preventStartup) process.exit(0);

// Module to control application life.
const app = electron.app;
app.commandLine.appendSwitch('--enable-viewport-meta', 'true');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');

global.appRoot = path.resolve(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = {};

var createWindow = (info)=> {
  var size = info.size;

  var temp = new BrowserWindow({
    fullscreen: info.fullscreen,
    alwaysOnTop: info.alwaysOnTop,
    width: size.width,
    height: size.height,
    x: info.location.x,
    y: info.location.y,
    frame: false,

    //kiosk: true,
    scrollBounce: false,
    title: info.title,
    offscreen: false,
  });

  temp.webContents.label = info.title;

  if (info.devTools) temp.webContents.openDevTools();

  temp.setMenu(null);

  if (info.file) {
    temp.loadURL(url.format({
      pathname: path.join(__dirname, info.file),
      protocol: 'file:',
      slashes: true,
    }));
  } else {
    temp.loadURL(info.url);
  }

  temp.webContents.session.clearCache(function () {
    //some callback.
  });

  temp.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    //booth = null;
    //playback = null;
  });

  return temp;
};

var createWindowForDisplay = (display, wind)=> {
  if (!windows[wind.label]) windows[wind.label] = createWindow({
    fullscreen: wind.fullscreen,
    alwaysOnTop: wind.alwaysOnTop,
    devTools: config.showDevTools,
    size: wind.size || display.size,
    location: (wind.position) ? {
      x: display.bounds.x + wind.position.x,
      y: display.bounds.y + wind.position.y,
    } : display.bounds,
    title: wind.label,
    file: wind.file,
    url: wind.url,
  });
};

var isWin = process.platform === 'win32';

var DISPLAY_BINDING_PATH = appDataDir + '/windowBindings.json';

var displayInfo = [];

var parser = new require('xml2js').Parser();

var refreshDisplayInfoList = (cb)=>{
  if (process.platform === 'win32') {
    exec(`${__dirname}/utils/MultiMonitorTool.exe /sxml ${appDataDir}/displayInfo.xml`,()=>{
      fs.readFile(`${appDataDir}/displayInfo.xml`, 'utf16le', function (err, data) {
          parser.parseString(data, function (err, result) {
              displayInfo = result.monitors_list && result.monitors_list.item;
              displayInfo.forEach(disp=>{
                disp.hash = require('./utils/hash.js').hash(disp.name[0]);
                //var cur = displays.find(dsp=>dsp.id == disp.hash);
              });
              if(cb) cb(displayInfo);
            });
        });
    });
  } else {
    cb();
  }
}

function makeWindows() {
  var displays = electron.screen.getAllDisplays();

  var binds = {};
  if (fs.existsSync(DISPLAY_BINDING_PATH)) {
    binds = JSON.parse(fs.readFileSync(DISPLAY_BINDING_PATH));

    for (var winLabel in binds) {
      if (binds.hasOwnProperty(winLabel)) {
        var wind = config.windows.find(wind=>wind.label == winLabel);
        if (wind) {
          wind.displayId = binds[winLabel];
        }
      }
    }
  }

  var refixWindows = ()=> {
    config.windows.forEach(win=> {
      if (windows[win.label]) {
        refreshDisplayInfoList((disps)=>{
          var disp = displays.find(disp=>{
            var dispId = disp.id;
            if(disps){
              var info = disps.find(dsp=>dsp.hash == disp.id);
              if(info) dispId = info.monitor_id[0];
            }
            return dispId == win.displayId
          });
          if (disp) {
            var size = win.size || disp.size;
            var pos = (win.position) ? {
              x: disp.bounds.x + win.position.x,
              y: disp.bounds.y + win.position.y,
            } : disp.bounds;
            windows[win.label].setBounds({
              x: pos.x,
              y: pos.y,
              width: size.width,
              height: size.height,
            });
          }
        });
      }
    });
  };

  displays.forEach(display=> {

    var monitorID = display.id;

    if(process.platform === 'win32'){
      var match = displayInfo.find(disp=>display.id == disp.hash);
      if(match) monitorID = match.monitor_id[0];
      console.log(monitorID);
    }

    if (config.windows.find(wind=>wind.displayId && monitorID == wind.displayId)) {
      config.windows.forEach(wind=> {
        if (monitorID == wind.displayId) createWindowForDisplay(display, wind);
      });
    } else {
      windows[display.id] = createWindow({
        fullscreen: false,
        devTools: config.showDevTools,
        size: {
          width: display.size.width,
          height: display.size.height,
        },
        location: {
          x: display.bounds.x,
          y: display.bounds.y,
        },
        title: display.id,
        file: './newMonitor.html',
      });
    }
  });

  ipcMain.on('interwindow', (evt, arg)=> {
    arg.data.from = evt.sender.label;
    arg.data.self = arg.target;
    if (windows[arg.target]) windows[arg.target].webContents.send(arg.channel, arg.data);
  });

  ipcMain.on('window-select', (evt, arg)=> {
    var senderId = evt.sender.label;
    windows[senderId].close();

    var display = displays.find(disp=> disp.id == senderId);
    var wind = config.windows.find(wind=>wind.label == arg.window);

    refreshDisplayInfoList((disps)=>{
      if(disps){
        var match = disps.find(disp=>display.id == disp.hash);
        if(match) senderId = match.monitor_id[0];
      }

      binds[wind.label] = senderId;

      fs.writeFileSync(DISPLAY_BINDING_PATH, JSON.stringify(binds));

      createWindowForDisplay(display, wind);
    })

  });

  electron.screen.on('display-added', (evt, display)=> {
    var monitorID = display.id;
    console.log("Monitor added: "+ monitorID);

    refreshDisplayInfoList((disps)=>{
      if(displayInfo){
        var match = displayInfo.find(disp=>display.id == disp.hash);
        if(match) monitorID = match.monitor_id[0];
      }

      //console.log(monitorID);

      console.log('I think the added monitor was: '+monitorID);

      config.windows.forEach(wind=> {
        if (monitorID == wind.displayId) createWindowForDisplay(display, wind);
      });

    });

    refixWindows();
  });

  electron.screen.on('display-removed', (evt, display)=> {
    var monitorID = display.id;
    console.log('monitor removed: '+ monitorID);

    if(displayInfo){
      var match = displayInfo.find(disp=>display.id == disp.hash);
      if(match) monitorID = match.monitor_id[0];
    }

    console.log('I think the removed monitor was: '+monitorID);

    var wind = config.windows.find(win => monitorID == win.displayId);

    if (windows[wind.label]) windows[wind.label].close();

    windows[wind.label] = null;

    refixWindows();

  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{
  refreshDisplayInfoList(makeWindows);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (windows.booth === null) {
    //createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
