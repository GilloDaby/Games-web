const RESOURCE_TYPES = {
  wood: {
    label: "Bois",
    color: "#c28c5b",
    rate: 12,
    hardness: 1,
    capacity: 120,
    radius: 16,
    allowedTiles: ["forest"],
  },
  stone: {
    label: "Pierre",
    color: "#8c9cb3",
    rate: 9,
    hardness: 1.3,
    capacity: 90,
    radius: 18,
    allowedTiles: ["grass"],
  },
  crystal: {
    label: "Cristal",
    color: "#6fc3ff",
    rate: 6,
    hardness: 1.8,
    capacity: 70,
    radius: 17,
    allowedTiles: ["sand"],
  },
  snowball: {
    label: "Neige",
    color: "#e5ecf7",
    rate: 14,
    hardness: 0.8,
    capacity: 80,
    radius: 14,
    allowedTiles: ["snow"],
  },
  food: {
    label: "Baies",
    color: "#f0853c",
    rate: 11,
    hardness: 0.7,
    capacity: 110,
    radius: 14,
    allowedTiles: ["forest", "grass"],
  },
};

const STRUCTURE_TYPES = {
  camp: {
    label: "Camp",
    hp: 180,
    radius: 24,
    cost: { wood: 6, stone: 4 },
    aura: { heal: 8, energy: 11, hydration: 9 },
    color: "#f2c879",
  },
  spike: {
    label: "Pieux",
    hp: 110,
    radius: 18,
    cost: { wood: 8, stone: 4, crystal: 2 },
    aura: { damage: 12 },
    color: "#cf6679",
  },
  beacon: {
    label: "Balise",
    hp: 95,
    radius: 14,
    cost: { crystal: 6, wood: 4 },
    aura: { speed: 1.08, vision: 1.05 },
    color: "#7ac8ff",
  },
};

class ResourceNode {
  constructor(type, x, y, config) {
    const hasCrypto = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
    this.id = hasCrypto ? crypto.randomUUID() : `res-${Math.random().toString(16).slice(2)}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.amount = config.capacity;
    this.capacity = config.capacity;
    this.rate = config.rate;
    this.hardness = config.hardness;
    this.regenDelay = 3;
    this.cooldown = 0;
  }

  harvest(deltaSeconds, efficiency = 1) {
    if (this.cooldown > 0 || this.amount <= 0) {
      return 0;
    }
    const harvestRate = (this.rate / this.hardness) * efficiency;
    const gathered = Math.min(this.amount, harvestRate * deltaSeconds);
    this.amount -= gathered;
    if (this.amount <= 0.5) {
      this.amount = 0;
      this.cooldown = this.regenDelay;
    }
    return gathered;
  }

  update(deltaSeconds) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaSeconds;
      if (this.cooldown <= 0) {
        this.amount = this.capacity;
        this.cooldown = 0;
      }
    }
  }

  draw(ctx) {
    const baseColor = RESOURCE_TYPES[this.type]?.color ?? "#ffffff";
    const amountRatio = this.capacity > 0 ? this.amount / this.capacity : 0;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `${baseColor}${Math.floor(180 + amountRatio * 75).toString(16).padStart(2, "0")}`;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(RESOURCE_TYPES[this.type]?.label ?? this.type, this.x, this.y + 3);
    ctx.restore();
  }
}

class Structure {
  constructor(type, x, y, config, ownerId = null, ownerColor = null) {
    const hasCrypto = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
    this.id = hasCrypto
      ? crypto.randomUUID()
      : `struct-${Math.random().toString(16).slice(2)}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.aura = config.aura ?? {};
    this.color = config.color ?? "#ffffff";
    this.ownerId = ownerId;
    this.ownerColor = ownerColor;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  draw(ctx) {
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.4 + hpRatio * 0.6;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.ownerColor || "rgba(255,255,255,0.8)";
    ctx.stroke();

    const barWidth = this.radius * 2;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 8;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.4 ? "#8bff8b" : "#ff8b8b";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.restore();
  }
}

export default class ResourceSystem {
  constructor(bounds, tileMap = null) {
    this.bounds = bounds;
    this.tileMap = tileMap;
    this.nodes = [];
    this.structures = [];
    this.stats = {
      gathered: { wood: 0, stone: 0, crystal: 0, snowball: 0, food: 0 },
      built: 0,
      destroyed: 0,
    };

    this.spawnInitialNodes();
  }

  reset() {
    this.nodes = [];
    this.structures = [];
    this.stats = {
      gathered: { wood: 0, stone: 0, crystal: 0, snowball: 0, food: 0 },
      built: 0,
      destroyed: 0,
    };
    this.spawnInitialNodes();
  }

  spawnInitialNodes() {
    const area = this.bounds.width * this.bounds.height;
    const baseCount = Math.max(20, Math.floor(area / 90000));
    const spread = [
      { type: "wood", weight: 0.3 },
      { type: "stone", weight: 0.24 },
      { type: "crystal", weight: 0.14 },
      { type: "snowball", weight: 0.16 },
      { type: "food", weight: 0.16 },
    ];

    for (let i = 0; i < baseCount; i += 1) {
      const type = this.pickType(spread);
      const config = RESOURCE_TYPES[type];
      const position = this.findValidPosition(config.radius, config.allowedTiles);
      if (!position) {
        continue;
      }
      this.nodes.push(new ResourceNode(type, position.x, position.y, config));
    }
  }

