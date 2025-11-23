(() => {
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash, x, y) {
    switch (hash & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      default:
        return 0;
    }
  }

  function Perlin(seed = 1) {
    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647;
      const j = n % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    function perlin2(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;

      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);

      const topRight = p[p[X + 1] + Y + 1];
      const topLeft = p[p[X] + Y + 1];
      const bottomRight = p[p[X + 1] + Y];
      const bottomLeft = p[p[X] + Y];

      const u = fade(xf);
      const v = fade(yf);

      const x1 = lerp(grad(bottomLeft, xf, yf), grad(bottomRight, xf - 1, yf), u);
      const x2 = lerp(grad(topLeft, xf, yf - 1), grad(topRight, xf - 1, yf - 1), u);
      return (lerp(x1, x2, v) + 1) / 2; // 0..1
    }

    return { perlin2 };
  }

  function generateCaves(grid, width, height, tiles, solidPredicate, carvePredicate) {
    const perlin = Perlin(Math.floor(Math.random() * 999999));
    const bottomSafe = height - 4;
    for (let y = 40; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y >= bottomSafe) continue; // keep bottom layers solid
        const n = perlin.perlin2(x * 0.07, y * 0.07); // slightly larger features
        if (n > 0.6 && carvePredicate(grid[y][x])) {
          grid[y][x] = 0; // air pocket
        }
      }
    }
    // smoothing (cellular-ish)
    const copy = grid.map((row) => row.slice());
    const neighbors = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [0, 0],
    ];
    for (let y = 40; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y >= bottomSafe) continue;
        let solidCount = 0;
        neighbors.forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          if (solidPredicate(copy[ny][nx])) solidCount++;
        });
        if (solidPredicate(copy[y][x]) && solidCount <= 4) grid[y][x] = 0;
        else if (!solidPredicate(copy[y][x]) && solidCount >= 6) grid[y][x] = copy[y][x] || 0;
      }
    }
    // reinforce bottom layers (stone over bedrock zone)
    for (let y = height - 4; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === height - 1 && tiles?.BEDROCK !== undefined) continue;
        grid[y][x] = grid[y][x] === 0 ? tiles?.STONE ?? 1 : grid[y][x];
      }
    }
  }

  function generateWorld({ width, height, tiles }) {
    const perlin = Perlin(Math.floor(Math.random() * 999999));
    const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => tiles.AIR));
    const surfaceHeights = [];

    for (let x = 0; x < width; x++) {
      const n = perlin.perlin2(x * 0.06, 0);
      const h = Math.floor(14 + n * 8);
      surfaceHeights[x] = Math.max(10, Math.min(32, h));
    }

    for (let x = 0; x < width; x++) {
      const surfaceY = surfaceHeights[x];
      for (let y = 0; y < height; y++) {
        if (y < surfaceY) {
          grid[y][x] = tiles.AIR;
        } else if (y === surfaceY) {
          grid[y][x] = tiles.GRASS;
        } else if (y > surfaceY && y < surfaceY + 12) {
          grid[y][x] = tiles.DIRT;
        } else {
          grid[y][x] = tiles.STONE;
        }
      }
      // water fill up to sea level
      const seaLevel = 18;
      if (surfaceY < seaLevel && tiles.WATER !== undefined) {
        for (let y = surfaceY + 1; y <= seaLevel && y < height - 1; y++) {
          grid[y][x] = tiles.WATER;
        }
      }
    }

    generateCaves(
      grid,
      width,
      height,
      tiles,
      (t) => t !== tiles.AIR,
      (t) => t === tiles.STONE || t === tiles.DIRT
    );

    if (tiles.BEDROCK !== undefined) {
      for (let x = 0; x < width; x++) grid[height - 1][x] = tiles.BEDROCK;
    }

    return grid;
  }

  window.generateWorldWithCaves = generateWorld;
  window.generateCaves = generateCaves;
})();
