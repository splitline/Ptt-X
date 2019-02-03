import {
  EventEmitter
} from 'events';

class PttSocket extends EventEmitter {
  constructor(url) {
    super();
    this.socket = new WebSocket(url);

    this.socket.binaryType = "arraybuffer";
    this.socket.addEventListener('message', ({
      data
    }) => {
      let buffer = [],
        timeoutHandler;
      clearTimeout(timeoutHandler);
      buffer.push(...new Uint8Array(data));
      timeoutHandler = setTimeout(() => {
        this.emit('message', String.fromCharCode(...buffer).b2u());
      }, 50);
    });

    this.socket.addEventListener('open', (e) => {
      console.log("connected");
      this.emit("connect");
    });

    this.socket.addEventListener('close', (e) => {
      alert("斷線了 888888");
    });

    this.socket.addEventListener('error', (e) => {
      console.log(e);
    });
  }

  async send(data) {
    console.log("SEND:", data);
    this.socket.send(new TextEncoder().encode(data));
    return new Promise(resolve => {
      this.once("message", () => resolve());
    });
  }

  async sendline(data = "") {
    return this.send(data + "\r");
  }
}

export default PttSocket;