  pickType(weights) {
    const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
    const roll = Math.random() * total;
    let acc = 0;
    for (const entry of weights) {
      acc += entry.weight;
      if (roll <= acc) {
        return entry.type;
      }
    }
    return weights[0]?.type ?? "wood";
  }

  findValidPosition(radius, allowedTiles = null) {
    const attempts = 80;
    for (let i = 0; i < attempts; i += 1) {
      const x = radius + Math.random() * (this.bounds.width - radius * 2);
      const y = radius + Math.random() * (this.bounds.height - radius * 2);
      const tile = this.tileMap?.getTileAt(x, y);
      const blocked = tile && (tile.type === "water" || tile.type === "river");
      if (blocked) {
        continue;
      }
      if (allowedTiles && tile && !allowedTiles.includes(tile.type)) {
        continue;
      }
      const overlapping = this.nodes.some((node) => Math.hypot(node.x - x, node.y - y) < node.radius + radius + 12);
      if (overlapping) {
        continue;
      }
      return { x, y };
    }
    return null;
  }

  update(deltaSeconds) {
    for (const node of this.nodes) {
      node.update(deltaSeconds);
    }
    this.structures = this.structures.filter((structure) => structure.hp > 0);
  }

  getNearestResource(x, y, preferredTypes = null) {
    let closest = null;
    let minDistance = Infinity;
    for (const node of this.nodes) {
      if (node.amount <= 0) {
        continue;
      }
      if (preferredTypes?.length && !preferredTypes.includes(node.type)) {
        continue;
      }
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        closest = node;
      }
    }
    if (!closest) {
      return { hasResource: false };
    }
    return {
      hasResource: true,
      node: closest,
      direction: Math.atan2(closest.y - y, closest.x - x),
      distance: minDistance,
    };
  }

  harvest(node, creature, deltaSeconds, efficiency = 1) {
    if (!node || node.amount <= 0) {
      return 0;
    }
    const amount = node.harvest(deltaSeconds, efficiency);
    if (amount > 0 && creature) {
      if (node.type === "food") {
        creature.consumeFood(amount);
        if (this.stats.gathered.food !== undefined) {
          this.stats.gathered.food += amount;
        }
        return amount;
      }
      const accepted = creature.collectResource(node.type, amount);
      if (accepted > 0) {
        this.stats.gathered[node.type] += accepted;
      }
      if (accepted < amount) {
        node.amount = Math.min(node.capacity, node.amount + (amount - accepted));
      }
    }
    return amount;
  }

  buildStructure(type, x, y, creature) {
    const config = STRUCTURE_TYPES[type];
    if (!config) {
      return null;
    }
    const tile = this.tileMap?.getTileAt(x, y);
    if (tile && (tile.type === "water" || tile.type === "river")) {
      return null;
    }
    const conflict = this.structures.some(
      (structure) => Math.hypot(structure.x - x, structure.y - y) < structure.radius + config.radius + 6,
    );
    if (conflict) {
      return null;
    }
    const structure = new Structure(type, x, y, config, creature?.id ?? null, creature?.color ?? null);
    this.structures.push(structure);
    this.stats.built += 1;
    return structure;
  }

  damageStructure(structure, amount, attacker = null) {
    if (!structure) {
      return false;
    }
    const destroyed = structure.takeDamage(amount);
    if (destroyed) {
      this.structures = this.structures.filter((s) => s.id !== structure.id);
      this.stats.destroyed += 1;
      if (attacker) {
        attacker.structuresDestroyed += 1;
      }
    }
    return destroyed;
  }

  getNearestStructure(x, y, ownerId = null) {
    let closest = null;
    let minDist = Infinity;
    for (const structure of this.structures) {
      const dist = Math.hypot(structure.x - x, structure.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = structure;
      }
    }
    return closest
      ? {
          structure: closest,
          distance: minDist,
          direction: Math.atan2(closest.y - y, closest.x - x),
          isOwned: ownerId && closest.ownerId === ownerId,
        }
      : { structure: null };
  }

  draw(ctx, viewport = null) {
    const isVisible = (entity) => {
      if (!viewport) return true;
      const { x, y, radius } = entity;
      return (
        x + radius >= viewport.minX &&
        x - radius <= viewport.maxX &&
        y + radius >= viewport.minY &&
        y - radius <= viewport.maxY
      );
    };
    for (const node of this.nodes) {
      if (!isVisible(node)) continue;
      node.draw(ctx);
    }
    for (const structure of this.structures) {
      if (!isVisible(structure)) continue;
      structure.draw(ctx);
    }
  }

  getSummary() {
    const structures = this.structures.length;
    const gathered = { ...this.stats.gathered };
    return { gathered, structures };
  }
}

export { RESOURCE_TYPES, STRUCTURE_TYPES };
