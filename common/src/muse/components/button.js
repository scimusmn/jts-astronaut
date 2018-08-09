
obtain([], ()=> {
  if (!customElements.get('but-ton')) {
    var dir = '';
    if (__dirname) dir = __dirname;
    else dir = exports.src.substr(0, exports.src.lastIndexOf('/'));

    //window.loadCSS(__dirname + '/button.css');

    class Button extends HTMLElement {
      constructor() {
        super();
      }

      get disabled() {
        return (µ('|>disabled', this) == '');
      }

      set disabled(val) {
        if (val) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        if (!_this.shadowRoot) {
          _this.root = _this.attachShadow({ mode: 'open' });

          _this.root.innerHTML = `<style> @import "${dir}/css/button.css";</style>`;

          _this.display = µ('+slot', _this.root);

          /*_this.onPress = ()=> { console.log('pressed button');};

          _this.onmousedown = (e)=> {
            e.preventDefault();
            _this.pressed = true;
          };

          document.addEventListener('mouseup', (e)=> {
            e.preventDefault();
            _this.pressed = false;
          });

          _this.onmouseup = (e)=> {
            e.preventDefault();
            if (_this.pressed && !_this.disabled) _this.onPress();
          };*/
        }
      };
    }

    customElements.define('but-ton', Button);
  }

  exports.Button = customElements.get('but-ton');

  provide(exports);
});
