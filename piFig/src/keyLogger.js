'use strict';

var fs = require('fs');
var { EventEmitter } = require('events');
//var { execSync } = require('child_process');

var EV_SYN = 0;
var EV_KEY = 1;
var EV_REL = 2;
var EV_ABS = 3;
var EVENT_TYPES = ['keyup', 'keypress', 'keydown'];

var keys = {
  KEY_ESC: 1,
  KEY_1: 2,
  KEY_2: 3,
  KEY_3: 4,
  KEY_4: 5,
  KEY_5: 6,
  KEY_6: 7,
  KEY_7: 8,
  KEY_8: 9,
  KEY_9: 10,
  KEY_0: 11,
  KEY_MINUS: 12,
  KEY_EQUAL: 13,
  KEY_BACKSPACE: 14,
  KEY_TAB: 15,
  KEY_Q: 16,
  KEY_W: 17,
  KEY_E: 18,
  KEY_R: 19,
  KEY_T: 20,
  KEY_Y: 21,
  KEY_U: 22,
  KEY_I: 23,
  KEY_O: 24,
  KEY_P: 25,
  KEY_LEFTBRACE: 26,
  KEY_RIGHTBRACE: 27,
  KEY_ENTER: 28,
  KEY_LEFTCTRL: 29,
  KEY_A: 30,
  KEY_S: 31,
  KEY_D: 32,
  KEY_F: 33,
  KEY_G: 34,
  KEY_H: 35,
  KEY_J: 36,
  KEY_K: 37,
  KEY_L: 38,
  KEY_SEMICOLON: 39,
  KEY_APOSTROPHE: 40,
  KEY_GRAVE: 41,
  KEY_LEFTSHIFT: 42,
  KEY_BACKSLASH: 43,
  KEY_Z: 44,
  KEY_X: 45,
  KEY_C: 46,
  KEY_V: 47,
  KEY_B: 48,
  KEY_N: 49,
  KEY_M: 50,
  KEY_COMMA: 51,
  KEY_DOT: 52,
  KEY_SLASH: 53,
  KEY_RIGHTSHIFT: 54,
  KEY_KPASTERISK: 55,
  KEY_LEFTALT: 56,
  KEY_SPACE: 57,
  KEY_CAPSLOCK: 58,
  KEY_F1: 59,
  KEY_F2: 60,
  KEY_F3: 61,
  KEY_F4: 62,
  KEY_F5: 63,
  KEY_F6: 64,
  KEY_F7: 65,
  KEY_F8: 66,
  KEY_F9: 67,
  KEY_F10: 68,
  KEY_NUMLOCK: 69,
  KEY_SCROLLLOCK: 70,
  KEY_KP7: 71,
  KEY_KP8: 72,
  KEY_KP9: 73,
  KEY_KPMINUS: 74,
  KEY_KP4: 75,
  KEY_KP5: 76,
  KEY_KP6: 77,
  KEY_KPPLUS: 78,
  KEY_KP1: 79,
  KEY_KP2: 80,
  KEY_KP3: 81,
  KEY_KP0: 82,
  KEY_KPDOT: 83,
  KEY_ZENKAKUHANKAKU: 85,
  KEY_102ND: 86,
  KEY_F11: 87,
  KEY_F12: 88,
  KEY_RO: 89,
  KEY_KATAKANA: 90,
  KEY_HIRAGANA: 91,
  KEY_HENKAN: 92,
  KEY_KATAKANAHIRAGANA: 93,
  KEY_MUHENKAN: 94,
  KEY_KPJPCOMMA: 95,
  KEY_KPENTER: 96,
  KEY_RIGHTCTRL: 97,
  KEY_KPSLASH: 98,
  KEY_SYSRQ: 99,
  KEY_RIGHTALT: 100,
  KEY_HOME: 102,
  KEY_UP: 103,
  KEY_PAGEUP: 104,
  KEY_LEFT: 105,
  KEY_RIGHT: 106,
  KEY_END: 107,
  KEY_DOWN: 108,
  KEY_PAGEDOWN: 109,
  KEY_INSERT: 110,
  KEY_DELETE: 111,
  KEY_MUTE: 113,
  KEY_VOLUMEDOWN: 114,
  KEY_VOLUMEUP: 115,
  KEY_POWER: 116,
  KEY_KPEQUAL: 117,
  KEY_PAUSE: 119,
  KEY_KPCOMMA: 121,
  KEY_HANGUEL: 122,
  KEY_HANJA: 123,
  KEY_YEN: 124,
  KEY_LEFTMETA: 125,
  KEY_RIGHTMETA: 126,
  KEY_COMPOSE: 127,
  KEY_STOP: 128,
  KEY_AGAIN: 129,
  KEY_PROPS: 130,
  KEY_UNDO: 131,
  KEY_FRONT: 132,
  KEY_COPY: 133,
  KEY_OPEN: 134,
  KEY_PASTE: 135,
  KEY_FIND: 136,
  KEY_CUT: 137,
  KEY_HELP: 138,
  KEY_F13: 183,
  KEY_F14: 184,
  KEY_F15: 185,
  KEY_F16: 186,
  KEY_F17: 187,
  KEY_F18: 188,
  KEY_F19: 189,
  KEY_F20: 190,
  KEY_F21: 191,
  KEY_F22: 192,
  KEY_F23: 193,
  KEY_F24: 194,
  KEY_UNKNOWN: 240,
};

