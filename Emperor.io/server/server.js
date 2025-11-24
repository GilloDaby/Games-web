// Serveur WebSocket minimal (autorité faible) : relaie les commandes entre clients d'une même room.
// Démarrage : `npm install ws` puis `node server/server.js`
// Les clients envoient {type:"cmd", cmd:{...}} ; le serveur diffuse aux pairs.
// Un message initial {type:"hello", playerId} est envoyé à chaque connexion.

import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
let nextPlayerId = 1;

function broadcast(room, data, except) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.room === room && client !== except) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  ws.room = "default";
  ws.playerId = nextPlayerId++;
  ws.send(JSON.stringify({ type: "hello", playerId: ws.playerId, room: ws.room }));

  ws.on("message", (data) => {
    let msg = null;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      return;
    }
    if (msg.type === "join" && msg.room) {
      ws.room = msg.room;
      return;
    }
    if (msg.type === "cmd" && msg.cmd) {
      broadcast(ws.room, JSON.stringify({ type: "cmd", cmd: msg.cmd }), ws);
    }
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
