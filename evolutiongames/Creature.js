import NeuralNetwork, { BRAIN_LAYOUT } from "./NeuralNetwork.js";
import { ZONE_TYPES } from "./Zone.js";
import { clampGenome, createRandomGenome, GENE_DEFS } from "./Genome.js";
import { STRUCTURE_TYPES } from "./ResourceSystem.js";

const ATTACK_ACTIVATION_THRESHOLD = 0.25;
const NEAR_ENEMY_DISTANCE_MULTIPLIER = 1.5;
const DANGER_RADIUS_MULTIPLIER = 2.5;
const DANGER_NORMALIZATION = 5;
const ZONE_TYPE_INDEX = Object.fromEntries(ZONE_TYPES.map((type, index) => [type, index]));
const ZONE_ONE_HOT_LENGTH = ZONE_TYPES.length;
const BASE_VISION_RANGE = 260;
const BASE_HEARING_RANGE = 210;
const MIN_FOV = Math.PI * 0.55;
const MAX_FOV = Math.PI * 1.15;
const ENERGY_MAX_BASE = 120;
const HYDRATION_MAX_BASE = 120;
const METABOLIC_BASE_COST = 1.4;
const MOVE_COST_MULTIPLIER = 0.95;
const KILL_RECOVERY = { energy: 20, hydration: 10, hp: 6 };
const KILL_GROWTH = { size: 0.6, damage: 0.08, hp: 8 };
const ANIMAL_GROWTH_MULTIPLIER = 2;
const BOSS_GROWTH_MULTIPLIER = 3;
const RESOURCE_CAPACITY_BASE = 40;
const RESOURCE_NEED_THRESHOLD = 0.4;
const STRUCTURE_BUILD_COOLDOWN = 3.5;
const MATURITY_TIME = 8;
const REPRODUCTION_COOLDOWN = 9;
const MATE_RESOURCE_THRESHOLD = 0.42;
const MATE_SEARCH_DISTANCE = 520;
const REST_RESOURCE_THRESHOLD = 0.55;
const NEAR_WATER_TILE_RANGE = 1;
const FOOD_ENERGY_VALUE = 1.2;
const FOOD_HYDRATION_VALUE = 0.65;
const FOOD_HP_VALUE = 0.15;
const NEAR_WATER_HYDRATION = 3.5;
const SNOWBALL_RANGE = 240;
const SNOWBALL_DAMAGE = 6;
const SNOWBALL_COOLDOWN = 2.5;
const REACTIONS = {
  ally: "🙂",
  enemy: "😠",
  neutral: "🤔",
  panic: "😱",
  boost: "😎",
};
const POSITIVE_BASE_TRAITS = [
  "brave",
  "loyal",
  "clever",
  "resilient",
  "swift",
  "generous",
  "patient",
  "vigilant",
  "inventive",
  "compassionate",
  "focused",
  "optimistic",
  "strategic",
  "tough",
  "diligent",
  "curious",
  "resourceful",
  "stoic",
  "adaptable",
  "steady",
  "creative",
  "cooperative",
  "confident",
  "careful",
  "wise",
];
const NEGATIVE_BASE_TRAITS = [
  "greedy",
  "reckless",
  "lazy",
  "fearful",
  "impulsive",
  "stubborn",
  "arrogant",
  "jealous",
  "fragile",
  "careless",
  "impatient",
  "noisy",
  "clumsy",
  "selfish",
  "superstitious",
  "forgetful",
  "nervous",
  "glutton",
  "weak",
  "distracted",
  "hotheaded",
  "melancholic",
  "hostile",
  "chaotic",
  "naive",
];
const PERSONALITY_POOL = [
  { name: "leader", emoji: "👑" },
  { name: "solitaire", emoji: "🌘" },
  { name: "ambitieux", emoji: "🚀" },
  { name: "médiateur", emoji: "🕊️" },
  { name: "gardien", emoji: "🛡️" },
  { name: "éclaireur", emoji: "🔭" },
  { name: "artiste", emoji: "🎨" },
  { name: "barde", emoji: "🎵" },
  { name: "architecte", emoji: "🏗️" },
  { name: "forgeron", emoji: "⚒️" },
  { name: "tacticien", emoji: "♟️" },
  { name: "érudit", emoji: "📚" },
  { name: "alchimiste", emoji: "⚗️" },
  { name: "herboriste", emoji: "🌿" },
  { name: "marin", emoji: "🧭" },
  { name: "coureur", emoji: "🏃" },
  { name: "chasseur", emoji: "🏹" },
  { name: "charismatique", emoji: "🗣️" },
  { name: "rêveur", emoji: "💭" },
  { name: "calculateur", emoji: "🧠" },
  { name: "téméraire", emoji: "🔥" },
  { name: "pacifiste", emoji: "✋" },
  { name: "économiste", emoji: "💰" },
  { name: "fastidieux", emoji: "📏" },
  { name: "sociable", emoji: "💬" },
  { name: "secret", emoji: "🤐" },
  { name: "nocturne", emoji: "🌙" },
  { name: "matinal", emoji: "🌅" },
  { name: "nomade", emoji: "🚶" },
  { name: "sédentaire", emoji: "🏠" },
  { name: "bricoleur", emoji: "🔧" },
  { name: "gourmand", emoji: "🍖" },
  { name: "observateur", emoji: "👀" },
  { name: "pieux", emoji: "🙏" },
  { name: "rieur", emoji: "😂" },
  { name: "ombre", emoji: "🕶️" },
  { name: "tuteur", emoji: "🧭" },
  { name: "analyste", emoji: "📈" },
  { name: "aventurier", emoji: "🗺️" },
  { name: "héritier", emoji: "💎" },
  { name: "protecteur", emoji: "🪖" },
  { name: "frugal", emoji: "🥖" },
  { name: "collecteur", emoji: "🧺" },
  { name: "diplomate", emoji: "🤝" },
  { name: "héros", emoji: "🏅" },
  { name: "sage", emoji: "🧘" },
  { name: "érudit nocturne", emoji: "🕯️" },
  { name: "blagueur", emoji: "🤡" },
  { name: "coach", emoji: "📣" },
  { name: "éclaireur furtif", emoji: "🦊" },
  { name: "stratège patient", emoji: "⏳" },
];

export default class Creature {
  constructor({
    x,
    y,
    speed,
    direction,
    radius,
    color,
    brain,
    settings,
    skin = null,
    genome = null,
    familyId = null,
    sex = null,
  }) {
    Creature._id = (Creature._id ?? 0) + 1;
    this.id = Creature._id;
    this.allegiance = Math.floor(Math.random() * 3);
    this.familyId = familyId ?? this.allegiance;
    this.sex = sex ?? (Math.random() < 0.5 ? "female" : "male");
    this.relations = new Map();
    this.position = { x, y };
    this.speed = speed;
    this.direction = direction;
    this.radius = radius;
    this.color = color;
    this.brain = brain ?? new NeuralNetwork(BRAIN_LAYOUT.inputs, BRAIN_LAYOUT.hidden, BRAIN_LAYOUT.outputs);
    this.settings = settings;
    this.genome = clampGenome(genome ?? createRandomGenome());
    this.distanceTravelled = 0;
    this.survivalTime = 0;
    this.killCount = 0;
    this.attackSuccessCount = 0;
    this.proximityTime = 0;
    this.maxHp = settings.hp;
    this.hp = settings.hp;
    const aggressionFactor = clamp(this.genome.aggression ?? 1, 0.6, 1.35);
    this.damage = settings.damage * (0.9 + aggressionFactor * 0.25);
    this.attackRange = settings.attackRange;
    this.attackCooldown = settings.attackCooldown / (0.9 + aggressionFactor * 0.2);
    this.energyMax = ENERGY_MAX_BASE * this.genome.endurance;
    this.hydrationMax = HYDRATION_MAX_BASE * this.genome.hydration;
    this.energy = this.energyMax * 0.9;
    this.hydration = this.hydrationMax * 0.9;
    this.metabolicStress = 0;
    this.lastAttackTime = -Infinity;
    this.alive = true;
    this.nearEnemyDistance = this.attackRange * NEAR_ENEMY_DISTANCE_MULTIPLIER;
    this.targetDirection = null;
    this.zonePositiveTime = 0;
    this.zoneDangerTime = 0;
    this.zoneLearningTime = 0;
    this.zoneBonusesAcquired = 0;
    this.uniqueZoneTypes = new Set();
    this.learningMultiplierPeak = 1;
    this.activeBuffs = [];
    this.buffMultipliers = { speed: 1, damage: 1, range: 1, cooldown: 1 };
    this.stateFlags = { inDanger: false, boosted: false };
    this.biomesVisited = new Set();
    this.bridgeCrossings = 0;
    this.blockedByWaterTime = 0;
    this.difficultTerrainTime = 0;
    this.currentTerrainType = "grass";
    this.wasOnBridge = false;
    this.bridgeEntryFromLand = false;
    this.skin = skin;
    this.animationTime = Math.random() * 3;
    this.killedBy = null;
    this.fatigueAccum = 0;
    this.resources = { wood: 0, stone: 0, crystal: 0, snowball: 0, food: 0 };
    this.resourcesGathered = { wood: 0, stone: 0, crystal: 0, snowball: 0, food: 0 };
    this.structuresBuilt = 0;
    this.structuresDestroyed = 0;
    this.craftingScore = 0;
    this.resourceCapacity = RESOURCE_CAPACITY_BASE * this.genome.endurance;
    this.buildCooldown = 0;
    this.snowballCooldown = 0;
    this.reaction = { emoji: null, ttl: 0 };
    this.reproductionCooldown = 0;
    this.warFamilies = new Set();
    this.geneScore = evaluateGenomeQuality(this.genome);
    this.maxAge = randomBetween(90, 100);
    this.traits = generateTraitProfile();
  }

