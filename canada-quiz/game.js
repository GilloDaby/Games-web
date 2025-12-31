// Gestion du jeu Quiz Canada
class CanadaQuiz {
    constructor() {
        this.currentMode = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.answered = false;
        
        this.initElements();
        this.initEventListeners();
        this.initMap();
        this.initZoom();
    }
    
    initElements() {
        // Écrans
        this.mainMenu = document.getElementById('main-menu');
        this.gameScreen = document.getElementById('game-screen');
        this.resultsScreen = document.getElementById('results-screen');
        
        // Éléments du jeu
        this.questionText = document.getElementById('question-text');
        this.flagDisplay = document.getElementById('flag-display');
        this.flagImg = document.getElementById('flag-img');
        this.scoreEl = document.getElementById('score');
        this.questionNumEl = document.getElementById('question-num');
        this.feedback = document.getElementById('feedback');
        this.feedbackText = document.getElementById('feedback-text');
        this.tooltip = document.getElementById('tooltip');
        
        // Boutons
        this.backBtn = document.getElementById('back-btn');
        this.replayBtn = document.getElementById('replay-btn');
        this.menuBtn = document.getElementById('menu-btn');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        
        // Résultats
        this.finalScoreValue = document.getElementById('final-score-value');
        this.scoreMessage = document.getElementById('score-message');
        
        // Carte
        this.map = document.getElementById('canada-map');
        this.mapGroup = document.getElementById('map-group');
        this.provinces = document.querySelectorAll('.province');

        // Input Silhouette
        this.inputContainer = document.getElementById('input-container');
        this.answerInput = document.getElementById('answer-input');
        this.submitAnswerBtn = document.getElementById('submit-answer');
    }
    
