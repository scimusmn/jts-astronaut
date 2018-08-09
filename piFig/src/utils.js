obtain(['fs', 'child_process', 'os'], (fs, { spawn }, os)=> {
  exports.copyConfigFile = (src, dest, fillObj)=> {
    var orig = fs.readFileSync(src).toString();
    for (var key in fillObj) {
      if (fillObj.hasOwnProperty(key)) {
        orig = orig.replace(new RegExp('\\${' + key + '}', 'g'), fillObj[key]);
      }
    }

    fs.writeFileSync(dest, orig);
  };

  exports.getIpAddress = ()=> {
    var addresses = [];

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address);
        }
      }
    }

    return addresses;
  };

  exports.call = function (cmd) {
    var _this = this;
    _this.command = cmd;
    _this.running = false;
    var args = [];

    _this.addArgument = (str) => {
      args.push(str);
      return _this;
    };

    _this.setArguments = (argarray) => {
      args = argarray;
    };

    _this.outHandler = (data)=> {
      console.log(`stdout: ${data}`);
    };

    _this.errHandler = (data)=> {
      console.log(`stderr: ${data}`);
    };

    _this.onClose = ()=> {};

    _this.run = () => {
      _this.running = true;
      let proc = spawn(_this.command, args);
      proc.stdout.on('data', (data)=> {
        _this.outHandler(data);
      });

      proc.stderr.on('data', (data)=> {
        _this.errHandler(data);
      });

      proc.on('exit', (code)=> {
        _this.running = false;
        _this.onClose();
      });
    };
  };
});