  get fitness() {
    const baseFitness =
      this.distanceTravelled +
      this.survivalTime +
      this.proximityTime +
      this.attackSuccessCount * 5 +
      this.killCount * 20 +
      this.zonePositiveTime * 0.5 +
      this.zoneBonusesAcquired * 15 +
      this.zoneLearningTime * 0.75 -
      this.zoneDangerTime * 1.5 +
      this.bridgeCrossings * 10 -
      this.blockedByWaterTime * 4 -
      this.difficultTerrainTime +
      this.biomesVisited.size * 1 +
      this.resourcesGathered.wood * 0.7 +
      this.resourcesGathered.stone * 1 +
      this.resourcesGathered.crystal * 1.2 +
      (this.resourcesGathered.food ?? 0) * 0.8 +
      this.resourcesGathered.snowball * 0.2 +
      this.structuresBuilt * 30 +
      this.structuresDestroyed * 26 +
      this.craftingScore * 3;

    const explorationBonus = 1 + Math.min(this.uniqueZoneTypes.size * 0.15, 0.6);
    const learningBonus = Math.max(1, this.learningMultiplierPeak);
    const resourceBonus =
      1 + Math.max(0, (this.energy / this.energyMax + this.hydration / this.hydrationMax) * 0.15);

    return baseFitness * explorationBonus * learningBonus * resourceBonus;
  }

  update(
    deltaSeconds,
    bounds,
    population,
    currentTime,
    effectEmitter,
    zones = [],
    tileMap = null,
    weather = null,
    healthPickups = [],
    resourceSystem = null,
    animals = [],
    bosses = [],
  ) {
    if (!this.alive) {
      return;
    }

    this.updateBuffs(deltaSeconds);
    this.survivalTime += deltaSeconds;
    this.stateFlags.inDanger = false;
    this.animationTime += deltaSeconds;
    this.buildCooldown = Math.max(0, this.buildCooldown - deltaSeconds);
    this.snowballCooldown = Math.max(0, this.snowballCooldown - deltaSeconds);
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaSeconds);
    const environment = this.getEnvironmentModifiers(weather);

    const terrainInfo = this.getTerrainInfo(tileMap);
    this.biomesVisited.add(terrainInfo.type);

    const effectiveRange = this.attackRange * this.buffMultipliers.range;
    this.nearEnemyDistance = effectiveRange * NEAR_ENEMY_DISTANCE_MULTIPLIER;

    const detection = this.detectEnemies(population, bounds, tileMap, environment);
    if (detection.hasEnemy && detection.distance <= this.nearEnemyDistance) {
      this.proximityTime += deltaSeconds;
    }

    const zoneInfo = this.detectZones(zones, bounds, deltaSeconds);
    const pickupInfo = this.detectHealthPickups(healthPickups);
    const resourceInfo = this.detectResources(resourceSystem);
    const preyInfo = this.detectAnimals(animals);
    const bossInfo = this.detectBosses(bosses);
    const structureInfo = resourceSystem
      ? resourceSystem.getNearestStructure(this.position.x, this.position.y, this.id)
      : { structure: null };
    const restStructureInfo = this.findRestStructure(resourceSystem);
    const mateInfo = this.findMateCandidate(population);
    const allyInfo = this.findClosestByRelation(population, "ally");
    const neutralInfo = this.findClosestByRelation(population, "neutral");
    const prefersBoss = bossInfo.hasBoss;
    const prefersPrey =
      !prefersBoss &&
      preyInfo.hasPrey &&
      (!detection.hasEnemy || preyInfo.distance * 0.85 < detection.distance);
    this.targetDirection = prefersPrey
      ? preyInfo.direction
      : prefersBoss
        ? bossInfo.direction
        : detection.hasEnemy
        ? detection.enemyDirection
        : null;
    if (!this.targetDirection && zoneInfo.hasZone) {
      this.targetDirection = zoneInfo.zoneDirection;
    }
    if (!this.targetDirection && pickupInfo?.hasPickup) {
      this.targetDirection = pickupInfo.direction;
    }
    const needsRest =
      this.energy / this.energyMax < REST_RESOURCE_THRESHOLD ||
      this.hydration / this.hydrationMax < REST_RESOURCE_THRESHOLD ||
      this.hp / this.maxHp < REST_RESOURCE_THRESHOLD;
    const hasRestStructure = Boolean(restStructureInfo?.structure);
    if (
      !this.targetDirection &&
      needsRest &&
      hasRestStructure &&
      restStructureInfo.distance < Math.max(520, this.nearEnemyDistance * 2)
    ) {
      const safeRest =
        !detection.hasEnemy || restStructureInfo.distance < this.nearEnemyDistance * 0.6;
      if (safeRest) {
        this.targetDirection = restStructureInfo.direction;
      }
    }
    const mateSafe = !detection.hasEnemy || detection.distance > this.nearEnemyDistance * 0.8;
    if (!this.targetDirection && mateInfo.hasMate && mateSafe) {
      this.targetDirection = mateInfo.direction;
    }
    if (!this.targetDirection && preyInfo.hasPrey) {
      this.targetDirection = preyInfo.direction;
    }
    if (!this.targetDirection && resourceInfo?.hasResource && this.shouldSeekResources()) {
      this.targetDirection = resourceInfo.direction;
    }

    const inputs = this.buildBrainInputs(bounds, detection, zoneInfo, terrainInfo);
    const [directionSignal, accelerationSignal, attackSignal, moveSignal, towardZoneSignal, avoidZoneSignal] =
      this.brain.feedforward(inputs);

    const hasEnemy = detection.hasEnemy;
    const hasPrey = preyInfo.hasPrey;
    const hasBoss = bossInfo.hasBoss;
    const wantsCombat = hasEnemy || hasPrey || hasBoss;
    const shouldAttack = wantsCombat && attackSignal > ATTACK_ACTIVATION_THRESHOLD;
    const autoAttackPrey = hasPrey && preyInfo.distance < this.attackRange * 1.4;
    const autoAttackBoss = hasBoss && bossInfo.distance < this.attackRange * 1.8;
    const attackIntent = shouldAttack || autoAttackPrey || autoAttackBoss;
    const moveToward = wantsCombat ? moveSignal >= 0 : false;
    const zoneDesire = zoneInfo.hasZone;
    const moveTowardZone = zoneDesire && towardZoneSignal > 0.4;
    const avoidZone = zoneDesire && avoidZoneSignal > 0.4;

    let desiredDirection = mapSignalToAngle(directionSignal);
    if (wantsCombat) {
      const targetDir = hasBoss
        ? bossInfo.direction
        : detection.hasEnemy
          ? detection.enemyDirection
          : preyInfo.direction;
      const pursuitDirection = moveToward
        ? targetDir
        : normalizeAngle(targetDir + Math.PI);
      desiredDirection = attackIntent ? targetDir : pursuitDirection;
    }

