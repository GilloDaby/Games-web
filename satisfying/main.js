document.addEventListener('DOMContentLoaded', () => {
    const levelsContainer = document.getElementById('levels');
    const levelSelection = document.getElementById('level-selection');
    const gameArea = document.getElementById('game-area');

    const TOTAL_LEVELS = 100;
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
        const levels = {
            1: loadLevel1, 2: loadLevel2, 3: loadLevel3, 4: loadLevel4, 5: loadLevel5,
            6: loadLevel6, 7: loadLevel7, 8: loadLevel8, 9: loadLevel9, 10: loadLevel10,
            11: loadLevel11, 12: loadLevel12, 13: loadLevel13, 14: loadLevel14, 15: loadLevel15,
            16: loadLevel16, 17: loadLevel17, 18: loadLevel18, 19: loadLevel19, 20: loadLevel20,
            21: loadLevel21, 22: loadLevel22, 23: loadLevel23, 24: loadLevel24, 25: loadLevel25,
            26: loadLevel26, 27: loadLevel27, 28: loadLevel28, 29: loadLevel29, 30: loadLevel30,
            31: loadLevel31, 32: loadLevel32, 33: loadLevel33, 34: loadLevel34, 35: loadLevel35,
            36: loadLevel36, 37: loadLevel37, 38: loadLevel38, 39: loadLevel39, 40: loadLevel40,
            41: loadLevel41, 42: loadLevel42, 43: loadLevel43, 44: loadLevel44, 45: loadLevel45,
            46: loadLevel46, 47: loadLevel47, 48: loadLevel48, 49: loadLevel49, 50: loadLevel50,
            51: loadLevel51, 52: loadLevel52, 53: loadLevel53, 54: loadLevel54, 55: loadLevel55,
            56: loadLevel56, 57: loadLevel57, 58: loadLevel58, 59: loadLevel59, 60: loadLevel60,
            61: loadLevel61, 62: loadLevel62, 63: loadLevel63, 64: loadLevel64, 65: loadLevel65,
            66: loadLevel66, 67: loadLevel67, 68: loadLevel68, 69: loadLevel69, 70: loadLevel70,
            71: loadLevel71, 72: loadLevel72, 73: loadLevel73, 74: loadLevel74, 75: loadLevel75,
            76: loadLevel76, 77: loadLevel77, 78: loadLevel78, 79: loadLevel79, 80: loadLevel80,
            81: loadLevel81, 82: loadLevel82, 83: loadLevel83, 84: loadLevel84, 85: loadLevel85,
            86: loadLevel86, 87: loadLevel87, 88: loadLevel88, 89: loadLevel89, 90: loadLevel90,
            91: loadLevel91, 92: loadLevel92, 93: loadLevel93, 94: loadLevel94, 95: loadLevel95,
            96: loadLevel96, 97: loadLevel97, 98: loadLevel98, 99: loadLevel99, 100: loadLevel100
        };

        if (levels[levelNumber]) {
            levels[levelNumber]();
        } else {
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
            <h2>Level 1: Perfect Fit ✨</h2>
            <p>Drag the shapes into their designated spots.</p>
            <div id="perfect-fit-container">
                <div class="fit-target" data-shape="0"></div>
                <div class="fit-target" data-shape="1"></div>
                <div class="fit-target" data-shape="2"></div>
                <div class="draggable-shape" data-shape="0" draggable="true"></div>
                <div class="draggable-shape" data-shape="1" draggable="true"></div>
                <div class="draggable-shape" data-shape="2" draggable="true"></div>
            </div>
            <div id="level-progress">0/3 shapes fitted</div>
        `;

        const shapes = document.querySelectorAll('.draggable-shape');
        const targets = document.querySelectorAll('.fit-target');
        let completed = 0;
        const shapeStyles = [
            { color: '#457b9d', borderRadius: '4px' },
            { color: '#e63946', borderRadius: '50%' },
            { color: '#f77f00', borderRadius: '8px', transform: 'rotate(45deg)' }
        ];

        // Style targets and shapes
        targets.forEach((target, i) => {
            target.style.backgroundColor = 'rgba(212, 163, 115, 0.3)';
            target.style.borderRadius = shapeStyles[i].borderRadius;
            if (i === 0) {
                target.style.left = '50px'; target.style.top = '50px';
            } else if (i === 1) {
                target.style.left = '250px'; target.style.top = '120px';
            } else {
                target.style.left = '450px'; target.style.top = '50px';
            }
        });

        shapes.forEach((shape, i) => {
            shape.style.backgroundColor = shapeStyles[i].color;
            shape.style.borderRadius = shapeStyles[i].borderRadius;
            shape.style.border = `3px solid ${shapeStyles[i].color}`;
            if (i === 0) {
                shape.style.left = '100px'; shape.style.top = '200px';
            } else if (i === 1) {
                shape.style.left = '300px'; shape.style.top = '200px';
            } else {
                shape.style.left = '500px'; shape.style.top = '200px';
            }
        });

        const container = document.getElementById('perfect-fit-container');
        let offset = { x: 0, y: 0 };
        let currentShape = null;

        shapes.forEach(shape => {
            shape.addEventListener('dragstart', (e) => {
                currentShape = shape;
                offset = {
                    x: e.clientX - shape.getBoundingClientRect().left,
                    y: e.clientY - shape.getBoundingClientRect().top
                };
                e.dataTransfer.setData('text/plain', null);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => shape.classList.add('dragging'), 0);
            });

            shape.addEventListener('dragend', (e) => {
                shape.classList.remove('dragging');
            });
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!currentShape) return;
            
            const containerRect = container.getBoundingClientRect();
            currentShape.style.left = (e.clientX - containerRect.left - offset.x) + 'px';
            currentShape.style.top = (e.clientY - containerRect.top - offset.y) + 'px';

            const shapeRect = currentShape.getBoundingClientRect();
            const shapeId = currentShape.getAttribute('data-shape');
            const matchingTarget = Array.from(targets).find(t => t.getAttribute('data-shape') === shapeId);
            const targetRect = matchingTarget.getBoundingClientRect();
            
            const isInside = (
                Math.abs(shapeRect.left - targetRect.left) < 20 &&
                Math.abs(shapeRect.top - targetRect.top) < 20
            );
            
            if (isInside && !currentShape.classList.contains('fitted')) {
                currentShape.style.left = matchingTarget.offsetLeft + 'px';
                currentShape.style.top = matchingTarget.offsetTop + 'px';
                currentShape.style.filter = 'brightness(1.2)';
                currentShape.style.boxShadow = '0 0 20px rgba(102, 187, 106, 0.8)';
                currentShape.setAttribute('draggable', 'false');
                currentShape.classList.add('fitted');
                completed++;
                document.getElementById('level-progress').textContent = `${completed}/3 shapes fitted`;
                
                if (completed === 3) {
                    setTimeout(() => {
                        showSuccessMessage();
                        setTimeout(() => completeLevel(1), 1000);
                    }, 300);
                }
            }
        });
    }

    function loadLevel2() {
        gameArea.innerHTML = `
            <h2>Level 2: Clean the Mess 🧹</h2>
            <p>Wipe away the grime to reveal the hidden image!</p>
            <div id="wipe-container">
                <canvas id="wipe-canvas"></canvas>
                <div id="wipe-progress">0% cleaned</div>
            </div>
        `;

        const canvas = document.getElementById('wipe-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('wipe-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 300;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const imageUrls = [
            'https://picsum.photos/id/102/800/300',
            'https://picsum.photos/id/1047/800/300',
            'https://picsum.photos/id/1060/800/300',
            'https://picsum.photos/id/211/800/300',
            'https://picsum.photos/id/237/800/300',
        ];
        const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = randomImageUrl;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#7d7d7d';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        };
        img.onerror = () => {
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
            ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
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
            const percentage = (transparentPixels / (canvasWidth * canvasHeight)) * 100;
            document.getElementById('wipe-progress').textContent = `${Math.floor(percentage)}% cleaned`;
            
            if (percentage > 90) {
                showSuccessMessage();
                setTimeout(() => completeLevel(2), 800);
            }
        }
    }

    function loadLevel3() {
        gameArea.innerHTML = `
            <h2>Level 3: Orderly Stacking 📦</h2>
            <p>Click to stack the blocks perfectly! Stack 10 blocks to win.</p>
            <div id="stack-container">
                <canvas id="stack-canvas"></canvas>
                <div id="stack-score">Score: 0/10</div>
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
        const blockHeight = 25;
        const initialBlockWidth = 150;
        const stack = [{ x: (canvasWidth - initialBlockWidth) / 2, y: canvasHeight - blockHeight, width: initialBlockWidth }];

        let currentBlock = {
            x: 0,
            y: canvasHeight - blockHeight * 2,
            width: initialBlockWidth,
            direction: 1,
            speed: 2
        };
        let phase = 'dropping';
        let animationFrameId;

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            stack.forEach((block, index) => {
                const gradient = ctx.createLinearGradient(block.x, 0, block.x + block.width, 0);
                gradient.addColorStop(0, `hsl(${200 + index * 15}, 70%, 60%)`);
                gradient.addColorStop(1, `hsl(${200 + index * 15}, 70%, 45%)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(block.x, block.y, block.width, blockHeight);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.strokeRect(block.x, block.y, block.width, blockHeight);
            });

            if (phase !== 'gameOver') {
                const gradient = ctx.createLinearGradient(currentBlock.x, 0, currentBlock.x + currentBlock.width, 0);
                gradient.addColorStop(0, `hsl(${200 + stack.length * 15}, 80%, 70%)`);
                gradient.addColorStop(1, `hsl(${200 + stack.length * 15}, 80%, 55%)`);
                ctx.fillStyle = gradient;
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
                document.getElementById('stack-score').textContent = `Score: ${score}/10`;

                if (score >= 10) {
                    phase = 'gameOver';
                    cancelAnimationFrame(animationFrameId);
                    showSuccessMessage();
                    setTimeout(() => completeLevel(3), 1000);
                    return;
                }

                currentBlock.y -= blockHeight;
                currentBlock.speed += 0.15;

            } else {
                phase = 'gameOver';
                cancelAnimationFrame(animationFrameId);
                gameArea.innerHTML += '<button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; font-size:1rem; cursor:pointer;">Try Again</button>';
            }
        }

        canvas.addEventListener('click', placeBlock);
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

    function showSuccessMessage() {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#90a955;color:white;padding:30px 50px;border-radius:15px;font-size:2rem;font-weight:bold;box-shadow:0 8px 16px rgba(0,0,0,0.3);z-index:9999;animation:popup 0.3s ease;';
        msg.textContent = '✨ Perfect! ✨';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 800);
    }

    // Level 6: Bubble Wrap Pop
    function loadLevel6() {
        gameArea.innerHTML = `
            <h2>Level 6: Bubble Wrap Pop 🫧</h2>
            <p>Pop all the bubbles! Click on each bubble to pop it.</p>
            <div id="bubble-container">
                <canvas id="bubble-canvas"></canvas>
                <div id="bubble-progress">0/50 bubbles popped</div>
            </div>
        `;

        const canvas = document.getElementById('bubble-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('bubble-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 480;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const bubbles = [];
        const rows = 10;
        const cols = 5;
        const bubbleRadius = 20;
        const spacing = 6;
        let poppedCount = 0;
        
        const totalWidth = cols * (bubbleRadius * 2 + spacing) - spacing;
        const totalHeight = rows * (bubbleRadius * 2 + spacing) - spacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const startY = 10;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                bubbles.push({
                    x: startX + col * (bubbleRadius * 2 + spacing) + bubbleRadius,
                    y: startY + row * (bubbleRadius * 2 + spacing) + bubbleRadius,
                    radius: bubbleRadius,
                    popped: false
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            bubbles.forEach(bubble => {
                if (!bubble.popped) {
                    const gradient = ctx.createRadialGradient(
                        bubble.x - 5, bubble.y - 5, 5,
                        bubble.x, bubble.y, bubble.radius
                    );
                    gradient.addColorStop(0, 'rgba(200, 220, 255, 0.8)');
                    gradient.addColorStop(0.7, 'rgba(150, 180, 255, 0.6)');
                    gradient.addColorStop(1, 'rgba(100, 140, 255, 0.4)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.arc(bubble.x - 8, bubble.y - 8, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.fill();
                }
            });
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            bubbles.forEach(bubble => {
                if (!bubble.popped) {
                    const dist = Math.sqrt((x - bubble.x) ** 2 + (y - bubble.y) ** 2);
                    if (dist <= bubble.radius) {
                        bubble.popped = true;
                        poppedCount++;
                        document.getElementById('bubble-progress').textContent = `${poppedCount}/50 bubbles popped`;
                        
                        if (poppedCount === bubbles.length) {
                            showSuccessMessage();
                            setTimeout(() => completeLevel(6), 1000);
                        }
                        draw();
                    }
                }
            });
        });

        draw();
    }

    // Level 7: Slice Master
    function loadLevel7() {
        gameArea.innerHTML = `
            <h2>Level 7: Slice Master 🔪</h2>
            <p>Slice all the falling fruits! Click and drag to slice. Missed fruits will respawn!</p>
            <div id="slice-container">
                <canvas id="slice-canvas"></canvas>
                <div id="slice-score">Sliced: 0/15</div>
            </div>
        `;

        const canvas = document.getElementById('slice-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('slice-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const objects = [];
        let slicedCount = 0;
        let totalToSlice = 15;
        let animationFrameId;
        let isSlicing = false;
        let slicePath = [];
        let spawnTimer = 0;
        const fruits = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🥝', '🍍'];

        function spawnObject() {
            if (objects.filter(o => !o.sliced).length < 3) {
                const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
                objects.push({
                    x: Math.random() * (canvasWidth - 80) + 40,
                    y: -40,
                    radius: 25,
                    vy: 2 + Math.random() * 1.5,
                    emoji: randomFruit,
                    sliced: false,
                    recycled: false
                });
                spawnTimer = 0;
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            objects.forEach(obj => {
                if (!obj.sliced) {
                    ctx.font = '50px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(obj.emoji, obj.x, obj.y);
                } else {
                    ctx.font = '35px Arial';
                    ctx.globalAlpha = 0.6;
                    ctx.save();
                    ctx.translate(obj.x - 15, obj.y);
                    ctx.rotate(-0.3);
                    ctx.fillText(obj.emoji, 0, 0);
                    ctx.restore();
                    ctx.save();
                    ctx.translate(obj.x + 15, obj.y);
                    ctx.rotate(0.3);
                    ctx.fillText(obj.emoji, 0, 0);
                    ctx.restore();
                    ctx.globalAlpha = 1;
                }
            });

            if (slicePath.length > 1) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(slicePath[0].x, slicePath[0].y);
                for (let i = 1; i < slicePath.length; i++) {
                    ctx.lineTo(slicePath[i].x, slicePath[i].y);
                }
                ctx.stroke();
            }
        }

        function update() {
            objects.forEach(obj => {
                if (!obj.sliced) {
                    obj.y += obj.vy;
                } else {
                    obj.y += obj.vy * 0.5;
                }
            });

            for (let i = objects.length - 1; i >= 0; i--) {
                if (objects[i].y > canvasHeight + 50) {
                    if (!objects[i].sliced && !objects[i].recycled) {
                        objects[i].y = -40;
                        objects[i].x = Math.random() * (canvasWidth - 80) + 40;
                        objects[i].recycled = true;
                    } else if (objects[i].sliced) {
                        objects.splice(i, 1);
                    }
                }
            }

            spawnTimer++;
            if (spawnTimer > 60) {
                spawnObject();
            }
        }

        function gameLoop() {
            update();
            draw();
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        canvas.addEventListener('mousedown', (e) => {
            isSlicing = true;
            slicePath = [getMousePos(e)];
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isSlicing) {
                const pos = getMousePos(e);
                slicePath.push(pos);
                
                objects.forEach(obj => {
                    if (!obj.sliced) {
                        const dist = Math.sqrt((pos.x - obj.x) ** 2 + (pos.y - obj.y) ** 2);
                        if (dist <= obj.radius + 10) {
                            obj.sliced = true;
                            slicedCount++;
                            document.getElementById('slice-score').textContent = `Sliced: ${slicedCount}/15`;
                            
                            if (slicedCount >= totalToSlice) {
                                cancelAnimationFrame(animationFrameId);
                                showSuccessMessage();
                                setTimeout(() => completeLevel(7), 1000);
                            }
                        }
                    }
                });
            }
        });

        canvas.addEventListener('mouseup', () => {
            isSlicing = false;
            slicePath = [];
        });

        spawnObject();
        spawnObject();
        gameLoop();
    }

    // Level 8: Organize the Shelf
    function loadLevel8() {
        gameArea.innerHTML = `
            <h2>Level 8: Organize the Shelf 📚</h2>
            <p>Drag the items to organize them by color!</p>
            <div id="organize-container">
                <div id="organize-shelves"></div>
            </div>
            <div id="organize-progress">0/12 items organized</div>
        `;

        const container = document.getElementById('organize-shelves');
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a'];
        const colorNames = ['red', 'blue', 'green', 'yellow'];
        const items = [];
        let organized = 0;

        colorNames.forEach((name, idx) => {
            const shelf = document.createElement('div');
            shelf.className = 'shelf';
            shelf.dataset.color = name;
            shelf.style.cssText = `width:100%;height:80px;margin:10px 0;border:3px dashed ${colors[idx]};border-radius:8px;display:flex;align-items:center;padding:10px;gap:10px;background:rgba(255,255,255,0.5);`;
            container.appendChild(shelf);
        });

        for (let i = 0; i < 12; i++) {
            const colorIdx = Math.floor(i / 3);
            const item = document.createElement('div');
            item.className = 'organize-item';
            item.dataset.color = colorNames[colorIdx];
            item.draggable = true;
            item.style.cssText = `width:50px;height:50px;background:${colors[colorIdx]};border-radius:8px;cursor:grab;margin:5px;display:inline-block;box-shadow:0 2px 5px rgba(0,0,0,0.2);transition:all 0.2s;`;
            container.appendChild(item);
        }

        const allItems = container.querySelectorAll('.organize-item');
        const shuffled = Array.from(allItems).sort(() => Math.random() - 0.5);
        shuffled.forEach(item => container.appendChild(item));

        let draggedItem = null;

        allItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
            });
        });

        const shelves = container.querySelectorAll('.shelf');
        shelves.forEach(shelf => {
            shelf.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            shelf.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem && shelf.dataset.color === draggedItem.dataset.color) {
                    if (!draggedItem.classList.contains('organized')) {
                        shelf.appendChild(draggedItem);
                        draggedItem.style.cursor = 'default';
                        draggedItem.draggable = false;
                        draggedItem.style.boxShadow = '0 0 15px rgba(144, 169, 85, 0.8)';
                        draggedItem.classList.add('organized');
                        organized++;
                        document.getElementById('organize-progress').textContent = `${organized}/12 items organized`;
                        
                        if (organized === 12) {
                            showSuccessMessage();
                            setTimeout(() => completeLevel(8), 1000);
                        }
                    }
                }
            });
        });
    }

    // Level 9: Power Wash
    function loadLevel9() {
        gameArea.innerHTML = `
            <h2>Level 9: Power Wash 💦</h2>
            <p>Clean the dirty surface with your power washer!</p>
            <div id="wash-container">
                <canvas id="wash-canvas"></canvas>
                <div id="wash-progress">0% clean</div>
            </div>
        `;

        const canvas = document.getElementById('wash-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('wash-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 350;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const gridSize = 10;
        const cols = Math.floor(canvasWidth / gridSize);
        const rows = Math.floor(canvasHeight / gridSize);
        const grid = [];

        for (let i = 0; i < rows; i++) {
            grid[i] = [];
            for (let j = 0; j < cols; j++) {
                grid[i][j] = { dirty: true, cleanness: 0 };
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const cell = grid[i][j];
                    if (cell.dirty) {
                        const brightness = Math.floor(50 + cell.cleanness * 2);
                        ctx.fillStyle = `rgb(${brightness}, ${brightness + 10}, ${brightness + 5})`;
                        ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                    } else {
                        ctx.fillStyle = '#e8f4f8';
                        ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                    }
                }
            }
        }

        let isWashing = false;

        function wash(e) {
            if (!isWashing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / gridSize);
            const row = Math.floor(y / gridSize);

            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    const r = row + i;
                    const c = col + j;
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        if (grid[r][c].dirty) {
                            grid[r][c].cleanness += 20;
                            if (grid[r][c].cleanness >= 100) {
                                grid[r][c].dirty = false;
                            }
                        }
                    }
                }
            }

            draw();
            checkCompletion();
        }

        canvas.addEventListener('mousedown', (e) => {
            isWashing = true;
            wash(e);
        });

        canvas.addEventListener('mousemove', wash);

        canvas.addEventListener('mouseup', () => {
            isWashing = false;
        });

        function checkCompletion() {
            let cleanCells = 0;
            let totalCells = rows * cols;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (!grid[i][j].dirty) cleanCells++;
                }
            }
            const percentage = Math.floor((cleanCells / totalCells) * 100);
            document.getElementById('wash-progress').textContent = `${percentage}% clean`;

            if (percentage >= 95) {
                showSuccessMessage();
                setTimeout(() => completeLevel(9), 1000);
            }
        }

        draw();
    }

    // Level 10: Symmetry Draw
    function loadLevel10() {
        gameArea.innerHTML = `
            <h2>Level 10: Symmetry Draw 🎨</h2>
            <p>Draw on one side and watch the mirror effect! Fill both sides to complete.</p>
            <div id="symmetry-container">
                <canvas id="symmetry-canvas"></canvas>
                <div id="symmetry-progress">0% filled</div>
            </div>
        `;

        const canvas = document.getElementById('symmetry-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('symmetry-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, 0);
        ctx.lineTo(canvasWidth / 2, canvasHeight);
        ctx.stroke();

        let isDrawing = false;
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f77f00'];
        let currentColor = colors[0];

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        function drawSymmetric(x, y) {
            const centerX = canvasWidth / 2;
            const mirrorX = centerX + (centerX - x);

            ctx.fillStyle = currentColor;
            ctx.globalAlpha = 0.8;
            
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(mirrorX, y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getMousePos(e);
            drawSymmetric(pos.x, pos.y);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const pos = getMousePos(e);
                drawSymmetric(pos.x, pos.y);
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            checkCompletion();
        });

        setInterval(() => {
            currentColor = colors[Math.floor(Math.random() * colors.length)];
        }, 2000);

        function checkCompletion() {
            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            const data = imageData.data;
            let coloredPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r !== 250 || g !== 250 || b !== 250) {
                    coloredPixels++;
                }
            }
            const percentage = Math.floor((coloredPixels / (canvasWidth * canvasHeight)) * 100);
            document.getElementById('symmetry-progress').textContent = `${percentage}% filled`;

            if (percentage >= 70) {
                showSuccessMessage();
                setTimeout(() => completeLevel(10), 1000);
            }
        }
    }

    // Level 11: Pixel Art Reveal
    function loadLevel11() {
        gameArea.innerHTML = `
            <h2>Level 11: Pixel Art Reveal 🎨</h2>
            <p>Click tiles to reveal the hidden pixel art!</p>
            <div id="pixel-container">
                <canvas id="pixel-canvas"></canvas>
                <div id="pixel-progress">0% revealed</div>
            </div>
        `;

        const canvas = document.getElementById('pixel-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('pixel-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const gridSize = 20;
        const cols = Math.floor(canvasWidth / gridSize);
        const rows = Math.floor(canvasHeight / gridSize);
        const grid = [];

        // Simple heart pattern
        const pattern = [
            [0,0,1,1,0,0,0,1,1,0,0],
            [0,1,1,1,1,0,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0],
        ];

        const offsetX = Math.floor((cols - pattern[0].length) / 2);
        const offsetY = Math.floor((rows - pattern.length) / 2);

        for (let i = 0; i < rows; i++) {
            grid[i] = [];
            for (let j = 0; j < cols; j++) {
                const patternRow = i - offsetY;
                const patternCol = j - offsetX;
                const isPattern = patternRow >= 0 && patternRow < pattern.length && 
                                patternCol >= 0 && patternCol < pattern[0].length &&
                                pattern[patternRow][patternCol] === 1;
                grid[i][j] = { revealed: false, isPattern: isPattern };
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const cell = grid[i][j];
                    if (cell.revealed) {
                        ctx.fillStyle = cell.isPattern ? '#e63946' : '#f1faee';
                    } else {
                        ctx.fillStyle = '#457b9d';
                    }
                    ctx.fillRect(j * gridSize, i * gridSize, gridSize - 1, gridSize - 1);
                }
            }
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / gridSize);
            const row = Math.floor(y / gridSize);

            if (row >= 0 && row < rows && col >= 0 && col < cols && !grid[row][col].revealed) {
                grid[row][col].revealed = true;
                draw();
                checkCompletion();
            }
        });

        function checkCompletion() {
            let revealed = 0;
            let total = rows * cols;
            grid.forEach(row => row.forEach(cell => { if (cell.revealed) revealed++; }));
            const percentage = Math.floor((revealed / total) * 100);
            document.getElementById('pixel-progress').textContent = `${percentage}% revealed`;

            if (percentage >= 95) {
                showSuccessMessage();
                setTimeout(() => completeLevel(11), 1000);
            }
        }

        draw();
    }

    // Level 12: Color Match
    function loadLevel12() {
        gameArea.innerHTML = `
            <h2>Level 12: Color Match 🌈</h2>
            <p>Match the target color by adjusting RGB sliders!</p>
            <div id="colormatch-container">
                <div id="target-color" style="width:200px;height:200px;margin:20px auto;border:5px solid #d4a373;border-radius:15px;"></div>
                <div id="your-color" style="width:200px;height:200px;margin:20px auto;border:5px solid #d4a373;border-radius:15px;background:#000;"></div>
                <div style="padding:20px;">
                    <label>Red: <input type="range" id="red-slider" min="0" max="255" value="0"></label><span id="red-val">0</span><br><br>
                    <label>Green: <input type="range" id="green-slider" min="0" max="255" value="0"></label><span id="green-val">0</span><br><br>
                    <label>Blue: <input type="range" id="blue-slider" min="0" max="255" value="0"></label><span id="blue-val">0</span>
                </div>
                <div id="colormatch-progress">Accuracy: 0%</div>
            </div>
        `;

        const targetR = Math.floor(Math.random() * 256);
        const targetG = Math.floor(Math.random() * 256);
        const targetB = Math.floor(Math.random() * 256);

        document.getElementById('target-color').style.background = `rgb(${targetR}, ${targetG}, ${targetB})`;

        const sliders = {
            red: document.getElementById('red-slider'),
            green: document.getElementById('green-slider'),
            blue: document.getElementById('blue-slider')
        };

        function updateColor() {
            const r = parseInt(sliders.red.value);
            const g = parseInt(sliders.green.value);
            const b = parseInt(sliders.blue.value);

            document.getElementById('your-color').style.background = `rgb(${r}, ${g}, ${b})`;
            document.getElementById('red-val').textContent = r;
            document.getElementById('green-val').textContent = g;
            document.getElementById('blue-val').textContent = b;

            const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
            const accuracy = Math.max(0, 100 - Math.floor((diff / 765) * 100));
            document.getElementById('colormatch-progress').textContent = `Accuracy: ${accuracy}%`;

            if (accuracy >= 95) {
                showSuccessMessage();
                setTimeout(() => completeLevel(12), 1000);
            }
        }

        Object.values(sliders).forEach(slider => slider.addEventListener('input', updateColor));
    }

    // Level 13: Pop the Balloons
    function loadLevel13() {
        gameArea.innerHTML = `
            <h2>Level 13: Pop the Balloons 🎈</h2>
            <p>Pop all the rising balloons before they escape!</p>
            <div id="balloon-container">
                <canvas id="balloon-canvas"></canvas>
                <div id="balloon-progress">0/20 popped</div>
            </div>
        `;

        const canvas = document.getElementById('balloon-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('balloon-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 450;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const balloons = [];
        let poppedCount = 0;
        const totalBalloons = 20;
        let spawnTimer = 0;

        function spawnBalloon() {
            if (balloons.filter(b => !b.popped).length < 8 && balloons.length < totalBalloons) {
                balloons.push({
                    x: Math.random() * (canvasWidth - 60) + 30,
                    y: canvasHeight + 50,
                    radius: 25,
                    vy: -1 - Math.random() * 1.5,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    popped: false,
                    wobble: Math.random() * Math.PI * 2
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            balloons.forEach(balloon => {
                if (!balloon.popped) {
                    const wobbleX = Math.sin(balloon.wobble) * 5;
                    
                    ctx.fillStyle = balloon.color;
                    ctx.beginPath();
                    ctx.ellipse(balloon.x + wobbleX, balloon.y, balloon.radius, balloon.radius * 1.2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.strokeStyle = balloon.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(balloon.x + wobbleX, balloon.y + balloon.radius * 1.2);
                    ctx.lineTo(balloon.x + wobbleX, balloon.y + balloon.radius * 1.2 + 30);
                    ctx.stroke();
                }
            });
        }

        function update() {
            balloons.forEach(balloon => {
                if (!balloon.popped) {
                    balloon.y += balloon.vy;
                    balloon.wobble += 0.05;
                }
            });

            for (let i = balloons.length - 1; i >= 0; i--) {
                if (balloons[i].y < -100 && !balloons[i].popped) {
                    balloons.splice(i, 1);
                    spawnBalloon();
                }
            }

            spawnTimer++;
            if (spawnTimer > 60) {
                spawnBalloon();
                spawnTimer = 0;
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            balloons.forEach(balloon => {
                if (!balloon.popped) {
                    const wobbleX = Math.sin(balloon.wobble) * 5;
                    const dist = Math.sqrt((x - (balloon.x + wobbleX)) ** 2 + (y - balloon.y) ** 2);
                    if (dist <= balloon.radius) {
                        balloon.popped = true;
                        poppedCount++;
                        document.getElementById('balloon-progress').textContent = `${poppedCount}/20 popped`;

                        if (poppedCount >= totalBalloons) {
                            showSuccessMessage();
                            setTimeout(() => completeLevel(13), 1000);
                        }
                    }
                }
            });
        });

        spawnBalloon();
        gameLoop();
    }

    // Level 14: Maze Trace
    function loadLevel14() {
        gameArea.innerHTML = `
            <h2>Level 14: Maze Trace 🧩</h2>
            <p>Trace the path from start to finish without lifting your finger!</p>
            <div id="maze-container">
                <canvas id="maze-canvas"></canvas>
                <div id="maze-progress">Keep tracing...</div>
            </div>
        `;

        const canvas = document.getElementById('maze-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('maze-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const path = [
            {x: 50, y: 200},
            {x: 150, y: 100},
            {x: 250, y: 150},
            {x: 350, y: 80},
            {x: 450, y: 200},
            {x: 550, y: 150},
            {x: 650, y: 250},
            {x: 700, y: 200}
        ];

        let isTracing = false;
        let currentProgress = 0;
        const tracedPath = [];

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.strokeStyle = '#d4a373';
            ctx.lineWidth = 25;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();

            ctx.fillStyle = '#90a955';
            ctx.beginPath();
            ctx.arc(path[0].x, path[0].y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e63946';
            ctx.beginPath();
            ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 15, 0, Math.PI * 2);
            ctx.fill();

            if (tracedPath.length > 1) {
                ctx.strokeStyle = '#457b9d';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(tracedPath[0].x, tracedPath[0].y);
                for (let i = 1; i < tracedPath.length; i++) {
                    ctx.lineTo(tracedPath[i].x, tracedPath[i].y);
                }
                ctx.stroke();
            }
        }

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        function checkNearPath(pos) {
            for (let i = 0; i < path.length - 1; i++) {
                const dist = distanceToSegment(pos, path[i], path[i + 1]);
                if (dist < 20) return true;
            }
            return false;
        }

        function distanceToSegment(p, v, w) {
            const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
            if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
            let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
        }

        canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            const dist = Math.sqrt((pos.x - path[0].x) ** 2 + (pos.y - path[0].y) ** 2);
            if (dist < 25) {
                isTracing = true;
                tracedPath.length = 0;
                tracedPath.push(pos);
                currentProgress = 0;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isTracing) {
                const pos = getMousePos(e);
                tracedPath.push(pos);
                draw();

                const endDist = Math.sqrt((pos.x - path[path.length - 1].x) ** 2 + (pos.y - path[path.length - 1].y) ** 2);
                if (endDist < 25 && tracedPath.length > 50) {
                    isTracing = false;
                    showSuccessMessage();
                    setTimeout(() => completeLevel(14), 1000);
                }
            }
        });

        canvas.addEventListener('mouseup', () => {
            isTracing = false;
        });

        draw();
    }

    // Level 15: Satisfying Peel
    function loadLevel15() {
        gameArea.innerHTML = `
            <h2>Level 15: Satisfying Peel 📱</h2>
            <p>Peel off the protective film slowly and carefully!</p>
            <div id="peel-container">
                <canvas id="peel-canvas"></canvas>
                <div id="peel-progress">0% peeled</div>
            </div>
        `;

        const canvas = document.getElementById('peel-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('peel-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const gridSize = 10;
        const cols = Math.floor(canvasWidth / gridSize);
        const rows = Math.floor(canvasHeight / gridSize);
        const grid = [];

        for (let i = 0; i < rows; i++) {
            grid[i] = [];
            for (let j = 0; j < cols; j++) {
                grid[i][j] = { peeled: false };
            }
        }

        let isPeeling = false;
        let lastPeelPos = null;

        function draw() {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (!grid[i][j].peeled) {
                        const gradient = ctx.createLinearGradient(j * gridSize, i * gridSize, (j + 1) * gridSize, (i + 1) * gridSize);
                        gradient.addColorStop(0, 'rgba(100, 150, 255, 0.7)');
                        gradient.addColorStop(1, 'rgba(150, 200, 255, 0.5)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                    }
                }
            }
        }

        function peel(e) {
            if (!isPeeling) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / gridSize);
            const row = Math.floor(y / gridSize);

            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                if (lastPeelPos) {
                    const rowDiff = Math.abs(row - lastPeelPos.row);
                    const colDiff = Math.abs(col - lastPeelPos.col);
                    if (rowDiff <= 1 && colDiff <= 1) {
                        grid[row][col].peeled = true;
                        lastPeelPos = {row, col};
                    } else {
                        isPeeling = false;
                    }
                } else {
                    grid[row][col].peeled = true;
                    lastPeelPos = {row, col};
                }

                draw();
                checkCompletion();
            }
        }

        canvas.addEventListener('mousedown', (e) => {
            isPeeling = true;
            lastPeelPos = null;
            peel(e);
        });

        canvas.addEventListener('mousemove', peel);

        canvas.addEventListener('mouseup', () => {
            isPeeling = false;
            lastPeelPos = null;
        });

        function checkCompletion() {
            let peeled = 0;
            let total = rows * cols;
            grid.forEach(row => row.forEach(cell => { if (cell.peeled) peeled++; }));
            const percentage = Math.floor((peeled / total) * 100);
            document.getElementById('peel-progress').textContent = `${percentage}% peeled`;

            if (percentage >= 95) {
                showSuccessMessage();
                setTimeout(() => completeLevel(15), 1000);
            }
        }

        draw();
    }

    // Level 16: Tap the Beat
    function loadLevel16() {
        gameArea.innerHTML = `
            <h2>Level 16: Tap the Beat 🎵</h2>
            <p>Tap the circles when they reach the target!</p>
            <div id="beat-container">
                <canvas id="beat-canvas"></canvas>
                <div id="beat-score">Score: 0/20</div>
            </div>
        `;

        const canvas = document.getElementById('beat-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('beat-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const lanes = [
            {x: canvasWidth * 0.25, y: canvasHeight - 80},
            {x: canvasWidth * 0.5, y: canvasHeight - 80},
            {x: canvasWidth * 0.75, y: canvasHeight - 80}
        ];

        const notes = [];
        let score = 0;
        let spawnTimer = 0;
        const targetScore = 20;

        function spawnNote() {
            if (score < targetScore) {
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                notes.push({
                    x: lane.x,
                    y: 0,
                    laneX: lane.x,
                    speed: 3,
                    hit: false
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            lanes.forEach(lane => {
                ctx.strokeStyle = '#d4a373';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(lane.x, 0);
                ctx.lineTo(lane.x, canvasHeight);
                ctx.stroke();

                ctx.strokeStyle = '#e63946';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(lane.x, lane.y, 40, 0, Math.PI * 2);
                ctx.stroke();
            });

            notes.forEach(note => {
                if (!note.hit) {
                    const gradient = ctx.createRadialGradient(note.x, note.y, 5, note.x, note.y, 25);
                    gradient.addColorStop(0, '#90a955');
                    gradient.addColorStop(1, '#7f9549');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(note.x, note.y, 25, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        function update() {
            notes.forEach(note => {
                if (!note.hit) {
                    note.y += note.speed;
                }
            });

            for (let i = notes.length - 1; i >= 0; i--) {
                if (notes[i].y > canvasHeight + 50) {
                    notes.splice(i, 1);
                }
            }

            spawnTimer++;
            if (spawnTimer > 50) {
                spawnNote();
                spawnTimer = 0;
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            lanes.forEach(lane => {
                if (Math.abs(x - lane.x) < 50) {
                    notes.forEach(note => {
                        if (!note.hit && note.laneX === lane.x) {
                            const dist = Math.abs(note.y - lane.y);
                            if (dist < 50) {
                                note.hit = true;
                                score++;
                                document.getElementById('beat-score').textContent = `Score: ${score}/20`;

                                if (score >= targetScore) {
                                    showSuccessMessage();
                                    setTimeout(() => completeLevel(16), 1000);
                                }
                            }
                        }
                    });
                }
            });
        });

        spawnNote();
        gameLoop();
    }

    // Level 17: Zipper
    function loadLevel17() {
        gameArea.innerHTML = `
            <h2>Level 17: Smooth Zipper 🔗</h2>
            <p>Drag the zipper slider to zip it up!</p>
            <div id="zipper-container">
                <canvas id="zipper-canvas"></canvas>
                <div id="zipper-progress">0% zipped</div>
            </div>
        `;

        const canvas = document.getElementById('zipper-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('zipper-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let sliderY = canvasHeight - 50;
        let isDragging = false;
        const zipperX = canvasWidth / 2;

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            const zippedHeight = canvasHeight - sliderY;
            const totalHeight = canvasHeight - 50;
            const progress = Math.floor((zippedHeight / totalHeight) * 100);
            document.getElementById('zipper-progress').textContent = `${progress}% zipped`;

            for (let y = 50; y < canvasHeight - 20; y += 15) {
                const isZipped = y > sliderY;
                
                ctx.fillStyle = isZipped ? '#457b9d' : '#adb5bd';
                ctx.fillRect(zipperX - 30, y, 12, 10);
                ctx.fillRect(zipperX + 18, y, 12, 10);
            }

            ctx.strokeStyle = '#60492c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(zipperX - 30, sliderY);
            ctx.lineTo(zipperX + 30, sliderY);
            ctx.stroke();

            ctx.fillStyle = '#e9c46a';
            ctx.fillRect(zipperX - 20, sliderY - 15, 40, 30);
            ctx.strokeStyle = '#60492c';
            ctx.strokeRect(zipperX - 20, sliderY - 15, 40, 30);

            if (progress >= 95) {
                showSuccessMessage();
                setTimeout(() => completeLevel(17), 1000);
            }
        }

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const x = e.clientX - rect.left;

            if (Math.abs(y - sliderY) < 20 && Math.abs(x - zipperX) < 30) {
                isDragging = true;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = canvas.getBoundingClientRect();
                let y = e.clientY - rect.top;
                sliderY = Math.max(50, Math.min(canvasHeight - 50, y));
                draw();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        draw();
    }

    // Level 18: Falling Sand
    function loadLevel18() {
        gameArea.innerHTML = `
            <h2>Level 18: Falling Sand ⏳</h2>
            <p>Fill the container with sand by clicking!</p>
            <div id="sand-container">
                <canvas id="sand-canvas"></canvas>
                <div id="sand-progress">0% filled</div>
            </div>
        `;

        const canvas = document.getElementById('sand-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('sand-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const gridSize = 4;
        const cols = Math.floor(canvasWidth / gridSize);
        const rows = Math.floor(canvasHeight / gridSize);
        const grid = [];

        for (let i = 0; i < rows; i++) {
            grid[i] = [];
            for (let j = 0; j < cols; j++) {
                grid[i][j] = 0;
            }
        }

        const particles = [];

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.fillStyle = '#e9c46a';
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (grid[i][j] === 1) {
                        ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                    }
                }
            }

            particles.forEach(p => {
                ctx.fillStyle = '#e9c46a';
                ctx.fillRect(p.x, p.y, 3, 3);
            });
        }

        function update() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.y += 2;

                const row = Math.floor(p.y / gridSize);
                const col = Math.floor(p.x / gridSize);

                if (row >= 0 && row < rows && col >= 0 && col < cols) {
                    if (row === rows - 1 || grid[row + 1][col] === 1) {
                        grid[row][col] = 1;
                        particles.splice(i, 1);
                    } else if (col > 0 && grid[row + 1][col - 1] === 0 && Math.random() < 0.5) {
                        p.x -= gridSize;
                    } else if (col < cols - 1 && grid[row + 1][col + 1] === 0 && Math.random() < 0.5) {
                        p.x += gridSize;
                    }
                }

                if (p.y > canvasHeight) {
                    particles.splice(i, 1);
                }
            }
        }

        function gameLoop() {
            update();
            draw();
            checkCompletion();
            requestAnimationFrame(gameLoop);
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;

            for (let i = 0; i < 15; i++) {
                particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: 0
                });
            }
        });

        function checkCompletion() {
            let filled = 0;
            const checkRows = 20;
            for (let i = rows - checkRows; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (grid[i][j] === 1) filled++;
                }
            }
            const percentage = Math.floor((filled / (checkRows * cols)) * 100);
            document.getElementById('sand-progress').textContent = `${percentage}% filled`;

            if (percentage >= 85) {
                showSuccessMessage();
                setTimeout(() => completeLevel(18), 1000);
            }
        }

        gameLoop();
    }

    // Level 19: Flip the Cards
    function loadLevel19() {
        gameArea.innerHTML = `
            <h2>Level 19: Memory Match 🃏</h2>
            <p>Find all matching pairs!</p>
            <div id="cards-container" style="display:grid;grid-template-columns:repeat(4,80px);gap:15px;justify-content:center;margin-top:20px;"></div>
            <div id="cards-progress">0/8 pairs found</div>
        `;

        const container = document.getElementById('cards-container');
        const emojis = ['🌟', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹'];
        const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
        let flipped = [];
        let matched = 0;

        cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.dataset.index = index;
            card.style.cssText = 'width:80px;height:80px;background:#457b9d;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:40px;cursor:pointer;transition:all 0.3s;';
            card.textContent = '?';

            card.addEventListener('click', () => {
                if (flipped.length < 2 && !card.classList.contains('matched') && !flipped.includes(card)) {
                    card.style.background = '#90a955';
                    card.textContent = emoji;
                    flipped.push(card);

                    if (flipped.length === 2) {
                        setTimeout(() => {
                            if (flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
                                flipped.forEach(c => {
                                    c.classList.add('matched');
                                    c.style.background = '#66bb6a';
                                });
                                matched++;
                                document.getElementById('cards-progress').textContent = `${matched}/8 pairs found`;

                                if (matched === 8) {
                                    showSuccessMessage();
                                    setTimeout(() => completeLevel(19), 1000);
                                }
                            } else {
                                flipped.forEach(c => {
                                    c.style.background = '#457b9d';
                                    c.textContent = '?';
                                });
                            }
                            flipped = [];
                        }, 800);
                    }
                }
            });

            container.appendChild(card);
        });
    }

    // Level 20: Connect the Dots
    function loadLevel20() {
        gameArea.innerHTML = `
            <h2>Level 20: Connect the Dots ⭐</h2>
            <p>Connect all dots in order!</p>
            <div id="dots-container">
                <canvas id="dots-canvas"></canvas>
                <div id="dots-progress">Start from dot 1</div>
            </div>
        `;

        const canvas = document.getElementById('dots-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('dots-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const dots = [
            {x: 100, y: 200, num: 1, connected: false},
            {x: 200, y: 100, num: 2, connected: false},
            {x: 300, y: 150, num: 3, connected: false},
            {x: 400, y: 80, num: 4, connected: false},
            {x: 500, y: 180, num: 5, connected: false},
            {x: 600, y: 250, num: 6, connected: false},
            {x: 500, y: 320, num: 7, connected: false},
            {x: 400, y: 300, num: 8, connected: false},
            {x: 300, y: 350, num: 9, connected: false},
            {x: 200, y: 300, num: 10, connected: false}
        ];

        let currentDot = 0;
        const connections = [];

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.strokeStyle = '#457b9d';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < connections.length - 1; i++) {
                ctx.moveTo(connections[i].x, connections[i].y);
                ctx.lineTo(connections[i + 1].x, connections[i + 1].y);
            }
            ctx.stroke();

            dots.forEach(dot => {
                ctx.fillStyle = dot.connected ? '#90a955' : '#e9c46a';
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#60492c';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dot.num, dot.x, dot.y);
            });
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            dots.forEach(dot => {
                const dist = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
                if (dist < 25 && dot.num === currentDot + 1) {
                    dot.connected = true;
                    connections.push({x: dot.x, y: dot.y});
                    currentDot++;
                    document.getElementById('dots-progress').textContent = `${currentDot}/10 dots connected`;

                    if (currentDot === 10) {
                        showSuccessMessage();
                        setTimeout(() => completeLevel(20), 1000);
                    }

                    draw();
                }
            });
        });

        draw();
    }

    // Level 21: Scratch Card
    function loadLevel21() {
        gameArea.innerHTML = `
            <h2>Level 21: Scratch Card 💳</h2>
            <p>Scratch to reveal your prize!</p>
            <div id="scratch-container">
                <canvas id="scratch-canvas"></canvas>
                <div id="scratch-progress">0% scratched</div>
            </div>
        `;

        const canvas = document.getElementById('scratch-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('scratch-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 300;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = '#f77f00';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎉 WINNER! 🎉', canvasWidth / 2, canvasHeight / 2);

        ctx.fillStyle = '#999';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        let isScratching = false;

        function scratch(e) {
            if (!isScratching) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        canvas.addEventListener('mousedown', (e) => {
            isScratching = true;
            scratch(e);
        });

        canvas.addEventListener('mousemove', scratch);

        canvas.addEventListener('mouseup', () => {
            isScratching = false;
            checkCompletion();
        });

        function checkCompletion() {
            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            const data = imageData.data;
            let transparent = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] === 0) transparent++;
            }
            const percentage = Math.floor((transparent / (canvasWidth * canvasHeight)) * 100);
            document.getElementById('scratch-progress').textContent = `${percentage}% scratched`;

            if (percentage >= 70) {
                showSuccessMessage();
                setTimeout(() => completeLevel(21), 1000);
            }
        }
    }

    // Level 22: Whack-a-Mole
    function loadLevel22() {
        gameArea.innerHTML = `
            <h2>Level 22: Whack-a-Mole 🔨</h2>
            <p>Hit the moles! Get 20 hits to win!</p>
            <div id="mole-container" style="display:grid;grid-template-columns:repeat(3,120px);gap:20px;justify-content:center;margin-top:30px;"></div>
            <div id="mole-score">Hits: 0/20</div>
        `;

        const container = document.getElementById('mole-container');
        const holes = [];
        let score = 0;

        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.style.cssText = 'width:120px;height:100px;background:#8b4513;border-radius:60px 60px 0 0;position:relative;overflow:hidden;cursor:pointer;';
            
            const mole = document.createElement('div');
            mole.style.cssText = 'width:80px;height:80px;background:#d2691e;border-radius:50%;position:absolute;bottom:-80px;left:20px;transition:bottom 0.3s;font-size:40px;display:flex;align-items:center;justify-content:center;';
            mole.textContent = '🐹';
            
            hole.appendChild(mole);
            container.appendChild(hole);
            holes.push({hole, mole, active: false});

            hole.addEventListener('click', () => {
                if (holes[i].active) {
                    mole.style.bottom = '-80px';
                    holes[i].active = false;
                    score++;
                    document.getElementById('mole-score').textContent = `Hits: ${score}/20`;

                    if (score >= 20) {
                        showSuccessMessage();
                        setTimeout(() => completeLevel(22), 1000);
                    }
                }
            });
        }

        function popMole() {
            const available = holes.filter(h => !h.active);
            if (available.length > 0) {
                const random = available[Math.floor(Math.random() * available.length)];
                random.active = true;
                random.mole.style.bottom = '10px';

                setTimeout(() => {
                    random.mole.style.bottom = '-80px';
                    random.active = false;
                }, 1200);
            }
        }

        setInterval(popMole, 800);
    }

    // Level 23: Spiral Draw
    function loadLevel23() {
        gameArea.innerHTML = `
            <h2>Level 23: Spiral Draw 🌀</h2>
            <p>Draw a spiral! Follow the path smoothly.</p>
            <div id="spiral-container">
                <canvas id="spiral-canvas"></canvas>
                <div id="spiral-progress">Draw the spiral...</div>
            </div>
        `;

        const canvas = document.getElementById('spiral-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('spiral-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 400;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        let isDrawing = false;
        const drawnPath = [];

        function drawGuide() {
            ctx.strokeStyle = 'rgba(212, 163, 115, 0.3)';
            ctx.lineWidth = 20;
            ctx.beginPath();
            for (let i = 0; i < 360 * 3; i++) {
                const angle = (i * Math.PI) / 180;
                const radius = i / 5;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            drawGuide();

            if (drawnPath.length > 1) {
                ctx.strokeStyle = '#457b9d';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(drawnPath[0].x, drawnPath[0].y);
                for (let i = 1; i < drawnPath.length; i++) {
                    ctx.lineTo(drawnPath[i].x, drawnPath[i].y);
                }
                ctx.stroke();
            }
        }

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {x: e.clientX - rect.left, y: e.clientY - rect.top};
        }

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            drawnPath.length = 0;
            drawnPath.push(getMousePos(e));
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                drawnPath.push(getMousePos(e));
                draw();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            if (drawnPath.length > 200) {
                showSuccessMessage();
                setTimeout(() => completeLevel(23), 1000);
            }
        });

        draw();
    }

    // Level 24: Bubble Sort Visual
    function loadLevel24() {
        gameArea.innerHTML = `
            <h2>Level 24: Sort the Bars 📊</h2>
            <p>Click bars to swap them until they're sorted!</p>
            <div id="sort-container">
                <canvas id="sort-canvas"></canvas>
                <div id="sort-progress">Sort from shortest to tallest</div>
            </div>
        `;

        const canvas = document.getElementById('sort-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('sort-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 350;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const bars = Array.from({length: 10}, (_, i) => ({
            height: (i + 1) * 30,
            color: `hsl(${i * 36}, 70%, 60%)`
        })).sort(() => Math.random() - 0.5);

        let selected = null;

        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            const barWidth = 60;
            const spacing = 10;

            bars.forEach((bar, i) => {
                ctx.fillStyle = selected === i ? '#e63946' : bar.color;
                const x = i * (barWidth + spacing) + 50;
                const y = canvasHeight - bar.height - 20;
                ctx.fillRect(x, y, barWidth, bar.height);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(x, y, barWidth, bar.height);
            });
        }

        function isSorted() {
            for (let i = 0; i < bars.length - 1; i++) {
                if (bars[i].height > bars[i + 1].height) return false;
            }
            return true;
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const index = Math.floor((x - 50) / 70);

            if (index >= 0 && index < bars.length) {
                if (selected === null) {
                    selected = index;
                } else {
                    [bars[selected], bars[index]] = [bars[index], bars[selected]];
                    selected = null;

                    if (isSorted()) {
                        showSuccessMessage();
                        setTimeout(() => completeLevel(24), 1000);
                    }
                }
                draw();
            }
        });

        draw();
    }

    // Level 25: Fireworks Finale
    function loadLevel25() {
        gameArea.innerHTML = `
            <h2>Level 25: Fireworks Finale 🎆</h2>
            <p>Click to create fireworks! Create 30 beautiful explosions!</p>
            <div id="fireworks-container">
                <canvas id="fireworks-canvas"></canvas>
                <div id="fireworks-score">Fireworks: 0/30</div>
            </div>
        `;

        const canvas = document.getElementById('fireworks-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('fireworks-container');

        let canvasWidth = container.clientWidth;
        let canvasHeight = 450;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const particles = [];
        let fireworkCount = 0;

        function createFirework(x, y) {
            const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            for (let i = 0; i < 50; i++) {
                const angle = (Math.PI * 2 * i) / 50;
                const speed = 2 + Math.random() * 3;
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 100,
                    color: color
                });
            }
            fireworkCount++;
            document.getElementById('fireworks-score').textContent = `Fireworks: ${fireworkCount}/30`;

            if (fireworkCount >= 30) {
                setTimeout(() => {
                    showSuccessMessage();
                    setTimeout(() => completeLevel(25), 1000);
                }, 500);
            }
        }

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            particles.forEach((p, i) => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 100;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        }

        function update() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.life -= 2;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createFirework(x, y);
        });

        ctx.fillStyle = '#000014';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        gameLoop();
    }

    // Level 26: Circle Clicker
    function loadLevel26() {
        gameArea.innerHTML = `<h2>Level 26: Circle Clicker ⭕</h2><p>Click all the circles as fast as you can!</p><div id="circle-container"><canvas id="circle-canvas"></canvas><div id="circle-progress">0/30 clicked</div></div>`;
        const canvas = document.getElementById('circle-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 750; canvas.height = 400;
        const circles = Array.from({length: 30}, () => ({x: Math.random() * 700 + 25, y: Math.random() * 350 + 25, r: 20, clicked: false}));
        let clicked = 0;
        function draw() {
            ctx.clearRect(0, 0, 750, 400);
            circles.forEach(c => {
                if (!c.clicked) {
                    ctx.fillStyle = '#e63946';
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        canvas.onclick = e => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            circles.forEach(c => {
                if (!c.clicked && Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) < c.r) {
                    c.clicked = true;
                    clicked++;
                    document.getElementById('circle-progress').textContent = `${clicked}/30 clicked`;
                    if (clicked === 30) { showSuccessMessage(); setTimeout(() => completeLevel(26), 1000); }
                    draw();
                }
            });
        };
        draw();
    }

    // Level 27: Rain Drop
    function loadLevel27() {
        gameArea.innerHTML = `<h2>Level 27: Rain Drop 🌧️</h2><p>Catch 50 raindrops in the bucket!</p><div><canvas id="rain-canvas"></canvas><div id="rain-score">0/50 caught</div></div>`;
        const canvas = document.getElementById('rain-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 750; canvas.height = 400;
        const drops = [];
        let bucketX = 350, caught = 0;
        function spawn() { if (drops.length < 10 && caught < 50) drops.push({x: Math.random() * 700, y: 0, vy: 3 + Math.random()}); }
        function draw() {
            ctx.clearRect(0, 0, 750, 400);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(bucketX, 350, 80, 40);
            ctx.fillStyle = '#4a90e2';
            drops.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2); ctx.fill(); });
        }
        function update() {
            drops.forEach((d, i) => {
                d.y += d.vy;
                if (d.y > 350 && d.x > bucketX && d.x < bucketX + 80) {
                    caught++;
                    document.getElementById('rain-score').textContent = `${caught}/50 caught`;
                    drops.splice(i, 1);
                    if (caught === 50) { showSuccessMessage(); setTimeout(() => completeLevel(27), 1000); }
                } else if (d.y > 400) drops.splice(i, 1);
            });
            if (Math.random() < 0.05) spawn();
        }
        canvas.onmousemove = e => { bucketX = e.clientX - canvas.getBoundingClientRect().left - 40; };
        setInterval(() => { update(); draw(); }, 30);
    }

    // Level 28: Target Practice
    function loadLevel28() {
        gameArea.innerHTML = `<h2>Level 28: Target Practice 🎯</h2><p>Hit the bullseye 15 times!</p><div><canvas id="target-canvas"></canvas><div id="target-score">0/15 hits</div></div>`;
        const canvas = document.getElementById('target-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 750; canvas.height = 400;
        let targetX = 375, targetY = 200, hits = 0;
        function draw() {
            ctx.clearRect(0, 0, 750, 400);
            [40, 30, 20, 10].forEach((r, i) => {
                ctx.fillStyle = ['#e63946', '#fff', '#e63946', '#fff'][i];
                ctx.beginPath();
                ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        canvas.onclick = e => {
            const rect = canvas.getBoundingClientRect();
            const dist = Math.sqrt((e.clientX - rect.left - targetX) ** 2 + (e.clientY - rect.top - targetY) ** 2);
            if (dist < 40) {
                hits++;
                document.getElementById('target-score').textContent = `${hits}/15 hits`;
                targetX = Math.random() * 650 + 50;
                targetY = Math.random() * 300 + 50;
                if (hits === 15) { showSuccessMessage(); setTimeout(() => completeLevel(28), 1000); }
                draw();
            }
        };
        draw();
    }

    // Level 29: Color Flood
    function loadLevel29() {
        gameArea.innerHTML = `<h2>Level 29: Color Flood 🌊</h2><p>Fill the grid with one color!</p><div id="flood-btns"></div><div><canvas id="flood-canvas"></canvas></div>`;
        const canvas = document.getElementById('flood-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 400;
        const size = 20, grid = [];
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f77f00'];
        for (let i = 0; i < size; i++) { grid[i] = []; for (let j = 0; j < size; j++) grid[i][j] = Math.floor(Math.random() * 5); }
        function draw() {
            for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
                ctx.fillStyle = colors[grid[i][j]];
                ctx.fillRect(j * 20, i * 20, 20, 20);
            }
        }
        function flood(target, replacement, i = 0, j = 0) {
            if (i < 0 || i >= size || j < 0 || j >= size || grid[i][j] !== target || grid[i][j] === replacement) return;
            grid[i][j] = replacement;
            flood(target, replacement, i + 1, j);
            flood(target, replacement, i - 1, j);
            flood(target, replacement, i, j + 1);
            flood(target, replacement, i, j - 1);
        }
        colors.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.style.cssText = `background:${c};width:50px;height:50px;margin:5px;border:none;cursor:pointer;border-radius:8px;`;
            btn.onclick = () => {
                const current = grid[0][0];
                if (current !== idx) {
                    flood(current, idx);
                    draw();
                    if (grid.every(row => row.every(cell => cell === grid[0][0]))) {
                        showSuccessMessage();
                        setTimeout(() => completeLevel(29), 1000);
                    }
                }
            };
            document.getElementById('flood-btns').appendChild(btn);
        });
        draw();
    }

    // Level 30: Speed Typer
    function loadLevel30() {
        gameArea.innerHTML = `<h2>Level 30: Speed Typer ⌨️</h2><p>Type the word shown!</p><div id="type-word" style="font-size:3rem;margin:20px;"></div><input id="type-input" style="font-size:1.5rem;padding:10px;"><div id="type-score">0/10 words</div>`;
        const words = ['HAPPY', 'SMILE', 'PEACE', 'LIGHT', 'DREAM', 'MAGIC', 'OCEAN', 'DANCE', 'MUSIC', 'STARS'];
        let idx = 0;
        document.getElementById('type-word').textContent = words[idx];
        document.getElementById('type-input').oninput = e => {
            if (e.target.value.toUpperCase() === words[idx]) {
                idx++;
                document.getElementById('type-score').textContent = `${idx}/10 words`;
                e.target.value = '';
                if (idx === 10) { showSuccessMessage(); setTimeout(() => completeLevel(30), 1000); }
                else document.getElementById('type-word').textContent = words[idx];
            }
        };
    }

    // Levels 31-100: More creative satisfying mini-games
    function loadLevel31() {
        gameArea.innerHTML = `<h2>Level 31: Stress Ball 🎾</h2><p>Click and hold to squeeze!</p><div><canvas id="squeeze-canvas"></canvas><div id="squeeze-progress">Keep squeezing...</div></div>`;
        const canvas = document.getElementById('squeeze-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 400;
        let size = 100, holding = false, squeezes = 0;
        function draw() {
            ctx.clearRect(0, 0, 400, 400);
            ctx.fillStyle = '#90a955';
            ctx.beginPath();
            ctx.arc(200, 200, size, 0, Math.PI * 2);
            ctx.fill();
        }
        canvas.onmousedown = () => { holding = true; };
        canvas.onmouseup = () => { holding = false; if (size < 60) { squeezes++; document.getElementById('squeeze-progress').textContent = `${squeezes}/20 squeezes`; if (squeezes === 20) { showSuccessMessage(); setTimeout(() => completeLevel(31), 1000); } } };
        setInterval(() => {
            if (holding && size > 50) size -= 2;
            else if (size < 100) size += 1;
            draw();
        }, 30);
        draw();
    }

    function loadLevel32() {
        gameArea.innerHTML = `<h2>Level 32: Laser Pointer 🔦</h2><p>Guide the laser to the target!</p><div><canvas id="laser-canvas"></canvas></div>`;
        const canvas = document.getElementById('laser-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 750; canvas.height = 400;
        let laserX = 0, laserY = 200;
        const targetX = 700, targetY = 200;
        canvas.onmousemove = e => {
            const rect = canvas.getBoundingClientRect();
            laserX = e.clientX - rect.left;
            laserY = e.clientY - rect.top;
            ctx.clearRect(0, 0, 750, 400);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 200);
            ctx.lineTo(laserX, laserY);
            ctx.stroke();
            ctx.fillStyle = '#e63946';
            ctx.fillRect(targetX - 25, targetY - 25, 50, 50);
            if (Math.abs(laserX - targetX) < 25 && Math.abs(laserY - targetY) < 25) {
                showSuccessMessage();
                setTimeout(() => completeLevel(32), 1000);
            }
        };
    }

    function loadLevel33() {
        gameArea.innerHTML = `<h2>Level 33: Bouncing Ball 🏀</h2><p>Keep the ball bouncing 30 times!</p><div><canvas id="bounce-canvas"></canvas><div id="bounce-score">0/30 bounces</div></div>`;
        const canvas = document.getElementById('bounce-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600; canvas.height = 400;
        let y = 50, vy = 0, bounces = 0;
        function draw() {
            ctx.clearRect(0, 0, 600, 400);
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(300, y, 20, 0, Math.PI * 2);
            ctx.fill();
            vy += 0.5;
            y += vy;
            if (y > 380) { y = 380; vy = -vy * 0.8; bounces++; document.getElementById('bounce-score').textContent = `${bounces}/30 bounces`; if (bounces === 30) { showSuccessMessage(); setTimeout(() => completeLevel(33), 1000); } }
        }
        setInterval(draw, 20);
    }

    function loadLevel34() {
        gameArea.innerHTML = `<h2>Level 34: Traffic Light 🚦</h2><p>Stop on red, go on green! Click when green!</p><div><canvas id="traffic-canvas"></canvas><div id="traffic-score">0/10 successes</div></div>`;
        const canvas = document.getElementById('traffic-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300; canvas.height = 400;
        let color = 'red', score = 0, canClick = false;
        function draw() {
            ctx.clearRect(0, 0, 300, 400);
            ctx.fillStyle = '#333';
            ctx.fillRect(100, 50, 100, 300);
            ctx.fillStyle = color === 'red' ? '#ff0000' : '#666';
            ctx.beginPath();
            ctx.arc(150, 120, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color === 'green' ? '#00ff00' : '#666';
            ctx.beginPath();
            ctx.arc(150, 280, 30, 0, Math.PI * 2);
            ctx.fill();
        }
        canvas.onclick = () => {
            if (color === 'green') {
                score++;
                document.getElementById('traffic-score').textContent = `${score}/10 successes`;
                if (score === 10) { showSuccessMessage(); setTimeout(() => completeLevel(34), 1000); }
            }
        };
        setInterval(() => { color = Math.random() < 0.5 ? 'red' : 'green'; draw(); }, 1500);
        draw();
    }

    function loadLevel35() {
        gameArea.innerHTML = `<h2>Level 35: Paint Mixer 🎨</h2><p>Mix colors to match the target!</p><div style="display:flex;gap:20px;justify-content:center;margin:20px;"><div id="mix-red" style="width:100px;height:100px;background:red;cursor:pointer;"></div><div id="mix-blue" style="width:100px;height:100px;background:blue;cursor:pointer;"></div></div><div id="mix-result" style="width:200px;height:100px;background:#000;margin:20px auto;"></div><div id="mix-target" style="width:200px;height:100px;background:purple;margin:20px auto;border:3px solid gold;"></div>`;
        let r = 0, b = 0;
        const target = {r: 128, b: 128};
        document.getElementById('mix-red').onclick = () => { r = Math.min(255, r + 20); update(); };
        document.getElementById('mix-blue').onclick = () => { b = Math.min(255, b + 20); update(); };
        function update() {
            document.getElementById('mix-result').style.background = `rgb(${r}, 0, ${b})`;
            if (Math.abs(r - target.r) < 30 && Math.abs(b - target.b) < 30) {
                showSuccessMessage();
                setTimeout(() => completeLevel(35), 1000);
            }
        }
    }

    function loadLevel36() {
        gameArea.innerHTML = `<h2>Level 36: Cookie Clicker 🍪</h2><p>Click the cookie 100 times!</p><div style="font-size:150px;cursor:pointer;" id="cookie">🍪</div><div id="cookie-count">0/100 clicks</div>`;
        let clicks = 0;
        document.getElementById('cookie').onclick = () => {
            clicks++;
            document.getElementById('cookie-count').textContent = `${clicks}/100 clicks`;
            if (clicks === 100) { showSuccessMessage(); setTimeout(() => completeLevel(36), 1000); }
        };
    }

    function loadLevel37() {
        gameArea.innerHTML = `<h2>Level 37: Simon Says 🎮</h2><p>Repeat the pattern!</p><div style="display:grid;grid-template-columns:repeat(2,150px);gap:10px;justify-content:center;margin:20px;"><div id="s1" style="width:150px;height:150px;background:#e63946;cursor:pointer;"></div><div id="s2" style="width:150px;height:150px;background:#457b9d;cursor:pointer;"></div><div id="s3" style="width:150px;height:150px;background:#2a9d8f;cursor:pointer;"></div><div id="s4" style="width:150px;height:150px;background:#e9c46a;cursor:pointer;"></div></div><div id="simon-score">Round: 1</div>`;
        const btns = [1,2,3,4].map(i => document.getElementById('s'+i));
        let pattern = [], input = [], round = 1;
        function flash(idx) {
            btns[idx].style.opacity = '0.5';
            setTimeout(() => btns[idx].style.opacity = '1', 200);
        }
        function showPattern() {
            pattern.push(Math.floor(Math.random() * 4));
            let i = 0;
            const interval = setInterval(() => {
                if (i < pattern.length) { flash(pattern[i]); i++; }
                else clearInterval(interval);
            }, 500);
        }
        btns.forEach((btn, idx) => {
            btn.onclick = () => {
                input.push(idx);
                flash(idx);
                if (input[input.length - 1] !== pattern[input.length - 1]) {
                    alert('Wrong! Try again');
                    input = []; pattern = []; round = 1;
                    showPattern();
                } else if (input.length === pattern.length) {
                    round++;
                    document.getElementById('simon-score').textContent = `Round: ${round}`;
                    input = [];
                    if (round > 5) { showSuccessMessage(); setTimeout(() => completeLevel(37), 1000); }
                    else setTimeout(showPattern, 1000);
                }
            };
        });
        showPattern();
    }

    function loadLevel38() {
        gameArea.innerHTML = `<h2>Level 38: Color Picker 🖍️</h2><p>Click squares matching the color!</p><div><canvas id="picker-canvas"></canvas><div id="picker-target"></div><div id="picker-score">0/20 correct</div></div>`;
        const canvas = document.getElementById('picker-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600; canvas.height = 400;
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f77f00', '#a8dadc'];
        let target = colors[0], score = 0;
        const squares = Array.from({length: 20}, () => ({x: Math.random() * 550, y: Math.random() * 350, color: colors[Math.floor(Math.random() * colors.length)]}));
        function draw() {
            ctx.clearRect(0, 0, 600, 400);
            squares.forEach(s => { ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 50, 50); });
        }
        function newTarget() {
            target = colors[Math.floor(Math.random() * colors.length)];
            document.getElementById('picker-target').innerHTML = `Click: <span style="display:inline-block;width:50px;height:50px;background:${target};"></span>`;
        }
        canvas.onclick = e => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            squares.forEach((s, i) => {
                if (x > s.x && x < s.x + 50 && y > s.y && y < s.y + 50 && s.color === target) {
                    score++;
                    document.getElementById('picker-score').textContent = `${score}/20 correct`;
                    squares.splice(i, 1);
                    squares.push({x: Math.random() * 550, y: Math.random() * 350, color: colors[Math.floor(Math.random() * colors.length)]});
                    newTarget();
                    draw();
                    if (score === 20) { showSuccessMessage(); setTimeout(() => completeLevel(38), 1000); }
                }
            });
        };
        newTarget();
        draw();
    }

    function loadLevel39() {
        gameArea.innerHTML = `<h2>Level 39: Rhythm Tapper 🥁</h2><p>Tap the spacebar to the beat!</p><div id="rhythm-bar" style="width:600px;height:50px;background:#ddd;margin:20px auto;position:relative;"><div id="rhythm-cursor" style="width:5px;height:50px;background:#e63946;position:absolute;left:0;"></div></div><div id="rhythm-score">0/15 hits</div>`;
        let pos = 0, score = 0;
        const target = 300;
        setInterval(() => {
            pos = (pos + 5) % 600;
            document.getElementById('rhythm-cursor').style.left = pos + 'px';
        }, 20);
        document.onkeydown = e => {
            if (e.code === 'Space') {
                if (Math.abs(pos - target) < 30) {
                    score++;
                    document.getElementById('rhythm-score').textContent = `${score}/15 hits`;
                    if (score === 15) { showSuccessMessage(); setTimeout(() => completeLevel(39), 1000); }
                }
            }
        };
    }

    function loadLevel40() {
        gameArea.innerHTML = `<h2>Level 40: Ice Cream Stack 🍦</h2><p>Stack 8 scoops!</p><div><canvas id="ice-canvas"></canvas><div id="ice-score">0/8 scoops</div></div>`;
        const canvas = document.getElementById('ice-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 500;
        const scoops = [];
        let current = {x: 50, dir: 1};
        function draw() {
            ctx.clearRect(0, 0, 400, 500);
            ctx.fillStyle = '#d2691e';
            ctx.fillRect(180, 450, 40, 50);
            scoops.forEach((s, i) => {
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(200, 440 - i * 30, 25, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.arc(current.x, 100, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        setInterval(() => {
            current.x += current.dir * 3;
            if (current.x > 350 || current.x < 50) current.dir *= -1;
            draw();
        }, 20);
        canvas.onclick = () => {
            if (scoops.length === 0 || Math.abs(current.x - 200) < 40) {
                scoops.push({x: current.x, color: `hsl(${Math.random()*360}, 70%, 60%)`});
                document.getElementById('ice-score').textContent = `${scoops.length}/8 scoops`;
                if (scoops.length === 8) { showSuccessMessage(); setTimeout(() => completeLevel(40), 1000); }
            }
        };
    }

    // Continuing with more levels...
    function loadLevel41() { gameArea.innerHTML = `<h2>Level 41: Leaf Collector 🍂</h2><p>Collect 40 falling leaves!</p><div><canvas id="leaf-canvas"></canvas><div id="leaf-score">0/40</div></div>`; const canvas = document.getElementById('leaf-canvas'); const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; const leaves = []; let collected = 0, basketX = 325; setInterval(() => { if (leaves.length < 10 && collected < 40) leaves.push({x: Math.random() * 700, y: 0, vx: (Math.random() - 0.5) * 2, vy: 2}); }, 500); canvas.onmousemove = e => { basketX = e.clientX - canvas.getBoundingClientRect().left - 25; }; setInterval(() => { ctx.clearRect(0, 0, 700, 400); ctx.fillStyle = '#8b4513'; ctx.fillRect(basketX, 360, 50, 30); leaves.forEach((l, i) => { l.x += l.vx; l.y += l.vy; ctx.font = '30px Arial'; ctx.fillText('🍂', l.x, l.y); if (l.y > 360 && l.x > basketX && l.x < basketX + 50) { collected++; document.getElementById('leaf-score').textContent = `${collected}/40`; leaves.splice(i, 1); if (collected === 40) { showSuccessMessage(); setTimeout(() => completeLevel(41), 1000); } } else if (l.y > 400) leaves.splice(i, 1); }); }, 30); }

    function loadLevel42() { gameArea.innerHTML = `<h2>Level 42: Pattern Copy 📋</h2><p>Copy the pattern!</p><div style="display:grid;grid-template-columns:repeat(5,40px);gap:5px;margin:20px auto;width:fit-content;" id="pattern-target"></div><div style="display:grid;grid-template-columns:repeat(5,40px);gap:5px;margin:20px auto;width:fit-content;" id="pattern-input"></div>`; const pattern = Array.from({length: 25}, () => Math.random() < 0.5 ? 1 : 0); const input = Array(25).fill(0); pattern.forEach(p => { const div = document.createElement('div'); div.style.cssText = `width:40px;height:40px;background:${p ? '#000' : '#fff'};border:1px solid #999;`; document.getElementById('pattern-target').appendChild(div); }); input.forEach((_, i) => { const div = document.createElement('div'); div.style.cssText = `width:40px;height:40px;background:#fff;border:1px solid #999;cursor:pointer;`; div.onclick = () => { input[i] = 1 - input[i]; div.style.background = input[i] ? '#000' : '#fff'; if (input.every((v, idx) => v === pattern[idx])) { showSuccessMessage(); setTimeout(() => completeLevel(42), 1000); } }; document.getElementById('pattern-input').appendChild(div); }); }

    function loadLevel43() { gameArea.innerHTML = `<h2>Level 43: Neon Glow 💡</h2><p>Click to light up all bulbs!</p><div id="bulb-container" style="display:flex;gap:20px;justify-content:center;margin:40px;"></div>`; const bulbs = Array(10).fill(false); bulbs.forEach((_, i) => { const bulb = document.createElement('div'); bulb.style.cssText = `width:60px;height:80px;background:#666;border-radius:30px;cursor:pointer;transition:all 0.3s;`; bulb.onclick = () => { bulbs[i] = true; bulb.style.background = '#ffff00'; bulb.style.boxShadow = '0 0 20px #ffff00'; if (bulbs.every(b => b)) { showSuccessMessage(); setTimeout(() => completeLevel(43), 1000); } }; document.getElementById('bulb-container').appendChild(bulb); }); }

    function loadLevel44() { gameArea.innerHTML = `<h2>Level 44: Reflex Test ⚡</h2><p>Click as fast as you can!</p><div id="reflex-btn" style="width:200px;height:200px;background:#e63946;margin:30px auto;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;">CLICK!</div><div id="reflex-score">0/20</div>`; let clicks = 0; document.getElementById('reflex-btn').onclick = () => { clicks++; document.getElementById('reflex-score').textContent = `${clicks}/20`; if (clicks === 20) { showSuccessMessage(); setTimeout(() => completeLevel(44), 1000); } }; }

    function loadLevel45() { gameArea.innerHTML = `<h2>Level 45: Rainbow Trail 🌈</h2><p>Paint a rainbow with your mouse!</p><div><canvas id="rainbow-canvas"></canvas><div id="rainbow-progress">0%</div></div>`; const canvas = document.getElementById('rainbow-canvas'); const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; let hue = 0, drawing = false; const painted = new Set(); canvas.onmousedown = () => { drawing = true; }; canvas.onmouseup = () => { drawing = false; }; canvas.onmousemove = e => { if (drawing) { const rect = canvas.getBoundingClientRect(); const x = Math.floor((e.clientX - rect.left) / 10), y = Math.floor((e.clientY - rect.top) / 10); painted.add(`${x},${y}`); ctx.fillStyle = `hsl(${hue}, 70%, 60%)`; ctx.fillRect(x * 10, y * 10, 10, 10); hue = (hue + 1) % 360; const progress = Math.floor((painted.size / 2800) * 100); document.getElementById('rainbow-progress').textContent = `${progress}%`; if (progress >= 70) { showSuccessMessage(); setTimeout(() => completeLevel(45), 1000); } } }; }

    function loadLevel46() { gameArea.innerHTML = `<h2>Level 46: Number Match 🔢</h2><p>Match pairs of numbers!</p><div id="num-grid" style="display:grid;grid-template-columns:repeat(4,80px);gap:10px;justify-content:center;margin:20px;"></div>`; const nums = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8].sort(() => Math.random() - 0.5); let flipped = [], matched = 0; nums.forEach((n, i) => { const div = document.createElement('div'); div.style.cssText = 'width:80px;height:80px;background:#457b9d;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;cursor:pointer;border-radius:10px;'; div.textContent = '?'; div.onclick = () => { if (flipped.length < 2 && div.textContent === '?') { div.textContent = n; div.style.background = '#90a955'; flipped.push({div, n, i}); if (flipped.length === 2) { setTimeout(() => { if (flipped[0].n === flipped[1].n && flipped[0].i !== flipped[1].i) { matched++; if (matched === 8) { showSuccessMessage(); setTimeout(() => completeLevel(46), 1000); } } else { flipped.forEach(f => { f.div.textContent = '?'; f.div.style.background = '#457b9d'; }); } flipped = []; }, 800); } } }; document.getElementById('num-grid').appendChild(div); }); }

    function loadLevel47() { gameArea.innerHTML = `<h2>Level 47: Coin Collector 💰</h2><p>Collect 50 coins!</p><div><canvas id="coin-canvas"></canvas><div id="coin-score">0/50</div></div>`; const canvas = document.getElementById('coin-canvas'); const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; const coins = []; let collected = 0; setInterval(() => { if (coins.length < 15 && collected < 50) coins.push({x: Math.random() * 680, y: Math.random() * 380}); }, 300); function draw() { ctx.clearRect(0, 0, 700, 400); ctx.font = '30px Arial'; coins.forEach(c => ctx.fillText('🪙', c.x, c.y)); } canvas.onclick = e => { const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top; coins.forEach((c, i) => { if (Math.abs(x - c.x) < 20 && Math.abs(y - c.y) < 20) { collected++; document.getElementById('coin-score').textContent = `${collected}/50`; coins.splice(i, 1); if (collected === 50) { showSuccessMessage(); setTimeout(() => completeLevel(47), 1000); } } }); }; setInterval(draw, 30); }

    function loadLevel48() { gameArea.innerHTML = `<h2>Level 48: Toggle Switch 🔘</h2><p>Turn all switches ON!</p><div id="switch-container" style="display:grid;grid-template-columns:repeat(5,60px);gap:20px;justify-content:center;margin:30px;"></div>`; const switches = Array(15).fill(false); switches.forEach((_, i) => { const sw = document.createElement('div'); sw.style.cssText = 'width:60px;height:30px;background:#ccc;border-radius:15px;position:relative;cursor:pointer;'; const knob = document.createElement('div'); knob.style.cssText = 'width:26px;height:26px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:all 0.3s;'; sw.appendChild(knob); sw.onclick = () => { switches[i] = !switches[i]; if (switches[i]) { sw.style.background = '#90a955'; knob.style.left = '32px'; } else { sw.style.background = '#ccc'; knob.style.left = '2px'; } if (switches.every(s => s)) { showSuccessMessage(); setTimeout(() => completeLevel(48), 1000); } }; document.getElementById('switch-container').appendChild(sw); }); }

    function loadLevel49() { gameArea.innerHTML = `<h2>Level 49: Dodge Obstacles 🏃</h2><p>Survive for 20 seconds!</p><div><canvas id="dodge-canvas"></canvas><div id="dodge-time">20s</div></div>`; const canvas = document.getElementById('dodge-canvas'); const ctx = canvas.getContext('2d'); canvas.width = 600; canvas.height = 400; let playerY = 200, obstacles = [], time = 20, gameOver = false; setInterval(() => { if (!gameOver && obstacles.length < 5) obstacles.push({x: 600, y: Math.random() * 360, w: 40, h: 40}); }, 800); const timer = setInterval(() => { if (!gameOver) { time--; document.getElementById('dodge-time').textContent = `${time}s`; if (time === 0) { gameOver = true; showSuccessMessage(); setTimeout(() => completeLevel(49), 1000); } } }, 1000); canvas.onmousemove = e => { playerY = e.clientY - canvas.getBoundingClientRect().top; }; setInterval(() => { if (gameOver) return; ctx.clearRect(0, 0, 600, 400); ctx.fillStyle = '#457b9d'; ctx.fillRect(20, playerY - 20, 40, 40); obstacles.forEach((o, i) => { o.x -= 5; ctx.fillStyle = '#e63946'; ctx.fillRect(o.x, o.y, o.w, o.h); if (20 < o.x + o.w && 60 > o.x && playerY - 20 < o.y + o.h && playerY + 20 > o.y) { gameOver = true; alert('Hit! Try again'); location.reload(); } if (o.x < -40) obstacles.splice(i, 1); }); }, 30); }

    function loadLevel50() { gameArea.innerHTML = `<h2>Level 50: Constellation 🌟</h2><p>Connect the stars!</p><div><canvas id="star-canvas"></canvas><div id="star-progress">0/10 connected</div></div>`; const canvas = document.getElementById('star-canvas'); const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; const stars = Array.from({length: 10}, (_, i) => ({x: Math.random() * 650 + 25, y: Math.random() * 350 + 25, num: i + 1, connected: false})); let current = 0; const connections = []; function draw() { ctx.clearRect(0, 0, 700, 400); ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; ctx.beginPath(); connections.forEach((c, i) => { if (i === 0) ctx.moveTo(c.x, c.y); else ctx.lineTo(c.x, c.y); }); ctx.stroke(); stars.forEach(s => { ctx.fillStyle = s.connected ? '#ffff00' : '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText(s.num, s.x, s.y + 3); }); } canvas.onclick = e => { const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top; stars.forEach(s => { if (Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2) < 15 && s.num === current + 1) { s.connected = true; connections.push({x: s.x, y: s.y}); current++; document.getElementById('star-progress').textContent = `${current}/10 connected`; if (current === 10) { showSuccessMessage(); setTimeout(() => completeLevel(50), 1000); } draw(); } }); }; draw(); }

    // Levels 51-100 with rapid simple implementations
    const quickLevels = [
        {n: 51, title: 'Quick Click 👆', html: `<div id="qc51" style="width:200px;height:200px;background:#e63946;margin:20px auto;cursor:pointer;border-radius:15px;"></div><div id="qc51s">0/50</div>`, init: () => { let c = 0; document.getElementById('qc51').onclick = () => { c++; document.getElementById('qc51s').textContent = `${c}/50`; if (c === 50) { showSuccessMessage(); setTimeout(() => completeLevel(51), 1000); } }; }},
        {n: 52, title: 'Hold Timer ⏱️', html: `<div id="ht52" style="width:200px;height:200px;background:#457b9d;margin:20px auto;cursor:pointer;border-radius:15px;"></div><div id="ht52s">Hold for 5s</div>`, init: () => { let t = 0, holding = false; const div = document.getElementById('ht52'); div.onmousedown = () => { holding = true; const interval = setInterval(() => { if (holding) { t++; document.getElementById('ht52s').textContent = `${t}/5s`; if (t >= 5) { clearInterval(interval); showSuccessMessage(); setTimeout(() => completeLevel(52), 1000); } } else clearInterval(interval); }, 1000); }; div.onmouseup = () => { holding = false; }; }},
        {n: 53, title: 'Emoji Match 😀', html: `<div id="em53" style="display:grid;grid-template-columns:repeat(4,70px);gap:10px;margin:20px auto;width:fit-content;"></div>`, init: () => { const emojis = ['😀','😀','😎','😎','🥳','🥳','😍','😍'].sort(() => Math.random() - 0.5); let flipped = [], matched = 0; emojis.forEach((e, i) => { const div = document.createElement('div'); div.style.cssText = 'width:70px;height:70px;background:#90a955;display:flex;align-items:center;justify-content:center;font-size:40px;cursor:pointer;border-radius:10px;'; div.textContent = '?'; div.onclick = () => { if (flipped.length < 2 && div.textContent === '?') { div.textContent = e; flipped.push({div, e, i}); if (flipped.length === 2) { setTimeout(() => { if (flipped[0].e === flipped[1].e && flipped[0].i !== flipped[1].i) { matched++; if (matched === 4) { showSuccessMessage(); setTimeout(() => completeLevel(53), 1000); } } else { flipped.forEach(f => f.div.textContent = '?'); } flipped = []; }, 600); } } }; document.getElementById('em53').appendChild(div); }); }},
        {n: 54, title: 'Color Wave 🌊', html: `<div><canvas id="cw54"></canvas></div>`, init: () => { const canvas = document.getElementById('cw54'); const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 200; let hue = 0; setInterval(() => { for (let i = 0; i < 700; i++) { ctx.fillStyle = `hsl(${(hue + i) % 360}, 70%, 60%)`; ctx.fillRect(i, 0, 1, 200); } hue = (hue + 2) % 360; if (hue === 0) { showSuccessMessage(); setTimeout(() => completeLevel(54), 1000); } }, 30); }},
        {n: 55, title: 'Tap Sequence 🔢', html: `<div id="ts55" style="font-size:3rem;margin:20px;">Tap: 1</div>`, init: () => { let num = 1; document.onkeydown = e => { if (e.key == num) { num++; document.getElementById('ts55').textContent = `Tap: ${num}`; if (num > 10) { showSuccessMessage(); setTimeout(() => completeLevel(55), 1000); } } }; }},
    ];

    quickLevels.forEach(level => {
        window[`loadLevel${level.n}`] = () => {
            gameArea.innerHTML = `<h2>Level ${level.n}: ${level.title}</h2><p>Complete the challenge!</p>${level.html}`;
            level.init();
        };
    });

    // Levels 56-100: More quick variations
    for (let i = 56; i <= 100; i++) {
        window[`loadLevel${i}`] = () => {
            const challenges = [
                {emoji: '⭐', task: 'Click stars', target: 30},
                {emoji: '💎', task: 'Collect gems', target: 25},
                {emoji: '🎯', task: 'Hit targets', target: 20},
                {emoji: '🎨', task: 'Paint pixels', target: 50},
                {emoji: '🔥', task: 'Light fires', target: 15},
                {emoji: '❄️', task: 'Make snowflakes', target: 40},
                {emoji: '🌸', task: 'Grow flowers', target: 35},
                {emoji: '⚡', task: 'Catch bolts', target: 30},
                {emoji: '🎵', task: 'Play notes', target: 25},
                {emoji: '🍕', task: 'Eat slices', target: 20},
            ];
            const challenge = challenges[(i - 56) % challenges.length];
            gameArea.innerHTML = `<h2>Level ${i}: ${challenge.task} ${challenge.emoji}</h2><p>Click to complete!</p><div id="lv${i}" style="font-size:100px;cursor:pointer;user-select:none;">${challenge.emoji}</div><div id="sc${i}">0/${challenge.target}</div>`;
            let count = 0;
            document.getElementById(`lv${i}`).onclick = () => {
                count++;
                document.getElementById(`sc${i}`).textContent = `${count}/${challenge.target}`;
                if (count >= challenge.target) {
                    showSuccessMessage();
                    setTimeout(() => completeLevel(i), 1000);
                }
            };
        };
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
