'use strict';

obtain(['µ/events.js'], ({ Emitter })=> {
  if (!window.muse.sockets) {
    window.muse.sockets = [];
  }

  class SingleSocket extends Emitter {
    constructor(addr) {
      super();

      this.cnxnInterval = null;
      this.timeOffset = 0;
      this.connected = false;

      this.address = addr;

      //this.connect(addr);
    }

    synchronize () {
      var _this = this;
      _this.syncTime = Date.now();
      _this.send({ timeSync: _this.syncTime });
    };

    set onconnect(cb) {
      if (this.connected) cb();
      else this.on('internal:connect', ()=> {
        cb();
      });
    }

    set onclose(cb) {
      this.on('internal:close', ()=> {
        cb();
      });
    }

    set onerror(cb) {
      this.on('internal:error', (data)=> {
        cb(data);
      });
    }

    send(msg) {}

    get serverTime() {
      return Date.now() + _this.timeOffset;
    }

    connect() {
      var _this = this;
      if ('WebSocket' in window) {
        _this.ws = new WebSocket(_this.address);
        _this.ws.onopen = function ()
        {
          clearInterval(_this.cnxnInterval);
          _this.ws.onmessage = function (evt) {
            var data = JSON.parse(evt.data);
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                if (key == 'serverTime') {
                  _this.timeOffset = (2 * data[key] - (_this.syncTime + Date.now())) / 2;
                  let serTime = new Date(Date.now() + _this.timeOffset);
                } else {
                  _this.emit(key, data[key]);
                };
              }
            }
          };

          _this.send = function (obj, data) {
            if (data) obj = { [obj]: data };
            _this.ws.send(JSON.stringify(obj));
          };

          _this.close = ()=> {
            _this.ws.close();
          };

          _this.connected = true;
          _this.emit('internal:connect', _this);
        };

        _this.ws.onerror = function (error) {
          _this.emit('internal:error', error);
          clearInterval(_this.connectInterval);
          _this.connectInterval = setInterval(_this.connect.bind(_this), 2000);
        };

        _this.ws.onclose = function () {
          _this.connected = false;
          _this.ws = null;
          console.log('disconnected');
          _this.emit('internal:close', false);
        };
      } else {
        clearInterval(_this.connectInterval);
        console.log('Websocket not supported');
      }
    }
  };

  exports.get = (addr)=> {
    addr = ((muse.useSSL) ? 'wss://' : 'ws://') + addr;
    var ret = muse.sockets.find(sock=>sock.address == addr);
    if (!ret) {
      ret = new SingleSocket(addr);
      muse.sockets.push(ret);
    }

    return ret;

  };

  provide(exports);
});
