const SPRITE_CONFIG = {
  width: 32,
  height: 32,
  columns: 3,
  rows: 4,
};

export const SPRITE_DIRECTIONS = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
};

export default class PlayerSkin {
  constructor(name, image) {
    this.name = name;
    this.image = image;
    this.frames = this.sliceFrames(image);
  }

  sliceFrames(image) {
    const frames = Array.from({ length: SPRITE_CONFIG.rows }, () =>
      Array(SPRITE_CONFIG.columns).fill(null),
    );

    for (let row = 0; row < SPRITE_CONFIG.rows; row += 1) {
      for (let col = 0; col < SPRITE_CONFIG.columns; col += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = SPRITE_CONFIG.width;
        canvas.height = SPRITE_CONFIG.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          col * SPRITE_CONFIG.width,
          row * SPRITE_CONFIG.height,
          SPRITE_CONFIG.width,
          SPRITE_CONFIG.height,
          0,
          0,
          SPRITE_CONFIG.width,
          SPRITE_CONFIG.height,
        );
        frames[row][col] = canvas;
      }
    }
    return frames;
  }

  getFrame(directionIndex, animTimeSeconds) {
    const row = Math.max(0, Math.min(SPRITE_CONFIG.rows - 1, directionIndex || 0));
    const frameIndex = Math.floor((animTimeSeconds * 1000) / 100) % SPRITE_CONFIG.columns;
    return this.frames[row][frameIndex];
  }

  draw(ctx, x, y, directionIndex, animTimeSeconds, radius) {
    const frame = this.getFrame(directionIndex, animTimeSeconds);
    if (!frame) {
      return;
    }
    const size = radius * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(frame, x - radius, y - radius, size, size);
    ctx.restore();
  }
}
