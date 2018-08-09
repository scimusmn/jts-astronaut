'use strict';

obtain([], ()=> {
  exports.app = {};

  exports.app.start = ()=> {
    console.log('started');

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
    };

  };

  provide(exports);
});
