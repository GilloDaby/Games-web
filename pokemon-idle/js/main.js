import { translations } from './i18n/translations.js';
import { formatNumber, getLevelForXp, getCurrentXpForLevel, getXpToLevelUp, calcStat } from './utils/math.js';
import { createToastController } from './ui/uiToasts.js';
import {
    primeKantoNames,
    setNameUpdateCallback,
    getLocalizedPokemonName
} from './utils/pokemonNames.js';
import {
    genRanges,
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
import { createBattleSystem } from './battle/battleSystem.js';
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
    let shinyPokemon = [];
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

    let currentGeneration = 1;
    let pokemonData = [];
    let battleSystem = null;


    function currentLanguage() {
        return settings.language || 'fr';
    }

    function t(key) {
        const lang = currentLanguage();
        if (translations[lang] && translations[lang][key]) return translations[lang][key];
        if (translations.fr && translations.fr[key]) return translations.fr[key];
        return key;
    }
    function localizedPokemonName(pokemon) {
        return getLocalizedPokemonName(pokemon, currentLanguage());
    }
    const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

    // --- DOM Elements ---
    const moneyDisplay = document.getElementById('money');
    const moneyPerSecondDisplay = document.getElementById('money-per-second');
    const prestigePointsDisplay = document.getElementById('prestige-points');
    const prestigeMultiplierDisplay = document.getElementById('prestige-multiplier');
    const pokemonContainer = document.getElementById('pokemon-container');
    const storeItemsContainer = document.getElementById('store-items');
    const upgradesItemsContainer = document.getElementById('upgrades-items');
    const achievementsItemsContainer = document.getElementById('achievements-items');
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
        battleSystem?.refreshBattlePreview();
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

    function buildPokemonData(gen) {
        const range = genRanges.find(r => r.gen === gen) || genRanges[0];
        const difficultyFactor = 1 + (gen - 1) * 1.5;
        const list = [];
        for (let dex = range.start; dex <= range.end; dex++) {
            const indexInGen = dex - range.start;
            const name = getLocalizedPokemonName({ id: `dex-${dex}`, dex }, currentLanguage());
            const safeId = `dex-${dex}`;
            const cost = Math.floor(25 * Math.pow(1.25, indexInGen) * difficultyFactor);
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

    function getPokemonXpValue(id) {
        return pokemonXP[id] || 0;
    }

    function addPokemonXpValue(id, amount) {
        pokemonXP[id] = (pokemonXP[id] || 0) + amount;
    }

    function incrementQuestProgressValue(field, amount) {
        questProgress[field] = (questProgress[field] || 0) + amount;
    }

    function getMoneyValue() {
        return money;
    }

    function addMoneyValue(delta) {
        money += delta;
    }

    function getMoneyPerSecondValue() {
        return moneyPerSecond;
    }

    function getCurrentGenerationValue() {
        return currentGeneration;
    }

    function hideChangePokemonModal() {
        if (changePokemonModal) changePokemonModal.style.display = 'none';
    }

    function hideGymsModal() {
        if (gymsModal) gymsModal.style.display = 'none';
    }

    function hideLeaguesModal() {
        if (leaguesModal) leaguesModal.style.display = 'none';
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

    function calculateMoneyPerSecond() {
        moneyPerSecond = 0;
        const favoriteId = battleSystem ? battleSystem.getBattlePokemonId() : null;
        for (const id in ownedPokemon) {
            const pokemon = pokemonData.find(p => p.id === id);
            if (!pokemon) continue;
            let pokemonMps = pokemon.mps;
            if (favoriteId && id === favoriteId) {
                pokemonMps *= 2;
            }
            if (shinyPokemon.includes(id)) {
                pokemonMps *= SHINY_MULTIPLIER;
            }
            if (activeChallenge && activeChallenge.shinyOnly && !shinyPokemon.includes(id)) {
                pokemonMps = 0;
            }
            purchasedUpgrades.forEach(upgradeId => {
                const upgrade = upgradesData.find(u => u.id === upgradeId);
                if (upgrade && upgrade.multiplier && (upgrade.target === id || upgrade.target === 'all')) {
                    pokemonMps *= upgrade.multiplier;
                }
            });
            moneyPerSecond += ownedPokemon[id] * pokemonMps;
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
            const favEmpty = !battleSystem || !battleSystem.getBattlePokemonId();
            if (favEmpty) {
                battleSystem?.setBattlePokemon(pokemonId);
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
                toast('toast-buy-prev');
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
                    toast('toast-shiny-found', { name: localizedPokemonName(pokemon), mult: SHINY_MULTIPLIER });
                    gainXp(100);
                }
            }

            calculateMoneyPerSecond();
            updateUI();
        } else {
            toast('toast-no-money');
        }
    }

    function buyUpgrade(upgradeId) {
        const upgradeIndex = upgradesData.findIndex(u => u.id === upgradeId);
        const upgrade = upgradesData[upgradeIndex];
        if (!upgrade) return;

        if (upgradeIndex > 0) {
            const prevId = upgradesData[upgradeIndex - 1].id;
            if (!purchasedUpgrades.includes(prevId)) {
                toast('toast-upgrade-prev');
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
            toast('toast-upgrade-fail');
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
            toast('toast-auto-activated', { name: auto.name });
            if (auto.autoBuyPokemon) {
                autoBuyTargetId = autoBuyTargetId || pokemonData[0]?.id || null;
                renderAutomation();
            }
        } else {
            toast('toast-no-money-auto');
        }
    }

    function toggleAutoBuyChain() {
        if (!purchasedAutomation.includes('auto-buy-chain')) return;
        autoBuyChainEnabled = !autoBuyChainEnabled;
        recalcAutomation();
        renderAutomation();
        toast(autoBuyChainEnabled ? 'toast-auto-chain-on' : 'toast-auto-chain-off');
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

    function activateChallenge(challenge) {
        activeChallenge = challenge;
        toast('toast-challenge-start', { name: challenge.name });
        calculateMoneyPerSecond();
        renderChallenges();
    }

    function useConsumable(item) {
        if (!inventoryItems[item.id] || inventoryItems[item.id] <= 0) {
            toast('toast-no-item');
            return;
        }
        inventoryItems[item.id] -= 1;
        const expiresAt = Date.now() + item.duration;
        activeConsumables.push({ ...item, expiresAt });
        toast('toast-item-used', { name: item.name });
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
            toast('toast-talent-req');
            return;
        }
        if (talentPoints >= talent.cost) {
            talentPoints -= talent.cost;
            unlockedTalents.push(talentId);
            recalcTalents();
            renderTalents();
            updateStats();
            toast('toast-talent-unlock', { name: talent.name });
        } else {
            toast('toast-talent-no-points');
        }
    }

    // --- UI Update Functions ---

    function updateUI() {
        updateStats();
        renderOwnedPokemon();
        battleSystem?.renderBattlePokemon();
        updateTrainerUI();
        renderAutomation();
        renderTalents();
        renderQuests();
        updateEventBanner();
        renderChallenges();
        renderInventory();
    }

    function updateStats() {
        moneyDisplay.textContent = formatNumber(Math.floor(money));
        moneyPerSecondDisplay.textContent = formatNumber(moneyPerSecond);
        prestigePointsDisplay.textContent = `${formatNumber(prestigePoints)} (Gen ${currentGeneration})`;
        prestigeMultiplierDisplay.textContent = `${prestigeMultiplier.toFixed(2)}x`;
        updateHeroStats();
        battleSystem?.refreshBattlePreview();
    }

    setNameUpdateCallback(() => {
        if (typeof updateUI === 'function') updateUI();
    });

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
        const favoriteId = battleSystem ? battleSystem.getBattlePokemonId() : null;
        if (pokemon.id === favoriteId) {
            pokemonElement.classList.add('favorite');
        }
        if (shinyPokemon.includes(pokemon.id)) {
            pokemonElement.classList.add('shiny');
        }
        const localizedName = localizedPokemonName(pokemon);
        pokemonElement.innerHTML = `
            <img src="${getSpriteUrl(pokemon)}" alt="${localizedName}">
            <span>${localizedName} (x${formatNumber(count)})</span>
        `;
        if (isSelectable) {
            pokemonElement.addEventListener('click', () => battleSystem?.setBattlePokemon(pokemon.id));
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

    function renderAutomation() {
        const container = document.getElementById('automation-items');
        if (!container) return;
        container.innerHTML = '';
        if (autoBuyCurrentLabel) {
            const target = pokemonData.find(p => p.id === autoBuyTargetId);
            const targetName = target ? localizedPokemonName(target) : null;
            autoBuyCurrentLabel.textContent = target ? `Cible: #${target.dex} ${targetName}` : 'Aucune cible';
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
            toast('toast-challenge-stop');
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
            const localizedName = localizedPokemonName(pokemon);
            storeItemElement.innerHTML = `
                <img src="${pokemon.imageUrl}" alt="${localizedName}">
                <p>#${pokemon.dex} ${localizedName}</p>
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
            toast('toast-level-up', { level: trainerLevel });
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
        const defeatedCount = battleSystem?.getDefeatedGymsCount(gen) || 0;
        if (defeatedCount >= requiredBadges) {
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
                toast('toast-achievement', { name: achievement.name });
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
                toast('toast-quest-done', { name: q.name, reward: q.reward });
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
        const defeatedCount = battleSystem?.getDefeatedGymsCount(gen) || 0;
        if (defeatedCount >= requiredBadges) {
            const newPrestigePoints = Math.floor(Math.sqrt(money / 10000000)); // Prestige points are now based on money at time of prestige
            prestigePoints += newPrestigePoints;
            prestigeMultiplier = 1 + prestigePoints * 0.1;
            talentPoints += newPrestigePoints;

            // Advance to the next generation if possible
            if (currentGeneration < genRanges.length) {
                currentGeneration += 1;
                toast('toast-gen-unlock', { gen: currentGeneration });
            }

            // Reset progress
            money = 15;
            ownedPokemon = {};
            purchasedUpgrades = [];
            unlockedAchievements = [];
            shinyPokemon = [];
            defeatedEliteFour = {};
            battleSystem?.resetBattleProgress();
            trainerLevel = 1;
            trainerXp = 0;
            xpToNextLevel = 100;
            clickValue = 1;
            prestigeButton.style.display = 'none';

            refreshGenerationData();
            calculateMoneyPerSecond();
            updateUI();
            toast('toast-prestige', { points: newPrestigePoints, mult: prestigeMultiplier.toFixed(2), gen: currentGeneration });
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
            shinyPokemon: shinyPokemon,
            battle: battleSystem?.getStateForSave() || null,
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
        toast('toast-save-ok');
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
                shinyPokemon = gameState.shinyPokemon || [];
                battleSystem?.loadState(gameState.battle || {});
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
            shinyPokemon = [];
            battleSystem?.resetBattleProgress();
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
            toast('toast-load-fail');
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
                toast('toast-offline', { amount: Math.floor(offlineEarnings) });
            } else {
                toast('toast-load-ok');
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
            toast('toast-load-ok');
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
            battleSystem?.renderLeagues();
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
            battleSystem?.renderGyms();
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
                toast('toast-challenges-soon');
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

        battleSystem?.refreshBattlePreview();

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
                    toast('toast-shiny-drop', { name: localizedPokemonName(randomPokemon), mult: SHINY_MULTIPLIER });
                }
                questProgress.catches += 1;
                calculateMoneyPerSecond();
                updateUI();
                toast('toast-pokeball-drop', { name: localizedPokemonName(randomPokemon) });
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

        battleButton.addEventListener('click', () => battleSystem?.startBattle());

        if (tutorialOverlay && tutorialNextButton && tutorialBackButton && tutorialSkipButton) {
            tutorialNextButton.addEventListener('click', nextTutorialStep);
            tutorialBackButton.addEventListener('click', previousTutorialStep);
            tutorialSkipButton.addEventListener('click', () => endTutorial(true));
            window.addEventListener('resize', refreshTutorialHighlight);
            document.addEventListener('scroll', refreshTutorialHighlight, true);
        }

        startTutorialIfNeeded(lastSaveTime);
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
            battleSystem?.clearBattleCooldown();
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
    battleSystem = createBattleSystem({
        getPokemonData: () => pokemonData,
        getOwnedPokemon: () => ownedPokemon,
        getPokemonXPForId: getPokemonXpValue,
        addPokemonXp: addPokemonXpValue,
        isShinyPokemon: (id) => shinyPokemon.includes(id),
        getCurrentGeneration: getCurrentGenerationValue,
        getMoneyPerSecond: getMoneyPerSecondValue,
        getMoney: getMoneyValue,
        addMoney: addMoneyValue,
        incrementQuestProgress: incrementQuestProgressValue,
        gainXp: gainXp,
        calculateMoneyPerSecond: calculateMoneyPerSecond,
        updateStats: updateStats,
        checkQuests: checkQuests,
        toast: toast,
        t: t,
        translateWithParams: translateWithParams,
        getLocalizedPokemonName: localizedPokemonName,
        getSpriteUrl: getSpriteUrl,
        closeChangePokemonModal: hideChangePokemonModal,
        onBattlePokemonSelected: () => {
            calculateMoneyPerSecond();
            updateUI();
        },
        closeGymsModal: hideGymsModal,
        closeLeaguesModal: hideLeaguesModal,
        getPrestigeMultiplier: () => prestigeMultiplier
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








