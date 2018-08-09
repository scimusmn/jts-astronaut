obtain(['µ/utilities.js'], (utils)=> {
  var midiAccess = null;

  var inMidi = function() {
    var _this = this;

    var midiIn = null;
    var midiOut = null;

    var noteHandlers = [];

    var noteFunc = (noteNumber, velocity)=> {
      console.log('Note ' + noteNumber + ' set to ' + velocity);
    };

    var ctrlFunc = null;

    _this.setNoteHandler = (cb)=> {
      noteFunc = cb;
    };

    _this.setControlHandler = (cb)=> {
      ctrlFunc = cb;
    };

    _this.devices = null;

    _this.pipe = null;

    _this.addNoteHandler = (note, cb)=> {
      noteHandlers[note] = cb;
    };

    _this.onMessage = (ev)=> {
      var cmd = ev.data[0] >> 4;
      var channel = ev.data[0] & 0xf;
      var noteNumber = ev.data[1];
      var velocity = ev.data[2];

      if (_this.pipe) _this.pipe(ev.data);

      if (channel == 9)
        return;
      if (cmd == 8 || ((cmd == 9) && (velocity == 0))) { // with MIDI, note on with velocity zero is the same as note off
        // note off

        if (noteHandlers[noteNumber]) noteHandlers[noteNumber](0);
        else if (noteFunc) noteFunc(noteNumber, 0);
      } else if (cmd == 9) {
        // note on
        if (noteHandlers[noteNumber]) noteHandlers[noteNumber](velocity);
        else if (noteFunc) noteFunc(noteNumber, velocity);
      } else if (cmd == 11) {
        //controller(noteNumber, velocity / 127.0);
        if (ctrlFunc) ctrlFunc(noteNumber, velocity);
      } else if (cmd == 14) {
        // pitch wheel
        //pitchWheel(((velocity * 128.0 + noteNumber) - 8192) / 8192.0);
        console.log('pitchWheel at ' + velocity);
      } else if (cmd == 10) {  // poly aftertouch
        //polyPressure(noteNumber, velocity / 127);
        console.log('aftertouch on ' + noteNumber + ' at ' + velocity);
      } else
      console.log('' + ev.data[0] + ' ' + ev.data[1] + ' ' + ev.data[2]);
    };

    _this.getDevices = ()=> {
      if (midiAccess) {
        _this.devices = [];
        if (midiIn && midiIn.state == 'disconnected') midiIn = null;
        var tmp = null;

        for (let input of midiAccess.inputs.values()) {
          //console.log(input);
          _this.devices.push(input);
        }
      }
    };

    _this.select = (newIn)=> {
      if (midiIn) midiIn.onmidimessage = null;
      midiIn = newIn;
      if (midiIn) midiIn.onmidimessage = _this.onMessage;
    };

    _this.onStateChange = ()=> {
      _this.getDevices();
    };

    _this.onReady = ()=> {};

    _this.init = ()=> {
      _this.getDevices();

      //if (_this.devices.length > 0)
      //  _this.selectMIDIIn(_this.devices[0]);
      _this.onReady();
    };
  };

  var outMidi = function() {
    var _this = this;

    _this.devices = null;
    _this.onReady = ()=> {};

    _this.send = (dataArray, timestamp = 0)=> {
      if (midiOut) {
        midiOut.send(dataArray, timestamp);
      }
    };

    _this.getDevices = ()=> {
      if (midiAccess) {
        _this.devices = [];

        //if (midiOut && midiOut.state == 'disconnected') midiOut = null;
        var tmp = null;

        for (let output of midiAccess.outputs.values()) {
          //console.log(input);
          _this.devices.push(output);
        }
      }
    };

    _this.select = (newOut)=> {
      //if (midiOut) midiOut.onmidimessage = null;
      midiOut = newOut;

      //if (midiIn) midiIn.onmidimessage = _this.onMessage;
    };

    _this.playNote = (note, vel)=> {
      midiOut.send([(9 << 4), note, vel]);
      console.log('Sending ' + note + ' at ' + vel);
    };

    _this.init = ()=> {
      _this.getDevices();
      _this.onReady();
    };

    _this.onStateChange = ()=> {
      _this.getDevices();
    };
  };

  exports.in = new inMidi();
  exports.out = new outMidi();

  function midiConnectionStateChange(e) {
    console.log('connection: ' + e.port.name + ' ' + e.port.connection + ' ' + e.port.state);

    //getMIDIInDevices();

    exports.in.onStateChange(e);
    exports.out.onStateChange(e);
  }

  function onMIDIStarted(midi) {
    console.log('midi started');
    var preferredIndex = 0;

    midiAccess = midi;

    midi.onstatechange = midiConnectionStateChange;

    exports.in.init();
    exports.out.init();
  }

  function onMIDISystemError(err) {
    console.log('MIDI not initialized - error encountered:' + err.code);
  }

  //init: start up MIDI

  if (navigator.requestMIDIAccess) {
    var prm = navigator.requestMIDIAccess();
    prm.then(onMIDIStarted, onMIDISystemError);
  } else {
    console.log('requestMIDIAccess not available');
  }

  provide(exports);
});
