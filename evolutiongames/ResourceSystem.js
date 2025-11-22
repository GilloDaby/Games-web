function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const BASE_RESOURCE_TYPES = {
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

const EXTRA_RESOURCE_NAMES = [
  "iron",
  "copper",
  "coal",
  "oil",
  "salt",
  "clay",
  "marble",
  "granite",
  "obsidian",
  "quartz",
  "uranium",
  "gold",
  "silver",
  "tin",
  "lead",
  "sulfur",
  "spice",
  "wheat",
  "corn",
  "rice",
  "fish",
  "meat",
  "leather",
  "fiber",
  "cotton",
  "flax",
  "wool",
  "silk",
  "herbs",
  "mushroom",
  "honey",
  "waterjar",
  "beer",
  "wine",
  "medicine",
  "electronics",
  "steel",
  "bricks",
  "cement",
  "glass",
  "paper",
  "ink",
  "tools",
  "gear",
  "battery",
  "plastic",
  "biofuel",
  "mana",
  "runestone",
  "spore",
];

const RESOURCE_TYPES = { ...BASE_RESOURCE_TYPES };

EXTRA_RESOURCE_NAMES.forEach((name, index) => {
  if (RESOURCE_TYPES[name]) return;
  const hue = Math.round((index * 37) % 360);
  const color = hslToHex(hue, 0.65, 0.55);
  RESOURCE_TYPES[name] = {
    label: name.charAt(0).toUpperCase() + name.slice(1),
    color,
    rate: 8 + (index % 5),
    hardness: 1 + (index % 4) * 0.35,
    capacity: 90 + (index % 6) * 12,
    radius: 14 + (index % 4),
    allowedTiles: ["grass", "forest", "sand", "snow"],
  };
});

const RESOURCE_TEXTURE_PATHS = Object.fromEntries(
  Object.keys(RESOURCE_TYPES).map((type) => [type, `img/resources/${type}.png`]),
);

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

const BASE_STRUCTURE_TEXTURE_PATHS = {
  camp: "img/structures/camp.png",
  spike: "img/structures/spike.png",
  beacon: "img/structures/beacon.png",
};

const EXTRA_STRUCTURE_NAMES = [
  "house",
  "apartment",
  "hospital",
  "school",
  "university",
  "farm",
  "mill",
  "bakery",
  "brewery",
  "factory",
  "forge",
  "mine",
  "lumberyard",
  "sawmill",
  "warehouse",
  "market",
  "harbor",
  "dock",
  "shipyard",
  "barracks",
  "tower",
  "gatehouse",
  "armory",
  "library",
  "laboratory",
  "observatory",
  "temple",
  "chapel",
  "shrine",
  "bank",
  "townhall",
  "courthouse",
  "jail",
  "police",
  "firestation",
  "clinic",
  "garden",
  "park",
  "theater",
  "arena",
  "stable",
  "pasture",
  "barn",
  "windmill",
  "solarplant",
  "powerplant",
  "waterpump",
  "aqueduct",
  "well",
  "fountain",
  "apothecary",
  "glassworks",
  "paperpress",
  "printing",
  "postoffice",
  "tavern",
  "inn",
  "hotel",
  "restaurant",
  "canteen",
  "bunker",
  "command",
  "radio",
  "garage",
  "hangar",
  "farmhouse",
  "orchard",
  "greenhouse",
  "butcher",
  "cheesery",
  "winery",
  "distillery",
  "armorer",
  "tailor",
  "clothier",
  "dyehouse",
  "carpenter",
  "mason",
  "brickworks",
  "cementplant",
  "glassfactory",
  "paperfactory",
  "electronics",
  "batteryplant",
  "plaster",
  "furnace",
  "generator",
  "harveststation",
  "refinery",
  "aquafarm",
  "fishery",
  "lodge",
  "observatory2",
  "embassy",
  "consulate",
  "park2",
  "residence",
  "housingblock",
];

while (EXTRA_STRUCTURE_NAMES.length < 100) {
  EXTRA_STRUCTURE_NAMES.push(`building-${EXTRA_STRUCTURE_NAMES.length + 1}`);
}

EXTRA_STRUCTURE_NAMES.forEach((name, index) => {
  if (STRUCTURE_TYPES[name]) return;
  const resourceKeys = Object.keys(RESOURCE_TYPES);
  const resA = resourceKeys[index % resourceKeys.length];
  const resB = resourceKeys[(index * 3) % resourceKeys.length];
  const resC = resourceKeys[(index * 5) % resourceKeys.length];
  const hp = 140 + (index % 7) * 20;
  const radius = 16 + (index % 5) * 2;
  const color = hslToHex((index * 23) % 360, 0.55, 0.55);
  STRUCTURE_TYPES[name] = {
    label: name.charAt(0).toUpperCase() + name.slice(1),
    hp,
    radius,
    cost: {
      [resA]: 4 + (index % 4),
      [resB]: 3 + ((index + 1) % 3),
      [resC]: 2 + ((index + 2) % 3),
    },
    aura: index % 4 === 0 ? { heal: 4 + (index % 6) } : index % 4 === 1 ? { energy: 5 } : index % 4 === 2 ? { hydration: 5 } : { speed: 1.02 },
    color,
  };
});

const STRUCTURE_TEXTURE_PATHS = Object.fromEntries(
  Object.keys(STRUCTURE_TYPES).map((type) => [type, `img/structures/${type}.png`]),
);

class ResourceNode {
  constructor(type, x, y, config, icon = null) {
    const hasCrypto = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
    this.id = hasCrypto ? crypto.randomUUID() : `res-${Math.random().toString(16).slice(2)}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.icon = icon;
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
    const alpha = Math.max(0.4, 0.4 + amountRatio * 0.6);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `${baseColor}${Math.floor(150 + amountRatio * 105).toString(16).padStart(2, "0")}`;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (this.icon && this.icon.complete && this.icon.naturalWidth > 0) {
      const size = this.radius * 1.6;
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.icon, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(RESOURCE_TYPES[this.type]?.label ?? this.type, this.x, this.y + 3);
    }
    ctx.restore();
  }
}

class Structure {
  constructor(type, x, y, config, ownerId = null, ownerColor = null, icon = null) {
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
    this.familyId = null;
    this.ownerColor = ownerColor;
    this.icon = icon;
    this.label = config.label || type;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  draw(ctx) {
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.save();
    const size = this.radius * 2.2;
    if (this.icon && this.icon.complete && this.icon.naturalWidth > 0) {
      ctx.globalAlpha = 0.8 + hpRatio * 0.2;
      ctx.drawImage(this.icon, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.4 + hpRatio * 0.6;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.ownerColor || "rgba(255,255,255,0.8)";
      ctx.stroke();
    }

    const barWidth = this.radius * 2;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 8;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.4 ? "#8bff8b" : "#ff8b8b";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(this.label ?? this.type, this.x, barY - 6);
    ctx.restore();
  }
}

export default class ResourceSystem {
  constructor(bounds, tileMap = null) {
    this.bounds = bounds;
    this.tileMap = tileMap;
    this.nodes = [];
    this.structures = [];
    this.resourceTextures = ResourceSystem.loadResourceTextures();
    this.structureTextures = ResourceSystem.loadStructureTextures();
    this.stats = {
      gathered: ResourceSystem.createGatheredMap(),
      built: 0,
      destroyed: 0,
    };

    this.spawnInitialNodes();
  }

  reset() {
    this.nodes = [];
    this.structures = [];
    this.resourceTextures = ResourceSystem.loadResourceTextures(true);
    this.structureTextures = ResourceSystem.loadStructureTextures(true);
    this.stats = {
      gathered: ResourceSystem.createGatheredMap(),
      built: 0,
      destroyed: 0,
    };
    this.spawnInitialNodes();
  }

  spawnInitialNodes() {
    const area = this.bounds.width * this.bounds.height;
    // For procedural "infinite" worlds cap density so on huge worlds we still spawn plenty.
    const effectiveArea = Math.min(area, 80_000_000); // higher cap for more resources
    const baseCount = Math.max(800, Math.floor(effectiveArea / 25000));
    const spread = Object.keys(RESOURCE_TYPES).map((type) => ({ type, weight: 1 }));

    for (let i = 0; i < baseCount; i += 1) {
      const type = this.pickType(spread);
      const config = RESOURCE_TYPES[type];
      const position = this.findValidPosition(config.radius, config.allowedTiles);
      if (!position) {
        continue;
      }
      this.nodes.push(
        new ResourceNode(type, position.x, position.y, config, this.resourceTextures[type]),
      );
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
    const attempts = 150;
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
    const consider = preferredTypes?.length
      ? this.nodes.filter((node) => preferredTypes.includes(node.type))
      : this.nodes;
    const sampleStride = Math.max(1, Math.floor(consider.length / 200)); // subsample large lists
    for (let i = 0; i < consider.length; i += sampleStride) {
      const node = consider[i];
      if (!node || node.amount <= 0) {
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

  getNodeById(id) {
    if (!id) {
      return null;
    }
    return this.nodes.find((node) => node.id === id) || null;
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
    const structure = new Structure(
      type,
      x,
      y,
      config,
      creature?.id ?? null,
      creature?.color ?? null,
      this.structureTextures[type],
    );
    structure.familyId = creature?.familyId;
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

  getNearestStructure(x, y, excludeOwnerId = null, familyId = null) {
    let closest = null;
    let minDist = Infinity;
    for (const structure of this.structures) {
      if (excludeOwnerId && structure.ownerId === excludeOwnerId) {
        continue;
      }
      if (familyId && structure.familyId !== familyId) {
        continue;
      }

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
          isOwned: excludeOwnerId && closest.ownerId === excludeOwnerId,
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

  spawnReplacementNodes(count = 1) {
    if (!count || count <= 0) {
      return;
    }
    const spread = Object.keys(RESOURCE_TYPES).map((type) => ({ type, weight: 1 }));
    for (let i = 0; i < count; i += 1) {
      const type = this.pickType(spread);
      const config = RESOURCE_TYPES[type];
      const position = this.findValidPosition(config.radius, config.allowedTiles);
      if (!position) {
        continue;
      }
      this.nodes.push(
        new ResourceNode(type, position.x, position.y, config, this.resourceTextures[type]),
      );
    }
  }

  getSummary() {
    const structures = this.structures.length;
    const gathered = { ...this.stats.gathered };
    return { gathered, structures };
  }

  static createGatheredMap() {
    return Object.fromEntries(Object.keys(RESOURCE_TYPES).map((type) => [type, 0]));
  }

  static loadResourceTextures(force = false) {
    if (ResourceSystem._textures && !force) {
      return ResourceSystem._textures;
    }
    const textures = {};
    const entries = Object.entries(RESOURCE_TEXTURE_PATHS);
    for (const [type, src] of entries) {
      const img = new Image();
      img.src = src;
      img.onerror = () => {
        textures[type] = null;
      };
      textures[type] = img;
    }
    ResourceSystem._textures = textures;
    return textures;
  }

  static loadStructureTextures(force = false) {
    if (ResourceSystem._structureTextures && !force) {
      return ResourceSystem._structureTextures;
    }
    const textures = {};
    const entries = Object.entries(STRUCTURE_TEXTURE_PATHS);
    for (const [type, src] of entries) {
      const img = new Image();
      img.src = src;
      img.onerror = () => {
        textures[type] = null;
      };
      textures[type] = img;
    }
    ResourceSystem._structureTextures = textures;
    return textures;
  }
}

export { RESOURCE_TYPES, STRUCTURE_TYPES };
