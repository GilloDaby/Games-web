const ARENA_CONFIG = {
  width: 800,
  height: 600,
  creatureCount: 10,
  minSpeed: 40,
  maxSpeed: 90,
  maxAcceleration: 70,
  directionResponsiveness: 6,
  creatureRadius: 12,
};

class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    this.hiddenWeights = Array.from({ length: hiddenSize }, () =>
      Array.from({ length: inputSize }, NeuralNetwork.randomWeight),
    );
    this.hiddenBiases = Array.from({ length: hiddenSize }, NeuralNetwork.randomWeight);

    this.outputWeights = Array.from({ length: outputSize }, () =>
      Array.from({ length: hiddenSize }, NeuralNetwork.randomWeight),
    );
    this.outputBiases = Array.from({ length: outputSize }, NeuralNetwork.randomWeight);
  }

  static randomWeight() {
    return Math.random() * 2 - 1;
  }

  feedforward(inputs) {
    if (inputs.length !== this.inputSize) {
      throw new Error(`Invalid input length: expected ${this.inputSize}, got ${inputs.length}`);
    }

    const hiddenLayer = new Array(this.hiddenSize);
    for (let i = 0; i < this.hiddenSize; i += 1) {
      let sum = this.hiddenBiases[i];
      for (let j = 0; j < this.inputSize; j += 1) {
        sum += this.hiddenWeights[i][j] * inputs[j];
      }
      hiddenLayer[i] = Math.tanh(sum);
    }

    const outputs = new Array(this.outputSize);
    for (let k = 0; k < this.outputSize; k += 1) {
      let sum = this.outputBiases[k];
      for (let j = 0; j < this.hiddenSize; j += 1) {
        sum += this.outputWeights[k][j] * hiddenLayer[j];
      }
      outputs[k] = Math.tanh(sum);
    }

    return outputs;
  }
}

class Creature {
  constructor({ x, y, speed, direction, radius, color }) {
    this.position = { x, y };
    this.speed = speed;
    this.direction = direction;
    this.radius = radius;
    this.color = color;
    this.brain = new NeuralNetwork(7, 4, 2);
  }

  update(deltaSeconds, bounds) {
    const brainInputs = this.buildBrainInputs(bounds);
    const [directionSignal, accelerationSignal] = this.brain.feedforward(brainInputs);

    const targetDirection = mapSignalToAngle(directionSignal);
    const lerpAmount = clamp(deltaSeconds * ARENA_CONFIG.directionResponsiveness, 0, 1);
    this.direction = lerpAngle(this.direction, targetDirection, lerpAmount);

    const acceleration = accelerationSignal * ARENA_CONFIG.maxAcceleration;
    this.speed = clamp(
      this.speed + acceleration * deltaSeconds,
      ARENA_CONFIG.minSpeed,
      ARENA_CONFIG.maxSpeed,
    );

    const velocityX = Math.cos(this.direction) * this.speed;
    const velocityY = Math.sin(this.direction) * this.speed;

    this.position.x += velocityX * deltaSeconds;
    this.position.y += velocityY * deltaSeconds;

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

class Arena {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.creatures = [];
    this.lastTimestamp = 0;
    this.rafId = null;

    this.spawnCreatures(ARENA_CONFIG.creatureCount);
  }

  spawnCreatures(count) {
    for (let i = 0; i < count; i += 1) {
      this.creatures.push(
        new Creature({
          x: randomBetween(ARENA_CONFIG.creatureRadius, this.width - ARENA_CONFIG.creatureRadius),
          y: randomBetween(ARENA_CONFIG.creatureRadius, this.height - ARENA_CONFIG.creatureRadius),
          speed: randomBetween(ARENA_CONFIG.minSpeed, ARENA_CONFIG.maxSpeed),
          direction: randomBetween(0, Math.PI * 2),
          radius: ARENA_CONFIG.creatureRadius,
          color: randomPastel(),
        }),
      );
    }
  }

  start() {
    const step = (timestamp) => {
      const deltaSeconds = Math.min((timestamp - this.lastTimestamp) / 1000 || 0, 0.05);
      this.lastTimestamp = timestamp;

      this.update(deltaSeconds);
      this.draw();

      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame((t) => {
      this.lastTimestamp = t;
      step(t);
    });
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  update(deltaSeconds) {
    for (const creature of this.creatures) {
      creature.update(deltaSeconds, { width: this.width, height: this.height });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawArena();

    for (const creature of this.creatures) {
      creature.draw(this.ctx);
    }
  }

  drawArena() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#04111c";
    ctx.fillRect(0, 0, this.width, this.height);

    // Light grid lines provide spatial reference.
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = gridSize; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.height);
      ctx.stroke();
    }
    for (let y = gridSize; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
    ctx.restore();
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomPastel() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 65%)`;
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

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const arena = new Arena(canvas);
  arena.start();
});
