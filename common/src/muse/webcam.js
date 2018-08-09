//object to initialize webcam usage;
//////////////////////////////////////////////////////
// Extending native elements not implemented using customElements as of 5/17
//////////////////////////////////////////////////////

//var webCam = inheritFrom(HTMLVideoElement, function() {
/*if (!customElements.get('web-cam')) {
  class Webcam extends HTMLVideoElement {
    constructor() {
      super();

      console.log('Webcam id is ' + this.id);
    }

    start() {
      var _this = this;

      // Get specific vendor methods: this takes care of naming for Firefox, Chrome, and IE
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

      // If browser supports user media
      if (navigator.getUserMedia) {
        navigator.getUserMedia({ video: true, toString: function() { return 'video'; } },

  				function successCallback(stream) {
    if (navigator.getUserMedia == navigator.mozGetUserMedia) {
      _this.src = stream;									//set the video source to the stream if on Firefox
    } else {
      _this.src = window.URL.createObjectURL(stream) || stream; //else, set it to the blob of the stream
    }

    _this.play();		//autoplay the video on success
  				}, function errorCallback(error) {

    alert('An error ocurred getting user media. Code:' + error.code);
  				}
        );
      } else {
        alert('Your browser does not support user media');
      }
    };

    stop() {
      this.src = '';
    };

    connectedCallback() {
      this.startCam();
    };
  }

  customElements.define('web-cam', Webcam, { extends: 'video' });
}

exports.Webcam = customElements.get('web-cam');*/

if (!customElements.get('web-cam')) {
  var webCam = inheritFrom(HTMLVideoElement, function() {
    this.img = document.createElement('video');//document.getElementById('cam');  //grab the video element named "cam"

    this.startCam = function() {
      var _this = this;

      // Get specific vendor methods: this takes care of naming for Firefox, Chrome, and IE
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

      // If browser supports user media
      if (navigator.getUserMedia) {
        navigator.getUserMedia({ video: true, toString: function() { return 'video'; } },

  				function successCallback(stream) {
    if (navigator.getUserMedia == navigator.mozGetUserMedia) {
      _this.src = stream;									//set the video source to the stream if on Firefox
    } else {
      _this.src = window.URL.createObjectURL(stream) || stream; //else, set it to the blob of the stream
    }

    _this.play();		//autoplay the video on success
  				},

  				function errorCallback(error) {
    alert('An error ocurred getting user media. Code:' + error.code);
  				});
      } else {
        //Browser doesn't support user media
        alert('Your browser does not support user media');
      }

    };

    this.stopCam = function() {
      this.src = '';
    };

    this.createdCallback = function() {
      this.startCam();
    };
  });

  window.Webcam = document.registerElement('web-cam', { prototype: webCam.prototype, extends: 'video' });
}

exports.Webcam = window.Webcam
