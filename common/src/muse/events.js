'use strict';

obtain([], ()=> {
  if (require) exports.Emitter = require('events');
  else {
    class Emitter extends EventTarget {
      constructor() {
        super();
      }

      emit(evt, data) {
        this.dispatchEvent(new CustomEvent(evt, { detail: data }));
      }

      once(evt, cb) {
        var ret = (e)=> {
          console.log('removing listener');
          this.removeEventListener(evt, ret);
          cb(e.detail);
        };

        this.addEventListener(evt, ret);
        return ret;
      }

      on(evt, cb) {
        var ret = (e)=> {
          cb(e.detail);
        };

        this.addEventListener(evt, ret);
        return ret;
      }

      addListener(evt, cb) {
        this.on(evt, cb);
      }
    }
    exports.Emitter = Emitter;
  }

  provide(exports);
});
