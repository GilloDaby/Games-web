// Camera 2D simple avec zoom.
export default class Camera {
  constructor(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.x = mapWidth / 2;
    this.y = mapHeight / 2;
    this.zoom = 1; // 1 = 1 case = tileSize de base
    this.minZoom = 0.5;
    this.maxZoom = 2.5;
    this.speed = 20; // cases par seconde (pour pan clavier)
  }

  update(dt, input) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.clamp();
    }
  }

  setZoom(delta) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * delta));
  }

  centerOn(x, y) {
    this.x = x;
    this.y = y;
    this.clamp();
  }

  clamp() {
    this.x = Math.max(0, Math.min(this.mapWidth, this.x));
    this.y = Math.max(0, Math.min(this.mapHeight, this.y));
  }
}
