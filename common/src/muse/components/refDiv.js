obtain([], ()=> {
  if (!customElements.get('ref-div')) {

    //console.log('define importDoc');

    class RefDiv extends HTMLElement {
      constructor() {
        super();

        this.on_load = ()=> {};

        this.loaded = false;
        this.fired = false;
      }

      set onready(cb) {
        //this.on_load = val;
        if (this.loaded) {
          cb();
        } else {
          this.addEventListener('ready', (e)=> {
            cb(e.detail);
          });
        }
      }

      get onready () {
        return true;
      }

      connectedCallback() {
        //register events, check contents, etc.

        var _this = this;
        var src = µ('|>src', this);

        if (src) {
          let curDir = this.baseURI.substr(0, this.baseURI.lastIndexOf('/'));

          if (src.substr(0, 2) == './') src = curDir + '/' + src.substr(2);
          if (!src.includes('html')) src += '/index.html';

          src = src.replace('µ/', µdir);

          this.removeAttribute('src');

          window.importHTML(src, (link)=> {
            var which = '';
            if (µ('|>name', this)) which = µ('|>name', this);
            var nodes = Array.from(µ(`[refContent="${which}"]`, link.import)[0].childNodes);
            nodes.forEach((node)=> {
              _this.appendChild(node);
            });

            link.import.refDiv = _this;

            //if (link.import.onReady) link.import.onReady.call(this);

            _this.loaded = true;
            link.import.dispatchEvent(new CustomEvent('ready', { detail: _this }));
            _this.dispatchEvent(new CustomEvent('ready', { detail: _this }));
          });
        }
      };
    }

    customElements.define('ref-div', RefDiv);
  }

  var getImportDocument = function () {
    var doc = document.currentScript.ownerDocument;
    Object.defineProperty(doc, 'onready', {
      set: function (value) {
        if (doc.refDiv) {
          cb();
        } else {
          this.addEventListener('ready', cb);
        }
      },
    });
    return doc;
  };

  exports.RefDiv = customElements.get('ref-div');
  exports.Setup = getImportDocument;

  provide(exports);
});
