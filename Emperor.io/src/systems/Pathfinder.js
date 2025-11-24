// Pathfinder A* sur grille 4 directions.
export default class Pathfinder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  // isWalkable(x, y) -> boolean ; allowGoalBlock permet d'autoriser la case cible meme si bloquee.
  findPath(start, goal, isWalkable, allowGoalBlock = true) {
    const sx = Math.round(start.x);
    const sy = Math.round(start.y);
    const gx = Math.round(goal.x);
    const gy = Math.round(goal.y);

    if (!this.inBounds(sx, sy) || !this.inBounds(gx, gy)) return [];

    const open = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = this.key(sx, sy);
    open.push({ x: sx, y: sy, f: this.heuristic(sx, sy, gx, gy) });
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(sx, sy, gx, gy));

    while (open.length > 0) {
      // Extraire le noeud avec le plus petit f
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      const cKey = this.key(current.x, current.y);

      if (current.x === gx && current.y === gy) {
        return this.reconstructPath(cameFrom, current);
      }

      for (const [nx, ny] of this.neighbors(current.x, current.y)) {
        if (!this.inBounds(nx, ny)) continue;
        if (!isWalkable(nx, ny) && !(allowGoalBlock && nx === gx && ny === gy)) continue;

        const nKey = this.key(nx, ny);
        const tentativeG = (gScore.get(cKey) ?? Infinity) + 1; // cout uniforme
        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, cKey);
          gScore.set(nKey, tentativeG);
          const f = tentativeG + this.heuristic(nx, ny, gx, gy);
          fScore.set(nKey, f);
          const existing = open.find((n) => n.x === nx && n.y === ny);
          if (existing) {
            existing.f = f;
          } else {
            open.push({ x: nx, y: ny, f });
          }
        }
      }
    }

    return []; // pas de chemin
  }

  reconstructPath(cameFrom, current) {
    const path = [];
    let curKey = this.key(current.x, current.y);
    while (cameFrom.has(curKey)) {
      const [x, y] = this.fromKey(curKey);
      path.push({ x, y });
      curKey = cameFrom.get(curKey);
    }
    path.reverse();
    return path;
  }

  neighbors(x, y) {
    return [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
  }

  heuristic(x, y, gx, gy) {
    return Math.abs(x - gx) + Math.abs(y - gy); // Manhattan
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  key(x, y) {
    return `${x},${y}`;
  }

  fromKey(key) {
    const [x, y] = key.split(",").map((v) => parseInt(v, 10));
    return [x, y];
  }
}
