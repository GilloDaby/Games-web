import Tile from "./Tile.js";

function mulberry32(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(x, y, seed) {
  const h = x * 374761393 + y * 668265263 + seed * 0x9e3779b1;
  const r = Math.sin(h) * 43758.5453;
  return r - Math.floor(r);
}

function valueNoise(x, y, seed, scale = 1) {
  const nx = Math.floor(x * scale);
  const ny = Math.floor(y * scale);
  const fx = x * scale - nx;
  const fy = y * scale - ny;
  const v00 = hash2D(nx, ny, seed);
  const v10 = hash2D(nx + 1, ny, seed);
  const v01 = hash2D(nx, ny + 1, seed);
  const v11 = hash2D(nx + 1, ny + 1, seed);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ix0 = lerp(v00, v10, fx);
  const ix1 = lerp(v01, v11, fx);
  return lerp(ix0, ix1, fy);
}

export default class ProceduralTileMap {
  constructor({
    tileSize = 32,
    seed = Date.now(),
    spanTiles = 220,
    biomeScale = 0.01,
    moistureScale = 0.018,
    width = null,
    height = null,
  } = {}) {
    this.tileSize = tileSize;
    const tilesX = width ? Math.ceil(width / tileSize) : spanTiles;
    const tilesY = height ? Math.ceil(height / tileSize) : spanTiles;
    this.width = tilesX * tileSize;
    this.height = tilesY * tileSize;
    this.seed = typeof seed === "number" ? seed : this.seedFromString(`${seed}`);
    this.biomeScale = biomeScale;
    this.moistureScale = moistureScale;
    this.tiles = new Map();
    this.random = mulberry32(this.seed);
  }

  seedFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    return Math.abs(hash);
  }

  getTileKey(x, y) {
    return `${x},${y}`;
  }

  getTileAt(px, py) {
    const x = Math.floor(px / this.tileSize);
    const y = Math.floor(py / this.tileSize);
    return this.getTile(x, y);
  }

  getTile(x, y) {
    const key = this.getTileKey(x, y);
    if (this.tiles.has(key)) {
      return this.tiles.get(key);
    }
    const type = this.pickType(x, y);
    const tile = new Tile(x, y, this.tileSize, type);
    this.tiles.set(key, tile);
    return tile;
  }

  pickType(x, y) {
    const biomeNoise = valueNoise(x, y, this.seed, this.biomeScale);
    const moistureNoise = valueNoise(x + 1000, y - 500, this.seed, this.moistureScale);
    const riverNoise = valueNoise(x + 2000, y + 2000, this.seed, this.biomeScale * 1.6);
    if (riverNoise > 0.72 && riverNoise < 0.78) {
      return "river";
    }
    if (biomeNoise < 0.2) {
      return "water";
    }
    if (biomeNoise < 0.32) {
      return "sand";
    }
    if (biomeNoise > 0.78) {
      return "snow";
    }
    if (moistureNoise > 0.6) {
      return "forest";
    }
    return "grass";
  }

  draw(ctx, viewport = null) {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const minX = viewport
      ? clamp(Math.floor(viewport.minX / this.tileSize) - 1, 0, Math.floor(this.width / this.tileSize))
      : 0;
    const maxX = viewport
      ? clamp(Math.floor(viewport.maxX / this.tileSize) + 1, 0, Math.floor(this.width / this.tileSize))
      : Math.floor(this.width / this.tileSize);
    const minY = viewport
      ? clamp(Math.floor(viewport.minY / this.tileSize) - 1, 0, Math.floor(this.height / this.tileSize))
      : 0;
    const maxY = viewport
      ? clamp(Math.floor(viewport.maxY / this.tileSize) + 1, 0, Math.floor(this.height / this.tileSize))
      : Math.floor(this.height / this.tileSize);

    for (let ty = minY; ty <= maxY; ty += 1) {
      for (let tx = minX; tx <= maxX; tx += 1) {
        const tile = this.getTile(tx, ty);
        tile.draw(ctx, null);
      }
    }
  }
}
