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
      let buffer = [];
      buffer.push(...new Uint8Array(data));
      setTimeout(() => {
        this.emit('message', String.fromCharCode(...buffer).b2u());
      }, 50);
    });

    this.socket.addEventListener('open', this.emit.bind(this, 'connect'));
    this.socket.addEventListener('close', this.emit.bind(this, 'disconnect'));
    this.socket.addEventListener('error', this.emit.bind(this, 'error'));
  }

  async send(data) {
    this.socket.send(new TextEncoder().encode(data));
  }
}

export default PttSocket;
