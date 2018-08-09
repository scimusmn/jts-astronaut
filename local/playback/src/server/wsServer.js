obtain(['ws'], ({ Server })=> {
  if (!window.wsServer) {
    window.wsServer = new Server({ port: 8080 });
    var webSock = null;

    wsServer.broadcast = function (data) {
      wsServer.clients.forEach(function each(client) {
        client.send(data);
      });
    };

    wsServer.orderedClients = [];

    var listeners = {};

    wsServer.addListener = (evt, cb)=> {
      listeners[evt] = cb;
    };

    wsServer.send = (_id, obj)=> {
      wsServer.orderedClients[_id].send(JSON.stringify(obj));
    };

    var orderedCallbacks = [];

    wsServer.onOrderedConnect = (_id, cb)=> {
      orderedCallbacks[_id] = cb;
    };

    wsServer.onClientConnect = (ws)=> {};

    wsServer.on('connection', function (ws) {
      wsServer.onClientConnect(ws);
      ws.on('message', function (message) {
        //console.log(message);
        var data = JSON.parse(message);
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            if (key == '_id') {
              ws._id = data._id;
              console.log(`Client #${ws._id} connected`);
              wsServer.orderedClients[data._id] = ws;
              if (orderedCallbacks[data._id]) orderedCallbacks[data._id]();
            } else if (key == 'timeSync') {
              ws.send(JSON.stringify({ serverTime: Date.now() }));
            } else if (key in listeners) listeners[key](data[key], data);
          }
        }
      });

      ws.on('close', function () {
      });

      ws.on('error', function (error) {
      });
    });
  }

  exports.wss = wsServer;

  provide(exports);
});
