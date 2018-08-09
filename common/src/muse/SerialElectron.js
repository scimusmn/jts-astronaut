'use strict';

obtain(['serialport'], (com)=> {
  exports.Serial = function() {
    let bufSize = 512;

    var _this = this;
    let ser = null;

    _this.endBit = 124;

    _this.isOpen = false;
    _this.onConnect = () => {};

    _this.onMessage = () => {};

    _this.onPortNotFound = function(ports) {
      console.log('Port not found');
    };

    _this.send = (arr) => {
      arr.push(_this.endBit);
      if (_this.isOpen) ser.write(new Buffer(arr));
    };

    _this.open = (name, fxn) => {
      if (name[0] != '/')
        com.list(function(err, ports) {
          let found = false;
          ports.forEach(function(port) {
            if (port.comName.indexOf(name) > -1) {
              name = port.comName;
              found = true;
              _this.openByName(name, fxn);
            }
          });

          if (!found) _this.onPortNotFound(ports);
        });

      else _this.openByName(name, fxn);
    };

    _this.openByName = (portName, fxn, baud = 115200) => {
      if (fxn) _this.onMessage = fxn;
      console.log('Opening serialport ' + portName);
      ser = new com(portName, {
        baudrate: baud,
        parser: com.parsers.readline('\r\n', 'binary'),
        buffersize:bufSize,
      });

      ser.on('open', function() {
        _this.isOpen = true;
        ser.on('data', function(data) {
          if (data == 'init') _this.onConnect();
          _this.onMessage(data);
        });

      });

      ser.on('error', function() {
        console.log('Error from SerialPort');
      });
    };
  };

  provide(exports);
});
