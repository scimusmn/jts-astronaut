obtain([], ()=> {
  exports.MuseControl = function (address) {
    var _this = this;

    var listeners = {};
    this.address = ((muse.useSSL) ? 'wss://' : 'ws://') + address;
    this.connectInterval = null;
    var ws = null;

    _this.timeOffset = 0;
    _this.connected = false;

    /*_this.synchronize = ()=> {
      var data = { time: Date.now() };
      post('http://' + address + '/timeSync', data).then((resp)=> {
        this.timeOffset = (2 * resp.serverTime - (data.time + Date.now())) / 2;
      }, (error)=> {
        console.log('Could not sync with server');
        this.timeOffset = 0;
      });
    };*/

    _this.synchronize = ()=> {
      _this.syncTime = Date.now();
      _this.send({ timeSync: _this.syncTime });
    };

    this.onMessage = function (evt) {};

    this.addListener = (evt, cb)=> {
      listeners[evt] = cb;
    };

    this.setId = (_id)=> {
      _this.id = _id;
      if (_this.send) _this.send({ _id: _id });
    };

    this.onConnect = function () {};

    this.send = function (msg) {};

    this.getServerTime = ()=>Date.now() + _this.timeOffset;

    this.connect = function () {
      if ('WebSocket' in window) {
        ws = new WebSocket(_this.address);
        ws.onopen = function ()
        {
          // Web Socket is connected, send data using send()
          clearInterval(_this.connectInterval);
          ws.onmessage = function (evt) {
            var data = JSON.parse(evt.data);
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                if (key == 'serverTime') {
                  _this.timeOffset = (2 * data[key] - (_this.syncTime + Date.now())) / 2;
                  let serTime = new Date(Date.now() + _this.timeOffset);
                  // /console.log('Server time is ' + serTime.toLocaleString());
                } else if (key in listeners) listeners[key](data[key], data);
              }
            }
          };

          _this.send = function (obj, data) {
            if (data) obj = { [obj]: data };
            ws.send(JSON.stringify(obj));
          };

          _this.close = ()=> {
            ws.close();
          };

          if (!_this.connected) _this.onConnect();

          _this.synchronize();
          if (_this.id) _this.send({ _id: _this.id });
          _this.connected = true;
        };

        ws.onerror = function (error) {
          if ('WebSocket' in window) {
            clearInterval(_this.connectInterval);
            _this.connectInterval = setInterval(_this.connect.bind(_this), 2000);
          }
        };

        ws.onclose = function () {
          _this.connected = false;
          console.log('disconnected');
          /*clearInterval(_this.connectInterval);
          _this.connectInterval = setInterval(_this.connect, 2000);*/
        };
      }    else {
        clearInterval(_this.connectInterval);
        console.log('Websocket not supported');
      }
    };
  };

  provide(exports);
});
