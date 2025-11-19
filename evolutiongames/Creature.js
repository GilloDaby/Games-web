import NeuralNetwork from "./NeuralNetwork.js";

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
    this.brain = brain ?? new NeuralNetwork(7, 4, 2);
    this.settings = settings;
    this.distanceTravelled = 0;
  }

  get fitness() {
    return this.distanceTravelled;
  }

  update(deltaSeconds, bounds) {
    const inputs = this.buildBrainInputs(bounds);
    const [directionSignal, accelerationSignal] = this.brain.feedforward(inputs);

    const targetDirection = mapSignalToAngle(directionSignal);
    const lerpAmount = clamp(deltaSeconds * this.settings.directionResponsiveness, 0, 1);
    this.direction = lerpAngle(this.direction, targetDirection, lerpAmount);

    const acceleration = accelerationSignal * this.settings.maxAcceleration;
    this.speed = clamp(
      this.speed + acceleration * deltaSeconds,
      this.settings.minSpeed,
      this.settings.maxSpeed,
    );

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    this.position.x += velocityX * deltaSeconds;
    this.position.y += velocityY * deltaSeconds;
    this.distanceTravelled += Math.hypot(velocityX, velocityY) * deltaSeconds;

    this.handleWallBounce(bounds);
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

  buildBrainInputs({ width, height }) {
    const normalizedDirection = normalizeAngle(this.direction) / Math.PI - 1;

    const leftDistance = clamp((this.position.x - this.radius) / width, 0, 1);
    const rightDistance = clamp((width - this.radius - this.position.x) / width, 0, 1);
    const topDistance = clamp((this.position.y - this.radius) / height, 0, 1);
    const bottomDistance = clamp((height - this.radius - this.position.y) / height, 0, 1);

    const xNormalized = clamp(this.position.x / width, 0, 1);
    const yNormalized = clamp(this.position.y / height, 0, 1);

    return [
      normalizedDirection,
      leftDistance,
      rightDistance,
      topDistance,
      bottomDistance,
      xNormalized,
      yNormalized,
    ];
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
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
