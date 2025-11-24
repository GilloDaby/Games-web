// Mini-carte simple : dessine un aperçu de la carte et permet de cliquer pour recentrer la caméra.
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

    // Fond
    ctx.fillStyle = "#0b1622";
    ctx.fillRect(0, 0, this.width, this.height);

    // Ressources simplifiées
    for (let y = 0; y < map.height; y += 2) {
      for (let x = 0; x < map.width; x += 2) {
        const type = map.get(x, y);
        ctx.fillStyle = this.colorFor(type);
        const sx = (x / map.width) * this.width;
        const sy = (y / map.height) * this.height;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

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

  colorFor(type) {
    if (type === "wood") return "rgba(46,139,87,0.8)";
    if (type === "stone") return "rgba(108,122,137,0.8)";
    if (type === "food") return "rgba(201,162,39,0.8)";
    return "rgba(15,27,43,0.8)";
  }
}
