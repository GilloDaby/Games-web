const TILE_TEXTURES = {
  grass: null,
  sand: null,
  snow: null,
  water: null,
  river: null,
  bridge: null,
};

export function registerTileTexture(type, image) {
  if (TILE_TEXTURES[type] !== undefined) {
    TILE_TEXTURES[type] = image;
  }
}

export default class Tile {
  constructor(x, y, size, type = "grass") {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
  }

  /**
   * Dessine la tuile à l'écran.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement|null} texture
   */
  draw(ctx, texture) {
    const px = this.x * this.size;
    const py = this.y * this.size;

    const typeTexture = texture || TILE_TEXTURES[this.type];
    if (typeTexture && typeTexture.complete && typeTexture.naturalWidth > 0) {
      ctx.drawImage(typeTexture, px, py, this.size, this.size);
    } else {
      ctx.fillStyle = this.fallbackColor();
      ctx.fillRect(px, py, this.size, this.size);
    }
  }

  fallbackColor() {
    switch (this.type) {
      case "sand":
        return "#c4a45a";
      case "snow":
        return "#dfe8f3";
      case "forest":
        return "#174d2f";
      case "water":
      case "river":
        return "#3a6ea5";
      case "bridge":
        return "#8b6640";
      case "grass":
      default:
        return "#2b6c3f";
    }
  }
}
