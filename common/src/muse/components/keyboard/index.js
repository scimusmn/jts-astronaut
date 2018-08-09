
obtain([], ({ Import })=> {
  var shift = 0;
  var capslock = false;

  Import.onready = ()=> {
    µ('li', µ('#keyboard', Import.refDiv)).forEach(function (item) {

      let handleKeypress = (e)=> {
        e.stopPropagation();
        e.preventDefault();
        var actEl = document.activeElement;
        if (actEl == null || actEl.tagName != 'INPUT') return false;

        let _this = item;
        var character = _this.textContent; // If it's a lowercase letter, nothing happens to this variable

        var keycode = character && character.charCodeAt(0);

        // Shift keys
        if (_this.className.includes('shift')) {
          shift = µ('#keyboard').classList.toggle('shift');
          µ('#keyboard').classList.toggle('uppercase', shift);
          return false;
        }

        // Caps lock

        if (_this.className.includes('capslock')) {
          capslock = µ('#keyboard').classList.toggle('capslock');
          shift = µ('#keyboard').classList.toggle('shift', capslock);
          µ('#keyboard').classList.toggle('uppercase', shift);
          return false;
        }

        // Delete
        if (_this.className.includes('delete')) {
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
        if (_this.className.includes('symbol'))
          character = µ('span.' + ((shift) ? 'on' : 'off'), _this)[0].innerHTML[0];
        if (_this.className.includes('space')) {
          character = ' ';
          keycode = 32;
        }

        if (_this.className.includes('tab')) {
          character = '\t';
          keycode = 9;
        }

        if (_this.className.includes('return')) {
          character = '\n';
          keycode = 13;
        }

        // Uppercase letter
        if ((capslock && !shift) || shift) character = character.toUpperCase();

        //actEl.value += character;
        if (actEl.selectionStart || actEl.selectionStart == '0') {
          var startPos = actEl.selectionStart;
          var endPos = actEl.selectionEnd;
          actEl.value = actEl.value.substring(0, startPos)
            + character
            + actEl.value.substring(endPos, actEl.value.length);
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
        eventObj.shiftKey = _this.className.includes('capslock') || _this.className.includes('shift');

        document.activeElement.dispatchEvent(eventObj);

        if (shift && !capslock) shift = µ('#keyboard').classList.toggle('shift', false);
        if (capslock && !shift) shift = true, µ('#keyboard').classList.add('shift');

        µ('#keyboard').classList.toggle('uppercase', shift);

        return false;
      };

      let repeatTimeout = null;

      let keyRepeat = (e, time)=> {
        repeatTimeout = setTimeout(keyRepeat, 100);
        return handleKeypress(e);
      };

      item.onmousedown = (e)=> {
        e.stopPropagation();
        e.preventDefault();
        repeatTimeout = setTimeout(keyRepeat, 1000);
        return handleKeypress(e);
      };

      item.onmouseup = (e)=> {
        clearTimeout(repeatTimeout);
      };
    });

  };
});
