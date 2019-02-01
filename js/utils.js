let utils = {};

String.prototype.b2u = function () {
  var str = '';
  for (var i = 0; i < this.length; ++i) {
    if (this.charAt(i) < '\x80' || i == this.length - 1) {
      str += this.charAt(i);
      continue;
    }

    var b5index = 'x' + this.charCodeAt(i).toString(16).toUpperCase() +
      this.charCodeAt(i + 1).toString(16).toUpperCase();
    if (utils.b2uTable[b5index]) {
      str += utils.b2uTable[b5index];
      ++i;
    } else {
      str += this.charAt(i);
    }
  }
  return str;
};

class PttSocket extends WebSocket {
  constructor(url, callback) {
    super(url);
    this.binaryType = "arraybuffer";

    let buffer = [];
    let timeoutHandler;
    this.addEventListener('message', ({
      data: data
    }) => {
      clearTimeout(timeoutHandler);
      buffer.push(...new Uint8Array(data));
      timeoutHandler = setTimeout(() => {
        callback(String.fromCharCode(...buffer).b2u());
        buffer = [];
      }, 500);
    });

    this.addEventListener('open', (e) => {
      console.log("connected");
    });

    this.addEventListener('close', (e) => {
      console.log("88888");
    });
  }

  sendline(data) {
    console.log("SEND: ", data);
    this.send(new TextEncoder().encode(data+"\r"));
  }
}