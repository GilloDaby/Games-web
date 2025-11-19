import Creature from "./Creature.js";
import GeneticAlgorithm from "./GeneticAlgorithm.js";
import NeuralNetwork from "./NeuralNetwork.js";
import Zone, { pickZoneType } from "./Zone.js";
import TileMap from "./TileMap.js";
import PlayerSkinManager from "./PlayerSkinManager.js";

const ARENA_SETTINGS = {
  width: 1600,
  height: 1200,
  gridSize: 80,
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

const STORAGE_KEY = "genetic-ai-battle-state";

export default class Arena {
  constructor(canvas, statsElements, uiManager = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.statsElements = statsElements;
    this.uiManager = uiManager;
    this.config = ARENA_SETTINGS;
    this.bounds = { width: this.config.width, height: this.config.height };
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    // Simple tilemap d'arrière-plan
    const tileSize = 32;
    const tileMapWidth = Math.ceil(this.config.width / tileSize);
    const tileMapHeight = Math.ceil(this.config.height / tileSize);
    this.tileMap = new TileMap(tileMapWidth, tileMapHeight, tileSize);
    this.tileMap.generateBiomes();
    this.tileMap.generateRiver();
    this.playerSkins = new PlayerSkinManager();

    this.ga = new GeneticAlgorithm({
      populationSize: this.config.populationSize,
      mutationRate: this.config.mutationRate,
      selectionRatio: this.config.selectionRatio,
    });
    this.ga.populationSize = this.config.populationSize;

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
    this.zones = [];
    this.totalKills = 0;
    this.currentAlive = 0;
    this.bestHistory = [];
    this.bestKillRecord = 0;
    this.recordBestFitness = 0;
    this.prevBestFitness = 0;
    this.stagnationCounter = 0;
    this.pendingGenerationSkip = false;
    this.storageAvailable = typeof window !== "undefined" && "localStorage" in window;
    this.persistenceKey = STORAGE_KEY;
    this.ga.setMutationPressure(0);

    const persisted = this.loadPersistedState();
    if (persisted && Array.isArray(persisted.brains) && persisted.brains.length) {
      try {
        this.generation = persisted.generation ?? 1;
        if (typeof persisted.populationSize === "number") {
          this.config.populationSize = Math.max(5, Math.round(persisted.populationSize));
          this.ga.populationSize = this.config.populationSize;
        }
        if (typeof persisted.generationDuration === "number") {
          this.config.generationDuration = Math.max(5, Number(persisted.generationDuration));
        }
        if (typeof persisted.mutationRate === "number") {
          this.config.mutationRate = Math.max(0.005, Number(persisted.mutationRate));
          this.ga.baseMutationRate = this.config.mutationRate;
          this.ga.maxMutationRate = Math.min(0.5, this.config.mutationRate * 4);
        }

        this.bestHistory = persisted.bestHistory ?? [];
        const historyKillRecord = this.bestHistory.reduce(
          (max, entry) => Math.max(max, entry.kills ?? 0),
          0,
        );
        const historyFitnessRecord = this.bestHistory.reduce(
          (max, entry) => Math.max(max, entry.fitness ?? 0),
          0,
        );
        this.bestKillRecord = persisted.bestKillRecord ?? historyKillRecord;
        this.recordBestFitness = persisted.recordBestFitness ?? historyFitnessRecord;
        this.prevBestFitness = persisted.prevBestFitness ?? this.recordBestFitness ?? 0;
        const brains = persisted.brains.map((brain) => NeuralNetwork.fromJSON(brain));
        this.spawnPopulation(brains);
      } catch (error) {
        console.warn("Impossible de restaurer l'état précédent :", error);
        this.spawnPopulation();
      }
    } else {
      this.spawnPopulation();
    }

    this.updateHud();
  }

  spawnPopulation(brains) {
    const sourceBrains = brains && brains.length ? brains : this.ga.createInitialBrains();
    const brainInstances = sourceBrains.map((brain) =>
      brain instanceof NeuralNetwork ? brain : NeuralNetwork.fromJSON(brain),
    );
    const desiredCount = this.config.populationSize;
    if (brainInstances.length > desiredCount) {
      brainInstances.length = desiredCount;
    } else if (brainInstances.length < desiredCount) {
      const needed = desiredCount - brainInstances.length;
      const filler = this.ga.createInitialBrains().slice(0, needed);
      brainInstances.push(...filler);
    }
    this.creatures = this.createCreaturesFromBrains(brainInstances);
    this.elapsedGenerationTime = 0;
    this.bestFitness = 0;
    this.averageFitness = 0;
    this.totalKills = 0;
    this.currentAlive = this.creatures.length;
    this.attackEffects = [];
    this.generateZones();
    this.hudUpdateAccumulator = 0;
    if (!brains || !brains.length) {
      this.stagnationCounter = 0;
      this.prevBestFitness = 0;
      this.ga.setMutationPressure(0);
    }
    this.persistState(brainInstances);
    this.updateHud();
    if (this.uiManager) {
      this.uiManager.syncControlsFromArena();
    }
  }

  createCreaturesFromBrains(brains) {
    return brains.map((brain) => this.createCreature(brain));
  }

  createCreature(brain) {
    const radius = this.config.creatureSettings.radius;
    const spawn = this.getSafeSpawnPosition(radius);
    return new Creature({
      x: spawn.x,
      y: spawn.y,
      speed: randomBetween(
        this.config.creatureSettings.minSpeed,
        this.config.creatureSettings.maxSpeed,
      ),
      direction: randomBetween(0, Math.PI * 2),
      radius,
      color: randomPastel(),
      brain,
      settings: this.config.creatureSettings,
      skin: this.playerSkins.getRandomSkin(),
    });
  }

  getSafeSpawnPosition(radius) {
    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const x = randomBetween(radius, this.bounds.width - radius);
      const y = randomBetween(radius, this.bounds.height - radius);
      const tile = this.tileMap?.getTileAt(x, y);
      if (!tile || (tile.type !== "river" && tile.type !== "water")) {
        return { x, y };
      }
    }
    // fallback
    return {
      x: radius + (this.bounds.width - radius * 2) * Math.random(),
      y: radius + (this.bounds.height - radius * 2) * Math.random(),
    };
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

    this.updateZones(deltaSeconds);

    for (const creature of this.creatures) {
      creature.update(
        deltaSeconds,
        this.bounds,
        this.creatures,
        generationTime,
        (effect) => this.spawnAttackEffect(effect),
        this.zones,
        this.tileMap,
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
    this.totalKills = this.creatures.reduce((sum, creature) => sum + creature.killCount, 0);
    const bestKillsThisFrame = this.creatures.reduce(
      (max, creature) => Math.max(max, creature.killCount),
      0,
    );
    this.bestKillRecord = Math.max(this.bestKillRecord, bestKillsThisFrame);
    this.currentAlive = aliveCount;
    this.recordBestFitness = Math.max(this.recordBestFitness, bestFitness);
    this.elapsedGenerationTime += deltaSeconds;

    this.updateHud();
    this.updateAttackEffects(deltaSeconds);

    if (
      this.pendingGenerationSkip ||
      aliveCount <= 1 ||
      this.elapsedGenerationTime >= this.config.generationDuration
    ) {
      this.pendingGenerationSkip = false;
      this.evolvePopulation();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.bounds.width, this.bounds.height);
    this.drawTileMap();
    this.drawArena();
    this.drawZones();

    for (const creature of this.creatures) {
      creature.draw(this.ctx);
    }

    this.drawAttackEffects();
  }

  drawArena() {
    const ctx = this.ctx;
    ctx.save();
    // Background is now handled by the tilemap; keep a subtle overlay/grid only.
    ctx.fillStyle = "rgba(4, 17, 28, 0.2)";
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

  drawTileMap() {
    if (this.tileMap) {
      this.tileMap.draw(this.ctx);
    }
  }

  drawZones() {
    if (!this.zones?.length) {
      return;
    }
    for (const zone of this.zones) {
      zone.draw(this.ctx);
    }
  }

  evolvePopulation() {
    const bestCreature = this.creatures.reduce((best, creature) => {
      if (!best || creature.fitness > best.fitness) {
        return creature;
      }
      return best;
    }, null);

    if (bestCreature) {
      const entry = {
        generation: this.generation,
        fitness: parseFloat(bestCreature.fitness.toFixed(2)),
        kills: bestCreature.killCount,
        color: bestCreature.color,
        timestamp: Date.now(),
        brain: bestCreature.brain.toJSON(),
      };
      this.bestHistory.unshift(entry);
      this.bestHistory = this.bestHistory.slice(0, 25);
      this.bestKillRecord = Math.max(this.bestKillRecord, entry.kills ?? 0);
      this.recordBestFitness = Math.max(this.recordBestFitness, entry.fitness ?? 0);
    }

    const { brains, stats } = this.ga.evolve(this.creatures);
    this.generation += 1;
    this.creatures = this.createCreaturesFromBrains(brains);
    this.elapsedGenerationTime = 0;
    this.bestFitness = stats.best;
    this.averageFitness = stats.average;
    this.updateMutationPressure(stats.best);
    this.totalKills = 0;
    this.currentAlive = this.creatures.length;
    this.hudUpdateAccumulator = 0;
    this.attackEffects = [];
    this.generateZones();
    this.persistState(brains);
    this.updateHud();
  }

  updateHud() {
    const timeRemaining = Math.max(0, this.config.generationDuration - this.elapsedGenerationTime);
    const hudData = {
      generation: this.generation,
      best: this.bestFitness,
      average: this.averageFitness,
      alive: this.currentAlive,
      timeRemaining,
      kills: this.totalKills,
      recordKills: this.bestKillRecord,
      recordFitness: this.recordBestFitness,
      zones: this.getActiveZoneCount(),
    };

    if (this.uiManager) {
      this.uiManager.updateHud(hudData);
      return;
    }

    if (!this.statsElements) {
      return;
    }

    const { generation, best, average, alive, kills, recordKills, recordFitness, time, zones } =
      this.statsElements;
    if (generation) {
      generation.textContent = hudData.generation.toString();
    }
    if (best) {
      best.textContent = hudData.best.toFixed(1);
    }
    if (average) {
      average.textContent = hudData.average.toFixed(1);
    }
    if (alive) {
      alive.textContent = hudData.alive.toString();
    }
    if (time) {
      time.textContent = `${Math.max(0, Math.floor(timeRemaining)).toString()}s`;
    }
    if (kills) {
      kills.textContent = hudData.kills.toString();
    }
    if (recordKills) {
      recordKills.textContent = hudData.recordKills.toString();
    }
    if (recordFitness) {
      recordFitness.textContent = hudData.recordFitness.toFixed(1);
    }
    if (zones) {
      zones.textContent = hudData.zones.toString();
    }
  }

  spawnAttackEffect(effect) {
    const duration = effect.duration ?? 0.25;
    this.attackEffects.push({
      x: effect.x,
      y: effect.y,
      radius: effect.radius,
      remaining: duration,
      duration,
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

  updateZones(deltaSeconds) {
    if (!this.zones?.length) {
      return;
    }
    for (const zone of this.zones) {
      zone.update(deltaSeconds);
    }
    this.zones = this.zones.filter((zone) => zone.active);
  }

  drawAttackEffects() {
    const ctx = this.ctx;
    ctx.save();
    for (const effect of this.attackEffects) {
      const alpha = clamp(effect.remaining / effect.duration, 0, 1);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  generateZones() {
    const zoneCount = Math.max(1, Math.floor(randomBetween(2, 4)));
    this.zones = [];
    let attempts = 0;
    while (this.zones.length < zoneCount && attempts < 50) {
      attempts += 1;
      const type = pickZoneType();
      const candidate = Zone.createRandom(type, this.bounds);
      if (
        this.zones.some(
          (existing) =>
            Math.hypot(existing.x - candidate.x, existing.y - candidate.y) <
            existing.radius + candidate.radius + 80,
        )
      ) {
        continue;
      }
      this.zones.push(candidate);
    }
  }

  updateMutationPressure(currentBest) {
    if (currentBest > this.prevBestFitness + 0.5) {
      this.prevBestFitness = currentBest;
      this.stagnationCounter = 0;
    } else {
      this.stagnationCounter += 1;
    }
    this.ga.setMutationPressure(this.stagnationCounter);
  }

  setPopulationSize(size) {
    const newSize = Math.max(10, Math.min(80, Math.round(size)));
    if (newSize === this.config.populationSize) {
      return;
    }
    this.config.populationSize = newSize;
    this.ga.populationSize = newSize;
    this.spawnPopulation();
    this.uiManager?.syncControlsFromArena();
  }

  setMutationRate(rate) {
    const clamped = clamp(rate, 0.005, 0.6);
    this.config.mutationRate = clamped;
    this.ga.baseMutationRate = clamped;
    this.ga.maxMutationRate = Math.min(0.6, clamped * 4);
    this.ga.setMutationPressure(this.stagnationCounter);
    this.persistState();
    this.updateHud();
    this.uiManager?.syncControlsFromArena();
  }

  setGenerationDuration(seconds) {
    const clamped = clamp(seconds, 5, 120);
    this.config.generationDuration = clamped;
    this.persistState();
    this.updateHud();
    this.uiManager?.syncControlsFromArena();
  }

  skipGeneration() {
    this.pendingGenerationSkip = true;
  }

  getSimulationSettings() {
    return {
      populationSize: this.config.populationSize,
      mutationRate: this.ga.baseMutationRate,
      generationDuration: this.config.generationDuration,
    };
  }

  getActiveZoneCount() {
    return this.zones?.filter((zone) => zone.active).length ?? 0;
  }

  loadPersistedState() {
    if (!this.storageAvailable) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(this.persistenceKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Impossible de lire l'état persistant :", error);
      return null;
    }
  }

  persistState(brains = null) {
    if (!this.storageAvailable) {
      return;
    }
    const sourceBrains = brains && brains.length ? brains : this.creatures.map((c) => c.brain);
    try {
      const payload = {
        generation: this.generation,
        brains: sourceBrains.map((brain) => brain.toJSON()),
        bestHistory: this.bestHistory,
        bestKillRecord: this.bestKillRecord,
        recordBestFitness: this.recordBestFitness,
        prevBestFitness: this.prevBestFitness,
        populationSize: this.config.populationSize,
        generationDuration: this.config.generationDuration,
        mutationRate: this.ga.baseMutationRate,
      };
      window.localStorage.setItem(this.persistenceKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Impossible d'écrire l'état persistant :", error);
    }
  }

  resetSimulation() {
    if (this.storageAvailable) {
      window.localStorage.removeItem(this.persistenceKey);
    }
    this.generation = 1;
    this.bestHistory = [];
    this.bestKillRecord = 0;
    this.recordBestFitness = 0;
    this.prevBestFitness = 0;
    this.stagnationCounter = 0;
    this.ga.setMutationPressure(0);
    this.pendingGenerationSkip = false;
    this.spawnPopulation();
    this.updateHud();
    this.uiManager?.syncControlsFromArena();
  }

  getBestHistory() {
    return this.bestHistory.map((entry) => ({ ...entry }));
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
