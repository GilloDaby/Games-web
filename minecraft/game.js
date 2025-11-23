(() => {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  const TILE_SIZE = 32;
  const WORLD_WIDTH = 200;
  const WORLD_HEIGHT = 50;

  const TILE = {
    AIR: 0,
    GRASS_PLAINS: 1,
    GRASS_FOREST: 2,
    DIRT: 3,
    STONE: 4,
    SAND: 5,
    SNOW: 6,
    LOG: 7,
    LEAF: 8,
    CACTUS: 9,
    TORCH: 10,
  };

  const TILE_KEY = {
    [TILE.GRASS_PLAINS]: "grass",
    [TILE.GRASS_FOREST]: "grass",
    [TILE.DIRT]: "dirt",
    [TILE.STONE]: "stone",
    [TILE.SAND]: "sand",
    [TILE.SNOW]: "snow",
    [TILE.LOG]: "log",
    [TILE.LEAF]: "leaf",
    [TILE.CACTUS]: "cactus",
    [TILE.TORCH]: "torch",
  };

  function isSolidTile(tile) {
    return tile !== TILE.AIR && tile !== TILE.TORCH;
  }

  const canvas = document.getElementById("game-canvas");

  const app = new PIXI.Application({
    view: canvas,
    resizeTo: window,
    background: "#1b1f2f",
    antialias: false,
  });

  const keys = new Set();
  const worldContainer = new PIXI.Container();
  const mobContainer = new PIXI.Container();
  const camera = { x: 0, y: 0, extraX: 0 };
  const world = Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => TILE.AIR)
  );
  const worldSprites = Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => null)
  );
  const torchPositions = new Set();
  const inventoryManager = new InventoryManager(9);
  let selectedTile = TILE.GRASS_PLAINS;
  let tileTextures = null;
  let ui = null;
  let player = null;
  const mobs = [];
  let spawnTimer = 0;
  let biomeMapGlobal = null;
  let heightMapGlobal = null;
  let inventoryUI = null;
  let craftingUI = null;
  let saveSystem = null;
  let autoSaveTimer = 0;

  app.stage.addChild(worldContainer);
  app.stage.addChild(mobContainer);

  init().catch((err) => console.error("Erreur d'initialisation", err));

  function createWorld(biomeMap, heightMap) {
    const grid = Array.from({ length: WORLD_HEIGHT }, () =>
      Array.from({ length: WORLD_WIDTH }, () => TILE.AIR)
    );

    for (let x = 0; x < WORLD_WIDTH; x++) {
      const surfaceY = heightMap[x];
      const biome = biomeMap[x];
      const topTile =
        biome === BIOMES.DESERT
          ? TILE.SAND
          : biome === BIOMES.SNOW
          ? TILE.SNOW
          : biome === BIOMES.FOREST
          ? TILE.GRASS_FOREST
          : TILE.GRASS_PLAINS;

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        if (y < surfaceY) {
          grid[y][x] = TILE.AIR;
        } else if (y === surfaceY) {
          grid[y][x] = topTile;
        } else if (y > surfaceY && y <= surfaceY + 6) {
          grid[y][x] = biome === BIOMES.DESERT ? TILE.SAND : TILE.DIRT;
        } else if (y > surfaceY + 6) {
          grid[y][x] = TILE.STONE;
        }
      }
    }

    addStructures(grid, biomeMap, heightMap);
    return grid;
  }

  function createTileset() {
    const width = TILE_SIZE * 10;
    const height = TILE_SIZE;
    const atlas = document.createElement("canvas");
    atlas.width = width;
    atlas.height = height;
    const ctx = atlas.getContext("2d");

    // Grass plains
    drawGrass(ctx, 0, "#6faa3d", "#5c8e33");
    // Grass forest (darker)
    drawGrass(ctx, TILE_SIZE, "#4f8b2a", "#3f6f22");

    // Dirt
    const dirtX = TILE_SIZE * 2;
    drawDirt(ctx, dirtX, "#8a5a2d", "#7b5129");

    // Stone
    const stoneX = TILE_SIZE * 3;
    drawStone(ctx, stoneX, "#777c86", "#676c75");

    // Sand
    const sandX = TILE_SIZE * 4;
    drawSand(ctx, sandX, "#d5c17a", "#c4b06b");

    // Snow
    const snowX = TILE_SIZE * 5;
    drawSnow(ctx, snowX);

    // Log
    const logX = TILE_SIZE * 6;
    drawLog(ctx, logX);

    // Leaf
    const leafX = TILE_SIZE * 7;
    drawLeaf(ctx, leafX);

    // Cactus
    const cactusX = TILE_SIZE * 8;
    drawCactus(ctx, cactusX);

    // Torch
    const torchX = TILE_SIZE * 9;
    drawTorch(ctx, torchX);

    return atlas.toDataURL("image/png");
  }

  async function loadTileTextures() {
    const url = createTileset();
    const baseTexture = await PIXI.Assets.load(url);
    const src = baseTexture.baseTexture ?? baseTexture;
    return {
      [TILE.GRASS_PLAINS]: new PIXI.Texture(src, new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.GRASS_FOREST]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.DIRT]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.STONE]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.SAND]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 4, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.SNOW]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 5, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.LOG]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 6, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.LEAF]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 7, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.CACTUS]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 8, 0, TILE_SIZE, TILE_SIZE)),
      [TILE.TORCH]: new PIXI.Texture(src, new PIXI.Rectangle(TILE_SIZE * 9, 0, TILE_SIZE, TILE_SIZE)),
    };
  }

  function drawGrass(ctx, offsetX, topColor, midColor) {
    ctx.fillStyle = topColor;
    ctx.fillRect(offsetX, 0, TILE_SIZE, 10);
    ctx.fillStyle = midColor;
    for (let x = 0; x < TILE_SIZE; x += 4) ctx.fillRect(offsetX + x, 6, 2, 4);
    ctx.fillStyle = "#8a5a2d";
    ctx.fillRect(offsetX, 10, TILE_SIZE, TILE_SIZE - 10);
  }

  function drawDirt(ctx, offsetX, base, accent) {
    ctx.fillStyle = base;
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = accent;
    for (let y = 4; y < TILE_SIZE; y += 6) {
      for (let x = offsetX + (y % 8); x < offsetX + TILE_SIZE; x += 8) {
        ctx.fillRect(x, y, 3, 3);
      }
    }
  }

  function drawStone(ctx, offsetX, base, accent) {
    ctx.fillStyle = base;
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = accent;
    for (let y = 3; y < TILE_SIZE; y += 6) {
      for (let x = offsetX + (y % 10); x < offsetX + TILE_SIZE; x += 7) {
        ctx.fillRect(x, y, 4, 3);
      }
    }
  }

  function drawSand(ctx, offsetX, base, accent) {
    ctx.fillStyle = base;
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = accent;
    for (let x = offsetX; x < offsetX + TILE_SIZE; x += 6) {
      ctx.fillRect(x, TILE_SIZE - 8, 3, 4);
    }
  }

  function drawSnow(ctx, offsetX) {
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#d8dce6";
    ctx.fillRect(offsetX, TILE_SIZE - 6, TILE_SIZE, 4);
  }

  function drawLog(ctx, offsetX) {
    ctx.fillStyle = "#5b3a1d";
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#724822";
    ctx.fillRect(offsetX + 4, 0, 2, TILE_SIZE);
    ctx.fillRect(offsetX + 10, 0, 2, TILE_SIZE);
  }

  function drawLeaf(ctx, offsetX) {
    ctx.fillStyle = "#4d8a3b";
    ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#3f7331";
    for (let x = offsetX + 4; x < offsetX + TILE_SIZE; x += 6) {
      ctx.fillRect(x, 4, 2, 8);
    }
  }

  function drawCactus(ctx, offsetX) {
    ctx.fillStyle = "#1f8a5c";
    ctx.fillRect(offsetX + 10, 4, 12, TILE_SIZE - 4);
    ctx.fillRect(offsetX + 4, 14, 6, 10);
    ctx.fillRect(offsetX + 22, 12, 6, 12);
    ctx.fillStyle = "#0f5c3a";
    for (let y = 6; y < TILE_SIZE; y += 6) {
      ctx.fillRect(offsetX + 12, y, 2, 2);
      ctx.fillRect(offsetX + 18, y + 2, 2, 2);
    }
  }

  function drawTorch(ctx, offsetX) {
    ctx.fillStyle = "#2c1b0d";
    ctx.fillRect(offsetX + TILE_SIZE / 2 - 2, TILE_SIZE / 2, 4, TILE_SIZE / 2);
    const flameY = TILE_SIZE / 2 - 6;
    ctx.fillStyle = "#f9d976";
    ctx.fillRect(offsetX + TILE_SIZE / 2 - 4, flameY, 8, 6);
    ctx.fillStyle = "#f07c29";
    ctx.fillRect(offsetX + TILE_SIZE / 2 - 3, flameY + 2, 6, 4);
  }

  function addStructures(grid, biomeMap, heightMap) {
    for (let x = 2; x < WORLD_WIDTH - 2; x++) {
      const biome = biomeMap[x];
      const surface = heightMap[x];
      if (biome === BIOMES.FOREST && Math.random() < 0.08) {
        placeTree(grid, x, surface);
      } else if (biome === BIOMES.DESERT && Math.random() < 0.06) {
        placeCactus(grid, x, surface);
      }
    }
  }

  function placeTree(grid, x, surface) {
    const height = 3 + Math.floor(Math.random() * 3);
    if (surface + 2 >= WORLD_HEIGHT || surface - height - 2 < 0) return;
    for (let i = 1; i <= height; i++) {
      grid[surface - i][x] = TILE.LOG;
    }
    const leafY = surface - height;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const lx = x + dx;
        const ly = leafY + dy;
        if (lx < 0 || lx >= WORLD_WIDTH || ly < 0) continue;
        if (Math.abs(dx) === 2 && Math.abs(dy) === 1) continue;
        grid[ly][lx] = TILE.LEAF;
      }
    }
    if (leafY - 1 >= 0) grid[leafY - 1][x] = TILE.LEAF;
  }

  function placeCactus(grid, x, surface) {
    const height = 2 + Math.floor(Math.random() * 3);
    if (surface + 1 >= WORLD_HEIGHT || surface - height < 0) return;
    for (let i = 1; i <= height; i++) {
      grid[surface - i][x] = TILE.CACTUS;
    }
  }

  async function init() {
    tileTextures = await loadTileTextures();
    biomeMapGlobal = generateBiomeMap(WORLD_WIDTH);
    heightMapGlobal = generateHeightMap(WORLD_WIDTH, biomeMapGlobal, 20, 5);
    const worldGrid = createWorld(biomeMapGlobal, heightMapGlobal);
    // replace world reference
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        world[y][x] = worldGrid[y][x];
      }
    }
    drawWorld(tileTextures);

    player = new Player({
      size: TILE_SIZE,
      x: TILE_SIZE * 5,
      y: TILE_SIZE * 5,
      color: 0x3a8ee6,
    });
    player.maxHealth = 100;
    player.health = 100;

    worldContainer.addChild(player.sprite);

    inventoryManager.addItem("dirt", 20);
    inventoryManager.addItem("stone", 12);
    inventoryManager.addItem("log", 8);
    inventoryManager.addItem("torch", 6);

    ui = createHotbarUI(app, tileTextures, inventoryManager, () => selectedTile);
    ui.updateInventory((key) => inventoryManager.getCount(key));
    ui.setSelection(selectedTile);
    ui.setHealth(player.health, player.maxHealth);

    inventoryUI = createInventoryUI(app, inventoryManager);
    app.stage.addChild(inventoryUI.container);
    craftingUI = createCraftingUI(app, inventoryManager);
    app.stage.addChild(craftingUI.container);
    craftingUI.container.visible = false;

    saveSystem = createSaveSystem(app, {
      onSave: () => buildSaveState(),
      onLoad: (state) => applySaveState(state),
    });

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));
    window.addEventListener("resize", () => {
      updateCamera(player);
      ui.onResize();
      inventoryUI.onResize();
      craftingUI.onResize();
      if (saveSystem) saveSystem.onResize();
    });

    app.view.addEventListener("pointerdown", handlePointer);
    app.view.addEventListener("contextmenu", (e) => e.preventDefault());

    app.ticker.add((delta) => {
      const dt = delta / 60;
      player.update(dt, world, TILE_SIZE, keys);
      updateBiomeLabel(player.x, biomeMapGlobal);
      updateMobs(delta, dt);
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnMobsAroundPlayer(player);
        spawnTimer = 2.5;
      }
      autoSaveTimer += dt;
      if (autoSaveTimer >= 30 && saveSystem) {
        saveSystem.save(false);
        autoSaveTimer = 0;
        saveSystem.flash("Game Saved!");
      }
      if (saveSystem) saveSystem.update(dt);
      updateCamera(player);
      applyCamera();
      if (ui) ui.tick(delta);
      if (inventoryUI) inventoryUI.refresh();
      if (craftingUI && craftingUI.container.visible) craftingUI.refresh();
    });
  }

  function drawWorld(textures) {
    worldContainer.removeChildren();
    torchPositions.clear();
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const tile = world[y][x];
        worldSprites[y][x] = null;
        if (tile === TILE.AIR) continue;
        const sprite = new PIXI.Sprite(textures[tile]);
        sprite.x = x * TILE_SIZE;
        sprite.y = y * TILE_SIZE;
        worldContainer.addChild(sprite);
        worldSprites[y][x] = sprite;
        if (tile === TILE.TORCH) torchPositions.add(`${x},${y}`);
      }
    }
    // Ensure player stays above blocks.
    if (player && !worldContainer.children.includes(player.sprite)) {
      worldContainer.addChild(player.sprite);
    }
  }

  function handleKey(event, isDown) {
    const key = event.key.toLowerCase();
    const handled = [
      "arrowleft",
      "arrowright",
      "a",
      "d",
      " ",
      "1",
      "2",
      "3",
      "4",
      "c",
    ].includes(key);
    if (handled) event.preventDefault();
    if (isDown) keys.add(key);
    else keys.delete(key);

    if (isDown) {
      if (key === "arrowleft") camera.extraX += 10;
      if (key === "arrowright") camera.extraX -= 10;
      if (key === "1") selectTile(TILE.GRASS_PLAINS);
      if (key === "2") selectTile(TILE.DIRT);
      if (key === "3") selectTile(TILE.STONE);
      if (key === "4") selectTile(TILE.TORCH);
      if (key === "c" && craftingUI) craftingUI.container.visible = !craftingUI.container.visible;
    }
  }

  function updateCamera(player) {
    const viewportWidth = app.renderer.width;
    const worldWidthPx = WORLD_WIDTH * TILE_SIZE;
    const desired = player.x - viewportWidth / 2 + camera.extraX;
    const maxX = Math.max(0, worldWidthPx - viewportWidth);
    camera.x = clamp(desired, 0, maxX);
    worldContainer.position.set(-camera.x, -camera.y);
  }

  function applyCamera() {
    worldContainer.position.x = -camera.x;
    worldContainer.position.y = -camera.y;
    mobContainer.position.x = -camera.x;
    mobContainer.position.y = -camera.y;
  }

  function handlePointer(event) {
    if (!tileTextures) return;
    const { worldX, worldY } = screenToWorld(event);
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    if (!inWorld(tileX, tileY)) return;

    if (event.button === 2) {
      placeTile(tileX, tileY, selectedTile);
    } else if (event.button === 0) {
      breakTile(tileX, tileY);
    }
  }

  function breakTile(x, y) {
    const tile = world[y][x];
    if (tile === TILE.AIR) return;
    if (tile === TILE.TORCH) torchPositions.delete(`${x},${y}`);
    const key = TILE_KEY[tile];
    setTile(x, y, TILE.AIR);
    if (key) {
      inventoryManager.addItem(key, 1);
      if (ui) ui.updateInventory((k) => inventoryManager.getCount(k));
    }
  }

  function placeTile(x, y, tile) {
    if (tile === TILE.AIR) return;
    const key = TILE_KEY[tile];
    if (!key || inventoryManager.getCount(key) <= 0) return;
    if (world[y][x] !== TILE.AIR) return;
    if (playerIntersectsTile(x, y)) return;

    if (!inventoryManager.removeItem(key, 1)) return;
    setTile(x, y, tile);
    if (ui) ui.updateInventory((k) => inventoryManager.getCount(k));
    if (tile === TILE.TORCH) torchPositions.add(`${x},${y}`);
  }

  function setTile(x, y, tile) {
    // remove existing sprite
    const existing = worldSprites[y][x];
    if (existing) {
      worldContainer.removeChild(existing);
      existing.destroy();
      worldSprites[y][x] = null;
    }

    world[y][x] = tile;
    if (tile === TILE.AIR) return;

    const sprite = new PIXI.Sprite(tileTextures[tile]);
    sprite.x = x * TILE_SIZE;
    sprite.y = y * TILE_SIZE;
    worldSprites[y][x] = sprite;
    worldContainer.addChild(sprite);
    ensurePlayerOnTop();
  }

  function ensurePlayerOnTop() {
    if (!player) return;
    const topIndex = worldContainer.children.length - 1;
    worldContainer.setChildIndex(player.sprite, topIndex);
  }

  function playerIntersectsTile(tileX, tileY) {
    if (!player) return false;
    const tileRect = {
      left: tileX * TILE_SIZE,
      right: tileX * TILE_SIZE + TILE_SIZE,
      top: tileY * TILE_SIZE,
      bottom: tileY * TILE_SIZE + TILE_SIZE,
    };
    const playerRect = {
      left: player.x,
      right: player.x + player.size,
      top: player.y,
      bottom: player.y + player.size,
    };
    return !(
      playerRect.right <= tileRect.left ||
      playerRect.left >= tileRect.right ||
      playerRect.bottom <= tileRect.top ||
      playerRect.top >= tileRect.bottom
    );
  }

  function screenToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    return {
      worldX: screenX + camera.x,
      worldY: screenY + camera.y,
    };
  }

  function selectTile(tile) {
    selectedTile = tile;
    ui.setSelection(tile);
  }

  function updateBiomeLabel(playerX, biomeMap) {
    if (!ui) return;
    const col = Math.floor(playerX / TILE_SIZE);
    const biome = biomeMap[Math.max(0, Math.min(WORLD_WIDTH - 1, col))];
    ui.setBiome(biome);
  }

  function inWorld(x, y) {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateMobs(delta, dt) {
    for (let i = mobs.length - 1; i >= 0; i--) {
      const mob = mobs[i];
      if (mob.dead || mob.y > WORLD_HEIGHT * TILE_SIZE + 200) {
        dropLoot(mob);
        mobContainer.removeChild(mob.sprite);
        mobs.splice(i, 1);
        continue;
      }
      if (mob instanceof Zombie) {
        mob.updateAI(dt, world, TILE_SIZE, player);
        if (mob.tryAttack(player)) {
          applyPlayerDamage(10);
        }
      } else if (mob instanceof Cow) {
        mob.updateAI(dt, world, TILE_SIZE);
      }
    }
    if (ui) ui.setHealth(player.health, player.maxHealth);
  }

  function spawnMobsAroundPlayer(player) {
    const playerCol = Math.floor(player.x / TILE_SIZE);
    spawnMobNear(playerCol, "zombie", (x) => isDarkColumn(x));
    spawnMobNear(playerCol, "cow", (x) => !isDarkColumn(x));
  }

  function spawnMobNear(centerCol, type, predicate) {
    for (let i = 0; i < 8; i++) {
      const col = clamp(centerCol + Math.floor((Math.random() - 0.5) * 40), 1, WORLD_WIDTH - 2);
      if (!predicate(col)) continue;
      const surface = findSurface(col);
      if (surface == null) continue;
      const spawnX = col * TILE_SIZE;
      const spawnY = surface * TILE_SIZE - TILE_SIZE;
      if (type === "zombie") {
        const z = new Zombie({ x: spawnX, y: spawnY, size: TILE_SIZE });
        mobs.push(z);
        mobContainer.addChild(z.sprite);
        return;
      }
      if (type === "cow") {
        const c = new Cow({ x: spawnX, y: spawnY, size: TILE_SIZE });
        mobs.push(c);
        mobContainer.addChild(c.sprite);
        return;
      }
    }
  }

  function findSurface(col) {
    for (let y = 1; y < WORLD_HEIGHT; y++) {
      const here = world[y][col];
      const above = world[y - 1][col];
      if (here !== TILE.AIR && above === TILE.AIR) return y - 1;
    }
    return null;
  }

  function isDarkColumn(col) {
    const surface = findSurface(col);
    if (surface == null) return false;
    // Consider dark if surface is deep underground
    return surface > 24;
  }

  function applyPlayerDamage(amount) {
    player.health = Math.max(0, player.health - amount);
  }

  function buildSaveState() {
    return {
      world: world.map((row) => row.slice()),
      biomeMap: biomeMapGlobal?.slice() || [],
      heightMap: heightMapGlobal?.slice() || [],
      player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth },
      inventory: inventoryManager.getState(),
      mobs: mobs.map((m) => ({
        type: m instanceof Zombie ? "zombie" : "cow",
        x: m.x,
        y: m.y,
        health: m.health,
      })),
    };
  }

  function applySaveState(state) {
    if (!state) return;
    if (Array.isArray(state.world)) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
          world[y][x] = state.world[y]?.[x] ?? TILE.AIR;
        }
      }
      drawWorld(tileTextures);
    }
    if (Array.isArray(state.biomeMap)) biomeMapGlobal = state.biomeMap.slice();
    if (Array.isArray(state.heightMap)) heightMapGlobal = state.heightMap.slice();
    if (state.player) {
      player.x = state.player.x ?? player.x;
      player.y = state.player.y ?? player.y;
      player.health = state.player.health ?? player.health;
      player.maxHealth = state.player.maxHealth ?? player.maxHealth;
      player.syncSprite();
      if (ui) ui.setHealth(player.health, player.maxHealth);
    }
    if (state.inventory) {
      inventoryManager.setState(state.inventory);
      if (ui) ui.updateInventory((k) => inventoryManager.getCount(k));
    }
    // rebuild mobs
    mobContainer.removeChildren();
    mobs.length = 0;
    if (Array.isArray(state.mobs)) {
      state.mobs.forEach((m) => {
        const spawn = m.type === "zombie" ? new Zombie({ x: m.x, y: m.y, size: TILE_SIZE }) : new Cow({ x: m.x, y: m.y, size: TILE_SIZE });
        spawn.health = m.health ?? spawn.health;
        mobs.push(spawn);
        mobContainer.addChild(spawn.sprite);
      });
    }
  }

  function dropLoot(mob) {
    if (mob instanceof Zombie) {
      const loot = ["dirt", "stone", "torch"];
      const key = loot[Math.floor(Math.random() * loot.length)];
      inventoryManager.addItem(key, 1);
      if (ui) ui.updateInventory((k) => inventoryManager.getCount(k));
    } else if (mob instanceof Cow) {
      const loot = ["grass", "leaf"];
      const key = loot[Math.floor(Math.random() * loot.length)];
      inventoryManager.addItem(key, 1);
      if (ui) ui.updateInventory((k) => inventoryManager.getCount(k));
    }
  }
})();
