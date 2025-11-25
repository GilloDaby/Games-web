import { TILE_COLORS } from "../utils/constants.js";

// Mini-carte simple : dessine un apercu de la carte et permet de cliquer pour recentrer la camera.
export default class MiniMap {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById("minimap");
    this.ctx = this.canvas?.getContext("2d");
    this.width = 180;
    this.height = 180;
    this.lastRender = 0;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.addEventListener("click", (e) => this.handleClick(e));
    }
  }

  handleClick(event) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gx = (x / this.width) * this.game.tileMap.width;
    const gy = (y / this.height) * this.game.tileMap.height;
    this.game.camera.centerOn(gx, gy);
  }

  render(timestamp) {
    if (!this.ctx || !this.canvas) return;
    if (timestamp - this.lastRender < 80) return; // throttle
    this.lastRender = timestamp;
    const ctx = this.ctx;
    const map = this.game.tileMap;
    ctx.clearRect(0, 0, this.width, this.height);

    // Fond organique : on reprend la texture de la carte en la reduisant.
    const tileSize = Math.max(4, this.game.computeTileSize());
    const texture = map.ensureTexture(tileSize, TILE_COLORS);
    const texW = map.width * tileSize;
    const texH = map.height * tileSize;
    ctx.drawImage(texture, 0, 0, texW, texH, 0, 0, this.width, this.height);

    // Batiments
    for (const b of this.game.buildings) {
      const sx = (b.x / map.width) * this.width;
      const sy = (b.y / map.height) * this.height;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }

    // Ville ennemie
    if (this.game.enemyCity && !this.game.enemyCity.conquered && this.game.enemyCity.hp > 0) {
      const sx = (this.game.enemyCity.x / map.width) * this.width;
      const sy = (this.game.enemyCity.y / map.height) * this.height;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
    }

    // Unites
    for (const c of this.game.player.citizens) {
      const sx = (c.x / map.width) * this.width;
      const sy = (c.y / map.height) * this.height;
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(sx, sy, 2, 2);
    }
    for (const s of this.game.soldiers) {
      const sx = (s.x / map.width) * this.width;
      const sy = (s.y / map.height) * this.height;
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(sx, sy, 2, 2);
    }
    for (const c of this.game.aiPlayer.citizens) {
      const sx = (c.x / map.width) * this.width;
      const sy = (c.y / map.height) * this.height;
      ctx.fillStyle = "#bbf7d0";
      ctx.fillRect(sx, sy, 2, 2);
    }
    for (const s of this.game.aiPlayer.soldiers) {
      const sx = (s.x / map.width) * this.width;
      const sy = (s.y / map.height) * this.height;
      ctx.fillStyle = "#34d399";
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Vue camera
    const view = this.game.getViewBounds(this.game.computeTileSize());
    const vx = (view.x / map.width) * this.width;
    const vy = (view.y / map.height) * this.height;
    const vw = (view.w / map.width) * this.width;
    const vh = (view.h / map.height) * this.height;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }
}
