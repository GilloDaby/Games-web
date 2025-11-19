import Tile from "./Tile.js";

const DEFAULT_TILE_SIZE = 32;
const DEFAULT_TEXTURE = "img/tiles/grass.png";

export default class TileMap {
  constructor(width = 50, height = 50, tileSize = DEFAULT_TILE_SIZE, textureSrc = DEFAULT_TEXTURE) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.grid = [];
    this.texture = new Image();
    this.textureLoaded = false;

    this.texture.addEventListener("load", () => {
      this.textureLoaded = true;
    });
    this.texture.src = textureSrc;
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
        this.grid[y][x].draw(ctx, this.textureLoaded ? this.texture : null);
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
}
