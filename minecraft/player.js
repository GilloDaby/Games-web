class Player {
  constructor({ size, x = 0, y = 0, color = 0x3a8ee6 }) {
    this.size = size;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 2000;
    this.friction = 0.85;
    this.moveSpeed = 450;
    this.jumpSpeed = 900;
    this.onGround = false;

    this.sprite = new PIXI.Graphics()
      .beginFill(color)
      .drawRect(0, 0, size, size)
      .endFill();
    this.sprite.position.set(this.x, this.y);
  }

  update(dt, world, tileSize, keys) {
    this.handleInput(keys);
    this.vy += this.gravity * dt;

    this.moveHorizontal(dt, world, tileSize);
    this.moveVertical(dt, world, tileSize);
    this.syncSprite();
  }

  handleInput(keys) {
    const left = keys.has("a");
    const right = keys.has("d");
    if (left && !right) this.vx = -this.moveSpeed;
    else if (right && !left) this.vx = this.moveSpeed;
    else this.vx *= this.friction;

    if (keys.has(" ") && this.onGround) {
      this.vy = -this.jumpSpeed;
      this.onGround = false;
    }
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
      if (this.isSolid(world, tileX, y)) return true;
    }
    return false;
  }

  collidesY(tileY, left, right, world, tileSize) {
    const startX = Math.max(0, Math.floor(left / tileSize));
    const endX = Math.min(world[0].length - 1, Math.floor((right - 1) / tileSize));
    for (let x = startX; x <= endX; x++) {
      if (this.isSolid(world, x, tileY)) return true;
    }
    return false;
  }

  isSolid(world, x, y) {
    if (y < 0 || y >= world.length || x < 0 || x >= world[0].length) return false;
    return world[y][x] !== 0;
  }

  syncSprite() {
    this.sprite.position.set(this.x, this.y);
  }
}