    if (zoneDesire) {
      if (avoidZone && zoneInfo.zoneType === "danger") {
        desiredDirection = normalizeAngle(zoneInfo.zoneDirection + Math.PI);
      } else if (moveTowardZone && zoneInfo.zoneType !== "danger") {
        desiredDirection = zoneInfo.zoneDirection;
      }
    }

    const wantsPickup = pickupInfo?.hasPickup && (this.hp / this.maxHp < 0.75 || !hasEnemy);
    if (wantsPickup) {
      desiredDirection = pickupInfo.direction;
    }

    const wantsResource = resourceInfo.hasResource && this.shouldSeekResources();
    if (!hasEnemy && wantsResource) {
      desiredDirection = resourceInfo.direction;
    }

    this.updateReactionState(deltaSeconds, detection, allyInfo, neutralInfo);

    desiredDirection += (Math.random() - 0.5) * 0.05;

    const lerpAmount = clamp(deltaSeconds * this.settings.directionResponsiveness, 0, 1);
    this.direction = lerpAngle(this.direction, desiredDirection, lerpAmount);

    const terrainModifier = this.getTerrainSpeedModifier(terrainInfo.type) * (environment.speed ?? 1);
    const resourceModifier = this.getResourceSpeedModifier();
    const traitSpeedModifier = 0.9 + (this.genome.endurance - 0.75) * 0.35;
    const acceleration =
      accelerationSignal * this.settings.maxAcceleration * resourceModifier * this.genome.endurance;
    const minSpeed = this.settings.minSpeed * terrainModifier * resourceModifier * 0.85;
    const maxSpeed =
      this.settings.maxSpeed *
      this.buffMultipliers.speed *
      terrainModifier *
      resourceModifier *
      traitSpeedModifier;
    this.speed = clamp(this.speed + acceleration * deltaSeconds, minSpeed, maxSpeed);

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    const deltaX = velocityX * deltaSeconds;
    const deltaY = velocityY * deltaSeconds;
    const nextX = this.position.x + deltaX;
    const nextY = this.position.y + deltaY;

    const blockingTile = tileMap?.getTileAt(nextX, nextY);
    if (blockingTile && (blockingTile.type === "river" || blockingTile.type === "water")) {
      this.blockedByWaterTime += deltaSeconds;
      this.recordTerrainUsage(terrainInfo, deltaSeconds);
      this.hydration = Math.min(this.hydrationMax, this.hydration + 4 * deltaSeconds);
      this.takeDamage(10 * deltaSeconds);
      this.direction = normalizeAngle(
        this.direction + Math.PI / 2 + (Math.random() - 0.5) * 0.8,
      );
      return;
    }

    this.position.x = nextX;
    this.position.y = nextY;
    this.distanceTravelled += Math.hypot(deltaX, deltaY);
    const postMoveTerrain = tileMap ? this.getTerrainInfo(tileMap) : terrainInfo;
    this.recordTerrainUsage(postMoveTerrain, deltaSeconds);

    this.handleResourceHarvest(resourceSystem, resourceInfo, deltaSeconds);
    this.applyStructureEffects(structureInfo, deltaSeconds);
    this.tryCraftStructure(resourceSystem);
    this.handleHealthPickupCollision(healthPickups);
    this.updateMetabolism(
      deltaSeconds,
      postMoveTerrain,
      Math.hypot(deltaX, deltaY),
      environment,
      tileMap,
    );
    this.handleAging(deltaSeconds);
    if (!this.alive) {
      return;
    }

