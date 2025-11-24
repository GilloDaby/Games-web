// Client WebSocket minimal : reçoit un playerId, envoie/écoute des commandes.
export default class WebSocketClient {
  constructor(url, onCommand) {
    this.url = url;
    this.onCommand = onCommand;
    this.playerId = null;
    this.connected = false;
    this.ws = null;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.connected = true;
    };
    this.ws.onmessage = (event) => {
      let msg = null;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      if (msg.type === "hello") {
        this.playerId = msg.playerId;
      } else if (msg.type === "cmd" && msg.cmd) {
        if (this.onCommand) this.onCommand(msg.cmd);
      }
    };
    this.ws.onclose = () => {
      this.connected = false;
    };
  }

  sendCommand(cmd) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({ type: "cmd", cmd }));
  }
}
