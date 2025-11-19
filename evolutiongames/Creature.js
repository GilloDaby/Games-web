import NeuralNetwork, { BRAIN_LAYOUT } from "./NeuralNetwork.js";

const ATTACK_ACTIVATION_THRESHOLD = 0.25;
const NEAR_ENEMY_DISTANCE_MULTIPLIER = 1.5;
const DANGER_RADIUS_MULTIPLIER = 2.5;
const DANGER_NORMALIZATION = 5;

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
  }

  get fitness() {
    return (
      this.distanceTravelled +
      this.survivalTime +
      this.proximityTime +
      this.attackSuccessCount * 5 +
      this.killCount * 20
    );
  }

  update(deltaSeconds, bounds, population, currentTime, effectEmitter) {
    if (!this.alive) {
      return;
    }

    this.survivalTime += deltaSeconds;

    const detection = this.detectEnemies(population, bounds);
    if (detection.hasEnemy && detection.distance <= this.nearEnemyDistance) {
      this.proximityTime += deltaSeconds;
    }

    this.targetDirection = detection.hasEnemy ? detection.enemyDirection : null;

    const inputs = this.buildBrainInputs(bounds, detection);
    const [directionSignal, accelerationSignal, attackSignal, moveSignal] =
      this.brain.feedforward(inputs);

    const hasEnemy = detection.hasEnemy;
    const shouldAttack = hasEnemy && attackSignal > ATTACK_ACTIVATION_THRESHOLD;
    const moveToward = hasEnemy ? moveSignal >= 0 : false;

    let desiredDirection = mapSignalToAngle(directionSignal);
    if (hasEnemy) {
      const pursuitDirection = moveToward
        ? detection.enemyDirection
        : normalizeAngle(detection.enemyDirection + Math.PI);
      desiredDirection = shouldAttack ? detection.enemyDirection : pursuitDirection;
    }

    desiredDirection += (Math.random() - 0.5) * 0.05;

    const lerpAmount = clamp(deltaSeconds * this.settings.directionResponsiveness, 0, 1);
    this.direction = lerpAngle(this.direction, desiredDirection, lerpAmount);

    const acceleration = accelerationSignal * this.settings.maxAcceleration;
    this.speed = clamp(
      this.speed + acceleration * deltaSeconds,
      this.settings.minSpeed,
      this.settings.maxSpeed,
    );

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    const deltaX = velocityX * deltaSeconds;
    const deltaY = velocityY * deltaSeconds;
    this.position.x += deltaX;
    this.position.y += deltaY;
    this.distanceTravelled += Math.hypot(deltaX, deltaY);

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

  buildBrainInputs({ width, height }, detection) {
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
    ];
  }

  tryAttack(currentTime, effectEmitter, detection, shouldAttack) {
    if (
      !shouldAttack ||
      currentTime - this.lastAttackTime < this.attackCooldown ||
      !detection ||
      !detection.enemy
    ) {
      return;
    }

    const target = detection.enemy;
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance > this.attackRange + target.radius) {
      return;
    }

    this.lastAttackTime = currentTime;
    const targetDied = target.takeDamage(this.damage);
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
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

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
