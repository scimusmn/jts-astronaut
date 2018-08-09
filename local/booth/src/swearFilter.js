var obtains = [
  './src/smm-profanities.json',
];

var up = '[I\\|\\[!\\]\\}\\{jJl]';

var subs = {
  a: '[aA@4]|\\/[-]*\\\\|(?:aw)',
  b: `[bB6]|${up}3`,
  c: '[cC\\{\\(<]|[kK]',
  d: `[dD]+|${up}[\\)>]|c[I\\|\\[!\\]\\}\\{jJ]`, //// uprights: [I\|\[!\]\}\{jJl]
  e: '[eE3]',
  f: '[fF]|ph',
  g: '[gG69]',
  h: `[hH]|${up}[-]*${up}`,
  i: '[\\(\\)\\|\\[\\]\\}\\{jJl!Ii]',
  j: 'j',
  k: '[kKq]|[cC](?![ie])|[kK][hH]',
  l: `[lL17]|${up}_`,
  m: `[mM]|${up}(?:[vV]|\\\/)${up}`,
  n: `[nN]|${up}\\${up}|${up}V`,
  o: `[0oOQ]|(?:[\\[\\{\\(][\\}\\]\\)])`,
  p: `[pP]|${up}[\\*\\"]`,
  q: `[qQ]`,
  r: '[rR]',
  s: '[sS\\$5zZ]',
  t: `[tT7\\+]|[\\'\\"]${up}+[\\'\\"]`,
  u: `[uU]|${up}_${up}`,
  v: `[vV]|${up}${up}`,
  w: `[wW]|[vV][vV]`,
  x: `[xX]|><|[cC]*[kKcC]+[sS]`,
  y: `[yY]`,
  z: `[zZ]`,
};

//(?: expression )+

//check whitespace and _ between letters

obtain(obtains, (swears)=> {
  var excepts = (word, pos)=>{
    var vowels = ['a', 'e', 'i', 'o', 'u'];

    if (word.charAt(pos) == 'c' && pos < word.length - 1 && word.charAt(pos + 1) == 'k') return true;
    // else if(/[aeiou]/.test(word.charAt(pos)) &&
    //         pos < word.length - 1 &&
    //         /[b-df-hj-np-tv-z]+[aeiou]+[b-df-hj-np-tv-z]+/.test(word)) return true;
    else return false;
  }

  exports.filter = (input)=> {

    var res = false;

    swears.forEach((swear)=>{
      var regEx = '';
      var regExBlank = '';
      for (var i = 0; i < swear.length; i++) {
        var char = swear.charAt(i);
        var newStr = '';
        if (subs[char]) newStr = ('(?:' + subs[char] + ')' + ((excepts(swear, i) ? '*' : '+')));
        else {
          newStr = '(?:\\' + char + ')+';
        }

        regEx += newStr;
        regExBlank += newStr + '[\\s_|-]*';
      }

      var reg = new RegExp(regEx);
      var regBlank = new RegExp(regExBlank);

      if(reg.test(input) || regBlank.test(input)) console.log(swear);

      res = res || reg.test(input) || regBlank.test(input);

    });

    return (!res)?input:null;
  };

  window.swearFilter = exports.filter;

  provide(exports);
});
