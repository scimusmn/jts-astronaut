'use strict';
const electron = require('electron');

var ipcMain = electron.ipcMain;

if (!window) var window = global;

window.appDataDir = (process.platform != 'linux') ?  './ForBoot/appData' :
                (process.arch == 'x64') ? '/usr/local/appData' :
                '/boot/appData';

const config = require(appDataDir + '/config.js');

if (config.preventStartup) process.exit(0);

// Module to control application life.
const app = electron.app;
app.commandLine.appendSwitch('--enable-viewport-meta', 'true');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

global.appRoot = path.resolve(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let booth, playback, name1, name2;
let windows = {};

var createWindow = (info)=> {
  var size = info.size;

  var temp = new BrowserWindow({
    fullscreen: info.fullscreen,
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

  temp.loadURL(url.format({
    pathname: info.URL,
    protocol: 'file:',
    slashes: true,
  }));

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

var winData = [
  {
    label: 'booth',
    displayId: '69733248',
    url: path.join(__dirname, 'local/booth/index.html'),
  },
  {
    label: 'playback',
    displayId: '724059286',
    url: path.join(__dirname, 'local/playback/index.html'),
  },
  {
    label: 'name_1',
    displayId: '724059286',
    url: path.join(__dirname, 'local/name/index.html'),
    size: { width: 192, height: 108 },
    position: { x: 0, y: 200 },
  },
  {
    label: 'name_2',
    displayId: '724059286',
    url: path.join(__dirname, 'local/name/index.html'),
    size: { width: 192, height: 108 },
    position: { x: 192, y: 200 },
  },
  {
    label: 'name_3',
    displayId: '724059286',
    url: path.join(__dirname, 'local/name/index.html'),
    size: { width: 192, height: 108 },
    position: { x: 384, y: 200 },
  },
];

function makeWindows() {

  var displays = electron.screen.getAllDisplays();

  // displays.forEach((disp)=> {
  //   console.log(disp);
  // });

  winData.forEach(wind=> {
    let display = displays.find(display => display.id == wind.displayId);

    if (display) windows[wind.label] = createWindow({
      fullscreen: false,
      devTools: config.showDevTools,
      size: wind.size || display.size,
      location: (wind.position) ? {
        x: display.bounds.x + wind.position.x,
        y: display.bounds.y + wind.position.y,
      } : display.bounds,
      title: wind.label,
      URL: wind.url,
    });
  });

  ipcMain.on('interwindow', (evt, arg)=> {
    arg.data.from = evt.sender.label;
    if (windows[arg.target]) windows[arg.target].webContents.send(arg.channel, arg.data);
  });

  ipcMain.on('list-windows', (evt, arg)=> {
    evt.sender.send('window-list', {
      windows: winData,
      self: evt.sender.label,
    });
  });

  electron.screen.on('display-added', (evt, display)=> {

    var wind = winData.find(win => display.id == win.displayId);

    if (wind && !windows[wind.label]) {
      windows[wind.label] = createWindow({
        fullscreen: false,
        devTools: config.showDevTools,
        size: display.size,
        location: display.bounds,
        title: wind.label,
        URL: wind.url,
      });
    }
  });

  electron.screen.on('display-removed', (evt, display)=> {

    var wind = winData.find(win => display.id == win.displayId);

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
