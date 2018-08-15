'use strict';
const electron = require('electron');

var ipcMain = electron.ipcMain;

if (!window) var window = global;

window.appDataDir = (process.platform != 'linux') ?  './ForBoot/appData' :
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
  windows[wind.label] = createWindow({
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

var DISPLAY_BINDING_PATH = appDataDir + 'windowBindings.json';

function makeWindows() {

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

  var displays = electron.screen.getAllDisplays();

  displays.forEach(display=> {
    if (config.windows.find(wind=>wind.displayId && display.id == wind.displayId)) {
      config.windows.forEach(wind=> {
        if (display.id == wind.displayId) createWindowForDisplay(display, wind);
      });
    } else {
      windows[display.id] = createWindow({
        fullscreen: false,
        devTools: false,
        size: {
          width: display.size.width / 2,
          height: display.size.height / 2,
        },
        location: {
          x: display.bounds.x + Math.floor(display.size.width / 4),
          y: display.bounds.y + Math.floor(display.size.height / 4),
        },
        title: display.id,
        file: './newMonitor.html',
      });
    }
  });

  ipcMain.on('interwindow', (evt, arg)=> {
    arg.data.from = evt.sender.label;
    if (windows[arg.target]) windows[arg.target].webContents.send(arg.channel, arg.data);
  });

  ipcMain.on('list-windows', (evt, arg)=> {
    evt.sender.send('window-list', {
      windows: config.windows,
      self: evt.sender.label,
    });
  });

  ipcMain.on('window-select', (evt, arg)=> {
    windows[evt.sender.label].close();

    var display = displays.find(disp=> disp.id == evt.sender.label);
    var wind = config.windows.find(wind=>wind.label == arg.window);

    binds[wind.label] = evt.sender.label;

    fs.writeFileSync(DISPLAY_BINDING_PATH, JSON.stringify(binds));

    createWindowForDisplay(display, wind);
  });

  electron.screen.on('display-added', (evt, display)=> {

    config.windows.forEach(wind=> {
      if (display.id == wind.displayId) createWindowForDisplay(display, wind);
    });
  });

  electron.screen.on('display-removed', (evt, display)=> {

    var wind = config.windows.find(win => display.id == win.displayId);

    if (windows[wind.label]) windows[wind.label].close();

    windows[wind.label] = null;
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', makeWindows);

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
