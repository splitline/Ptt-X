import b2uTable from './b2u_table';

String.prototype.b2u = function () {
  var str = '';
  for (var i = 0; i < this.length; ++i) {
    if (this.charAt(i) < '\x80' || i == this.length - 1) {
      str += this.charAt(i);
      continue;
    }

    var b5index = 'x' + this.charCodeAt(i).toString(16).toUpperCase() +
      this.charCodeAt(i + 1).toString(16).toUpperCase();
    if (b2uTable[b5index]) {
      str += b2uTable[b5index];
      ++i;
    } else {
      str += this.charAt(i);
    }
  }
  return str;
};

String.prototype.width = function () {
  return this.split("").reduce(function (sum, c) {
    return sum + (c.charCodeAt(0) > 0xff ? 2 : 1);
  }, 0);
}

String.prototype.indexOfWidth = function (width) {
  for (var i = 0; i <= this.length; i++) {
    if (this.substr(0, i).width() > width)
      return i - 1;
  }
  return this.length;
}

String.prototype.substrWidth = function (start, width) {
  var length = width;
  var _start = start;
  var prefixSpace = 0,
    suffixSpace;
  start = this.indexOfWidth(_start);
  if (this.substr(0, start).width() < _start) {
    ++start;
    prefixSpace = Math.max(this.substr(0, start).width() - _start, 0);
  }
  length = this.substr(start).indexOfWidth(width - prefixSpace);
  suffixSpace = Math.min(width, this.substr(start).width()) -
    (prefixSpace + this.substr(start, length).width());
  return " ".repeat(prefixSpace) + this.substr(start, length) + " ".repeat(suffixSpace);
}

// debug
String.prototype.hexEncode = function () {
  var hex, i;
  var result = "";
  for (i = 0; i < this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += ("000" + hex).slice(-4);
  }

  return result
}

export const KEYS = {
  Enter: '\r',
  ArrowLeft: '\x1b[D',
  ArrowRight: '\x1b[C',
  ArrowUp: '\x1b[A',
  ArrowDown: '\x1b[B',
  PgUp: '\x1b[5~',
  PgDown: '\x1b[6~',
  Home: '\x1b[1~',
  End: '\x1b[4~',
  Backspace: '\b',
  CtrlP: '\x10',
  CtrlU: '\x15',
  CtrlZ: '\x1a',
};