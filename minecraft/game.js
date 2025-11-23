(() => {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  const TILE_SIZE = 32;
  const WORLD_WIDTH = 200;
  const WORLD_HEIGHT = 50;

  const TILE = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
  };

  const TILE_KEY = {
    [TILE.GRASS]: "grass",
    [TILE.DIRT]: "dirt",
    [TILE.STONE]: "stone",
  };

  const canvas = document.getElementById("game-canvas");

  const app = new PIXI.Application({
    view: canvas,
    resizeTo: window,
    background: "#1b1f2f",
    antialias: false,
  });

  const keys = new Set();
  const worldContainer = new PIXI.Container();
  const camera = { x: 0, y: 0, extraX: 0 };
  const world = createWorld();
  const worldSprites = Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => null)
  );
  const inventory = { grass: 0, dirt: 0, stone: 0 };
  let selectedTile = TILE.GRASS;
  let tileTextures = null;
  let ui = null;
  let player = null;

  app.stage.addChild(worldContainer);

  init().catch((err) => console.error("Erreur d'initialisation", err));

  function createWorld() {
    const grid = Array.from({ length: WORLD_HEIGHT }, () =>
      Array.from({ length: WORLD_WIDTH }, () => TILE.AIR)
    );

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        if (y === 20) grid[y][x] = TILE.GRASS;
        else if (y > 20 && y <= 30) grid[y][x] = TILE.DIRT;
        else if (y > 30) grid[y][x] = TILE.STONE;
      }
    }

    return grid;
  }

  function createTileset() {
    const width = TILE_SIZE * 3;
    const height = TILE_SIZE;
    const atlas = document.createElement("canvas");
    atlas.width = width;
    atlas.height = height;
    const ctx = atlas.getContext("2d");

    // Herbe
    ctx.fillStyle = "#6faa3d";
    ctx.fillRect(0, 0, TILE_SIZE, 10);
    ctx.fillStyle = "#5c8e33";
    for (let x = 0; x < TILE_SIZE; x += 4) ctx.fillRect(x, 6, 2, 4);
    ctx.fillStyle = "#8a5a2d";
    ctx.fillRect(0, 10, TILE_SIZE, TILE_SIZE - 10);

    // Terre
    const dirtX = TILE_SIZE;
    ctx.fillStyle = "#8a5a2d";
    ctx.fillRect(dirtX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#7b5129";
    for (let y = 4; y < TILE_SIZE; y += 6) {
      for (let x = dirtX + (y % 8); x < dirtX + TILE_SIZE; x += 8) {
        ctx.fillRect(x, y, 3, 3);
      }
    }

    // Pierre
    const stoneX = TILE_SIZE * 2;
    ctx.fillStyle = "#777c86";
    ctx.fillRect(stoneX, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#676c75";
    for (let y = 3; y < TILE_SIZE; y += 6) {
      for (let x = stoneX + (y % 10); x < stoneX + TILE_SIZE; x += 7) {
        ctx.fillRect(x, y, 4, 3);
      }
    }

    return atlas.toDataURL("image/png");
  }

  async function loadTileTextures() {
    const url = createTileset();
    const baseTexture = await PIXI.Assets.load(url);
    const src = baseTexture.baseTexture ?? baseTexture;
    return {
      [TILE.GRASS]: new PIXI.Texture(
        src,
        new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE)
      ),
      [TILE.DIRT]: new PIXI.Texture(
        src,
        new PIXI.Rectangle(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE)
      ),
      [TILE.STONE]: new PIXI.Texture(
        src,
        new PIXI.Rectangle(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE)
      ),
    };
  }

  async function init() {
    tileTextures = await loadTileTextures();
    drawWorld(tileTextures);

    player = new Player({
      size: TILE_SIZE,
      x: TILE_SIZE * 5,
      y: TILE_SIZE * 5,
      color: 0x3a8ee6,
    });

    worldContainer.addChild(player.sprite);

    ui = createHotbarUI(app, tileTextures, inventory, () => selectedTile);
    ui.updateInventory(inventory);
    ui.setSelection(selectedTile);

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));
    window.addEventListener("resize", () => {
      updateCamera(player);
      ui.onResize();
    });

    app.view.addEventListener("pointerdown", handlePointer);
    app.view.addEventListener("contextmenu", (e) => e.preventDefault());

    app.ticker.add((delta) => {
      const dt = delta / 60;
      player.update(dt, world, TILE_SIZE, keys);
      updateCamera(player);
      applyCamera();
      if (ui) ui.tick(delta);
    });
  }

  function drawWorld(textures) {
    worldContainer.removeChildren();
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
    ].includes(key);
    if (handled) event.preventDefault();
    if (isDown) keys.add(key);
    else keys.delete(key);

    if (isDown) {
      if (key === "arrowleft") camera.extraX += 10;
      if (key === "arrowright") camera.extraX -= 10;
      if (key === "1") selectTile(TILE.GRASS);
      if (key === "2") selectTile(TILE.DIRT);
      if (key === "3") selectTile(TILE.STONE);
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
    const key = TILE_KEY[tile];
    inventory[key] += 1;
    setTile(x, y, TILE.AIR);
    if (ui) ui.updateInventory(inventory);
  }

  function placeTile(x, y, tile) {
    if (tile === TILE.AIR) return;
    const key = TILE_KEY[tile];
    if (!key || inventory[key] <= 0) return;
    if (world[y][x] !== TILE.AIR) return;
    if (playerIntersectsTile(x, y)) return;

    inventory[key] -= 1;
    setTile(x, y, tile);
    if (ui) ui.updateInventory(inventory);
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

  function inWorld(x, y) {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
