obtain([], ({ Import })=> {
  var shift = 0;
  var capslock = false;

  Import.onready = ()=> {
    µ('.number, .symbol, .delete', µ('#numpad', Import.refDiv)).forEach(function (item) {

      let handleKeypress = (e)=> {
        var actEl = document.activeElement;
        if (actEl == null || actEl.tagName != 'INPUT') return false;

        let _this = item;
        var character = _this.textContent; // If it's a lowercase letter, nothing happens to this variable

        var keycode = character && character.charCodeAt(0);

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

        if (actEl.selectionStart || actEl.selectionStart == '0') {
          var startPos = actEl.selectionStart;
          var endPos = actEl.selectionEnd;
          actEl.value = actEl.value.substring(0, startPos)
            + character
            + actEl.value.substring(endPos, actEl.value.length);
          actEl.setSelectionRange(startPos + 1, startPos + 1);
        } else {
          actEl.value += character;
        }

        var eventObj = document.createEvent('Events');

        if (eventObj.initEvent) {
          eventObj.initEvent('keypress', true, true);
        }

        eventObj.keyCode = keycode;
        eventObj.which = keycode;
        eventObj.key = character;

        document.activeElement.dispatchEvent(eventObj);

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
