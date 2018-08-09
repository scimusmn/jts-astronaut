//var canVas = inheritFrom(HTMLCanvasElement, function() {
//////////////////////////////////////////////////////
// Extending native elements not implemented using customElements as of 5/17
//////////////////////////////////////////////////////

/*if (!customElements.get('can-vas')) {
  class Canvas extends HTMLCanvasElement {
    constructor() {
      super();

      console.log(this.id);

      this.mouse = { x:0, y:0 };
      this.ctx = this.getContext('2d');
    };

    clear() {
      this.width = this.width;
    };

    mirror() {
      this.ctx.translate(this.width, 0);
      this.ctx.scale(-1, 1);
    };

    resize(nw, nh) {
      this.width = nw;
      this.height = nh;
    };
  }

  //customElements.define('can-vas', Canvas, { extends: 'canvas' });

  document.registerElement('can-vas', { prototype: Canvas.prototype, extends: 'canvas' });
  exports.Canvas = Canvas;
} else {
  exports.Canvas = customElements.get('can-vas');
}

//exports.Canvas = customElements.get('can-vas');*/

if (!customElements.get('can-vas')) {
  var canVas = inheritFrom(HTMLCanvasElement, function() {
    this.clear = function() {
      this.width = this.width;
    };

    this.mirror = function() {
      this.ctx.translate(this.width, 0);
      this.ctx.scale(-1, 1);
    };

    this.resize = function(nw, nh) {
      this.width = nw;
      this.height = nh;
    };

    this.createdCallback = function() {
      this.mouse = { x:0, y:0 };
      console.log(this.id);
      this.ctx = this.getContext('2d');
    };
  });

  window.museCanvas = document.registerElement('can-vas', { prototype: canVas.prototype, extends: 'canvas' });
  exports.Canvas = window.museCanvas;
} else exports.Canvas = window.museCanvas;
