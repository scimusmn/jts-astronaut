
obtain(['µ/serial.js'], (ser)=> {

  const START_FLAG = 128;
  const STOP_FLAG = 0;
  const REPORT = 126;
  const BROADCAST = 127;

  // function for doing error checked serial communication
  exports.serialParser = function () {
    var _this = this;
    var serial = new ser.Serial(Buffer.from([START_FLAG + STOP_FLAG]));

    var errCheck = (data)=> {
      let tot = 0;
      for (let i = 0; i < data.length - 1; i++) {
        tot += data[i];
      }

      return ((tot & 0b01111111) == data[data.length - 1]);
    };

    _this.sendPacket = (arr, print)=> {
      arr[0] |= 0b10000000;
      arr.push(arr.reduce((acc, val)=>acc + val, 0) & 0b01111111);
      arr.push(START_FLAG + STOP_FLAG);
      // console.log('----------------- Sent ---------------');
      if (print) console.log(arr);
      serial.send(arr, print);
    };

    var commandCB = [];

    _this.on = (cmd, cb)=> {
      commandCB[cmd] = cb;
    };

    serial.onMessage = (data)=> {
      if (errCheck(data)) {
        let addr = data[0] & 0b01111111;
        let cmd = data[1];

        if (commandCB[cmd]) commandCB[cmd](data.slice(2));
      } else {
        var str = data.toString().substr(1);
        if (str.toLowerCase().includes('error')) console.error(str);
        else console.log(str);
      }
    };

    _this.onOpen = ()=> {};

    serial.onOpen = () => {
      _this.onOpen();

    };

    _this.setup = (opts)=> {
      serial.open(opts);
    };

  };
});
