obtain([], ()=> {
  if (!customElements.get('drop-down')) {

    class Dropdown extends HTMLElement {
      constructor(props) {
        super(props);
      }

      get disabled() {
        return (µ('|>disabled', this) == '');
      }

      set disabled(val) {
        if (val) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
      }

      get open() {
        return (µ('|>open', this) == '');
      }

      set open(val) {
        if (val && !this.disabled) this.setAttribute('open', '');
        else this.removeAttribute('open');
      }

      get mobile() {
        return (µ('|>mobile', this) == '');
      }

      set mobile(val) {
        if (val && !this.disabled) this.setAttribute('mobile', '');
        else this.removeAttribute('mobile');
      }

      get value() {
        return this.selected && this.selected.value;
      }

      get selected() {
        return this.selectedNode;
      }

      set selected(val) {
        this.selectedIndex = Array.prototype.indexOf.call(this.children, val);
        if (this.selectedIndex >= 0) {
          if (this.selectedNode) this.selectedNode.selected = false;
          var temp = val.cloneNode(true);
          this.root.replaceChild(temp, this.display);
          this.display = temp;
          this.selectedNode = val;
          this.selectedNode.selected = true;
          this.onSelect(this.selectedNode, this.selectedIndex);
        }
      }

      addOption (text, value) {
        var newOpt = µ('+drop-opt', this);
        newOpt.textContent = text;
        if (value) newOpt.value = value;
        else newOpt.value = text;
        return newOpt;
      }

      removeOption (opts) {
        // remove child code here.
        if (opts && opts.index) this.removeChild(this.children(opts.index));
        else if (opts && opts.node) this.removeChild(opts.node);
      }

      set default(val) {
        this.setAttribute('default', val);
        if (this.display) {
          this.display.textContent = val;
        }
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        if (!this.root) {
          this.root = _this.attachShadow({ mode: 'open' });

          this.root.innerHTML = `<style> @import "${__dirname}/css/dropdown.css";</style>`;

          _this.tray = µ('+div', this.root);
          _this.tray.className = 'tray';
          µ('+slot', _this.tray);

          _this.display = µ('+drop-opt', _this.root);
          _this.display.textContent = µ('|>default', this);

          _this.onmousedown = (e)=> {
            e.preventDefault();
            _this.pressed = true;
          };

          _this.onmouseup = (e)=> {
            e.preventDefault();
            if (_this.pressed && !_this.disabled) _this.open = true;
          };

          document.addEventListener('mousedown', (e)=> {
            if (_this.open && e.target.parentElement != _this) {
              e.preventDefault();
              this.open = false;
            }
          });

          document.addEventListener('mouseup', (e)=> {
            if (e.target.pressed && e.target.parentElement == _this && e.target.parentElement.open) {
              e.target.parentElement.open = false;
              e.target.parentElement.selected = e.target;
            }
          });

          _this.onSelect = (node, index)=> { console.log(`${index} was chosen`);};
        }

      };
    }

    var mouse = { x: 0, y: 0 };
    var initScroll = 0;

    class DropOpt extends HTMLElement {
      constructor() {
        super();
      }

      get selected() {
        return (µ('|>selected', this) == '');
      }

      set selected(val) {
        if (val) this.setAttribute('selected', '');
        else this.removeAttribute('selected');
      }

      get value() {
        return µ('|>value', this);
      }

      set value(val) {
        if (val) this.setAttribute('value', val);
        else this.removeAttribute('value');
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        _this.onmousedown = (e)=> {
          e.preventDefault();
          _this.pressed = true;
          if (_this.parentElement && _this.parentElement.tagName == 'DROP-DOWN') {
            mouse.y = e.pageY;
            initScroll = _this.parentElement.tray.scrollTop;
            document.addEventListener('mousemove', onmousemove);
          }

          document.addEventListener('mouseup', onmouseup);

        };

        var onmousemove = (e)=> {
          if (Math.abs(e.pageY - mouse.y) > _this.clientHeight / 2) _this.pressed = false;
          _this.parentElement.tray.scrollTop = initScroll - (e.pageY - mouse.y);
        };

        var onmouseup = (e)=> {
          _this.pressed = false;
          document.removeEventListener('mouseup', onmouseup);
          document.removeEventListener('mousemove', onmousemove);
        };
      }

    }

    customElements.define('drop-opt', DropOpt);
    customElements.define('drop-down', Dropdown);
  }

  exports.Dropdown = customElements.get('drop-down');

  provide(exports);
});