var keyIndex = [];

for (var key in keys) {
  if (keys.hasOwnProperty(key)) {
    keyIndex[keys[key]] = key;
  }
}

class Keyboards extends EventEmitter {
  constructor() {
    super();

    var _this = this;
    _this.kbds = [];

    _this.states = [];

    fs.watchFile('/proc/bus/input/devices', _this.track.bind(_this));

    _this.track();
  }

  track() {
    let _this = this;
    let data = fs.readFileSync('/proc/bus/input/devices').toString().split('\n');

    let device = {};

    data.forEach(line=> {
      if (line.length) {
        let spl = line.substr(3).split('=');
        for (let i = 0; i < Math.ceil(spl.length / 2); i++) {
          device[spl[i]] = (spl[i + 1] ? spl[i + 1] : '');
        }
      } else {
        if (device.EV && device.EV == '120013') { //'120013'
          let pat = /event\d+/g;
          let which = pat.exec(device.Handlers);
          device.path = `/dev/input/${which}`;
          if (!_this.kbds.find((kbd)=>kbd.Sysfs == device.Sysfs)) {
            console.log(`${device.Name} was found.`);
            var fd = fs.openSync(device.path, 'r');
            device.file = fs.createReadStream(undefined, { fd: fd });
            device.file.on('error', (err)=> {
              console.log(err);
              console.log(`${device.Name} was removed from the system.`);
              _this.kbds.splice(_this.kbds.indexOf(device), 1);
            });
            device.file.on('end', ()=> { console.log('file closed');});
            device.file.on('data', function (data) {
              let count = 0;
              let packSize = (process.arch === 'x64') ? 24 : 16;
              while (count < data.length) {
                let slc = data.slice(count, count + packSize);
                let event = {};
                if (process.arch === 'x64') {
                  event = {
                      timeS: slc.readUInt32LE(0, 8),
                      timeMS: slc.readUIntLE(8, 8),
                      type: slc.readUInt16LE(16),
                      code: slc.readUInt16LE(18),
                      value: slc.readInt32LE(20),
                    };
                } else { // arm or ia32
                  event = {
                      timeS: slc.readUInt32LE(0),
                      timeMS: slc.readUInt32LE(4),
                      type: slc.readUInt16LE(8),
                      code: slc.readUInt16LE(10),
                      value: slc.readInt32LE(12),
                    };
                }

                if (event.type == EV_KEY) {
                  _this.states[event.code] = event.value;
                  _this.emit((event.value == 1) ? 'keydown' : 'keyup', event.code, _this.states);
                }

                count += packSize;
              }
            });

            _this.kbds.push(device);

          }

        }

        device = {};
      }
    });
  }

}

if (!global.keyboards) global.keyboards = new Keyboards();

exports.keyboards = global.keyboards;
