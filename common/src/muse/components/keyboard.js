obtain([`µ/components/museElement.js`], ({ MuseElement })=> {
  if (!customElements.get('key-board')) {
    class KeyBoard extends MuseElement  {
      constructor() {
        super();
      }

      connectedCallback() {
        //register events, check contents, etc.

        var _this = this;

        if (!_this.root) {

          this.makeTransitionState('show', 'hide');
          this.root = _this.attachShadow({ mode: 'open' });
          this.root.innerHTML = `
            <style> @import "${µdir}/components/css/keyboard.css";</style>
            <li class="symbol"><span class="off">&#96;</span><span class="on" >~</span></li>
            <li class="symbol"><span class="off">1</span><span class="on" >!</span></li>
            <li class="symbol"><span class="off">2</span><span class="on" >@</span></li>
            <li class="symbol"><span class="off">3</span><span class="on" >#</span></li>
            <li class="symbol"><span class="off">4</span><span class="on" >$</span></li>
            <li class="symbol"><span class="off">5</span><span class="on" >%</span></li>
            <li class="symbol"><span class="off">6</span><span class="on" >^</span></li>
            <li class="symbol"><span class="off">7</span><span class="on" >&amp;</span></li>
            <li class="symbol"><span class="off">8</span><span class="on" >*</span></li>
            <li class="symbol"><span class="off">9</span><span class="on" >(</span></li>
            <li class="symbol"><span class="off">0</span><span class="on" >)</span></li>
            <li class="symbol"><span class="off">-</span><span class="on" >_</span></li>
            <li class="symbol"><span class="off">=</span><span class="on" >+</span></li>
            <!--<li class="delete lastitem"><span class='svgIcon delSymbol'></span></li>-->
            <li class="delete lastitem">delete</li>
            <li class="tab">tab</li>
            <li class="letter">q</li>
            <li class="letter">w</li>
            <li class="letter">e</li>
            <li class="letter">r</li>
            <li class="letter">t</li>
            <li class="letter">y</li>
            <li class="letter">u</li>
            <li class="letter">i</li>
            <li class="letter">o</li>
            <li class="letter">p</li>
            <li class="symbol"><span class="off">[</span><span class="on" >{</span></li>
            <li class="symbol"><span class="off">]</span><span class="on" >}</span></li>
            <li class="symbol lastitem"><span class="off">&#92;</span><span class="on" >|</span></li>
            <li class="capslock">caps lock</li>
            <li class="letter">a</li>
            <li class="letter">s</li>
            <li class="letter">d</li>
            <li class="letter">f</li>
            <li class="letter">g</li>
            <li class="letter">h</li>
            <li class="letter">j</li>
            <li class="letter">k</li>
            <li class="letter">l</li>
            <li class="symbol"><span class="off">;</span><span class="on" >:</span></li>
            <li class="symbol"><span class="off">'</span><span class="on" >"</span></li>
            <li class="return">return</li>
            <li class="left-shift">shift</li>
            <li class="letter">z</li>
            <li class="letter">x</li>
            <li class="letter">c</li>
            <li class="letter">v</li>
            <li class="letter">b</li>
            <li class="letter">n</li>
            <li class="letter">m</li>
            <li class="symbol"><span class="off">,</span><span class="on" >&lt;</span></li>
            <li class="symbol"><span class="off">.</span><span class="on" >&gt;</span></li>
            <li class="symbol"><span class="off">/</span><span class="on" >?</span></li>
            <li class="right-shift">shift</li>
            <li class="space lastitem">space</li>
          `;

          var capslock = false;
          var shift = false;

          _this.onmousedown = (e)=> {
            e.stopPropagation();
            e.preventDefault();
          };

          µ('li', _this.root).forEach(function (item) {

            if (item.className.includes('symbol') || item.className.includes('letter')) {
              var tempHTML = item.innerHTML;

              var hover = µ('+div', item);

              hover.innerHTML = tempHTML;
            }

            let handleKeypress = (e)=> {

              if (e && e.stopPropagation) {
                e.stopPropagation();
                e.preventDefault();
              }

              var actEl = document.activeElement;
              //if (actEl == null || actEl.tagName != 'INPUT') return false;
              //console.log(item);

              var character = item.firstChild.textContent; // If it's a lowercase letter, nothing happens to this variable

              var keycode = character && character.charCodeAt(0);

              // Shift keys
              if (item.className.includes('shift')) {
                shift = _this.classList.toggle('shift');
                _this.classList.toggle('uppercase', shift);
                return false;
              }

              // Caps lock

              if (item.className.includes('capslock')) {
                capslock = _this.classList.toggle('capslock');
                shift = _this.classList.toggle('shift', capslock);
                _this.classList.toggle('uppercase', shift);
                return false;
              }

              //Delete
              if (item.className.includes('delete') && actEl && actEl.tagName == 'INPUT') {
                //actEl.value = actEl.value.slice(0, -1);
                if (actEl.selectionStart) {
                  var startPos = actEl.selectionStart;
                  var endPos = actEl.selectionEnd;
                  if (startPos == endPos) {
                    actEl.value = actEl.value.substring(0, startPos - 1) + actEl.value.substring(endPos);
                  } else {
                    actEl.value = actEl.value.substring(0, startPos) + actEl.value.substring(endPos);
                  }

                  actEl.setSelectionRange(startPos - 1, startPos - 1);
                } else {
                  actEl.value.slice(0, -1);
                  actEl.setSelectionRange(startPos - 1, startPos - 1);
                }

                return true;
              }

              // Special characters
              if (item.className.includes('symbol'))
                character = µ('span.' + ((shift) ? 'on' : 'off'), item)[0].textContent[0];
              if (item.className.includes('space')) {
                character = ' ';
                keycode = 32;
              }

              if (item.className.includes('tab')) {
                character = '\t';
                keycode = 9;
              }

              if (item.className.includes('return')) {
                character = '\n';
                keycode = 13;
              }

              // Uppercase letter
              if ((capslock && !shift) || shift) character = character.toUpperCase();

              //actEl.value += character;
              if (actEl && actEl.tagName == 'INPUT' && (actEl.selectionStart || actEl.selectionStart == '0')) {
                var startPos = actEl.selectionStart;
                var endPos = actEl.selectionEnd;
                actEl.value = actEl.value.substring(0, startPos)
                  + character + actEl.value.substring(endPos, actEl.value.length);
                actEl.setSelectionRange(startPos + 1, startPos + 1);
              } else {
                actEl.value += actEl;
              }

              var eventObj = document.createEvent('Events');

              if (eventObj.initEvent) {
                eventObj.initEvent('keypress', true, true);
              }

              eventObj.keyCode = keycode;
              eventObj.which = keycode;
              eventObj.key = character;
              eventObj.shiftKey = item.className.includes('capslock') || item.className.includes('shift');

              //document.dispatchEvent(eventObj);
              document.activeElement.dispatchEvent(eventObj);

              _this.onkeypress(event);

              if (shift && !capslock) shift = _this.classList.toggle('shift', false);
              if (capslock && !shift) shift = true, _this.classList.add('shift');

              _this.classList.toggle('uppercase', shift);

              return false;
            };

            _this.onkeypress = (which)=> {};

            let repeatTimeout = null;

            let keyRepeat = (e, time)=> {
              repeatTimeout = setTimeout(keyRepeat, 100);
              return handleKeypress(e);
            };

            item.onmousedown = (e)=> {
              e.stopPropagation();
              e.preventDefault();
              //repeatTimeout = setTimeout(keyRepeat, 1000);
              handleKeypress(e);

              return true;
            };

            item.onmouseup = (e)=> {
              clearTimeout(repeatTimeout);
            };
          });
        } ///// end if(!root)
      };
    }

    customElements.define('key-board', KeyBoard);
  }

  exports.Keyboard = customElements.get('key-board');

  provide(exports);
});
