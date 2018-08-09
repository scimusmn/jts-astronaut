var dir = '';
if (__dirname) dir = __dirname;
else dir = exports.src.substr(0, exports.src.lastIndexOf('/'));

class ProgressRing extends HTMLElement {
  constructor() {
    super();

    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `
      <svg>
         <circle/>
      </svg>

      <style> @import "${dir}/css/progress.css";</style>
    `;
  }

  connectedCallback() {

  }

  setProgress(percent) {
    console.log(1 - percent);
    const circle = µ('circle', this._root)[0];
    circle.style.strokeDashoffset = `calc(${1 - percent} * var(--circ))`;

  }

  set progress(val) {
    this.setAttribute('progress', Math.min(1, Math.max(0, val)));
  }

  static get observedAttributes() {
    return ['progress'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'progress') {
      this.setProgress(newValue);
    }
  }
}

class ProgressBox extends HTMLElement {
  constructor() {
    super();

    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `
      <svg>
         <rect/>
      </svg>

      <style> @import "${dir}/css/progressBox.css";</style>
    `;
  }

  connectedCallback() {

  }

  setProgress(percent) {
    console.log(1 - percent);
    const circle = µ('rect', this._root)[0];
    circle.style.strokeDashoffset = `calc(${1 - percent} * var(--peri))`;

  }

  set progress(val) {
    this.setAttribute('progress', Math.min(1, Math.max(0, val)));
  }

  static get observedAttributes() {
    return ['progress'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'progress') {
      this.setProgress(newValue);
    }
  }
}

window.customElements.define('progress-box', ProgressBox);
window.customElements.define('progress-ring', ProgressRing);
