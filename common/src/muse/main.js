var muse = {
  debug: false,
  root: '',
  log: (data)=> {
    if (this.debug) console.log(data);
  },
};

if (!window) {
  var window = global;
  muse.Node = true;
  muse.root = __dirname;
  window.document = false;
} else {
  if (typeof require == 'undefined') var require = false;
  var script = document.currentScript;
  muse.root = script.src.substr(0, script.src.lastIndexOf('/') + 1);
  if (muse.root.includes('C:/') || muse.root.includes('C:\\'))
    muse.root = muse.root.replace('file:///', '');
  if (require) muse.root = muse.root.replace('file://', '');
}

window.muse = muse;

////////////////// querySelector shortcut /////////////
if (document) window.µ = function (id, elem) {
  var ret;
  var root = ((elem) ? elem : document);
  var spl = id.split('>');
  switch (spl[0].charAt(0)) {
    case '|':
      ret = root;
      break;
    case '+':
      ret = document.createElement(spl[0].substring(1));
      if (elem) elem.appendChild(ret);
      break;
    case '#':
      ret = root.querySelector(spl[0]);
      break;
    default:
      ret = Array.from(root.querySelectorAll(spl[0]));

      ret.style = function (mem, val) {
        for (let i = 0; i < ret.length; i++) {
          ret[i].style[mem] = val;
        }
      };

      //}
      break;
  }
  if (spl.length <= 1) return ret;
  else return ret.getAttribute(spl[1]);
};

window.µdir = muse.root;

if (document) window.loadCSS = (filename)=> {
  if (!µ(`[href="${filename}"]`)[0]) {
    var css = µ('+link', µ('head')[0]);
    css.type = 'text/css';
    css.rel = 'stylesheet';
    css.media = 'screen,print';
    css.href = filename;
  }
};

if (document) window.importHTML = (address, cb)=> {
  var targ = µ(`[href="${address}"]`)[0];
  if (!targ) {
    let link = µ('+link');
    link.rel = 'import';
    link.href = address;
    //link.setAttribute('async', ''); // make it async!
    link.addEventListener('load', ()=> { cb(link);});
    //link.onerror = function(e) {...};
    document.head.appendChild(link);
  } else {
    if (targ.import.childNodes.length) cb(targ);
    else targ.addEventListener('load', ()=> { cb(targ);});
  }

};

/*window.updateCSSProperty = (name, val)=> {
  _this.style.removeProperty(name);
  _this.style.setProperty(name, val);
};*/

window.inheritFrom = function (parent, addMethods) {
  var _parent = parent;
  var ret = function () {
    if (_parent) {
      _parent.apply(this, arguments);
    }
  };

  //console.log(_parent);

  ret.prototype = Object.create(_parent && _parent.prototype, {
    constructor: {
      value: ret,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (_parent) ret.__proto__ = _parent;

  if (typeof addMethods === 'function')
    addMethods.call(ret.prototype);

  return ret;
};

if (document) window.get = function (url, params) {
  // Return a new promise.
  return new Promise(function (resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    if (params && params.type) req.responseType = params.type;
    if (params && params.credentials) req.open('GET', url, params.credentials);
    else req.open('GET', url);

    req.onload = function () {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function () {
      reject(Error('Network Error'));
    };

    // Make the request
    req.send();
  });
};

if (document) window.post = function (url, obj) {
  // Return a new promise.
  return new Promise(function (resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('POST', url);
    req.setRequestHeader('Content-type', 'application/json');

    req.onload = function () {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function () {
      reject(Error('Network Error'));
    };

    // Make the request
    req.send(JSON.stringify(obj));
  });
};

window.provide = function (exports) {
};

window.obtain = function (addr, func) {
  var _this = this;
  var objs = [];
  var loadDone = false;
  var doc = document || {};
  if (document.currentScript) {
    doc = document.currentScript.ownerDocument;
    var srcDir = document.currentScript.src;
    var curDir = srcDir.substr(0, srcDir.lastIndexOf('/') + 1);
    if (doc && doc != document && !doc.onready) {
      Object.defineProperty(doc, 'onready', {
        set: function (cb) {
          if (doc.refDiv) {
            cb({ detail: doc.refDiv });
          } else {
            this.addEventListener('ready', cb);
          }
        },

        get: ()=>true,
      });
    }
  }

  var defaultImports = {
    Import: doc,
  };
  if (addr.length <= 0) func(defaultImports);
  else addr.forEach(function (adr, ind, arr) {
    let next = null;
    if (adr.includes('µ/')) adr = adr.replace('µ/', muse.root);
    if (require) objs[ind] = require(adr);
    else get(adr).then((req)=> {
      if (req.responseURL.substr(0, location.origin.length) == location.origin) {
        var provide = function (exps) {
          if (exps.ready || exps.obtained) {
            if (exps) objs[ind] = exps;
            let check = true;
            objs[ind].ready = true;
            for (var i = 0; i < arr.length; i++) {
              if (!objs[i] || !objs[i].ready) check = false;
            }

            if (check) {
              objs.push(defaultImports);
              if (!loadDone) func.apply(null, objs);
              loadDone = true;
            }
          }
        };

        var dirname = ` if(!__dirname) var __dirname = '${adr.substr(0, adr.lastIndexOf('/'))}';`;
        var intro = dirname + '//# sourceURL=' + adr + '\n()=>{var exports = {src: "' + adr + '", ready: ';
        var re = /obtain\s*\(*/g;
        if (req.responseText.match(re)) {
          intro += 'false, obtained: true}; ';
        } else intro += 'true}; ';

        objs[ind] = eval(intro  + req.responseText + ' return exports;}')();
        if (objs[ind].ready) {
          provide(objs[ind]);
        }
      }

    });
  });

  objs.push(defaultImports);
  if (require && addr.length) func.apply(null, objs);
};

if (!muse.Node) {
  var app = script.getAttribute('main');

  var started = false;

  if (!window.customElements) {
    console.log('Webcomponents not natively supported.');
    var scrpt = document.createElement('script');
    scrpt.src = muse.root + 'webcomponents-lite.js';
    window.addEventListener('WebComponentsReady', function () {
      console.log('Webcomponents provided through polyfill.');
      obtain([app, 'µ/components/refDiv.js'], (imports)=> {
        if (!started) {
          started = true;
          console.log(document.readyState);
          if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') imports.app.start();
          else document.addEventListener('DOMContentLoaded', function (event) {
            imports.app.start();
          });
        }
      });
    });

    document.head.insertBefore(scrpt, document.currentScript);
  } else {
    obtain([app, 'µ/components/refDiv.js'], (imports)=> {
      if (!started) {
        started = true;
        if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') imports.app.start();
        else document.addEventListener('DOMContentLoaded', function (event) {
          imports.app.start();
        });

      }
    });
  }
}
