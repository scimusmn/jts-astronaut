'use strict';

////////////////////////////////////////////////
//  custom elements
////////////////////////////////////////////////

// create the elements used for hardware input

obtain(['µ/Arduino', 'µ/utilities.js'], (ard, utils)=> {
  var Arduino = ard.Arduino;
  class Input extends HTMLElement{
    constructor() {
      super();
    }

    init() {
      var _this = this;
      _this.readTO = null;

      //grab the type and pin attributes
      this.type = µ('|>type', this);
      this.pin = µ('|>pin', this);
      if (this.type == 'analog') {
        this.raw = 0;
        this.min = this.getAttribute('low');
        this.max = this.getAttribute('hi');
        this.report = parseInt(this.getAttribute('report'));
        var result = this.getAttribute('result');
        if (result && result.length > 1) {
          result = result.split('.');
          this.target = document.querySelector(result[0]);
          this.which = result[1];
        }
      } else if (this.type == 'digital') {
        var result = this.getAttribute('result');
        if (result) {
          result = result.split('.');
          this.target = document.querySelector(result[0]);
          this.which = result[1];
        }

        this.debounce = 0;
        this.hit = false;
        var temp = this.getAttribute('debounce');
        if (temp) this.debounce = parseInt(temp);
      }

      console.log('Type is ' + this.getAttribute('type'));
    }

    connectedCallback() {

    }

    //default
    onData(val) {
      console.log('Handler function not yet initialized');
    };

    read() {
      var _this = this;
      var p = _this.parentElement.arduino;
      if (p.ready) {
        _this.readTO = setTimeout(_this.onError, 1000);
        if (_this.type == 'analog') p.analogRead(_this.pin);
        else p.digitalRead(_this.pin);
      }
    }

    onError() {
      console.log('Did not hear back about read on ' + this.pin);
    }
  }

  customElements.define('in-put', Input);

  // create the elements used for hardware output

  class Output extends HTMLElement {
    constructor() {
      super();
    }

    init() {
      this.outputTO = null;
      this.type = this.getAttribute('type');
      this.pin = this.getAttribute('pin');
      this.mode = (this.type == 'analog');
    }

    connectedCallback() {

    }

    onError() {
      if (this.pin) console.log("haven't heard about " + this.pin);
    }

    onData() {
      if (this.pin) console.log('Heard about the write on ' + this.pin);
    }

    write(val) {
      this.state = val;
      this.outputTO = setTimeout(this.onError, 500);
      if (this.mode) this.parentElement.arduino.analogWrite(this.pin, val);
      else this.parentElement.arduino.digitalWrite(this.pin, val);
    }
  }

  //document.registerElement('out-put', outPut);
  customElements.define('out-put', Output);

  /////////////////////////////////////////////////////////////
  // create the hard-ware tag. inherit the functions from the arduino,
  // in order to send the control information to the arduino.
  /////////////////////////////////////////////////////////////

  class Hardware extends HTMLElement {
    constructor() {
      super();

      var _this = this;

      _this.arduino = new Arduino();
    }

    onReady() {}

    begin(noPortCB) {
      var _this = this;
      console.log('The port is ' + _this.port);
      _this.arduino.serial.onPortNotFound = noPortCB;
      _this.arduino.connect(_this.port, ()=> {
        _this.init();
      });
    };

    init() {
      var _this = this;
      console.log('initializing hardware...');
      this.ready = true;
      this.onReady();
      var inputs = [].slice.call(this.querySelectorAll('in-put'));
      inputs.forEach(function(item, i, arr) {
        item.init();
        if (item.type === 'analog') {
          //create the handler function to parse the data
          function handle(pin, val) {
            item.raw = val;
            if (item.min && item.max) val = utils.map(val, item.min, item.max, 0, 1);
            if (!item.target) item.onData(val);
            else item.target[item.which](val);
          }

          //if the pin is set to report, init the report, otherwise, set the handler
          if (item.report) _this.arduino.analogReport(item.pin, item.report, handle);
          else _this.arduino.setHandler(item.pin, handle);

        } else if (item.type === 'digital') {
          _this.arduino.watchPin(item.pin, function(pin, val) {
            if (!item.hit) {
              clearTimeout(item.readTO);
              if (!item.target) item.onData(val);
              else item.target[item.which](val);

              if (item.debounce) {
                item.hit = true;
                item.dbTimer = setTimeout(function() {item.hit = false; }, item.debounce);
              }

            }
          });
        }
      });

      var outputs = [].slice.call(this.querySelectorAll('out-put'));
      outputs.forEach(function(item, i, arr) {
        item.init();
        _this.arduino.setHandler(item.pin, (pin, val)=> {
          clearTimeout(item.outputTO);
          item.onData(val);
        });
      });
    };

    onConnect() {};

    connectedCallback() {
      var _this = this;

      _this.port = µ('|>serialport', this);

    }
  }

  customElements.define('hard-ware', Hardware);
  exports.hardware = Hardware;

  provide(exports);
});
