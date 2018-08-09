'use strict';

obtain(['µ/socket.js', 'µ/events.js'], (socket, { Emitter })=> {

  var signal = null;
  var hostInfo = null;

  if (!window.muse.peers) {
    window.muse.peers = [];

    window.muse.peerManager = new Emitter();
  }

  exports.init = (sig, host)=> {
    signal = sig;
    hostInfo = host;

    signal.addListener('cnxn:description', (data)=> {
      var peer = muse.peers.find(per=>per.id == data.from);
      if (!peer) {
        peer = new Peer({ remoteId: data.from, isClient: true });
        muse.peers.push(peer);
        muse.peerManager.emit('internal:new', peer);
      }

      peer.handleRemoteDescription(data);
    });
  };

  exports.connecting = ()=>!muse.peer.reduce((acc, peer)=>peer != 'checking' && acc, true);

  exports.onPeerAdded = (cb)=> {
    muse.peerManager.on('internal:new', cb);
  };

  exports.onPeerConnect = (cb)=> {
    muse.peerManager.on('internal:connect', cb);
  };

  exports.onPeerDisconnect = (cb)=> {
    muse.peerManager.on('internal:disconnect', (which)=> {
      cb(which);
    });
  };

  var onDisconnect = (which)=> {
    muse.peerManager.emit('internal:disconnect', which);
    muse.peers = muse.peers.filter(peer=>peer.id != which.id);
  };

  exports.getPeer = (data)=> {
    var peer = muse.peers.find(per=>per.id == data.remoteId);
    if (!peer) {
      peer = new Peer({ remoteId: data.remoteId, isClient: data.passive });
      muse.peers.push(peer);
    }

    return peer;
  };

  var configuration = {
    iceServers: [{
      urls: 'stun:stun2.l.google.com:19302',
    }, {
      url: 'turn:numb.viagenie.ca',
      credential: 'RTCBook!',
      username: 'ajhg.pub@gmail.com',
    },],
  };

  class Peer extends Emitter {
    constructor(info) {
      super();

      var _this = this;
      _this.cnxn = new RTCPeerConnection(configuration);
      if (!info.isClient) _this.channel = _this.cnxn.createDataChannel(info.remoteId);
      _this.id = info.remoteId;

      _this.setupConnection();
      if (_this.channel) _this.configureChannel();
    }

    connect() {
      this.cnxn.createOffer().then(this.handleLocalDescription.bind(this))
      .catch(this.logError.bind(this));
    };

    logError(error) {
      this.emit('internal:error', error);
    }

    close() {
      if (this.channel) this.channel.close();
    }

    get state() {
      return this.cnxn.iceConnectionState;
    }

    handleLocalDescription (desc) {
      var _this = this;
      _this.cnxn.setLocalDescription(desc)
        .then(()=> {
          signal.send('cnxn:description', {
            //from: signal.id,
            to: _this.id,
            hostInfo: hostInfo,
            sdp: _this.cnxn.localDescription,
          });
        })
        .catch(_this.logError.bind(_this));
    };

    handleRemoteDescription(data) {
      var _this = this;
      if (data.from == _this.id) {
        if (data.hostInfo) _this.info = data.hostInfo;
        _this.cnxn.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(()=> {
          // if we received an offer, we need to answer
          if (_this.cnxn.remoteDescription.type == 'offer') {
            _this.cnxn.createAnswer().then(_this.handleLocalDescription.bind(_this))
            .catch(_this.logError.bind(_this));
          }
        })
        .catch(_this.logError.bind(_this));
      }
    };

    setupConnection() {
      var _this = this;
      _this.cnxn.ondatachannel = (event)=> {
        _this.channel = event.channel;
        _this.configureChannel();
      };

      _this.cnxn.oniceconnectionstatechange = ()=> {
        console.log(_this.cnxn.iceConnectionState);
        if (_this.cnxn.iceConnectionState == 'connected') {
          //connected
        }else if (_this.cnxn.iceConnectionState == 'failed' && !_this.connected) {
          muse.log('failed to find candidates, reverting to backup');
          _this.useSignal = true;
          _this.connected = true;
          _this.configureChannel();
        } else if (_this.cnxn.iceConnectionState == 'disconnected') {
          onDisconnect(_this);
          _this.emit('internal:close', false);
        }
      };

      _this.cnxn.onicecandidate = (evt)=> {
        if (evt.candidate) {
          signal.send('cnxn:candidate', {
            to: _this.id,
            candidate: evt.candidate,
          });
        }
      };

      signal.on('cnxn:candidate', (data)=> {
        if (data.from == _this.id) {
          _this.cnxn.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });
    }

    configureChannel() {
      var _this = this;
      if (!_this.useSignal) {
        _this.channel.onopen = ()=> {
          _this.connected = true;
          _this.emit('internal:connect',  _this);
          muse.peerManager.emit('internal:connect', _this);
        };

        _this.channel.onclose = ()=> {
          onDisconnect(_this);
          _this.emit('internal:close', false);
        };

        _this.channel.onmessage = function (evt) {
          var data = JSON.parse(evt.data);
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              _this.emit(key,  data[key]);
            }
          }
        };

        _this.send = (msg, data)=> {
          if (typeof msg == 'string') msg = { [msg]: data };
          _this.channel.send(JSON.stringify(msg));
        };

      } else {

        _this.send = (data)=> {
          signal.send('cnxn:relay', {
            to: _this.id,
            data: data,
          });
        };

        signal.on('cnxn:relay', (data)=> {
          if (data.from == _this.id) {
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                _this.emit(key, data[key]);
              }
            }
          }
        });

        _this.connected = true;
        _this.emit('internal:connect', _this);
      }
    }

    set whenConnected(cb) {
      if (this.connected) cb();
      else this.once('internal:connect', cb);
    }

    set onconnect(cb) {
      if (this.connected) cb();
      else this.once('internal:connect', cb);
    }

    set onclose(cb) {
      this.on('internal:close', cb);
    }

    set onconnectionerror(cb) {
      this.on('internal:error', cb);
    }
  }

  // var createPeer = (info)=> {
  //   var nCnxn = new RTCPeerConnection(configuration);
  //   var chan = (info.isClient) ? null : nCnxn.createDataChannel(info.remoteId);
  //   var peer = {
  //     cnxn: nCnxn,
  //     channel: chan,
  //     id: info.remoteId,
  //   };
  //   muse.peers.push(peer);
  //
  //   peer.onConnect = ()=> {};
  //
  //   peer.onClose = ()=> {};
  //
  //   peer.listeners = {};
  //
  //   peer.addListener = (evt, cb)=> {
  //     peer.listeners[evt] = cb;
  //   };
  //
  //   return peer;
  // };
  //
  // var dataChannel = function (signal, hostInfo) {
  //   muse.log('beginning channel monitor');
  //   var _this = this;
  //
  //   _this.find = (key, val)=>muse.peers.find(per=>per[key] == val);
  //
  //   //{cnxn: , channel: , id: }
  //
  //   //this.cnxn = new RTCPeerConnection(configuration);
  //
  //   _this.onPeerConnect = (peer)=> {
  //
  //   };
  //
  //   _this.prepareConnection = (remoteId)=> {
  //     var peer = muse.peers.find(per=>per.id == remoteId);
  //     if (!peer) {
  //       peer = createPeer({ remoteId: remoteId, isClient: true });
  //       setupConnection(peer);
  //     }
  //
  //     return peer;
  //   };
  //
  //   var configureChannel = (peer)=> {
  //     if (!peer.useSignal) {
  //
  //       peer.channel.onopen = ()=> {
  //         console.log('opening channel');
  //         peer.onConnect();
  //
  //         console.log('calling onPeerConnect');
  //         _this.onPeerConnect(peer);
  //       };
  //
  //       peer.channel.onclose = ()=> {
  //         peer.onClose();
  //         //_this.peers = _this.peers.filter(per=>per.id != peer.id);
  //       };
  //
  //       peer.channel.onmessage = function (evt) {
  //         var data = JSON.parse(evt.data);
  //         for (var key in data) {
  //           if (data.hasOwnProperty(key)) {
  //             if (key in peer.listeners) peer.listeners[key](data[key], data);
  //           }
  //         }
  //       };
  //
  //       peer.send = (msg, data)=> {
  //         if (typeof msg == 'string') msg = { [msg]: data };
  //         peer.channel.send(JSON.stringify(msg));
  //       };
  //     } else {
  //
  //       peer.send = (data)=> {
  //         signal.send('cnxn:relay', {
  //           to: peer.id,
  //           //from: signal.id,
  //           data: data,
  //         });
  //       };
  //
  //       peer.onConnect();
  //     }
  //   };
  //
  //   var setupConnection = (peer)=> {
  //     peer.cnxn.ondatachannel = (event)=> {
  //       peer.channel = event.channel;
  //       configureChannel(peer);
  //     };
  //
  //     peer.cnxn.oniceconnectionstatechange = ()=> {
  //       console.log(peer.cnxn.iceConnectionState);
  //       if (peer.cnxn.iceConnectionState == 'connected') {
  //         peer.connected = true;
  //       }else if (peer.cnxn.iceConnectionState == 'failed' && !peer.connected) {
  //         muse.log('failed to find candidates, reverting to backup');
  //         peer.useSignal = true;
  //         peer.connected = true;
  //         configureChannel(peer);
  //       }
  //     };
  //
  //     peer.cnxn.onicecandidate = (evt)=> {
  //       if (evt.candidate) {
  //         signal.send('cnxn:candidate', {
  //           //from: signal.id,
  //           to: peer.id,
  //           candidate: evt.candidate,
  //         });
  //       }
  //     };
  //
  //   };
  //
  //   _this.connect = (remoteId)=> {
  //     var peer = muse.peers.find(per=>per.id == remoteId);
  //     if (!peer) {
  //       var newPeer = createPeer({ remoteId: remoteId });
  //       setupConnection(newPeer);
  //
  //       configureChannel(newPeer);
  //
  //       newPeer.cnxn.createOffer().then((desc)=> {
  //         return localDesc(desc, newPeer);
  //       }).catch(logError);
  //
  //       return newPeer;
  //     } else return peer;
  //   };
  //
  //   function logError(error) {
  //     muse.log(error.name + ': ' + error.message);
  //   }
  //
  //   var localDesc = (desc, peer)=> {
  //     peer.cnxn.setLocalDescription(desc)
  //       .then(()=> {
  //         signal.send('cnxn:description', {
  //           //from: signal.id,
  //           to: peer.id,
  //           hostInfo: hostInfo,
  //           sdp: peer.cnxn.localDescription,
  //         });
  //       })
  //       .catch(logError);
  //   };
  //
  //   signal.addListener('cnxn:relay', (data)=> {
  //     var peer = muse.peers.find(per=>per.id == data.from);
  //     if (peer) {
  //       for (var key in data) {
  //         if (data.hasOwnProperty(key)) {
  //           if (key in peer.listeners) peer.listeners[key](data[key], data);
  //         }
  //       }
  //     }
  //
  //   });
  //
  //   signal.addListener('cnxn:description', (data)=> {
  //     var peer = muse.peers.find(per=>per.id == data.from);
  //     console.log('got remote session description:');
  //     if (!peer) {
  //       peer = createPeer({ remoteId: data.from, isClient: true });
  //       setupConnection(peer);
  //     }
  //
  //     if (data.hostInfo) peer.info = data.hostInfo;
  //     peer.cnxn.setRemoteDescription(new RTCSessionDescription(data.sdp))
  //     .then(()=> {
  //       // if we received an offer, we need to answer
  //       if (peer.cnxn.remoteDescription.type == 'offer') {
  //         console.log('creating answer');
  //         peer.cnxn.createAnswer().then((desc)=> {
  //           return localDesc(desc, peer);
  //         }).catch(logError);
  //       }
  //     })
  //     .catch(logError);
  //
  //   });
  //
  //   signal.addListener('cnxn:candidate', (data)=> {
  //     var peer = muse.peers.find(per=>per.id == data.from);
  //     if (peer) {
  //       muse.log(data.candidate);
  //       peer.cnxn.addIceCandidate(new RTCIceCandidate(data.candidate));
  //     }
  //
  //   });
  //
  // };
  //
  // exports.DataChannel = dataChannel;
  //
  // exports.

  provide(exports);
});
