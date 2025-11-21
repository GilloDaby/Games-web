import Tile, { registerTileTexture } from "./Tile.js";

const DEFAULT_TILE_SIZE = 32;
const TILE_TEXTURE_PATHS = {
  grass: "img/tiles/grass.png",
  sand: "img/tiles/sand.png",
  snow: "img/tiles/snow.png",
  water: "img/tiles/water.png",
  river: "img/tiles/river.png",
  bridge: "img/tiles/bridge.png",
  forest: "img/tiles/forest.png", 

};

export default class TileMap {
  constructor(width = 50, height = 50, tileSize = DEFAULT_TILE_SIZE) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.grid = [];
    this.textures = {};
    this.texturesLoaded = false;
    this.loadTextures();
  }

  generateFlat(type = "grass") {
    this.grid = [];
    for (let y = 0; y < this.height; y += 1) {
      const row = [];
      for (let x = 0; x < this.width; x += 1) {
        row.push(new Tile(x, y, this.tileSize, type));
      }
      this.grid.push(row);
    }
  }

  generateBiomes() {
    this.generateFlat("grass");
    // Organic blobs instead of perfect circles
    this.paintOrganicRegions("sand", { count: 5, size: [90, 180], chaos: 0.35 });
    this.paintOrganicRegions("snow", { count: 5, size: [90, 180], chaos: 0.32 });
    this.paintOrganicRegions("forest", { count: 7, size: [60, 140], chaos: 0.45 });
    // Small scattered ponds
    this.paintOrganicRegions("water", { count: 10, size: [18, 40], chaos: 0.55 });
  }

  paintOrganicRegions(type, { count = 4, size = [60, 120], chaos = 0.4 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const target = randomBetween(size[0], size[1]);
      const seedX = Math.floor(Math.random() * this.width);
      const seedY = Math.floor(Math.random() * this.height);
      this.paintOrganicBlob(seedX, seedY, Math.floor(target), type, chaos);
    }
  }

  paintOrganicBlob(seedX, seedY, targetSize, type, chaos) {
    const stack = [{ x: seedX, y: seedY }];
    const visited = new Set();
    let painted = 0;

    while (stack.length && painted < targetSize) {
      const index = Math.floor(Math.random() * stack.length);
      const current = stack.splice(index, 1)[0];
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      if (!this.isInside(current.x, current.y)) {
        continue;
      }
      const tile = this.grid[current.y][current.x];
      if (tile.type === "river" || tile.type === "bridge") {
        continue;
      }
      tile.type = type;
      painted += 1;

      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        // Bias growth toward blob edges with some randomness
        if (Math.random() < 0.7 + chaos * 0.3) {
          stack.push(neighbor);
        }
      }

      // occasional skip to create uneven edges
      if (Math.random() < chaos) {
        const jitterX = current.x + Math.round((Math.random() - 0.5) * 3);
        const jitterY = current.y + Math.round((Math.random() - 0.5) * 3);
        if (this.isInside(jitterX, jitterY)) {
          stack.push({ x: jitterX, y: jitterY });
        }
      }
    }
  }

  getNeighbors(x, y) {
    const offsets = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: -1 },
    ];
    const neighbors = [];
    for (const { dx, dy } of offsets) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInside(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }

  isInside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  generateRiver() {
    if (!this.grid.length) {
      return;
    }
    let currentX = Math.floor(Math.random() * this.width);
    let currentY = 0;
    const riverTiles = [];

    while (currentY < this.height) {
      riverTiles.push({ x: currentX, y: currentY });
      this.grid[currentY][currentX].type = "river";

      const direction = Math.random();
      if (direction < 0.2 && currentX > 0) {
        currentX -= 1;
      } else if (direction > 0.8 && currentX < this.width - 1) {
        currentX += 1;
      }
      currentY += 1;
    }

    this.generateBridges(riverTiles);
  }

  generateBridges(riverTiles) {
    if (!riverTiles.length) {
      return;
    }
    const desired = Math.max(3, Math.floor(riverTiles.length / 8));
    for (let i = 1; i <= desired; i += 1) {
      const index = Math.min(
        riverTiles.length - 1,
        Math.floor((i * riverTiles.length) / (desired + 1)),
      );
      const tile = riverTiles[index];
      this.grid[tile.y][tile.x].type = "bridge";
      // small chance to widen bridge
      if (Math.random() < 0.5) {
        if (tile.x + 1 < this.width) {
          this.grid[tile.y][tile.x + 1].type = "bridge";
        }
        if (tile.x - 1 >= 0) {
          this.grid[tile.y][tile.x - 1].type = "bridge";
        }
      }
    }
  }

  /**
   * Dessine l'ensemble de la tilemap ou uniquement la portion visible.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{minX:number,maxX:number,minY:number,maxY:number}} [viewport]
   */
  draw(ctx, viewport = null) {
    if (!this.grid.length) {
      return;
    }
    const clampIndex = (value, max) => Math.max(0, Math.min(max, value));
    const minX = viewport
      ? clampIndex(Math.floor(viewport.minX / this.tileSize), this.width - 1)
      : 0;
    const maxX = viewport
      ? clampIndex(Math.floor(viewport.maxX / this.tileSize) + 1, this.width - 1)
      : this.width - 1;
    const minY = viewport
      ? clampIndex(Math.floor(viewport.minY / this.tileSize), this.height - 1)
      : 0;
    const maxY = viewport
      ? clampIndex(Math.floor(viewport.maxY / this.tileSize) + 1, this.height - 1)
      : this.height - 1;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        this.grid[y][x].draw(ctx, this.texturesLoaded ? this.textures[this.grid[y][x].type] : null);
      }
    }
  }

  /**
   * Retourne la tuile correspondant à des coordonnées pixel.
   * @param {number} px
   * @param {number} py
   */
  getTileAt(px, py) {
    const x = Math.floor(px / this.tileSize);
    const y = Math.floor(py / this.tileSize);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }
    return this.grid[y][x];
  }

  loadTextures() {
    const entries = Object.entries(TILE_TEXTURE_PATHS);
    let loadedCount = 0;
    if (!entries.length) {
      this.texturesLoaded = true;
      return;
    }

    for (const [type, src] of entries) {
      const img = new Image();
      img.addEventListener("load", () => {
        loadedCount += 1;
        if (loadedCount === entries.length) {
          this.texturesLoaded = true;
        }
      });
      img.src = src;
      this.textures[type] = img;
      registerTileTexture(type, img);
    }
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
