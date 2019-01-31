'use strict';
const electron = require('electron');

// grab the interprocess communication object.
var ipcMain = electron.ipcMain;

// alias the global object as window
if (!window) var window = global;

//save the location of the appData directory.
window.appDataDir = (process.platform != 'linux') ?  `${__dirname}/ForBoot/appData` :
                (process.arch == 'x64') ? '/usr/local/appData' :
                '/boot/appData';

// grab the config file from the appData directory
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

// use the scheduler module to set up the shutdown events.
var scheduler = require('./scheduler.js');

console.log('Scheduling shutdowns');
scheduler.recurEvent(()=> {
  exec('shutdown /s');
}, JSON.parse(fs.readFileSync(`${appDataDir}/shutdownSchedule.json`)));

var now = new Date();

// store the current directory as the app root.
global.appRoot = path.resolve(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = {};

// define the create window function. It receives an info object, that contains all
// of the setup information.
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

  //set the webContents label to the title for IPC reasons
  temp.webContents.label = info.title;

  // if the info object tells us to open the dev tools, do so
  if (info.devTools) temp.webContents.openDevTools();

  // remove menu bars from the window
  temp.setMenu(null);

  // if the info object specifies a local file to open, do so, otherwise open the defined URL
  if (info.file) {
    temp.loadURL(url.format({
      pathname: path.join(__dirname, info.file),
      protocol: 'file:',
      slashes: true,
    }));
  } else {
    temp.loadURL(info.url);
  }

  //get rid of any old cached data.
  temp.webContents.session.clearCache(function () {
    //some callback.
  });

  temp.on('closed', function () {
    // do nothing if the window is closed.
  });

  // return the created window.
  return temp;
};

// calls the createWindow function with the window fullscreen on a specified display
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

// check, and store, if we're using the operating system Windows.
var isWin = process.platform === 'win32';

// store the path to the display binding file.
var DISPLAY_BINDING_PATH = appDataDir + '/windowBindings.json';

var displayInfo = [];

var parser = new require('xml2js').Parser();

//run the MultiMonitorTool, and parse the XML file.
var refreshDisplayInfoList = (cb)=> {
  if (process.platform === 'win32') {
    exec(`${__dirname}/utils/MultiMonitorTool.exe /sxml ${appDataDir}/displayInfo.xml`, ()=> {
      fs.readFile(`${appDataDir}/displayInfo.xml`, 'utf16le', function (err, data) {
          parser.parseString(data, function (err, result) {
              displayInfo = result.monitors_list && result.monitors_list.item;
              displayInfo.forEach(disp=> {
                //get the hash of the display name, which should match one of the display id's
                disp.hash = require('./utils/hash.js').hash(disp.name[0]);
                disp.id = disp.monitor_serial_number[0] || disp.monitor_id[0];
                //var cur = displays.find(dsp=>dsp.id == disp.hash);
              });
              if (cb) cb(displayInfo);
            });
        });
    });
  } else {
    cb();
  }
};

