class BossSkin {
  constructor(image) {
    this.image = image;
    this.columns = 3;
    this.rows = 4;
    this.frameWidth = Math.floor(image.width / this.columns);
    this.frameHeight = Math.floor(image.height / this.rows);
  }

  draw(ctx, x, y, variantRow, animTime, radius) {
    if (!this.image || !this.image.complete) return;
    const row = Math.max(0, Math.min(this.rows - 1, variantRow));
    const frameIndex = Math.floor((animTime * 8) % this.columns);
    const sx = frameIndex * this.frameWidth;
    const sy = row * this.frameHeight;
    const size = radius * 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x - radius, y - radius, size, size);
    ctx.restore();
  }
}

export async function loadBossSkin(src = "img/Boss/Boss 01.png") {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(new BossSkin(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default class Boss {
  constructor({ x, y, variant = 0, skin = null }) {
    Boss._id = (Boss._id ?? 0) + 1;
    this.id = `boss-${Boss._id}`;
    this.variant = variant;
    this.skin = skin;

    this.position = { x, y };

    // --- LEASH SYSTEM ---
    this.spawn = { x, y };     // Position d’origine
    this.leashRadius = 350;    // Distance maxi

    this.radius = 28;
    this.hp = 900;
    this.maxHp = 900;
    this.damage = 32;
    this.speed = 36;
    this.direction = Math.random() * Math.PI * 2;
    this.attackRange = 90;
    this.attackCooldown = 1.05;
    this.lastAttackTime = -Infinity;
    this.alive = true;
    this.animationTime = Math.random() * 5;
  }

  update(deltaSeconds, bounds, creatures = [], currentTime = 0, onHit = null) {
    if (!this.alive) return;

    this.animationTime += deltaSeconds;

    // --- DISTANCE FROM SPAWN ---
    const dxSpawn = this.position.x - this.spawn.x;
    const dySpawn = this.position.y - this.spawn.y;
    const distFromSpawn = Math.hypot(dxSpawn, dySpawn);

    // --- BOSS TOO FAR → RETURN TO SPAWN ---
    if (distFromSpawn > this.leashRadius) {
      const angleBack = Math.atan2(this.spawn.y - this.position.y, this.spawn.x - this.position.x);
      const vx = Math.cos(angleBack) * this.speed * 1.4;
      const vy = Math.sin(angleBack) * this.speed * 1.4;

      this.position.x = clamp(this.position.x + vx * deltaSeconds, this.radius, bounds.width - this.radius);
      this.position.y = clamp(this.position.y + vy * deltaSeconds, this.radius, bounds.height - this.radius);

      // no attack during leash return
      return;
    }

    // --- NORMAL BEHAVIOR ---
    const target = this.findClosestCreature(creatures);

    if (target) {
      const dx = target.position.x - this.position.x;
      const dy = target.position.y - this.position.y;
      const angle = Math.atan2(dy, dx);
      this.direction = angle;

      const distance = Math.hypot(dx, dy);

      if (distance > this.attackRange + target.radius + 8) {
        const vx = Math.cos(this.direction) * this.speed;
        const vy = Math.sin(this.direction) * this.speed;

        this.position.x = clamp(this.position.x + vx * deltaSeconds, this.radius, bounds.width - this.radius);
        this.position.y = clamp(this.position.y + vy * deltaSeconds, this.radius, bounds.height - this.radius);

      } else {
        const ready = currentTime - this.lastAttackTime >= this.attackCooldown;
        if (ready) {
          this.lastAttackTime = currentTime;
          target.takeDamage(this.damage, this);
          if (onHit) {
            onHit({
              x: target.position.x,
              y: target.position.y,
              radius: this.attackRange * 0.9,
              duration: 0.35
            });
          }
        }
      }

    } else {
      // wander slowly
      this.direction += (Math.random() - 0.5) * 0.3;
      const vx = Math.cos(this.direction) * this.speed * 0.6;
      const vy = Math.sin(this.direction) * this.speed * 0.6;

      this.position.x = clamp(this.position.x + vx * deltaSeconds, this.radius, bounds.width - this.radius);
      this.position.y = clamp(this.position.y + vy * deltaSeconds, this.radius, bounds.height - this.radius);
    }
  }

  takeDamage(amount, attacker = null) {
    if (!this.alive) return false;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      if (attacker?.onKill) attacker.onKill({ type: "boss" });
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();

    if (this.skin) {
      this.skin.draw(ctx, this.position.x, this.position.y, this.variant, this.animationTime, this.radius);
    } else {
      ctx.fillStyle = "#d972ff";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HP bar
    const barWidth = this.radius * 2.4;
    const barHeight = 5;
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 10;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = "#ff7b7b";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.restore();
  }

  findClosestCreature(creatures) {
    let closest = null;
    let minDist = Infinity;

    for (const creature of creatures) {
      if (!creature?.alive) continue;

      const dist = Math.hypot(
        creature.position.x - this.position.x,
        creature.position.y - this.position.y
      );

      if (dist < minDist) {
        minDist = dist;
        closest = creature;
      }
    }

    return closest;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
