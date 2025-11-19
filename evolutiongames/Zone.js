const ZONE_TYPES = ["heal", "danger", "boost", "learning"];

const ZONE_CONFIG = {
  heal: {
    color: "rgba(98, 255, 173, 0.22)",
    border: "rgba(98, 255, 173, 0.65)",
    radiusRange: [140, 260],
    valueRange: [12, 28], // HP per second
    maxValue: 30,
    temporaryChance: 0.3,
    durationRange: [12, 20],
  },
  danger: {
    color: "rgba(255, 102, 87, 0.24)",
    border: "rgba(255, 120, 100, 0.7)",
    radiusRange: [160, 300],
    valueRange: [8, 18], // damage per second
    maxValue: 20,
    temporaryChance: 0.2,
    durationRange: [10, 18],
  },
  boost: {
    color: "rgba(97, 167, 255, 0.22)",
    border: "rgba(125, 190, 255, 0.75)",
    radiusRange: [110, 200],
    durationRange: [6, 10], // lifetime
    buffDurationRange: [5, 10], // buff per creature
    temporaryChance: 0.5,
    valueRange: [1.15, 1.45],
  },
  learning: {
    color: "rgba(255, 219, 110, 0.24)",
    border: "rgba(255, 235, 150, 0.8)",
    radiusRange: [140, 260],
    valueRange: [1.5, 2.5],
    maxValue: 3,
    temporaryChance: 0.15,
    durationRange: [15, 25],
  },
};

export { ZONE_TYPES };

export default class Zone {
  constructor({ type, x, y, radius, value, duration, color, border, payload, normalizedValue }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.value = value;
    this.color = color;
    this.border = border;
    this.duration = duration;
    this.payload = payload;
    this.elapsed = 0;
    this.active = true;
    this.normalizedValue = normalizedValue ?? payload?.normalizedValue ?? value;
    this.appliedCreatures = new WeakSet();
    this.pulse = Math.random() * Math.PI * 2;
  }

  static createRandom(type, bounds) {
    const config = ZONE_CONFIG[type];
    if (!config) {
      throw new Error(`Unknown zone type: ${type}`);
    }
    const radius = randomBetween(config.radiusRange[0], config.radiusRange[1]);
    const x = randomBetween(radius, bounds.width - radius);
    const y = randomBetween(radius, bounds.height - radius);

    const base = {
      type,
      x,
      y,
      radius,
      color: config.color,
      border: config.border,
      value: randomBetween(config.valueRange?.[0] ?? 1, config.valueRange?.[1] ?? 1),
      duration: null,
      payload: null,
      normalizedValue: null,
    };

    if (config.temporaryChance && Math.random() < config.temporaryChance) {
      base.duration = randomBetween(config.durationRange[0], config.durationRange[1]);
    }

    if (type === "boost") {
      const speed = randomBetween(1.15, 1.5);
      const damage = randomBetween(1.1, 1.35);
      const range = randomBetween(1.05, 1.25);
      const cooldown = randomBetween(1.05, 1.3);
      const duration = randomBetween(config.buffDurationRange[0], config.buffDurationRange[1]);
      base.payload = {
        speed,
        damage,
        range,
        cooldown,
        duration,
        normalizedValue: (speed + damage + range + cooldown) / 4 - 1,
      };
      base.duration = base.duration ?? randomBetween(config.durationRange[0], config.durationRange[1]);
      base.normalizedValue = base.payload.normalizedValue ?? 0.5;
    } else if (config.maxValue) {
      base.normalizedValue = Math.min(1, base.value / config.maxValue);
    }

    return new Zone(base);
  }

  update(deltaSeconds) {
    if (!this.active) {
      return;
    }
    this.elapsed += deltaSeconds;
    if (this.duration && this.elapsed >= this.duration) {
      this.active = false;
    }
    this.pulse += deltaSeconds;
  }

  containsPoint(x, y, buffer = 0) {
    if (!this.active) {
      return false;
    }
    const dx = x - this.x;
    const dy = y - this.y;
    const distSq = dx * dx + dy * dy;
    const maxRadius = this.radius + buffer;
    return distSq <= maxRadius * maxRadius;
  }

  markBoostApplied(creature) {
    if (!this.payload || !this.active) {
      return false;
    }
    if (this.appliedCreatures.has(creature)) {
      return false;
    }
    this.appliedCreatures.add(creature);
    return true;
  }

  draw(ctx) {
    if (!this.active) {
      return;
    }
    ctx.save();
    const pulseAlpha = 0.15 + Math.sin(this.pulse * 1.5) * 0.05;
    ctx.fillStyle = applyAlpha(this.color, pulseAlpha + 0.15);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = applyAlpha(this.border, 0.8);
    ctx.stroke();
    ctx.restore();
  }
}

export function pickZoneType() {
  const roll = Math.random();
  if (roll < 0.4) {
    return "heal";
  }
  if (roll < 0.7) {
    return "danger";
  }
  if (roll < 0.9) {
    return "boost";
  }
  return "learning";
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function applyAlpha(color, alpha) {
  if (!color.includes("rgba")) {
    return color;
  }
  return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
    const parts = inner.split(",").map((value) => value.trim());
    parts[3] = alpha.toFixed(2);
    return `rgba(${parts.join(", ")})`;
  });
}
