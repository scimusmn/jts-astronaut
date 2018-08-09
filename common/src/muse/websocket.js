obtain([], ()=> {
  var websocket = function() {
    console.log(window.location.host.substring(0, window.location.host.lastIndexOf(':')));
    this.address = 'ws://' + window.location.host.substring(0, window.location.host.lastIndexOf(':')) + ':8080/';
    this.connectInterval = null;
    this.serialport = '';
    var ws = null;
    this.onMessage = function(evt) {};

    this.onConnect = function() {};

    this.send = function(msg) {};

    this.connect = function() {
      var _this = this;
      if ('WebSocket' in window) {
        ws = new WebSocket(this.address);
        ws.onopen = function()
        {
          // Web Socket is connected, send data using send()
          clearInterval(_this.connectInterval);
          _this.onConnect();
          ws.onmessage = function(evt) {
            _this.onMessage(evt);
          };
        };

        ws.onerror = function(error) {
          //if ('WebSocket' in window) _this.connectInterval = setInterval(_this.connect.bind(_this),2000);
        };

        ws.onclose = function() {
          //_this.connectInterval = setInterval(_this.connect.bind(_this),2000);
        };

        this.send = function(msg) {
          ws.send(msg);
        };
      }    else {
        clearInterval(_this.connectInterval);
        console.log('Websocket not supported');
      }
    };
  };

  if (!window.wsClient) window.wsClient = new websocket();

  exports.wsClient = window.wsClient;
});
