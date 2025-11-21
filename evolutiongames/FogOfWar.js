export default class FogOfWar {
  constructor(tileSize = 32) {
    this.tileSize = tileSize;
    this.discovered = new Set();
  }

  key(x, y) {
    return `${x},${y}`;
  }

  revealCircle(x, y, radius) {
    if (!Number.isFinite(radius) || radius <= 0) {
      return;
    }
    const startX = Math.floor((x - radius) / this.tileSize);
    const endX = Math.floor((x + radius) / this.tileSize);
    const startY = Math.floor((y - radius) / this.tileSize);
    const endY = Math.floor((y + radius) / this.tileSize);
    const r2 = radius * radius;
    for (let tx = startX; tx <= endX; tx += 1) {
      for (let ty = startY; ty <= endY; ty += 1) {
        const centerX = (tx + 0.5) * this.tileSize;
        const centerY = (ty + 0.5) * this.tileSize;
        const dx = centerX - x;
        const dy = centerY - y;
        if (dx * dx + dy * dy <= r2) {
          this.discovered.add(this.key(tx, ty));
        }
      }
    }
  }

  draw(ctx, viewport, lights = []) {
    if (!ctx || !viewport) {
      return;
    }
    const minX = Math.floor(viewport.minX / this.tileSize) - 1;
    const maxX = Math.floor(viewport.maxX / this.tileSize) + 1;
    const minY = Math.floor(viewport.minY / this.tileSize) - 1;
    const maxY = Math.floor(viewport.maxY / this.tileSize) + 1;
    ctx.save();
    for (let ty = minY; ty <= maxY; ty += 1) {
      for (let tx = minX; tx <= maxX; tx += 1) {
        const key = this.key(tx, ty);
        const centerX = (tx + 0.5) * this.tileSize;
        const centerY = (ty + 0.5) * this.tileSize;
        const lit = lights.some((light) => {
          const dx = centerX - light.x;
          const dy = centerY - light.y;
          return dx * dx + dy * dy <= light.radius * light.radius;
        });
        if (lit) {
          continue;
        }
        const discovered = this.discovered.has(key);
        const alpha = discovered ? 0.6 : 0.92;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(tx * this.tileSize, ty * this.tileSize, this.tileSize, this.tileSize);
      }
    }
    ctx.restore();
  }
}
