import { translations } from './i18n/translations.js';
import { formatNumber, getLevelForXp, getCurrentXpForLevel, getXpToLevelUp, calcStat } from './utils/math.js';
import { createToastController } from './ui/uiToasts.js';
import {
    genRanges,
    kantoPokemonNames,
    baseUpgradeConfig,
    automationUpgradesData,
    talentsData,
    questPool,
    dynamicEventsPool,
    leaguesData,
    gymLeadersData,
    eliteFourData,
    bossData,
    challengesData,
    consumablesData,
    itemDrops
} from './features/gameData.js';
import { persistGameState, readGameState } from './save/saveGame.js';

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
    let battlePokemonId = null;
    let shinyPokemon = [];
    let defeatedGyms = {};
    let defeatedEliteFour = {};
    let trainerLevel = 1;
    let trainerXp = 0;
    let xpToNextLevel = 100;
    let pokemonXP = {};
    let settings = {
        floatingNumbers: true,
        dynamicBackground: true,
        language: 'en',
        showToasts: true,
        musicVolume: 0.7,
        sfxVolume: 0.8,
    };
    let upgradesData = [];

    const nameCache = {};
    let currentGeneration = 1;
    let pokemonData = [];


    function currentLanguage() {
        return settings.language || 'fr';
    }

    function t(key) {
        const lang = currentLanguage();
        if (translations[lang] && translations[lang][key]) return translations[lang][key];
        if (translations.fr && translations.fr[key]) return translations.fr[key];
        return key;
    }
    let battleState = null;
    let nextBattleAllowedAt = 0;
    let battleDataLoaded = false;
    const movesById = {};
    const pokemonTypesMap = {};
    const typeChart = {};
    const baseStatsByPokemon = {};
    const learnsetByPokemon = {};
    const POKEAPI_CSV_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
    const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
    const TYPE_ID_MAP = {
        1: 'normal', 2: 'fighting', 3: 'flying', 4: 'poison', 5: 'ground',
        6: 'rock', 7: 'bug', 8: 'ghost', 9: 'steel', 10: 'fire', 11: 'water',
        12: 'grass', 13: 'electric', 14: 'psychic', 15: 'ice', 16: 'dragon',
        17: 'dark', 18: 'fairy'
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
    const battlePokemonIdSlot = document.getElementById('favorite-pokemon-slot');
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
    const openLeaguesButton = document.getElementById('open-leagues');
    const closeLeaguesButton = document.getElementById('close-leagues');
    const leaguesModal = document.getElementById('leagues-modal');
    const leaguesList = document.getElementById('leagues-list');
    const openGymsButton = document.getElementById('open-gyms');
    const closeGymsButton = document.getElementById('close-gyms');
    const gymsModal = document.getElementById('gyms-modal');
    const gymsList = document.getElementById('gyms-list');
    const openChallengesButton = document.getElementById('open-challenges');
    const closeChallengesButton = document.getElementById('close-challenges');
    const challengesModal = document.getElementById('challenges-modal');
    const challengesList = document.getElementById('challenges-list');
    const openInventoryButton = document.getElementById('open-inventory');
    const closeInventoryButton = document.getElementById('close-inventory');
    const inventoryModal = document.getElementById('inventory-modal');
    const inventoryList = document.getElementById('inventory-list');
    const openPokedexButton = document.getElementById('open-pokedex');
    const closePokedexButton = document.getElementById('close-pokedex');
    const pokedexModal = document.getElementById('pokedex-modal');
    const pokedexGrid = document.getElementById('pokedex-grid');
    const pokedexSummary = document.getElementById('pokedex-summary');
    const settingsButton = document.getElementById('settings-button');
    const settingsContainer = document.getElementById('settings-container');
    const settingsCloseButton = document.getElementById('settings-close');
    const languageSelect = document.getElementById('setting-language');
    const toggleToasts = document.getElementById('toggle-toasts');
    const toggleFloatingNumbers = document.getElementById('toggle-floating-numbers');
    const toggleDynamicBackground = document.getElementById('toggle-dynamic-background');
    const musicSlider = document.getElementById('setting-music-volume');
    const sfxSlider = document.getElementById('setting-sfx-volume');
    const openAutoBuyButton = document.getElementById('open-auto-buy');
    const closeAutoBuyButton = document.getElementById('close-auto-buy');
    const autoBuyModal = document.getElementById('auto-buy-modal');
    const autoBuyGridModal = document.getElementById('auto-buy-grid-modal');
    const autoBuyCurrentLabel = document.getElementById('auto-buy-current');
    const footerBar = document.getElementById('footer-bar');
    const expandStoreButton = document.getElementById('expand-store');
    const expandUpgradesButton = document.getElementById('expand-upgrades');
    const ownedPokemonModal = document.getElementById('owned-pokemon-modal');
    const ownedPokemonModalGrid = document.getElementById('owned-pokemon-grid');
    const closeOwnedPokemonModalButton = document.getElementById('close-owned-pokemon');
    const changePokemonModal = document.getElementById('change-pokemon-modal');
    const closeChangePokemonModal = document.getElementById('close-change-pokemon-modal');
    const changePokemonGrid = document.getElementById('change-pokemon-grid');
    const changeBattlePokemonButton = document.getElementById('change-battle-pokemon-button');
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
    const battlePlayerLabel = document.getElementById('battle-player-label');
    const battlePlayerHpFill = document.getElementById('battle-player-hp-fill');
    const battlePlayerHpText = document.getElementById('battle-player-hp-text');
    const battlePlayerSprite = document.getElementById('battle-player-sprite');
    const battlePokemonXpContainer = document.getElementById('battle-pokemon-xp-container');
    const battlePokemonXpBar = document.getElementById('battle-pokemon-xp-bar');
    const battlePokemonXpText = document.getElementById('battle-pokemon-xp-text');
    const battleFoeLabel = document.getElementById('battle-foe-label');
    const battleFoeHpFill = document.getElementById('battle-foe-hp-fill');
    const battleFoeHpText = document.getElementById('battle-foe-hp-text');
    const battleFoeSprite = document.getElementById('battle-foe-sprite');
    const battleActions = document.getElementById('battle-actions');
    const horizontalScrollers = Array.from(document.querySelectorAll('.horizontal-scroller'));
    const toastContainer = document.getElementById('toast-container');
    const { toast, showToast, translateWithParams } = createToastController({ translate: t, settings, toastContainer });

    const storeFilterButtons = Array.from(document.querySelectorAll('[data-store-filter]'));
    const trainerLevelDisplay = document.getElementById('trainer-level');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const clickPowerDisplay = document.getElementById('click-power');
    const dropChanceDisplay = document.getElementById('drop-chance');
    const idleBoostDisplay = document.getElementById('idle-boost');
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialHighlight = document.getElementById('tutorial-highlight');
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialText = document.getElementById('tutorial-text');
    const tutorialNextButton = document.getElementById('tutorial-next');
    const tutorialBackButton = document.getElementById('tutorial-back');
    const tutorialSkipButton = document.getElementById('tutorial-skip');
    const TUTORIAL_SEEN_KEY = 'pokemonIdleTutorialSeenV1';
    let tutorialStepIndex = 0;
    let tutorialActive = false;
    let tutorialTargetListener = null;
    let tutorialSteps = [];

        // --- Pok�mon Data by generation (external data) ---
    const PRESTIGE_REQUIREMENT = 5000000000; // base requirement
    const SHINY_CHANCE = 1 / 4096; // align closer to main games
    const POKEBALL_DROP_CHANCE = 0.005; // 0.5% drop chance from the pokéball
    const SHINY_MULTIPLIER = 2; // 2x bonus for shiny
    const BATTLE_LEVEL_BASE = 30;

    // --- Battle data loading (PokeAPI official CSV on GitHub) ---
    async function fetchCsv(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`CSV fetch failed: ${url}`);
        const text = await res.text();
        return text.split('\n').map(l => l.trim()).filter(Boolean);
    }

    function parseCsvRow(line) {
        // Simple split sufficient for PokeAPI CSV we use (no embedded commas in selected columns)
        return line.split(',');
    }

    async function loadBattleData() {
        if (battleDataLoaded) return;
        const [movesCsv, typesCsv, efficacyCsv, pokemonTypesCsv, pokemonStatsCsv, pokemonMovesCsv] = await Promise.all([
            fetchCsv(`${POKEAPI_CSV_BASE}/moves.csv`),
            fetchCsv(`${POKEAPI_CSV_BASE}/types.csv`),
            fetchCsv(`${POKEAPI_CSV_BASE}/type_efficacy.csv`),
            fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_types.csv`),
            fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_stats.csv`),
            fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_moves.csv`),
        ]);

        const typeNameById = {};
        typesCsv.slice(1).forEach(line => {
            const [id, identifier] = parseCsvRow(line);
            typeNameById[Number(id)] = identifier;
        });

        efficacyCsv.slice(1).forEach(line => {
            const [damageTypeId, targetTypeId, factor] = parseCsvRow(line).map(Number);
            const atk = typeNameById[damageTypeId];
            const def = typeNameById[targetTypeId];
            if (!atk || !def) return;
            if (!typeChart[atk]) typeChart[atk] = {};
            typeChart[atk][def] = (factor || 100) / 100;
        });

movesCsv.slice(1).forEach(line => {
            const cols = parseCsvRow(line);
            const id = Number(cols[0]);
            const identifier = cols[1];
            
            const typeId = Number(cols[3]); // C'est la bonne colonne pour le Type

            const power = cols[4] ? Number(cols[4]) : 0;
            const pp = cols[5] ? Number(cols[5]) : 10;
            const accuracy = cols[6] ? Number(cols[6]) : 100;
            const damageClassId = Number(cols[9]); // 2 phys, 3 special, 1 status
            const type = typeNameById[typeId] || TYPE_ID_MAP[typeId] || 'normal';
            
            movesById[id] = {
                id,
                name: identifier.replace(/-/g, ' '),
                type,
                power,
                pp,
                accuracy,
                damageClass: damageClassId === 3 ? 'special' : damageClassId === 2 ? 'physical' : 'status',
            };
        });

        pokemonTypesCsv.slice(1).forEach(line => {
            const cols = parseCsvRow(line);
            const pokemonId = Number(cols[0]);
            const typeId = Number(cols[1]);
            const typeName = typeNameById[typeId] || TYPE_ID_MAP[typeId];
            if (!pokemonTypesMap[pokemonId]) pokemonTypesMap[pokemonId] = [];
            if (typeName) pokemonTypesMap[pokemonId].push(typeName);
        });

        pokemonStatsCsv.slice(1).forEach(line => {
            const cols = parseCsvRow(line);
            const pokemonId = Number(cols[0]);
            const statId = Number(cols[1]);
            const baseStat = Number(cols[2]);
            if (!baseStatsByPokemon[pokemonId]) baseStatsByPokemon[pokemonId] = {};
            const statKey = ['hp','atk','def','spa','spd','spe'][statId - 1];
            if (statKey) baseStatsByPokemon[pokemonId][statKey] = baseStat;
        });

        pokemonMovesCsv.slice(1).forEach(line => {
            const cols = parseCsvRow(line);
            const pokemonId = Number(cols[0]);
            if (pokemonId > 251) return; // limiter pour perf
            const versionGroupId = Number(cols[1]);
            const moveId = Number(cols[2]);
            const learnMethodId = Number(cols[3]); // pokemon_move_method_id
            const level = Number(cols[4]);
            if (learnMethodId !== 1) return; // level-up only
            if (!learnsetByPokemon[pokemonId]) learnsetByPokemon[pokemonId] = [];
            learnsetByPokemon[pokemonId].push({ moveId, level, versionGroupId });
        });

        battleDataLoaded = true;
    }

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
                toast('toast-rush');
            }
        },
        {
            name: "Boost d'entraînement",
            message: "Tes Pokémon sont ultra motivés ! MPS x2 pendant 30s.",
            action: () => {
                temporaryMultiplier = 2;
                calculateMoneyPerSecond();
                toast('toast-training-boost');
                setTimeout(() => {
                    temporaryMultiplier = 1;
                    calculateMoneyPerSecond();
                    toast('toast-boost-end');
                }, 30000);
            }
        },
        {
            name: "Team Rocket en maraude",
            message: "Team Rocket vole 10% de tes Pokédollars !",
            action: () => {
                money *= 0.9;
                toast('toast-team-rocket');
            }
        }
    ];

    let clickValue = 1;
    let currentOpponent = null;
    let battlesFought = 0;
    let currentGymBattle = null;
    const POKEMON_COST_GROWTH = 1.15;
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
    let dailyQuests = [];
    let dailyQuestDay = null;
    let questsHistory = {};
    let autoBuyTargetId = null;
    let autoBuyChainEnabled = true;
    let inventoryItems = {};
    let activeEvent = null;
    let activeEventEndsAt = 0;
    let activeChallenge = null;
    let activeConsumables = [];
    let knownSprites = {};
    let storeFilterGen = 'all';

    // --- Game Logic ---

    function pickMovesForPokemon(pokemonId) {
        const learnset = learnsetByPokemon[pokemonId] || [];
        if (!learnset.length) {
            const tackle = Object.values(movesById).find(m => m.name === 'tackle') || { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' };
            return [tackle];
        }
        const maxVersion = Math.max(...learnset.map(l => l.versionGroupId || 0));
        const candidates = learnset
            .filter(l => (l.versionGroupId || 0) === maxVersion)
            .map(m => ({ ...movesById[m.moveId], level: m.level }))
            .filter(m => m && m.name);
        candidates.sort((a, b) => (b.level || 0) - (a.level || 0) || (b.power || 0) - (a.power || 0));
        const unique = [];
        const names = new Set();
        for (const mv of candidates) {
            if (!mv) continue;
            if (names.has(mv.name)) continue;
            unique.push(mv);
            names.add(mv.name);
            if (unique.length >= 4) break;
        }
        if (!unique.length) {
            const tackle = Object.values(movesById).find(m => m.name === 'tackle') || { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' };
            unique.push(tackle);
        }
        return unique;
    }

    function buildCombatantFromDex(dex, options = {}) {
        const { levelBoost = 0, level: directLevel = 0 } = options;
        const pokemon = pokemonData.find(p => p.dex === dex || p.id === `dex-${dex}`);
        const pokemonId = Number(String(dex).replace('dex-', ''));
        const types = pokemonTypesMap[pokemonId] || ['normal'];
        const bases = baseStatsByPokemon[pokemonId] || { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 };
        const level = directLevel > 0 ? directLevel : Math.max(10, BATTLE_LEVEL_BASE + levelBoost);
        const stats = {
            hp: calcStat(bases.hp, level, true),
            atk: calcStat(bases.atk, level),
            def: calcStat(bases.def, level),
            spa: calcStat(bases.spa, level),
            spd: calcStat(bases.spd, level),
            spe: calcStat(bases.spe, level),
        };
        return {
            id: pokemonId,
            name: pokemon ? pokemon.name : `Pokemon #${pokemonId}`,
            sprite: pokemon ? pokemon.imageUrl : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
            types,
            level,
            stats,
            currentHp: stats.hp,
            moves: pickMovesForPokemon(pokemonId),
        };
    }

    function typeEffectiveness(moveType, defenderTypes) {
        let mult = 1;
        defenderTypes.forEach(t => {
            const eff = (typeChart[moveType] && typeChart[moveType][t]) || 1;
            mult *= eff;
        });
        return mult;
    }

    function computeDamage(attacker, defender, move) {
        if (!move || move.damageClass === 'status' || !move.power) return 0;
        const atk = move.damageClass === 'special' ? attacker.stats.spa : attacker.stats.atk;
        const def = move.damageClass === 'special' ? defender.stats.spd : defender.stats.def;
        const base = (((2 * attacker.level / 5 + 2) * move.power * (atk / Math.max(1, def))) / 50) + 2;
        const stab = attacker.types.includes(move.type) ? 1.5 : 1;
        const eff = typeEffectiveness(move.type, defender.types);
        const rand = 0.85 + Math.random() * 0.15;
        return Math.max(1, Math.floor(base * stab * eff * rand));
    }

    function pickPlayerPokemonForBattle() {
        if (!Object.keys(ownedPokemon).length) return null;
        let best = null;
        let bestCost = -1;
        pokemonData.forEach(p => {
            const qty = ownedPokemon[p.id] || 0;
            if (qty > 0 && p.cost > bestCost) {
                best = p;
                bestCost = p.cost;
            }
        });
        if (battlePokemonId && ownedPokemon[battlePokemonId]) {
            const fav = pokemonData.find(p => p.id === battlePokemonId);
            if (fav) best = fav;
        }
        return best;
    }

    function generateBattleOpponentCombatant(playerLevel = 1) {
        const maxDex = Math.max(...pokemonData.map(p => p.dex));
        const playerOwnedMax = highestOwnedDexIndex() + 1;
        const dex = Math.max(1, Math.min(maxDex, playerOwnedMax + Math.floor(Math.random() * 5)));
        
        const levelVariance = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const opponentLevel = Math.max(1, playerLevel + levelVariance);

        return buildCombatantFromDex(dex, { level: opponentLevel });
    }

    function effectivenessText(mult) {
        if (mult === 0) return "Ça n'a aucun effet...";
        if (mult > 1.5) return "C'est super efficace !";
        if (mult < 0.9) return "Ce n'est pas très efficace...";
        return "";
    }

    function renderBattleUI() {
        if (!battleState) return;
        const { player, foe } = battleState;
        if (battlePlayerLabel) battlePlayerLabel.textContent = `${player.name} Lv.${player.level}`;
        if (battleFoeLabel) battleFoeLabel.textContent = `${foe.name} Lv.${foe.level}`;
        if (battlePlayerSprite) battlePlayerSprite.src = player.sprite;
        if (battleFoeSprite) battleFoeSprite.src = foe.sprite;
        if (battleActions) {
            battleActions.innerHTML = '';
            player.moves.forEach(mv => {
                const btn = document.createElement('button');
                btn.className = 'btn small';
                btn.textContent = `${mv.name} (${mv.type.toUpperCase()})`;
                btn.addEventListener('click', () => performBattleTurn(mv));
                battleActions.appendChild(btn);
            });
        }
        updateHpBars();
    }

    function updateHpBars() {
        if (!battleState) return;
        const { player, foe } = battleState;
        const playerPct = Math.max(0, (player.currentHp / player.stats.hp) * 100);
        const foePct = Math.max(0, (foe.currentHp / foe.stats.hp) * 100);
        if (battlePlayerHpFill) battlePlayerHpFill.style.width = `${playerPct}%`;
        if (battleFoeHpFill) battleFoeHpFill.style.width = `${foePct}%`;
        if (battlePlayerHpText) battlePlayerHpText.textContent = `${player.currentHp}/${player.stats.hp}`;
        if (battleFoeHpText) battleFoeHpText.textContent = `${foe.currentHp}/${foe.stats.hp}`;
    }

    function logBattle(message, color = 'white') {
        if (!battleLog) return;
        const p = document.createElement('p');
        p.style.color = color;
        p.textContent = message;
        battleLog.appendChild(p);
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    function endBattle(victory) {
        if (currentGymBattle && victory) {
            currentGymBattle.teamIndex++;
            if (currentGymBattle.teamIndex < currentGymBattle.leader.team.length) {
                // There's another Pokémon to fight
                const nextFoePokemon = currentGymBattle.leader.team[currentGymBattle.teamIndex];
                const nextFoe = buildCombatantFromDex(nextFoePokemon.dex, { level: nextFoePokemon.level });
                logBattle(`Le champion envoie ${nextFoe.name} !`, '#ffb347');
                startBattle(nextFoe, true); // `true` to indicate it's a continuation
                return; // Skip normal end-of-battle rewards
            } else {
                // All Pokémon defeated, gym leader is beaten
                const gen = currentGeneration;
                if (!defeatedGyms[gen]) {
                    defeatedGyms[gen] = [];
                }
                defeatedGyms[gen].push(currentGymBattle.leader.id);
                toast(`Victoire ! Vous avez vaincu ${currentGymBattle.leader.name} !`);
                currentGymBattle = null;
                renderGyms();
            }
        } else if (currentGymBattle && !victory) {
            // Player lost the gym battle
            toast(`Défaite contre ${currentGymBattle.leader.name}...`);
            currentGymBattle = null;
            nextBattleAllowedAt = Date.now() + 10000;
        } else {
             const { foe } = battleState;
            if (victory) {
                const xpGained = 80;
                const reward = Math.floor(foe.level * 120 * prestigeMultiplier);
                money += reward;
                gainXp(xpGained); // Grant XP to trainer
                if (battlePokemonId) {
                    if (!pokemonXP[battlePokemonId]) {
                        pokemonXP[battlePokemonId] = 0;
                    }
                    pokemonXP[battlePokemonId] += xpGained;
                }
                questProgress.money += reward;
                questProgress.battles += 1;
                toast('toast-victory', { reward: formatNumber(reward) });
            } else {
                const lossMoney = Math.floor(money * 0.08);
                money = Math.max(0, money - lossMoney);
                trainerXp = Math.max(0, trainerXp - 10);
                toast('toast-defeat', { loss: formatNumber(lossMoney) });
                nextBattleAllowedAt = Date.now() + 10000;
            }
        }

        battlesFought += 1;
        updateStats();
        checkQuests();
        
        if(!currentGymBattle) { // only reset if not in a gym battle sequence
            battleState.finished = true;
            currentOpponent = null;
            refreshBattlePreview();
        }
    }

    function performBattleTurn(playerMove) {
        if (!battleState || battleState.finished) return;
        const { player, foe } = battleState;
        battleLog.innerHTML = '';

        const foeMove = chooseBestMove(foe, player);

        const order = [];
        const playerPriority = player.stats.spe >= foe.stats.spe ? 0 : 1;
        if (playerPriority === 0) order.push({ actor: player, target: foe, move: playerMove, isPlayer: true }, { actor: foe, target: player, move: foeMove, isPlayer: false });
        else order.push({ actor: foe, target: player, move: foeMove, isPlayer: false }, { actor: player, target: foe, move: playerMove, isPlayer: true });

        for (const step of order) {
            if (player.currentHp <= 0 || foe.currentHp <= 0) continue;
            const { actor, target, move, isPlayer } = step;
            if (move.accuracy && Math.random() * 100 > move.accuracy) {
                logBattle(`${actor.name} rate ${move.name} !`, '#ffb347');
                continue;
            }
            const dmg = computeDamage(actor, target, move);
            target.currentHp = Math.max(0, target.currentHp - dmg);
            const effText = effectivenessText(typeEffectiveness(move.type, target.types));
            logBattle(`${actor.name} utilise ${move.name} (${dmg} dégâts). ${effText}`, isPlayer ? '#9be7ff' : '#ffd166');
            updateHpBars();
            if (target.currentHp <= 0) {
                logBattle(`${target.name} est K.O. !`, '#ff6961');
            }
        }

        if (foe.currentHp <= 0) {
            endBattle(true);
        } else if (player.currentHp <= 0) {
            endBattle(false);
        }
    }

    function chooseBestMove(attacker, target) {
        // Favorise super efficace, puis puissance, puis aléatoire pondéré
        const scored = attacker.moves.map(mv => {
            const eff = typeEffectiveness(mv.type, target.types);
            const dmg = computeDamage(attacker, target, mv);
            const score = (dmg || 0) * eff * (mv.accuracy ? mv.accuracy / 100 : 1);
            return { mv, score };
        }).sort((a, b) => b.score - a.score);
        const top = scored[0] ? scored[0].mv : attacker.moves[0];
        // petite randomisation pour éviter la monotonie
        if (scored.length > 1 && Math.random() < 0.2) return scored[1].mv;
        return top;
    }

    function detachTutorialTargetListener() {
        if (tutorialTargetListener && tutorialTargetListener.el) {
            tutorialTargetListener.el.removeEventListener('click', tutorialTargetListener.handler);
        }
        tutorialTargetListener = null;
    }

    function positionTutorialHighlight(target, padding = 10) {
        if (!tutorialHighlight) return;
        if (!target) {
            tutorialHighlight.style.display = 'none';
            return;
        }
        const rect = target.getBoundingClientRect();
        const pad = Math.max(6, padding);
        tutorialHighlight.style.display = 'block';
        tutorialHighlight.style.width = `${rect.width + pad * 2}px`;
        tutorialHighlight.style.height = `${rect.height + pad * 2}px`;
        tutorialHighlight.style.left = `${rect.left - pad}px`;
        tutorialHighlight.style.top = `${rect.top - pad}px`;
    }

    function refreshTutorialHighlight() {
        if (!tutorialActive) return;
        const step = tutorialSteps[tutorialStepIndex];
        if (!step) return;
        const target = step.selector ? document.querySelector(step.selector) : null;
        positionTutorialHighlight(target, step.padding || 10);
    }

    function showTutorialStep(index) {
        if (!tutorialOverlay) return;
        tutorialActive = true;
        tutorialStepIndex = Math.min(Math.max(index, 0), tutorialSteps.length - 1);
        const step = tutorialSteps[tutorialStepIndex];
        tutorialOverlay.classList.add('active');
        tutorialOverlay.classList.remove('tutorial-hidden');
        tutorialOverlay.setAttribute('aria-hidden', 'false');

        if (tutorialTitle) tutorialTitle.textContent = step.title;
        if (tutorialText) tutorialText.textContent = step.text;
        if (tutorialBackButton) tutorialBackButton.disabled = tutorialStepIndex === 0;
        if (tutorialNextButton) {
            const isLast = tutorialStepIndex === tutorialSteps.length - 1;
            tutorialNextButton.textContent = isLast ? t('tutorial-play') : t('tutorial-next');

        }

        const target = step.selector ? document.querySelector(step.selector) : null;
        const shouldScroll = step.scrollIntoView !== false; // scroll by default unless explicitly disabled
        if (target && shouldScroll) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
        positionTutorialHighlight(target, step.padding || 10);
        detachTutorialTargetListener();
        if (step.advanceOnClick && target) {
            const handler = () => nextTutorialStep();
            tutorialTargetListener = { el: target, handler };
            target.addEventListener('click', handler, { once: true });
        }
    }

    function nextTutorialStep() {
        if (!tutorialActive) return;
        if (tutorialStepIndex >= tutorialSteps.length - 1) {
            endTutorial(true);
            return;
        }
        showTutorialStep(tutorialStepIndex + 1);
    }

    function previousTutorialStep() {
        if (!tutorialActive) return;
        const prev = Math.max(0, tutorialStepIndex - 1);
        showTutorialStep(prev);
    }

    function endTutorial(markSeen = true) {
        tutorialActive = false;
        detachTutorialTargetListener();
        if (tutorialOverlay) {
            tutorialOverlay.classList.remove('active');
            tutorialOverlay.classList.add('tutorial-hidden');
            tutorialOverlay.setAttribute('aria-hidden', 'true');
        }
        if (tutorialHighlight) {
            tutorialHighlight.style.display = 'none';
        }
        if (markSeen) {
            try {
                localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
            } catch (e) {
                console.warn('Unable to persist tutorial flag', e);
            }
        }
    }

    function startTutorial() {
        showTutorialStep(0);
    }

    function startTutorialIfNeeded(lastSaveTime) {
        try {
            const hasSeen = localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
            if (hasSeen) return;
            const hasAnySave = !!localStorage.getItem('pokemonIdleSave');
            if (lastSaveTime || hasAnySave) {
                // Joueur de retour : on ne force pas le tutoriel.
                localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
                return;
            }
            startTutorial();
        } catch (e) {
            console.warn('Unable to evaluate tutorial state', e);
        }
    }

    function buildTutorialSteps() {
        tutorialSteps = [
            {
                id: 'click-ball',
                selector: '#pokeball-container',
                title: t('tutorial-click-title'),
                text: t('tutorial-click-text'),
                advanceOnClick: true,
                padding: 14
            },
            {
                id: 'store',
                selector: '#store-items',
                title: t('tutorial-store-title'),
                text: t('tutorial-store-text'),
                padding: 12
            },
            {
                id: 'upgrades',
                selector: '#upgrades-items',
                title: t('tutorial-upgrade-title'),
                text: t('tutorial-upgrade-text'),
                padding: 12
            },
            {
                id: 'battle',
                selector: '#battle-button',
                title: t('tutorial-battle-title'),
                text: t('tutorial-battle-text'),
                padding: 10,
                scrollIntoView: true
            },
            {
                id: 'save',
                selector: '#save-button',
                title: t('tutorial-save-title'),
                text: t('tutorial-save-text'),
                padding: 10
            }
        ];
    }

    // --- Settings UI ---
    function applySettingsUI() {
        if (languageSelect) {
            languageSelect.value = settings.language || 'fr';
        }
        if (toggleToasts) toggleToasts.checked = settings.showToasts !== false;
        if (toggleFloatingNumbers) toggleFloatingNumbers.checked = settings.floatingNumbers !== false;
        if (toggleDynamicBackground) toggleDynamicBackground.checked = settings.dynamicBackground !== false;
        if (musicSlider && typeof settings.musicVolume === 'number') {
            musicSlider.value = Math.round(settings.musicVolume * 100);
        }
        if (sfxSlider && typeof settings.sfxVolume === 'number') {
            sfxSlider.value = Math.round(settings.sfxVolume * 100);
        }
    }

    function openSettings() {
        if (!settingsContainer) return;
        const isOpen = settingsContainer.style.display === 'flex';
        if (isOpen) {
            closeSettings();
            return;
        }
        applySettingsUI();
        settingsContainer.style.display = 'flex';
    }

    function closeSettings() {
        if (!settingsContainer) return;
        settingsContainer.style.display = 'none';
    }

    function applyTranslations() {
        const nodes = document.querySelectorAll('[data-i18n]');
        nodes.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = t(key);
            const icon = el.querySelector && el.querySelector('i');
            if (icon && (el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.tagName === 'H2' || el.tagName === 'H3')) {
                el.innerHTML = `${icon.outerHTML} ${value}`;
            } else {
                el.textContent = value;
            }
        });
        document.documentElement.lang = currentLanguage();
        buildTutorialSteps();
        if (tutorialActive) {
            showTutorialStep(tutorialStepIndex);
        }
        refreshBattlePreview();
        updateHeroStats();
        if (languageSelect) {
            const optFr = languageSelect.querySelector('option[value="fr"]');
            const optEn = languageSelect.querySelector('option[value="en"]');
            const optEs = languageSelect.querySelector('option[value="es"]');
            const optPlaceholder = languageSelect.querySelector('option[value=""]');
            if (optFr) optFr.textContent = t('settings-lang-fr');
            if (optEn) optEn.textContent = t('settings-lang-en');
            if (optEs) optEs.textContent = t('settings-lang-es');
            if (optPlaceholder) optPlaceholder.textContent = t('settings-language-placeholder');
        }
    }

    function totalOwnedPokemon() {
        return Object.values(ownedPokemon).reduce((a, b) => a + b, 0);
    }

    function primeKantoNames(lang) { if (lang !== "en") return; if (!nameCache[lang]) nameCache[lang] = {}; kantoPokemonNames.forEach((name, idx) => { nameCache[lang][idx + 1] = name; }); }

    function getShinyChance() {
        let chance = SHINY_CHANCE + talentBonuses.shinyBonus;
        if (activeEvent && activeEvent.shinyBonus) {
            chance += activeEvent.shinyBonus;
        }
        activeConsumables.forEach(c => {
            if (c.effect.shinyBonus) chance += c.effect.shinyBonus;
        });
        purchasedUpgrades.forEach(id => {
            const upg = upgradesData.find(u => u.id === id);
            if (upg && upg.shinyBonus) chance += upg.shinyBonus;
        });
        return chance;
    }

    function ensureName(dex, lang = currentLanguage()) { if (!nameCache[lang]) nameCache[lang] = {}; if (nameCache[lang][dex]) return nameCache[lang][dex]; const fallbackEn = (nameCache["en"] && nameCache["en"][dex]) ? nameCache["en"][dex] : null; const placeholder = fallbackEn || `Pokemon #${dex}`; nameCache[lang][dex] = placeholder; fetch(`https://pokeapi.co/api/v2/pokemon-species/${dex}`) .then(res => res.json()) .then(data => { if (data && data.names) { const localized = data.names.find(n => n.language.name === lang)?.name || data.names.find(n => n.language.name === "en")?.name || data.name; if (localized) { nameCache[lang][dex] = localized.charAt(0).toUpperCase() + localized.slice(1); if (typeof updateUI === "function") { updateUI(); } } } }) .catch(() => {}); return placeholder; }

    function buildPokemonData(gen) {
        const range = genRanges.find(r => r.gen === gen) || genRanges[0];
        const difficultyFactor = 1 + (gen - 1) * 1.5; // Augmentation de la difficulté par génération
        const list = [];
        for (let dex = range.start; dex <= range.end; dex++) {
            const indexInGen = dex - range.start;
            const name = ensureName(dex, currentLanguage());
            const safeId = `dex-${dex}`;
            const cost = Math.floor(25 * Math.pow(1.25, indexInGen) * difficultyFactor); // Pokémon plus chers
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
        const difficultyFactor = 1 + (gen - 1) * 1.0; // Difficulté des améliorations accrue par génération
        return baseUpgradeConfig.map((upg, idx) => {
            const cost = Math.floor(220 * Math.pow(2.4, idx) * difficultyFactor); // courbe plus douce pour permettre plus d'upgrades clic
            return { ...upg, cost };
        });
    }

    function todayKey() {
        return new Date().toDateString();
    }

    function ensureDailyQuests() {
        const today = todayKey();
        if (dailyQuestDay !== today || !dailyQuests.length) {
            dailyQuestDay = today;
            questProgress = { money: 0, clicks: 0, battles: 0, catches: 0 };
            completedQuests = [];
            const quests = generateQuestsForDate(today);
            dailyQuests = quests;
            questsHistory[today] = { quests, completed: [] };
        }
    }

    function getSpriteUrl(pokemon) {
        if (!pokemon) return '';
        const baseDex = pokemon.dex;
        const key = shinyPokemon.includes(pokemon.id) ? `shiny-${baseDex}` : `norm-${baseDex}`;
        if (knownSprites[key]) return knownSprites[key];
        const url = shinyPokemon.includes(pokemon.id)
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${baseDex}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${baseDex}.png`;
        knownSprites[key] = url;
        return url;
    }

    function getItemSprite(iconName) {
        if (!iconName) return `${ITEM_SPRITE_BASE}poke-ball.png`;
        if (iconName.startsWith('http')) return iconName;
        return `${ITEM_SPRITE_BASE}${iconName}`;
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
        primeKantoNames('en');
        primeKantoNames(currentLanguage());
        pokemonData = [];
        for (let g = 1; g <= currentGeneration; g++) {
            pokemonData = pokemonData.concat(buildPokemonData(g));
        }
        upgradesData = buildUpgrades(currentGeneration);
        ensureDailyQuests();
    }

    function localizedUpgradeName(upgrade) {
        const key = `upgrade-${upgrade.id}`;
        const translated = t(key);
        if (translated && translated !== key) return translated;
        const hyper = /^Hyper Tap (\d+)/i.exec(upgrade.name);
        if (hyper) {
            return translateWithParams('upgrade-hyper-tap', { n: hyper[1] }, upgrade.name);
        }
        const sy = /^Synergie (\d+)/i.exec(upgrade.name);
        if (sy) {
            return translateWithParams('upgrade-synergy', { n: sy[1] }, upgrade.name);
        }
        return upgrade.name;
    }

    function recalcAutomation() {
        automationState.autoClickRate = 0;
        automationState.autoBuyPokemon = false;
        automationState.autoBuyUpgrade = false;
        automationState.autoBuyChain = false;
        purchasedAutomation.forEach(id => {
            const a = automationUpgradesData.find(item => item.id === id);
            if (a && a.autoClick) {
                automationState.autoClickRate += a.autoClick;
            }
            if (a && a.autoBuyPokemon) automationState.autoBuyPokemon = true;
            if (a && a.autoBuyUpgrade) automationState.autoBuyUpgrade = true;
            if (a && a.autoBuyChain && autoBuyChainEnabled) automationState.autoBuyChain = true;
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
        activeConsumables.forEach(c => {
            if (c.effect.clickMult) val *= c.effect.clickMult;
        });
        if (activeChallenge && activeChallenge.noClick) {
            val = 0;
        }
        return val;
    }

    function discountedCost(baseCost, type) {
        if (type === 'store') {
            let discount = talentBonuses.storeDiscount;
            activeConsumables.forEach(c => {
                if (c.effect.storeDiscount) discount += c.effect.storeDiscount;
            });
            return Math.floor(baseCost * (1 - discount));
        }
        if (type === 'upgrade') {
            return Math.floor(baseCost * (1 - talentBonuses.upgradeDiscount));
        }
        return baseCost;
    }

    function pokemonCurrentCost(pokemonOrId) {
        const pokemon = typeof pokemonOrId === 'string'
            ? pokemonData.find(p => p.id === pokemonOrId)
            : pokemonOrId;
        if (!pokemon) return Infinity;
        const ownedCount = ownedPokemon[pokemon.id] || 0;
        const scaled = pokemon.cost * Math.pow(POKEMON_COST_GROWTH, ownedCount);
        return discountedCost(scaled, 'store');
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
        const difficulty = Math.pow(1.12, battlesFought) * (1 + (currentGeneration - 1) * 0.5);
        const power = Math.max(15, basePower * variance * difficulty);
        return { ...chosen, power };
    }

    function calculateMoneyPerSecond() {
        moneyPerSecond = 0;
        for (const id in ownedPokemon) {
            const pokemon = pokemonData.find(p => p.id === id);
            if (pokemon) { // Check if pokemon exists in the current data
                let pokemonMps = pokemon.mps;

        if (id === battlePokemonId) {
            pokemonMps *= 2; // Double MPS for favorite pokemon
        }

        if (shinyPokemon.includes(id)) {
            pokemonMps *= SHINY_MULTIPLIER; // shiny bonus
        }
        if (activeChallenge && activeChallenge.shinyOnly && !shinyPokemon.includes(id)) {
            pokemonMps = 0;
        }

        // Apply specific and all upgrades
        purchasedUpgrades.forEach(upgradeId => {
            const upgrade = upgradesData.find(u => u.id === upgradeId);
            if (upgrade && upgrade.multiplier && (upgrade.target === id || upgrade.target === 'all')) {
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

    function grantPokemon(pokemonId) {
        const isFirstEverPokemon = totalOwnedPokemon() === 0;
        ownedPokemon[pokemonId] = (ownedPokemon[pokemonId] || 0) + 1;
        gainXp(10); // trainer xp

        if (isFirstEverPokemon) {
            let xpForLevel5 = 0;
            for (let i = 1; i < 5; i++) {
                xpForLevel5 += getXpToLevelUp(i);
            }
            if (!pokemonXP[pokemonId]) pokemonXP[pokemonId] = 0;
            pokemonXP[pokemonId] += xpForLevel5;
            if (!battlePokemonId) {
                setBattlePokemon(pokemonId);
            }
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

        const cost = pokemonCurrentCost(pokemon);
        if (money >= cost) {
            money -= cost;
            grantPokemon(pokemonId);

            if (Math.random() < getShinyChance()) {
                if (!shinyPokemon.includes(pokemon.id)) {
                    shinyPokemon.push(pokemon.id);
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
            if (auto.autoBuyPokemon) {
                autoBuyTargetId = autoBuyTargetId || pokemonData[0]?.id || null;
                renderAutomation();
            }
        } else {
            showToast('Pas assez de Pokédollars pour cet auto-bot.');
        }
    }

    function toggleAutoBuyChain() {
        if (!purchasedAutomation.includes('auto-buy-chain')) return;
        autoBuyChainEnabled = !autoBuyChainEnabled;
        recalcAutomation();
        renderAutomation();
        showToast(autoBuyChainEnabled ? 'Auto Buy Progressif ON' : 'Auto Buy Progressif OFF');
    }

    function autoBuyNextPokemon() {
        // Priorité au mode progressif pour avancer le Pokédex
        if (automationState.autoBuyChain) {
            let lastUnlockedIndex = -1;
            for (let i = 0; i < pokemonData.length; i++) {
                const prevOwned = i === 0 || (ownedPokemon[pokemonData[i - 1].id] || 0) > 0;
                if (!prevOwned) break;
                lastUnlockedIndex = i;
            }
            if (lastUnlockedIndex >= 0) {
                for (let i = lastUnlockedIndex; i >= 0; i--) {
                    const p = pokemonData[i];
                    if ((ownedPokemon[p.id] || 0) === 0) {
                        const cost = pokemonCurrentCost(p);
                        if (money >= cost) {
                            buyPokemon(p.id);
                        }
                        return;
                    }
                }
                for (let i = lastUnlockedIndex; i >= 0; i--) {
                    const p = pokemonData[i];
                    const cost = pokemonCurrentCost(p);
                    if (money >= cost) {
                        buyPokemon(p.id);
                        return;
                    }
                }
            }
        }

        // Sinon, on suit la cible manuelle
        const target = autoBuyTargetId ? pokemonData.find(p => p.id === autoBuyTargetId) : null;
        if (target) {
            const cost = pokemonCurrentCost(target);
            if (money >= cost) {
                buyPokemon(target.id);
                return;
            }
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

    async function startLeagueBattle(league, isBoss = false) {
        const entry = league.entry;
        if (money < entry) {
            showToast('Pas assez pour le ticket de ligue.');
            return;
        }
        money -= entry;
        showToast(`${league.name}: combat lancé (difficulté ${league.difficulty || 1}x)`);
        await startBattle();
        if (isBoss) battlesFought += 2;
    }

    function activateChallenge(challenge) {
        activeChallenge = challenge;
        showToast(`Challenge actif: ${challenge.name}`);
        calculateMoneyPerSecond();
        renderChallenges();
    }

    function useConsumable(item) {
        if (!inventoryItems[item.id] || inventoryItems[item.id] <= 0) {
            showToast('Aucun exemplaire dans l\'inventaire.');
            return;
        }
        inventoryItems[item.id] -= 1;
        const expiresAt = Date.now() + item.duration;
        activeConsumables.push({ ...item, expiresAt });
        showToast(`${item.name} activé.`);
        calculateMoneyPerSecond();
        recalculateClickValue();
        renderInventory();
    }

    function cleanupConsumables() {
        const now = Date.now();
        activeConsumables = activeConsumables.filter(c => c.expiresAt > now);
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
        renderBattlePokemon();
        updateTrainerUI();
        renderAutomation();
        renderTalents();
        renderQuests();
        updateEventBanner();
        renderLeagues();
        renderChallenges();
        renderInventory();
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
        // Elements du DOM (assure-toi qu'ils existent dans le HTML modifié)
        const previewPlayerImg = document.getElementById('preview-player-sprite');
        const previewPlayerName = document.getElementById('preview-player-name');
        
        if (!battleOpponentName || !battleOpponentSprite || !battleOpponentPower || !battleRisk) return;
        
        // Génère un adversaire si besoin
        if (!currentOpponent) currentOpponent = generateOpponent();
        
        // Mise à jour Adversaire
        battleOpponentName.textContent = `#${currentOpponent.dex} ${currentOpponent.name}`;
        battleOpponentSprite.src = currentOpponent.imageUrl;
        battleOpponentPower.textContent = `${t('battle-power')}: ${formatNumber(currentOpponent.power)}`;
        
        // Mise à jour Joueur (Toi)
        const playerMon = pickPlayerPokemonForBattle();

        if (battlePlayerPower) {
            if (playerMon) {
                const playerXp = pokemonXP[playerMon.id] || 0;
                const playerLevel = getLevelForXp(playerXp);
                const combatant = buildCombatantFromDex(playerMon.dex, { level: playerLevel });
                const power = combatant.stats.atk + combatant.stats.spa; // A simple power metric
                battlePlayerPower.textContent = `${t('player-power')}: ${formatNumber(power || 1)}`;
            } else {
                battlePlayerPower.textContent = `${t('player-power')}: 0`;
            }
        }
        
        if (playerMon) {
            if(previewPlayerImg) previewPlayerImg.src = playerMon.imageUrl;
            if(previewPlayerName) previewPlayerName.textContent = playerMon.name;
        } else {
            // Si pas de pokemon (début de partie)
            if(previewPlayerImg) previewPlayerImg.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
            if(previewPlayerName) previewPlayerName.textContent = "Aucun";
        }

        battleRisk.textContent = t('battle-risk-text');
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

    function ownedPokemonList(sortDir = 'desc') {
        const list = Object.keys(ownedPokemon)
            .filter(id => ownedPokemon[id] > 0)
            .map(id => {
                const pokemon = pokemonData.find(p => p.id === id);
                if (!pokemon) return null;
                return { pokemon, count: ownedPokemon[id] };
            })
            .filter(Boolean);
        list.sort((a, b) => sortDir === 'asc' ? a.pokemon.dex - b.pokemon.dex : b.pokemon.dex - a.pokemon.dex);
        return list;
    }

    function buildPokemonCard(pokemon, count, isSelectable = false) {
        const pokemonElement = document.createElement('div');
        pokemonElement.className = 'pokemon-instance';
        if (pokemon.id === battlePokemonId) {
            pokemonElement.classList.add('favorite');
        }
        if (shinyPokemon.includes(pokemon.id)) {
            pokemonElement.classList.add('shiny');
        }
        pokemonElement.innerHTML = `
            <img src="${getSpriteUrl(pokemon)}" alt="${pokemon.name}">
            <span>${pokemon.name} (x${formatNumber(count)})</span>
        `;
        if (isSelectable) {
            pokemonElement.addEventListener('click', () => setBattlePokemon(pokemon.id));
        }
        return pokemonElement;
    }

    function renderOwnedPokemon() {
        if (!pokemonContainer) return;
        pokemonContainer.innerHTML = '';
        const ownedList = ownedPokemonList('desc');
        const approxCols = Math.max(1, Math.floor((pokemonContainer.clientWidth || 0) / 150));
        const maxVisible = Math.max(4, approxCols * 2); // cap to ~2 rows
        const visible = ownedList.slice(0, maxVisible);
        const overflow = ownedList.length - visible.length;

        const header = document.createElement('div');
        header.className = 'pokemon-list-header';
        const title = document.createElement('div');
        title.className = 'muted';
        title.textContent = `Collection: ${ownedList.length} Pokemon`;
        header.appendChild(title);
        if (overflow > 0) {
            const moreBtn = document.createElement('button');
            moreBtn.className = 'btn ghost small show-more-owned';
            moreBtn.textContent = `${t('see-all')} (+${overflow})`;
            moreBtn.onclick = () => openOwnedPokemonModal();
            header.appendChild(moreBtn);
        }
        pokemonContainer.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'pokemon-grid';
        if (!visible.length) {
            const empty = document.createElement('div');
            empty.className = 'muted';
            empty.textContent = 'Pas encore de Pokemon achetes.';
            grid.appendChild(empty);
        } else {
            visible.forEach(({ pokemon, count }) => {
                grid.appendChild(buildPokemonCard(pokemon, count, false));
            });
        }
        pokemonContainer.appendChild(grid);
    }

    function renderOwnedPokemonModal() {
        if (!ownedPokemonModalGrid) return;
        ownedPokemonModalGrid.innerHTML = '';
        const list = ownedPokemonList('asc');
        if (!list.length) {
            const empty = document.createElement('p');
            empty.className = 'muted';
            empty.textContent = 'Aucun Pokemon dans ta collection.';
            ownedPokemonModalGrid.appendChild(empty);
            return;
        }
        list.forEach(({ pokemon, count }) => {
            ownedPokemonModalGrid.appendChild(buildPokemonCard(pokemon, count, false));
        });
    }

    function renderChangePokemonModal() {
        if (!changePokemonGrid) return;
        changePokemonGrid.innerHTML = '';
        const list = ownedPokemonList('asc');
        if (!list.length) {
            const empty = document.createElement('p');
            empty.className = 'muted';
            empty.textContent = 'Aucun Pokemon dans ta collection.';
            changePokemonGrid.appendChild(empty);
            return;
        }
        list.forEach(({ pokemon, count }) => {
            changePokemonGrid.appendChild(buildPokemonCard(pokemon, count, true));
        });
    }

    function openOwnedPokemonModal() {
        if (!ownedPokemonModal) return;
        renderOwnedPokemonModal();
        ownedPokemonModal.style.display = 'flex';
    }

    function closeOwnedModal() {
        if (ownedPokemonModal) ownedPokemonModal.style.display = 'none';
    }

    function setBattlePokemon(pokemonId) {
        if (ownedPokemon[pokemonId] > 0) {
            battlePokemonId = pokemonId;
            calculateMoneyPerSecond();
            updateUI();
            if (changePokemonModal) {
                changePokemonModal.style.display = 'none';
            }
        }
    }

    function renderBattlePokemon() {
        const battlePokemonIdSlot = document.getElementById('favorite-pokemon-slot');
        battlePokemonIdSlot.innerHTML = '';
        if (battlePokemonId) {
            const pokemon = pokemonData.find(p => p.id === battlePokemonId);
            if (pokemon) {
                const xp = pokemonXP[battlePokemonId] || 0;
                const level = getLevelForXp(xp);
                const currentLevelXp = getCurrentXpForLevel(xp);
                const xpForNext = getXpToLevelUp(level);

                const pokemonElement = document.createElement('div');
                pokemonElement.className = 'pokemon-instance favorite';
                 if (shinyPokemon.includes(battlePokemonId)) {
                    pokemonElement.classList.add('shiny');
                }
                pokemonElement.innerHTML = `
                    <img src="${getSpriteUrl(pokemon)}" alt="${pokemon.name}">
                    <span>${pokemon.name} <small>(Lvl ${level})</small></span>
                `;
                battlePokemonIdSlot.appendChild(pokemonElement);

                battlePokemonXpContainer.style.display = 'block';
                battlePokemonXpBar.value = currentLevelXp;
                battlePokemonXpBar.max = xpForNext;
                battlePokemonXpText.textContent = `${formatNumber(currentLevelXp)} / ${formatNumber(xpForNext)} XP`;

            }
        } else {
            battlePokemonIdSlot.innerHTML = '<span>Choisissez un Pokémon pour le combat.</span>';
            if(battlePokemonXpContainer) battlePokemonXpContainer.style.display = 'none';
        }
    }

    function renderAutomation() {
        const container = document.getElementById('automation-items');
        if (!container) return;
        container.innerHTML = '';
        if (autoBuyCurrentLabel) {
            const target = pokemonData.find(p => p.id === autoBuyTargetId);
            autoBuyCurrentLabel.textContent = target ? `Cible: #${target.dex} ${target.name}` : 'Aucune cible';
        }
        automationUpgradesData.forEach(upg => {
            const purchased = purchasedAutomation.includes(upg.id);
            const canAfford = money >= upg.cost;
            const isAutoChain = upg.autoBuyChain;
            const pill = document.createElement('div');
            pill.className = `pill ${purchased ? 'purchased' : ''} ${!canAfford && !purchased ? 'locked' : ''}`;
            const statusText = purchased && isAutoChain ? ` | Etat: ${autoBuyChainEnabled ? 'ON' : 'OFF'}` : '';
            pill.innerHTML = `
                <strong>${upg.name}</strong>
                <span>${upg.autoClick ? `Auto-clic: +${upg.autoClick}/s` : ''} ${upg.autoBuyPokemon ? 'Auto-buy Pokemon' : ''} ${upg.autoBuyUpgrade ? 'Auto-buy Upgrades' : ''}${statusText}</span>
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
                if (isAutoChain) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'btn small';
                    toggleBtn.textContent = autoBuyChainEnabled ? 'Desactiver' : 'Activer';
                    toggleBtn.onclick = () => toggleAutoBuyChain();
                    pill.appendChild(toggleBtn);
                }
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
        talentsData.forEach(talent => {
            const unlocked = unlockedTalents.includes(talent.id);
            const canAfford = talentPoints >= talent.cost;
            const depsMet = !talent.requires || talent.requires.every(r => unlockedTalents.includes(r));
            const pill = document.createElement('div');
            pill.className = `pill ${unlocked ? 'purchased' : ''} ${!depsMet ? 'locked' : ''}`;
            pill.innerHTML = `
                <strong>${talent.name}</strong>
                <span>${talent.desc}</span>
                <small>${translateWithParams('talent-cost', { cost: talent.cost }, `Coût: ${talent.cost} pt`)}</small>
            `;
            if (!unlocked) {
                const btn = document.createElement('button');
                btn.className = 'btn small';
                btn.textContent = t('btn-unlock');
                btn.disabled = !canAfford || !depsMet;
                btn.onclick = () => unlockTalent(talent.id);
                pill.appendChild(btn);
            } else {
                const badge = document.createElement('span');
                badge.className = 'muted';
                badge.textContent = t('badge-active');
                pill.appendChild(badge);
            }
            container.appendChild(pill);
        });
    }

    function renderQuests() {
        const container = document.getElementById('quests-list');
        if (container) {
            container.innerHTML = '';
            dailyQuests.forEach(q => {
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
                    <small>${translateWithParams('quest-reward', { reward: q.reward })}</small>
                `;
                container.appendChild(pill);
            });
        }
        updateTicker();
    }

    function renderLeagues() {
        if (!leaguesList) return;
        leaguesList.innerHTML = '';
        leaguesData.forEach(league => {
            const pill = document.createElement('div');
            pill.className = 'pill';
            pill.innerHTML = `
                <strong>${league.name}</strong>
                <span>${translateWithParams('league-ticket', { cost: formatNumber(league.entry) })}</span>
                <span>${translateWithParams('league-reward', { mult: league.rewardMult.toFixed(2) })}</span>
            `;
            const btn = document.createElement('button');
            btn.className = 'btn small';
            btn.textContent = t('fight-btn');
            btn.onclick = () => startLeagueBattle(league);
            pill.appendChild(btn);
            leaguesList.appendChild(pill);
        });
        // Boss
        const bossPill = document.createElement('div');
        bossPill.className = 'pill';
        bossPill.innerHTML = `
            <strong>${bossData.name}</strong>
            <span>${translateWithParams('league-ticket', { cost: formatNumber(bossData.entry) })}</span>
            <span>${translateWithParams('league-reward', { mult: bossData.rewardMult.toFixed(2) })}</span>
        `;
        const bossBtn = document.createElement('button');
        bossBtn.className = 'btn small';
        bossBtn.textContent = t('boss-fight-btn');
        bossBtn.onclick = () => startLeagueBattle(bossData, true);
        bossPill.appendChild(bossBtn);
        leaguesList.appendChild(bossPill);
    }

    function renderGyms() {
        if (!gymsList) return;
        gymsList.innerHTML = '';
        const gen = currentGeneration;
        if (!gymLeadersData[gen]) {
            gymsList.innerHTML = '<p class="muted">Aucune arène pour cette génération.</p>';
            return;
        }

        if (!defeatedGyms[gen]) {
            defeatedGyms[gen] = [];
        }
        
        const leaders = [...gymLeadersData[gen], ...eliteFourData[gen]];

        leaders.forEach((leader, index) => {
            const defeated = defeatedGyms[gen].includes(leader.id);
            const prevDefeated = index === 0 || defeatedGyms[gen].includes(leaders[index - 1].id);
            const canFight = prevDefeated && !defeated;

            const pill = document.createElement('div');
            pill.className = `pill ${defeated ? 'purchased' : ''} ${!prevDefeated ? 'locked' : ''}`;
            pill.innerHTML = `
                <strong>${leader.name}</strong>
                <span>${leader.badge || 'Membre du Conseil 4'}</span>
            `;

            if (defeated) {
                const badge = document.createElement('span');
                badge.className = 'muted';
                badge.textContent = 'Vaincu';
                pill.appendChild(badge);
            } else {
                const btn = document.createElement('button');
                btn.className = 'btn small';
                btn.textContent = 'Combattre';
                btn.disabled = !canFight;
                btn.onclick = () => startGymBattle(leader);
                pill.appendChild(btn);
            }
            gymsList.appendChild(pill);
        });
    }

    async function startGymBattle(leader) {
        gymsModal.style.display = 'none';
        
        currentGymBattle = {
            leader: leader,
            teamIndex: 0
        };
        
        const foePokemon = leader.team[0];
        const foe = buildCombatantFromDex(foePokemon.dex, { level: foePokemon.level });
        
        logBattle(`Vous défiez ${leader.name} !`, '#f3d947');
        await startBattle(foe);
    }

    function renderChallenges() {
        if (!challengesList) return;
        challengesList.innerHTML = '';
        challengesData.forEach(ch => {
            const active = activeChallenge && activeChallenge.id === ch.id;
            const pill = document.createElement('div');
            pill.className = `pill ${active ? 'purchased' : ''}`;
            pill.innerHTML = `
                <strong>${ch.name}</strong>
                <span>${ch.desc}</span>
                <small>${ch.reward}</small>
            `;
            const btn = document.createElement('button');
            btn.className = 'btn small';
            btn.textContent = active ? t('badge-active') : t('btn-unlock');
            btn.disabled = active;
            btn.onclick = () => activateChallenge(ch);
            pill.appendChild(btn);
            challengesList.appendChild(pill);
        });
        const resetPill = document.createElement('div');
        resetPill.className = 'pill';
        resetPill.innerHTML = `<strong>Quitter le challenge</strong>`;
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn small';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => {
            activeChallenge = null;
            calculateMoneyPerSecond();
            updateStats();
            renderChallenges();
            showToast('Challenge désactivé.');
        };
        resetPill.appendChild(resetBtn);
        challengesList.appendChild(resetPill);
    }

    function renderInventory() {
        if (!inventoryList) return;
        inventoryList.innerHTML = '';
        consumablesData.forEach(item => {
            const pill = document.createElement('div');
            pill.className = 'pill';
            pill.innerHTML = `
                <img src="${itemDrops.find(d => d.id === item.id)?.sprite || ''}" alt="${item.name}" style="width:32px;height:32px;image-rendering:pixelated;">
                <strong>${item.name}</strong>
                <span>${item.desc}</span>
                <small>Qty: ${inventoryItems[item.id] || 0}</small>
            `;
            const btn = document.createElement('button');
            btn.className = 'btn small';
            btn.textContent = 'Utiliser';
            btn.onclick = () => useConsumable(item);
            pill.appendChild(btn);
            inventoryList.appendChild(pill);
        });
    }

    function renderAutoBuyModal() {
        if (!autoBuyGridModal) return;
        autoBuyGridModal.innerHTML = '';
        // Option none
        const noneCard = document.createElement('div');
        noneCard.className = `auto-buy-card ${!autoBuyTargetId ? 'selected' : ''}`;
        noneCard.innerHTML = `<strong>Aucune cible</strong>`;
        noneCard.onclick = () => {
            autoBuyTargetId = null;
            renderAutoBuyModal();
            renderAutomation();
            autoBuyModal.style.display = 'none';
        };
        autoBuyGridModal.appendChild(noneCard);
        pokemonData.forEach(p => {
            const card = document.createElement('div');
            card.className = `auto-buy-card ${autoBuyTargetId === p.id ? 'selected' : ''}`;
            card.innerHTML = `
                <img src="${p.imageUrl}" alt="${p.name}">
                <strong>#${p.dex}</strong>
                <span>${p.name}</span>
            `;
            card.onclick = () => {
                autoBuyTargetId = p.id;
                renderAutoBuyModal();
                renderAutomation();
                autoBuyModal.style.display = 'none';
            };
            autoBuyGridModal.appendChild(card);
        });
    }

    function renderPokedex() {
        if (!pokedexGrid || !pokedexSummary) return;
        pokedexGrid.innerHTML = '';
        const caughtIds = Object.keys(ownedPokemon).filter(id => ownedPokemon[id] > 0);
        const shinyCaught = shinyPokemon.slice();
        pokedexSummary.textContent = `${caughtIds.length} capturés / ${pokemonData.length}  | Shiny: ${shinyCaught.length}`;
        pokemonData.forEach(p => {
            const caught = caughtIds.includes(p.id);
            const shiny = shinyCaught.includes(p.id);
            const item = document.createElement('div');
            item.className = 'achievement-item';
            item.style.opacity = caught ? 1 : 0.5;
            item.innerHTML = `
                <p>#${p.dex} ${p.name}</p>
                <img src="${shiny ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.dex}.png` : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dex}.png`}" style="width:48px;height:48px;image-rendering:pixelated;">
                <small>${caught ? 'Capturé' : 'Manquant'} ${shiny ? '(Shiny)' : ''}</small>
            `;
            pokedexGrid.appendChild(item);
        });
    }

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthLabel = document.getElementById('calendar-month');
        if (!grid || !monthLabel) return;
        grid.innerHTML = '';
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        monthLabel.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const firstDay = new Date(year, month, 1);
        const startDay = firstDay.getDay(); // 0-6
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < startDay; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell muted';
            grid.appendChild(cell);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (d === now.getDate()) cell.classList.add('today');
            const dateKey = new Date(year, month, d).toDateString();
            const dayRecord = questsHistory[dateKey] || { quests: generateQuestsForDate(dateKey), completed: [] };
            const done = dayRecord.completed && dayRecord.completed.length === (dayRecord.quests?.length || 0);
            cell.textContent = d;
            if (done) cell.classList.add('purchased');
            cell.title = dayRecord.quests.map(q => `${q.name}${dayRecord.completed?.includes(q.id) ? ' ✔' : ''}`).join('\n');
            grid.appendChild(cell);
        }
    }

    function updateTicker() {
        const ticker = document.getElementById('ticker-content');
        if (!ticker) return;
        const parts = dailyQuests.map(q => {
            const done = completedQuests.includes(q.id);
            let value = 0;
            if (q.goal === 'money') value = questProgress.money;
            if (q.goal === 'clicks') value = questProgress.clicks;
            if (q.goal === 'battles') value = questProgress.battles;
            if (q.goal === 'catches') value = questProgress.catches;
            const current = Math.min(value, q.target);
            const displayValue = Math.floor(current);
            return `${q.name}: ${displayValue}/${q.target}${done ? ' ✔' : ''}`;
        });
        if (activeEvent) {
            parts.push(`Event: ${activeEvent.name} (${activeEvent.description})`);
        }
        const text = parts.join('   •   ');
        ticker.innerHTML = `<span class="ticker-line">${text}</span><span class="ticker-line">${text}</span>`;
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
        const filtered = storeFilterGen === 'all'
            ? pokemonData
            : pokemonData.filter(p => {
                const gen = genRanges.find(gr => p.dex >= gr.start && p.dex <= gr.end);
                return gen && `${gen.gen}` === storeFilterGen;
            });
        filtered.forEach((pokemon, index) => {
            const unlocked = index === 0 || (ownedPokemon[filtered[index - 1]?.id] || 0) > 0;
            const isLocked = !unlocked;
            const dynamicCost = pokemonCurrentCost(pokemon);
            const canAfford = money >= dynamicCost;
            const storeItemElement = document.createElement('div');
            storeItemElement.className = `store-item ${isLocked ? 'locked' : ''} ${!canAfford && !isLocked ? 'unaffordable' : ''}`;
            const prevDex = Math.max(1, pokemon.dex - 1);
            const priceLabel = isLocked ? `Debloque apres #${prevDex}` : `Prix: ${formatNumber(dynamicCost)}`;
            storeItemElement.innerHTML = `
                <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
                <p>#${pokemon.dex} ${pokemon.name}</p>
                <p>${priceLabel}</p>
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
            const cost = discountedCost(upgrade.cost, 'upgrade');
            const canAfford = money >= cost;
            const upgradeItemElement = document.createElement('div');
            const description = upgrade.clickBonus
                ? translateWithParams('upgrade-desc-click', { bonus: upgrade.clickBonus }, `Clique +${upgrade.clickBonus}`)
                : upgrade.target === 'all'
                    ? translateWithParams('upgrade-desc-all', { mult: upgrade.multiplier }, `Tous MPS x${upgrade.multiplier}`)
                    : translateWithParams('upgrade-desc-mps', {}, 'Boost MPS');
            const iconUrl = getItemSprite(upgrade.icon);
            const displayName = localizedUpgradeName(upgrade);

            upgradeItemElement.className = `store-item upgrade-item ${isPurchased ? 'purchased' : ''} ${!unlocked ? 'locked' : ''} ${!canAfford && !isPurchased && unlocked ? 'unaffordable' : ''}`;
            upgradeItemElement.innerHTML = `
                <img src="${iconUrl}" alt="${upgrade.name}">
                <p>${displayName}</p>
                <p>${translateWithParams('price-label', { cost: formatNumber(cost) }, `Prix: ${formatNumber(cost)}`)}</p>
                <p>${description}</p>
                ${!unlocked && !isPurchased ? '<p style="color:#ccc;">Upgrade Manquant</p>' : ''}
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

        // Update prestige button visibility
        const gen = currentGeneration;
        const requiredBadges = (gymLeadersData[gen]?.length || 8) + (eliteFourData[gen]?.length || 5);
        if (defeatedGyms[gen] && defeatedGyms[gen].length >= requiredBadges) {
            prestigeButton.style.display = 'inline-block';
        } else {
            prestigeButton.style.display = 'none';
        }
    }

    function triggerRandomEvent() {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        event.action();
    }

    function uiLoop() {
        ensureDailyQuests();
        renderStore();
        renderUpgrades();
        renderAchievements();
        updateBackground();
        maybeStartDynamicEvent();
        updateActiveEvent();
        cleanupConsumables();
        checkQuests();
        renderQuests();
    }

    // --- Dynamic Background ---
    function updateBackground() {
        if (!settings.dynamicBackground) return;
        const hour = new Date().getHours();
        const mode = hour >= 6 && hour < 18 ? 'day' : (hour >= 18 && hour < 20 ? 'sunset' : 'night');
        document.body.classList.remove('day', 'sunset', 'night');
        document.body.classList.add(mode);
    }

    function maybeStartDynamicEvent() {
        if (activeEvent) return;
        if (Math.random() < 0.01) { // ~1% chance per second
            activeEvent = dynamicEventsPool[Math.floor(Math.random() * dynamicEventsPool.length)];
            activeEventEndsAt = Date.now() + activeEvent.duration;
            toast('toast-event-start', { name: activeEvent.name, description: activeEvent.description });
            updateEventBanner();
            calculateMoneyPerSecond();
        }
    }

    function updateActiveEvent() {
        if (activeEvent && Date.now() >= activeEventEndsAt) {
            activeEvent = null;
            activeEventEndsAt = 0;
            toast('toast-event-end');
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
        dailyQuests.forEach(q => {
            if (completedQuests.includes(q.id)) return;
            let value = 0;
            if (q.goal === 'money') value = questProgress.money;
            if (q.goal === 'clicks') value = questProgress.clicks;
            if (q.goal === 'battles') value = questProgress.battles;
            if (q.goal === 'catches') value = questProgress.catches;
            if (value >= q.target) {
                completedQuests.push(q.id);
                if (questsHistory[dailyQuestDay]) {
                    questsHistory[dailyQuestDay].completed = [...completedQuests];
                }
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
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            achievementItemElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            achievementItemElement.title = achievement.description;
            achievementItemElement.innerHTML = `
                <p>${achievement.name}</p>
                <div class="achievement-desc">${achievement.description}</div>
                ${isUnlocked ? '' : '<span class="achievement-badge">Locked</span>'}
            `;
            achievementsItemsContainer.appendChild(achievementItemElement);
        });
    }

    // --- Prestige Logic ---
    function prestige() {
        const gen = currentGeneration;
        const requiredBadges = (gymLeadersData[gen]?.length || 8) + (eliteFourData[gen]?.length || 5);
        if (defeatedGyms[gen] && defeatedGyms[gen].length >= requiredBadges) {
            const newPrestigePoints = Math.floor(Math.sqrt(money / 10000000)); // Prestige points are now based on money at time of prestige
            prestigePoints += newPrestigePoints;
            prestigeMultiplier = 1 + prestigePoints * 0.1;
            talentPoints += newPrestigePoints;

            // Advance to the next generation if possible
            if (currentGeneration < genRanges.length) {
                currentGeneration += 1;
                showToast(`Nouvelle génération débloquée : Gen ${currentGeneration}!`);
            }

            // Reset progress
            money = 15;
            ownedPokemon = {};
            purchasedUpgrades = [];
            unlockedAchievements = [];
            battlePokemonId = null;
            shinyPokemon = [];
            defeatedGyms = {};
            defeatedEliteFour = {};
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
            battlePokemonId: battlePokemonId,
            shinyPokemon: shinyPokemon,
            defeatedGyms: defeatedGyms,
            pokemonXP: pokemonXP,
            trainerLevel: trainerLevel,
            trainerXp: trainerXp,
            xpToNextLevel: xpToNextLevel,
            currentGeneration: currentGeneration,
            talentPoints: talentPoints,
            unlockedTalents: unlockedTalents,
            questProgress: questProgress,
            completedQuests: completedQuests,
            dailyQuests: dailyQuests,
            dailyQuestDay: dailyQuestDay,
            inventoryItems: inventoryItems,
            autoBuyTargetId: autoBuyTargetId,
            autoBuyChainEnabled: autoBuyChainEnabled,
            settings: settings,
            lastSave: Date.now() // Store the timestamp
        };
        persistGameState(gameState);
        showToast('Sauvegarde réussie !');
    }


    function loadGame() {
        try {
            const gameState = readGameState();

            if (gameState) {
                money = gameState.money || 0;
                ownedPokemon = gameState.ownedPokemon || {};
                purchasedUpgrades = gameState.purchasedUpgrades || [];
                purchasedAutomation = gameState.purchasedAutomation || [];
                prestigePoints = gameState.prestigePoints || 0;
                prestigeMultiplier = gameState.prestigeMultiplier || 1;
                unlockedAchievements = gameState.unlockedAchievements || [];
                battlePokemonId = gameState.battlePokemonId || null;
                shinyPokemon = gameState.shinyPokemon || [];
                defeatedGyms = gameState.defeatedGyms || {};
                trainerLevel = gameState.trainerLevel || 1;
                trainerXp = gameState.trainerXp || 0;
                xpToNextLevel = gameState.xpToNextLevel || 100;
                currentGeneration = gameState.currentGeneration || 1;
                talentPoints = gameState.talentPoints || 0;
                unlockedTalents = gameState.unlockedTalents || [];
                questProgress = gameState.questProgress || { money: 0, clicks: 0, battles: 0, catches: 0 };
                completedQuests = gameState.completedQuests || [];
                dailyQuests = gameState.dailyQuests || [];
                dailyQuestDay = gameState.dailyQuestDay || null;
                inventoryItems = gameState.inventoryItems || {};
                autoBuyTargetId = gameState.autoBuyTargetId || null;
                autoBuyChainEnabled = gameState.autoBuyChainEnabled !== undefined ? gameState.autoBuyChainEnabled : true;
                settings = { ...settings, ...(gameState.settings || {}) };

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
            battlePokemonId = null;
            shinyPokemon = [];
            defeatedGyms = {};
            trainerLevel = 1;
            trainerXp = 0;
            xpToNextLevel = 100;
            currentGeneration = 1;
            questProgress = { money: 0, clicks: 0, battles: 0, catches: 0 };
            completedQuests = [];
            purchasedAutomation = [];
            autoBuyTargetId = null;
            autoBuyChainEnabled = true;
            talentPoints = 0;
            unlockedTalents = [];
            showToast('Echec de chargement. Nouvelle partie lanc�e.');
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
        ensureDailyQuests();
        calculateMoneyPerSecond();
        updateTicker();

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

        applySettingsUI();
        applyTranslations();
        updateBackground();

        updateUI();
        uiLoop();
        setInterval(gameLoop, 100); // Game loop runs every 100ms
        setInterval(uiLoop, 1000); // UI loop runs every second

        saveButton.addEventListener('click', saveGame);
        loadButton.addEventListener('click', () => {
            loadGame();
            applySettingsUI();
            applyTranslations();
            updateBackground();
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

        if (openLeaguesButton && leaguesModal && closeLeaguesButton) {
            openLeaguesButton.addEventListener('click', () => {
                leaguesModal.style.display = 'flex';
                renderLeagues();
            });
            closeLeaguesButton.addEventListener('click', () => {
                leaguesModal.style.display = 'none';
            });
            leaguesModal.addEventListener('click', (e) => {
                if (e.target === leaguesModal) leaguesModal.style.display = 'none';
            });
        }

        if (openGymsButton && gymsModal && closeGymsButton) {
            openGymsButton.addEventListener('click', () => {
                gymsModal.style.display = 'flex';
                renderGyms();
            });
            closeGymsButton.addEventListener('click', () => {
                gymsModal.style.display = 'none';
            });
            gymsModal.addEventListener('click', (e) => {
                if (e.target === gymsModal) gymsModal.style.display = 'none';
            });
        }

        if (openChallengesButton && challengesModal && closeChallengesButton) {
            openChallengesButton.addEventListener('click', () => {
                showToast('Bientôt des challenges seront là.');
            });
            closeChallengesButton.addEventListener('click', () => {
                challengesModal.style.display = 'none';
            });
            challengesModal.addEventListener('click', (e) => {
                if (e.target === challengesModal) challengesModal.style.display = 'none';
            });
        }

        if (openInventoryButton && inventoryModal && closeInventoryButton) {
            openInventoryButton.addEventListener('click', () => {
                inventoryModal.style.display = 'flex';
                renderInventory();
            });
            closeInventoryButton.addEventListener('click', () => {
                inventoryModal.style.display = 'none';
            });
            inventoryModal.addEventListener('click', (e) => {
                if (e.target === inventoryModal) inventoryModal.style.display = 'none';
            });
        }

        const openCalendarButton = document.getElementById('open-calendar');
        const closeCalendarButton = document.getElementById('close-calendar');
        const calendarModal = document.getElementById('calendar-modal');
        if (openCalendarButton && closeCalendarButton && calendarModal) {
            openCalendarButton.addEventListener('click', () => {
                calendarModal.style.display = 'flex';
                renderCalendar();
            });
            closeCalendarButton.addEventListener('click', () => {
                calendarModal.style.display = 'none';
            });
            calendarModal.addEventListener('click', (e) => {
                if (e.target === calendarModal) calendarModal.style.display = 'none';
            });
        }

        if (openPokedexButton && pokedexModal && closePokedexButton) {
            openPokedexButton.addEventListener('click', () => {
                pokedexModal.style.display = 'flex';
                renderPokedex();
            });
            closePokedexButton.addEventListener('click', () => {
                pokedexModal.style.display = 'none';
            });
            pokedexModal.addEventListener('click', (e) => {
                if (e.target === pokedexModal) pokedexModal.style.display = 'none';
            });
        }

        if (ownedPokemonModal && closeOwnedPokemonModalButton) {
            closeOwnedPokemonModalButton.addEventListener('click', () => closeOwnedModal());
            ownedPokemonModal.addEventListener('click', (e) => {
                if (e.target === ownedPokemonModal) closeOwnedModal();
            });
        }

        if (changePokemonModal && closeChangePokemonModal && changeBattlePokemonButton) {
            changeBattlePokemonButton.addEventListener('click', () => {
                renderChangePokemonModal();
                changePokemonModal.style.display = 'flex';
            });
            closeChangePokemonModal.addEventListener('click', () => {
                changePokemonModal.style.display = 'none';
            });
            changePokemonModal.addEventListener('click', (e) => {
                if (e.target === changePokemonModal) {
                    changePokemonModal.style.display = 'none';
                }
            });
        }

        if (openAutoBuyButton && autoBuyModal && closeAutoBuyButton) {
            openAutoBuyButton.addEventListener('click', () => {
                autoBuyModal.style.display = 'flex';
                renderAutoBuyModal();
            });
            closeAutoBuyButton.addEventListener('click', () => {
                autoBuyModal.style.display = 'none';
            });
            autoBuyModal.addEventListener('click', (e) => {
                if (e.target === autoBuyModal) autoBuyModal.style.display = 'none';
            });
        }

        function setFooterExpansion(mode) {
            if (!footerBar) return;
            footerBar.classList.remove('expanded-store', 'expanded-upgrades');
            if (mode) footerBar.classList.add(mode);
            if (expandStoreButton) expandStoreButton.classList.toggle('active', mode === 'expanded-store');
            if (expandUpgradesButton) expandUpgradesButton.classList.toggle('active', mode === 'expanded-upgrades');
        }

        if (expandStoreButton) {
            expandStoreButton.addEventListener('click', () => {
                const isActive = footerBar && footerBar.classList.contains('expanded-store');
                setFooterExpansion(isActive ? null : 'expanded-store');
            });
        }
        if (expandUpgradesButton) {
            expandUpgradesButton.addEventListener('click', () => {
                const isActive = footerBar && footerBar.classList.contains('expanded-upgrades');
                setFooterExpansion(isActive ? null : 'expanded-upgrades');
            });
        }

        if (settingsButton && settingsContainer) {
            settingsButton.addEventListener('click', openSettings);
            settingsContainer.addEventListener('click', (e) => {
                if (e.target === settingsContainer) closeSettings();
            });
        }
        if (settingsCloseButton) {
            settingsCloseButton.addEventListener('click', closeSettings);
        }
        if (languageSelect) {
            languageSelect.addEventListener('change', () => {
                settings.language = languageSelect.value || 'fr';
                refreshGenerationData();
                updateUI();
                applyTranslations();
            });
        }
        if (toggleToasts) {
            toggleToasts.addEventListener('change', () => {
                settings.showToasts = toggleToasts.checked;
            });
        }
        if (toggleFloatingNumbers) {
            toggleFloatingNumbers.addEventListener('change', () => {
                settings.floatingNumbers = toggleFloatingNumbers.checked;
            });
        }
        if (toggleDynamicBackground) {
            toggleDynamicBackground.addEventListener('change', () => {
                settings.dynamicBackground = toggleDynamicBackground.checked;
                if (!settings.dynamicBackground) {
                    document.body.classList.remove('day', 'sunset', 'night');
                } else {
                    updateBackground();
                }
            });
        }
        if (musicSlider) {
            musicSlider.addEventListener('input', () => {
                settings.musicVolume = parseInt(musicSlider.value, 10) / 100;
            });
        }
        if (sfxSlider) {
            sfxSlider.addEventListener('input', () => {
                settings.sfxVolume = parseInt(sfxSlider.value, 10) / 100;
            });
        }

        storeFilterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                storeFilterGen = btn.getAttribute('data-store-filter');
                renderStore();
            });
        });

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
                grantPokemon(randomPokemon.id);

                if (Math.random() < getShinyChance() && !shinyPokemon.includes(randomPokemon.id)) {
                    shinyPokemon.push(randomPokemon.id);
                    showToast(`Shiny trouvé ! ${randomPokemon.name} (bonus x${SHINY_MULTIPLIER}).`);
                }
                questProgress.catches += 1;
                calculateMoneyPerSecond();
                updateUI();
                showToast(`Chance ! La Poké Ball a lâché un ${randomPokemon.name}.`);
                checkQuests();
            }
            // Item drop
            if (Math.random() < 0.01) {
                const item = itemDrops[Math.floor(Math.random() * itemDrops.length)];
                inventoryItems[item.id] = (inventoryItems[item.id] || 0) + 1;
                const label = translateWithParams('toast-item-drop', { name: item.name }, `${item.name} obtenu !`);
                showToast(`<img src="${item.sprite}" style="width:24px;height:24px;vertical-align:middle;"> ${label}`, true);
                renderInventory();
            }
        });

        battleButton.addEventListener('click', () => startBattle());

        if (tutorialOverlay && tutorialNextButton && tutorialBackButton && tutorialSkipButton) {
            tutorialNextButton.addEventListener('click', nextTutorialStep);
            tutorialBackButton.addEventListener('click', previousTutorialStep);
            tutorialSkipButton.addEventListener('click', () => endTutorial(true));
            window.addEventListener('resize', refreshTutorialHighlight);
            document.addEventListener('scroll', refreshTutorialHighlight, true);
        }

        startTutorialIfNeeded(lastSaveTime);
    }

    async function startBattle(predefinedFoe = null, isContinuation = false) {
        const now = Date.now();
        if (!isContinuation && now < nextBattleAllowedAt) {
            const wait = Math.ceil((nextBattleAllowedAt - now) / 1000);
            showToast(`Attends ${wait}s avant de relancer un combat.`);
            return;
        }
        if (!Object.keys(ownedPokemon).length) {
            showToast("Pas de Pokémon pour combattre ! Achète ou drop un Pokémon.");
            return;
        }
        await loadBattleData().catch(() => showToast("Impossible de charger les données de combat."));
        const playerMon = pickPlayerPokemonForBattle();
        if (!playerMon) {
            showToast("Aucun Pokémon disponible pour le combat.");
            return;
        }

        const playerPokemonId = playerMon.id;
        const playerXp = pokemonXP[playerPokemonId] || 0;
        const playerLevel = getLevelForXp(playerXp);

        // In a gym battle sequence, the player's pokemon is not healed.
        const player = (isContinuation && battleState && battleState.player)
            ? battleState.player 
            : buildCombatantFromDex(playerMon.dex || Number(playerMon.id.replace('dex-', '')), { level: playerLevel });

        if (isContinuation && battleState && battleState.player) {
            player.currentHp = battleState.player.currentHp; // Explicitly carry over HP
        }

        const foe = predefinedFoe || generateBattleOpponentCombatant(playerLevel);
        battleState = { player, foe, finished: false };
        
        if (!isContinuation) {
            battleLog.innerHTML = '';
        }

        logBattle(`${foe.name} (Lv.${foe.level}) entre en scène !`, '#ffd166');
        renderBattleUI();
    }

    function createFloatingNumber(x, y, value) {
        if (settings.floatingNumbers === false) return;
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

    /* -----------------------------------------
   CHEAT MENU — Ouvre avec F9
------------------------------------------ */

// Ajout d'un conteneur HTML pour le menu
const cheatMenu = document.createElement('div');
cheatMenu.id = "cheat-menu";
cheatMenu.style = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 260px;
    background: rgba(0,0,0,0.85);
    padding: 15px;
    border-radius: 10px;
    z-index: 999999;
    color: white;
    font-family: Arial;
    display: none;
    backdrop-filter: blur(6px);
`;
cheatMenu.innerHTML = `
    <h3 style="margin-top:0; font-size:18px; text-align:center;">⚡ Cheat Menu</h3>

    <button class="cheat-btn" data-cmd="add10k">+ 10 000$</button>
    <button class="cheat-btn" data-cmd="add1m">+ 1 000 000$</button>
    <button class="cheat-btn" data-cmd="add1b">+ 1 000 000 000$</button>

    <hr style="margin:10px 0; border-color:#444;">

    <input id="cheat-set-money-input" type="number" placeholder="Set money" style="width:100%; margin-bottom:5px;">
    <button class="cheat-btn" data-cmd="setMoney">Définir l'argent</button>

    <br><br>
    <input id="cheat-set-mps-input" type="number" placeholder="Set MPS" style="width:100%; margin-bottom:5px;">
    <button class="cheat-btn" data-cmd="setMPS">Définir MPS</button>

    <hr style="margin:10px 0; border-color:#444;">

    <button class="cheat-btn" data-cmd="unlockAllUpg">Unlock Upgrades</button>
    <button class="cheat-btn" data-cmd="unlockAllPkm">Unlock Pokémon</button>
    <button class="cheat-btn" data-cmd="skipBattle">Skip cooldown Battle</button>
    <button class="cheat-btn" data-cmd="shiny100">Mode Shiny 100%</button>

    <hr style="margin:10px 0; border-color:#444;">

    <button class="cheat-btn" data-cmd="resetSave" style="background:#922;">Reset Save</button>
`;

document.body.appendChild(cheatMenu);

// Style des boutons
const style = document.createElement('style');
style.innerHTML = `
    #cheat-menu .cheat-btn {
        width: 100%;
        padding: 8px;
        margin-bottom: 6px;
        border: none;
        border-radius: 6px;
        background: #2c82c9;
        color: white;
        cursor: pointer;
        font-weight: bold;
        transition: 0.15s;
    }
    #cheat-menu .cheat-btn:hover {
        background: #51a8ff;
    }
