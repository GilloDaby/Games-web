// Partition spatiale simple sur grille pour requetes proximite.
export default class SpatialHash {
  constructor(cellSize = 4) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _key(cx, cy) {
    return `${cx},${cy}`;
  }

  clear() {
    this.cells.clear();
  }

  insert(entity, x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const key = this._key(cx, cy);
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push({ entity, x, y });
  }

  query(x, y, radius = 1) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const results = [];
    const r = Math.ceil(radius / this.cellSize) + 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const key = this._key(cx + dx, cy + dy);
        const bucket = this.cells.get(key);
        if (bucket) results.push(...bucket);
      }
    }
    return results;
  }
}
