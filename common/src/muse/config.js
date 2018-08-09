var configFile = inheritFrom(HTMLElement, function() {
  this.loaded = false;

  function objectify(node, parentObj) {
    var kids = node.children;
    for (var i = 0; i < kids.length; i++) {
      var type = kids[i].getAttribute('type');
      if (type == 'num') {
        parentObj[kids[i].tagName] = parseFloat(kids[i].textContent);
      } else if (type == 'object') {
        parentObj[kids[i].tagName] = {};
        objectify(kids[i], parentObj[kids[i].tagName]);
      } else parentObj[kids[i].tagName] = kids[i].textContent;
    }
  }

  this.createdCallback = function() {
    var _this = this;
    _this.loadFxns = [];

    _this.onXMLLoad = function() {
      for (var i = 0; i < _this.loadFxns.length; i++) {
        _this.loadFxns[i]();
      }
    };

    _this.whenLoaded = function(fxn) {
      var _this = this;
      if (!_this.loaded) _this.loadFxns.push(fxn), console.log('pushed fxn');
      else fxn();
    };

    var fileAddress = this.getAttribute('file');
    ajax(fileAddress, function(xml) {
      objectify(xml.firstChild, _this);
      _this.onXMLLoad();
      _this.loaded = true;
    });
  };
});

document.registerElement('con-fig', configFile);
