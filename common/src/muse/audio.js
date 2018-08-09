obtain([], function() {
  var synth = function(which) {
    var _this = this;
    var audio = new window.AudioContext();

    //create the oscillator, volume control and stereo panning
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    var panNode = audio.createStereoPanner();

    //to customize the wave form, use the following
    /*var real = new Float32Array([0, 1, .5, 0, -.5, -1]);
    var imag = new Float32Array([0, 1, .5, 0, -.5, 0]);

    var wave = audio.createPeriodicWave(real, imag);

    osc.setPeriodicWave(wave)*/;

    //set the initial frequency
    osc.frequency.value = 50;

    //osc.type = 'sawtooth';

    //initialize the volume to 100%
    gain.gain.value = 1;

    //sets the pan of the channel
    panNode.pan.value = ((which == 'left') ? -1 : 1);

    //chain the oscillator to the volume control to the panner, to the output,
    // and being the oscillator
    osc.connect(gain);
    gain.connect(panNode);
    panNode.connect(audio.destination);
    osc.start(0);

    this.rampTimer;
    this.eVolume = 1;
    this.volume = 1;
    this.volScale = 1;
    this.muted = false;

    //function to ramp the volume to a new value. Prevents scaring people
    // if the volume was left all the way up and the sound timed out.
    this.rampVolume = function(vol) {
      if (Math.abs(_this.eVolume - vol) > .01) {
        //console.log(_this.eVolume);
        _this.eVolume += sign(vol - _this.eVolume) * .01;
        gain.gain.value = _this.eVolume * _this.volScale;
        clearTimeout(_this.rampTimer);
        _this.rampTimer = setTimeout(function() {_this.rampVolume(vol);}, 1);
      } else gain.gain.value = vol * _this.volScale;
    };

    //return the current volume setting
    this.getVolume = function() {
      return _this.eVolume;
    };

    this.setVolume = function(vol) {
      _this.volume = vol;
      gain.gain.value = _this.volume;
    };

    // ramp the volume down and mute.
    this.mute = function() {
      this.muted = true;
      this.rampVolume(0);
    };

    // return the volume to it's previous setting.
    this.unmute = function() {
      this.muted = false;
      this.rampVolume(this.volume);
    };

    //directly set the frequency, without any volume compensation on the high end
    this.setFrequency = function(freq) {
      osc.frequency.value = freq;
    };

    this.getFrequency = function() {
      return osc.frequency.value;
    };

    this.changeFrequency = function(val, octSize) {
      //this sets the frequency to drop to zero in the first division,
      //but be based on 50 hz otherwise.
      var base = (val > octSize) ? 50 : 50. * val / octSize;

      //make the freq jump an octave every division.
      var targFreq = base * Math.pow(2, (val / octSize)) / 2;

      //restrict freq to 6400hz max
      targFreq = Math.floor(clamp(targFreq, 0, 6400));

      //scale the volume as frequency increases, so it isn't totally obnoxious.
      this.volScale = Math.pow(50. / targFreq, .8);
      if (this.volScale > 1) this.volScale = 1;

      if (!this.muted) gain.gain.value = this.volume * this.volScale;
      else this.unmute(), console.log('unmuted!');

      this.setFrequency(targFreq);
    };
  };

  exports.audio = {
    left: new synth('left'),
    right: new synth('right'),
  };

  window.synth = synth;
  provide(exports);
});
