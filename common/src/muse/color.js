obtain([], ()=> {

  function Color(col) {
    if (typeof col == 'string') {
      var tmp = col;
      col = [];
      col.push(parseInt(tmp.substr(0, 2), 16));
      col.push(parseInt(tmp.substr(2, 2), 16));
      col.push(parseInt(tmp.substr(4, 2), 16));
    }

    col = col.map((val)=>Math.floor(val));

    col.invert = ()=>new Color(col.map((val)=>(255 - val)));

    col.styleString = ()=>`rgb(${col[0]}, ${col[1]}, ${col[2]})`;

    col.scale = (s)=>new Color(col.map((val)=>Math.floor(s * val)));

    return col;
  }

  exports.fadeColors = (col, current)=> {
    if (current >= 1) current -= .0000000000001;
    var space = 1 / (col.length - 1);
    var which = Math.floor(current / space);
    var amt = (current % space) / space;

    var one = col[which];
    var two = col[which + 1];

    return new Color([one[0] * (1 - amt) + two[0] * amt,
                     one[1] * (1 - amt) + two[1] * amt,
                     one[2] * (1 - amt) + two[2] * amt, ]);
  };

  exports.Color = Color;

  exports.rainbow = (note, span)=> {
    const third = span / 3;
    var r = 1, g = 0, b = 0;
    var c = note % span;
    var k = 255 - (note % third) * (255 / third);
    if (c >= 2 * third) r = 0, g = 0, b = 1;
    else if (c >= third) r = 0, g = 1, b = 0;
    else r = 1, g = 0, b = 0;

    return new Color([(r * (255 - k) + g * k), (g * (255 - k) + b * k), (b * (255 - k) + r * k)]);
  };

  provide(exports);
});
