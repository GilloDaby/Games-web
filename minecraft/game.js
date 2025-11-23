// game.js

// Initialize PIXI Application
const app = new PIXI.Application({
    resizeTo: window, // Make canvas full screen and resize with window
    backgroundColor: 0x87CEEB, // Sky blue background
    antialias: true,
});

document.body.appendChild(app.view);

// --- World Parameters ---
const WORLD_WIDTH = 200; // in blocks
const WORLD_HEIGHT = 50; // in blocks
const BLOCK_SIZE = 32; // pixels

// --- Texture URLs (Placeholders) ---
// You should replace these with your actual 32x32 block textures.
const TEXTURES = {
    grass: 'https://placehold.co/32x32/008000/FFFFFF/png?text=G', // Green for Grass
    dirt: 'https://placehold.co/32x32/8B4513/FFFFFF/png?text=D',  // Brown for Dirt
    stone: 'https://placehold.co/32x32/808080/FFFFFF/png?text=S', // Grey for Stone
};

let worldMatrix = []; // 2D array to store block types
const worldContainer = new PIXI.Container(); // Container for all blocks
app.stage.addChild(worldContainer);

// --- Procedural World Generation ---
function generateWorld() {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        worldMatrix[y] = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let blockType = null;
            if (y === 20) {
                blockType = 'grass';
            } else if (y > 20 && y <= 30) {
                blockType = 'dirt';
            } else if (y > 30) {
                blockType = 'stone';
            }
            worldMatrix[y][x] = blockType;
        }
    }
    console.log('World Matrix Generated:', worldMatrix);
}

// Initialize Player immediately
// Place player at initial position (e.g., above the first grass block)
const initialPlayerX = (WORLD_WIDTH / 4) * BLOCK_SIZE;
const initialPlayerY = (WORLD_HEIGHT - 35) * BLOCK_SIZE; // Roughly 1 block above grass
const player = new Player(app, worldMatrix, BLOCK_SIZE, initialPlayerX, initialPlayerY);
worldContainer.addChild(player.render());


// --- Load Textures and Render World ---
async function loadTexturesAndRenderWorld() {
    // Load all textures
    const texturePromises = Object.entries(TEXTURES).map(([key, url]) =>
        PIXI.Assets.load(url).then(texture => ({ key, texture }))
    );
    const loadedTextures = await Promise.all(texturePromises);

    const pixiTextures = {};
    loadedTextures.forEach(({ key, texture }) => {
        pixiTextures[key] = texture;
    });
    console.log('Textures Loaded:', pixiTextures);

    // Render the world
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const blockType = worldMatrix[y][x];
            if (blockType && pixiTextures[blockType]) {
                const blockSprite = new PIXI.Sprite(pixiTextures[blockType]);
                blockSprite.x = x * BLOCK_SIZE;
                blockSprite.y = y * BLOCK_SIZE;
                worldContainer.addChild(blockSprite);
            }
        }
    }
    console.log('World Rendered!');

    // Adjust player's initial Y position after world is rendered and collisions can be checked
    // This is useful if initialPlayerY is an estimate and actual ground is slightly different
    // player.sprite.y = initialPlayerY; // Or use a more robust ground-finding mechanism
}

// --- Keyboard Input for Player ---
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') { // Space bar for jump
        player.jump();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Game Loop ---
app.ticker.add((delta) => {
    // Player movement
    if (keys['a'] || keys['A']) {
        player.moveLeft();
    } else if (keys['d'] || keys['D']) {
        player.moveRight();
    } else {
        player.stopMoving();
    }

    // Update player's state
    player.update(delta);

    // Camera follows player
    // Calculate the camera's target X position to keep player roughly centered
    const targetCameraX = app.screen.width / 2 - player.sprite.x;

    // Apply camera bounds
    const maxCameraX = 0; // Cannot scroll further left than world start
    const minCameraX = -(WORLD_WIDTH * BLOCK_SIZE - app.screen.width); // Cannot scroll further right than world end

    // Ensure camera stays within world bounds
    worldContainer.x = Math.max(minCameraX, Math.min(maxCameraX, targetCameraX));
});

// --- Game Initialization ---
generateWorld();
loadTexturesAndRenderWorld().then(() => {
    // No need to re-initialize camera position here, as it's handled in the ticker now
});

console.log('Minecraft 2D game initialized!');