import { TILE_TYPES } from "../utils/constants.js";

// Logical map stored as a grid, rendered as an organic-looking landmass.
export default class TileMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height).fill(TILE_TYPES.EMPTY);
    this.amounts = new Array(width * height).fill(0);
    this.biomes = new Array(width * height).fill("plains");
    this.landMask = new Array(width * height).fill(1); // 0 = eau, 1 = terre
    this.seed = Math.random() * 1e9;
    this.cachedTileSize = null;
    this.cacheDirty = true;
    this.texture = null;
  }

  // Genere la carte avec un masque d'ile + biomes.
  generate(defaultProbs, capacityMap = {}, biomeDefs = [], seed = Math.random() * 1e9) {
    this.seed = seed;
    this.texture = null;
    this.cacheDirty = true;
    const biomeCell = 12;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.index(x, y);
        const landFactor = this.computeLandFactor(x, y);
        this.landMask[idx] = landFactor;

        // Zones eau : on force le type vide et on saute la generation.
        if (landFactor < 0.32) {
          this.tiles[idx] = TILE_TYPES.EMPTY;
          this.amounts[idx] = 0;
          this.biomes[idx] = "lake";
          continue;
        }

        const bx = Math.floor(x / biomeCell);
        const by = Math.floor(y / biomeCell);
        const seed = (bx * 92837111 + by * 689287499) ^ (bx * by);
        const biome = this.pickBiome(seed, biomeDefs);
        this.biomes[this.index(x, y)] = biome?.key || "plains";
        const probs = biome?.probabilities || defaultProbs;
        const type = this.pickByProbs(probs, seed);
        this.tiles[idx] = type;
        this.amounts[idx] = capacityMap[type] ?? 0;
      }
    }
    // Limite la taille des groupes de ressources pour eviter les gros paquets.
    this.limitClusters(3);
    this.cacheDirty = true;
  }

  pickBiome(seed, biomeDefs) {
    if (!biomeDefs || biomeDefs.length === 0) return null;
    const r = this.rand01(seed + this.seed * 0.37);
    const idx = Math.floor(r * biomeDefs.length) % biomeDefs.length;
    return biomeDefs[idx];
  }

  pickByProbs(list, seed) {
    if (!list || list.length === 0) return TILE_TYPES.EMPTY;
    const r = this.rand01(seed * 31 + this.seed * 0.57);
    let acc = 0;
    for (const { type, chance } of list) {
      acc += chance;
      if (r < acc) return type;
    }
    return TILE_TYPES.EMPTY;
  }

  rand01(seed) {
    let s = seed + this.seed;
    s ^= 123459876;
    s = (s * 1103515245 + 12345) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  }

  index(x, y) {
    return y * this.width + x;
  }

  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TILE_TYPES.EMPTY;
    return this.tiles[this.index(x, y)];
  }

  isLand(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return false;
    const idx = this.index(ix, iy);
    return (this.landMask[idx] ?? 1) >= 0.32;
  }

  // Rendu organique : on dessine dans un canvas cache puis on blitte la portion visible.
  render(ctx, tileSize, offsetX, offsetY, colors, view) {
    const v = view || { x: 0, y: 0, w: this.width, h: this.height };
    const texture = this.ensureTexture(tileSize, colors);
    const sx = v.x * tileSize;
    const sy = v.y * tileSize;
    const sw = v.w * tileSize;
    const sh = v.h * tileSize;
    const dw = Math.ceil(sw);
    const dh = Math.ceil(sh);
    // On decoupe la portion visible (sx,sy,sw,sh) et on la place en (0,0)
    // car le decalage camera est deja gere par le choix de la source.
    ctx.drawImage(texture, sx, sy, sw, sh, 0, 0, dw, dh);
  }

  consume(x, y, amount) {
    const idx = this.index(x, y);
    if (idx < 0 || idx >= this.tiles.length) return 0;
    if (this.amounts[idx] <= 0) return 0;
    const taken = Math.min(this.amounts[idx], amount);
    this.amounts[idx] -= taken;
    if (this.amounts[idx] <= 0) {
      this.tiles[idx] = TILE_TYPES.EMPTY;
    }
    this.cacheDirty = true;
    return taken;
  }

  // Vide toutes les ressources dans un rayon pour garantir une zone claire (spawn, bases, etc.).
  clearArea(cx, cy, radius) {
    const r2 = radius * radius;
    const xmin = Math.max(0, Math.floor(cx - radius));
    const xmax = Math.min(this.width - 1, Math.ceil(cx + radius));
    const ymin = Math.max(0, Math.floor(cy - radius));
    const ymax = Math.min(this.height - 1, Math.ceil(cy + radius));
    for (let y = ymin; y <= ymax; y++) {
      for (let x = xmin; x <= xmax; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          const idx = this.index(x, y);
          this.tiles[idx] = TILE_TYPES.EMPTY;
          this.amounts[idx] = 0;
        }
      }
    }
    this.cacheDirty = true;
  }

  ensureTexture(tileSize, colors) {
    if (!this.texture || this.cachedTileSize !== tileSize || this.cacheDirty) {
      this.buildTexture(tileSize, colors);
    }
    return this.texture;
  }

  buildTexture(tileSize, colors) {
    const width = Math.ceil(this.width * tileSize);
    const height = Math.ceil(this.height * tileSize);
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    this.paintWater(ctx, width, height, colors);
    this.paintLand(ctx, tileSize, colors);
    this.paintResourceDetails(ctx, tileSize, colors);
    this.paintEdgeFade(ctx, width, height);

    this.texture = canvas;
    this.cachedTileSize = tileSize;
    this.cacheDirty = false;
  }

  paintWater(ctx, width, height, colors) {
    const baseWater = colors[TILE_TYPES.EMPTY] || "#0f1b2b";
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.adjustBrightness(baseWater, 0.08));
    gradient.addColorStop(1, this.adjustBrightness(baseWater, -0.12));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // leger bruit pour casser les aplats
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 2200; i++) {
      const px = this.rand(i * 17, 0, width);
      const py = this.rand(i * 31, 0, height);
      const r = this.rand(i * 13, 1, 3.5);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  paintLand(ctx, tileSize, colors) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.index(x, y);
        const land = this.landMask[idx];
        if (land < 0.2) continue;

        const type = this.tiles[idx];
        const biome = this.biomes[idx];
        const baseColor = colors[type] || colors[TILE_TYPES.EMPTY];
        const tint = this.tintForBiome(biome);
        const color = this.mixColor(baseColor, tint, 0.18 + land * 0.12);

        const cx = x * tileSize + tileSize / 2 + this.jitter(x, y, tileSize * 0.22);
        const cy = y * tileSize + tileSize / 2 + this.jitter(y, x, tileSize * 0.22);
        const rx = tileSize * (0.65 + land * 0.25);
        const ry = tileSize * (0.62 + land * 0.28);
        const rot = this.rand(x * 13 + y * 17, 0, Math.PI);

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.restore();
      }
    }

    // Relief leger pour eviter l'effet damier
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 900; i++) {
      const px = this.rand(i * 73, 0, this.width * tileSize);
      const py = this.rand(i * 41, 0, this.height * tileSize);
      const r = this.rand(i * 29, tileSize * 0.4, tileSize * 1.2);
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.8, r, this.rand(i * 11, 0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  paintResourceDetails(ctx, tileSize, colors) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.index(x, y);
        if (this.landMask[idx] < 0.32) continue;
        const type = this.tiles[idx];
        if (type === TILE_TYPES.EMPTY) continue;

        // Dispersion : sous-ensemble deterministe + espacement grossier pour eviter les gros paquets.
        const skipHash = this.hashNoise(x * 3.1, y * 2.7);
        if (skipHash < 0.5) continue;
        const bucketX = Math.floor(x / 3);
        const bucketY = Math.floor(y / 3);
        if (this.hashNoise(bucketX * 7.7, bucketY * 5.3) < 0.45) continue;

        const cluster = this.localDensity(x, y, type);
        const strength = 0.55 + 0.25 * cluster;
        const cx = x * tileSize + tileSize / 2 + this.jitter(x + 3, y + 5, tileSize * 0.28);
        const cy = y * tileSize + tileSize / 2 + this.jitter(y + 7, x + 11, tileSize * 0.28);
        const sizeFactor = type === TILE_TYPES.FOOD ? 1.0 : type === TILE_TYPES.WOOD ? 0.68 : 0.6;
        const r = tileSize * sizeFactor * (0.34 + 0.16 * strength);
        const rot = this.rand(x * 19 + y * 23, 0, Math.PI);
        const baseColor = colors[type] || colors[TILE_TYPES.EMPTY];

        // Halo doux pour donner un aspect "patch" pro.
        const grad = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r * 1.05);
        grad.addColorStop(0, this.adjustBrightness(baseColor, 0.1));
        grad.addColorStop(1, this.adjustBrightness(baseColor, -0.06));
        ctx.save();
        ctx.globalAlpha = 0.38 + 0.16 * strength;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.05, r * 0.92, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Detail texture dans le patch
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.88, rot, 0, Math.PI * 2);
        ctx.clip();
        if (type === TILE_TYPES.WOOD) {
          this.drawWood(ctx, cx - r, cy - r, r * 2, r * 2, baseColor, x, y);
          this.scatterMini(ctx, cx, cy, r, baseColor, x, y, 2, 0.55);
        } else if (type === TILE_TYPES.STONE) {
          this.drawStone(ctx, cx - r, cy - r, r * 2, r * 2, baseColor, x, y);
          this.scatterMini(ctx, cx, cy, r, baseColor, x, y, 2, 0.5);
        } else if (type === TILE_TYPES.FOOD) {
          this.drawFarm(ctx, cx - r, cy - r, r * 2, r * 2, baseColor, x, y);
        }
        ctx.restore();

        // Quelques eclats autour pour casser la regularite.
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = this.adjustBrightness(baseColor, 0.14);
        const scatterCount = 1 + Math.floor(cluster * 2);
        for (let i = 0; i < scatterCount; i++) {
          const angle = this.rand(x * 41 + y * 53 + i * 7, 0, Math.PI * 2);
          const dist = this.rand(x * 17 + y * 23 + i * 11, r * 0.5, r * 0.9);
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          const pr = tileSize * this.rand(x * 29 + y * 31 + i * 13, 0.05, 0.1);
          ctx.beginPath();
          ctx.ellipse(px, py, pr * 1.1, pr, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  paintEdgeFade(ctx, width, height) {
    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.25,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  computeLandFactor(x, y) {
    // Falloff radial pour eviter une forme carree + bruit FBM pour les cotes
    const nx = (x / this.width) * 2 - 1;
    const ny = (y / this.height) * 2 - 1;
    const distance = Math.sqrt(nx * nx + ny * ny);
    const falloff = Math.pow(distance, 1.45);
    const noise = (this.fbmNoise(x * 0.9, y * 0.9) - 0.5) * 0.65;
    return 0.65 - falloff + noise;
  }

  fbmNoise(x, y) {
    let amp = 1;
    let freq = 0.08;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < 3; i++) {
      sum += this.smoothNoise((x + this.seed * 0.01) * freq, (y + this.seed * 0.01) * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / Math.max(norm, 0.0001);
  }

  smoothNoise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;
    const n00 = this.hashNoise(x0, y0);
    const n10 = this.hashNoise(x0 + 1, y0);
    const n01 = this.hashNoise(x0, y0 + 1);
    const n11 = this.hashNoise(x0 + 1, y0 + 1);
    const i1 = this.lerp(n00, n10, xf);
    const i2 = this.lerp(n01, n11, xf);
    return this.lerp(i1, i2, yf);
  }

  hashNoise(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7 + this.seed * 0.001) * 43758.5453123;
    return s - Math.floor(s);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  localDensity(x, y, type) {
    let count = 0;
    let total = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        total++;
        if (this.tiles[this.index(nx, ny)] === type) count++;
      }
    }
    return total === 0 ? 0 : count / total;
  }

  jitter(x, y, scale) {
    return this.rand(x * 97 + y * 131, -scale, scale);
  }

  scatterMini(ctx, cx, cy, r, baseColor, gx, gy, count, maxScale) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = this.adjustBrightness(baseColor, 0.06);
    for (let i = 0; i < count; i++) {
      const angle = this.rand(gx * 71 + gy * 43 + i * 17, 0, Math.PI * 2);
      const dist = this.rand(gx * 59 + gy * 61 + i * 23, r * 0.3, r * 0.9);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const pr = r * this.rand(gx * 79 + gy * 83 + i * 29, 0.25, maxScale);
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 0.9, pr * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  adjustBrightness(color, delta) {
    if (!color.startsWith("#") || (color.length !== 7 && color.length !== 4)) return color;
    let r, g, b;
    if (color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    }
    const clamp = (c) => Math.max(0, Math.min(255, Math.floor(c + delta * 255)));
    return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
  }

  rand(seed, min = 0, max = 1) {
    let s = seed + this.seed;
    s = (s ^ 123459876) * 1103515245 + 12345;
    s = (s >> 16) & 0x7fff;
    return min + (max - min) * (s / 0x7fff);
  }

  mixColor(baseHex, tintHex, alpha) {
    const parse = (c) =>
      c.length === 7
        ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
        : [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
    const [r1, g1, b1] = parse(baseHex);
    const [r2, g2, b2] = parse(tintHex);
    const r = Math.floor(r1 * (1 - alpha) + r2 * alpha);
    const g = Math.floor(g1 * (1 - alpha) + g2 * alpha);
    const b = Math.floor(b1 * (1 - alpha) + b2 * alpha);
    return `rgb(${r},${g},${b})`;
  }

  tintForBiome(biomeKey) {
    switch (biomeKey) {
      case "forest":
        return "#12301f";
      case "mountain":
        return "#2c313b";
      case "lake":
        return "#0b1e33";
      default:
        return "#1f2a16";
    }
  }

  drawWood(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = this.adjustBrightness(color, 0.12);
    ctx.lineWidth = Math.max(1, w * 0.05);
    const rings = 2 + ((gx + gy) % 2);
    for (let i = 0; i < rings; i++) {
      const ox = this.rand(gx * gy + i, -w * 0.12, w * 0.12);
      const oy = this.rand(gx + gy + i * 7, -h * 0.12, h * 0.12);
      const rw = w * (0.36 + i * 0.22);
      const rh = h * (0.34 + i * 0.18);
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + ox, y + h / 2 + oy, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1, w * 0.03);
    for (let i = 0; i < 3; i++) {
      const yline = y + (i + 1) * (h / 4);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.1, yline);
      ctx.bezierCurveTo(x + w * 0.3, yline + h * 0.05, x + w * 0.6, yline - h * 0.05, x + w * 1.1, yline);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawStone(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = this.adjustBrightness(color, -0.08);
    const dots = 4 + ((gx + gy) % 4);
    for (let i = 0; i < dots; i++) {
      const px = x + this.rand(gx * 31 + i, 0, w);
      const py = y + this.rand(gy * 17 + i, 0, h);
      const r = this.rand(gx + gy + i, w * 0.1, w * 0.22);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFarm(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = this.adjustBrightness(color, 0.14);
    ctx.lineWidth = Math.max(1, w * 0.06);
    const offset = ((gx + gy) % 3) * (h * 0.08);
    for (let i = 0; i < 4; i++) {
      const yy = y + h * 0.22 + i * (h * 0.2) + offset;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.2, yy);
      ctx.lineTo(x + w * 1.2, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  limitClusters(maxSize) {
    const visited = new Array(this.tiles.length).fill(false);
    const resources = [TILE_TYPES.WOOD, TILE_TYPES.STONE, TILE_TYPES.FOOD];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.index(x, y);
        if (visited[idx]) continue;
        const type = this.tiles[idx];
        if (!resources.includes(type)) {
          visited[idx] = true;
          continue;
        }

        // Collecte du cluster contigu (4 directions)
        const cluster = [];
        const queue = [[x, y]];
        visited[idx] = true;
        while (queue.length) {
          const [cx, cy] = queue.pop();
          const cidx = this.index(cx, cy);
          cluster.push(cidx);
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
            const nidx = this.index(nx, ny);
            if (visited[nidx]) continue;
            if (this.tiles[nidx] !== type) continue;
            visited[nidx] = true;
            queue.push([nx, ny]);
          }
        }

        if (cluster.length > maxSize) {
          // Classement deterministe des cases du cluster, on garde les maxSize premiers.
          const sorted = cluster.slice().sort((a, b) => {
            const ax = a % this.width;
            const ay = Math.floor(a / this.width);
            const bx = b % this.width;
            const by = Math.floor(b / this.width);
            return this.hashNoise(ax, ay) - this.hashNoise(bx, by);
          });
          const keep = new Set(sorted.slice(0, maxSize));
          for (const c of cluster) {
            if (keep.has(c)) continue;
            this.tiles[c] = TILE_TYPES.EMPTY;
            this.amounts[c] = 0;
          }
        }
      }
    }
  }
}