    this.handleWallBounce(bounds);
    this.tryAttack(
      currentTime,
      effectEmitter,
      detection,
      preyInfo,
      bossInfo,
      attackIntent,
      resourceSystem?.structures ?? [],
      resourceSystem,
      animals,
      bosses,
    );
  }

  updateMetabolism(deltaSeconds, terrainInfo, distanceMoved, environment = null, tileMap = null) {
    const terrainPenalty = terrainInfo?.isSand ? 0.18 : terrainInfo?.isSnow ? 0.25 : 0;
    const speedFactor = clamp(this.speed / Math.max(1, this.settings.maxSpeed), 0, 2);
    const baseCost = METABOLIC_BASE_COST * this.genome.metabolism * (environment?.metabolism ?? 1);
    const moveCost = MOVE_COST_MULTIPLIER * speedFactor * (1 + terrainPenalty);
    const totalCost = (baseCost + moveCost) * deltaSeconds;

    this.energy = clamp(this.energy - totalCost, 0, this.energyMax);
    const hydrationDrain =
      (0.6 + speedFactor * 0.65) *
      this.genome.metabolism *
      (environment?.hydration ?? 1) *
      deltaSeconds;
    this.hydration = clamp(this.hydration - hydrationDrain, 0, this.hydrationMax);

    // micro-r�cup�ration si la cr�ature reste tr�s lente
    if (speedFactor < 0.25) {
      this.energy = clamp(this.energy + 1.2 * deltaSeconds, 0, this.energyMax);
      this.hydration = clamp(this.hydration + 0.8 * deltaSeconds, 0, this.hydrationMax);
    }

    // boire dans l'eau avec un risque de d�g�ts l�ger d�j� appliqu�
    if (terrainInfo?.isWater) {
      this.hydration = clamp(this.hydration + 6 * deltaSeconds, 0, this.hydrationMax);
    } else if (tileMap && this.isNearWater(tileMap)) {
      this.hydration = clamp(this.hydration + NEAR_WATER_HYDRATION * deltaSeconds, 0, this.hydrationMax);
    }

    const lowEnergy = 1 - this.energy / this.energyMax;
    const lowHydration = 1 - this.hydration / this.hydrationMax;
    this.metabolicStress = clamp((lowEnergy + lowHydration) * 0.5, 0, 1);

    if (this.energy <= 0 || this.hydration <= 0) {
      this.takeDamage(8 * deltaSeconds);
    }
  }

  shouldSeekResources() {
    const load = this.getInventoryLoad();
    const capacityRatio = load / Math.max(1, this.resourceCapacity);
    const lowEnergy = this.energy / this.energyMax < RESOURCE_NEED_THRESHOLD;
    const lowHydration = this.hydration / this.hydrationMax < RESOURCE_NEED_THRESHOLD;
    return capacityRatio < 0.9 && (lowEnergy || lowHydration || load < this.resourceCapacity * 0.7);
  }

  getInventoryLoad() {
    return (
      this.resources.wood +
      this.resources.stone +
      this.resources.crystal +
      (this.resources.snowball ?? 0)
    );
  }

  collectResource(type, amount) {
    if (!type || !Number.isFinite(amount) || amount <= 0) {
      return 0;
    }
    if (!(type in this.resources)) {
      return 0;
    }
    const available = Math.max(0, this.resourceCapacity - this.getInventoryLoad());
    if (available <= 0) {
      return 0;
    }
    const accepted = Math.min(amount, available);
    this.resources[type] += accepted;
    this.resourcesGathered[type] += accepted;
    return accepted;
  }

  consumeFood(amount = 0) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const energyGain = amount * FOOD_ENERGY_VALUE;
    const hydrationGain = amount * FOOD_HYDRATION_VALUE;
    const hpGain = amount * FOOD_HP_VALUE;
    this.energy = clamp(this.energy + energyGain, 0, this.energyMax);
    this.hydration = clamp(this.hydration + hydrationGain, 0, this.hydrationMax);
    this.hp = clamp(this.hp + hpGain, 0, this.maxHp);
  }

  spendResources(cost = {}) {
    for (const key of Object.keys(cost)) {
      if ((this.resources[key] ?? 0) < cost[key]) {
        return false;
      }
    }
    for (const key of Object.keys(cost)) {
      this.resources[key] -= cost[key];
    }
    return true;
  }

  getResourceSpeedModifier() {
    const energyRatio = clamp(this.energy / this.energyMax, 0, 1);
    const hydrationRatio = clamp(this.hydration / this.hydrationMax, 0, 1);
    const stress = clamp(1 - (energyRatio * 0.55 + hydrationRatio * 0.45), 0, 1);
    return clamp(1 - stress * 0.45, 0.55, 1.1);
  }

  handleWallBounce({ width, height }) {
    const { radius } = this;
    const minX = radius;
    const maxX = width - radius;
    const minY = radius;
    const maxY = height - radius;

    if (this.position.x <= minX) {
      this.position.x = minX;
      this.direction = Math.PI - this.direction;
    } else if (this.position.x >= maxX) {
      this.position.x = maxX;
      this.direction = Math.PI - this.direction;
    }

    if (this.position.y <= minY) {
      this.position.y = minY;
      this.direction = -this.direction;
    } else if (this.position.y >= maxY) {
      this.position.y = maxY;
      this.direction = -this.direction;
    }
  }

  handleAging(deltaSeconds) {
    if (!this.alive) {
      return;
    }
    if (this.survivalTime >= this.maxAge) {
      this.takeDamage(this.maxHp * deltaSeconds * 2);
    }
  }

  detectEnemies(population, bounds, tileMap, environment = null) {
    const detection = {
      hasEnemy: false,
      enemy: null,
      distance: Math.hypot(bounds.width, bounds.height),
      distanceRatio: 1,
      enemyDirection: this.direction,
      angleDelta: 0,
      dangerLevel: 0,
      perceptionStrength: 0,
    };

    const visionRange =
      BASE_VISION_RANGE *
      this.genome.visionRange *
      this.genome.awareness *
      (environment?.vision ?? 1);
    const hearingRange = BASE_HEARING_RANGE * this.genome.hearingRange * (environment?.hearing ?? 1);
    const fov = clamp(MIN_FOV + (MAX_FOV - MIN_FOV) * this.genome.visionAngle, MIN_FOV, MAX_FOV);

    let closest = null;
    let closestScore = Infinity;
    let threatCount = 0;
    const dangerRadius = visionRange * DANGER_RADIUS_MULTIPLIER;
    const dangerRadiusSq = dangerRadius * dangerRadius;

    for (const other of population) {
      if (other === this || !other.alive) {
        continue;
      }
      const relation = this.getRelationTo(other);
      if (relation === "ally") {
        continue;
      }
      const treatAsEnemy = relation === "enemy";
      const dx = other.position.x - this.position.x;
      const dy = other.position.y - this.position.y;
      const distSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distSq);
      if (treatAsEnemy && distSq <= dangerRadiusSq) {
        threatCount += 1;
      }

      const angle = Math.atan2(dy, dx);
      const signedDiff = signedAngleDifference(angle, this.direction);
      const inFov = Math.abs(signedDiff) <= fov / 2;
      const camoFactor = other.genome ? other.genome.camouflage : 1;
      const visibility = 1 / (1 + (camoFactor - 1) * 0.7);
      const visionReach = visionRange * visibility * (1 + this.genome.awareness * 0.15);
      const seenByVision = inFov && distance <= visionReach;
      const heard = distance <= hearingRange && Math.abs(signedDiff) <= Math.PI;

      if (!seenByVision && !heard) {
        continue;
      }

      const weight = seenByVision ? distance : distance * 1.25;
      if (weight < closestScore) {
        closestScore = weight;
        closest = { ref: other, distance, direction: angle, diff: signedDiff };
        detection.perceptionStrength = clamp(visibility * (seenByVision ? 1 : 0.6), 0, 1);
      }
    }

    if (closest) {
      const arenaDiag = Math.hypot(bounds.width, bounds.height);
      const relation = this.getRelationTo(closest.ref);
      const isEnemy = relation === "enemy";
      detection.hasEnemy = isEnemy;
      detection.enemy = isEnemy ? closest.ref : null;
      detection.distance = closest.distance;
      detection.distanceRatio = clamp(closest.distance / Math.max(visionRange, arenaDiag), 0, 1);
      detection.enemyDirection = closest.direction;
      detection.angleDelta = clamp(closest.diff / Math.PI, -1, 1);
      detection.relation = relation;
    }

    const socialComfort = clamp(1 - (this.genome.social ?? 0) * 0.4, 0.55, 1);
    detection.dangerLevel = clamp((threatCount / DANGER_NORMALIZATION) * socialComfort, 0, 1);
    return detection;
  }

  detectZones(zones, bounds, deltaSeconds) {
    const info = {
      hasZone: false,
      zoneDirection: this.direction,
      distanceRatio: 1,
      angleDelta: 0,
      isInside: 0,
      valueNormalized: 0,
      typeEncoding: Array.from({ length: ZONE_ONE_HOT_LENGTH }, () => 0),
      zoneType: null,
    };

    if (!zones?.length) {
      return info;
    }

    let closest = null;
    let closestDistance = Infinity;
    const arenaDiag = Math.hypot(bounds.width, bounds.height);

    for (const zone of zones) {
      if (!zone?.active) {
        continue;
      }
      const dx = zone.x - this.position.x;
      const dy = zone.y - this.position.y;
      const centerDistance = Math.hypot(dx, dy);
      const edgeDistance = Math.max(0, centerDistance - zone.radius);

      if (edgeDistance < closestDistance) {
        closestDistance = edgeDistance;
        closest = { zone, dx, dy, centerDistance };
      }

      if (zone.containsPoint(this.position.x, this.position.y, this.radius)) {
        info.isInside = 1;
        info.zoneType = info.zoneType ?? zone.type;
        this.processZoneImpact(zone, deltaSeconds);
      }
    }

    if (closest) {
      info.hasZone = true;
      info.zoneType = info.zoneType ?? closest.zone.type;
      info.zoneDirection = Math.atan2(closest.dy, closest.dx);
      info.distanceRatio = clamp(closest.centerDistance / arenaDiag, 0, 1);
      info.angleDelta = clamp(normalizeAngle(info.zoneDirection - this.direction) / Math.PI, -1, 1);
      info.valueNormalized = closest.zone.normalizedValue ?? 0;
      const typeIndex = ZONE_TYPE_INDEX[closest.zone.type];
      if (typeIndex >= 0) {
        info.typeEncoding[typeIndex] = 1;
      }
    }

    if (info.zoneType && info.typeEncoding.every((value) => value === 0)) {
      const fallbackIndex = ZONE_TYPE_INDEX[info.zoneType];
      if (fallbackIndex >= 0) {
        info.typeEncoding[fallbackIndex] = 1;
      }
    }

    return info;
  }

  detectHealthPickups(pickups) {
    const result = { hasPickup: false, direction: this.direction, distance: Infinity, target: null };
    if (!pickups?.length) {
      return result;
    }
    let closest = null;
    let closestDist = Infinity;
    for (const pickup of pickups) {
      if (pickup.collected) {
        continue;
      }
      const dx = pickup.x - this.position.x;
      const dy = pickup.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < closestDist) {
        closestDist = distance;
        closest = { pickup, direction: Math.atan2(dy, dx), distance };
      }
    }
    if (closest) {
      result.hasPickup = true;
      result.direction = closest.direction;
      result.distance = closest.distance;
      result.target = closest.pickup;
    }
    return result;
  }

  detectAnimals(animals) {
    const result = { hasPrey: false, prey: null, direction: this.direction, distance: Infinity };
    if (!animals?.length) {
      return result;
    }
    let closest = null;
    let closestDist = Infinity;
    for (const animal of animals) {
      if (!animal?.alive) {
        continue;
      }
      const dx = animal.position.x - this.position.x;
      const dy = animal.position.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < closestDist) {
        closestDist = distance;
        closest = { animal, direction: Math.atan2(dy, dx), distance };
      }
    }
    if (closest) {
      result.hasPrey = true;
      result.prey = closest.animal;
      result.direction = closest.direction;
      result.distance = closest.distance;
    }
    return result;
  }

  detectBosses(bosses) {
    const result = { hasBoss: false, boss: null, direction: this.direction, distance: Infinity };
    if (!bosses?.length) {
      return result;
    }
    let closest = null;
    let closestDist = Infinity;
    for (const boss of bosses) {
      if (!boss?.alive) {
        continue;
      }
      const dx = boss.position.x - this.position.x;
      const dy = boss.position.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < closestDist) {
        closestDist = distance;
        closest = { boss, direction: Math.atan2(dy, dx), distance };
      }
    }
    if (closest) {
      result.hasBoss = true;
      result.boss = closest.boss;
      result.direction = closest.direction;
      result.distance = closest.distance;
    }
    return result;
  }

  isReadyToMate() {
    const mature = this.survivalTime >= MATURITY_TIME;
    const rested = this.energy / this.energyMax > MATE_RESOURCE_THRESHOLD;
    const hydrated = this.hydration / this.hydrationMax > MATE_RESOURCE_THRESHOLD;
    return this.alive && mature && this.reproductionCooldown <= 0 && rested && hydrated;
  }

  findMateCandidate(population) {
    const result = { hasMate: false, mate: null, direction: this.direction, distance: Infinity };
    if (!this.isReadyToMate()) {
      return result;
    }
    let closest = null;
    let closestDist = Infinity;
    for (const other of population) {
      if (other === this || !other?.alive) {
        continue;
      }
      if (!this.canMateWith(other)) {
        continue;
      }
      const distance = Math.hypot(other.position.x - this.position.x, other.position.y - this.position.y);
      if (distance < closestDist && distance <= MATE_SEARCH_DISTANCE) {
        closest = { mate: other, direction: Math.atan2(other.position.y - this.position.y, other.position.x - this.position.x), distance };
        closestDist = distance;
      }
    }
    if (closest) {
      result.hasMate = true;
      result.mate = closest.mate;
      result.direction = closest.direction;
      result.distance = closest.distance;
    }
    return result;
  }

  detectResources(resourceSystem) {
    if (!resourceSystem) {
      return { hasResource: false };
    }
    const preferred = [];
    const lowEnergy = this.energy / this.energyMax < RESOURCE_NEED_THRESHOLD;
    const lowHydration = this.hydration / this.hydrationMax < RESOURCE_NEED_THRESHOLD;
    if (lowEnergy || lowHydration) {
      preferred.push("food");
    }
    if (lowEnergy) {
      preferred.push("wood");
    }
    if (this.hp / this.maxHp < RESOURCE_NEED_THRESHOLD) {
      preferred.push("stone");
    }
    const info = resourceSystem.getNearestResource(this.position.x, this.position.y, preferred);
    if (!info?.hasResource) {
      return { hasResource: false };
    }
    return {
      ...info,
      priority: this.shouldSeekResources(),
    };
  }

  getTerrainInfo(tileMap) {
    if (!tileMap) {
      return {
        type: this.currentTerrainType,
        isWater: this.currentTerrainType === "water" || this.currentTerrainType === "river",
        isBridge: this.currentTerrainType === "bridge",
        isSand: this.currentTerrainType === "sand",
        isSnow: this.currentTerrainType === "snow",
        isGrass: this.currentTerrainType === "grass",
      };
    }
    const tile = tileMap.getTileAt(this.position.x, this.position.y);
    const type = tile?.type ?? "grass";
    return {
      type,
      isWater: type === "water" || type === "river",
      isBridge: type === "bridge",
      isSand: type === "sand",
      isSnow: type === "snow",
      isGrass: type === "grass",
      isForest: type === "forest", 
    };
  }

  isNearWater(tileMap, tileRange = NEAR_WATER_TILE_RANGE) {
    if (!tileMap) {
      return false;
    }
    const size = tileMap.tileSize ?? 32;
    const baseTile = tileMap.getTileAt(this.position.x, this.position.y);
    const tx = baseTile?.x ?? Math.floor(this.position.x / size);
    const ty = baseTile?.y ?? Math.floor(this.position.y / size);
    for (let dx = -tileRange; dx <= tileRange; dx += 1) {
      for (let dy = -tileRange; dy <= tileRange; dy += 1) {
        const sampleX = (tx + dx + 0.5) * size;
        const sampleY = (ty + dy + 0.5) * size;
        const tile = tileMap.getTileAt(sampleX, sampleY);
        if (tile && (tile.type === "water" || tile.type === "river")) {
          return true;
        }
      }
    }
    return false;
  }

