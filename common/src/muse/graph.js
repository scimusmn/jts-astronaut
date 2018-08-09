//var ps = obtain('µ/pointStack.js');

obtain(['µ/pointStack.js', 'µ/utilities.js'], function(ps, utils) {
  var pointStack = ps.pointStack;
  function param() {
    this.x = {
      min:0,
      max:0,
      divs:10,
      flip:false,
    };

    this.y = {
      min:0,
      max:0,
      divs:10,
      flip:false,
    };
  }

  var museGraph = inheritFrom(HTMLCanvasElement, function() {
    var _this = this;

    this.points = null;

    this.fade = false;

    this.newPoint = {
      x:{
        val:0,
        new:false,
      },
      y:{
        val:0,
        new:false,
      },
    };

    this.mouse = { x:0, y:0 };

    this.range = new param();

    this.resize = function(nx, ny, nw, nh) {
      this.left = nx;
      this.top = ny;
      this.width = nw;
      this.height = nh;
      this.cellWidth = this.width / this.range.x.divs;
      this.cellHeight = this.height / this.range.y.divs;
    };

    this.setNumDivs = function(xDivs, yDivs) {
      this.range.x.divs = xDivs;
      this.range.y.divs = yDivs;
    };

    this.setRange = function(xMin, xMax, yMin, yMax) {
      this.range.x.min = xMin;
      this.range.x.max = xMax;
      this.range.y.min = yMin;
      this.range.y.max = yMax;
    };

    this.convert = function(val, which) {
      if (!this.range[which].flip) return utils.map(val, 0, 1, this.range[which].min, this.range[which].max);

      else return utils.map(val, 1, 0, this.range[which].min, this.range[which].max);
    };

    // Convert grid coordinates to pixel coordinates
    this.getPixelCoords = function(gridX, gridY) {

      var pixelX = gridX * this.cellWidth;
      var pixelY = this.height - gridY * this.cellHeight;

      return { x:pixelX, y:pixelY };

    };

    this.onNewPoint = function() {
    };

    this.addPoint = function(pnt) {
      if (this.range.x.flip) pnt.x = 1 - pnt.x;
      if (this.range.y.flip) pnt.y = 1 - pnt.y;
      if (this.points.addPoint(pnt)) {
        this.onNewPoint();
      }
    };

    this.newValue = function(val, which) {
      //this.points.addPoint(pnt);
      this.newPoint[which].val = val;
      this.newPoint[which].new = true;
      if (this.newPoint.x.new && this.newPoint.y.new) {
        this.addPoint({ x:this.newPoint.x.val, y:this.newPoint.y.val });
      }
    };

    this.newX = function(val) {
      this.newPoint.x.val = val;
      this.newPoint.x.new = true;
      if (this.newPoint.x.new && this.newPoint.y.new) {
        this.addPoint({ x:this.newPoint.x.val, y:this.newPoint.y.val });
      }
    };

    this.newY = function(val) {
      this.newPoint.y.val = val;
      this.newPoint.y.new = true;
      if (this.newPoint.x.new && this.newPoint.y.new) {
        this.addPoint({ x:this.newPoint.x.val, y:this.newPoint.y.val });
      }
    };

    this.lastPoint = function() {
      if (this.points.length)
				return { x:this.convert(this.points.last().x, 'x'), y:this.convert(this.points.last().y, 'y') };
    };

    this.drawTrace = function() {
      var ctx = this.getContext('2d');
      ctx.lineWidth = this.lineWidth;
      ctx.strokeStyle = this.lineColor;
      var _this = this;
      if (this.points.length > 2) {
        var xc = this.width * (this.points[0].x + this.points[1].x) / 2;
        var yc = this.height * (this.points[0].y + this.points[1].y) / 2;

        ctx.beginPath();
        ctx.moveTo(xc, yc);
        for (var i = 0; i < _this.points.length - 1; i++) {
          if (this.fade) ctx.globalAlpha = i / _this.points.length;
          xc = this.width * (_this.points[i].x + _this.points[i + 1].x) / 2;
          yc = this.height * (_this.points[i].y + _this.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(_this.points[i].x * this.width, _this.points[i].y * this.height, xc, yc);

          //ctx.stroke();
          if (this.fade) {
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(xc, yc);
          }
        }

        ctx.stroke();
        ctx.closePath();

      }

    };

    this.drawGrid = function() {
      var ctx = this.getContext('2d');
      ctx.lineWidth = this.gridWidth;
      ctx.strokeStyle = this.gridColor;
      for (var i = 0; i <= this.range.x.divs; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.width / this.range.x.divs, 0);
        ctx.lineTo(i * this.width / this.range.x.divs, this.height);
        ctx.closePath();
        ctx.stroke();
      }

      for (var i = 0; i <= this.range.y.divs; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * this.height / this.range.y.divs);
        ctx.lineTo(this.width, i * this.height / this.range.y.divs);
        ctx.closePath();
        ctx.stroke();
      }

    };

    this.customBGDraw = function() {
    };

    this.customFGDraw = function() {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(this.mouse.x * this.width, this.mouse.y * this.height, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    };

    this.draw = function() {
      //console.log(this.width);
      var ctx = this.getContext('2d');
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.rect(0, 0, this.width, this.height);
      ctx.closePath();
      ctx.fill();

      this.customBGDraw();

      this.drawTrace(ctx);

      this.drawGrid(ctx, 18, 10);

      this.customFGDraw();
    };

    this.clear = function() {
      this.points.length = 0;
    };

    this.createdCallback = function() {
      //this.shadow = this.createShadowRoot();
      //this.canvas = document.createElement('canvas');
      //this.setup(this);
      this.range = new param();

      this.newPoint = {
        x:{
          val:0,
          new:false,
        },
        y:{
          val:0,
          new:false,
        },
      };

      var xR = { min:µ('|>xMin', this), max:µ('|>xMax', this) };
      var yR = { min:µ('|>yMin', this), max:µ('|>yMax', this) };
      this.setRange(xR.min, xR.max, yR.min, yR.max);
      this.setNumDivs(µ('|>xDiv', this), µ('|>yDiv', this));
      var flip = '';
      if (flip = µ('|>flip', this)) {
        this.range.x.flip = (~µ('|>flip', this).indexOf('x')) ? true : false;
        this.range.y.flip = (~µ('|>flip', this).indexOf('y')) ? true : false;
      }

      numPoints = µ('|>numPoints', this);

      ctx = this.getContext('2d');
      this.points = pointStack((numPoints) ? parseInt(numPoints) : 1500);

      this.labelFont = 'lighter 2vh sans-serif';
      this.fontColor = '#000';
      this.lineWidth = 3;
      this.lineColor = '#000';
      this.gridWidth = 1;
      this.gridColor = 'rgba(0,0,0,.1)';
      this.refreshRate = 30;

      this.mouse = { x:0, y:0 };
      this.width = this.clientWidth;
      this.height = this.clientHeight;
      this.cellWidth = this.width / this.range.x.divs;
      this.cellHeight = this.height / this.range.y.divs;

      /*this.addEventListener('mousemove', function(evt) {
        var rect = this.getBoundingClientRect();
        this.mouse = {
          x: (evt.clientX - rect.left)/this.width,
          y: (evt.clientY - rect.top)/this.height
        };
      }, false);*/
    };
  });

  document.registerElement('muse-graph', { prototype: museGraph.prototype, extends: 'canvas' });
  window.museGraph = museGraph;
});
