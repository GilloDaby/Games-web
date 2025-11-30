document.addEventListener('DOMContentLoaded', () => {
    const levelsContainer = document.getElementById('levels');
    const levelSelection = document.getElementById('level-selection');
    const gameArea = document.getElementById('game-area');

    const TOTAL_LEVELS = 10;
    let unlockedLevels = localStorage.getItem('unlockedLevels') ? parseInt(localStorage.getItem('unlockedLevels')) : 1; // Initially, only level 1 is unlocked

    function createLevelSelection() {
        levelsContainer.innerHTML = '';
        for (let i = 1; i <= TOTAL_LEVELS; i++) {
            const button = document.createElement('button');
            button.classList.add('level-button');
            button.textContent = i;
            if (i <= unlockedLevels) {
                button.classList.add('unlocked');
                button.addEventListener('click', () => startLevel(i));
            } else {
                button.disabled = true;
            }
            levelsContainer.appendChild(button);
        }
    }

    function startLevel(levelNumber) {
        levelSelection.classList.add('hidden');
        gameArea.classList.remove('hidden');
        gameArea.innerHTML = `<h2>Level ${levelNumber}</h2><p>Loading game...</p>`;
        // Here we will load the specific mini-game for the level
        loadMiniGame(levelNumber);
    }
    
    function loadMiniGame(levelNumber) {
        if (levelNumber === 1) {
            loadLevel1();
        } else if (levelNumber === 2) {
            loadLevel2();
        } else if (levelNumber === 3) {
            loadLevel3();
        } else if (levelNumber === 4) {
            loadLevel4();
        } else if (levelNumber === 5) {
            loadLevel5();
        } else {
            // Placeholder for other levels
            gameArea.innerHTML = `
                <h2>Level ${levelNumber}</h2>
                <p>This is the placeholder for mini-game ${levelNumber}.</p>
                <button id="complete-level">Complete Level</button>
            `;
            document.getElementById('complete-level').addEventListener('click', () => {
                completeLevel(levelNumber);
            });
        }
    }

    function completeLevel(levelNumber) {
        if (levelNumber === unlockedLevels && unlockedLevels < TOTAL_LEVELS) {
            unlockedLevels++;
            localStorage.setItem('unlockedLevels', unlockedLevels);
        }
        showLevelSelection();
    }

    function loadLevel1() {
        gameArea.innerHTML = `
            <h2>Level 1: Perfect Fit</h2>
            <p>Drag the square into its designated spot.</p>
            <div id="perfect-fit-container">
                <div id="fit-target"></div>
                <div id="draggable-shape" draggable="true"></div>
            </div>
        `;

        const shape = document.getElementById('draggable-shape');
        const target = document.getElementById('fit-target');
        let offset = { x: 0, y: 0 };

        shape.addEventListener('dragstart', (e) => {
            offset = {
                x: e.clientX - shape.getBoundingClientRect().left,
                y: e.clientY - shape.getBoundingClientRect().top
            };
            e.dataTransfer.setData('text/plain', null); // Necessary for Firefox
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => shape.classList.add('dragging'), 0);
        });

        shape.addEventListener('dragend', (e) => {
            shape.classList.remove('dragging');
        });

        // The dragover event needs to be cancelled on the container to allow dropping
        const container = document.getElementById('perfect-fit-container');
        container.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const containerRect = container.getBoundingClientRect();
            shape.style.left = (e.clientX - containerRect.left - offset.x) + 'px';
            shape.style.top = (e.clientY - containerRect.top - offset.y) + 'px';

            const shapeRect = shape.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const isInside = (
                Math.abs(shapeRect.left - targetRect.left) < 5 &&
                Math.abs(shapeRect.top - targetRect.top) < 5
            );
            if (isInside) {
                shape.style.left = target.offsetLeft + 'px';
                shape.style.top = target.offsetTop + 'px';
                shape.style.backgroundColor = '#66bb6a';
                shape.setAttribute('draggable', 'false');
                setTimeout(() => completeLevel(1), 500);
            }
        });
    }

    function loadLevel2() {
        gameArea.innerHTML = `
            <h2>Level 2: Clean the Mess</h2>
            <p>Wipe away the grime to reveal the hidden image. Since I cannot use Disney images due to copyright, I am using a placeholder.</p>
            <div id="wipe-container">
                <canvas id="wipe-canvas"></canvas>
            </div>
        `;

        const canvas = document.getElementById('wipe-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('wipe-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 300;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Using placeholder images. You can replace these with your own image URLs.
        const imageUrls = [
            'https://picsum.photos/id/102/800/300',
            'https://picsum.photos/id/1047/800/300',
            'https://picsum.photos/id/1060/800/300',
            'https://picsum.photos/id/211/800/300',
            'https://picsum.photos/id/237/800/300',
        ];
        const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

        const img = new Image();
        img.crossOrigin = "Anonymous"; // To avoid tainted canvas issues
        img.src = randomImageUrl;
        img.onload = () => {
            // Draw the image as the "clean" layer
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            // The "dirty" layer
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#7d7d7d';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        };
        img.onerror = () => {
             // Fallback to a color if image fails to load
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#7d7d7d';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        let isDrawing = false;

        function getMousePos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if (evt.touches) {
                clientX = evt.touches[0].clientX;
                clientY = evt.touches[0].clientY;
            } else {
                clientX = evt.clientX;
                clientY = evt.clientY;
            }
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function erase(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getMousePos(canvas, e);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        function startDrawing(e) {
            isDrawing = true;
            erase(e);
        }
        function stopDrawing() {
            isDrawing = false;
            checkCompletion();
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', erase);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', erase);
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);


        function checkCompletion() {
            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            const data = imageData.data;
            let transparentPixels = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] === 0) {
                    transparentPixels++;
                }
            }
            const percentage = transparentPixels / (canvasWidth * canvasHeight);
            if (percentage > 0.9) {
                setTimeout(() => completeLevel(2), 300);
            }
        }
    }

    function loadLevel3() {
        gameArea.innerHTML = `
            <h2>Level 3: Orderly Stacking</h2>
            <p>Click to stack the blocks perfectly.</p>
            <div id="stack-container">
                <canvas id="stack-canvas"></canvas>
            </div>
        `;

        const canvas = document.getElementById('stack-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('stack-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let score = 0;
        const blockHeight = 20;
        const initialBlockWidth = 150;
        const stack = [{ x: (canvasWidth - initialBlockWidth) / 2, y: canvasHeight - blockHeight, width: initialBlockWidth }];

        let currentBlock = {
            x: 0,
            y: canvasHeight - blockHeight * 2,
            width: initialBlockWidth,
            direction: 1,
            speed: 1 // Made easier
        };
        let phase = 'dropping'; // dropping, gameOver
        let animationFrameId;

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Draw stack
            stack.forEach((block, index) => {
                ctx.fillStyle = `hsl(${200 + index * 10}, 60%, 50%)`;
                ctx.fillRect(block.x, block.y, block.width, blockHeight);
            });

            // Draw current block
            if (phase !== 'gameOver') {
                 ctx.fillStyle = `hsl(${200 + stack.length * 10}, 70%, 60%)`;
                ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, blockHeight);
            }
        }

        function update() {
            if (phase === 'gameOver') return;

            currentBlock.x += currentBlock.speed * currentBlock.direction;
            if (currentBlock.x + currentBlock.width > canvasWidth || currentBlock.x < 0) {
                currentBlock.direction *= -1;
            }
        }

        function gameLoop() {
            update();
            draw();
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        function placeBlock() {
            if (phase === 'gameOver') return;

            const topBlock = stack[stack.length - 1];
            const overlap = Math.max(0, Math.min(currentBlock.x + currentBlock.width, topBlock.x + topBlock.width) - Math.max(currentBlock.x, topBlock.x));

            if (overlap > 0) {
                const newWidth = overlap;
                const newX = Math.max(currentBlock.x, topBlock.x);
                
                currentBlock.width = newWidth;
                currentBlock.x = newX;

                stack.push({ ...currentBlock, y: canvasHeight - blockHeight * (stack.length + 1) });
                score++;

                if (score >= 8) { // Made easier
                    phase = 'gameOver';
                    cancelAnimationFrame(animationFrameId);
                    setTimeout(() => completeLevel(3), 500);
                    return;
                }

                // Start next block
                currentBlock.y -= blockHeight;
                currentBlock.speed += 0.1; // Made easier


            } else {
                // Game over
                phase = 'gameOver';
                cancelAnimationFrame(animationFrameId);
                // maybe add a retry button later
            }
        }

        canvas.addEventListener('click', placeBlock);

        // Start
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function loadLevel4() {
        gameArea.innerHTML = `
            <h2>Level 4: Paint the Wall</h2>
            <p>Click and drag to paint the entire wall.</p>
            <div id="paint-container">
                <canvas id="paint-canvas"></canvas>
            </div>
        `;

        const canvas = document.getElementById('paint-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('paint-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 300;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Wall texture (simple brick pattern)
        ctx.fillStyle = '#fbe9e7'; // light brick color
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#ffccbc'; // mortar color
        ctx.lineWidth = 1;
        for (let i = 0; i < canvasHeight; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvasWidth, i);
            ctx.stroke();
        }
        for (let i = 0; i < canvasWidth; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvasHeight);
            ctx.stroke();
        }


        // This will hold the painted data
        const paintCanvas = document.createElement('canvas');
        paintCanvas.width = canvasWidth;
        paintCanvas.height = canvasHeight;
        const pCtx = paintCanvas.getContext('2d');
        pCtx.fillStyle = 'rgba(76, 175, 80, 0.7)'; // Paint color

        let isPainting = false;

        function getMousePos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
        
        function paint(e) {
            if (!isPainting) return;
            const pos = getMousePos(canvas, e);
            pCtx.beginPath();
            pCtx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            pCtx.fill();
            redraw();
        }

        function redraw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            // Redraw wall texture
             ctx.fillStyle = '#fbe9e7';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = '#ffccbc';
            ctx.lineWidth = 1;
             for (let i = 0; i < canvasHeight; i += 20) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasWidth, i); ctx.stroke();
            }
            for (let i = 0; i < canvasWidth; i += 50) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasHeight); ctx.stroke();
            }
            // Draw paint
            ctx.drawImage(paintCanvas, 0, 0);
        }

        canvas.addEventListener('mousedown', (e) => {
            isPainting = true;
            paint(e);
        });
        canvas.addEventListener('mousemove', paint);
        canvas.addEventListener('mouseup', () => {
            isPainting = false;
            checkCompletion();
        });
        canvas.addEventListener('mouseleave', () => {
            isPainting = false;
        });

        function checkCompletion() {
            const imageData = pCtx.getImageData(0, 0, canvasWidth, canvasHeight);
            const data = imageData.data;
            let paintedPixels = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) { // Check if alpha is not 0
                    paintedPixels++;
                }
            }
            const percentage = paintedPixels / (canvasWidth * canvasHeight);
            if (percentage > 0.95) {
                setTimeout(() => completeLevel(4), 300);
            }
        }
    }

    function loadLevel5() {
        gameArea.innerHTML = `
            <h2>Level 5: Domino Chain</h2>
            <p>Click to start the chain reaction.</p>
            <div id="domino-container">
                <canvas id="domino-canvas"></canvas>
            </div>
        `;

        const canvas = document.getElementById('domino-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('domino-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const dominoWidth = 12;
        const dominoHeight = 40;
        const dominoes = [];
        const numDominoes = 25;
        let gameStarted = false;
        let fallenCount = 0;

        for (let i = 0; i < numDominoes; i++) {
            dominoes.push({
                x: 50 + i * 25,
                y: canvasHeight - 50,
                width: dominoWidth,
                height: dominoHeight,
                angle: 0, // In radians
                isFalling: false,
                rotationSpeed: 0.1 + Math.random() * 0.05
            });
        }
        
        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, canvasHeight - 10, canvasWidth, 10); // Ground

            dominoes.forEach((domino, i) => {
                ctx.save();
                ctx.translate(domino.x, domino.y);
                ctx.rotate(domino.angle);
                ctx.fillStyle = `hsl(${10 + i * 14}, 80%, 55%)`;
                ctx.fillRect(-domino.width / 2, -domino.height, domino.width, domino.height);
                ctx.restore();
            });
        }

        function update() {
            if (!gameStarted) return;
            
            let allFallen = true;

            for (let i = 0; i < dominoes.length; i++) {
                const d = dominoes[i];
                if (d.isFalling && d.angle < Math.PI / 2) {
                    d.angle += d.rotationSpeed;

                    // Check for collision with the next domino
                    if (i + 1 < dominoes.length) {
                        const nextD = dominoes[i+1];
                        if (!nextD.isFalling) {
                             const tipX = d.x + Math.sin(d.angle) * d.height;
                             const tipY = d.y - Math.cos(d.angle) * d.height;
                             if(tipX >= nextD.x - nextD.width/2){
                                 nextD.isFalling = true;
                             }
                        }
                    }
                }
                if (d.angle < Math.PI / 2) {
                    allFallen = false;
                } else {
                     if(!d.counted){
                        fallenCount++;
                        d.counted = true;
                     }
                }
            }
             if (allFallen || fallenCount === numDominoes) {
                 gameStarted = false; // Stop the loop
                 setTimeout(() => completeLevel(5), 500);
             }
        }
        
        function gameLoop() {
            update();
            draw();
            if(gameStarted) {
                requestAnimationFrame(gameLoop);
            }
        }

        canvas.addEventListener('click', () => {
            if (!gameStarted && dominoes.length > 0) {
                gameStarted = true;
                dominoes[0].isFalling = true;
                requestAnimationFrame(gameLoop);
            }
        });

        // Initial Draw
        draw();
    }

    function showLevelSelection() {
        gameArea.classList.add('hidden');
        levelSelection.classList.remove('hidden');
        createLevelSelection();
    }

    // Initial setup
    createLevelSelection();

    // Dev menu
    const devMenu = document.createElement('div');
    devMenu.id = 'dev-menu';
    devMenu.classList.add('hidden');
    devMenu.innerHTML = `
        <h3>Dev Menu</h3>
        <button id="unlock-all">Unlock All Levels</button>
        <br/><br/>
        <button id="close-dev-menu">Close</button>
    `;
    document.body.appendChild(devMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F9') {
            e.preventDefault();
            devMenu.classList.toggle('hidden');
        }
    });

    document.getElementById('close-dev-menu').addEventListener('click', () => {
        devMenu.classList.add('hidden');
    });

    document.getElementById('unlock-all').addEventListener('click', () => {
        unlockedLevels = TOTAL_LEVELS;
        localStorage.setItem('unlockedLevels', unlockedLevels);
        showLevelSelection();
        devMenu.classList.add('hidden');
    });
});
