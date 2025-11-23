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

    if (!Player.textureCache) {
      const base = PIXI.BaseTexture.from("textures/entity/player/slim/steve.png");
      Player.textureCache = new PIXI.Texture(base, new PIXI.Rectangle(8, 8, 8, 8));
    }
    this.sprite = new PIXI.Sprite(Player.textureCache);
    this.sprite.width = size;
    this.sprite.height = size;
    this.sprite.position.set(this.x, this.y);
  }

  update(dt, world, tileSize, keys, waterTile = null) {
    const inWater = waterTile != null ? this.isInWater(world, tileSize, waterTile) : false;
    const gravity = inWater ? this.gravity * 0.35 : this.gravity;
    this.handleInput(keys, inWater);
    this.vy += gravity * dt;

    this.moveHorizontal(dt, world, tileSize, inWater);
    this.moveVertical(dt, world, tileSize, inWater);
    this.syncSprite();
  }

  handleInput(keys, inWater) {
    const left = keys.has("a");
    const right = keys.has("d");
    const speed = inWater ? this.moveSpeed * 0.6 : this.moveSpeed;
    if (left && !right) this.vx = -speed;
    else if (right && !left) this.vx = speed;
    else this.vx *= this.friction;

    if (keys.has(" ")) {
      if (inWater) {
        this.vy = -this.jumpSpeed * 0.35;
        this.onGround = false;
      } else if (this.onGround) {
        this.vy = -this.jumpSpeed;
        this.onGround = false;
      }
    }
  }

  moveHorizontal(dt, world, tileSize, inWater) {
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

  isInWater(world, tileSize, waterTile) {
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const tx = Math.floor(cx / tileSize);
    const ty = Math.floor(cy / tileSize);
    if (ty < 0 || ty >= world.length || tx < 0 || tx >= world[0].length) return false;
    return world[ty][tx] === waterTile;
  }
}
