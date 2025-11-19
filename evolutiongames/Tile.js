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

    if (texture && texture.complete && texture.naturalWidth > 0) {
      ctx.drawImage(texture, px, py, this.size, this.size);
    } else {
      ctx.fillStyle = "#2b6c3f";
      ctx.fillRect(px, py, this.size, this.size);
    }
  }
}
