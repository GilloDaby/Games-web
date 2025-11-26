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
    const achievementsModal = document.getElementById('achievements-modal');
    const achievementsButton = document.getElementById('achievements-button');
    const closeAchievementsButton = document.getElementById('close-achievements');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const prestigeButton = document.getElementById('prestige-button');
    const pokeballContainer = document.getElementById('pokeball-container');
    const battleButton = document.getElementById('battle-button');
    const battleLog = document.getElementById('battle-log');
    const battleOpponentSprite = document.getElementById('battle-opponent-sprite');
    const battleOpponentName = document.getElementById('battle-opponent-name');
    const battleOpponentPower = document.getElementById('battle-opponent-power');
    const battlePlayerPower = document.getElementById('battle-player-power');
    const battleRisk = document.getElementById('battle-risk');
    const trainerLevelDisplay = document.getElementById('trainer-level');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const clickPowerDisplay = document.getElementById('click-power');
    const dropChanceDisplay = document.getElementById('drop-chance');
    const idleBoostDisplay = document.getElementById('idle-boost');

    // --- Pokémon Data (Kanto 1-151) ---
    const kantoPokemonNames = [
        'Bulbasaur','Ivysaur','Venusaur','Charmander','Charmeleon','Charizard','Squirtle','Wartortle','Blastoise','Caterpie','Metapod','Butterfree','Weedle','Kakuna','Beedrill','Pidgey','Pidgeotto','Pidgeot','Rattata','Raticate','Spearow','Fearow','Ekans','Arbok','Pikachu','Raichu','Sandshrew','Sandslash','Nidoran-F','Nidorina','Nidoqueen','Nidoran-M','Nidorino','Nidoking','Clefairy','Clefable','Vulpix','Ninetales','Jigglypuff','Wigglytuff','Zubat','Golbat','Oddish','Gloom','Vileplume','Paras','Parasect','Venonat','Venomoth','Diglett','Dugtrio','Meowth','Persian','Psyduck','Golduck','Mankey','Primeape','Growlithe','Arcanine','Poliwag','Poliwhirl','Poliwrath','Abra','Kadabra','Alakazam','Machop','Machoke','Machamp','Bellsprout','Weepinbell','Victreebel','Tentacool','Tentacruel','Geodude','Graveler','Golem','Ponyta','Rapidash','Slowpoke','Slowbro','Magnemite','Magneton','Farfetchd','Doduo','Dodrio','Seel','Dewgong','Grimer','Muk','Shellder','Cloyster','Gastly','Haunter','Gengar','Onix','Drowzee','Hypno','Krabby','Kingler','Voltorb','Electrode','Exeggcute','Exeggutor','Cubone','Marowak','Hitmonlee','Hitmonchan','Lickitung','Koffing','Weezing','Rhyhorn','Rhydon','Chansey','Tangela','Kangaskhan','Horsea','Seadra','Goldeen','Seaking','Staryu','Starmie','Mr. Mime','Scyther','Jynx','Electabuzz','Magmar','Pinsir','Tauros','Magikarp','Gyarados','Lapras','Ditto','Eevee','Vaporeon','Jolteon','Flareon','Porygon','Omanyte','Omastar','Kabuto','Kabutops','Aerodactyl','Snorlax','Articuno','Zapdos','Moltres','Dratini','Dragonair','Dragonite','Mewtwo','Mew'
    ];

    const pokemonData = kantoPokemonNames.map((name, index) => {
        const dex = index + 1;
        const safeId = `dex-${dex}`;
        const cost = Math.floor(25 * Math.pow(1.18, index)); // steeper curve for longer runs
        const mps = parseFloat((1.2 * Math.pow(1.14, index)).toFixed(2));
        return {
            id: safeId,
            dex,
            name,
            cost,
            mps,
            imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`
        };
    });

    const baseUpgradeConfig = [
        { id: 'click-1', name: 'Gants de Dresseur', target: 'click', clickBonus: 1 },
        { id: 'click-2', name: 'Scope Pro', target: 'click', clickBonus: 3 },
        { id: 'click-3', name: 'Turbo Tap', target: 'click', clickBonus: 8 },
        { id: 'all-1', name: 'Multi Exp', target: 'all', multiplier: 1.15 },
        { id: 'all-2', name: 'Encens Max', target: 'all', multiplier: 1.18 },
        { id: 'all-3', name: 'Hyper Potion', target: 'all', multiplier: 1.22 },
        { id: 'legend-144', name: 'Plume Articuno', target: 'all', multiplier: 1.25 },
        { id: 'legend-145', name: 'Éclair Zapdos', target: 'all', multiplier: 1.28 },
        { id: 'legend-146', name: 'Brasier Moltres', target: 'all', multiplier: 1.32 },
        { id: 'legend-150', name: 'Clone Mewtwo', target: 'all', multiplier: 1.4, clickBonus: 5 },
        { id: 'legend-151', name: 'Aura Mew', target: 'all', multiplier: 1.6, clickBonus: 10 }
    ];

    const upgradesData = baseUpgradeConfig.map((upg, idx) => {
        const cost = Math.floor(250 * Math.pow(2.4, idx)); // exponential scaling for longer game
        return { ...upg, cost };
    });

    const PRESTIGE_REQUIREMENT = 50000000; // plus long pour prestige
    const SHINY_CHANCE = 0.01; // 1% chance
    const POKEBALL_DROP_CHANCE = 0.005; // 0.5% drop chance from the pokéball

    const achievementsData = (() => {
        const list = [];

        // Argent progressif
        for (let i = 1; i <= 40; i++) {
            const target = Math.floor(10000 * Math.pow(1.35, i));
            list.push({
                id: `money-${i}`,
                name: `Fortune ${i}`,
                description: `Gagner ${formatNumber(target)} Pokédollars`,
                condition: () => money >= target
            });
        }

        // Nombre total de Pokémon
        for (let i = 1; i <= 30; i++) {
            const target = i * 10;
            list.push({
                id: `dex-${i}`,
                name: `Collection ${i}`,
                description: `Posséder ${target} Pokémon au total`,
                condition: () => totalOwnedPokemon() >= target
            });
        }

        // MPS milestones
        for (let i = 1; i <= 20; i++) {
            const target = Math.pow(1.32, i) * 50;
            list.push({
                id: `mps-${i}`,
                name: `Idle Master ${i}`,
                description: `Atteindre ${formatNumber(target)} MPS`,
                condition: () => moneyPerSecond >= target
            });
        }

        // Spéciaux / légendaires
        list.push(
            { id: 'prestige1', name: 'Premier Prestige', description: 'Prestiger au moins une fois', condition: () => prestigePoints > 0 },
            { id: 'legend-144', name: 'Articuno Obtenu', description: 'Acheter le légendaire 144', condition: () => (ownedPokemon['dex-144'] || 0) > 0 },
            { id: 'legend-145', name: 'Zapdos Obtenu', description: 'Acheter le légendaire 145', condition: () => (ownedPokemon['dex-145'] || 0) > 0 },
            { id: 'legend-146', name: 'Moltres Obtenu', description: 'Acheter le légendaire 146', condition: () => (ownedPokemon['dex-146'] || 0) > 0 },
            { id: 'legend-150', name: 'Mewtwo Capturé', description: 'Acheter Mewtwo', condition: () => (ownedPokemon['dex-150'] || 0) > 0 },
            { id: 'legend-151', name: 'Mew Capturé', description: 'Acheter Mew', condition: () => (ownedPokemon['dex-151'] || 0) > 0 },
            { id: 'click-5', name: 'Doigts d’acier', description: 'Atteindre 10 Pokédollars par clic', condition: () => clickValue >= 10 },
            { id: 'click-6', name: 'Main de maître', description: 'Atteindre 25 Pokédollars par clic', condition: () => clickValue >= 25 },
            { id: 'trainer-10', name: 'Coach', description: 'Atteindre le niveau de dresseur 10', condition: () => trainerLevel >= 10 },
            { id: 'trainer-20', name: 'Maître Coach', description: 'Atteindre le niveau de dresseur 20', condition: () => trainerLevel >= 20 }
        );

        return list.slice(0, 100);
    })();

    const randomEvents = [
        {
            name: "Rush Pokédollars",
            message: "Un sac de 1 000 Pokédollars apparaît !",
            action: () => {
                money += 1000;
                alert("Rush Pokédollars ! +1 000 cash.");
            }
        },
        {
            name: "Boost d'entraînement",
            message: "Tes Pokémon sont ultra motivés ! MPS x2 pendant 30s.",
            action: () => {
                temporaryMultiplier = 2;
                calculateMoneyPerSecond();
                alert("Boost d'entraînement ! MPS doublé pendant 30s.");
                setTimeout(() => {
                    temporaryMultiplier = 1;
                    calculateMoneyPerSecond();
                    alert("Le boost s'est dissipé.");
                }, 30000);
            }
        },
        {
            name: "Team Rocket en maraude",
            message: "Team Rocket vole 10% de tes Pokédollars !",
            action: () => {
                money *= 0.9;
                alert("Team Rocket a volé 10% de ta banque.");
            }
        }
    ];

    let clickValue = 1;
    let currentOpponent = null;

    // --- Game Logic ---

    function formatNumber(value) {
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        let idx = 0;
        let val = value;
        while (val >= 1000 && idx < suffixes.length - 1) {
            val /= 1000;
            idx++;
        }
        return `${val % 1 === 0 ? val : val.toFixed(1)}${suffixes[idx]}`;
    }

    function totalOwnedPokemon() {
        return Object.values(ownedPokemon).reduce((a, b) => a + b, 0);
    }

    function recalculateClickValue() {
        clickValue = 1;
        purchasedUpgrades.forEach(upgId => {
            const upgrade = upgradesData.find(u => u.id === upgId);
            if (upgrade && upgrade.clickBonus) {
                clickValue += upgrade.clickBonus;
            }
        });
    }

    function highestOwnedDexIndex() {
        let maxIndex = 0;
        Object.keys(ownedPokemon).forEach(id => {
            const idx = pokemonData.findIndex(p => p.id === id);
            if (idx > maxIndex && ownedPokemon[id] > 0) {
                maxIndex = idx;
            }
        });
        return maxIndex;
    }

    function generateOpponent() {
        const ownedMax = Math.max(5, highestOwnedDexIndex());
        const minIdx = Math.max(0, ownedMax - 5);
        const maxIdx = Math.min(pokemonData.length - 1, ownedMax + 5);
        const chosen = pokemonData[Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx];
        const basePower = moneyPerSecond || 10;
        const variance = (Math.random() * 0.8 + 0.6); // 60% to 140%
        const power = Math.max(10, basePower * variance);
        return { ...chosen, power };
    }

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
        const pokemonIndex = pokemonData.findIndex(p => p.id === pokemonId);
        const pokemon = pokemonData[pokemonIndex];
        if (!pokemon) return;

        if (pokemonIndex > 0) {
            const previousId = pokemonData[pokemonIndex - 1].id;
            if (!(ownedPokemon[previousId] > 0)) {
                alert('Achète le Pokémon précédent pour débloquer celui-ci.');
                return;
            }
        }

        if (money >= pokemon.cost) {
            money -= pokemon.cost;
            ownedPokemon[pokemonId] = (ownedPokemon[pokemonId] || 0) + 1;
            gainXp(10);

            if (Math.random() < SHINY_CHANCE) {
                if (!shinyPokemon.includes(pokemonId)) {
                    shinyPokemon.push(pokemonId);
                    alert(`Incroyable ! Tu as trouvé un ${pokemon.name} shiny !`);
                    gainXp(100);
                }
            }

            calculateMoneyPerSecond();
            updateUI();
        } else {
            alert('Pas assez de Pokédollars !');
        }
    }

    function buyUpgrade(upgradeId) {
        const upgradeIndex = upgradesData.findIndex(u => u.id === upgradeId);
        const upgrade = upgradesData[upgradeIndex];
        if (!upgrade) return;

        if (upgradeIndex > 0) {
            const prevId = upgradesData[upgradeIndex - 1].id;
            if (!purchasedUpgrades.includes(prevId)) {
                alert('Achète l\'upgrade précédente pour débloquer celle-ci.');
                return;
            }
        }

        if (money >= upgrade.cost && !purchasedUpgrades.includes(upgradeId)) {
            money -= upgrade.cost;
            purchasedUpgrades.push(upgradeId);
            recalculateClickValue();
            calculateMoneyPerSecond();
            updateUI();
        } else {
            alert('Amélioration impossible !');
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
        moneyDisplay.textContent = formatNumber(Math.floor(money));
        moneyPerSecondDisplay.textContent = formatNumber(moneyPerSecond);
        prestigePointsDisplay.textContent = formatNumber(prestigePoints);
        prestigeMultiplierDisplay.textContent = `${prestigeMultiplier.toFixed(2)}x`;
        updateHeroStats();
        refreshBattlePreview();
    }

    function updateHeroStats() {
        if (clickPowerDisplay) {
            clickPowerDisplay.textContent = `+${clickValue}`;
        }
        if (dropChanceDisplay) {
            dropChanceDisplay.textContent = `${(POKEBALL_DROP_CHANCE * 100).toFixed(0)}%`;
        }
        if (idleBoostDisplay) {
            idleBoostDisplay.textContent = `${(temporaryMultiplier * prestigeMultiplier).toFixed(2)}x`;
        }
    }

    function refreshBattlePreview() {
        if (!battleOpponentName || !battleOpponentSprite || !battleOpponentPower || !battleRisk) return;
        if (!currentOpponent) currentOpponent = generateOpponent();
        battleOpponentName.textContent = `#${currentOpponent.dex} ${currentOpponent.name}`;
        battleOpponentSprite.src = currentOpponent.imageUrl;
        battleOpponentPower.textContent = `Puissance: ${formatNumber(currentOpponent.power)}`;
        if (battlePlayerPower) {
            battlePlayerPower.textContent = `Ta puissance: ${formatNumber(moneyPerSecond || 1)}`;
        }
        battleRisk.textContent = `Risque: perte 10% cash & -10 XP en cas de défaite`;
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
                        <span>${pokemon.name} (x${formatNumber(count)})</span>
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
            favoritePokemonSlot.innerHTML = '<span>Choisis un Pokémon possédé pour le mettre en favori.</span>';
        }
    }
    
    function renderStore() {
        storeItemsContainer.innerHTML = '';
        pokemonData.forEach((pokemon, index) => {
            const unlocked = index === 0 || (ownedPokemon[pokemonData[index - 1].id] || 0) > 0;
            const isLocked = !unlocked;
            const canAfford = money >= pokemon.cost;
            const storeItemElement = document.createElement('div');
            storeItemElement.className = `store-item ${isLocked ? 'locked' : ''} ${!canAfford && !isLocked ? 'unaffordable' : ''}`;
            const prevDex = Math.max(1, pokemon.dex - 1);
            storeItemElement.innerHTML = `
                <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
                <p>#${pokemon.dex} ${pokemon.name}</p>
                <p>${isLocked ? `Débloque après #${prevDex}` : `Prix: ${formatNumber(pokemon.cost)}`}</p>
                <p>${isLocked ? 'Locked' : `MPS: ${formatNumber(pokemon.mps)}`}</p>
            `;
            if (!isLocked) {
                storeItemElement.onclick = () => buyPokemon(pokemon.id);
            }
            storeItemsContainer.appendChild(storeItemElement);
        });
    }

    function renderUpgrades() {
        upgradesItemsContainer.innerHTML = '';
        upgradesData.forEach((upgrade, index) => {
            const isPurchased = purchasedUpgrades.includes(upgrade.id);
            const previousId = upgradesData[index - 1]?.id;
            const unlocked = index === 0 || purchasedUpgrades.includes(previousId);
            const canAfford = money >= upgrade.cost;
            const upgradeItemElement = document.createElement('div');
            const description = upgrade.clickBonus
                ? `Clique +${upgrade.clickBonus}`
                : upgrade.target === 'all'
                    ? `Tous MPS x${upgrade.multiplier}`
                    : 'Boost MPS';

            upgradeItemElement.className = `upgrade-item ${isPurchased ? 'purchased' : ''} ${!unlocked ? 'locked' : ''} ${!canAfford && !isPurchased && unlocked ? 'unaffordable' : ''}`;
            upgradeItemElement.innerHTML = `
                <p>${upgrade.name}</p>
                <p>Prix: ${formatNumber(upgrade.cost)}</p>
                <p>${description}</p>
                ${!unlocked && !isPurchased ? '<p style="color:#ccc;">Acheter l\'upgrade précédente</p>' : ''}
            `;
            if (!isPurchased && unlocked) {
                upgradeItemElement.onclick = () => buyUpgrade(upgrade.id);
            }
            upgradesItemsContainer.appendChild(upgradeItemElement);
        });
    }

    // --- Trainer Level System ---
    function gainXp(amount) {
        trainerXp += amount;
        if (trainerXp >= xpToNextLevel) {
            trainerLevel++;
            trainerXp -= xpToNextLevel;
            xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
            alert(`Niveau ${trainerLevel} atteint ! GG !`);
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
                alert(`Succès débloqué : ${achievement.name}`);
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
            clickValue = 1;
            prestigeButton.style.display = 'none';

            calculateMoneyPerSecond();
            updateUI();
            alert(`Prestige +${newPrestigePoints} ! Nouveau multiplicateur : ${prestigeMultiplier.toFixed(2)}x`);
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
        alert('Sauvegarde réussie !');
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
            alert('Echec de chargement. Nouvelle partie lancée.');
            return null;
        }
    }
    
    // --- Initialization ---
    function init() {
        const lastSaveTime = loadGame(); // Load saved data first
        recalculateClickValue();
        calculateMoneyPerSecond();

        if (lastSaveTime) {
            const offlineTime = (Date.now() - lastSaveTime) / 1000; // in seconds
            const offlineEarnings = offlineTime * moneyPerSecond;
            if (offlineEarnings > 0) {
                money += offlineEarnings;
                alert(`De retour ! +${Math.floor(offlineEarnings)} Pokédollars gagnés en offline.`);
            } else {
                alert('Partie chargée !');
            }
        }

        updateUI();
        setInterval(gameLoop, 100); // Game loop runs every 100ms
        setInterval(uiLoop, 1000); // UI loop runs every second

        saveButton.addEventListener('click', saveGame);
        loadButton.addEventListener('click', () => {
            loadGame();
            recalculateClickValue();
            calculateMoneyPerSecond();
            updateUI();
            alert('Partie chargée !');
        });
        prestigeButton.addEventListener('click', prestige);
        if (achievementsButton && achievementsModal && closeAchievementsButton) {
            achievementsButton.addEventListener('click', () => {
                achievementsModal.style.display = 'flex';
                renderAchievements();
            });
            closeAchievementsButton.addEventListener('click', () => {
                achievementsModal.style.display = 'none';
            });
            achievementsModal.addEventListener('click', (e) => {
                if (e.target === achievementsModal) {
                    achievementsModal.style.display = 'none';
                }
            });
        }

        currentOpponent = generateOpponent();
        refreshBattlePreview();

        document.querySelectorAll('.scroll-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
                }
            });
        });

        pokemonContainer.addEventListener('click', (e) => {
            // Check if the click was on an empty area of the container
            if (e.target === pokemonContainer) {
                const clickMoney = clickValue;
                money += clickMoney;
                gainXp(1);
                createFloatingNumber(e.clientX, e.clientY, clickMoney);
                updateStats();
            }
        });

        pokeballContainer.addEventListener('click', (e) => {
            const clickMoney = clickValue;
            money += clickMoney;
            gainXp(1);
            const rect = pokeballContainer.getBoundingClientRect();
            createFloatingNumber(rect.left + rect.width / 2, rect.top, clickMoney);
            updateStats();

            const ownedMaxIndex = highestOwnedDexIndex();
            const allowedMaxIndex = Math.min(pokemonData.length - 1, ownedMaxIndex + 2);
            const droppablePokemon = pokemonData.slice(0, allowedMaxIndex + 1);
            if (Math.random() < POKEBALL_DROP_CHANCE && droppablePokemon.length > 0) {
                const randomPokemon = droppablePokemon[Math.floor(Math.random() * droppablePokemon.length)];
                ownedPokemon[randomPokemon.id] = (ownedPokemon[randomPokemon.id] || 0) + 1;
                gainXp(10);
                calculateMoneyPerSecond();
                updateUI();
                alert(`Chance ! La Poké Ball a lâché un ${randomPokemon.name}.`);
            }
        });

        battleButton.addEventListener('click', startBattle);
    }

    function startBattle() {
        if (!currentOpponent) currentOpponent = generateOpponent();
        const playerPower = moneyPerSecond || 1;
        const opponentPower = currentOpponent.power;

        let logMessage = `Rival: ${currentOpponent.name} (Puissance ${formatNumber(opponentPower)}) vs toi (${formatNumber(playerPower)}).`;

        if (playerPower > opponentPower) {
            const reward = Math.floor(opponentPower * 12);
            const rewardText = formatNumber(reward);
            money += reward;
            gainXp(80);
            logMessage += `\nVictoire ! +${rewardText} Pokédollars et +80 XP.`;
            battleLog.innerHTML += `<p style="color: green;">${logMessage}</p>`;
        } else {
            const lossMoney = Math.floor(money * 0.1);
            money = Math.max(0, money - lossMoney);
            trainerXp = Math.max(0, trainerXp - 10);
            logMessage += `\nDéfaite ! -${formatNumber(lossMoney)} Pokédollars et -10 XP.`;
            battleLog.innerHTML += `<p style="color: red;">${logMessage}</p>`;
        }
        battleLog.scrollTop = battleLog.scrollHeight;
        currentOpponent = generateOpponent();
        refreshBattlePreview();
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
