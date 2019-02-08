import {
  EventEmitter
} from 'events';

class PttSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.socket = this.buildSocket();
  }

  buildSocket() {
    let _socket = new WebSocket(this.url);

    _socket.binaryType = "arraybuffer";
    _socket.addEventListener('message', ({
      data
    }) => {
      let buffer = [];
      buffer.push(...new Uint8Array(data));
      this.emit('_message', String.fromCharCode(...buffer).b2u());
      setTimeout(() => {
        this.emit('data', String.fromCharCode(...buffer).b2u());
      }, 200);
    });

    _socket.addEventListener('open', this.emit.bind(this, 'connect'));
    _socket.addEventListener('close', this.emit.bind(this, 'disconnect'));
    _socket.addEventListener('error', this.emit.bind(this, 'error'));

    return _socket;
  }

  async send(data) {
    this.socket.send(new TextEncoder().encode(data));
  }

  reconnect() {
    this.socket = this.buildSocket();
  }
}

export default PttSocket;
