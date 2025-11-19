import Creature from "./Creature.js";
import GeneticAlgorithm from "./GeneticAlgorithm.js";

const ARENA_SETTINGS = {
  width: 800,
  height: 600,
  gridSize: 50,
  populationSize: 30,
  generationDuration: 25, // seconds
  mutationRate: 0.05,
  selectionRatio: 0.2,
  creatureSettings: {
    minSpeed: 30,
    maxSpeed: 110,
    maxAcceleration: 80,
    directionResponsiveness: 5,
    radius: 12,
    hp: 100,
    damage: 12,
    attackRange: 50,
    attackCooldown: 0.8,
  },
};

export default class Arena {
  constructor(canvas, statsElements) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.statsElements = statsElements;
    this.config = ARENA_SETTINGS;
    this.bounds = { width: this.config.width, height: this.config.height };
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    this.ga = new GeneticAlgorithm({
      populationSize: this.config.populationSize,
      mutationRate: this.config.mutationRate,
      selectionRatio: this.config.selectionRatio,
    });

    this.creatures = [];
    this.elapsedGenerationTime = 0;
    this.lastTimestamp = 0;
    this.rafId = null;
    this.generation = 1;
    this.bestFitness = 0;
    this.averageFitness = 0;
    this.hudUpdateAccumulator = 0;
    this.hudUpdateInterval = 0.25;
    this.attackEffects = [];

    this.spawnInitialPopulation();
    this.updateHud();
  }

  spawnInitialPopulation() {
    const brains = this.ga.createInitialBrains();
    this.creatures = this.createCreaturesFromBrains(brains);
    this.elapsedGenerationTime = 0;
  }

  createCreaturesFromBrains(brains) {
    return brains.map((brain) => this.createCreature(brain));
  }

  createCreature(brain) {
    const radius = this.config.creatureSettings.radius;
    return new Creature({
      x: randomBetween(radius, this.bounds.width - radius),
      y: randomBetween(radius, this.bounds.height - radius),
      speed: randomBetween(
        this.config.creatureSettings.minSpeed,
        this.config.creatureSettings.maxSpeed,
      ),
      direction: randomBetween(0, Math.PI * 2),
      radius,
      color: randomPastel(),
      brain,
      settings: this.config.creatureSettings,
    });
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
    let totalFitness = 0;
    let bestFitness = 0;
    let aliveCount = 0;
    const generationTime = this.elapsedGenerationTime;

    for (const creature of this.creatures) {
      creature.update(
        deltaSeconds,
        this.bounds,
        this.creatures,
        generationTime,
        (effect) => this.spawnAttackEffect(effect),
      );
      totalFitness += creature.fitness;
      if (creature.fitness > bestFitness) {
        bestFitness = creature.fitness;
      }
      if (creature.alive) {
        aliveCount += 1;
      }
    }

    this.bestFitness = bestFitness;
    this.averageFitness = totalFitness / this.creatures.length || 0;
    this.elapsedGenerationTime += deltaSeconds;

    this.hudUpdateAccumulator += deltaSeconds;
    if (this.hudUpdateAccumulator >= this.hudUpdateInterval) {
      this.updateHud();
      this.hudUpdateAccumulator = 0;
    }

    this.updateAttackEffects(deltaSeconds);

    if (aliveCount <= 1 || this.elapsedGenerationTime >= this.config.generationDuration) {
      this.evolvePopulation();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.bounds.width, this.bounds.height);
    this.drawArena();

    for (const creature of this.creatures) {
      creature.draw(this.ctx);
    }

    this.drawAttackEffects();
  }

  drawArena() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#04111c";
    ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = this.config.gridSize; x < this.bounds.width; x += this.config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.bounds.height);
      ctx.stroke();
    }
    for (let y = this.config.gridSize; y < this.bounds.height; y += this.config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.bounds.width, y + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.bounds.width - 4, this.bounds.height - 4);
    ctx.restore();
  }

  evolvePopulation() {
    const { brains, stats } = this.ga.evolve(this.creatures);
    this.generation += 1;
    this.creatures = this.createCreaturesFromBrains(brains);
    this.elapsedGenerationTime = 0;
    this.bestFitness = stats.best;
    this.averageFitness = stats.average;
    this.hudUpdateAccumulator = 0;
    this.attackEffects = [];
    this.updateHud();
  }

  updateHud() {
    if (!this.statsElements) {
      return;
    }

    const { generation, best, average } = this.statsElements;
    if (generation) {
      generation.textContent = this.generation.toString();
    }
    if (best) {
      best.textContent = this.bestFitness.toFixed(1);
    }
    if (average) {
      average.textContent = this.averageFitness.toFixed(1);
    }
  }

  spawnAttackEffect(effect) {
    this.attackEffects.push({
      x: effect.x,
      y: effect.y,
      radius: effect.radius,
      remaining: effect.duration,
    });
  }

  updateAttackEffects(deltaSeconds) {
    this.attackEffects = this.attackEffects
      .map((effect) => ({
        ...effect,
        remaining: effect.remaining - deltaSeconds,
      }))
      .filter((effect) => effect.remaining > 0);
  }

  drawAttackEffects() {
    const ctx = this.ctx;
    ctx.save();
    for (const effect of this.attackEffects) {
      const alpha = clamp(effect.remaining / 0.25, 0, 1);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
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
