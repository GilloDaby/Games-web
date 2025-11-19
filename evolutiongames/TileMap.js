import Tile, { registerTileTexture } from "./Tile.js";

const DEFAULT_TILE_SIZE = 32;
const TILE_TEXTURE_PATHS = {
  grass: "img/tiles/grass.png",
  sand: "img/tiles/sand.png",
  snow: "img/tiles/snow.png",
  water: "img/tiles/water.png",
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
    const paintOperations = [
      { type: "sand", radius: 8, count: 5 },
      { type: "snow", radius: 10, count: 4 },
      { type: "forest", radius: 6, count: 6 },
      { type: "water", radius: 5, count: 5 },
    ];

    for (const op of paintOperations) {
      for (let i = 0; i < op.count; i += 1) {
        const centerX = Math.floor(Math.random() * this.width);
        const centerY = Math.floor(Math.random() * this.height);
        this.paintCircle(centerX, centerY, op.radius, op.type);
      }
    }
  }

  paintCircle(cx, cy, radius, type) {
    const rSquared = radius * radius;
    for (let y = Math.max(0, cy - radius); y < Math.min(this.height, cy + radius); y += 1) {
      for (let x = Math.max(0, cx - radius); x < Math.min(this.width, cx + radius); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rSquared) {
          this.grid[y][x].type = type;
        }
      }
    }
  }

  /**
   * Dessine l'ensemble de la tilemap.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.grid.length) {
      return;
    }
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
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
