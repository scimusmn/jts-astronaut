obtain(['µ/serialParser.js', 'events'], ({ serialParser }, EventEmitter)=> {
  const DIGI_READ = 1;
  const ANA_READ = 2;
  const DIGI_WRITE = 4;
  const PWM_WRITE = 8;
  const DIGI_WATCH = 16;
  const ANA_REPORT = 32;
  const LIGHT_STRIP = 64;
  const READY = 127;

  ////////// Light strip defines:
  const BEGIN =  1;
  const SHOW =  2;
  const SET_COLOR =  3;

  class Arduino extends EventEmitter{
    constructor(conf) {
      super();
      var _this = this;
      var parser = new serialParser();

      parser.on(DIGI_READ, (data)=> {
        _this.emit('digitalRead', data[0], data[1]);
      });

      parser.on(ANA_READ, (data)=> {
        _this.emit('analogRead', data[0], (data[1] << 7) + data[2]);
      });

      var readyInt;

      parser.onOpen = ()=> {
        parser.sendPacket([1, READY]);
      };

      parser.on(READY, ()=> {
        if (!_this.ready) {
          console.log('Arduino ready');
          clearInterval(readyInt);
          _this.ready = true;
          _this.emit('ready');
        }
      });

      _this.digitalRead = (pin)=> {
        if (pin > 1 && pin < 20) parser.sendPacket([1, DIGI_READ, pin]);
        else console.error('Digital pin out of bounds');
      };

      _this.digitalWrite = (pin, val)=> {
        if (pin > 1 && pin < 20) parser.sendPacket([1, DIGI_WRITE, pin, val]);
        else console.error('Digital pin out of bounds');
      };

      _this.analogWrite = (pin, val)=> {
        var pwmPins = [3, 5, 6, 9, 10, 11];
        if (pwmPins.includes(pin)) parser.sendPacket([1, PWM_WRITE, pin, (val >> 7) & 127, val & 127]);
        else console.error('Pin is not a pwm pin');
      };

      _this.analogRead = (pin)=> {
        if (pin < 6) parser.sendPacket([1, ANA_READ, pin]);
        else console.error('Analog pins must be less than 6');
      };

      _this.analogReport = (pin, int, cb)=> {
        _this.on('analogRead', (which, val)=> {
          if (pin == which) cb(val);
        });

        _this.whenReady(()=> {
          parser.sendPacket([1, ANA_REPORT, pin, (int >> 7) & 127, int & 127]);
        });

      };

      _this.digitalWatch = (pin, cb)=> {
        _this.on('digitalRead', (which, val)=> {
          if (pin == which) cb(val);
        });

        _this.whenReady(()=> {
          parser.sendPacket([1, DIGI_WATCH, pin]);
        });
      };

      _this.lightStrip = {
        begin: (pin, numLEDs)=> {
          parser.sendPacket([1, LIGHT_STRIP, BEGIN, pin, numLEDs]);
        },

        setPixelColor: (num, r, g, b)=> {
          r = Math.floor(r / 2);
          g = Math.floor(g / 2);
          b = Math.floor(b / 2);

          parser.sendPacket([1, LIGHT_STRIP, SET_COLOR, num, r, g, b]);
        },

        show: ()=> {
          parser.sendPacket([1, LIGHT_STRIP, SHOW]);
        },
      };

      _this.whenReady = (cb)=> {
        if (_this.ready) {
          cb();
        } else {
          this.on('ready', cb);
        }
      };

      if (conf.name) parser.setup({ name: conf.name, baud: 115200 });
      else if (conf.manufacturer) parser.setup({ manufacturer: conf.manufacturer, baud: 115200 });

    }

    set onready(cb) {
      //this.on_load = val;
      if (this.ready) {
        cb();
      } else {
        this.on('ready', cb);
      }
    }

  };

  exports.Arduino = Arduino;
});
