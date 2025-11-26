document.addEventListener('DOMContentLoaded', () => {
    // --- Game State ---
    let money = 0;
    let ownedPokemon = {}; // Stores counts of each owned Pokémon, e.g., { 'rattata': 2 }
    let moneyPerSecond = 0;
    let purchasedUpgrades = [];
    let prestigePoints = 0;
    let prestigeMultiplier = 1;
    let unlockedAchievements = [];
    let temporaryMultiplier = 1;
    let favoritePokemon = null;
    let shinyPokemon = [];
    let trainerLevel = 1;
    let trainerXp = 0;
    let xpToNextLevel = 100;
    let settings = {
        floatingNumbers: true,
        dynamicBackground: true,
    };

    // --- DOM Elements ---
    const moneyDisplay = document.getElementById('money');
    const moneyPerSecondDisplay = document.getElementById('money-per-second');
    const prestigePointsDisplay = document.getElementById('prestige-points');
    const prestigeMultiplierDisplay = document.getElementById('prestige-multiplier');
    const pokemonContainer = document.getElementById('pokemon-container');
    const storeItemsContainer = document.getElementById('store-items');
    const upgradesItemsContainer = document.getElementById('upgrades-items');
    const achievementsItemsContainer = document.getElementById('achievements-items');
    const favoritePokemonSlot = document.getElementById('favorite-pokemon-slot');
    const floatingNumbersContainer = document.getElementById('floating-numbers-container');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const prestigeButton = document.getElementById('prestige-button');
    const pokeballContainer = document.getElementById('pokeball-container');
    const battleButton = document.getElementById('battle-button');
    const battleLog = document.getElementById('battle-log');
    const trainerLevelDisplay = document.getElementById('trainer-level');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');

    // --- Pokémon Data ---
    // We'll use placeholder images for now. A good source for Pokémon sprites is a fan-made resource like PokeAPI.
    const pokemonData = [
        { id: 'rattata', name: 'Rattata', cost: 15, mps: 1, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png' },
        { id: 'pidgey', name: 'Pidgey', cost: 100, mps: 5, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png' },
        { id: 'zubat', name: 'Zubat', cost: 500, mps: 20, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png' },
        { id: 'pikachu', name: 'Pikachu', cost: 2500, mps: 100, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
        { id: 'meowth', name: 'Meowth', cost: 10000, mps: 400, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png' },
        { id: 'abra', name: 'Abra', cost: 50000, mps: 2000, imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/63.png' }
    ];

    const upgradesData = [
        { id: 'rattata-upg1', name: 'Super Rattata', cost: 500, target: 'rattata', multiplier: 2, required: 10 },
        { id: 'pidgey-upg1', name: 'Pidgey Express', cost: 2500, target: 'pidgey', multiplier: 2, required: 10 },
        { id: 'zubat-upg1', name: 'Sonar Pulse', cost: 10000, target: 'zubat', multiplier: 2, required: 10 },
        { id: 'all-upg1', name: 'Poké Flute', cost: 100000, target: 'all', multiplier: 1.5, required: 0 }
    ];

    const PRESTIGE_REQUIREMENT = 1000000;
    const SHINY_CHANCE = 0.01; // 1% chance

    const achievementsData = [
        { id: 'money1', name: 'Getting Started', description: 'Earn 1,000 Pokédollars', condition: () => money >= 1000 },
        { id: 'money2', name: 'Millionaire', description: 'Earn 1,000,000 Pokédollars', condition: () => money >= 1000000 },
        { id: 'rattata1', name: 'Rattata Collector', description: 'Own 25 Rattata', condition: () => ownedPokemon['rattata'] >= 25 },
        { id: 'prestige1', name: 'First Prestige', description: 'Prestige for the first time', condition: () => prestigePoints > 0 },
    ];

    const randomEvents = [
        {
            name: "Pokédollar Rush",
            message: "You found a bag of 1,000 Pokédollars!",
            action: () => {
                money += 1000;
                alert("Pokédollar Rush! You found a bag of 1,000 Pokédollars!");
            }
        },
        {
            name: "Training Boost",
            message: "Your Pokémon are feeling extra motivated! Double MPS for 30 seconds.",
            action: () => {
                temporaryMultiplier = 2;
                calculateMoneyPerSecond();
                alert("Training Boost! Your Pokémon are feeling extra motivated! Double MPS for 30 seconds.");
                setTimeout(() => {
                    temporaryMultiplier = 1;
                    calculateMoneyPerSecond();
                    alert("Training Boost has worn off.");
                }, 30000);
            }
        },
        {
            name: "Team Rocket's Stealing Spree",
            message: "Team Rocket is trying to steal your money! You lost 10% of your Pokédollars.",
            action: () => {
                money *= 0.9;
                alert("Team Rocket's Stealing Spree! You lost 10% of your Pokédollars.");
            }
        }
    ];

    let clickValue = 1;

    // --- Game Logic ---

    function calculateMoneyPerSecond() {
        moneyPerSecond = 0;
        for (const id in ownedPokemon) {
            const pokemon = pokemonData.find(p => p.id === id);
            if (pokemon) { // Check if pokemon exists in the current data
                let pokemonMps = pokemon.mps;

                if (id === favoritePokemon) {
                    pokemonMps *= 2; // Double MPS for favorite pokemon
                }

                if (shinyPokemon.includes(id)) {
                    pokemonMps *= 5; // 5x MPS for shiny pokemon
                }

                // Apply specific and all upgrades
                purchasedUpgrades.forEach(upgradeId => {
                    const upgrade = upgradesData.find(u => u.id === upgradeId);
                    if (upgrade && (upgrade.target === id || upgrade.target === 'all')) {
                        pokemonMps *= upgrade.multiplier;
                    }
                });

                moneyPerSecond += ownedPokemon[id] * pokemonMps;
            }
        }
        moneyPerSecond *= prestigeMultiplier;
        moneyPerSecond *= temporaryMultiplier;
    }

    function buyPokemon(pokemonId) {
        const pokemon = pokemonData.find(p => p.id === pokemonId);
        if (money >= pokemon.cost) {
            money -= pokemon.cost;
            ownedPokemon[pokemonId] = (ownedPokemon[pokemonId] || 0) + 1;
            gainXp(10);

            if (Math.random() < SHINY_CHANCE) {
                if (!shinyPokemon.includes(pokemonId)) {
                    shinyPokemon.push(pokemonId);
                    alert(`You found a shiny ${pokemon.name}!`);
                    gainXp(100);
                }
            }

            calculateMoneyPerSecond();
            updateUI();
        } else {
            alert('Not enough money!');
        }
    }

    function buyUpgrade(upgradeId) {
        const upgrade = upgradesData.find(u => u.id === upgradeId);
        const targetPokemon = pokemonData.find(p => p.id === upgrade.target);

        if (upgrade.target !== 'all' && !targetPokemon) {
            alert('Cannot purchase upgrade for a non-existent Pokémon!');
            return;
        }

        if (money >= upgrade.cost && !purchasedUpgrades.includes(upgradeId)) {
            money -= upgrade.cost;
            purchasedUpgrades.push(upgradeId);
            calculateMoneyPerSecond();
            updateUI();
        } else {
            alert('Cannot purchase upgrade!');
        }
    }

    // --- UI Update Functions ---

    function updateUI() {
        updateStats();
        renderOwnedPokemon();
        renderFavoritePokemon();
        updateTrainerUI();
    }

    function updateStats() {
        moneyDisplay.textContent = Math.floor(money);
        moneyPerSecondDisplay.textContent = moneyPerSecond.toFixed(1);
        prestigePointsDisplay.textContent = prestigePoints;
        prestigeMultiplierDisplay.textContent = `${prestigeMultiplier.toFixed(2)}x`;
    }

    function updateTrainerUI() {
        trainerLevelDisplay.textContent = trainerLevel;
        xpBar.value = trainerXp;
        xpBar.max = xpToNextLevel;
        xpText.textContent = `${trainerXp} / ${xpToNextLevel} XP`;
    }

    function renderOwnedPokemon() {
        pokemonContainer.innerHTML = '';
        for (const id in ownedPokemon) {
            const pokemon = pokemonData.find(p => p.id === id);
            if (pokemon) { // Check if the pokemon exists in the current data
                const count = ownedPokemon[id];
                if (count > 0) {
                    const pokemonElement = document.createElement('div');
                    pokemonElement.className = 'pokemon-instance';
                    if (id === favoritePokemon) {
                        pokemonElement.classList.add('favorite');
                    }
                    if (shinyPokemon.includes(id)) {
                        pokemonElement.classList.add('shiny');
                    }
                    pokemonElement.innerHTML = `
                        <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
                        <span>${pokemon.name} (x${count})</span>
                    `;
                    pokemonElement.addEventListener('click', () => setFavoritePokemon(id));
                    pokemonContainer.appendChild(pokemonElement);
                }
            }
        }
    }

    function setFavoritePokemon(pokemonId) {
        if (ownedPokemon[pokemonId] > 0) {
            favoritePokemon = pokemonId;
            calculateMoneyPerSecond();
            updateUI();
        }
    }

    function renderFavoritePokemon() {
        favoritePokemonSlot.innerHTML = '';
        if (favoritePokemon) {
            const pokemon = pokemonData.find(p => p.id === favoritePokemon);
            if (pokemon) {
                const pokemonElement = document.createElement('div');
                pokemonElement.className = 'pokemon-instance favorite';
                 if (shinyPokemon.includes(favoritePokemon)) {
                    pokemonElement.classList.add('shiny');
                }
                pokemonElement.innerHTML = `
                    <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
                    <span>${pokemon.name}</span>
                `;
                favoritePokemonSlot.appendChild(pokemonElement);
            }
        } else {
            favoritePokemonSlot.innerHTML = '<span>Select a Pokémon from your collection to be your favorite!</span>';
        }
    }
    
    function renderStore() {
        storeItemsContainer.innerHTML = '';
        pokemonData.forEach(pokemon => {
            const storeItemElement = document.createElement('div');
            storeItemElement.className = 'store-item';
            storeItemElement.innerHTML = `
                <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
                <p>${pokemon.name}</p>
                <p>Cost: ${pokemon.cost}</p>
                <p>MPS: ${pokemon.mps}</p>
            `;
            storeItemElement.onclick = () => buyPokemon(pokemon.id);
            storeItemsContainer.appendChild(storeItemElement);
        });
    }

    function renderUpgrades() {
        upgradesItemsContainer.innerHTML = '';
        upgradesData.forEach(upgrade => {
            const isPurchased = purchasedUpgrades.includes(upgrade.id);
            const canAfford = money >= upgrade.cost;
            const targetPokemon = pokemonData.find(p => p.id === upgrade.target);

            // Ensure the target pokemon for the upgrade exists, or if it's a global upgrade
            if (upgrade.target === 'all' || targetPokemon) {
                const hasRequired = upgrade.required === 0 || (ownedPokemon[upgrade.target] && ownedPokemon[upgrade.target] >= upgrade.required);

                if (hasRequired) {
                    const upgradeItemElement = document.createElement('div');
                    upgradeItemElement.className = `upgrade-item ${isPurchased ? 'purchased' : ''} ${!canAfford && !isPurchased ? 'unaffordable' : ''}`;
                    upgradeItemElement.innerHTML = `
                        <p>${upgrade.name}</p>
                        <p>Cost: ${upgrade.cost}</p>
                        <p>${upgrade.target === 'all' ? 'All Pokémon' : targetPokemon.name} MPS x${upgrade.multiplier}</p>
                    `;
                    if (!isPurchased) {
                        upgradeItemElement.onclick = () => buyUpgrade(upgrade.id);
                    }
                    upgradesItemsContainer.appendChild(upgradeItemElement);
                }
            }
        });
    }

    // --- Trainer Level System ---
    function gainXp(amount) {
        trainerXp += amount;
        if (trainerXp >= xpToNextLevel) {
            trainerLevel++;
            trainerXp -= xpToNextLevel;
            xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
            alert(`Congratulations! You've reached level ${trainerLevel}!`);
            // Apply level up bonus
            moneyPerSecond *= 1.1;
        }
        updateTrainerUI();
    }

    // --- Game Loop ---
    function gameLoop() {
        money += moneyPerSecond / 10; // Update money 10 times per second for smoother feeling
        updateStats();
        checkAchievements();

        if (Math.random() < 0.0001) { // 0.01% chance every 100ms
            triggerRandomEvent();
        }

        if (money >= PRESTIGE_REQUIREMENT) {
            prestigeButton.style.display = 'inline-block';
        }
    }

    function triggerRandomEvent() {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        event.action();
    }

    function uiLoop() {
        renderStore();
        renderUpgrades();
        renderAchievements();
        updateBackground();
    }

    // --- Dynamic Background ---
    function updateBackground() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            document.body.className = 'day';
        } else if (hour >= 18 && hour < 20) {
            document.body.className = 'sunset';
        } else {
            document.body.className = 'night';
        }
    }

    // --- Achievement Logic ---
    function checkAchievements() {
        achievementsData.forEach(achievement => {
            if (!unlockedAchievements.includes(achievement.id) && achievement.condition()) {
                unlockedAchievements.push(achievement.id);
                alert(`Achievement Unlocked: ${achievement.name}`);
            }
        });
    }

    function renderAchievements() {
        achievementsItemsContainer.innerHTML = '';
        achievementsData.forEach(achievement => {
            const achievementItemElement = document.createElement('div');
            achievementItemElement.className = `achievement-item ${unlockedAchievements.includes(achievement.id) ? 'unlocked' : ''}`;
            achievementItemElement.title = achievement.description;
            achievementItemElement.innerHTML = `<p>${achievement.name}</p>`;
            achievementsItemsContainer.appendChild(achievementItemElement);
        });
    }

    // --- Prestige Logic ---
    function prestige() {
        if (money >= PRESTIGE_REQUIREMENT) {
            const newPrestigePoints = Math.floor(Math.sqrt(money / PRESTIGE_REQUIREMENT));
            prestigePoints += newPrestigePoints;
            prestigeMultiplier = 1 + prestigePoints * 0.1;

            // Reset progress
            money = 15;
            ownedPokemon = {};
            purchasedUpgrades = [];
            unlockedAchievements = []; // Reset achievements
            favoritePokemon = null; // Reset favorite pokemon
            shinyPokemon = []; // Reset shiny pokemon
            trainerLevel = 1;
            trainerXp = 0;
            xpToNextLevel = 100;
            prestigeButton.style.display = 'none';

            calculateMoneyPerSecond();
            updateUI();
            alert(`You have prestiged for ${newPrestigePoints} points! Your new multiplier is ${prestigeMultiplier.toFixed(2)}x`);
        }
    }

    // --- Save/Load Logic ---
    function saveGame() {
        const gameState = {
            money: money,
            ownedPokemon: ownedPokemon,
            purchasedUpgrades: purchasedUpgrades,
            prestigePoints: prestigePoints,
            prestigeMultiplier: prestigeMultiplier,
            unlockedAchievements: unlockedAchievements,
            favoritePokemon: favoritePokemon,
            shinyPokemon: shinyPokemon,
            trainerLevel: trainerLevel,
            trainerXp: trainerXp,
            xpToNextLevel: xpToNextLevel,
            lastSave: Date.now() // Store the timestamp
        };
        localStorage.setItem('pokemonIdleSave', JSON.stringify(gameState));
        alert('Game Saved!');
    }

    function loadGame() {
        try {
            const savedState = localStorage.getItem('pokemonIdleSave');

            if (savedState) {
                const gameState = JSON.parse(savedState);
                money = gameState.money || 0;
                ownedPokemon = gameState.ownedPokemon || {};
                purchasedUpgrades = gameState.purchasedUpgrades || [];
                prestigePoints = gameState.prestigePoints || 0;
                prestigeMultiplier = gameState.prestigeMultiplier || 1;
                unlockedAchievements = gameState.unlockedAchievements || [];
                favoritePokemon = gameState.favoritePokemon || null;
                shinyPokemon = gameState.shinyPokemon || [];
                trainerLevel = gameState.trainerLevel || 1;
                trainerXp = gameState.trainerXp || 0;
                xpToNextLevel = gameState.xpToNextLevel || 100;

                return gameState.lastSave; // Return the last save time
            } else {
                money = 15; // Starting money for new players
                return null;
            }
        } catch (e) {
            console.error("Error loading saved game:", e);
            // Reset to a clean state if loading fails
            money = 15;
            ownedPokemon = {};
            purchasedUpgrades = [];
            prestigePoints = 0;
            prestigeMultiplier = 1;
            unlockedAchievements = [];
            favoritePokemon = null;
            shinyPokemon = [];
            trainerLevel = 1;
            trainerXp = 0;
            xpToNextLevel = 100;
            alert('Failed to load saved game. Starting a new game.');
            return null;
        }
    }
    
    // --- Initialization ---
    function init() {
        const lastSaveTime = loadGame(); // Load saved data first
        calculateMoneyPerSecond();

        if (lastSaveTime) {
            const offlineTime = (Date.now() - lastSaveTime) / 1000; // in seconds
            const offlineEarnings = offlineTime * moneyPerSecond;
            if (offlineEarnings > 0) {
                money += offlineEarnings;
                alert(`Welcome back! You earned ${Math.floor(offlineEarnings)} Pokédollars while you were away.`);
            } else {
                alert('Game Loaded!');
            }
        }

        updateUI();
        setInterval(gameLoop, 100); // Game loop runs every 100ms
        setInterval(uiLoop, 1000); // UI loop runs every second

        saveButton.addEventListener('click', saveGame);
        loadButton.addEventListener('click', () => {
            loadGame();
            calculateMoneyPerSecond();
            updateUI();
            alert('Game Loaded!');
        });
        prestigeButton.addEventListener('click', prestige);

        pokemonContainer.addEventListener('click', (e) => {
            // Check if the click was on a pokemon instance
            if (e.target.closest('.pokemon-instance')) {
                return;
            }

            money += clickValue;
            createFloatingNumber(e.clientX, e.clientY, clickValue);
            updateStats();
        });

        pokeballContainer.addEventListener('click', (e) => {
            const clickMoney = 1;
            money += clickMoney;
            gainXp(1);
            createFloatingNumber(e.clientX, e.clientY, clickMoney);
            updateStats();

            if (Math.random() < 0.1) { // 10% chance to drop a random pokemon
                const randomPokemon = pokemonData[Math.floor(Math.random() * pokemonData.length)];
                ownedPokemon[randomPokemon.id] = (ownedPokemon[randomPokemon.id] || 0) + 1;
                gainXp(10);
                calculateMoneyPerSecond();
                updateUI();
                alert(`The Poké Ball dropped a ${randomPokemon.name}!`);
            }
        });

        battleButton.addEventListener('click', startBattle);
    }

    function startBattle() {
        const playerPower = moneyPerSecond;
        const opponentPower = Math.random() * playerPower * 2;

        let logMessage = `You challenged an opponent with ${opponentPower.toFixed(0)} power. Your power is ${playerPower.toFixed(0)}.`;

        if (playerPower > opponentPower) {
            const reward = Math.floor(opponentPower * 10);
            money += reward;
            gainXp(50);
            logMessage += `\nYou won and received ${reward} Pokédollars and 50 XP!`;
            battleLog.innerHTML += `<p style="color: green;">${logMessage}</p>`;
        } else {
            logMessage += `\nYou lost!`;
            battleLog.innerHTML += `<p style="color: red;">${logMessage}</p>`;
        }
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    function createFloatingNumber(x, y, value) {
        const numberElement = document.createElement('div');
        numberElement.className = 'floating-number';
        numberElement.textContent = `+${value}`;
        numberElement.style.left = `${x}px`;
        numberElement.style.top = `${y}px`;
        floatingNumbersContainer.appendChild(numberElement);

        numberElement.addEventListener('animationend', () => {
            numberElement.remove();
        });
    }

    init();
});
s