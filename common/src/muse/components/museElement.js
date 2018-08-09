class MuseElement extends HTMLElement {
  constructor() {
    super();
  }

  makeTransitionState (stateName, loseName) {
    var _this = this;

    var capFirst = (string)=>string.charAt(0).toUpperCase() + string.slice(1);

    var capped = capFirst(stateName);

    if (typeof _this[stateName] != 'undefined') var oldState = _this[stateName];

    var lost = `${capped}_state_lost`;
    var lose = (loseName) ? `on${capFirst(loseName)}` : `onLose${capped}`;
    var got = `${capped}_state_acquired`;
    var onget = `on${capped}`;

    this[lost] = ()=> {

      if (_this.classList.contains(`${stateName}_running`)) {
        _this[lose]();
      }

      _this.removeEventListener('transitionend', this[lost]);
      this.classList.remove(`${stateName}_running`);
    };

    this[lose] = ()=> {
      //console.log('lost ' + stateName);
    };

    this[got] = ()=> {
      if (_this.classList.contains(`${stateName}_running`)) {
        _this[onget]();
      }

      _this.removeEventListener('transitionend', this[got]);
      this.classList.remove(`${stateName}_running`);
    };

    this[onget] = ()=> {
      //console.log('gained ' + stateName);
    };

    this[`stop${capped}Transition`] = ()=> {
      _this.removeEventListener('transitionend', this[got]);
      _this.removeEventListener('transitionend', this[lost]);
      this.classList.remove(`${stateName}_running`);
    };

    Object.defineProperty(_this, stateName, {
      get: function () {
        return (µ(`|>${stateName}`, _this) == '');
      },

      set: function (val) {
        if (val != _this[stateName]) {
          _this.classList.add(`${stateName}_running`);
          if (val) {
            _this.removeEventListener('transitionend', _this[lost]);
            _this.addEventListener('transitionend', _this[got]);
            _this.setAttribute(stateName, '');
          } else {
            _this.removeEventListener('transitionend', _this[got]);
            _this.addEventListener('transitionend', _this[lost]);
            _this.removeAttribute(stateName);
          }
        }
      },
    });

    if (typeof oldState != 'undefined')_this[stateName] = oldState;
  }

}

exports.MuseElement = MuseElement;