//create the function that is called by the application when it starts.
function makeWindows() {
  //fetch all of the current displays
  var displays = electron.screen.getAllDisplays();

  var binds = {};
  if (fs.existsSync(DISPLAY_BINDING_PATH)) {
    //read in the window binding file.
    binds = JSON.parse(fs.readFileSync(DISPLAY_BINDING_PATH));

    for (var winLabel in binds) {
      if (binds.hasOwnProperty(winLabel)) {
        //if check each of the bindings listed in the file, to see if they match a window name
        var wind = config.windows.find(wind=>wind.label == winLabel);
        if (wind) {
          //if a window was found with the name from the binding file, set the
          //display ID to the one listed for that window in the binding file.
          wind.displayId = binds[winLabel];
        }
      }
    }
  }

  //make a function that resets all of the windows to their correct locations
  var refixWindows = ()=> {
    //for each window in the application
    config.windows.forEach(win=> {
      if (windows[win.label]) {
        // get all of the current displays,
        refreshDisplayInfoList((disps)=> {
          //match the display from the electron.screen.getAllDisplays() call to a
          // display in the displayInfoList. displayInfoList has more identifying
          //information, so we use that to actually match windows to displays.
          var disp = displays.find(disp=> {
            var dispId = disp.id;
            if (disps) {
              var info = disps.find(dsp=>dsp.hash == disp.id);
              if (info) dispId = info.id;
            }

            return dispId == win.displayId;
          });

          //using the display found in the step above,
          //we set the position, according to the data from the display and
          // the info in the config file about each window.
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

  //for each of the electron-listed displays
  displays.forEach(display=> {

    //pull out the display id
    var monitorID = display.id;

    //if we're on windows, correct the monitorID variable so that it matches the
    // electron-id of the monitor
    if (process.platform === 'win32') {
      var match = displayInfo.find(disp=>display.id == disp.hash);
      if (match) monitorID = match.id;
      console.log(monitorID);
    }

    // if we find a window for 'display'
    if (config.windows.find(wind=>wind.displayId && monitorID == wind.displayId)) {
      config.windows.forEach(wind=> {
        //create the window for that display
        if (monitorID == wind.displayId) createWindowForDisplay(display, wind);
      });
    } else {
      //if we don't find a window for the display, create the window selection
      // interface on that display.
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

  //when we receive an 'interwindow' event from a child window
  ipcMain.on('interwindow', (evt, arg)=> {
    arg.data.from = evt.sender.label;
    arg.data.self = arg.target;
    //forward the message to the window specified in 'target'
    if (windows[arg.target]) windows[arg.target].webContents.send(arg.channel, arg.data);
  });

  //if we receive a shutdown message from a child window,
  ipcMain.on('shutdown', (evt, arg)=> {
    // determine what kind of message it was, and act accordingly.
    if (arg.delay) scheduler.nextEvent().delay([0, 0, 0].concat(arg.delay.map(i=>parseInt(i))));
    else if (arg.setTime) scheduler.nextEvent().setTime(arg.setTime.map(i=>parseInt(i)));
    else if (arg.cancelNext) scheduler.nextEvent().cancelNext();
    else if (arg.now) exec('shutdown /s');
    evt.sender.send('nextShutdown', scheduler.nextEvent().next);
  });

  // if we receive a window-select message (meaing, a message telling us what window a display should have)
  ipcMain.on('window-select', (evt, arg)=> {
    //close the window select interface that sent the message
    var senderId = evt.sender.label;
    windows[senderId].close();

    //get teh reference to the display that sent the message, and the window it's asking for
    var display = displays.find(disp=> disp.id == senderId);
    var wind = config.windows.find(wind=>wind.label == arg.window);

    //get the current display list
    refreshDisplayInfoList((disps)=> {
      if (disps) {
        var match = disps.find(disp=>display.id == disp.hash);
        if (match) senderId = match.id;
      }

      //record the display id for the display
      binds[wind.label] = senderId;

      //and write the bindingFile
      fs.writeFileSync(DISPLAY_BINDING_PATH, JSON.stringify(binds));

      //make the new window for the display
      createWindowForDisplay(display, wind);
    });

  });

  //if we see a display get added to the computer
  electron.screen.on('display-added', (evt, display)=> {
    var monitorID = display.id;
    console.log('Monitor added: ' + monitorID);

    //match the new display to a displayInfo
    refreshDisplayInfoList((disps)=> {
      if (displayInfo) {
        var match = displayInfo.find(disp=>display.id == disp.hash);
        if (match) monitorID = match.id;
      }

      //console.log(monitorID);

      //say what we think the monitor was.
      console.log('I think the added monitor was: ' + monitorID);

      //and make a window for that display, if we find a window for it.
      config.windows.forEach(wind=> {
        if (monitorID == wind.displayId) createWindowForDisplay(display, wind);
      });

    });

    refixWindows();
  });

  //if a diplay is removed from the computer,
  electron.screen.on('display-removed', (evt, display)=> {
    var monitorID = display.id;
    console.log('monitor removed: ' + monitorID);

    //try to find which displayInfo was removed,
    if (displayInfo) {
      var match = displayInfo.find(disp=>display.id == disp.hash);
      if (match) monitorID = match.id;
    }

    console.log('I think the removed monitor was: ' + monitorID);

    //if there was a window on said monitor
    var wind = config.windows.find(win => monitorID == win.displayId);

    //close it.
    if (windows[wind.label]) windows[wind.label].close();

    //and nullify the reference to the window.
    windows[wind.label] = null;

    //make sure teh rest of the windows are in place
    refixWindows();

  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=> {
  //make allthe windows once the app is ready
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
