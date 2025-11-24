import TileMap from "./systems/TileMap.js";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_COLORS,
  TILE_PROBABILITIES,
  TILE_TYPES,
  RESOURCE_CAPACITY,
  BIOMES,
} from "./utils/constants.js";
import Player from "./entities/Player.js";
import Citizen from "./entities/Citizen.js";
import Soldier from "./entities/Soldier.js";
import InputSystem from "./systems/inputSystem.js";
import Building from "./entities/Building.js";
import { BUILD_TYPES } from "./utils/buildingConfig.js";
import Pathfinder from "./systems/Pathfinder.js";
import Camera from "./systems/Camera.js";
import Projectile from "./entities/Projectile.js";
import AiController from "./systems/AiController.js";
import LocalServer from "./network/LocalServer.js";
import NetClient from "./network/NetClient.js";
import WebSocketClient from "./network/WebSocketClient.js";
import { CommandTypes } from "./network/Protocol.js";
import SpatialHash from "./systems/SpatialHash.js";

// Classe principale du jeu : gere l'etat global, la boucle update/render.
export default class Game {
  constructor(canvas, options = {}, onGameEnd = null, onError = null) {
    this.canvas = canvas;
    this.backgroundColor = "#0b1622";
    this.elapsed = 0;
    this.onGameEnd = onGameEnd;
    this.onError = onError;
    this.ended = false;
    this.speed = options.gameSpeed || 1;
    this.config = options.config;

    this.mapWidth = options.mapWidth || MAP_WIDTH;
    this.mapHeight = options.mapHeight || MAP_HEIGHT;

    // Carte logique (grille 2D)
    this.tileMap = new TileMap(this.mapWidth, this.mapHeight);
    this.tileMap.generate(TILE_PROBABILITIES, RESOURCE_CAPACITY, BIOMES);
    this.pathfinder = new Pathfinder(this.mapWidth, this.mapHeight);
    this.camera = new Camera(this.mapWidth, this.mapHeight);

    // Joueur humain.
    const spawn = {
      x: Math.floor(this.mapWidth / 2),
      y: Math.floor(this.mapHeight / 2),
    };
    this.player = new Player(1, "#e63946", spawn);
    const baseHp = this.config?.rules?.baseHp ?? 220;
    this.playerCity = { x: spawn.x, y: spawn.y, hp: baseHp, maxHp: baseHp, radius: 1.2 };

    // IA simple (un joueur IA)
    const aiSpawn = {
      x: Math.floor(this.mapWidth * 0.2),
      y: Math.floor(this.mapHeight * 0.7),
    };
    this.aiPlayer = new Player(2, "#5cb85c", aiSpawn, 8);
    this.aiController = new AiController(this, {
      player: this.aiPlayer,
      cityCenter: aiSpawn,
      gatherInterval: 3,
      buildInterval: 12,
      attackInterval: options.aiConfig?.attackInterval ?? 22,
      soldiersPerWave: options.aiConfig?.soldiersPerWave ?? 3,
      difficultyMultiplier: 1,
    });

    // Simulation locale "serveur" ou client WebSocket (fallback local)
    if (options.networkMode === "ws" && options.wsUrl) {
      this.wsClient = new WebSocketClient(options.wsUrl, (cmd) => this.applyCommand(cmd));
    } else {
      this.localServer = new LocalServer(this);
      this.netClient = new NetClient(this.localServer);
    }

    // Batiments construits (hors centre-ville qui est implicite).
    this.buildings = [];

    // Unites
    this.soldiers = [];

    // Ennemis simples (camps) pour tester le combat.
    this.enemies = [];
    this.spawnEnemyCamps();

    // Ville ennemie principale pour le systeme de conquete.
    const enemyHp = this.config?.rules?.enemyCityHp ?? 250;
    this.enemyCity = {
      x: Math.floor(this.mapWidth * 0.75),
      y: Math.floor(this.mapHeight * 0.3),
      maxHp: enemyHp,
      hp: enemyHp,
      radius: 1.4,
      population: 14,
      conquered: false,
    };

    // Messages (HUD)
    this.messages = [];

    // FX / projectiles
    this.projectiles = [];
    this.particles = [];

    // Selection
    this.selectedCitizens = [];
    this.selectedSoldiers = [];
    this.selectionBox = null;
    this.formationMode = "block"; // "block" | "line"
    this.panState = { up: false, down: false, left: false, right: false };
    this.hoverTarget = null;
    this.pointerWorld = null;
    this.autoFarm = false;

    // Partition spatiale pour recherche rapide
    this.spatialCitizens = new SpatialHash(4);
    this.spatialSoldiers = new SpatialHash(4);

    // Selection actuelle de type de construction (null si aucun).
    this.currentBuildType = null;

    // Cree 10 citoyens initialement autour du centre-ville.
    this.spawnInitialCitizens(this.player);
    this.spawnInitialCitizens(this.aiPlayer);

    // Input : clic pour ordre, touches pour choix de batiment et recrutement.
    this.input = new InputSystem(this.canvas, {
      onClick: (px, py) => this.handleClick(px, py),
      onKey: (e) => this.handleKey(e),
      onDragStart: (start) => this.onDragStart(start),
      onDragUpdate: (start, current) => this.onDragUpdate(start, current),
      onDragEnd: (start, end) => this.onDragEnd(start, end),
      onWheel: (deltaY) => this.onWheel(deltaY),
      onPanInput: (dir) => this.onPanInput(dir),
      onMove: (pos) => this.onPointerMove(pos),
    });
  }

