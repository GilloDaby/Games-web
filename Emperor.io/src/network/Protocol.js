// Definitions legeres pour preparer le client-serveur.

export const CommandTypes = {
  MOVE: "move",            // { type, playerId, target: {x,y}, formation }
  BUILD: "build",          // { type, playerId, buildType, x, y }
  ATTACK: "attack",        // { type, playerId, target: {x,y,type} }
  TRAIN: "train",          // { type, playerId, unitType }
};

// Exemple de snapshot minimal : {
//   tick,
//   players: [
//     { id, resources, population, populationCap,
//       citizens: [{x,y,state}],
//       soldiers: [{x,y,hp,state}],
//       buildings: [{x,y,type,completed}]
//     }
//   ]
// }
export function serializeCommand(cmd) {
  return JSON.stringify(cmd);
}

export function deserializeCommand(raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