getTerrainSpeedModifier(type) {
  switch (type) {
    case "sand":
      return 0.85;
    case "snow":
      return 0.75;
    case "forest":          
      return 0.90;         
    case "bridge":
      return 1.05;
    case "water":
    case "river":
      return 0.45;
    case "grass":
      return 1;            
    default:
      return 1;
  }
}


  getEnvironmentModifiers(weather) {
    if (!weather?.modifiers) {
      return { vision: 1, hearing: 1, metabolism: 1, speed: 1, hydration: 1 };
    }
    const { vision = 1, hearing = 1, metabolism = 1, speed = 1, hydration = 1 } = weather.modifiers;
    return { vision, hearing, metabolism, speed, hydration };
  }

  recordTerrainUsage(info, deltaSeconds) {
    if (!info) {
      return;
    }
    if (info.isWater) {
      this.blockedByWaterTime += deltaSeconds;
      this.takeDamage(12 * deltaSeconds);
    }
    if (info.isSand || info.isSnow) {
      this.difficultTerrainTime += deltaSeconds;
    }

    if (info.isBridge) {
      if (!this.wasOnBridge) {
        this.bridgeEntryFromLand = this.currentTerrainType !== "river" && this.currentTerrainType !== "water";
      }
      this.wasOnBridge = true;
    } else if (this.wasOnBridge) {
      if (info.type !== "river" && info.type !== "water" && this.bridgeEntryFromLand) {
        this.bridgeCrossings += 1;
      }
      this.wasOnBridge = false;
      this.bridgeEntryFromLand = false;
    }

    this.currentTerrainType = info.type;
  }

  canMateWith(partner) {
    if (!partner || partner === this) {
      return false;
    }
    if (!this.alive || !partner.alive) {
      return false;
    }
    const oppositeSex = this.sex !== partner.sex;
    const sameFamily = this.familyId === partner.familyId;
    const mature = this.survivalTime >= MATURITY_TIME && partner.survivalTime >= MATURITY_TIME;
    const ready = this.reproductionCooldown <= 0 && partner.reproductionCooldown <= 0;
    const wellFed =
      this.energy / this.energyMax > MATE_RESOURCE_THRESHOLD &&
      partner.energy / partner.energyMax > MATE_RESOURCE_THRESHOLD &&
      this.hydration / this.hydrationMax > MATE_RESOURCE_THRESHOLD &&
      partner.hydration / partner.hydrationMax > MATE_RESOURCE_THRESHOLD;
    const compatible = this.isCompatibleMate(partner);
    return oppositeSex && sameFamily && mature && ready && wellFed && compatible;
  }

  onReproduce(partner) {
    this.reproductionCooldown = REPRODUCTION_COOLDOWN;
    partner.reproductionCooldown = REPRODUCTION_COOLDOWN;
    this.energy *= 0.8;
    partner.energy *= 0.8;
    this.hydration *= 0.9;
    partner.hydration *= 0.9;
  }

  handleResourceHarvest(resourceSystem, resourceInfo, deltaSeconds) {
    if (!resourceSystem || !resourceInfo?.hasResource) {
      return;
    }
    const isFoodNode = resourceInfo.node?.type === "food";
    if (!isFoodNode && this.getInventoryLoad() >= this.resourceCapacity - 1) {
      return;
    }
    const gatherDistance = this.radius + (resourceInfo.node?.radius ?? 0) + 6;
    if (resourceInfo.distance > gatherDistance) {
      return;
    }
    const efficiency = 0.75 + this.genome.endurance * 0.35;
    resourceSystem.harvest(resourceInfo.node, this, deltaSeconds, efficiency);
  }

  tryCraftStructure(resourceSystem) {
    if (!resourceSystem || this.buildCooldown > 0 || !this.alive) {
      return;
    }
    const load = this.getInventoryLoad();
    if (load < 4) {
      return;
    }

    const canBuildSpike =
      this.resources.wood >= 10 && this.resources.stone >= 6 && this.resources.crystal >= 2;
    const canBuildCamp = this.resources.wood >= 6 && this.resources.stone >= 4;
    const canBuildBeacon = this.resources.crystal >= 4 && this.resources.wood >= 2;

    let type = null;
    const wantsCampFirst = this.structuresBuilt % 2 === 0;
    if (canBuildCamp && wantsCampFirst) {
      type = "camp";
    } else if (canBuildSpike) {
      type = "spike";
    } else if (canBuildCamp) {
      type = "camp";
    } else if (canBuildBeacon) {
      type = "beacon";
    }

    if (!type) {
      return;
    }
    const cost = STRUCTURE_TYPES[type]?.cost ?? {};
    const hasAllMaterials = Object.keys(cost).every((key) => (this.resources[key] ?? 0) >= cost[key]);
    if (!hasAllMaterials) {
      return;
    }

    const spot = this.findBuildSpot(resourceSystem?.bounds);
    const structure = resourceSystem.buildStructure(type, spot.x, spot.y, this);
    if (structure) {
      this.spendResources(cost);
      this.structuresBuilt += 1;
      this.craftingScore +=
        (cost?.wood ?? 0) + (cost?.stone ?? 0) + (cost?.crystal ?? 0);
      this.buildCooldown = STRUCTURE_BUILD_COOLDOWN + Math.random() * 1.5;
    }
  }

  applyStructureEffects(structureInfo, deltaSeconds) {
    const structure = structureInfo?.structure;
    if (!structure) {
      return;
    }
    const distance = structureInfo.distance ?? Math.hypot(structure.x - this.position.x, structure.y - this.position.y);
    if (distance > structure.radius + this.radius + 4) {
      return;
    }
    const aura = structure.aura ?? {};
    if (aura.heal) {
      this.hp = clamp(this.hp + aura.heal * deltaSeconds, 0, this.maxHp);
    }
    if (aura.energy) {
      this.energy = clamp(this.energy + aura.energy * deltaSeconds, 0, this.energyMax);
    }
    if (aura.hydration) {
      this.hydration = clamp(this.hydration + aura.hydration * deltaSeconds, 0, this.hydrationMax);
    }
    if (aura.damage && (!structure.ownerId || structure.ownerId !== this.id)) {
      this.takeDamage(aura.damage * deltaSeconds);
    }
  }

  isRestStructure(structure) {
    if (!structure?.aura) {
      return false;
    }
    const { heal, energy, hydration } = structure.aura;
    return Boolean(heal || energy || hydration);
  }

  findRestStructure(resourceSystem = null) {
    if (!resourceSystem?.structures?.length) {
      return { structure: null };
    }
    let closest = null;
    let minDist = Infinity;
    for (const structure of resourceSystem.structures) {
      if (!this.isRestStructure(structure)) {
        continue;
      }
      const distance = Math.hypot(structure.x - this.position.x, structure.y - this.position.y);
      if (distance < minDist) {
        minDist = distance;
        closest = structure;
      }
    }
    return closest
      ? {
          structure: closest,
          distance: minDist,
          direction: Math.atan2(closest.y - this.position.y, closest.x - this.position.x),
        }
      : { structure: null };
  }

  findBuildSpot(bounds = null) {
    const distance = this.radius * 3.2;
    let x = this.position.x + Math.cos(this.direction) * distance;
    let y = this.position.y + Math.sin(this.direction) * distance;
    if (bounds) {
      x = clamp(x, this.radius, bounds.width - this.radius);
      y = clamp(y, this.radius, bounds.height - this.radius);
    }
    return { x, y };
  }

  handleHealthPickupCollision(pickups) {
    if (!pickups?.length || !this.alive) {
      return;
    }
    for (const pickup of pickups) {
      if (pickup.collected) {
        continue;
      }
      const distance = Math.hypot(pickup.x - this.position.x, pickup.y - this.position.y);
      if (distance <= pickup.radius + this.radius * 0.8) {
        pickup.collect(this);
      }
    }
  }

  processZoneImpact(zone, deltaSeconds) {
    if (!zone?.active) {
      return;
    }
    this.uniqueZoneTypes.add(zone.type);

    switch (zone.type) {
      case "heal": {
        this.hp = Math.min(this.maxHp, this.hp + zone.value * deltaSeconds);
        this.energy = clamp(this.energy + zone.value * 0.6 * deltaSeconds, 0, this.energyMax);
        this.hydration = clamp(this.hydration + zone.value * 0.4 * deltaSeconds, 0, this.hydrationMax);
        this.zonePositiveTime += deltaSeconds * 0.4;
        break;
      }
      case "danger": {
        this.stateFlags.inDanger = true;
        this.zoneDangerTime += deltaSeconds;
        this.takeDamage(zone.value * deltaSeconds);
        break;
      }
      case "boost": {
        if (zone.markBoostApplied(this)) {
          this.applyBoost(zone.payload);
          this.zoneBonusesAcquired += 1;
        }
        this.zonePositiveTime += deltaSeconds * 0.5;
        break;
      }
      case "learning": {
        const multiplier = zone.value ?? 1;
        this.zoneLearningTime += deltaSeconds * multiplier;
        this.learningMultiplierPeak = Math.max(this.learningMultiplierPeak, multiplier);
        this.zonePositiveTime += deltaSeconds * 0.4;
        break;
      }
      default: {
        this.zonePositiveTime += deltaSeconds * 0.2;
        break;
      }
    }
  }

  applyBoost(payload) {
    if (!payload) {
      return;
    }
    this.activeBuffs.push({
      speed: payload.speed ?? 1,
      damage: payload.damage ?? 1,
      range: payload.range ?? 1,
      cooldown: payload.cooldown ?? 1,
      remaining: payload.duration ?? 6,
    });
    this.updateBuffs(0);
  }

  updateBuffs(deltaSeconds) {
    if (!this.activeBuffs.length) {
      this.buffMultipliers = { speed: 1, damage: 1, range: 1, cooldown: 1 };
      this.stateFlags.boosted = false;
      return;
    }

    const multipliers = { speed: 1, damage: 1, range: 1, cooldown: 1 };
    this.activeBuffs = this.activeBuffs
      .map((buff) => ({ ...buff, remaining: buff.remaining - deltaSeconds }))
      .filter((buff) => buff.remaining > 0);

    for (const buff of this.activeBuffs) {
      multipliers.speed *= buff.speed ?? 1;
      multipliers.damage *= buff.damage ?? 1;
      multipliers.range *= buff.range ?? 1;
      multipliers.cooldown *= buff.cooldown ?? 1;
    }

    this.buffMultipliers = multipliers;
    this.stateFlags.boosted =
      multipliers.speed > 1.05 ||
      multipliers.damage > 1.05 ||
      multipliers.range > 1.05 ||
      multipliers.cooldown > 1.05;
  }

  buildBrainInputs({ width, height }, detection, zoneInfo, terrainInfo) {
    const normalizedDirection = normalizeAngle(this.direction) / Math.PI - 1;

    const leftDistance = clamp((this.position.x - this.radius) / width, 0, 1);
    const rightDistance = clamp((width - this.radius - this.position.x) / width, 0, 1);
    const topDistance = clamp((this.position.y - this.radius) / height, 0, 1);
    const bottomDistance = clamp((height - this.radius - this.position.y) / height, 0, 1);

    const xNormalized = clamp(this.position.x / width, 0, 1);
    const yNormalized = clamp(this.position.y / height, 0, 1);

    const hpNormalized = clamp(this.hp / this.maxHp, 0, 1);
    const hpRatio = hpNormalized; // ratio HP / HPmax (identique mais dédié aux évolutions futures)

    const distanceToEnemy = detection.distanceRatio;
    const angleToEnemy = detection.angleDelta;
    const danger = detection.dangerLevel;

    const zoneData =
      zoneInfo ??
      {
        distanceRatio: 1,
        angleDelta: 0,
        isInside: 0,
        valueNormalized: 0,
        typeEncoding: Array.from({ length: ZONE_ONE_HOT_LENGTH }, () => 0),
      };
    const zoneDistance = zoneData.distanceRatio;
    const zoneAngle = zoneData.angleDelta;
    const zoneInside = zoneData.isInside ? 1 : 0;
    const zoneValue = clamp(zoneData.valueNormalized ?? 0, -1, 1);
    const zoneTypes = zoneData.typeEncoding ?? Array.from({ length: ZONE_ONE_HOT_LENGTH }, () => 0);

    const terrain = terrainInfo ?? this.getTerrainInfo(null);
    const terrainFlags = [
      terrain.isWater ? 1 : 0,
      terrain.isBridge ? 1 : 0,
      terrain.isSand ? 1 : 0,
      terrain.isSnow ? 1 : 0,
      terrain.isGrass ? 1 : 0,
    ];

    const energyNormalized = clamp(this.energy / this.energyMax, 0, 1);
    const hydrationNormalized = clamp(this.hydration / this.hydrationMax, 0, 1);
    const metabolicStress = clamp(this.metabolicStress, 0, 1);
    const resourceDrag = 1 - this.getResourceSpeedModifier();
    const perception = clamp(detection?.perceptionStrength ?? 0, 0, 1);

    return [
      normalizedDirection,
      leftDistance,
      rightDistance,
      topDistance,
      bottomDistance,
      xNormalized,
      yNormalized,
      distanceToEnemy,
      angleToEnemy,
      hpNormalized,
      hpRatio,
      danger,
      zoneDistance,
      zoneAngle,
      zoneInside,
      zoneValue,
      ...zoneTypes,
      ...terrainFlags,
      energyNormalized,
      hydrationNormalized,
      resourceDrag,
      metabolicStress,
      perception,
    ];
  }

  tryAttack(
    currentTime,
    effectEmitter,
    detection,
    preyInfo,
    bossInfo,
    shouldAttack,
    structures = [],
    resourceSystem = null,
    animals = [],
    bosses = [],
  ) {
    const ready =
      currentTime - this.lastAttackTime >= this.attackCooldown / this.buffMultipliers.cooldown;
    const attackRange = this.attackRange * this.buffMultipliers.range;
    const canThrowSnowball = this.snowballCooldown <= 0 && (this.resources.snowball ?? 0) > 0;
    const preyTarget = preyInfo?.prey ?? null;
    const bossTarget = bossInfo?.boss ?? null;

    if (!ready && !canThrowSnowball) {
      return;
    }

    if (shouldAttack && detection?.enemy) {
      const target = detection.enemy;
      const dx = target.position.x - this.position.x;
      const dy = target.position.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (ready && distance <= attackRange + target.radius) {
        this.lastAttackTime = currentTime;
        const attackDamage = this.damage * this.buffMultipliers.damage;
        const targetDied = target.takeDamage(attackDamage, this);
        this.attackSuccessCount += 1;
        if (targetDied) {
          this.onKill({ type: "creature" });
        }
        if (effectEmitter) {
          effectEmitter({
            x: target.position.x,
            y: target.position.y,
            radius: this.attackRange * 0.8,
            duration: 0.25,
          });
        }
        return;
      }

      if (canThrowSnowball && distance <= SNOWBALL_RANGE) {
        this.throwSnowball(currentTime, target, effectEmitter);
        return;
      }
    }

    if (shouldAttack && preyTarget) {
      const dx = preyTarget.position.x - this.position.x;
      const dy = preyTarget.position.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (ready && distance <= attackRange + preyTarget.radius) {
        this.lastAttackTime = currentTime;
        const attackDamage = this.damage * this.buffMultipliers.damage;
        const targetDied = preyTarget.takeDamage(attackDamage, this);
        this.attackSuccessCount += 0.5;
        if (targetDied) {
          this.onKill({ type: "animal" });
        }
        if (effectEmitter) {
          effectEmitter({
            x: preyTarget.position.x,
            y: preyTarget.position.y,
            radius: this.attackRange * 0.7,
            duration: 0.25,
          });
        }
        return;
      }
    }

    if (shouldAttack && bossTarget) {
      const dx = bossTarget.position.x - this.position.x;
      const dy = bossTarget.position.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (ready && distance <= attackRange + bossTarget.radius) {
        this.lastAttackTime = currentTime;
        const attackDamage = this.damage * this.buffMultipliers.damage;
        const targetDied = bossTarget.takeDamage(attackDamage, this);
        this.attackSuccessCount += 1;
        if (targetDied) {
          this.onKill({ type: "boss" });
        }
        if (effectEmitter) {
          effectEmitter({
            x: bossTarget.position.x,
            y: bossTarget.position.y,
            radius: this.attackRange,
            duration: 0.35,
          });
        }
        return;
      }
    }

    if (!structures?.length || !resourceSystem) {
      return;
    }
    const structure = this.findStructureTarget(structures, attackRange);
    if (!structure) {
      return;
    }
    this.lastAttackTime = currentTime;
    const attackDamage = this.damage * this.buffMultipliers.damage;
    resourceSystem.damageStructure(structure, attackDamage, this);
    this.craftingScore += 4;
    if (effectEmitter) {
      effectEmitter({
        x: structure.x,
        y: structure.y,
        radius: attackRange * 0.65,
        duration: 0.25,
      });
    }
  }

  takeDamage(amount, attacker = null) {
    if (!this.alive) {
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.killedBy = attacker;
      this.markEnemy(attacker);
      return true;
    }
    this.markEnemy(attacker);
    return false;
  }

  onKill(victim = { type: "creature" }) {
    this.killCount += 1;
    const isAnimal = victim?.type === "animal";
    const isBoss = victim?.type === "boss";
    const multiplier = isBoss ? BOSS_GROWTH_MULTIPLIER : isAnimal ? ANIMAL_GROWTH_MULTIPLIER : 1;
    this.applyKillGrowth(multiplier);
    this.recoverResourcesFromKill();
  }

  applyKillGrowth(multiplier = 1) {
    const clamped = Math.max(1, multiplier);
    this.radius = clamp(this.radius + KILL_GROWTH.size * clamped, 8, 26);
    const damageIncrease = 1 + KILL_GROWTH.damage * clamped;
    this.damage *= damageIncrease;
    const hpBoost = KILL_GROWTH.hp * clamped;
    this.maxHp += hpBoost;
    this.hp = clamp(this.hp + hpBoost * 0.8, 0, this.maxHp);
    const capacityBoost = 2 * clamped;
    this.resourceCapacity += capacityBoost;
  }

  recoverResourcesFromKill() {
    this.energy = clamp(this.energy + KILL_RECOVERY.energy, 0, this.energyMax);
    this.hydration = clamp(this.hydration + KILL_RECOVERY.hydration, 0, this.hydrationMax);
    this.hp = clamp(this.hp + KILL_RECOVERY.hp, 0, this.maxHp);
  }

  draw(ctx) {
    if (!this.alive) {
      return;
    }

    if (this.targetDirection !== null) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 95, 95, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y);
      ctx.lineTo(
        this.position.x + Math.cos(this.targetDirection) * this.radius * 1.8,
        this.position.y + Math.sin(this.targetDirection) * this.radius * 1.8,
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const hasSkin = Boolean(this.skin);
    if (!hasSkin) {
      let fillColor = this.color;
      if (this.stateFlags.inDanger) {
        fillColor = "#ff7575";
      } else if (this.stateFlags.boosted) {
        fillColor = "#a7d6ff";
      }
      ctx.fillStyle = fillColor;
      if (this.stateFlags.boosted) {
        ctx.shadowColor = "rgba(140, 205, 255, 0.7)";
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      if (this.stateFlags.boosted) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(160, 215, 255, 0.9)";
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else {
      // Draw outline only to signal states when a skin is present.
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      if (this.stateFlags.inDanger) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff7575";
        ctx.stroke();
      } else if (this.stateFlags.boosted) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(160, 215, 255, 0.9)";
        ctx.stroke();
      }
    }

    if (this.skin) {
      const directionIndex = this.getSpriteDirectionIndex();
      this.skin.draw(ctx, this.position.x, this.position.y, directionIndex, this.animationTime, this.radius);
    }

    const barWidth = this.radius * 2.1;
    const barHeight = 4;
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 8;

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.5 ? "#79ff95" : "#ff7979";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    const energyRatio = clamp(this.energy / this.energyMax, 0, 1);
    const hydrationRatio = clamp(this.hydration / this.hydrationMax, 0, 1);
    const energyY = barY - barHeight - 3;
    const hydrationY = energyY - barHeight - 2;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(barX, energyY, barWidth, barHeight);
    ctx.fillRect(barX, hydrationY, barWidth, barHeight);
    ctx.fillStyle = "#f7c873";
    ctx.fillRect(barX, energyY, barWidth * energyRatio, barHeight);
    ctx.fillStyle = "#6fc3ff";
    ctx.fillRect(barX, hydrationY, barWidth * hydrationRatio, barHeight);
    if (this.reaction?.emoji && this.reaction.ttl > 0) {
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      const alpha = clamp(this.reaction.ttl / 1.5, 0, 1);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(this.reaction.emoji, this.position.x, this.position.y - this.radius - 20);
    }
    ctx.restore();
  }

  getSpriteDirectionIndex() {
    const dx = Math.cos(this.direction);
    const dy = Math.sin(this.direction);
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 2 : 1;
    }
    return dy > 0 ? 0 : 3;
  }

  findStructureTarget(structures, attackRange) {
    let closest = null;
    let minDist = Infinity;
    for (const structure of structures) {
      const distance = Math.hypot(structure.x - this.position.x, structure.y - this.position.y);
      if (distance <= attackRange + structure.radius && distance < minDist) {
        closest = structure;
        minDist = distance;
      }
    }
    return closest;
  }

  throwSnowball(currentTime, target, effectEmitter) {
    if (!target || (this.resources.snowball ?? 0) <= 0) {
      return;
    }
    this.resources.snowball = Math.max(0, this.resources.snowball - 1);
    this.snowballCooldown = SNOWBALL_COOLDOWN;
    const hit = target.takeDamage(SNOWBALL_DAMAGE, this);
    if (hit) {
      this.onKill({ type: "creature" });
    } else {
      this.attackSuccessCount += 0.5;
    }
    if (effectEmitter) {
      effectEmitter({
        x: target.position.x,
        y: target.position.y,
        radius: this.radius * 2,
        duration: 0.2,
      });
    }
  }

  getRelationTo(other) {
    if (!other || other === this) {
      return "neutral";
    }
    if (this.relations.has(other.id)) {
      return this.relations.get(other.id);
    }
    if (this.familyId === other.familyId) {
      return "ally";
    }
    if (this.warFamilies.has(other.familyId)) {
      this.relations.set(other.id, "enemy");
      return "enemy";
    }
    this.relations.set(other.id, "neutral");
    return "neutral";
  }

  markEnemy(other) {
    if (other?.id) {
      this.relations.set(other.id, "enemy");
    }
  }

  setWarFamilies(families) {
    this.warFamilies = new Set(families ?? []);
  }

  isCompatibleMate(partner) {
    const rarityChance = 0.08;
    const myTier = classifyGeneTier(this.geneScore);
    const partnerTier = classifyGeneTier(partner.geneScore);
    if (myTier === "mid" || partnerTier === "mid") {
      return true;
    }
    if (myTier === partnerTier) {
      return true;
    }
    return Math.random() < rarityChance;
  }

  findClosestByRelation(population, relationTarget) {
    let closest = null;
    let minDist = Infinity;
    for (const other of population) {
      if (other === this || !other.alive) {
        continue;
      }
      const relation = this.getRelationTo(other);
      if (relation !== relationTarget) {
        continue;
      }
      const dist = Math.hypot(other.position.x - this.position.x, other.position.y - this.position.y);
      if (dist < minDist) {
        minDist = dist;
        closest = other;
      }
    }
    return closest
      ? {
          creature: closest,
          distance: minDist,
          direction: Math.atan2(closest.position.y - this.position.y, closest.position.x - this.position.x),
        }
      : { creature: null };
  }

  updateReactionState(deltaSeconds, detection, allyInfo, neutralInfo) {
    let emoji = null;
    let ttl = 1.5;
    if (detection?.hasEnemy) {
      const close = detection.distance < this.nearEnemyDistance * 0.7;
      emoji = close && this.hp / this.maxHp < 0.35 ? REACTIONS.panic : REACTIONS.enemy;
    } else if (this.stateFlags.boosted) {
      emoji = REACTIONS.boost;
      ttl = 2;
    } else if (allyInfo?.creature) {
      emoji = REACTIONS.ally;
    } else if (neutralInfo?.creature) {
      emoji = REACTIONS.neutral;
    }

    if (emoji) {
      this.reaction = { emoji, ttl };
    } else if (this.reaction.ttl > 0) {
      this.reaction.ttl = Math.max(0, this.reaction.ttl - deltaSeconds);
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function signedAngleDifference(angle, reference) {
  const diff = normalizeAngle(angle - reference);
  return diff > Math.PI ? diff - Math.PI * 2 : diff;
}

function mapSignalToAngle(signal) {
  const normalized = clamp(signal, -1, 1);
  return (normalized + 1) * Math.PI;
}

function lerpAngle(current, target, t) {
  const twoPi = Math.PI * 2;
  const normalizedCurrent = normalizeAngle(current);
  const normalizedTarget = normalizeAngle(target);
  let diff = normalizedTarget - normalizedCurrent;
  if (diff > Math.PI) {
    diff -= twoPi;
  } else if (diff < -Math.PI) {
    diff += twoPi;
  }
  return normalizeAngle(normalizedCurrent + diff * t);
}

function evaluateGenomeQuality(genome) {
  const keys = ["endurance", "hydration", "awareness", "visionRange", "hearingRange"];
  let score = 0;
  for (const key of keys) {
    const def = GENE_DEFS[key];
    if (!def) {
      continue;
    }
    const value = clamp(genome[key] ?? def.min, def.min, def.max);
    const normalized = (value - def.min) / (def.max - def.min);
    score += normalized;
  }
  const metabolismDef = GENE_DEFS.metabolism;
  if (metabolismDef) {
    const metab = clamp(genome.metabolism ?? metabolismDef.min, metabolismDef.min, metabolismDef.max);
    const normalizedMetab = (metab - metabolismDef.min) / (metabolismDef.max - metabolismDef.min);
    score -= normalizedMetab * 0.5;
  }
  return score / keys.length;
}

function classifyGeneTier(score) {
  if (score >= 0.65) {
    return "high";
  }
  if (score <= 0.48) {
    return "low";
  }
  return "mid";
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function buildTraitPool(baseList, targetSize = 100) {
  const pool = [];
  const suffixes = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  let index = 0;
  while (pool.length < targetSize) {
    const root = baseList[index % baseList.length];
    const suffix = suffixes[Math.floor(index / baseList.length) % suffixes.length];
    pool.push(`${root} ${suffix}`);
    index += 1;
  }
  return pool;
}

const POSITIVE_TRAIT_POOL = buildTraitPool(POSITIVE_BASE_TRAITS, 100);
const NEGATIVE_TRAIT_POOL = buildTraitPool(NEGATIVE_BASE_TRAITS, 100);

function pickTraits(count, pool, emojiMap, defaultEmoji) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((name) => ({
    name,
    emoji: emojiMap[name.split(" ")[0]] ?? defaultEmoji,
  }));
}

const TRAIT_EMOJIS = {
  brave: "🦁",
  loyal: "🤝",
  clever: "🧠",
  resilient: "🪨",
  swift: "💨",
  generous: "🎁",
  patient: "🕰️",
  vigilant: "👁️",
  inventive: "🛠️",
  compassionate: "💖",
  focused: "🎯",
  optimistic: "🌟",
  strategic: "♟️",
  tough: "🛡️",
  diligent: "🏋️",
  curious: "🔍",
  resourceful: "🧰",
  stoic: "🪵",
  adaptable: "🌊",
  steady: "⚖️",
  creative: "🎨",
  cooperative: "🫱",
  confident: "✨",
  careful: "🧤",
  wise: "🦉",
};

const BAD_TRAIT_EMOJIS = {
  greedy: "🤑",
  reckless: "💥",
  lazy: "😴",
  fearful: "😨",
  impulsive: "⚡",
  stubborn: "🐂",
  arrogant: "😤",
  jealous: "🪫",
  fragile: "🥄",
  careless: "🪁",
  impatient: "⌚",
  noisy: "📣",
  clumsy: "🤕",
  selfish: "🚫",
  superstitious: "🔮",
  forgetful: "🧊",
  nervous: "😰",
  glutton: "🍗",
  weak: "🥀",
  distracted: "🤯",
  hotheaded: "🔥",
  melancholic: "🌧️",
  hostile: "⚔️",
  chaotic: "🌀",
  naive: "🍼",
};

function generateTraitProfile() {
  const positives = pickTraits(6, POSITIVE_TRAIT_POOL, TRAIT_EMOJIS, "⭐");
  const negatives = pickTraits(6, NEGATIVE_TRAIT_POOL, BAD_TRAIT_EMOJIS, "⚠️");
  const personalities = [...PERSONALITY_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
  return [...positives, ...negatives, ...personalities];
}
