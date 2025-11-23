(() => {
  class Mob {
    constructor({ x, y, size, color, speed = 90, maxHealth = 20 }) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.size = size;
      this.speed = speed;
      this.gravity = 2000;
      this.friction = 0.82;
      this.onGround = false;
      this.maxHealth = maxHealth;
      this.health = maxHealth;
      this.dead = false;

      this.sprite = new PIXI.Graphics()
        .beginFill(color)
        .drawRect(0, 0, size, size)
        .endFill();
      this.sprite.position.set(this.x, this.y);
    }

    update(dt, world, tileSize) {
      this.vx *= this.friction;
      this.vy += this.gravity * dt;
      this.moveHorizontal(dt, world, tileSize);
      this.moveVertical(dt, world, tileSize);
      this.syncSprite();
    }

    moveHorizontal(dt, world, tileSize) {
      const nextX = this.x + this.vx * dt;
      const bounds = {
        left: nextX,
        right: nextX + this.size,
        top: this.y,
        bottom: this.y + this.size,
      };

      if (this.vx > 0) {
        const tileX = Math.floor((bounds.right - 1) / tileSize);
        if (this.collides(tileX, bounds.top, bounds.bottom, world, tileSize)) {
          const stopX = tileX * tileSize - this.size;
          this.x = stopX;
          this.vx = 0;
          return;
        }
      } else if (this.vx < 0) {
        const tileX = Math.floor(bounds.left / tileSize);
        if (this.collides(tileX, bounds.top, bounds.bottom, world, tileSize)) {
          const stopX = (tileX + 1) * tileSize;
          this.x = stopX;
          this.vx = 0;
          return;
        }
      }

      this.x = nextX;
    }

    moveVertical(dt, world, tileSize) {
      const nextY = this.y + this.vy * dt;
      const bounds = {
        left: this.x,
        right: this.x + this.size,
        top: nextY,
        bottom: nextY + this.size,
      };

      this.onGround = false;

      if (this.vy > 0) {
        const tileY = Math.floor((bounds.bottom - 1) / tileSize);
        if (this.collidesY(tileY, bounds.left, bounds.right, world, tileSize)) {
          const stopY = tileY * tileSize - this.size;
          this.y = stopY;
          this.vy = 0;
          this.onGround = true;
          return;
        }
      } else if (this.vy < 0) {
        const tileY = Math.floor(bounds.top / tileSize);
        if (this.collidesY(tileY, bounds.left, bounds.right, world, tileSize)) {
          const stopY = (tileY + 1) * tileSize;
          this.y = stopY;
          this.vy = 0;
          return;
        }
      }

      this.y = nextY;
    }

    collides(tileX, top, bottom, world, tileSize) {
      const startY = Math.max(0, Math.floor(top / tileSize));
      const endY = Math.min(world.length - 1, Math.floor((bottom - 1) / tileSize));
      for (let y = startY; y <= endY; y++) {
        if (isSolidTileLocal(world[y]?.[tileX])) return true;
      }
      return false;
    }

    collidesY(tileY, left, right, world, tileSize) {
      const startX = Math.max(0, Math.floor(left / tileSize));
      const endX = Math.min(world[0].length - 1, Math.floor((right - 1) / tileSize));
      for (let x = startX; x <= endX; x++) {
        if (isSolidTileLocal(world[tileY]?.[x])) return true;
      }
      return false;
    }

    syncSprite() {
      this.sprite.position.set(this.x, this.y);
    }

    takeDamage(amount) {
      this.health -= amount;
      if (this.health <= 0) {
        this.dead = true;
      }
    }
  }

  class Zombie extends Mob {
    constructor(opts = {}) {
      super({ ...opts, color: 0x3c9f4a, speed: 120, maxHealth: 30 });
      this.path = null;
      this.pathIndex = 0;
      this.repathTimer = 0;
      this.attackCooldown = 0;
    }

    updateAI(dt, world, tileSize, player) {
      this.repathTimer -= dt;
      this.attackCooldown -= dt;
      const target = {
        x: Math.floor((player.x + player.size / 2) / tileSize),
        y: Math.floor((player.y + player.size / 2) / tileSize),
      };
      const myTile = {
        x: Math.floor((this.x + this.size / 2) / tileSize),
        y: Math.floor((this.y + this.size / 2) / tileSize),
      };

      if (!this.path || this.repathTimer <= 0 || this.pathIndex >= (this.path?.length || 0)) {
        this.path = findPath(myTile, target, (x, y) => isBlocked(world, x, y), 400);
        this.pathIndex = 0;
        this.repathTimer = 0.6;
      }

      if (this.path && this.path.length > 1) {
        const next = this.path[Math.min(this.pathIndex + 1, this.path.length - 1)];
        const worldX = next.x * tileSize;
        if (Math.abs(worldX - this.x) < 6) this.pathIndex++;
        if (worldX > this.x) this.vx = this.speed;
        else if (worldX < this.x) this.vx = -this.speed;
      } else {
        // fallback chase
        if (player.x > this.x) this.vx = this.speed * 0.7;
        else this.vx = -this.speed * 0.7;
      }

      // Gravity + move
      super.update(dt, world, tileSize);
    }

    tryAttack(player) {
      if (this.attackCooldown > 0) return false;
      if (aabbIntersect(this, player)) {
        this.attackCooldown = 1.0;
        return true;
      }
      return false;
    }
  }

  class Cow extends Mob {
    constructor(opts = {}) {
      super({ ...opts, color: 0x9c7a5c, speed: 70, maxHealth: 20 });
      this.wanderTimer = 0;
      this.dir = 0;
    }

    updateAI(dt, world, tileSize) {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        const dirs = [-1, 0, 1];
        this.dir = dirs[Math.floor(Math.random() * dirs.length)];
        this.wanderTimer = 2 + Math.random() * 3;
      }
      this.vx = this.dir * this.speed;
      super.update(dt, world, tileSize);
    }
  }

  function isBlocked(world, x, y) {
    if (x < 0 || y < 0 || y >= world.length || x >= world[0].length) return true;
    return isSolidTileLocal(world[y][x]);
  }

  function isSolidTileLocal(tile) {
    // Non-solid: AIR(0) and TORCH(10)
    return tile !== 0 && tile !== 10 && tile !== undefined;
  }

  function aabbIntersect(a, b) {
    const rectA = { left: a.x, right: a.x + a.size, top: a.y, bottom: a.y + a.size };
    const rectB = { left: b.x, right: b.x + b.size, top: b.y, bottom: b.y + b.size };
    return !(
      rectA.right <= rectB.left ||
      rectA.left >= rectB.right ||
      rectA.bottom <= rectB.top ||
      rectA.top >= rectB.bottom
    );
  }

  window.Zombie = Zombie;
  window.Cow = Cow;
})();
