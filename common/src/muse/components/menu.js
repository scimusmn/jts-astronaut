
obtain([], ()=> {
  if (!customElements.get('muse-menu')) {
    var dir = '';
    if (__dirname) dir = __dirname;
    else dir = exports.src.substr(0, exports.src.lastIndexOf('/'));

    //window.loadCSS(__dirname + '/button.css');

    class MuseMenu extends HTMLElement {
      constructor() {
        super();
      }

      set title(val) {
        this.currentTitle = val;
        this.titleSpan.textContent = this.currentTitle;
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        this.originalTitle = µ('|>title', this);

        if (!this.root) {
          this.root = _this.attachShadow({ mode: 'open' });
          this.root.innerHTML = `<style> @import "${dir}/css/menu.css";</style>`;

          _this.titleDiv = µ('+div', _this.root);
          _this.titleDiv.className = 'titleDiv';
          _this.titleSpan = µ('+span', _this.titleDiv);
          _this.titleSpan.textContent = this.originalTitle;
          /*_this.titleDiv.className = 'titleDiv';
          µ('+slot', _this.titleDiv).setAttribute('name', 'title');*/

          _this.leftHand = µ('+div', _this.root);
          _this.leftHand.className = 'left';
          µ('+slot', _this.leftHand).setAttribute('name', 'left');

          _this.rightHand = µ('+div', _this.root);
          _this.rightHand.className = 'right';
          µ('+slot', _this.rightHand);
        }

      };
    }

    customElements.define('muse-menu', MuseMenu);
  }

  exports.Menu = customElements.get('muse-menu');

  provide(exports);
});
