'use strict';

Function.prototype.inherits = function (parent) {
  this.prototype = Object.create(parent && parent.prototype, {
    constructor: {
      value: this,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (parent) this.__proto__ = parent;
};

exports.getCORS = function (url, params) {
  // Return a new promise.
  return new Promise(function (resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    if ('withCredentials' in req) {
      req.open('GET', url, true);
    } else if (typeof XDomainRequest != 'undefined') {
      req = new XDomainRequest();
      req.open('GET', url);
    } else {
      req = null;
    }

    if (params && params.type) {
      req.setRequestHeader('Content-type', params);
    }

    req.withCredentials = true;

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

function loadFile(src, Fxn) {
  var _this = this;
  var http = new XMLHttpRequest();
  _this.xml = null;

  _this.loadFxns = [];

  _this.onXMLLoad = function () {
    for (var i = 0; i < _this.loadFxns.length; i++) {
      _this.loadFxns[i]();
    }
  };

  _this.whenLoaded = function (fxn) {
    var _this = this;
    if (!_this.loaded) _this.loadFxns.push(fxn);
    else fxn();
  };

  http.open('get', src);
  http.responseType = 'document';
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      _this.xml = http.responseXML;
      Fxn(_this.xml);
    }
  };

  http.send(null);

  return this;
}

exports.round = function (number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
  };

exports.transplant = (node)=> {
  var temp = node.cloneNode(true);
  var par = node.parentElement;
  par.insertBefore(temp, node);
  par.removeChild(node);

  return temp;
};

/***************************************
these work like this:

For custom elements:
-----------------------------------------
var DateSpan = inheritFrom(HTMLSpanElement);

DateSpan.prototype.createdCallback = function () {
    this.textContent = 'Today's date: ' + new Date().toJSON().slice(0, 10);
  };

  document.registerElement('date-today', DateSpan);

for extending functions:
------------------------------------------
fociiActions.inherits(Array);
function fociiActions() {
  Array.apply(this,arguments);
  var self = this;
  this.addElement = function (el) {
    this.push({'elem':el,'attr':new fociiAttr()})
    return this.last().attr;
  }
  this.addFxn = function (fxn) {
    this.push(fxn);
  }
  this.addItem = function (item) {
    if(typeof item === 'function') self.addFxn(item);
    else return self.addElement(item);
  }
}
******************************************/

function b64toBlobURL(b64Data, contentType, sliceSize) {
  var parts = b64Data.match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(parts[3]);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return URL.createObjectURL(blob);
}

var revokeBlobURL = function (URL) {
  window.URL.revokeObjectURL(URL);
};

exports.charCode = function (string) {
  return string.charCodeAt(0);
};

exports.ajax = (src, fxn)=> {
  var http = new XMLHttpRequest();
  var ret = 0;

  http.open('get', src);
  http.responseType = 'document';
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      ret = http.responseXML;
      fxn(ret);
    }
  };

  http.send(null);

  return ret;
};

exports.degToRad = (d)=> {
  // Converts degrees to radians
  return d * 0.0174532925199432957;
};

exports.itoa = (i)=>
{
  return String.fromCharCode(i);
};

exports.bitRead = (num, pos)=> {
  return (num & Math.pow(2, pos)) >> pos;
};

exports.distance = (p1, p2)=> {
  return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
};

Array.prototype.min = function () {
  return Math.min.apply({}, this);
};

Array.prototype.max = function () {
  return Math.max.apply({}, this);
};

Array.prototype.last = function () {
  return this[this.length - 1];
};

exports.getPos = (el)=> {
  // yay readability
  for (var lx = 0, ly = 0; el != null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
  return { x: lx, y: ly };
};

exports.averager = function (points) {
  if (points === undefined) points = 5;
  var samps = [];
  this.ave = 0;
  var ind = 0;
  var tot = 0;

  //for (var i = 0; i < points; i++) {
  //  samps.push(0.0);
  //}

  this.changeNumSamps = function (num) {
    samps.length = 0;

    //for (var i = 0; i < num; i++) {
    //  samps.push(0.0);
    //}
    points = num;
  };

  this.clear = function () {
    samps.length = 0;

  };

  this.addSample = function (val) {
    if (samps.length >= points) {
      tot -= samps[ind];
      samps[ind] = val;
    } else samps.push(val);
    tot += val;
    this.ave = tot / samps.length;
    ind = (ind + 1) % points;
    return this.ave;
  };

  this.getBinSize = ()=> points;

  return this;
};

exports.map = (val, inMin, inMax, outMin, outMax)=> {
  return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};

exports.clamp = (val, Min, Max)=> {
  return Math.max(Min, Math.min(val, Max));
};

exports.sign = (x)=> {
  return (x > 0) - (x < 0);
};

exports.zeroPad = (num, size)=> {
  var s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
};

exports.position = (elem)=> {
  var offset = { x: 0, y: 0 };
  while (elem)
  {
    offset.x += elem.offsetLeft;
    offset.y += elem.offsetTop;
    elem = elem.offsetParent;
  }

  return offset;
};

exports.extractNumber = (value)=>
{
  var n = parseInt(value);

  return n == null || isNaN(n) ? 0 : n;
};

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
exports.reduce = (numerator, denominator)=> {
  var gcd = function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
  };

  gcd = gcd(numerator, denominator);
  return [numerator / gcd, denominator / gcd];
};
