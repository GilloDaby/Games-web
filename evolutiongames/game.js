const ARENA_CONFIG = {
  width: 800,
  height: 600,
  creatureCount: 10,
  minSpeed: 40,
  maxSpeed: 90,
  creatureRadius: 12,
};

class Creature {
  constructor({ x, y, speed, direction, radius, color }) {
    this.position = { x, y };
    this.speed = speed;
    this.direction = direction;
    this.radius = radius;
    this.color = color;
  }

  update(deltaSeconds, bounds) {
    // Add subtle randomness so movement feels organic before AI exists.
    this.direction += (Math.random() - 0.5) * 0.6;

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    this.position.x += velocityX * deltaSeconds;
    this.position.y += velocityY * deltaSeconds;

    this.handleWallBounce(bounds);
  }

  handleWallBounce({ width, height }) {
    const { radius } = this;
    const minX = radius;
    const maxX = width - radius;
    const minY = radius;
    const maxY = height - radius;

    if (this.position.x <= minX) {
      this.position.x = minX;
      this.direction = Math.PI - this.direction;
    } else if (this.position.x >= maxX) {
      this.position.x = maxX;
      this.direction = Math.PI - this.direction;
    }

    if (this.position.y <= minY) {
      this.position.y = minY;
      this.direction = -this.direction;
    } else if (this.position.y >= maxY) {
      this.position.y = maxY;
      this.direction = -this.direction;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Arena {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.creatures = [];
    this.lastTimestamp = 0;
    this.rafId = null;

    this.spawnCreatures(ARENA_CONFIG.creatureCount);
  }

  spawnCreatures(count) {
    for (let i = 0; i < count; i += 1) {
      this.creatures.push(
        new Creature({
          x: randomBetween(ARENA_CONFIG.creatureRadius, this.width - ARENA_CONFIG.creatureRadius),
          y: randomBetween(ARENA_CONFIG.creatureRadius, this.height - ARENA_CONFIG.creatureRadius),
          speed: randomBetween(ARENA_CONFIG.minSpeed, ARENA_CONFIG.maxSpeed),
          direction: randomBetween(0, Math.PI * 2),
          radius: ARENA_CONFIG.creatureRadius,
          color: randomPastel(),
        }),
      );
    }
  }

  start() {
    const step = (timestamp) => {
      const deltaSeconds = Math.min((timestamp - this.lastTimestamp) / 1000 || 0, 0.05);
      this.lastTimestamp = timestamp;

      this.update(deltaSeconds);
      this.draw();

      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame((t) => {
      this.lastTimestamp = t;
      step(t);
    });
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  update(deltaSeconds) {
    for (const creature of this.creatures) {
      creature.update(deltaSeconds, { width: this.width, height: this.height });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawArena();

    for (const creature of this.creatures) {
      creature.draw(this.ctx);
    }
  }

  drawArena() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#04111c";
    ctx.fillRect(0, 0, this.width, this.height);

    // Light grid lines provide spatial reference.
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = gridSize; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.height);
      ctx.stroke();
    }
    for (let y = gridSize; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
    ctx.restore();
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomPastel() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 65%)`;
}

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const arena = new Arena(canvas);
  arena.start();
});