`;
document.head.appendChild(style);

// Toggle F9
document.addEventListener('keydown', (e) => {
    if (e.key === "F9") {
        cheatMenu.style.display = cheatMenu.style.display === "none" ? "block" : "none";
    }
});

// Commandes cheat
cheatMenu.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cheat-btn')) return;

    const cmd = e.target.dataset.cmd;

    switch (cmd) {

        case "add10k":
            money += 10_000;
            break;

        case "add1m":
            money += 1_000_000;
            break;

        case "add1b":
            money += 1_000_000_000;
            break;

        case "setMoney":
            const val = Number(document.getElementById('cheat-set-money-input').value);
            if (!isNaN(val)) money = val;
            break;

        case "setMPS":
            const mps = Number(document.getElementById('cheat-set-mps-input').value);
            if (!isNaN(mps)) moneyPerSecond = mps;
            break;

        case "unlockAllUpg":
            purchasedUpgrades = upgradesData.map(u => u.id);
            applyAllUpgrades();
            break;

        case "unlockAllPkm":
            Object.keys(ownedPokemon).forEach(k => ownedPokemon[k] = 1);
            break;

        case "skipBattle":
            nextBattleAllowedAt = 0;
            break;

        case "shiny100":
            window.cheatShinyBoost = true;
            break;

        case "resetSave":
            localStorage.clear();
            location.reload();
            break;
    }

    if (typeof updateDisplays === "function") updateDisplays();
});
    init();

    function generateQuestsForDate(dateKey) {
        const poolSrc = (typeof questPool !== 'undefined' && questPool.length) ? questPool : [];
        // deterministic pick based on date string
        let seed = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        const poolCopy = [...poolSrc];
        const picked = [];
        for (let i = 0; i < 4 && poolCopy.length > 0; i++) {
            const idx = Math.floor(rand() * poolCopy.length);
            picked.push(poolCopy.splice(idx, 1)[0]);
        }
        return picked;
    }

});
