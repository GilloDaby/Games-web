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
    const automationModal = document.getElementById('automation-modal');
    const talentsModal = document.getElementById('talents-modal');
    const openAutomationButton = document.getElementById('open-automation');
    const openTalentsButton = document.getElementById('open-talents');
    const closeAutomationButton = document.getElementById('close-automation');
    const closeTalentsButton = document.getElementById('close-talents');
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
    const horizontalScrollers = Array.from(document.querySelectorAll('.horizontal-scroller'));
    const toastContainer = document.getElementById('toast-container');
    const trainerLevelDisplay = document.getElementById('trainer-level');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const clickPowerDisplay = document.getElementById('click-power');
    const dropChanceDisplay = document.getElementById('drop-chance');
    const idleBoostDisplay = document.getElementById('idle-boost');

    // --- Pokémon Data by generation ---
    const genRanges = [
        { gen: 1, start: 1, end: 151, label: 'Gen 1' },
        { gen: 2, start: 152, end: 251, label: 'Gen 2' },
        { gen: 3, start: 252, end: 386, label: 'Gen 3' },
        { gen: 4, start: 387, end: 493, label: 'Gen 4' },
        { gen: 5, start: 494, end: 649, label: 'Gen 5' },
        { gen: 6, start: 650, end: 721, label: 'Gen 6' },
        { gen: 7, start: 722, end: 809, label: 'Gen 7' },
        { gen: 8, start: 810, end: 905, label: 'Gen 8' },
        { gen: 9, start: 906, end: 1017, label: 'Gen 9' },
    ];

    const kantoPokemonNames = [
        'Bulbasaur','Ivysaur','Venusaur','Charmander','Charmeleon','Charizard','Squirtle','Wartortle','Blastoise','Caterpie','Metapod','Butterfree','Weedle','Kakuna','Beedrill','Pidgey','Pidgeotto','Pidgeot','Rattata','Raticate','Spearow','Fearow','Ekans','Arbok','Pikachu','Raichu','Sandshrew','Sandslash','Nidoran-F','Nidorina','Nidoqueen','Nidoran-M','Nidorino','Nidoking','Clefairy','Clefable','Vulpix','Ninetales','Jigglypuff','Wigglytuff','Zubat','Golbat','Oddish','Gloom','Vileplume','Paras','Parasect','Venonat','Venomoth','Diglett','Dugtrio','Meowth','Persian','Psyduck','Golduck','Mankey','Primeape','Growlithe','Arcanine','Poliwag','Poliwhirl','Poliwrath','Abra','Kadabra','Alakazam','Machop','Machoke','Machamp','Bellsprout','Weepinbell','Victreebel','Tentacool','Tentacruel','Geodude','Graveler','Golem','Ponyta','Rapidash','Slowpoke','Slowbro','Magnemite','Magneton','Farfetchd','Doduo','Dodrio','Seel','Dewgong','Grimer','Muk','Shellder','Cloyster','Gastly','Haunter','Gengar','Onix','Drowzee','Hypno','Krabby','Kingler','Voltorb','Electrode','Exeggcute','Exeggutor','Cubone','Marowak','Hitmonlee','Hitmonchan','Lickitung','Koffing','Weezing','Rhyhorn','Rhydon','Chansey','Tangela','Kangaskhan','Horsea','Seadra','Goldeen','Seaking','Staryu','Starmie','Mr. Mime','Scyther','Jynx','Electabuzz','Magmar','Pinsir','Tauros','Magikarp','Gyarados','Lapras','Ditto','Eevee','Vaporeon','Jolteon','Flareon','Porygon','Omanyte','Omastar','Kabuto','Kabutops','Aerodactyl','Snorlax','Articuno','Zapdos','Moltres','Dratini','Dragonair','Dragonite','Mewtwo','Mew'
    ];

    let currentGeneration = 1;
    let pokemonData = [];
    const nameCache = {};

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

    let upgradesData = [];
    const automationUpgradesData = [
        { id: 'auto-click-1', name: 'PokéBot v1', cost: 5000, autoClick: 1 },
        { id: 'auto-click-2', name: 'PokéBot v2', cost: 55000, autoClick: 4 },
        { id: 'auto-click-3', name: 'PokéBot v3', cost: 220000, autoClick: 12 },
        { id: 'auto-click-4', name: 'PokéBot v4', cost: 900000, autoClick: 30 },
        { id: 'auto-click-5', name: 'PokéBot v5', cost: 2600000, autoClick: 70 },
        { id: 'auto-buy-store', name: 'Auto Buy Store', cost: 1200000, autoBuyPokemon: true },
        { id: 'auto-buy-upgrades', name: 'Auto Buy Upgrades', cost: 2200000, autoBuyUpgrade: true }
    ];

    const talentsData = [
        { id: 'talent-mps-1', name: 'Boost MPS I', desc: '+5% MPS', cost: 1, mpsMult: 1.05 },
        { id: 'talent-click-1', name: 'Cliqueur I', desc: '+1 clic', cost: 1, clickBonus: 1, requires: ['talent-mps-1'] },
        { id: 'talent-shiny', name: 'Chasseur Shiny', desc: '+0.5% shiny', cost: 2, shinyBonus: 0.005, requires: ['talent-mps-1'] },
        { id: 'talent-mps-2', name: 'Boost MPS II', desc: '+10% MPS', cost: 2, mpsMult: 1.1, requires: ['talent-mps-1'] },
        { id: 'talent-click-2', name: 'Cliqueur II', desc: '+2 clic', cost: 2, clickBonus: 2, requires: ['talent-click-1'] },
        { id: 'talent-discount-store', name: 'Marchandage', desc: '-5% coûts store', cost: 2, storeDiscount: 0.05, requires: ['talent-mps-1'] },
        { id: 'talent-discount-upg', name: 'Ingé malin', desc: '-5% coûts upgrades', cost: 2, upgradeDiscount: 0.05, requires: ['talent-mps-2'] },
        { id: 'talent-mps-3', name: 'Boost MPS III', desc: '+15% MPS', cost: 3, mpsMult: 1.15, requires: ['talent-mps-2'] },
        { id: 'talent-click-3', name: 'Cliqueur III', desc: '+3 clic', cost: 3, clickBonus: 3, requires: ['talent-click-2'] }
    ];

    const dailyQuestsData = [
        { id: 'q-money', name: 'Gagner 100K', goal: 'money', target: 100000, reward: 1 },
        { id: 'q-clicks', name: 'Cliquer 250x', goal: 'clicks', target: 250, reward: 1 },
        { id: 'q-battles', name: 'Vaincre 5 rivaux', goal: 'battles', target: 5, reward: 1 },
        { id: 'q-catches', name: 'Capturer 20 Pokémon', goal: 'catches', target: 20, reward: 1 }
    ];

    const dynamicEventsPool = [
        { id: 'ev-mps', name: 'Pluie de Pokédollars', duration: 60000, mpsMult: 1.5, description: 'MPS x1.5 pendant 60s' },
        { id: 'ev-click', name: 'Turbo Click', duration: 45000, clickMult: 2, description: 'Clics x2 pendant 45s' },
        { id: 'ev-shiny', name: 'Lueur Shiny', duration: 30000, shinyBonus: 0.02, description: 'Chance shiny +2% pendant 30s' }
    ];

    const PRESTIGE_REQUIREMENT = 50000000; // base requirement
    const SHINY_CHANCE = 0.01; // 1% chance
    const POKEBALL_DROP_CHANCE = 0.005; // 0.5% drop chance from the pokéball
    const SHINY_MULTIPLIER = 2; // 2x bonus for shiny

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
                showToast("Rush Pokédollars ! +1 000 cash.");
            }
        },
        {
            name: "Boost d'entraînement",
            message: "Tes Pokémon sont ultra motivés ! MPS x2 pendant 30s.",
            action: () => {
                temporaryMultiplier = 2;
                calculateMoneyPerSecond();
                showToast("Boost d'entraînement ! MPS doublé pendant 30s.");
                setTimeout(() => {
                    temporaryMultiplier = 1;
                    calculateMoneyPerSecond();
                    showToast("Le boost s'est dissipé.");
                }, 30000);
            }
        },
        {
            name: "Team Rocket en maraude",
            message: "Team Rocket vole 10% de tes Pokédollars !",
            action: () => {
                money *= 0.9;
                showToast("Team Rocket a volé 10% de ta banque.");
            }
        }
    ];

    let clickValue = 1;
    let currentOpponent = null;
    let battlesFought = 0;
    let automationState = {
        autoClickPower: 0,
        autoClickRate: 0, // clicks per second equivalent
        autoBuyPokemon: false,
        autoBuyUpgrade: false
    };
    let purchasedAutomation = [];
    let talentPoints = 0;
    let unlockedTalents = [];
    let talentBonuses = { mpsMult: 1, clickBonus: 0, shinyBonus: 0, storeDiscount: 0, upgradeDiscount: 0 };
    let questProgress = { money: 0, clicks: 0, battles: 0, catches: 0 };
    let completedQuests = [];
    let activeEvent = null;
    let activeEventEndsAt = 0;

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

    function showToast(message) {
        if (!toastContainer) return;
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    function totalOwnedPokemon() {
        return Object.values(ownedPokemon).reduce((a, b) => a + b, 0);
    }

    function primeKantoNames() {
        kantoPokemonNames.forEach((name, idx) => {
            nameCache[idx + 1] = name;
        });
    }

    function getShinyChance() {
        let chance = SHINY_CHANCE + talentBonuses.shinyBonus;
        if (activeEvent && activeEvent.shinyBonus) {
            chance += activeEvent.shinyBonus;
        }
        return chance;
    }

    function ensureName(dex) {
        if (nameCache[dex]) return nameCache[dex];
        // Try to fetch from PokeAPI asynchronously; fallback is placeholder
        fetch(`https://pokeapi.co/api/v2/pokemon/${dex}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.name) {
                    nameCache[dex] = data.name.charAt(0).toUpperCase() + data.name.slice(1);
                }
            })
            .catch(() => {});
        return `Pokemon #${dex}`;
    }

    function buildPokemonData(gen) {
        const range = genRanges.find(r => r.gen === gen) || genRanges[0];
        const difficultyFactor = 1 + (gen - 1) * 0.7;
        const list = [];
        for (let dex = range.start; dex <= range.end; dex++) {
            const indexInGen = dex - range.start;
            const name = ensureName(dex);
            const safeId = `dex-${dex}`;
            const cost = Math.floor(25 * Math.pow(1.2, indexInGen) * difficultyFactor);
            const mps = parseFloat((1.2 * Math.pow(1.16, indexInGen) * difficultyFactor).toFixed(2));
            list.push({
                id: safeId,
                dex,
                name,
                cost,
                mps,
                imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`
            });
        }
        return list;
    }

    function buildUpgrades(gen) {
        const difficultyFactor = 1 + (gen - 1) * 0.5;
        return baseUpgradeConfig.map((upg, idx) => {
            const cost = Math.floor(250 * Math.pow(2.6, idx) * difficultyFactor);
            return { ...upg, cost };
        });
    }

    function getSpriteUrl(pokemon) {
        if (!pokemon) return '';
        const baseDex = pokemon.dex;
        if (shinyPokemon.includes(pokemon.id)) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${baseDex}.png`;
        }
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${baseDex}.png`;
    }

    function recalculateClickValue() {
        clickValue = 1;
        purchasedUpgrades.forEach(upgId => {
            const upgrade = upgradesData.find(u => u.id === upgId);
            if (upgrade && upgrade.clickBonus) {
                clickValue += upgrade.clickBonus;
            }
        });
        clickValue += talentBonuses.clickBonus;
    }

    function refreshGenerationData() {
        primeKantoNames();
        pokemonData = buildPokemonData(currentGeneration);
        upgradesData = buildUpgrades(currentGeneration);
    }

    function recalcAutomation() {
        automationState.autoClickRate = 0;
        automationState.autoBuyPokemon = false;
        automationState.autoBuyUpgrade = false;
        purchasedAutomation.forEach(id => {
            const a = automationUpgradesData.find(item => item.id === id);
            if (a && a.autoClick) {
                automationState.autoClickRate += a.autoClick;
            }
            if (a && a.autoBuyPokemon) automationState.autoBuyPokemon = true;
            if (a && a.autoBuyUpgrade) automationState.autoBuyUpgrade = true;
        });
    }

    function recalcTalents() {
        talentBonuses = { mpsMult: 1, clickBonus: 0, shinyBonus: 0, storeDiscount: 0, upgradeDiscount: 0 };
        unlockedTalents.forEach(id => {
            const t = talentsData.find(tal => tal.id === id);
            if (!t) return;
            if (t.mpsMult) talentBonuses.mpsMult *= t.mpsMult;
            if (t.clickBonus) talentBonuses.clickBonus += t.clickBonus;
            if (t.shinyBonus) talentBonuses.shinyBonus += t.shinyBonus;
            if (t.storeDiscount) talentBonuses.storeDiscount += t.storeDiscount;
            if (t.upgradeDiscount) talentBonuses.upgradeDiscount += t.upgradeDiscount;
        });
        recalculateClickValue();
        calculateMoneyPerSecond();
    }

    function effectiveClickValue() {
        let val = clickValue;
        if (activeEvent && activeEvent.clickMult) {
            val *= activeEvent.clickMult;
        }
        return val;
    }

    function discountedCost(baseCost, type) {
        if (type === 'store') {
            return Math.floor(baseCost * (1 - talentBonuses.storeDiscount));
        }
        if (type === 'upgrade') {
            return Math.floor(baseCost * (1 - talentBonuses.upgradeDiscount));
        }
        return baseCost;
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
        const variance = (Math.random() * 0.5 + 0.75); // 75% to 125%
        const difficulty = Math.pow(1.12, battlesFought) * (1 + (currentGeneration - 1) * 0.5); // exponential scaling with battles fought + gen
        const power = Math.max(15, basePower * variance * difficulty);
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
                    pokemonMps *= SHINY_MULTIPLIER; // shiny bonus
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
        moneyPerSecond *= talentBonuses.mpsMult;
        if (activeEvent && activeEvent.mpsMult) {
            moneyPerSecond *= activeEvent.mpsMult;
        }
    }

    function buyPokemon(pokemonId) {
        const pokemonIndex = pokemonData.findIndex(p => p.id === pokemonId);
        const pokemon = pokemonData[pokemonIndex];
        if (!pokemon) return;

        if (pokemonIndex > 0) {
            const previousId = pokemonData[pokemonIndex - 1].id;
            if (!(ownedPokemon[previousId] > 0)) {
                showToast('Achète le Pokémon précédent pour débloquer celui-ci.');
                return;
            }
        }

        const cost = discountedCost(pokemon.cost, 'store');
        if (money >= cost) {
            money -= cost;
            ownedPokemon[pokemonId] = (ownedPokemon[pokemonId] || 0) + 1;
            gainXp(10);

            if (Math.random() < getShinyChance()) {
                if (!shinyPokemon.includes(pokemonId)) {
                    shinyPokemon.push(pokemonId);
                    showToast(`Shiny trouvé ! ${pokemon.name} rejoint l'équipe (bonus x${SHINY_MULTIPLIER}).`);
                    gainXp(100);
                }
            }

            calculateMoneyPerSecond();
            updateUI();
        } else {
            showToast('Pas assez de Pokédollars !');
        }
    }

    function buyUpgrade(upgradeId) {
        const upgradeIndex = upgradesData.findIndex(u => u.id === upgradeId);
        const upgrade = upgradesData[upgradeIndex];
        if (!upgrade) return;

        if (upgradeIndex > 0) {
            const prevId = upgradesData[upgradeIndex - 1].id;
            if (!purchasedUpgrades.includes(prevId)) {
                showToast('Achète l\'upgrade précédente pour débloquer celle-ci.');
                return;
            }
        }

        const cost = discountedCost(upgrade.cost, 'upgrade');

        if (money >= cost && !purchasedUpgrades.includes(upgradeId)) {
            money -= cost;
            purchasedUpgrades.push(upgradeId);
            recalculateClickValue();
            calculateMoneyPerSecond();
            updateUI();
        } else {
            showToast('Amélioration impossible !');
        }
    }

    function buyAutomation(autoId) {
        const auto = automationUpgradesData.find(a => a.id === autoId);
        if (!auto || purchasedAutomation.includes(autoId)) return;
        if (money >= auto.cost) {
            money -= auto.cost;
            purchasedAutomation.push(autoId);
            recalcAutomation();
            updateUI();
            showToast(`${auto.name} activé`);
        } else {
            showToast('Pas assez de Pokédollars pour cet auto-bot.');
        }
    }

    function autoBuyNextPokemon() {
        for (let i = 0; i < pokemonData.length; i++) {
            const p = pokemonData[i];
            const cost = discountedCost(p.cost, 'store');
            if (money >= cost) {
                buyPokemon(p.id);
                break;
            }
            if ((ownedPokemon[p.id] || 0) === 0) break;
        }
    }

    function autoBuyNextUpgrade() {
        for (let i = 0; i < upgradesData.length; i++) {
            const u = upgradesData[i];
            if (purchasedUpgrades.includes(u.id)) continue;
            const prevId = upgradesData[i - 1]?.id;
            if (i > 0 && !purchasedUpgrades.includes(prevId)) break;
            const cost = discountedCost(u.cost, 'upgrade');
            if (money >= cost) {
                buyUpgrade(u.id);
            }
            break;
        }
    }

    function unlockTalent(talentId) {
        const talent = talentsData.find(t => t.id === talentId);
        if (!talent || unlockedTalents.includes(talentId)) return;
        const depsMet = !talent.requires || talent.requires.every(r => unlockedTalents.includes(r));
        if (!depsMet) {
            showToast('Débloque les talents requis d\'abord.');
            return;
        }
        if (talentPoints >= talent.cost) {
            talentPoints -= talent.cost;
            unlockedTalents.push(talentId);
            recalcTalents();
            renderTalents();
            updateStats();
            showToast(`Talent débloqué : ${talent.name}`);
        } else {
            showToast('Pas assez de points talent.');
        }
    }

    // --- UI Update Functions ---

    function updateUI() {
        updateStats();
        renderOwnedPokemon();
        renderFavoritePokemon();
        updateTrainerUI();
        renderAutomation();
        renderTalents();
        renderQuests();
        updateEventBanner();
    }

    function updateStats() {
        moneyDisplay.textContent = formatNumber(Math.floor(money));
        moneyPerSecondDisplay.textContent = formatNumber(moneyPerSecond);
        prestigePointsDisplay.textContent = `${formatNumber(prestigePoints)} (Gen ${currentGeneration})`;
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

    function enableDragScroll(el) {
        let isDown = false;
        let startX;
        let scrollLeft;
        el.addEventListener('mousedown', (e) => {
            isDown = true;
            el.classList.add('dragging');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        });
        el.addEventListener('mouseleave', () => {
            isDown = false;
            el.classList.remove('dragging');
        });
        el.addEventListener('mouseup', () => {
            isDown = false;
            el.classList.remove('dragging');
        });
        el.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 1.2;
            el.scrollLeft = scrollLeft - walk;
        });
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
                        <img src="${getSpriteUrl(pokemon)}" alt="${pokemon.name}">
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
                    <img src="${getSpriteUrl(pokemon)}" alt="${pokemon.name}">
                    <span>${pokemon.name}</span>
                `;
                favoritePokemonSlot.appendChild(pokemonElement);
            }
        } else {
            favoritePokemonSlot.innerHTML = '<span>Choisis un Pokémon possédé pour le mettre en favori.</span>';
        }
    }

    function renderAutomation() {
        const container = document.getElementById('automation-items');
        if (!container) return;
        container.innerHTML = '';
        automationUpgradesData.forEach(upg => {
            const purchased = purchasedAutomation.includes(upg.id);
            const canAfford = money >= upg.cost;
            const pill = document.createElement('div');
            pill.className = `pill ${purchased ? 'purchased' : ''} ${!canAfford && !purchased ? 'locked' : ''}`;
            pill.innerHTML = `
                <strong>${upg.name}</strong>
                <span>${upg.autoClick ? `Auto-clic: +${upg.autoClick}/s` : ''} ${upg.autoBuyPokemon ? 'Auto-buy Pokémon' : ''} ${upg.autoBuyUpgrade ? 'Auto-buy Upgrades' : ''}</span>
                <small>Prix: ${formatNumber(upg.cost)}</small>
            `;
            if (!purchased) {
                const btn = document.createElement('button');
                btn.className = 'btn small';
                btn.textContent = 'Acheter';
                btn.disabled = !canAfford;
                btn.onclick = () => buyAutomation(upg.id);
                pill.appendChild(btn);
            } else {
                const badge = document.createElement('span');
                badge.className = 'muted';
                badge.textContent = 'Pris';
                pill.appendChild(badge);
            }
            container.appendChild(pill);
        });
    }

    function renderTalents() {
        const container = document.getElementById('talents-grid');
        const label = document.getElementById('talent-points-label');
        if (!container) return;
        container.innerHTML = '';
        if (label) label.textContent = `${talentPoints} pts`;
        talentsData.forEach(t => {
            const unlocked = unlockedTalents.includes(t.id);
            const canAfford = talentPoints >= t.cost;
            const depsMet = !t.requires || t.requires.every(r => unlockedTalents.includes(r));
            const pill = document.createElement('div');
            pill.className = `pill ${unlocked ? 'purchased' : ''} ${!depsMet ? 'locked' : ''}`;
            pill.innerHTML = `
                <strong>${t.name}</strong>
                <span>${t.desc}</span>
                <small>Coût: ${t.cost} pt</small>
            `;
            if (!unlocked) {
                const btn = document.createElement('button');
                btn.className = 'btn small';
                btn.textContent = 'Débloquer';
                btn.disabled = !canAfford || !depsMet;
                btn.onclick = () => unlockTalent(t.id);
                pill.appendChild(btn);
            } else {
                const badge = document.createElement('span');
                badge.className = 'muted';
                badge.textContent = 'Actif';
                pill.appendChild(badge);
            }
            container.appendChild(pill);
        });
    }

    function renderQuests() {
        const container = document.getElementById('quests-list');
        if (!container) return;
        container.innerHTML = '';
        dailyQuestsData.forEach(q => {
            const done = completedQuests.includes(q.id);
            let value = 0;
            if (q.goal === 'money') value = questProgress.money;
            if (q.goal === 'clicks') value = questProgress.clicks;
            if (q.goal === 'battles') value = questProgress.battles;
            if (q.goal === 'catches') value = questProgress.catches;
            const pill = document.createElement('div');
            pill.className = `pill ${done ? 'purchased' : ''}`;
            pill.innerHTML = `
                <strong>${q.name}</strong>
                <span>${Math.min(value, q.target)} / ${q.target}</span>
                <small>Récompense: +${q.reward} pt talent</small>
            `;
            container.appendChild(pill);
        });
    }

    function updateEventBanner() {
        const banner = document.getElementById('event-banner');
        if (!banner) return;
        if (activeEvent) {
            const remaining = Math.max(0, activeEventEndsAt - Date.now());
            banner.style.display = 'block';
            banner.textContent = `${activeEvent.name} — ${activeEvent.description} (restant ${Math.ceil(remaining / 1000)}s)`;
        } else {
            banner.style.display = 'none';
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
            showToast(`Niveau ${trainerLevel} atteint ! GG !`);
            // Apply level up bonus
            moneyPerSecond *= 1.1;
        }
        updateTrainerUI();
    }

    // --- Game Loop ---
    function gameLoop() {
        const passiveIncome = moneyPerSecond / 10;
        const autoIncome = (automationState.autoClickRate * effectiveClickValue()) / 10;
        money += passiveIncome + autoIncome; // smoother
        questProgress.money += passiveIncome + autoIncome;
        if (automationState.autoBuyPokemon) {
            autoBuyNextPokemon();
        }
        if (automationState.autoBuyUpgrade) {
            autoBuyNextUpgrade();
        }
        updateStats();
        checkAchievements();
        renderQuests();

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
        maybeStartDynamicEvent();
        updateActiveEvent();
        checkQuests();
        renderQuests();
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

    function maybeStartDynamicEvent() {
        if (activeEvent) return;
        if (Math.random() < 0.01) { // ~1% chance per second
            activeEvent = dynamicEventsPool[Math.floor(Math.random() * dynamicEventsPool.length)];
            activeEventEndsAt = Date.now() + activeEvent.duration;
            showToast(`Event: ${activeEvent.name} — ${activeEvent.description}`);
            updateEventBanner();
            calculateMoneyPerSecond();
        }
    }

    function updateActiveEvent() {
        if (activeEvent && Date.now() >= activeEventEndsAt) {
            activeEvent = null;
            activeEventEndsAt = 0;
            showToast('Event terminé.');
            calculateMoneyPerSecond();
            updateEventBanner();
        } else {
            updateEventBanner();
        }
    }

    // --- Achievement Logic ---
    function checkAchievements() {
        achievementsData.forEach(achievement => {
            if (!unlockedAchievements.includes(achievement.id) && achievement.condition()) {
                unlockedAchievements.push(achievement.id);
                showToast(`Succès débloqué : ${achievement.name}`);
            }
        });
    }

    function checkQuests() {
        dailyQuestsData.forEach(q => {
            if (completedQuests.includes(q.id)) return;
            let value = 0;
            if (q.goal === 'money') value = questProgress.money;
            if (q.goal === 'clicks') value = questProgress.clicks;
            if (q.goal === 'battles') value = questProgress.battles;
            if (q.goal === 'catches') value = questProgress.catches;
            if (value >= q.target) {
                completedQuests.push(q.id);
                talentPoints += q.reward;
                showToast(`Quête terminée : ${q.name} (+${q.reward} point talent)`);
                recalcTalents();
                renderTalents();
                renderQuests();
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
            talentPoints += newPrestigePoints; // talent points reward

            // Avance à la génération suivante si possible
            if (currentGeneration < genRanges.length) {
                currentGeneration += 1;
                showToast(`Nouvelle génération débloquée : Gen ${currentGeneration}!`);
            }

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
            battlesFought = 0;
            prestigeButton.style.display = 'none';

            refreshGenerationData();
            calculateMoneyPerSecond();
            updateUI();
            showToast(`Prestige +${newPrestigePoints} ! Nouveau multiplicateur : ${prestigeMultiplier.toFixed(2)}x (Gen ${currentGeneration})`);
        }
    }

    // --- Save/Load Logic ---
    function saveGame() {
        const gameState = {
            money: money,
            ownedPokemon: ownedPokemon,
            purchasedUpgrades: purchasedUpgrades,
            purchasedAutomation: purchasedAutomation,
            prestigePoints: prestigePoints,
            prestigeMultiplier: prestigeMultiplier,
            unlockedAchievements: unlockedAchievements,
            favoritePokemon: favoritePokemon,
            shinyPokemon: shinyPokemon,
            trainerLevel: trainerLevel,
            trainerXp: trainerXp,
            xpToNextLevel: xpToNextLevel,
            currentGeneration: currentGeneration,
            talentPoints: talentPoints,
            unlockedTalents: unlockedTalents,
            questProgress: questProgress,
            completedQuests: completedQuests,
            lastSave: Date.now() // Store the timestamp
        };
        localStorage.setItem('pokemonIdleSave', JSON.stringify(gameState));
        showToast('Sauvegarde réussie !');
    }

    function loadGame() {
        try {
            const savedState = localStorage.getItem('pokemonIdleSave');

            if (savedState) {
                const gameState = JSON.parse(savedState);
                money = gameState.money || 0;
                ownedPokemon = gameState.ownedPokemon || {};
                purchasedUpgrades = gameState.purchasedUpgrades || [];
                purchasedAutomation = gameState.purchasedAutomation || [];
                prestigePoints = gameState.prestigePoints || 0;
                prestigeMultiplier = gameState.prestigeMultiplier || 1;
                unlockedAchievements = gameState.unlockedAchievements || [];
                favoritePokemon = gameState.favoritePokemon || null;
                shinyPokemon = gameState.shinyPokemon || [];
                trainerLevel = gameState.trainerLevel || 1;
                trainerXp = gameState.trainerXp || 0;
                xpToNextLevel = gameState.xpToNextLevel || 100;
                currentGeneration = gameState.currentGeneration || 1;
                talentPoints = gameState.talentPoints || 0;
                unlockedTalents = gameState.unlockedTalents || [];
                questProgress = gameState.questProgress || { money: 0, clicks: 0, battles: 0, catches: 0 };
                completedQuests = gameState.completedQuests || [];

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
            currentGeneration = 1;
            questProgress = { money: 0, clicks: 0, battles: 0, catches: 0 };
            completedQuests = [];
            purchasedAutomation = [];
            talentPoints = 0;
            unlockedTalents = [];
            showToast('Echec de chargement. Nouvelle partie lancée.');
            return null;
        }
    }
    
    // --- Initialization ---
    function init() {
        const lastSaveTime = loadGame(); // Load saved data first
        refreshGenerationData();
        recalculateClickValue();
        recalcAutomation();
        recalcTalents();
        calculateMoneyPerSecond();

        if (lastSaveTime) {
            const offlineTime = (Date.now() - lastSaveTime) / 1000; // in seconds
            const offlineEarnings = offlineTime * moneyPerSecond;
            if (offlineEarnings > 0) {
                money += offlineEarnings;
                showToast(`De retour ! +${Math.floor(offlineEarnings)} Pokédollars gagnés en offline.`);
            } else {
                showToast('Partie chargée !');
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
            showToast('Partie chargée !');
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

        if (openAutomationButton && automationModal && closeAutomationButton) {
            openAutomationButton.addEventListener('click', () => {
                automationModal.style.display = 'flex';
                renderAutomation();
            });
            closeAutomationButton.addEventListener('click', () => {
                automationModal.style.display = 'none';
            });
            automationModal.addEventListener('click', (e) => {
                if (e.target === automationModal) automationModal.style.display = 'none';
            });
        }

        if (openTalentsButton && talentsModal && closeTalentsButton) {
            openTalentsButton.addEventListener('click', () => {
                talentsModal.style.display = 'flex';
                renderTalents();
            });
            closeTalentsButton.addEventListener('click', () => {
                talentsModal.style.display = 'none';
            });
            talentsModal.addEventListener('click', (e) => {
                if (e.target === talentsModal) talentsModal.style.display = 'none';
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
        horizontalScrollers.forEach(enableDragScroll);

        pokemonContainer.addEventListener('click', (e) => {
            // Check if the click was on an empty area of the container
            if (e.target === pokemonContainer) {
                const clickMoney = effectiveClickValue();
                money += clickMoney;
                questProgress.money += clickMoney;
                questProgress.clicks += 1;
                gainXp(1);
                createFloatingNumber(e.clientX, e.clientY, clickMoney);
                updateStats();
                checkQuests();
            }
        });

        pokeballContainer.addEventListener('click', (e) => {
            const clickMoney = effectiveClickValue();
            money += clickMoney;
            questProgress.money += clickMoney;
            questProgress.clicks += 1;
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
                if (Math.random() < getShinyChance() && !shinyPokemon.includes(randomPokemon.id)) {
                    shinyPokemon.push(randomPokemon.id);
                    showToast(`Shiny trouvé ! ${randomPokemon.name} (bonus x${SHINY_MULTIPLIER}).`);
                }
                gainXp(10);
                questProgress.catches += 1;
                calculateMoneyPerSecond();
                updateUI();
                showToast(`Chance ! La Poké Ball a lâché un ${randomPokemon.name}.`);
                checkQuests();
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
            questProgress.money += reward;
            questProgress.battles += 1;
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
        battlesFought += 1;
        currentOpponent = generateOpponent();
        refreshBattlePreview();
        checkQuests();
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
