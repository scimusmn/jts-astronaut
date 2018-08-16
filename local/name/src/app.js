'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var obtains = [
  'electron',
];

obtain(obtains, ({ ipcRenderer: comm })=> {

  exports.app = {};

  var sent = false;

  var data = [];

  var fadeInt;
  var dir = 1;
  var val = 0;

  exports.app.start = ()=> {

    console.log('started');

    // var sendWidth = (which)=> {
    //   if (which <= 3) {
    //     comm.send('interwindow', {
    //       target: 'name_' + which,
    //       channel: 'prev-width',
    //       data: {
    //         index: which,
    //         width: window.innerWidth + textOffset,
    //       },
    //     });
    //   } else {
    //     comm.send('interwindow', {
    //       target: 'booth',
    //       channel: 'report',
    //       data: {
    //         width: textOffset,
    //       },
    //     });
    //   }
    // };

    var textOffset = 0;

    var getIndex = (label)=> {
      return parseInt(label.replace('name_', ''));
    };

    var manageOffset = (targ, off)=> {
      comm.send('interwindow', {
        target: targ,
        channel: 'offset',
        data: {
          offset: off,
        },
      });
    };

    comm.on('offset', (evt, data)=> {
      textOffset = data.offset;
      µ('#nameText').style.left = '-' + textOffset + 'px';

      var ind = getIndex(data.self);
      if (ind < 3) {
        manageOffset(`name_${ind + 1}`, textOffset + window.innerWidth);
      }
    });

    manageOffset('name_1', 0);

    comm.on('nametag', (evt, data)=> {
      µ('#nameText').textContent = data.name;
      if (data.name.length > 11) {
        µ('#nameText').style.fontSize = (42 + (33 * Math.pow((20 - data.name.length) / 8, 1.5))) + 'vh';
      } else {
        µ('#nameText').style.fontSize = '75vh';
      }
    });
    //
    // comm.on('prev-width', (evt, data)=> {
    //   //set offset here
    //   console.log(data.width);
    //   textOffset = data.width;
    //
    //   µ('#nameText').style.left = '-' + textOffset + 'px';
    //
    //   sendWidth(data.index + 1);
    // });
    //
    // comm.on('id-request', (evt, data)=> {
    //   if (data.self == 'name_1') {
    //     console.log('here');
    //     setTimeout(()=> {
    //       sendWidth(2);
    //     }, 2000);
    //   }
    // });

    document.onkeypress = (e)=> {

    };

    document.onkeyup = (e)=> {
      if (e.which == 27) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
