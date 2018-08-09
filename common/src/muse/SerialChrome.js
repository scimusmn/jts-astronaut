'use strict';

exports.Serial = function() {
  let bufSize = 512;

  var _this = this;
  let ser = null;
  _this.isOpen = false;
  this.connectionId = null;
  _this.onConnect = () => {};

  _this.onMessage = () => {};

  _this.onPortNotFound = function(ports) {
    console.log('Port not found');
  };

  _this.onListPorts = function(ports) {
    console.log('ListingPorts');
  };

  var arrayToArrayBuffer = function(arr) {
    var buf = new ArrayBuffer(arr.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0; i < arr.length; i++) {
      bufView[i] = arr[i];
    }

    return buf;
  };

  _this.send = (arr) => {
    arr.push(124);
    if (_this.isOpen) {
      //ser.write(new Buffer(arr));
      chrome.serial.send(_this.connectionId, arrayToArrayBuffer(arr), function() {}); //convertStringToArrayBuffer(str + '\n')
    }
  };

  _this.open = (name, fxn) => {
    console.log(name);
    chrome.serial.getDevices(function(ports) {
      _this.onListPorts(ports);
      let found = false;
      ports.forEach(function(port) {
        if (port.path.indexOf(name) > -1) {
          name = port.path;
          found = true;
          _this.openByName(name, fxn);
        }
      });

      if (!found) {
        //_this.openByName(ports[0].path, fxn);
        _this.onPortNotFound(ports);
      }
    });
  };

  var convertArrayBufferToString = function(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  };

  _this.openByName = (portName, fxn) => {
    if (fxn) _this.onMessage = fxn;

    //console.log('Opening serialport ' + portName);
    chrome.serial.connect(portName, { bitrate: 115200 }, function(info) {
      _this.isOpen = true;
      _this.connectionId = info.connectionId;
    });
    /*ser = new com.SerialPort(portName, {
      baudrate: 115200,
      parser: com.parsers.readline('\r\n', 'binary'),
      buffersize:bufSize,
    });*/

    var stringReceived = '';

    var onReceiveCallback = function(info) {
      if (info.connectionId == _this.connectionId && info.data) {
        var str = convertArrayBufferToString(info.data);
        if (str.length && (str.charAt(str.length - 1) === '\n' || str.charAt(str.length - 1) === '\r')) {
          stringReceived += str.substring(0, str.length - 1);

          if (stringReceived.indexOf('init') > -1) _this.onConnect();
          else _this.onMessage(stringReceived);
          stringReceived = '';
        } else if (str.length && str.charAt(str.length - 1) !== '\n' || str.charAt(str.length - 1) !== '\r') {
          stringReceived += str;
        }
      }
    };

    chrome.serial.onReceive.addListener(onReceiveCallback);
  };
};