  dispose() {
    if (this.input) this.input.dispose();
  }

  // Place les citoyens autour du centre-ville (petit cercle).
  spawnInitialCitizens(player) {
    const count = player.population;
    const cx = player.cityCenter.x;
    const cy = player.cityCenter.y;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const citizen = new Citizen(x, y);
      player.citizens.push(citizen);
    }
  }

  // Cree quelques camps ennemis statiques a detruire.
  spawnEnemyCamps() {
    this.enemies.push({
      x: Math.floor(MAP_WIDTH * 0.2),
      y: Math.floor(MAP_HEIGHT * 0.2),
      maxHp: 120,
      hp: 120,
      radius: 0.8,
      type: "camp",
    });
    this.enemies.push({
      x: Math.floor(MAP_WIDTH * 0.8),
      y: Math.floor(MAP_HEIGHT * 0.8),
      maxHp: 120,
      hp: 120,
      radius: 0.8,
      type: "camp",
    });
  }

  addMessage(text, duration = 4) {
    this.messages.push({
      text,
      ttl: duration,
      created: performance.now(),
    });
  }

  // Convertit les coordonnees pixel du clic vers la grille (cases).
  screenToGrid(px, py) {
    const tileSize = this.computeTileSize();
    const view = this.getViewBounds(tileSize);
    const gx = Math.floor(view.x + px / tileSize);
    const gy = Math.floor(view.y + py / tileSize);
    return { gx, gy };
  }

  // Gestion du clavier pour choisir le type de batiment ou creer des soldats.
  handleKey(event) {
    const key = event.key.toLowerCase();
    if (key === "h") {
      this.currentBuildType = BUILD_TYPES.HOUSE;
    } else if (key === "b") {
      this.currentBuildType = BUILD_TYPES.BARRACKS;
    } else if (key === "s") {
      this.spawnSoldier();
    } else if (key === "f") {
      this.formationMode = this.formationMode === "block" ? "line" : "block";
      this.addMessage(`Formation: ${this.formationMode}`);
    }
  }

  onPanInput(dir) {
    this.panState = { ...this.panState, ...dir };
  }

  onWheel(deltaY) {
    const factor = deltaY < 0 ? 1.1 : 0.9;
    this.camera.setZoom(factor);
  }

  onPointerMove(pos) {
    const tileSize = this.computeTileSize();
    const view = this.getViewBounds(tileSize);
    const worldX = view.x + pos.x / tileSize;
    const worldY = view.y + pos.y / tileSize;
    this.pointerWorld = { x: worldX, y: worldY };
    this.hoverTarget = this.pickHover(worldX, worldY);
  }

  // Gere le clic utilisateur : construction, attaque, ou ordre normal.
  handleClick(px, py) {
    const { gx, gy } = this.screenToGrid(px, py);
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return;

    // Si un type de batiment est selectionne, on place un chantier.
    if (this.currentBuildType) {
      this.placeBuilding(this.currentBuildType, gx, gy);
      this.currentBuildType = null;
      return;
    }

    // Verifier si clic sur la ville ennemie.
    const enemyCity = this.findEnemyCityAt(gx, gy);
    if (enemyCity) {
      const targets = this.selectedSoldiers.length ? this.selectedSoldiers : this.soldiers;
      for (const soldier of targets) {
        const path = this.computePath(
          { x: soldier.x, y: soldier.y },
          { x: enemyCity.x, y: enemyCity.y },
          true
        );
        soldier.issueAttack(enemyCity, path);
      }
      return;
    }

    // Verifier si clic sur un ennemi pour ordonner l'attaque.
    const enemy = this.findEnemyAt(gx, gy);
    if (enemy) {
      const targets = this.selectedSoldiers.length ? this.selectedSoldiers : this.soldiers;
      for (const soldier of targets) {
        const path = this.computePath(
          { x: soldier.x, y: soldier.y },
          { x: enemy.x, y: enemy.y },
          true
        );
        soldier.issueAttack(enemy, path);
      }
      return;
    }

    // Sinon, comportement recolte/deplacement des citoyens.
    const tileType = this.tileMap.get(gx, gy);
    const isResource =
      tileType === TILE_TYPES.WOOD ||
      tileType === TILE_TYPES.STONE ||
      tileType === TILE_TYPES.FOOD;

    const intent = isResource ? "gather" : "move";
    const resourceType = isResource ? tileType : null;

    const citizens = this.selectedCitizens.length ? this.selectedCitizens : this.player.citizens;
    if (isResource) {
      // Recolte : on evite que tout le monde se pile exactement dessus -> petits offsets autour.
      const gatherTargets = this.computeGatherTargets({ x: gx, y: gy }, citizens.length);
      citizens.forEach((citizen, idx) => {
        const tgt = gatherTargets[idx] || { x: gx, y: gy };
        const path = this.computePath(
          { x: citizen.x, y: citizen.y },
          tgt,
          true
        );
        citizen.issueOrder(tgt, intent, resourceType, null, path);
      });
    } else {
      const targetPositions = this.computeFormationTargets({ x: gx, y: gy }, citizens.length, this.formationMode);
      citizens.forEach((citizen, idx) => {
        const tgt = targetPositions[idx] || { x: gx, y: gy };
        const path = this.computePath(
          { x: citizen.x, y: citizen.y },
          { x: tgt.x, y: tgt.y },
          true
        );
        citizen.issueOrder(tgt, intent, resourceType, null, path);
      });
    }
  }

  placeBuilding(type, gx, gy) {
    const building = new Building(type, gx, gy);
    building.owner = this.player;
    this.buildings.push(building);

    // Tous les citoyens vont construire ce batiment.
    const citizens = this.selectedCitizens.length ? this.selectedCitizens : this.player.citizens;
    const targetPositions = this.computeFormationTargets({ x: gx, y: gy }, citizens.length, this.formationMode);
    citizens.forEach((citizen, idx) => {
      const tgt = targetPositions[idx] || { x: gx, y: gy };
      const path = this.computePath(
        { x: citizen.x, y: citizen.y },
        { x: tgt.x, y: tgt.y },
        true
      );
      citizen.issueOrder(tgt, "build", null, building, path);
    });
  }

  // Placement de batiment pour un joueur specifique (utilise par l'IA)
  placeBuildingForPlayer(type, gx, gy, owner) {
    const building = new Building(type, gx, gy);
    building.owner = owner;
    this.buildings.push(building);

    const citizens = owner.citizens;
    citizens.forEach((citizen) => {
      const path = this.computePath(
        { x: citizen.x, y: citizen.y },
        { x: gx, y: gy },
        true
      );
      citizen.issueOrder({ x: gx, y: gy }, "build", null, building, path);
    });
  }

  // Trouve la ville ennemie si le clic est dessus.
  findEnemyCityAt(gx, gy) {
    if (!this.enemyCity || this.enemyCity.conquered || this.enemyCity.hp <= 0) return null;
    const dx = this.enemyCity.x - gx;
    const dy = this.enemyCity.y - gy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= this.enemyCity.radius + 0.3) {
      return this.enemyCity;
    }
    return null;
  }

  // Trouve un ennemi sous la case cliquee.
  findEnemyAt(gx, gy) {
    for (const e of this.enemies) {
      const dx = e.x - gx;
      const dy = e.y - gy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= e.radius + 0.2) {
        return e;
      }
    }
    return null;
  }

  // Ville ennemie pour un joueur (IA vise le joueur humain, joueur humain vise l'ennemiCity existante).
  enemyCityFor(player) {
    if (player === this.player) return this.enemyCity;
    return this.playerCity;
  }

  // Cree un soldat au niveau d'une caserne completee ou du centre-ville.
  spawnSoldier() {
    if (this.player.population >= this.player.populationCap) {
      this.addMessage("Population max atteinte. Construis une maison.");
      return;
    }
    const spawnPos = this.getSoldierSpawnPosition();
    const jitter = Math.random() * 0.4;
    const soldier = new Soldier(spawnPos.x + jitter, spawnPos.y + jitter, this.config?.units?.soldier);
    this.soldiers.push(soldier);
    this.player.soldiers.push(soldier);
    this.player.population += 1;
    this.selectedSoldiers = [soldier]; // auto-selection du dernier recrute pour des ordres rapides
  }

  spawnSoldierForPlayer(player) {
    if (player.population >= player.populationCap) return;
    const spawnPos = this.getSoldierSpawnPosition(player);
    const jitter = Math.random() * 0.4;
    const soldier = new Soldier(spawnPos.x + jitter, spawnPos.y + jitter, this.config?.units?.soldier);
    player.soldiers.push(soldier);
    player.population += 1;
  }

  getSoldierSpawnPosition(player = this.player) {
    const barracks = this.buildings.find(
      (b) => b.type === BUILD_TYPES.BARRACKS && b.completed && b.owner === player
    );
    if (barracks) {
      return { x: barracks.x, y: barracks.y };
    }
    return { ...player.cityCenter };
  }

  // Pathfinding : calcule un chemin A* en evitant les obstacles fixes. allowGoalBlock autorise la cible meme si occupee.
  computePath(from, to, allowGoalBlock = true) {
    return this.pathfinder.findPath(
      from,
      to,
      (x, y) => this.isWalkable(x, y, to),
      allowGoalBlock
    );
  }

  isWalkable(x, y, goal) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false;

    // City center du joueur est toujours traversable (depot).
    if (x === this.player.cityCenter.x && y === this.player.cityCenter.y) {
      return true;
    }

    // Batiments occupent leur case (meme en construction).
    for (const b of this.buildings) {
      if (Math.floor(b.x) === x && Math.floor(b.y) === y) {
        if (goal && goal.x === x && goal.y === y) return true;
        return false;
      }
    }

    // Ville ennemie bloque (sauf si c'est la cible).
    if (this.enemyCity && !this.enemyCity.conquered && this.enemyCity.hp > 0) {
      const dx = this.enemyCity.x - x;
      const dy = this.enemyCity.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= this.enemyCity.radius) {
        if (goal && goal.x === x && goal.y === y) return true;
        return false;
      }
    }

    // Camps ennemis bloquent.
    for (const e of this.enemies) {
      const dx = e.x - x;
      const dy = e.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= e.radius) {
        if (goal && goal.x === x && goal.y === y) return true;
        return false;
      }
    }

    return true;
  }

  // Drag selection handlers
  onDragStart(start) {
    this.selectionBox = { x1: start.x, y1: start.y, x2: start.x, y2: start.y };
  }

  onDragUpdate(start, current) {
    this.selectionBox = {
      x1: Math.min(start.x, current.x),
      y1: Math.min(start.y, current.y),
      x2: Math.max(start.x, current.x),
      y2: Math.max(start.y, current.y),
    };
  }

  onDragEnd(start, end) {
    this.onDragUpdate(start, end);
    this.applySelection();
    this.selectionBox = null;
  }

  applySelection() {
    if (!this.lastRenderInfo) return;
    const { tileSize, offsetX, offsetY } = this.lastRenderInfo;
    const box = this.selectionBox;
    if (!box) return;
    const inBox = (sx, sy) => sx >= box.x1 && sx <= box.x2 && sy >= box.y1 && sy <= box.y2;

    this.selectedCitizens = [];
    this.selectedSoldiers = [];

    for (const c of this.player.citizens) {
      const sx = offsetX + c.x * tileSize + tileSize / 2;
      const sy = offsetY + c.y * tileSize + tileSize / 2;
      if (inBox(sx, sy)) this.selectedCitizens.push(c);
    }
    for (const s of this.soldiers) {
      const sx = offsetX + s.x * tileSize + tileSize / 2;
      const sy = offsetY + s.y * tileSize + tileSize / 2;
      if (inBox(sx, sy)) this.selectedSoldiers.push(s);
    }
  }

  // Formation target positions for group move.
  computeFormationTargets(target, count, mode) {
    if (count === 0) return [];
    const spacing = 0.8;
    const res = [];
    if (mode === "line") {
      const offsetStart = -((count - 1) * spacing) / 2;
      for (let i = 0; i < count; i++) {
        res.push({ x: target.x + offsetStart + i * spacing, y: target.y });
      }
      return res;
    }

    // block (carré compact)
    const side = Math.ceil(Math.sqrt(count));
    const startX = target.x - ((side - 1) * spacing) / 2;
    const startY = target.y - ((side - 1) * spacing) / 2;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / side);
      const col = i % side;
      res.push({ x: startX + col * spacing, y: startY + row * spacing });
    }
    return res;
  }

  // Positionnement autour d'une ressource pour limiter l'empilement.
  computeGatherTargets(target, count) {
    if (count === 0) return [];
    const res = [];
    const ring = [0, 0.5, 1, 1.5, 2];
    let idx = 0;
    while (res.length < count) {
      const radius = ring[Math.min(Math.floor(idx / 8), ring.length - 1)];
      const angle = (idx / Math.max(1, count)) * Math.PI * 2;
      res.push({
        x: target.x + Math.cos(angle) * radius,
        y: target.y + Math.sin(angle) * radius,
      });
      idx++;
    }
    return res;
  }

  // Mise a jour de l'etat du jeu (dt en secondes)
  update(dt) {
    if (this.ended) return;
    this.elapsed += dt;
    const onDeposit = (type, amount) => {
      if (!type || !amount) return;
      this.player.resources[type] = (this.player.resources[type] || 0) + amount;
    };

    const onBuildingComplete = (building) => this.onBuildingComplete(building);

    if (this.autoFarm) {
      this.assignAutoFarm();
    }

    // Mise a jour des citoyens (deplacement, recolte, depot, construction).
    for (const citizen of this.player.citizens) {
      citizen.update(dt, {
        tileMap: this.tileMap,
        cityCenter: this.player.cityCenter,
        onDeposit,
        onBuildingComplete,
        onHarvest: (type, x, y) => this.onHarvest(type, x, y),
        computePath: (from, to) => this.computePath(from, to, true),
      });
    }
    for (const citizen of this.aiPlayer.citizens) {
      citizen.update(dt, {
        tileMap: this.tileMap,
        cityCenter: this.aiPlayer.cityCenter,
        onDeposit: (type, amount) => {
          if (!type || !amount) return;
          this.aiPlayer.resources[type] = (this.aiPlayer.resources[type] || 0) + amount;
        },
        onBuildingComplete,
        onHarvest: (type, x, y) => this.onHarvest(type, x, y),
        computePath: (from, to) => this.computePath(from, to, true),
      });
    }

    // Mise a jour des soldats (deplacement, attaque).
    for (const soldier of this.soldiers) {
      soldier.update(dt, {
        computePath: (from, to) => this.computePath(from, to, true),
        emitProjectile: (shooter) => this.spawnProjectile(shooter, soldier.target),
      });
    }
    for (const soldier of this.aiPlayer.soldiers) {
      soldier.update(dt, {
        computePath: (from, to) => this.computePath(from, to, true),
        emitProjectile: (shooter) => this.spawnProjectile(shooter, soldier.target),
      });
    }

    // Nettoyage des ennemis morts.
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // Nettoyage/decroissance des messages HUD.
    this.messages = this.messages
      .map((m) => ({ ...m, ttl: m.ttl - dt }))
      .filter((m) => m.ttl > 0);

    // Mise à jour partition spatiale (uniquement pour joueurs)
    this.rebuildSpatial();

    // Projectiles
    const hitFx = (proj) => this.spawnHitParticles(proj.target?.x ?? proj.x, proj.target?.y ?? proj.y);
    this.projectiles = this.projectiles.filter((p) => {
      p.update(dt, hitFx);
      return p.alive;
    });

    // Particules
    this.particles = this.particles
      .map((p) => ({ ...p, ttl: p.ttl - dt, x: p.x + p.vx * dt, y: p.y + p.vy * dt }))
      .filter((p) => p.ttl > 0);

    // Ville ennemie detruite -> conquete.
    if (this.enemyCity && !this.enemyCity.conquered && this.enemyCity.hp <= 0) {
      this.onEnemyCityDestroyed(this.enemyCity);
    }
    if (this.playerCity && this.playerCity.hp <= 0) {
      this.endGame("lose");
      this.ended = true;
    }

    // Camera pan (clavier)
    this.camera.update(dt, this.panState);

    // IA
    if (this.aiController) {
      this.aiController.update(dt);
    }

    // Tick serveur local (si utilise)
    if (this.localServer) {
      this.localServer.tick(dt);
    }
  }

  // Effets a l'achevement d'un batiment.
  onBuildingComplete(building) {
    if (!building.completed) return;
    const owner = building.owner || this.player;
    if (building.type === BUILD_TYPES.HOUSE) {
      owner.populationCap += 5;
      if (owner === this.player) this.addMessage("Maison terminee : +5 population max.");
    }
    if (building.type === BUILD_TYPES.BARRACKS && owner === this.player) {
      this.addMessage("Caserne operationnelle : touche S pour recruter.");
    }
  }

  // Conquete : gagne 50% de la population ennemie et cree des citoyens proches du centre.
  onEnemyCityDestroyed(city) {
    city.conquered = true;
    const gained = Math.floor(city.population * 0.5);
    if (gained <= 0) return;
    this.spawnExtraCitizens(gained);
    this.addMessage(`Ville ennemie conquise : +${gained} citoyens absorbes.`);
    this.endGame("win");
    this.ended = true;
  }

  onHarvest(type, x, y) {
    if (!type) return;
    // Consomme une partie de la ressource et met a jour la tuile si vide.
    const taken = this.tileMap.consume(x, y, 10);
    if (taken <= 0) return;
  }

  spawnProjectile(shooter, target) {
    if (!target || target.hp <= 0) return;
    const proj = new Projectile(shooter.x, shooter.y, target, shooter.damagePerShot);
    this.projectiles.push(proj);
  }

  spawnHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttl: 0.4 + Math.random() * 0.3,
        size: 0.1 + Math.random() * 0.15,
        color: "#f97316",
      });
    }
  }

  findBuildingAt(x, y) {
    return this.buildings.find(
      (b) => Math.floor(b.x) === Math.floor(x) && Math.floor(b.y) === Math.floor(y)
    );
  }

  endGame(state) {
    if (this.onGameEnd) {
      this.onGameEnd(this.collectStats(state));
    }
    this.ended = true;
  }

  collectStats(state) {
    return {
      state,
      time: this.elapsed,
      citizens: this.player.citizens.length,
      soldiers: this.soldiers.length,
      buildings: this.buildings.filter((b) => b.owner === this.player && b.completed).length,
    };
  }

  // Application des commandes reseau
  applyCommand(cmd) {
    if (!cmd || !cmd.type) return;
    const player = this.getPlayerById(cmd.playerId || 1);
    if (!player) return;
    switch (cmd.type) {
      case CommandTypes.MOVE: {
        const citizens = player === this.player ? this.player.citizens : player.citizens;
        const targets = this.computeFormationTargets(cmd.target, citizens.length, cmd.formation || "block");
        citizens.forEach((c, idx) => {
          const tgt = targets[idx] || cmd.target;
          const path = this.computePath({ x: c.x, y: c.y }, tgt, true);
          c.issueOrder(tgt, "move", null, null, path);
        });
        break;
      }
      case CommandTypes.BUILD: {
        if (player === this.player) {
          this.placeBuilding(cmd.buildType, cmd.x, cmd.y);
        } else {
          this.placeBuildingForPlayer(cmd.buildType, cmd.x, cmd.y, player);
        }
        break;
      }
      case CommandTypes.ATTACK: {
        const soldiers = player.soldiers;
        const tgt = cmd.target;
        const targetObj = { x: tgt.x, y: tgt.y, hp: 999, maxHp: 999, radius: 1 };
        soldiers.forEach((s) => {
          const path = this.computePath({ x: s.x, y: s.y }, tgt, true);
          s.issueAttack(targetObj, path);
        });
        break;
      }
      case CommandTypes.TRAIN: {
        this.spawnSoldierForPlayer(player);
        break;
      }
      default:
        break;
    }
  }

  getPlayerById(id) {
    if (id === this.player.id) return this.player;
    if (id === this.aiPlayer.id) return this.aiPlayer;
    return null;
  }

  // Snapshot minimal pour reseau
  collectNetworkSnapshot(tick) {
    return {
      tick,
      time: this.elapsed,
      players: [
        this.buildPlayerSnapshot(this.player),
        this.buildPlayerSnapshot(this.aiPlayer),
      ],
    };
  }

  buildPlayerSnapshot(player) {
    return {
      id: player.id,
      resources: { ...player.resources },
      population: player.population,
      populationCap: player.populationCap,
      citizens: player.citizens.map((c) => ({ x: c.x, y: c.y, state: c.state })),
      soldiers: player.soldiers.map((s) => ({ x: s.x, y: s.y, hp: s.hp, state: s.state })),
      buildings: this.buildings
        .filter((b) => b.owner === player)
        .map((b) => ({ x: b.x, y: b.y, type: b.type, completed: b.completed })),
    };
  }

  spawnExtraCitizens(count) {
    const cx = this.player.cityCenter.x;
    const cy = this.player.cityCenter.y;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const citizen = new Citizen(x, y);
      this.player.citizens.push(citizen);
    }
    this.player.population += count;
  }

  // Calcule la taille d'une case pour faire tenir la carte dans le canvas.
  computeTileSize() {
    const base = Math.min(
      Math.floor(this.canvas.width / 30),
      Math.floor(this.canvas.height / 20)
    );
    return Math.max(2, Math.floor(base * this.camera.zoom));
  }

  // Vue actuelle (en cases) selon la camera et le canvas.
  getViewBounds(tileSize) {
    const w = this.canvas.width / tileSize;
    const h = this.canvas.height / tileSize;
    const x = this.camera.x - w / 2;
    const y = this.camera.y - h / 2;
    return {
      x: Math.max(0, Math.min(this.tileMap.width - w, x)),
      y: Math.max(0, Math.min(this.tileMap.height - h, y)),
      w,
      h,
    };
  }

  // Trouve une cible sous le curseur pour le survol.
  pickHover(wx, wy) {
    const threshold = 0.6;
    // Soldats (partition)
    for (const entry of this.spatialSoldiers.query(wx, wy, threshold)) {
      const s = entry.entity;
      if (Math.hypot(s.x - wx, s.y - wy) <= threshold) return { type: "soldier", ref: s, x: s.x, y: s.y };
    }
    // Citoyens (partition)
    for (const entry of this.spatialCitizens.query(wx, wy, threshold)) {
      const c = entry.entity;
      if (Math.hypot(c.x - wx, c.y - wy) <= threshold) return { type: "citizen", ref: c, x: c.x, y: c.y };
    }
    // Batiments
    for (const b of this.buildings) {
      if (Math.abs(b.x - wx) <= 0.6 && Math.abs(b.y - wy) <= 0.6) return { type: "building", ref: b, x: b.x, y: b.y };
    }
    // Ville ennemie
    if (this.enemyCity && !this.enemyCity.conquered && this.enemyCity.hp > 0) {
      const dx = this.enemyCity.x - wx;
      const dy = this.enemyCity.y - wy;
      if (Math.sqrt(dx * dx + dy * dy) <= this.enemyCity.radius + 0.3) {
        return { type: "city", ref: this.enemyCity, x: this.enemyCity.x, y: this.enemyCity.y };
      }
    }
    // Camps ennemis
    for (const e of this.enemies) {
      const dx = e.x - wx;
      const dy = e.y - wy;
      if (Math.sqrt(dx * dx + dy * dy) <= e.radius + 0.3) return { type: "enemy", ref: e, x: e.x, y: e.y, radius: e.radius };
    }
    return null;
  }

  // Rendu sur le canvas
  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const tileSize = this.computeTileSize();
    const view = this.getViewBounds(tileSize);
    const offsetX = -view.x * tileSize;
    const offsetY = -view.y * tileSize;

    this.tileMap.render(ctx, tileSize, offsetX, offsetY, TILE_COLORS, view);
    this.lastRenderInfo = { tileSize, offsetX, offsetY, view };
    this.renderBuildings(ctx, tileSize, offsetX, offsetY, view);
    this.renderCityCenter(ctx, tileSize, offsetX, offsetY, view);
    this.renderEnemyCity(ctx, tileSize, offsetX, offsetY, view);
    this.renderEnemies(ctx, tileSize, offsetX, offsetY, view);
    this.renderCitizens(ctx, tileSize, offsetX, offsetY, view);
    this.renderSoldiers(ctx, tileSize, offsetX, offsetY, view);
    this.renderProjectiles(ctx, tileSize, offsetX, offsetY);
    this.renderParticles(ctx, tileSize, offsetX, offsetY);
    this.renderHover(ctx, tileSize, offsetX, offsetY);
    this.renderSelectionBox(ctx);
  }

  // Affiche le centre-ville du joueur.
  renderCityCenter(ctx, tileSize, offsetX, offsetY) {
    const { x, y } = this.player.cityCenter;
    const px = offsetX + x * tileSize;
    const py = offsetY + y * tileSize;

    ctx.fillStyle = this.player.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, tileSize * 0.1);

    // On dessine un carre qui occupe une case (simple repere visuel).
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.strokeRect(px, py, tileSize, tileSize);

    // Barre de vie pour base joueur
    const ratio = this.playerCity ? this.playerCity.hp / this.playerCity.maxHp : 1;
    const barWidth = tileSize;
    const barHeight = Math.max(3, tileSize * 0.2);
    ctx.fillStyle = "#111827";
    ctx.fillRect(px, py - barHeight - 2, barWidth, barHeight);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(px, py - barHeight - 2, barWidth * ratio, barHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py - barHeight - 2, barWidth, barHeight);
  }

  // Affiche la ville ennemie avec barre de vie.
  renderEnemyCity(ctx, tileSize, offsetX, offsetY) {
    if (!this.enemyCity || this.enemyCity.conquered || this.enemyCity.hp <= 0) return;
    const c = this.enemyCity;
    const px = offsetX + c.x * tileSize;
    const py = offsetY + c.y * tileSize;
    const size = Math.max(tileSize * c.radius * 2, tileSize * 1.5);

    ctx.fillStyle = "#7f1d1d";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, tileSize * 0.1);
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
    ctx.strokeRect(px - size / 2, py - size / 2, size, size);

    // Barre de vie.
    const ratio = c.hp / c.maxHp;
    const barWidth = size;
    const barHeight = Math.max(3, tileSize * 0.2);
    ctx.fillStyle = "#111827";
    ctx.fillRect(px - barWidth / 2, py - size / 2 - barHeight - 4, barWidth, barHeight);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(px - barWidth / 2, py - size / 2 - barHeight - 4, barWidth * ratio, barHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(px - barWidth / 2, py - size / 2 - barHeight - 4, barWidth, barHeight);
  }

  // Affiche les batiments construits/chantier.
  renderBuildings(ctx, tileSize, offsetX, offsetY) {
    for (const b of this.buildings) {
      const px = offsetX + b.x * tileSize;
      const py = offsetY + b.y * tileSize;
      const color = b.color();

      if (b.completed) {
        ctx.fillStyle = color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, tileSize * 0.1);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.strokeRect(px, py, tileSize, tileSize);
      } else {
        // Chantier : fond gris et barre de progression.
        ctx.fillStyle = "#4b5563";
        ctx.fillRect(px, py, tileSize, tileSize);

        const ratio = b.progressRatio();
        ctx.fillStyle = color;
        ctx.fillRect(px, py + tileSize * 0.8, tileSize * ratio, tileSize * 0.2);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, tileSize * 0.05);
        ctx.strokeRect(px, py, tileSize, tileSize);
      }
    }
  }

  // Affiche les ennemis (camps) avec barre de vie.
  renderEnemies(ctx, tileSize, offsetX, offsetY) {
    for (const e of this.enemies) {
      const px = offsetX + e.x * tileSize;
      const py = offsetY + e.y * tileSize;
      const r = Math.max(3, tileSize * e.radius);

      ctx.beginPath();
      ctx.fillStyle = "#8b1e3f";
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      // Barre de vie.
      const ratio = e.hp / e.maxHp;
      const barWidth = r * 2;
      const barHeight = Math.max(2, tileSize * 0.15);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(px - r, py - r - barHeight - 2, barWidth, barHeight);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(px - r, py - r - barHeight - 2, barWidth * ratio, barHeight);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1;
      ctx.strokeRect(px - r, py - r - barHeight - 2, barWidth, barHeight);
    }
  }

  // Affiche les citoyens sous forme de petits cercles (bord si ils transportent).
  renderCitizens(ctx, tileSize, offsetX, offsetY) {
    for (const citizen of this.player.citizens) {
      const px = offsetX + citizen.x * tileSize + tileSize / 2;
      const py = offsetY + citizen.y * tileSize + tileSize / 2;
      const r = Math.max(2, tileSize * 0.25);

      ctx.beginPath();
      ctx.fillStyle = "#f1faee";
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      if (citizen.carrying) {
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = Math.max(1, r * 0.4);
        ctx.beginPath();
        ctx.arc(px, py, r + 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Highlight selection
      if (this.selectedCitizens.includes(citizen)) {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = Math.max(1, r * 0.35);
        ctx.beginPath();
        ctx.arc(px, py, r + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Affiche les soldats (couleur bleue) et leur barre de vie simple.
  renderSoldiers(ctx, tileSize, offsetX, offsetY) {
    for (const soldier of [...this.soldiers, ...this.aiPlayer.soldiers]) {
      const px = offsetX + soldier.x * tileSize + tileSize / 2;
      const py = offsetY + soldier.y * tileSize + tileSize / 2;
      const r = Math.max(3, tileSize * 0.28);

      ctx.beginPath();
      ctx.fillStyle = "#3b82f6";
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      // Barre de vie au-dessus.
      const ratio = soldier.hp / soldier.maxHp;
      const barWidth = r * 2;
      const barHeight = Math.max(2, tileSize * 0.12);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(px - r, py - r - barHeight - 2, barWidth, barHeight);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(px - r, py - r - barHeight - 2, barWidth * ratio, barHeight);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1;
      ctx.strokeRect(px - r, py - r - barHeight - 2, barWidth, barHeight);

      // Highlight selection
      if (this.selectedSoldiers.includes(soldier)) {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = Math.max(1, r * 0.4);
        ctx.beginPath();
        ctx.arc(px, py, r + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  renderProjectiles(ctx, tileSize, offsetX, offsetY) {
    ctx.save();
    ctx.fillStyle = "#facc15";
    for (const p of this.projectiles) {
      const px = offsetX + p.x * tileSize;
      const py = offsetY + p.y * tileSize;
      const r = Math.max(2, tileSize * 0.12);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderParticles(ctx, tileSize, offsetX, offsetY) {
    ctx.save();
    for (const part of this.particles) {
      const px = offsetX + part.x * tileSize;
      const py = offsetY + part.y * tileSize;
      const r = Math.max(1, tileSize * part.size);
      ctx.fillStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.ttl * 1.5);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderSelectionBox(ctx) {
    if (!this.selectionBox) return;
    const { x1, y1, x2, y2 } = this.selectionBox;
    ctx.save();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillStyle = "rgba(34, 211, 238, 0.12)";
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.restore();
  }

  renderHover(ctx, tileSize, offsetX, offsetY) {
    if (!this.hoverTarget) return;
    const h = this.hoverTarget;
    let x = 0;
    let y = 0;
    let r = Math.max(3, tileSize * 0.35);
    if (h.type === "citizen" || h.type === "soldier" || h.type === "building" || h.type === "city" || h.type === "enemy") {
      x = offsetX + h.x * tileSize + (h.type === "building" || h.type === "city" ? tileSize / 2 : tileSize / 2);
      y = offsetY + h.y * tileSize + (h.type === "building" || h.type === "city" ? tileSize / 2 : tileSize / 2);
      if (h.type === "building" || h.type === "city") {
        r = Math.max(tileSize * 0.6, 6);
      } else if (h.type === "enemy") {
        r = Math.max(tileSize * h.radius, 6);
      }
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(1, tileSize * 0.08);
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  toggleAutoFarm() {
    this.autoFarm = !this.autoFarm;
    this.addMessage(this.autoFarm ? "AutoFarm ON" : "AutoFarm OFF");
    return this.autoFarm;
  }

  assignAutoFarm() {
    for (const c of this.player.citizens) {
      if (c.state === "idle") {
        const best = this.findNearestResourcePoint(c.x, c.y);
        if (best) {
          const tgt = { x: best.x, y: best.y };
          const path = this.computePath({ x: c.x, y: c.y }, tgt, true);
          c.issueOrder(tgt, "gather", best.type, null, path);
        }
      }
    }
  }

  findNearestResourcePoint(x, y) {
    const types = [TILE_TYPES.WOOD, TILE_TYPES.STONE, TILE_TYPES.FOOD];
    let best = null;
    let bestDist = Infinity;
    for (let iy = 0; iy < this.tileMap.height; iy++) {
      for (let ix = 0; ix < this.tileMap.width; ix++) {
        const type = this.tileMap.get(ix, iy);
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

  rebuildSpatial() {
    this.spatialCitizens.clear();
    this.spatialSoldiers.clear();
    this.player.citizens.forEach((c) => this.spatialCitizens.insert(c, c.x, c.y));
    this.soldiers.forEach((s) => this.spatialSoldiers.insert(s, s.x, s.y));
    this.aiPlayer.citizens.forEach((c) => this.spatialCitizens.insert(c, c.x, c.y));
    this.aiPlayer.soldiers.forEach((s) => this.spatialSoldiers.insert(s, s.x, s.y));
  }
}