    initEventListeners() {
        // Boutons de mode
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.startGame(btn.dataset.mode);
            });
        });
        
        // Bouton retour
        this.backBtn.addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Boutons résultats
        this.replayBtn.addEventListener('click', () => {
            this.startGame(this.currentMode);
        });
        
        this.menuBtn.addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        // Validation réponse texte (Silhouette)
        this.submitAnswerBtn.addEventListener('click', () => this.checkInputAnswer());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkInputAnswer();
        });

        // Click sur la carte (pour le mode précision)
        this.map.addEventListener('click', (e) => {
            if (this.currentMode === 'precision' && !this.answered) {
                // Vérifier si on n'est pas en train de glisser (pan)
                if (this.map.style.cursor === 'grabbing') return;
                
                this.handleMapClick(e);
            }
        });

        // Gestion du Drag & Drop pour le mode Puzzle
        this.map.addEventListener('mousedown', (e) => this.startDrag(e));
        this.map.addEventListener('mousemove', (e) => this.drag(e));
        this.map.addEventListener('mouseup', (e) => this.endDrag(e));
        this.map.addEventListener('mouseleave', (e) => this.endDrag(e));
    }
    
    initMap() {
        this.provinces.forEach(province => {
            // Click sur une province
            province.addEventListener('click', (e) => {
                if (this.currentMode === 'precision' || this.currentMode === 'puzzle' || this.currentMode === 'silhouette') {
                    // En mode précision, puzzle ou silhouette, on laisse le click remonter ou on ignore
                    return; 
                }
                e.stopPropagation(); // Empêcher le click sur la map
                if (!this.answered) {
                    this.checkAnswer(province.id);
                }
            });
            
            // Tooltip au survol (Désactivé pour éviter la triche)
            /*
            province.addEventListener('mouseenter', (e) => {
                const data = PROVINCES_DATA[province.id];
                if (data) {
                    this.tooltip.textContent = data.name;
                    this.tooltip.classList.add('visible');
                }
            });
            
            province.addEventListener('mousemove', (e) => {
                const rect = this.map.parentElement.getBoundingClientRect();
                this.tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
                this.tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
            });
            
            province.addEventListener('mouseleave', () => {
                this.tooltip.classList.remove('visible');
            });
            */
        });
    }

    initZoom() {
        let scale = 1;
        let pointX = 0;
        let pointY = 0;
        let panning = false;
        let startX = 0;
        let startY = 0;

        const setTransform = () => {
            this.mapGroup.setAttribute('transform', `translate(${pointX}, ${pointY}) scale(${scale})`);
        }

        // Zoom avec la molette
        this.map.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.map.getBoundingClientRect();
            // Coordonnées relatives à l'élément SVG
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculer le point sous la souris dans l'espace transformé
            const xs = (mouseX - pointX) / scale;
            const ys = (mouseY - pointY) / scale;
            
            const delta = -Math.sign(e.deltaY);
            
            if (delta > 0) {
                scale *= 1.1;
            } else {
                scale /= 1.1;
            }
            
            // Limites du zoom
            scale = Math.min(Math.max(1, scale), 5);

            if (scale === 1) {
                pointX = 0;
                pointY = 0;
            } else {
                // Recalculer pointX/Y pour que le point sous la souris reste fixe
                pointX = mouseX - xs * scale;
                pointY = mouseY - ys * scale;
            }

            setTransform();
        });

        // Pan avec la souris
        this.map.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            panning = true;
            this.map.style.cursor = 'grabbing';
        });

        this.map.addEventListener('mousemove', (e) => {
            e.preventDefault();
            if (!panning) return;
            pointX = e.clientX - startX;
            pointY = e.clientY - startY;
            setTransform();
        });

        this.map.addEventListener('mouseup', () => {
            panning = false;
            this.map.style.cursor = 'grab';
        });

        this.map.addEventListener('mouseleave', () => {
            panning = false;
            this.map.style.cursor = 'grab';
        });

        // Zoom et Pan tactile (Mobile)
        let initialDistance = 0;
        let initialScale = 1;
        
        this.map.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault(); // Empêche le zoom navigateur
                initialDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                initialScale = scale;
            } else if (e.touches.length === 1) {
                startX = e.touches[0].clientX - pointX;
                startY = e.touches[0].clientY - pointY;
                panning = true;
            }
        }, { passive: false });

        this.map.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                
                if (initialDistance > 0) {
                    const delta = currentDistance / initialDistance;
                    scale = initialScale * delta;
                    scale = Math.min(Math.max(1, scale), 5);
                    
                    if (scale === 1) {
                        pointX = 0;
                        pointY = 0;
                    }
                    setTransform();
                }
            } else if (e.touches.length === 1 && panning) {
                e.preventDefault(); // Empêche le scroll page
                pointX = e.touches[0].clientX - startX;
                pointY = e.touches[0].clientY - startY;
                setTransform();
            }
        }, { passive: false });

        this.map.addEventListener('touchend', () => {
            panning = false;
            if (scale < 1) {
                scale = 1;
                pointX = 0;
                pointY = 0;
                setTransform();
            }
        });
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    startGame(mode) {
        this.currentMode = mode;
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;
        
        // Réinitialiser les provinces
        this.provinces.forEach(p => {
            p.classList.remove('correct', 'incorrect', 'highlight', 'completed', 'placed');
            p.style.visibility = '';
            p.style.opacity = '';
        });
        
        // Générer les questions
        this.generateQuestions();
        
        // Afficher l'écran de jeu
        this.showScreen('game-screen');
        this.updateUI();
        this.showQuestion();
    }
    
    generateQuestions() {
        this.questions = [];
        const provinceIds = Object.keys(PROVINCES_DATA);
        
        switch (this.currentMode) {
            case 'provinces':
                // Questions sur les provinces
                this.questions = this.shuffle(provinceIds.map(id => ({
                    type: 'province',
                    target: id,
                    question: `Cliquez sur : ${PROVINCES_DATA[id].name}`
                })));
                break;
                
            case 'capitals':
                // Questions sur les capitales
                this.questions = this.shuffle(provinceIds.map(id => ({
                    type: 'capital',
                    target: id,
                    question: `Où se trouve ${PROVINCES_DATA[id].capital}? (Capitale)`
                })));
                break;
                
            case 'flags':
                // Questions sur les drapeaux
                this.questions = this.shuffle(provinceIds.map(id => ({
                    type: 'flag',
                    target: id,
                    question: `À quelle province appartient ce drapeau?`,
                    flag: PROVINCES_DATA[id].flag
                })));
                break;
                
            case 'cities':
                // Questions sur les grandes villes
                this.questions = this.shuffle(MAJOR_CITIES.map(cityData => ({
                    type: 'city',
                    target: cityData.province,
                    question: `Dans quelle province se trouve ${cityData.city}?`,
                    city: cityData.city
                })));
                break;

            case 'precision':
                // Questions de précision
                this.questions = this.shuffle(CITY_LOCATIONS.map(loc => ({
                    type: 'precision',
                    target: loc, // Objet complet avec x, y, radius
                    question: `Cliquez sur l'emplacement exact de : ${loc.city}`
                })));
                break;

            case 'silhouette':
                // Questions de silhouette
                this.questions = this.shuffle(provinceIds.map(id => ({
                    type: 'silhouette',
                    target: id,
                    question: `Quelle est cette province/territoire ?`
                })));
                break;

            case 'puzzle':
                // Mode Puzzle
                this.questions = this.shuffle(provinceIds.map(id => ({
                    type: 'puzzle',
                    target: id,
                    question: `Placez la province : ${PROVINCES_DATA[id].name}`
                })));
                break;

            case 'tourism':
                // Mode Tourisme
                this.questions = this.shuffle(TOURISM_LOCATIONS.map(loc => ({
                    type: 'tourism',
                    target: loc.province,
                    question: `Dans quelle province trouve-t-on le lieu affiché sur l'image : ${loc.name} ?`,
                    image: loc.img
                })));
                break;
        }
    }
    
    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        this.questionText.textContent = question.question;
        
        // Nettoyer les marqueurs (mode précision)
        this.clearMarkers();
        
        // Nettoyer pièce de puzzle
        const oldPiece = document.querySelector('.puzzle-piece');
        if (oldPiece) oldPiece.remove();

        // Reset map view and visibility
        this.map.classList.remove('silhouette-mode', 'puzzle-mode');
        this.provinces.forEach(p => {
            p.classList.remove('active-silhouette', 'hidden-silhouette');
            p.style.display = ''; // Reset display
            p.style.visibility = ''; // Reset visibility
        });
        this.map.setAttribute('viewBox', '0 0 1000 1000'); // Reset zoom
        this.inputContainer.classList.add('hidden');

        // Afficher le drapeau ou l'image touristique
        if (question.type === 'flag' || question.type === 'tourism') {
            this.flagDisplay.classList.remove('hidden');
            this.flagImg.src = question.type === 'flag' ? question.flag : question.image;
            this.flagImg.alt = question.type === 'flag' ? 'Drapeau à identifier' : 'Lieu touristique';
            
            // Ajuster le style pour les photos (plus grand si possible)
            if (question.type === 'tourism') {
                this.flagImg.style.maxHeight = '250px';
                this.flagImg.style.borderRadius = '10px';
                this.flagImg.style.cursor = 'zoom-in';
                this.flagImg.onclick = () => this.openImageModal(question.image);
            } else {
                this.flagImg.style.maxHeight = '';
                this.flagImg.style.borderRadius = '';
                this.flagImg.style.cursor = '';
                this.flagImg.onclick = null;
            }
        } else {
            this.flagDisplay.classList.add('hidden');
        }

        // Mode Puzzle
        if (question.type === 'puzzle') {
            this.map.classList.add('puzzle-mode');
            this.inputContainer.classList.add('hidden'); // S'assurer que l'input est caché
            
            // Créer la pièce à déplacer
            const targetEl = document.getElementById(question.target);
            
            // En mode puzzle, on cache toutes les provinces non placées
            // (Géré par CSS .puzzle-mode .province { opacity: 0 })
            // Mais on s'assure que la cible est bien cachée aussi
            
            const piece = targetEl.cloneNode(true);
            piece.id = 'puzzle-piece';
            piece.style.visibility = 'visible'; 
            piece.style.opacity = '1'; // La pièce doit être visible
            piece.classList.add('puzzle-piece');
            piece.classList.remove('province', 'placed'); // S'assurer que la pièce n'a pas la classe placed
            
            // Position initiale aléatoire (mais visible)
            const randomX = Math.random() * 400 + 100;
            const randomY = Math.random() * 400 + 100;
            
            // On stocke la position actuelle (offset)
            this.pieceOffset = { x: randomX, y: randomY };
            piece.setAttribute('transform', `translate(${randomX}, ${randomY})`);
            
            this.mapGroup.appendChild(piece);
            this.currentPiece = piece;
        }

        // Mode Silhouette
        if (question.type === 'silhouette') {
            this.map.classList.add('silhouette-mode');
            this.inputContainer.classList.remove('hidden');
            this.answerInput.value = '';
            this.answerInput.focus();

            const targetEl = document.getElementById(question.target);
            
            // Masquer les autres
            this.provinces.forEach(p => {
                if (p.id === question.target) {
                    p.classList.add('active-silhouette');
                } else {
                    p.classList.add('hidden-silhouette');
                }
            });

            // Zoomer sur la province cible
            try {
                const bbox = targetEl.getBBox();
                // Ajouter un peu de marge (padding)
                const padding = 50;
                const x = Math.max(0, bbox.x - padding);
                const y = Math.max(0, bbox.y - padding);
                const width = Math.min(1000, bbox.width + padding * 2);
                const height = Math.min(1000, bbox.height + padding * 2);
                
                // Garder le ratio carré si possible ou ajuster
                const size = Math.max(width, height);
                const cx = x + width / 2;
                const cy = y + height / 2;
                
                this.map.setAttribute('viewBox', `${cx - size/2} ${cy - size/2} ${size} ${size}`);
            } catch (e) {
                console.error("Erreur BBox", e);
            }
        }
        
        this.answered = false;
        this.hideFeedback();
    }
    
    checkInputAnswer() {
        if (this.answered) return;
        
        const question = this.questions[this.currentQuestion];
        const userAnswer = this.answerInput.value.trim().toLowerCase();
        const targetName = PROVINCES_DATA[question.target].name.toLowerCase();
        
        // Vérification simple (contient le nom ou égalité stricte)
        // On peut être gentil sur les accents en normalisant
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const isCorrect = normalize(userAnswer) === normalize(targetName);
        
        this.answered = true;
        
        if (isCorrect) {
            this.score++;
            this.showFeedback(true, `Bravo! C'est bien ${PROVINCES_DATA[question.target].name}!`);
            document.getElementById(question.target).classList.add('correct');
        } else {
            this.showFeedback(false, `Non! C'était ${PROVINCES_DATA[question.target].name}`);
            document.getElementById(question.target).classList.add('incorrect');
        }
        
        this.updateUI();
        
        setTimeout(() => {
            this.currentQuestion++;
            this.showQuestion();
        }, 2000);
    }

    checkAnswer(selectedId) {
        if (this.answered) return;
        this.answered = true;
        
        const question = this.questions[this.currentQuestion];
        let isCorrect = false;
        let correctTarget = question.target;

        // Gestion des réponses multiples (tableau)
        if (Array.isArray(question.target)) {
            isCorrect = question.target.includes(selectedId);
            // Pour l'affichage de la bonne réponse, on prend la première ou celle cliquée si correcte
            correctTarget = isCorrect ? selectedId : question.target[0];
        } else {
            isCorrect = selectedId === question.target;
        }
        
        const selectedProvince = document.getElementById(selectedId);
        const correctProvince = document.getElementById(correctTarget);
        
        if (isCorrect) {
            this.score++;
            selectedProvince.classList.add('correct');
            this.showFeedback(true, `Bravo! C'est ${PROVINCES_DATA[selectedId].name}!`);
        } else {
            selectedProvince.classList.add('incorrect');
            // Si plusieurs réponses possibles, on peut toutes les highlighter ou juste une
            if (Array.isArray(question.target)) {
                question.target.forEach(t => document.getElementById(t).classList.add('highlight'));
                this.showFeedback(false, `Non! C'était ${PROVINCES_DATA[question.target[0]].name} (ou autre)`);
            } else {
                correctProvince.classList.add('highlight');
                this.showFeedback(false, `Non! C'était ${PROVINCES_DATA[question.target].name}`);
            }
        }
        
        this.updateUI();
        
        // Passer à la question suivante
        setTimeout(() => {
            selectedProvince.classList.remove('correct', 'incorrect');
            if (Array.isArray(question.target)) {
                question.target.forEach(t => document.getElementById(t).classList.remove('highlight', 'completed'));
            } else {
                correctProvince.classList.remove('highlight');
            }
            
            if (isCorrect) {
                // Marquer comme complété (optionnel)
                // correctProvince.classList.add('completed');
            }
            
            this.currentQuestion++;
            this.updateUI();
            this.showQuestion();
        }, 1500);
    }

    openImageModal(imgSrc) {
        let modal = document.getElementById('image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'image-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img id="modal-img" src="" alt="Zoom">
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.close-modal').onclick = () => {
                modal.style.display = "none";
            };
            modal.onclick = (e) => {
                if (e.target === modal) modal.style.display = "none";
            };
        }
        
        const modalImg = document.getElementById('modal-img');
        modalImg.src = imgSrc;
        modal.style.display = "flex";
    }

    handleMapClick(e) {
        const pt = this.map.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        
        // Transformer les coordonnées écran en coordonnées SVG (dans le groupe map-group)
        const svgP = pt.matrixTransform(this.mapGroup.getScreenCTM().inverse());
        
                // DEBUG: Afficher les coordonnées pour aider à corriger les emplacements
        let debugEl = document.getElementById('debug-coords');
        if (!debugEl) {
            debugEl = document.createElement('div');
            debugEl.id = 'debug-coords';
            debugEl.style.cssText = 'position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: #0f0; padding: 5px 10px; font-family: monospace; z-index: 1000; border-radius: 4px; pointer-events: none;';
            document.body.appendChild(debugEl);
        }
        debugEl.textContent = `X: ${Math.round(svgP.x)}, Y: ${Math.round(svgP.y)}`;
        console.log(`CLICK: { city: "NAME", x: ${Math.round(svgP.x)}, y: ${Math.round(svgP.y)}, radius: 15 },`);

        this.checkPrecisionAnswer({ x: svgP.x, y: svgP.y });
    }

    checkPrecisionAnswer(coords) {
        if (this.answered) return;
        this.answered = true;
        
        const question = this.questions[this.currentQuestion];
        const target = question.target;
        
        // Calculer la distance
        const distance = Math.sqrt(Math.pow(coords.x - target.x, 2) + Math.pow(coords.y - target.y, 2));
        const isCorrect = distance <= target.radius;
        
        // Afficher les marqueurs
        this.addMarker(coords.x, coords.y, isCorrect ? 'user-correct' : 'user-incorrect');
        this.addMarker(target.x, target.y, 'target');
        
        if (isCorrect) {
            this.score++;
            this.showFeedback(true, `Bravo! En plein dans le mille!`);
        } else {
            this.showFeedback(false, `Raté! C'était ici.`);
        }
        
        this.updateUI();
        
        // Passer à la question suivante
        setTimeout(() => {
            this.currentQuestion++;
            this.showQuestion();
        }, 2000);
    }

    addMarker(x, y, type) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", type === 'target' ? 5 : 8);
        circle.setAttribute("class", `marker marker-${type}`);
        // Ajouter une animation
        if (type !== 'target') {
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animate.setAttribute("attributeName", "r");
            animate.setAttribute("from", "0");
            animate.setAttribute("to", "8");
            animate.setAttribute("dur", "0.3s");
            animate.setAttribute("fill", "freeze");
            circle.appendChild(animate);
        }
        this.mapGroup.appendChild(circle);
    }
    
    clearMarkers() {
        const markers = this.mapGroup.querySelectorAll('.marker');
        markers.forEach(m => m.remove());
    }
    
    showFeedback(isCorrect, message) {
        this.feedback.classList.remove('hidden', 'correct', 'incorrect');
        this.feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
        this.feedbackText.textContent = message;
    }
    
    hideFeedback() {
        this.feedback.classList.add('hidden');
    }
    
    updateUI() {
        this.scoreEl.textContent = this.score;
        this.questionNumEl.textContent = `${Math.min(this.currentQuestion + 1, this.questions.length)}/${this.questions.length}`;
    }
    
    endGame() {
        this.showScreen('results-screen');
        this.finalScoreValue.textContent = this.score;
        document.querySelector('.score-label').textContent = `/ ${this.questions.length}`;
        
        const percentage = this.score / this.questions.length;
        let message;
        
        if (percentage === 1) {
            message = SCORE_MESSAGES.perfect;
        } else if (percentage >= 0.8) {
            message = SCORE_MESSAGES.excellent;
        } else if (percentage >= 0.6) {
            message = SCORE_MESSAGES.good;
        } else if (percentage >= 0.4) {
            message = SCORE_MESSAGES.average;
        } else {
            message = SCORE_MESSAGES.poor;
        }
        
        this.scoreMessage.textContent = message;
    }
    
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Gestion du Drag & Drop (Puzzle)
    startDrag(e) {
        if (this.currentMode !== 'puzzle' || !e.target.classList.contains('puzzle-piece')) return;
        
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.initialOffset = { ...this.pieceOffset };
        
        // Désactiver le pan de la map pendant le drag de la pièce
        e.stopPropagation();
        e.stopImmediatePropagation(); // Empêche le listener de zoom/pan de se déclencher
    }

    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        // Calculer le déplacement en pixels écran
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        // Convertir en unités SVG (approximatif si pas de zoom, mais suffisant ici)
        // Idéalement faudrait utiliser CTM mais on va faire simple
        const ctm = this.mapGroup.getScreenCTM();
        const scale = ctm.a;
        
        this.pieceOffset.x = this.initialOffset.x + (dx / scale);
        this.pieceOffset.y = this.initialOffset.y + (dy / scale);
        
        this.currentPiece.setAttribute('transform', `translate(${this.pieceOffset.x}, ${this.pieceOffset.y})`);
    }

    endDrag(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        // Vérifier la position
        // La position cible est (0,0) car le path est absolu
        const dist = Math.sqrt(this.pieceOffset.x * this.pieceOffset.x + this.pieceOffset.y * this.pieceOffset.y);
        
        // Tolérance de 30 unités
        if (dist < 30) {
            // Victoire !
            this.pieceOffset = { x: 0, y: 0 };
            // On ne déplace pas la pièce, on affiche la vraie province
            
            const realProvince = document.getElementById(this.questions[this.currentQuestion].target);
            realProvince.classList.add('placed');
            realProvince.style.visibility = 'visible';
            realProvince.style.opacity = '1';
            
            this.currentPiece.remove();
            
            this.score++;
            this.showFeedback(true, 'Bien placé !');
            
            setTimeout(() => {
                this.currentQuestion++;
                this.showQuestion();
            }, 1000);
        }
    }
}

// Initialiser le jeu au chargement
document.addEventListener('DOMContentLoaded', () => {
    new CanadaQuiz();
});

