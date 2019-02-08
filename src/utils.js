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


// reference: https://github.com/iamchucky/Web2PttChrome/blob/master/background.js

export const url2article = function(url) {
  // convert to board and article id
  var regex = new RegExp(/http[s]?:\/\/www.ptt.cc\/bbs\/([\w_-]+)\/(index|[G,M].\d{10}.A.[\d,A-F]{3}).html/g);
  var result = regex.exec(url);
  if (result && result.length == 3) {
    var aid = null;
    if (result[2] == 'index') {
      return { board: result[1] };
    }

    aid = fn2aid(result[2]);
    if (aid === null) {
      return null;
    }
    return { board: result[1], articleId: aid };
  }
  return null;
}

export const fn2aid = function (fn) {
  var aidu = [];
  var type = 0;
  var v1 = 0;
  var v2 = 0;

  var fnSplit = fn.split('.');
  if (fnSplit.length < 3)
    return null;

  switch (fnSplit[0]) {
    case 'M':
      type = 0;
      break;
    case 'G':
      type = 1;
      break;
    default:
      return null;
      break;
  }

  v1 = parseInt(fnSplit[1], 10); // base 10
  if (v1 === undefined)
    return null;

  if (fnSplit[2] != 'A')
    return null;

  if (fnSplit.length == 4) {
    v2 = parseInt(fnSplit[3], 16); // base 16
    if (v2 === undefined)
      return null;
  }

  // make it into arrays separate by mod 64
  aidu.push((v2 & 0x3f));
  v2 = v2 >> 6;
  aidu.push((v2 & 0x3f));
  for (var i = 0; i < 5; ++i) {
    aidu.push((v1 & 0x3f));
    v1 = v1 >> 6;
  }
  aidu.push((type & 0xf) << 2 | (v1 & 0x3));

  var aidu2aidcTable = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  var output = [];
  for (var i = 0; i < 8; ++i) {
    output.push(aidu2aidcTable[aidu[i]]);
  }

  return output.reverse().join('');
};

export const KeyMap = {
  Backspace: '\b',
  Tab: '\t',
  Enter: '\r',
  Escape: '\x1b',
  Home: '\x1b[1~',
  Insert: '\x1b[2~',
  Delete: '\x1b[3~',
  End: '\x1b[4~',
  PageUp: '\x1b[5~',
  PageDown: '\x1b[6~',
  ArrowUp: '\x1b[A',
  ArrowDown: '\x1b[B',
  ArrowRight: '\x1b[C',
  ArrowLeft: '\x1b[D',

  // Edge.
  Up: '\x1b[A',
  Down: '\x1b[B',
  Right: '\x1b[C',
  Left: '\x1b[D',

  // Special
  CtrlP: '\x10',
  CtrlU: '\x15',
  CtrlZ: '\x1a',
};