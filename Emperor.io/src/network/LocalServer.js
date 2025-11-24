import { deserializeCommand } from "./Protocol.js";

// Serveur local simulé : applique des commandes sur l'instance Game et renvoie un snapshot.
export default class LocalServer {
  constructor(game) {
    this.game = game;
    this.commandQueue = [];
    this.tickCount = 0;
    this.onSnapshot = null; // callback(snapshot)
  }

  enqueue(raw) {
    const cmd = typeof raw === "string" ? deserializeCommand(raw) : raw;
    if (cmd) this.commandQueue.push(cmd);
  }

  tick(dt) {
    // Applique les commandes
    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift();
      this.game.applyCommand(cmd);
    }
    this.tickCount += 1;

    // Snapshot pour le client
    if (this.onSnapshot) {
      const snap = this.game.collectNetworkSnapshot(this.tickCount);
      this.onSnapshot(snap);
    }
  }
}
