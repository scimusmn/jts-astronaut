
obtain([`${__dirname}/museElement.js`], ({ MuseElement })=> {
  if (!customElements.get('muse-div')) {
    var dir = '';
    if (__dirname) dir = __dirname;
    else dir = exports.src.substr(0, exports.src.lastIndexOf('/'));

    //window.loadCSS(__dirname + '/button.css');

    class MuseDiv extends MuseElement {
      constructor() {
        super();
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

      };
    }

    customElements.define('muse-div', MuseDiv);
  }

  exports.MuseDiv = customElements.get('muse-div');

  provide(exports);
});
