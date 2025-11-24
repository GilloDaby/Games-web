// Client reseau simplifie. En local, il passe par un LocalServer.
export default class NetClient {
  constructor(server) {
    this.server = server;
    this.snapshots = [];
    if (this.server) {
      this.server.onSnapshot = (s) => this.snapshots.push(s);
    }
  }

  send(command) {
    if (this.server) {
      this.server.enqueue(command);
    }
    // plus tard : websocket.send(...)
  }

  consumeSnapshots() {
    const snaps = [...this.snapshots];
    this.snapshots.length = 0;
    return snaps;
  }
}
