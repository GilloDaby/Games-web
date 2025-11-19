import NeuralNetwork, { BRAIN_LAYOUT } from "./NeuralNetwork.js";
import { ZONE_TYPES } from "./Zone.js";

const ATTACK_ACTIVATION_THRESHOLD = 0.25;
const NEAR_ENEMY_DISTANCE_MULTIPLIER = 1.5;
const DANGER_RADIUS_MULTIPLIER = 2.5;
const DANGER_NORMALIZATION = 5;
const ZONE_TYPE_INDEX = Object.fromEntries(ZONE_TYPES.map((type, index) => [type, index]));
const ZONE_ONE_HOT_LENGTH = ZONE_TYPES.length;

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
  }) {
    this.position = { x, y };
    this.speed = speed;
    this.direction = direction;
    this.radius = radius;
    this.color = color;
    this.brain = brain ?? new NeuralNetwork(BRAIN_LAYOUT.inputs, BRAIN_LAYOUT.hidden, BRAIN_LAYOUT.outputs);
    this.settings = settings;
    this.distanceTravelled = 0;
    this.survivalTime = 0;
    this.killCount = 0;
    this.attackSuccessCount = 0;
    this.proximityTime = 0;
    this.maxHp = settings.hp;
    this.hp = settings.hp;
    this.damage = settings.damage;
    this.attackRange = settings.attackRange;
    this.attackCooldown = settings.attackCooldown;
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
  }

  get fitness() {
    const baseFitness =
      this.distanceTravelled +
      this.survivalTime +
      this.proximityTime +
      this.attackSuccessCount * 5 +
      this.killCount * 20 +
      this.zonePositiveTime * 1.5 +
      this.zoneBonusesAcquired * 15 +
      this.zoneLearningTime * 0.75 -
      this.zoneDangerTime * 1.5 +
      this.bridgeCrossings * 5 -
      this.blockedByWaterTime * 2 -
      this.difficultTerrainTime +
      this.biomesVisited.size * 1;

    const explorationBonus = 1 + Math.min(this.uniqueZoneTypes.size * 0.15, 0.6);
    const learningBonus = Math.max(1, this.learningMultiplierPeak);

    return baseFitness * explorationBonus * learningBonus;
  }

  update(deltaSeconds, bounds, population, currentTime, effectEmitter, zones = [], tileMap = null) {
    if (!this.alive) {
      return;
    }

    this.updateBuffs(deltaSeconds);
    this.survivalTime += deltaSeconds;
    this.stateFlags.inDanger = false;

    const terrainInfo = this.getTerrainInfo(tileMap);
    this.biomesVisited.add(terrainInfo.type);

    const effectiveRange = this.attackRange * this.buffMultipliers.range;
    this.nearEnemyDistance = effectiveRange * NEAR_ENEMY_DISTANCE_MULTIPLIER;

    const detection = this.detectEnemies(population, bounds);
    if (detection.hasEnemy && detection.distance <= this.nearEnemyDistance) {
      this.proximityTime += deltaSeconds;
    }

    const zoneInfo = this.detectZones(zones, bounds, deltaSeconds);
    this.targetDirection = detection.hasEnemy ? detection.enemyDirection : null;
    if (!this.targetDirection && zoneInfo.hasZone) {
      this.targetDirection = zoneInfo.zoneDirection;
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

    desiredDirection += (Math.random() - 0.5) * 0.05;

    const lerpAmount = clamp(deltaSeconds * this.settings.directionResponsiveness, 0, 1);
    this.direction = lerpAngle(this.direction, desiredDirection, lerpAmount);

    const terrainModifier = this.getTerrainSpeedModifier(terrainInfo.type);
    const acceleration = accelerationSignal * this.settings.maxAcceleration;
    const minSpeed = this.settings.minSpeed * terrainModifier;
    const maxSpeed = this.settings.maxSpeed * this.buffMultipliers.speed * terrainModifier;
    this.speed = clamp(this.speed + acceleration * deltaSeconds, minSpeed, maxSpeed);

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    const deltaX = velocityX * deltaSeconds;
    const deltaY = velocityY * deltaSeconds;
    const nextX = this.position.x + deltaX;
    const nextY = this.position.y + deltaY;

    const blockingTile = tileMap?.getTileAt(nextX, nextY);
    if (blockingTile && blockingTile.type === "river") {
      this.blockedByWaterTime += deltaSeconds;
      this.recordTerrainUsage(terrainInfo, deltaSeconds);
      return;
    }

    this.position.x = nextX;
    this.position.y = nextY;
    this.distanceTravelled += Math.hypot(deltaX, deltaY);
    const postMoveTerrain = tileMap ? this.getTerrainInfo(tileMap) : terrainInfo;
    this.recordTerrainUsage(postMoveTerrain, deltaSeconds);

    this.handleWallBounce(bounds);
    this.tryAttack(currentTime, effectEmitter, detection, shouldAttack);
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

  detectEnemies(population, bounds) {
    const detection = {
      hasEnemy: false,
      enemy: null,
      distance: Math.hypot(bounds.width, bounds.height),
      distanceRatio: 1,
      enemyDirection: this.direction,
      angleDelta: 0,
      dangerLevel: 0,
    };

    let closest = null;
    let closestDistSq = Infinity;
    let threatCount = 0;
    const dangerRadius = this.attackRange * DANGER_RADIUS_MULTIPLIER;
    const dangerRadiusSq = dangerRadius * dangerRadius;

    for (const other of population) {
      if (other === this || !other.alive) {
        continue;
      }
      const dx = other.position.x - this.position.x;
      const dy = other.position.y - this.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = { ref: other, dx, dy, distSq };
      }
      if (distSq <= dangerRadiusSq) {
        threatCount += 1;
      }
    }

    if (closest) {
      const distance = Math.sqrt(closest.distSq);
      const direction = Math.atan2(closest.dy, closest.dx);
      const normalizedAngleDiff = clamp(normalizeAngle(direction - this.direction) / Math.PI, -1, 1);
      const arenaDiag = Math.hypot(bounds.width, bounds.height);
      detection.hasEnemy = true;
      detection.enemy = closest.ref;
      detection.distance = distance;
      detection.distanceRatio = clamp(distance / arenaDiag, 0, 1);
      detection.enemyDirection = direction;
      detection.angleDelta = normalizedAngleDiff;
    }

    detection.dangerLevel = clamp(threatCount / DANGER_NORMALIZATION, 0, 1);
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
    };
  }

  getTerrainSpeedModifier(type) {
    switch (type) {
      case "sand":
        return 0.75;
      case "snow":
        return 0.65;
      case "bridge":
        return 1.05;
      case "water":
      case "river":
        return 0.3;
      default:
        return 1;
    }
  }

  recordTerrainUsage(info, deltaSeconds) {
    if (!info) {
      return;
    }
    if (info.isWater) {
      this.blockedByWaterTime += deltaSeconds;
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

  processZoneImpact(zone, deltaSeconds) {
    if (!zone?.active) {
      return;
    }
    this.uniqueZoneTypes.add(zone.type);

    switch (zone.type) {
      case "heal": {
        this.hp = Math.min(this.maxHp, this.hp + zone.value * deltaSeconds);
        this.zonePositiveTime += deltaSeconds;
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
    const targetDied = target.takeDamage(attackDamage);
    this.attackSuccessCount += 1;
    if (targetDied) {
      this.killCount += 1;
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

  takeDamage(amount) {
    if (!this.alive) {
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
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

    const barWidth = this.radius * 2.1;
    const barHeight = 4;
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 8;

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.5 ? "#79ff95" : "#ff7979";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.restore();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
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
