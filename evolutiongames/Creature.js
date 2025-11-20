import NeuralNetwork, { BRAIN_LAYOUT } from "./NeuralNetwork.js";
import { ZONE_TYPES } from "./Zone.js";
import { clampGenome, createRandomGenome } from "./Genome.js";

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
  }) {
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
      this.biomesVisited.size * 1;

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
  ) {
    if (!this.alive) {
      return;
    }

    this.updateBuffs(deltaSeconds);
    this.survivalTime += deltaSeconds;
    this.stateFlags.inDanger = false;
    this.animationTime += deltaSeconds;
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
    this.targetDirection = detection.hasEnemy ? detection.enemyDirection : null;
    if (!this.targetDirection && zoneInfo.hasZone) {
      this.targetDirection = zoneInfo.zoneDirection;
    }
    if (!this.targetDirection && pickupInfo?.hasPickup) {
      this.targetDirection = pickupInfo.direction;
    }

    const inputs = this.buildBrainInputs(bounds, detection, zoneInfo, terrainInfo);
    const [directionSignal, accelerationSignal, attackSignal, moveSignal, towardZoneSignal, avoidZoneSignal] =
      this.brain.feedforward(inputs);

    const hasEnemy = detection.hasEnemy;
    const shouldAttack = hasEnemy && attackSignal > ATTACK_ACTIVATION_THRESHOLD;
    const moveToward = hasEnemy ? moveSignal >= 0 : false;
    const zoneDesire = zoneInfo.hasZone;
    const moveTowardZone = zoneDesire && towardZoneSignal > 0.4;
    const avoidZone = zoneDesire && avoidZoneSignal > 0.4;

    let desiredDirection = mapSignalToAngle(directionSignal);
    if (hasEnemy) {
      const pursuitDirection = moveToward
        ? detection.enemyDirection
        : normalizeAngle(detection.enemyDirection + Math.PI);
      desiredDirection = shouldAttack ? detection.enemyDirection : pursuitDirection;
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

    this.handleHealthPickupCollision(healthPickups);
    this.updateMetabolism(deltaSeconds, postMoveTerrain, Math.hypot(deltaX, deltaY), environment);
    if (!this.alive) {
      return;
    }

    this.handleWallBounce(bounds);
    this.tryAttack(currentTime, effectEmitter, detection, shouldAttack);
  }

  updateMetabolism(deltaSeconds, terrainInfo, distanceMoved, environment = null) {
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
    }

    const lowEnergy = 1 - this.energy / this.energyMax;
    const lowHydration = 1 - this.hydration / this.hydrationMax;
    this.metabolicStress = clamp((lowEnergy + lowHydration) * 0.5, 0, 1);

    if (this.energy <= 0 || this.hydration <= 0) {
      this.takeDamage(8 * deltaSeconds);
    }
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
      const dx = other.position.x - this.position.x;
      const dy = other.position.y - this.position.y;
      const distSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distSq);
      if (distSq <= dangerRadiusSq) {
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
      detection.hasEnemy = true;
      detection.enemy = closest.ref;
      detection.distance = closest.distance;
      detection.distanceRatio = clamp(closest.distance / Math.max(visionRange, arenaDiag), 0, 1);
      detection.enemyDirection = closest.direction;
      detection.angleDelta = clamp(closest.diff / Math.PI, -1, 1);
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
      isGrass: type === "grass" || type === "forest",
    };
  }

  getTerrainSpeedModifier(type) {
    switch (type) {
      case "sand":
        return 0.85;
      case "snow":
        return 0.75;
      case "bridge":
        return 1.05;
      case "water":
      case "river":
        return 0.45;
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

  tryAttack(currentTime, effectEmitter, detection, shouldAttack) {
    if (
      !shouldAttack ||
      currentTime - this.lastAttackTime < this.attackCooldown / this.buffMultipliers.cooldown ||
      !detection ||
      !detection.enemy
    ) {
      return;
    }

    const target = detection.enemy;
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    const attackRange = this.attackRange * this.buffMultipliers.range;
    if (distance > attackRange + target.radius) {
      return;
    }

    this.lastAttackTime = currentTime;
    const attackDamage = this.damage * this.buffMultipliers.damage;
    const targetDied = target.takeDamage(attackDamage, this);
    this.attackSuccessCount += 1;
    if (targetDied) {
      this.killCount += 1;
      this.recoverResourcesFromKill();
    }

    if (effectEmitter) {
      effectEmitter({
        x: target.position.x,
        y: target.position.y,
        radius: this.attackRange * 0.8,
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
      return true;
    }
    return false;
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
