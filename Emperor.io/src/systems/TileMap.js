import { TILE_TYPES } from "../utils/constants.js";

// Représente la carte sous forme de grille 2D.
export default class TileMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height).fill(TILE_TYPES.EMPTY);
    this.amounts = new Array(width * height).fill(0);
    this.biomes = new Array(width * height).fill("plains");
  }

  // Génère la carte avec biomes (optionnel) : probabilities par tuile, capacities pour ressources.
  generate(defaultProbs, capacityMap = {}, biomeDefs = []) {
    const biomeCell = 12; // taille en cases d'un patch
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const bx = Math.floor(x / biomeCell);
        const by = Math.floor(y / biomeCell);
        const seed = (bx * 92837111 + by * 689287499) ^ (bx * by);
        const biome = this.pickBiome(seed, biomeDefs);
        this.biomes[this.index(x, y)] = biome?.key || "plains";
        const probs = biome?.probabilities || defaultProbs;
        const type = this.pickByProbs(probs, seed);
        const idx = this.index(x, y);
        this.tiles[idx] = type;
        this.amounts[idx] = capacityMap[type] ?? 0;
      }
    }
  }

  pickBiome(seed, biomeDefs) {
    if (!biomeDefs || biomeDefs.length === 0) return null;
    const r = this.rand01(seed);
    const idx = Math.floor(r * biomeDefs.length) % biomeDefs.length;
    return biomeDefs[idx];
  }

  pickByProbs(list, seed) {
    if (!list || list.length === 0) return TILE_TYPES.EMPTY;
    const r = this.rand01(seed * 31);
    let acc = 0;
    for (const { type, chance } of list) {
      acc += chance;
      if (r < acc) return type;
    }
    return TILE_TYPES.EMPTY;
  }

  rand01(seed) {
    let s = seed;
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

  // Rendu de la grille sur le canvas (avec petites textures procedurales).
  render(ctx, tileSize, offsetX, offsetY, colors, view) {
    const vx1 = view ? Math.max(0, Math.floor(view.x)) : 0;
    const vy1 = view ? Math.max(0, Math.floor(view.y)) : 0;
    const vx2 = view ? Math.min(this.width, Math.ceil(view.x + view.w)) : this.width;
    const vy2 = view ? Math.min(this.height, Math.ceil(view.y + view.h)) : this.height;

    for (let y = vy1; y < vy2; y++) {
      for (let x = vx1; x < vx2; x++) {
        const type = this.tiles[this.index(x, y)];
        const baseColor = colors[type] || colors[TILE_TYPES.EMPTY];
        this.fillTexturedTile(
          ctx,
          offsetX + x * tileSize,
          offsetY + y * tileSize,
          tileSize,
          tileSize,
          baseColor,
          x,
          y,
          type,
          this.biomes[this.index(x, y)]
        );
      }
    }
  }

  fillTexturedTile(ctx, x, y, w, h, color, gx, gy, type, biomeKey) {
    const biomeTint = this.tintForBiome(biomeKey);
    ctx.fillStyle = this.mixColor(color, biomeTint, 0.25);
    ctx.fillRect(x, y, w, h);

    // Bruit léger (hash déterministe) pour variation chromatique
    ctx.fillStyle = this.adjustBrightness(color, this.hashShade(gx, gy));
    ctx.fillRect(x, y, w, h);

    if (type === TILE_TYPES.WOOD) {
      this.drawWood(ctx, x, y, w, h, color, gx, gy);
    } else if (type === TILE_TYPES.STONE) {
      this.drawStone(ctx, x, y, w, h, color, gx, gy);
    } else if (type === TILE_TYPES.FOOD) {
      this.drawFarm(ctx, x, y, w, h, color, gx, gy);
    } else {
      this.drawNoise(ctx, x, y, w, h, color, gx, gy);
    }
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
    const adjust = (c) => Math.max(0, Math.min(255, Math.floor(c + delta * 255)));
    const nr = adjust(r);
    const ng = adjust(g);
    const nb = adjust(b);
    return `rgb(${nr},${ng},${nb})`;
  }

  hashShade(x, y) {
    const h = (x * 374761393 + y * 668265263) ^ (x * y);
    return ((h % 24) - 12) / 255; // -0.047..0.047
  }

  rand(seed, min = 0, max = 1) {
    let s = seed;
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
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = this.adjustBrightness(color, 0.1);
    ctx.lineWidth = Math.max(1, w * 0.05);
    const rings = 2 + (gx + gy) % 3;
    for (let i = 0; i < rings; i++) {
      const ox = this.rand(gx * gy + i, -w * 0.1, w * 0.1);
      const oy = this.rand(gx + gy + i * 7, -h * 0.1, h * 0.1);
      const rw = w * (0.3 + i * 0.25);
      const rh = h * (0.3 + i * 0.2);
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + ox, y + h / 2 + oy, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = Math.max(1, w * 0.03);
    for (let i = 0; i < 3; i++) {
      const yline = y + (i + 1) * (h / 4);
      ctx.beginPath();
      ctx.moveTo(x, yline);
      ctx.bezierCurveTo(x + w * 0.3, yline + h * 0.05, x + w * 0.6, yline - h * 0.05, x + w, yline);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawStone(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.adjustBrightness(color, -0.1);
    const dots = 4 + ((gx + gy) % 4);
    for (let i = 0; i < dots; i++) {
      const px = x + this.rand(gx * 31 + i, 0, w);
      const py = y + this.rand(gy * 17 + i, 0, h);
      const r = this.rand(gx + gy + i, w * 0.08, w * 0.18);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFarm(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.adjustBrightness(color, 0.12);
    ctx.lineWidth = Math.max(1, w * 0.06);
    const offset = ((gx + gy) % 3) * (h * 0.08);
    for (let i = 0; i < 4; i++) {
      const yy = y + h * 0.2 + i * (h * 0.2) + offset;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.1, yy);
      ctx.lineTo(x + w * 1.1, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNoise(ctx, x, y, w, h, color, gx, gy) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = this.adjustBrightness(color, 0.1);
    for (let i = 0; i < 3; i++) {
      const px = x + this.rand(gx * 13 + i, 0, w);
      const py = y + this.rand(gy * 29 + i, 0, h);
      ctx.fillRect(px, py, Math.max(1, w * 0.05), Math.max(1, h * 0.05));
    }
    ctx.restore();
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
    return taken;
  }
}
