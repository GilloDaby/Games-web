import Creature from "./Creature.js";
import GeneticAlgorithm from "./GeneticAlgorithm.js";
import NeuralNetwork from "./NeuralNetwork.js";
import Zone, { pickZoneType } from "./Zone.js";
import TileMap from "./TileMap.js";
import PlayerSkinManager from "./PlayerSkinManager.js";
import HealthPickup from "./HealthPickup.js";
import ResourceSystem from "./ResourceSystem.js";
import Animal from "./Animal.js";

const ARENA_SETTINGS = {
  width: 2200,
  height: 1300,
  gridSize: 64,
  populationSize: 60,
  generationDuration: 25, // seconds
  mutationRate: 0.05,
  selectionRatio: 0.2,
  healthPickup: {
    minInterval: 7,
    maxInterval: 16,
    maxActive: 3,
    radius: 14,
  },
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
const WEATHER_PRESETS = {
  clear: {
    label: "Clair",
    duration: [22, 36],
    modifiers: { vision: 1, hearing: 1, metabolism: 1, speed: 1, hydration: 1 },
  },
  rain: {
    label: "Pluie",
    duration: [20, 30],
    modifiers: { vision: 0.85, hearing: 1.1, metabolism: 1.05, speed: 0.95, hydration: 0.9 },
  },
  night: {
    label: "Nuit",
    duration: [18, 28],
    modifiers: { vision: 0.65, hearing: 1.2, metabolism: 0.95, speed: 0.9, hydration: 1 },
  },
  heatwave: {
    label: "Canicule",
    duration: [16, 24],
    modifiers: { vision: 0.95, hearing: 1, metabolism: 1.2, speed: 0.92, hydration: 1.2 },
  },
  storm: {
    label: "Tempête",
    duration: [12, 20],
    modifiers: { vision: 0.6, hearing: 0.9, metabolism: 1.1, speed: 0.85, hydration: 1 },
  },
};

const ANIMAL_SKIN_FILES = [
  "Cat 01-1.png",
  "Cat 01-1r.png",
  "Cat 01-2.png",
  "Cat 01-3.png",
  "Cat-01-2r.png",
  "Cat-01-3r.png",
  "Dog 01-1.png",
  "Dog 01-1r.png",
  "Dog 01-2.png",
  "Dog 01-3.png",
  "Dog-01-2r.png",
  "Dog-01-3r.png",
];

const SIMULATION_SPEEDS = [1, 10, 100, 1000];

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
    this.resourceSystem = new ResourceSystem(this.bounds, this.tileMap);
    this.playerSkins = new PlayerSkinManager();
    this.animalSkins = new PlayerSkinManager({
      basePath: "img/Animal",
      manifest: "animals.json",
      fallbackList: ANIMAL_SKIN_FILES,
    });
    this.animals = [];
    this.targetAnimalCount = 14;
    this.camera = {
      zoom: 1,
      targetZoom: 1,
      minZoom: 0.4,
      maxZoom: 4,
      focusX: this.bounds.width / 2,
      focusY: this.bounds.height / 2,
      follow: null,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      focusStart: { x: 0, y: 0 },
      wasDragging: false,
    };

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
    this.averageEnergy = 0;
    this.averageHydration = 0;
    this.stagnationCounter = 0;
    this.pendingGenerationSkip = false;
    this.storageAvailable = typeof window !== "undefined" && "localStorage" in window;
    this.persistenceKey = STORAGE_KEY;
    this.ga.setMutationPressure(0);
    this.weather = this.rollWeather();
    this.healthPickups = [];
    this.nextHealthSpawn = this.rollHealthSpawnTime();
    this.timeScale = 1;

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
        if (typeof persisted.timeScale === "number") {
          this.timeScale = persisted.timeScale;
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
        const genomes = Array.isArray(persisted.genomes) ? persisted.genomes : null;
        this.spawnPopulation(brains, genomes);
      } catch (error) {
        console.warn("Impossible de restaurer l'état précédent :", error);
        this.spawnPopulation();
      }
    } else {
      this.spawnPopulation();
    }

    this.playerSkins.ready.then(() => {
      for (const creature of this.creatures) {
        creature.skin = this.playerSkins.getRandomSkin();
      }
    });
    this.animalSkins.ready.then(() => {
      this.assignSkinsToAnimals();
    });

    this.updateHud();
  }

  spawnPopulation(brains, genomes = null) {
    const sourceBrains = brains && brains.length ? brains : this.ga.createInitialBrains();
    const sourceGenomes = genomes && genomes.length ? genomes : this.ga.createInitialGenomes();
    const brainInstances = sourceBrains.map((brain) =>
      brain instanceof NeuralNetwork ? brain : NeuralNetwork.fromJSON(brain),
    );
    const genomeInstances = sourceGenomes.slice();
    const desiredCount = this.config.populationSize;
    this.targetAnimalCount = Math.max(8, Math.floor(desiredCount * 0.35));
    if (brainInstances.length > desiredCount) {
      brainInstances.length = desiredCount;
    } else if (brainInstances.length < desiredCount) {
      const needed = desiredCount - brainInstances.length;
      const filler = this.ga.createInitialBrains().slice(0, needed);
      brainInstances.push(...filler);
    }
    if (genomeInstances.length > desiredCount) {
      genomeInstances.length = desiredCount;
    } else if (genomeInstances.length < desiredCount) {
      const needed = desiredCount - genomeInstances.length;
      const filler = this.ga.createInitialGenomes().slice(0, needed);
      genomeInstances.push(...filler);
    }
    this.creatures = this.createCreaturesFromBrains(brainInstances, genomeInstances);
    this.healthPickups = [];
    this.nextHealthSpawn = this.rollHealthSpawnTime();
    this.elapsedGenerationTime = 0;
    this.bestFitness = 0;
    this.averageFitness = 0;
    this.totalKills = 0;
    this.currentAlive = this.creatures.length;
    this.attackEffects = [];
    this.generateZones();
    this.resourceSystem?.reset();
    this.spawnAnimals();
    this.hudUpdateAccumulator = 0;
    if (!brains || !brains.length) {
      this.stagnationCounter = 0;
      this.prevBestFitness = 0;
      this.ga.setMutationPressure(0);
    }
    this.persistState(brainInstances, genomeInstances);
    this.updateHud();
    if (this.uiManager) {
      this.uiManager.syncControlsFromArena();
    }
  }

  createCreaturesFromBrains(brains, genomes = []) {
    return brains.map((brain, index) => this.createCreature(brain, genomes[index]));
  }

  createCreature(brain, genome) {
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
      genome,
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
    const scaledDelta = Math.min(deltaSeconds * this.timeScale, 10);
    let totalFitness = 0;
    let bestFitness = 0;
    let aliveCount = 0;
    let totalEnergy = 0;
    let totalHydration = 0;
    const generationTime = this.elapsedGenerationTime;

    this.updateZones(scaledDelta);
    this.updateWeather(scaledDelta);
    this.updateHealthPickups(scaledDelta);
    this.updateAnimals(scaledDelta);
    this.resourceSystem?.update(scaledDelta);

    for (const creature of this.creatures) {
      creature.update(
        scaledDelta,
        this.bounds,
        this.creatures,
        generationTime,
        (effect) => this.spawnAttackEffect(effect),
        this.zones,
        this.tileMap,
        this.weather,
        this.healthPickups,
        this.resourceSystem,
        this.animals,
      );
      totalFitness += creature.fitness;
      if (creature.fitness > bestFitness) {
        bestFitness = creature.fitness;
      }
      if (creature.alive) {
        aliveCount += 1;
        totalEnergy += creature.energy / creature.energyMax;
        totalHydration += creature.hydration / creature.hydrationMax;
      }
    }

    this.bestFitness = bestFitness;
    this.averageFitness = totalFitness / this.creatures.length || 0;
    this.averageEnergy = aliveCount ? totalEnergy / aliveCount : 0;
    this.averageHydration = aliveCount ? totalHydration / aliveCount : 0;
    this.totalKills = this.creatures.reduce((sum, creature) => sum + creature.killCount, 0);
    const bestKillsThisFrame = this.creatures.reduce(
      (max, creature) => Math.max(max, creature.killCount),
      0,
    );
    this.bestKillRecord = Math.max(this.bestKillRecord, bestKillsThisFrame);
    this.currentAlive = aliveCount;
    this.recordBestFitness = Math.max(this.recordBestFitness, bestFitness);
    this.elapsedGenerationTime += scaledDelta;

    this.updateHud();
    this.updateAttackEffects(scaledDelta);
    this.updateCamera(scaledDelta);
    this.maintainFollowTarget();
    this.maintainFollowTarget();
    this.updateCamera(scaledDelta);

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
    this.ctx.save();
    this.applyCameraTransform();
    this.drawTileMap();
    this.drawResources();
    this.drawArena();
    this.drawZones();
    this.drawHealthPickups();
    this.drawAnimals();

    for (const creature of this.creatures) {
      creature.draw(this.ctx);
    }

    this.drawAttackEffects();
    this.ctx.restore();
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

  drawResources() {
    if (this.resourceSystem) {
      this.resourceSystem.draw(this.ctx);
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

    const { brains, genomes, stats } = this.ga.evolve(this.creatures);
    this.generation += 1;
    this.creatures = this.createCreaturesFromBrains(brains, genomes);
    this.healthPickups = [];
    this.nextHealthSpawn = this.rollHealthSpawnTime();
    this.elapsedGenerationTime = 0;
    this.bestFitness = stats.best;
    this.averageFitness = stats.average;
    this.updateMutationPressure(stats.best);
    this.totalKills = 0;
    this.currentAlive = this.creatures.length;
    this.hudUpdateAccumulator = 0;
    this.attackEffects = [];
    this.generateZones();
    this.resourceSystem?.reset();
    this.persistState(brains, genomes);
    this.updateHud();
  }

  updateHud() {
    const timeRemaining = Math.max(0, this.config.generationDuration - this.elapsedGenerationTime);
    const resourceSummary = this.resourceSystem?.getSummary() ?? {
      gathered: { wood: 0, stone: 0, crystal: 0 },
      structures: 0,
    };
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
      energy: this.averageEnergy,
      hydration: this.averageHydration,
      weatherLabel: this.weather?.label ?? "-",
      resources: resourceSummary.gathered,
      structures: resourceSummary.structures,
    };

    if (this.uiManager) {
      this.uiManager.updateHud(hudData);
      return;
    }

    if (!this.statsElements) {
      return;
    }

    const {
      generation,
      best,
      average,
      alive,
      kills,
      recordKills,
      recordFitness,
      time,
      zones,
      energy,
      hydration,
      weather,
      wood,
      stone,
      crystal,
      structures,
    } = this.statsElements;
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
    if (energy) {
      energy.textContent = `${Math.round(hudData.energy * 100)}%`;
    }
    if (hydration) {
      hydration.textContent = `${Math.round(hudData.hydration * 100)}%`;
    }
    if (weather) {
      weather.textContent = hudData.weatherLabel ?? "-";
    }
    if (wood) {
      wood.textContent = Math.round(hudData.resources?.wood ?? 0).toString();
    }
    if (stone) {
      stone.textContent = Math.round(hudData.resources?.stone ?? 0).toString();
    }
    if (crystal) {
      crystal.textContent = Math.round(hudData.resources?.crystal ?? 0).toString();
    }
    if (structures) {
      structures.textContent = hudData.structures?.toString() ?? "0";
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

  updateHealthPickups(deltaSeconds) {
    this.nextHealthSpawn -= deltaSeconds;
    if (
      this.healthPickups.length < this.config.healthPickup.maxActive &&
      this.nextHealthSpawn <= 0 &&
      Math.random() < 0.9
    ) {
      this.spawnHealthPickup();
      this.nextHealthSpawn = this.rollHealthSpawnTime();
    }
    for (const pickup of this.healthPickups) {
      pickup.update(deltaSeconds);
    }
    this.healthPickups = this.healthPickups.filter((pickup) => !pickup.collected);
  }

  updateAnimals(deltaSeconds) {
    if (!this.animals?.length) {
      this.ensureAnimals();
      return;
    }
    for (const animal of this.animals) {
      animal.update(deltaSeconds, this.bounds);
    }
    this.animals = this.animals.filter((animal) => animal.alive);
    this.ensureAnimals();
  }

  updateWeather(deltaSeconds) {
    if (!this.weather) {
      this.weather = this.rollWeather();
      return;
    }
    this.weather.remaining -= deltaSeconds;
    if (this.weather.remaining <= 0) {
      const previous = this.weather.type;
      this.weather = this.rollWeather(previous);
    }
  }

  rollWeather(previousType = null) {
    const entries = Object.keys(WEATHER_PRESETS);
    const pool =
      previousType && entries.length > 1
        ? entries.filter((type) => type !== previousType || Math.random() < 0.35)
        : entries;
    const type = pool[Math.floor(Math.random() * pool.length)];
    const preset = WEATHER_PRESETS[type] ?? WEATHER_PRESETS.clear;
    const duration = randomBetween(preset.duration[0], preset.duration[1]);
    return {
      type,
      label: preset.label,
      duration,
      remaining: duration,
      modifiers: preset.modifiers,
    };
  }

  rollHealthSpawnTime() {
    return randomBetween(this.config.healthPickup.minInterval, this.config.healthPickup.maxInterval);
  }

  spawnHealthPickup() {
    const radius = this.config.healthPickup.radius;
    const maxAttempts = 80;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const x = randomBetween(radius + 10, this.bounds.width - radius - 10);
      const y = randomBetween(radius + 10, this.bounds.height - radius - 10);
      const tile = this.tileMap?.getTileAt(x, y);
      if (tile && (tile.type === "river" || tile.type === "water")) {
        continue;
      }
      if (this.healthPickups.some((p) => Math.hypot(p.x - x, p.y - y) < radius * 3)) {
        continue;
      }
      this.healthPickups.push(new HealthPickup({ x, y, radius }));
      return;
    }
  }

  spawnAnimals(count = this.targetAnimalCount) {
    const desired = Math.max(6, count);
    this.animals = [];
    for (let i = 0; i < desired; i += 1) {
      this.animals.push(this.createAnimal());
    }
    this.assignSkinsToAnimals();
  }

  ensureAnimals() {
    const missing = Math.max(0, this.targetAnimalCount - this.animals.length);
    for (let i = 0; i < missing; i += 1) {
      this.animals.push(this.createAnimal());
    }
  }

  createAnimal() {
    const radius = randomBetween(9, 12);
    const spawn = this.getSafeAnimalPosition(radius);
    return new Animal({
      x: spawn.x,
      y: spawn.y,
      radius,
      tileMap: this.tileMap,
      skin: this.animalSkins.getRandomSkin(),
    });
  }

  getSafeAnimalPosition(radius) {
    const attempts = 120;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const x = randomBetween(radius, this.bounds.width - radius);
      const y = randomBetween(radius, this.bounds.height - radius);
      const tile = this.tileMap?.getTileAt(x, y);
      if (tile && (tile.type === "river" || tile.type === "water")) {
        continue;
      }
      const closeToCreature = this.creatures.some(
        (c) => Math.hypot(c.position.x - x, c.position.y - y) < c.radius + radius + 10,
      );
      if (closeToCreature) {
        continue;
      }
      const overlapping = this.animals.some(
        (a) => Math.hypot(a.position.x - x, a.position.y - y) < a.radius + radius + 6,
      );
      if (overlapping) {
        continue;
      }
      return { x, y };
    }
    return {
      x: radius + (this.bounds.width - radius * 2) * Math.random(),
      y: radius + (this.bounds.height - radius * 2) * Math.random(),
    };
  }

  assignSkinsToAnimals() {
    if (!this.animalSkins?.skins?.length) {
      return;
    }
    for (const animal of this.animals) {
      if (!animal.skin) {
        animal.skin = this.animalSkins.getRandomSkin();
      }
    }
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

  drawHealthPickups() {
    if (!this.healthPickups?.length) {
      return;
    }
    for (const pickup of this.healthPickups) {
      pickup.draw(this.ctx);
    }
  }

  drawAnimals() {
    if (!this.animals?.length) {
      return;
    }
    for (const animal of this.animals) {
      animal.draw(this.ctx);
    }
  }

  applyCameraTransform() {
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.focusX, -this.camera.focusY);
  }

  updateCamera(deltaSeconds) {
    // Smooth zoom
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.15;
    this.camera.zoom = clamp(this.camera.zoom, this.camera.minZoom, this.camera.maxZoom);

    let targetX = this.camera.focusX;
    let targetY = this.camera.focusY;
    if (this.camera.follow && this.camera.follow.alive) {
      targetX = this.camera.follow.position.x;
      targetY = this.camera.follow.position.y;
    } else if (this.camera.follow && !this.camera.follow.alive) {
      this.camera.follow = null;
    }

    this.camera.focusX += (targetX - this.camera.focusX) * Math.min(1, deltaSeconds * 5);
    this.camera.focusY += (targetY - this.camera.focusY) * Math.min(1, deltaSeconds * 5);
    this.camera.focusX = clamp(this.camera.focusX, 0, this.bounds.width);
    this.camera.focusY = clamp(this.camera.focusY, 0, this.bounds.height);
  }

  maintainFollowTarget() {
    if (!this.camera.follow) {
      return;
    }
    if (this.camera.follow.alive) {
      return;
    }
    const killer = this.camera.follow.killedBy;
    if (killer && killer.alive) {
      this.camera.follow = killer;
      return;
    }
    const alive = this.creatures.filter((creature) => creature.alive);
    this.camera.follow = alive.length
      ? alive[Math.floor(Math.random() * alive.length)]
      : null;
  }

  screenToWorld(screenX, screenY) {
    const x =
      (screenX - this.canvas.width / 2) / this.camera.zoom + this.camera.focusX;
    const y =
      (screenY - this.canvas.height / 2) / this.camera.zoom + this.camera.focusY;
    return { x, y };
  }

  startCameraDrag(screenX, screenY) {
    this.camera.isDragging = true;
    this.camera.dragStart = { x: screenX, y: screenY };
    this.camera.focusStart = { x: this.camera.focusX, y: this.camera.focusY };
    this.camera.wasDragging = false;
    this.camera.follow = null;
  }

  dragCamera(screenX, screenY) {
    if (!this.camera.isDragging) {
      return;
    }
    const dx = (screenX - this.camera.dragStart.x) / this.camera.zoom;
    const dy = (screenY - this.camera.dragStart.y) / this.camera.zoom;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      this.camera.wasDragging = true;
    }
    this.camera.focusX = clamp(this.camera.focusStart.x - dx, 0, this.bounds.width);
    this.camera.focusY = clamp(this.camera.focusStart.y - dy, 0, this.bounds.height);
  }

  endCameraDrag() {
    this.camera.isDragging = false;
  }

  handleCanvasClick(screenX, screenY) {
    if (this.camera.wasDragging) {
      this.camera.wasDragging = false;
      return;
    }
    const { x, y } = this.screenToWorld(screenX, screenY);
    let closest = null;
    let minDist = Infinity;
    for (const creature of this.creatures) {
      if (!creature.alive) {
        continue;
      }
      const dist = Math.hypot(creature.position.x - x, creature.position.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = creature;
      }
    }

    if (closest && minDist <= 60) {
      this.camera.follow = closest;
      this.camera.targetZoom = clamp(2, this.camera.minZoom, this.camera.maxZoom);
      this.camera.focusX = closest.position.x;
      this.camera.focusY = closest.position.y;
    } else {
      this.camera.follow = null;
    }
  }

  handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.camera.targetZoom = clamp(
      this.camera.targetZoom + delta,
      this.camera.minZoom,
      this.camera.maxZoom,
    );
  }

  generateZones() {
    const zoneCount = Math.max(1, Math.floor(randomBetween(2, 3.5)));
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
    const newSize = Math.max(10, Math.min(1000, Math.round(size)));
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

  setTimeScale(scale) {
    const closest = SIMULATION_SPEEDS.reduce(
      (best, value) => (Math.abs(value - scale) < Math.abs(best - scale) ? value : best),
      SIMULATION_SPEEDS[0],
    );
    this.timeScale = closest;
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
      timeScale: this.timeScale,
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

  persistState(brains = null, genomes = null) {
    if (!this.storageAvailable) {
      return;
    }
    const sourceBrains = brains && brains.length ? brains : this.creatures.map((c) => c.brain);
    const sourceGenomes = genomes && genomes.length ? genomes : this.creatures.map((c) => c.genome);
    try {
      const payload = {
        generation: this.generation,
        brains: sourceBrains.map((brain) => brain.toJSON()),
        genomes: sourceGenomes.map((genome) => ({ ...genome })),
        bestHistory: this.bestHistory,
        bestKillRecord: this.bestKillRecord,
        recordBestFitness: this.recordBestFitness,
        prevBestFitness: this.prevBestFitness,
        populationSize: this.config.populationSize,
        generationDuration: this.config.generationDuration,
        mutationRate: this.ga.baseMutationRate,
        timeScale: this.timeScale,
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
    this.weather = this.rollWeather();
    this.healthPickups = [];
    this.nextHealthSpawn = this.rollHealthSpawnTime();
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
