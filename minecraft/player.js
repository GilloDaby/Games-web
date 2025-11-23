// player.js

class Player {
    constructor(app, worldMatrix, blockSize, initialX, initialY) {
        this.app = app;
        this.worldMatrix = worldMatrix;
        this.BLOCK_SIZE = blockSize;

        // Player sprite
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x0000FF); // Blue color
        graphics.drawRect(0, 0, this.BLOCK_SIZE, this.BLOCK_SIZE);
        graphics.endFill();
        this.sprite = new PIXI.Sprite(app.renderer.generateTexture(graphics));
        this.sprite.x = initialX;
        this.sprite.y = initialY;
        this.sprite.anchor.set(0.5); // Anchor in the center for easier positioning

        // Physics properties
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.gravity = 0.5;
        this.jumpStrength = -10;
        this.onGround = false;
        this.isJumping = false;
    }

    // --- Movement Methods ---
    moveLeft() {
        this.vx = -this.speed;
    }

    moveRight() {
        this.vx = this.speed;
    }

    stopMoving() {
        this.vx = 0;
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpStrength;
            this.onGround = false;
            this.isJumping = true;
        }
    }

    // --- Update Player State ---
    update(delta) {
        // Apply gravity
        this.vy += this.gravity;

        // Apply velocity (tentative position)
        let nextX = this.sprite.x + this.vx * delta;
        let nextY = this.sprite.y + this.vy * delta;

        // Collision detection on X-axis
        let collisionX = this.checkCollision(nextX, this.sprite.y, 'x');
        if (collisionX) {
            this.vx = 0;
            // Adjust player position to be right next to the block
            if (nextX < this.sprite.x) { // Moving left
                this.sprite.x = Math.floor((nextX - this.BLOCK_SIZE / 2) / this.BLOCK_SIZE) * this.BLOCK_SIZE + this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
            } else { // Moving right
                this.sprite.x = Math.floor((nextX + this.BLOCK_SIZE / 2) / this.BLOCK_SIZE) * this.BLOCK_SIZE - this.BLOCK_SIZE / 2;
            }
        } else {
            this.sprite.x = nextX;
        }

        // Collision detection on Y-axis
        let collisionY = this.checkCollision(this.sprite.x, nextY, 'y');
        if (collisionY) {
            if (this.vy > 0) { // Falling down
                this.onGround = true;
                this.isJumping = false;
                // Adjust player position to be on top of the block
                this.sprite.y = Math.floor((nextY + this.BLOCK_SIZE / 2) / this.BLOCK_SIZE) * this.BLOCK_SIZE - this.BLOCK_SIZE / 2;
            } else if (this.vy < 0) { // Jumping up (hit head)
                // Adjust player position to be below the block
                this.sprite.y = Math.floor((nextY - this.BLOCK_SIZE / 2) / this.BLOCK_SIZE) * this.BLOCK_SIZE + this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
            }
            this.vy = 0;
        } else {
            this.onGround = false;
            this.sprite.y = nextY;
        }

        // Keep player within world bounds (optional, but good for testing)
        // Horizontal bounds
        if (this.sprite.x - this.BLOCK_SIZE / 2 < 0) {
            this.sprite.x = this.BLOCK_SIZE / 2;
        }
        if (this.sprite.x + this.BLOCK_SIZE / 2 > this.worldMatrix[0].length * this.BLOCK_SIZE) {
            this.sprite.x = this.worldMatrix[0].length * this.BLOCK_SIZE - this.BLOCK_SIZE / 2;
        }

        // Vertical bounds (e.g., falling off the world)
        if (this.sprite.y > this.app.screen.height + this.BLOCK_SIZE) { // If player falls below screen
            this.sprite.x = initialX; // Reset position
            this.sprite.y = initialY;
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
        }
    }

    // --- Collision Detection ---
    checkCollision(x, y, axis) {
        const playerLeft = x - this.BLOCK_SIZE / 2;
        const playerRight = x + this.BLOCK_SIZE / 2;
        const playerTop = y - this.BLOCK_SIZE / 2;
        const playerBottom = y + this.BLOCK_SIZE / 2;

        // Get the range of grid cells the player currently occupies or will occupy
        const startCol = Math.floor(playerLeft / this.BLOCK_SIZE);
        const endCol = Math.floor(playerRight / this.BLOCK_SIZE);
        const startRow = Math.floor(playerTop / this.BLOCK_SIZE);
        const endRow = Math.floor(playerBottom / this.BLOCK_SIZE);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                // Ensure we are within world bounds
                if (row >= 0 && row < this.worldMatrix.length &&
                    col >= 0 && col < this.worldMatrix[0].length) {

                    const blockType = this.worldMatrix[row][col];
                    if (blockType !== null) { // If there's a solid block
                        // Check for overlap
                        const blockX = col * this.BLOCK_SIZE;
                        const blockY = row * this.BLOCK_SIZE;

                        // AABB check
                        if (playerRight > blockX && playerLeft < blockX + this.BLOCK_SIZE &&
                            playerBottom > blockY && playerTop < blockY + this.BLOCK_SIZE) {
                            return true; // Collision detected
                        }
                    }
                }
            }
        }
        return false; // No collision
    }

    render() {
        return this.sprite;
    }
}
