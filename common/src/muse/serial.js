'use strict';

obtain(['serialport'], (com)=> {
  exports.Serial = function (delim = '\r\n') {

    //const parser = new com.parsers.Regex({ regex: /[\r\n]+/ });
    //const parser = new com.parsers.ByteLength({ length: 8 });
    const parser = new com.parsers.Delimiter({ delimiter: delim });

    var _this = this;
    let ser = null;
    _this.isOpen = false;
    _this.onOpen = () => {};

    _this.onMessage = () => {console.log('test');};

    _this.onPortNotFound = function (ports) {
      console.log('Port not found');
    };

    _this.write = (str)=> {
      if (_this.isOpen) ser.write(str);
    };

    _this.send = (arr) => {
      if (_this.isOpen) ser.write(new Buffer(arr));
    };

    var openByName = (portName, baud) => {
      console.log('Opening serialport ' + portName);
      ser = new com(portName, {
        baudRate: baud,
      });

      /*let Pass = require('stream').PassThrough;

      let b = Pass();

      b.on('data', function (data) {
        console.log('b1:', data);
      });

      ser.pipe(b);*/
      ser.pipe(parser);

      parser.on('data', function (data) {
        _this.onMessage(data);
      });

      ser.on('open', function () {
        _this.isOpen = true;
        _this.onOpen();
      });

      ser.on('error', function () {
        console.log('Error from SerialPort');
      });
    };

    _this.open = (props) => {
      var name = null;
      com.list(function (err, ports) {
        ports.forEach(function (port) {
          console.log(port);
          if (port.comName.includes(props.name) ||
              (port.manufacturer && props.manufacturer &&
              port.manufacturer.toLowerCase() == props.manufacturer.toLowerCase()) ||
              (port.serialNumber && port.serialNumber == props.serialNumber)
            ) name = port.comName;
        });

        if (!name) _this.onPortNotFound(ports);
        else openByName(name, props.baud);
      });
    };

  };

  provide(exports);
});
