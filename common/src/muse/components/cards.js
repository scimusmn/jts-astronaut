
obtain([`${__dirname}/museElement.js`], ({ MuseElement })=> {
  if (!customElements.get('muse-card')) {
    var dir = '';
    if (__dirname) dir = __dirname;
    else dir = exports.src.substr(0, exports.src.lastIndexOf('/'));

    //window.loadCSS(__dirname + '/button.css');

    class MuseCard extends MuseElement {
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

        if (!_this.root) {
          this.makeTransitionState('focused');
          this.makeTransitionState('show', 'hide');
          this.root = _this.attachShadow({ mode: 'open' });
          this.root.innerHTML = `<style> @import "${dir}/css/cards.css";</style>`;

          _this.display = µ('+div', _this.root);
          µ('+slot', _this.display);

          _this.onClickOutsideCard = (e)=> {};

          var checkParent = (el)=> {
            return el == this || (el.parentElement && checkParent(el.parentElement));
          };

          document.addEventListener('click', (e)=> {
            if (!checkParent(e.target)) _this.onClickOutsideCard(e);
          });
        }
      };
    }

    customElements.define('muse-card', MuseCard);
  }

  exports.Card = customElements.get('muse-card');

  provide(exports);
});
