// Controleur IA simple : gere ressources, constructions, et attaques periodiques.
export default class AiController {
  constructor(game, options = {}) {
    this.game = game;
    this.player = options.player; // Player IA
    this.cityCenter = options.cityCenter; // {x,y}
    this.timers = {
      gather: 0,
      build: 0,
      attack: 0,
    };
    this.config = {
      gatherInterval: options.gatherInterval ?? 2.5,
      buildInterval: options.buildInterval ?? 12,
      attackInterval: options.attackInterval ?? 20,
      soldiersPerWave: options.soldiersPerWave ?? 4,
      difficultyMultiplier: options.difficultyMultiplier ?? 1.0,
    };
  }

  update(dt) {
    this.timers.gather += dt;
    this.timers.build += dt;
    this.timers.attack += dt;

    if (this.timers.gather >= this.config.gatherInterval) {
      this.timers.gather = 0;
      this.assignGathering();
    }

    if (this.timers.build >= this.config.buildInterval) {
      this.timers.build = 0;
      this.tryBuild();
    }

    if (this.timers.attack >= this.config.attackInterval) {
      this.timers.attack = 0;
      this.launchAttack();
    }
  }

  assignGathering() {
    // Envoie tous les citoyens IA vers la ressource la plus proche (bois prioritaire).
    const target = this.findNearestResource(this.cityCenter.x, this.cityCenter.y);
    if (!target) return;
    for (const c of this.player.citizens) {
      const path = this.game.computePath({ x: c.x, y: c.y }, target, true);
      c.issueOrder(target, "gather", target.type, null, path);
    }
  }

  tryBuild() {
    // Si populationCap trop basse, construire maison ; sinon caserne si absente.
    const needHouse = this.player.population >= this.player.populationCap - 2;
    const hasBarracks = this.game.buildings.some((b) => b.owner === this.player && b.type === "barracks" && b.completed);
    if (needHouse) {
      this.placeBuilding("house");
    } else if (!hasBarracks) {
      this.placeBuilding("barracks");
    }
  }

  placeBuilding(type) {
    const pos = this.findBuildSpot();
    if (!pos) return;
    this.game.placeBuildingForPlayer(type, pos.x, pos.y, this.player);
  }

  launchAttack() {
    const barracksReady = this.game.buildings.some((b) => b.owner === this.player && b.type === "barracks" && b.completed);
    if (!barracksReady) return;

    // Recrute quelques soldats IA.
    for (let i = 0; i < this.config.soldiersPerWave; i++) {
      this.game.spawnSoldierForPlayer(this.player);
    }
    // Ordonne d'attaquer la ville ennemie (joueur humain) si elle existe.
    const enemyCity = this.game.enemyCityFor(this.player);
    if (!enemyCity) return;
    for (const s of this.player.soldiers) {
      const path = this.game.computePath({ x: s.x, y: s.y }, { x: enemyCity.x, y: enemyCity.y }, true);
      s.issueAttack(enemyCity, path);
    }
  }

  // Helpers
  findNearestResource(x, y) {
    const types = ["wood", "stone", "food"];
    let best = null;
    let bestDist = Infinity;
    for (let iy = 0; iy < this.game.tileMap.height; iy += 2) {
      for (let ix = 0; ix < this.game.tileMap.width; ix += 2) {
        const type = this.game.tileMap.get(ix, iy);
        if (!types.includes(type)) continue;
        const d = Math.hypot(ix - x, iy - y);
        if (d < bestDist) {
          bestDist = d;
          best = { x: ix, y: iy, type };
        }
      }
    }
    return best;
  }

  findBuildSpot() {
    // Simple : cherche a proximite du centre IA.
    const baseX = Math.round(this.cityCenter.x);
    const baseY = Math.round(this.cityCenter.y);
    const radius = 6;
    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const x = baseX + dx;
          const y = baseY + dy;
          if (this.game.isWalkable(x, y) && !this.game.findBuildingAt(x, y)) {
            return { x, y };
          }
        }
      }
    }
    return null;
  }
}
