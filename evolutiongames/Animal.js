import PlayerSkin from "./PlayerSkin.js";

const DEFAULT_ANIMAL_HP = 100;
const WANDER_TURN_RATE = 1.4;
const WANDER_CHANGE_INTERVAL = 2.5;
const MIN_SPEED = 22;
const MAX_SPEED = 40;

export default class Animal {
  constructor({ x, y, radius = 10, skin = null, tileMap = null }) {
    Animal._id = (Animal._id ?? 0) + 1;
    this.id = `animal-${Animal._id}`;
    this.position = { x, y };
    this.radius = radius;
    this.direction = Math.random() * Math.PI * 2;
    this.speed = randomBetween(MIN_SPEED, MAX_SPEED);
    this.maxHp = DEFAULT_ANIMAL_HP;
    this.hp = DEFAULT_ANIMAL_HP;
    this.alive = true;
    this.tileMap = tileMap;
    this.skin = skin instanceof PlayerSkin ? skin : null;
    this.animationTime = Math.random() * 5;
    this.wanderTimer = randomBetween(0, WANDER_CHANGE_INTERVAL);
  }

  update(deltaSeconds, bounds) {
    if (!this.alive) {
      return;
    }
    this.animationTime += deltaSeconds;
    this.wanderTimer -= deltaSeconds;
    if (this.wanderTimer <= 0) {
      this.direction += (Math.random() - 0.5) * WANDER_TURN_RATE;
      this.wanderTimer = WANDER_CHANGE_INTERVAL + Math.random() * 1.5;
    }

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;
    const nextX = this.position.x + velocityX * deltaSeconds;
    const nextY = this.position.y + velocityY * deltaSeconds;

    const blockingTile = this.tileMap?.getTileAt(nextX, nextY);
    if (blockingTile && (blockingTile.type === "river" || blockingTile.type === "water")) {
      this.direction = normalizeAngle(this.direction + Math.PI / 2 + (Math.random() - 0.5) * 0.8);
      return;
    }

    this.position.x = clamp(nextX, this.radius, bounds.width - this.radius);
    this.position.y = clamp(nextY, this.radius, bounds.height - this.radius);
  }

  takeDamage(amount, attacker = null) {
    if (!this.alive) {
      return false;
    }
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) {
      return;
    }
    ctx.save();
    if (this.skin) {
      const dirIndex = this.getSpriteDirectionIndex();
      this.skin.draw(ctx, this.position.x, this.position.y, dirIndex, this.animationTime, this.radius);
    } else {
      ctx.fillStyle = "#c9e2ff";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const barWidth = this.radius * 2;
    const barHeight = 3;
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 6;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = "#5eff8c";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.restore();
  }

  getSpriteDirectionIndex() {
    const dx = Math.cos(this.direction);
    const dy = Math.sin(this.direction);
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 2 : 1;
    }
    return dy > 0 ? 0 : 3;
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}
