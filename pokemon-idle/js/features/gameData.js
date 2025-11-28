import { formatNumber } from '../utils/math.js';

export const genRanges = [
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

export const kantoPokemonNames = [
    'Bulbasaur','Ivysaur','Venusaur','Charmander','Charmeleon','Charizard','Squirtle','Wartortle','Blastoise','Caterpie','Metapod','Butterfree','Weedle','Kakuna','Beedrill','Pidgey','Pidgeotto','Pidgeot','Rattata','Raticate','Spearow','Fearow','Ekans','Arbok','Pikachu','Raichu','Sandshrew','Sandslash','Nidoran-F','Nidorina','Nidoqueen','Nidoran-M','Nidorino','Nidoking','Clefairy','Clefable','Vulpix','Ninetales','Jigglypuff','Wigglytuff','Zubat','Golbat','Oddish','Gloom','Vileplume','Paras','Parasect','Venonat','Venomoth','Diglett','Dugtrio','Meowth','Persian','Psyduck','Golduck','Mankey','Primeape','Growlithe','Arcanine','Poliwag','Poliwhirl','Poliwrath','Abra','Kadabra','Alakazam','Machop','Machoke','Machamp','Bellsprout','Weepinbell','Victreebel','Tentacool','Tentacruel','Geodude','Graveler','Golem','Ponyta','Rapidash','Slowpoke','Slowbro','Magnemite','Magneton','Farfetchd','Doduo','Dodrio','Seel','Dewgong','Grimer','Muk','Shellder','Cloyster','Gastly','Haunter','Gengar','Onix','Drowzee','Hypno','Krabby','Kingler','Voltorb','Electrode','Exeggcute','Exeggutor','Cubone','Marowak','Hitmonlee','Hitmonchan','Lickitung','Koffing','Weezing','Rhyhorn','Rhydon','Chansey','Tangela','Kangaskhan','Horsea','Seadra','Goldeen','Seaking','Staryu','Starmie','Mr. Mime','Scyther','Jynx','Electabuzz','Magmar','Pinsir','Tauros','Magikarp','Gyarados','Lapras','Ditto','Eevee','Vaporeon','Jolteon','Flareon','Porygon','Omanyte','Omastar','Kabuto','Kabutops','Aerodactyl','Snorlax','Articuno','Zapdos','Moltres','Dratini','Dragonair','Dragonite','Mewtwo','Mew'
];

const baseUpgradeConfigSeed = [
    { id: 'click-1', name: 'Muscle Band', target: 'click', clickBonus: 1, icon: 'muscle-band.png' },
    { id: 'click-2', name: 'Scope Lens', target: 'click', clickBonus: 3, icon: 'scope-lens.png' },
    { id: 'click-3', name: 'Quick Claw', target: 'click', clickBonus: 8, icon: 'quick-claw.png' },
    { id: 'all-1', name: 'Lucky Egg', target: 'all', multiplier: 1.15, icon: 'lucky-egg.png' },
    { id: 'all-2', name: 'Exp Share', target: 'all', multiplier: 1.18, icon: 'exp-share.png' },
    { id: 'all-3', name: 'Amulet Coin', target: 'all', multiplier: 1.22, icon: 'amulet-coin.png' },
    { id: 'legend-144', name: 'Plume Articuno', target: 'all', multiplier: 1.25, icon: 'sharp-beak.png' },
    { id: 'legend-145', name: 'Éclair Zapdos', target: 'all', multiplier: 1.28 },
    { id: 'legend-146', name: 'Brasier Moltres', target: 'all', multiplier: 1.32, icon: 'charcoal.png' },
    { id: 'legend-150', name: 'Clone Mewtwo', target: 'all', multiplier: 1.4, clickBonus: 5, icon: 'upgrade.png' },
    { id: 'legend-151', name: 'Aura Mew', target: 'all', multiplier: 1.6, clickBonus: 10, icon: 'light-ball.png' }
];

const generatedUpgrades = [];
for (let i = 1; i <= 140; i++) {
    if (i % 2 === 0) {
        generatedUpgrades.push({
            id: `gen-click-${i}`,
            name: `Hyper Tap ${i}`,
            target: 'click',
            clickBonus: 3 + Math.ceil(i * 1.5),
            icon: 'wide-lens.png'
        });
    } else {
        generatedUpgrades.push({
            id: `gen-mps-${i}`,
            name: `Synergie ${i}`,
            target: 'all',
            multiplier: 1.02 + (i % 7 === 0 ? 0.015 : 0),
            icon: 'rare-candy.png'
        });
    }
}

export const baseUpgradeConfig = [
    ...baseUpgradeConfigSeed,
    ...generatedUpgrades,
    { id: 'auto-buy-chain-shiny', name: 'Auto Buy Progressif Shiny', target: 'all', multiplier: 1.05, shinyBonus: 0.002, icon: 'dusk-stone.png' }
];

export const automationUpgradesData = [
    { id: 'auto-click-1', name: 'PokeBot v1', cost: 5000, autoClick: 1 },
    { id: 'auto-click-2', name: 'PokeBot v2', cost: 55000, autoClick: 4 },
    { id: 'auto-click-3', name: 'PokeBot v3', cost: 220000, autoClick: 12 },
    { id: 'auto-click-4', name: 'PokeBot v4', cost: 900000, autoClick: 30 },
    { id: 'auto-click-5', name: 'PokeBot v5', cost: 2600000, autoClick: 70 },
    { id: 'auto-click-6', name: 'PokeBot v6', cost: 7200000, autoClick: 150 },
    { id: 'auto-click-7', name: 'PokeBot v7', cost: 18000000, autoClick: 320 },
    { id: 'auto-click-8', name: 'PokeBot v8', cost: 42000000, autoClick: 650 },
    { id: 'auto-click-9', name: 'PokeBot v9', cost: 105000000, autoClick: 1300 },
    { id: 'auto-click-10', name: 'PokeBot v10', cost: 260000000, autoClick: 2600 },
    { id: 'auto-buy-store', name: 'Auto Buy Store', cost: 1200000, autoBuyPokemon: true },
    { id: 'auto-buy-upgrades', name: 'Auto Buy Upgrades', cost: 2200000, autoBuyUpgrade: true },
    { id: 'auto-buy-chain', name: 'Auto Buy Progressif', cost: 3500000, autoBuyChain: true }
];

export const talentsData = [
    { id: 'talent-mps-1', name: 'Boost MPS I', desc: '+5% MPS', cost: 1, mpsMult: 1.05 },
    { id: 'talent-click-1', name: 'Cliqueur I', desc: '+1 clic', cost: 1, clickBonus: 1, requires: ['talent-mps-1'] },
    { id: 'talent-shiny', name: 'Chasseur Shiny', desc: '+0.5% shiny', cost: 2, shinyBonus: 0.005, requires: ['talent-mps-1'] },
    { id: 'talent-mps-2', name: 'Boost MPS II', desc: '+10% MPS', cost: 2, mpsMult: 1.1, requires: ['talent-mps-1'] },
    { id: 'talent-click-2', name: 'Cliqueur II', desc: '+2 clic', cost: 2, clickBonus: 2, requires: ['talent-click-1'] },
    { id: 'talent-discount-store', name: 'Marchandage', desc: '-5% coûts store', cost: 2, storeDiscount: 0.05, requires: ['talent-mps-1'] },
    { id: 'talent-discount-upg', name: 'Ingé malin', desc: '-5% coûts upgrades', cost: 2, upgradeDiscount: 0.05, requires: ['talent-mps-2'] },
    { id: 'talent-mps-3', name: 'Boost MPS III', desc: '+15% MPS', cost: 3, mpsMult: 1.15, requires: ['talent-mps-2'] },
    { id: 'talent-click-3', name: 'Cliqueur III', desc: '+3 clic', cost: 3, clickBonus: 3, requires: ['talent-click-2'] },
    { id: 'talent-mps-4', name: 'Boost MPS IV', desc: '+20% MPS', cost: 4, mpsMult: 1.2, requires: ['talent-mps-3'] },
    { id: 'talent-click-4', name: 'Cliqueur IV', desc: '+4 clic', cost: 4, clickBonus: 4, requires: ['talent-click-3'] },
    { id: 'talent-shiny-2', name: 'Chasseur Shiny II', desc: '+1% shiny', cost: 3, shinyBonus: 0.01, requires: ['talent-shiny'] },
    { id: 'talent-store-2', name: 'Marchandage II', desc: '-5% coûts store', cost: 3, storeDiscount: 0.05, requires: ['talent-discount-store'] },
    { id: 'talent-upg-2', name: 'Ingé malin II', desc: '-5% coûts upgrades', cost: 3, upgradeDiscount: 0.05, requires: ['talent-discount-upg'] },
    { id: 'talent-mps-5', name: 'Boost MPS V', desc: '+25% MPS', cost: 5, mpsMult: 1.25, requires: ['talent-mps-4'] },
    { id: 'talent-click-5', name: 'Cliqueur V', desc: '+5 clic', cost: 5, clickBonus: 5, requires: ['talent-click-4'] },
    { id: 'talent-critical', name: 'Critique', desc: '1% de chances de clic x10', cost: 4, critChance: 0.01, critMult: 10, requires: ['talent-click-3'] },
    { id: 'talent-mps-6', name: 'Boost MPS VI', desc: '+30% MPS', cost: 6, mpsMult: 1.3, requires: ['talent-mps-5'] },
    { id: 'talent-click-6', name: 'Cliqueur VI', desc: '+6 clic', cost: 6, clickBonus: 6, requires: ['talent-click-5'] },
    { id: 'talent-shiny-3', name: 'Chasseur Shiny III', desc: '+1.5% shiny', cost: 5, shinyBonus: 0.015, requires: ['talent-shiny-2'] },
    { id: 'talent-store-3', name: 'Marchandage III', desc: '-5% coûts store', cost: 4, storeDiscount: 0.05, requires: ['talent-store-2'] },
    { id: 'talent-upg-3', name: 'Ingé malin III', desc: '-5% coûts upgrades', cost: 4, upgradeDiscount: 0.05, requires: ['talent-upg-2'] },
    { id: 'talent-mps-7', name: 'Boost MPS VII', desc: '+35% MPS', cost: 7, mpsMult: 1.35, requires: ['talent-mps-6'] },
    { id: 'talent-click-7', name: 'Cliqueur VII', desc: '+7 clic', cost: 7, clickBonus: 7, requires: ['talent-click-6'] },
    { id: 'talent-regen', name: 'Auto-heal', desc: 'MPS +2% en combat', cost: 3, mpsMult: 1.02, requires: ['talent-mps-2'] },
    { id: 'talent-event', name: 'Maître des events', desc: 'Events durent +20%', cost: 4, eventDurationBonus: 0.2, requires: ['talent-mps-3'] },
    { id: 'talent-auto-battle', name: 'Auto Battle', desc: 'Auto-lance un combat toutes les 2 min', cost: 6, autoBattle: true, requires: ['talent-mps-4'] },
    { id: 'talent-click-crit-2', name: 'Critique II', desc: '+1% crit', cost: 5, critChance: 0.01, critMult: 10, requires: ['talent-critical'] },
    { id: 'talent-mps-8', name: 'Boost MPS VIII', desc: '+40% MPS', cost: 8, mpsMult: 1.4, requires: ['talent-mps-7'] },
    { id: 'talent-click-8', name: 'Cliqueur VIII', desc: '+8 clic', cost: 8, clickBonus: 8, requires: ['talent-click-7'] },
    { id: 'talent-shiny-4', name: 'Chasseur Shiny IV', desc: '+2% shiny', cost: 6, shinyBonus: 0.02, requires: ['talent-shiny-3'] },
    { id: 'talent-store-4', name: 'Marchandage IV', desc: '-5% coûts store', cost: 5, storeDiscount: 0.05, requires: ['talent-store-3'] },
    { id: 'talent-upg-4', name: 'Ingé malin IV', desc: '-5% coûts upgrades', cost: 5, upgradeDiscount: 0.05, requires: ['talent-upg-3'] },
    { id: 'talent-mps-9', name: 'Boost MPS IX', desc: '+45% MPS', cost: 9, mpsMult: 1.45, requires: ['talent-mps-8'] },
    { id: 'talent-click-9', name: 'Cliqueur IX', desc: '+9 clic', cost: 9, clickBonus: 9, requires: ['talent-click-8'] },
    { id: 'talent-final', name: 'Symphonie', desc: '+50% MPS et +10 clic', cost: 10, mpsMult: 1.5, clickBonus: 10, requires: ['talent-mps-9','talent-click-9'] }
];

export const questPool = (() => {
    const pool = [];
    for (let i = 1; i <= 25; i++) {
        pool.push({ id: `q-money-${i}`, name: `Gagner ${formatNumber(50000 * i)}`, goal: 'money', target: 50000 * i, reward: 1 });
    }
    for (let i = 1; i <= 25; i++) {
        pool.push({ id: `q-clicks-${i}`, name: `Cliquer ${200 + i * 20}x`, goal: 'clicks', target: 200 + i * 20, reward: 1 });
    }
    for (let i = 1; i <= 25; i++) {
        pool.push({ id: `q-battles-${i}`, name: `Vaincre ${i * 3} rivaux`, goal: 'battles', target: i * 3, reward: 1 });
    }
    for (let i = 1; i <= 25; i++) {
        pool.push({ id: `q-catches-${i}`, name: `Capturer ${5 * i} Pokémon`, goal: 'catches', target: 5 * i, reward: 1 });
    }
    return pool;
})();

export const dynamicEventsPool = [
    { id: 'ev-mps', name: 'Pluie de Pokédollars', duration: 60000, mpsMult: 1.5, description: 'MPS x1.5 pendant 60s' },
    { id: 'ev-click', name: 'Turbo Click', duration: 45000, clickMult: 2, description: 'Clics x2 pendant 45s' },
    { id: 'ev-shiny', name: 'Lueur Shiny', duration: 30000, shinyBonus: 0.02, description: 'Chance shiny +2% pendant 30s' }
];

export const leaguesData = [
    { id: 'league-1', name: 'Ligue PokéBall', entry: 1000, rewardMult: 1.2, difficulty: 1 },
    { id: 'league-2', name: 'Ligue Super', entry: 7500, rewardMult: 1.6, difficulty: 1.5 },
    { id: 'league-3', name: 'Ligue Hyper', entry: 40000, rewardMult: 2.2, difficulty: 2.2 },
    { id: 'league-4', name: 'Ligue Master', entry: 150000, rewardMult: 3.2, difficulty: 3.2 }
];

export const gymLeadersData = {
    1: [
        { id: 'brock', name: 'Pierre', badge: 'Badge Roche', team: [{ dex: 74, level: 12 }, { dex: 95, level: 14 }] },
        { id: 'misty', name: 'Ondine', badge: 'Badge Cascade', team: [{ dex: 120, level: 18 }, { dex: 121, level: 21 }] },
        { id: 'lt-surge', name: 'Major Bob', badge: 'Badge Foudre', team: [{ dex: 100, level: 21 }, { dex: 25, level: 18 }, { dex: 26, level: 24 }] },
        { id: 'erika', name: 'Erika', badge: 'Badge Prisme', team: [{ dex: 71, level: 29 }, { dex: 114, level: 24 }, { dex: 45, level: 29 }] },
        { id: 'koga', name: 'Koga', badge: 'Badge Âme', team: [{ dex: 109, level: 37 }, { dex: 89, level: 39 }, { dex: 109, level: 37 }, { dex: 110, level: 43 }] },
        { id: 'sabrina', name: 'Sabrina', badge: 'Badge Marais', team: [{ dex: 64, level: 38 }, { dex: 122, level: 37 }, { dex: 49, level: 38 }, { dex: 65, level: 43 }] },
        { id: 'blaine', name: 'Auguste', badge: 'Badge Volcan', team: [{ dex: 58, level: 42 }, { dex: 77, level: 40 }, { dex: 78, level: 42 }, { dex: 59, level: 47 }] },
        { id: 'giovanni', name: 'Giovanni', badge: 'Badge Terre', team: [{ dex: 111, level: 45 }, { dex: 51, level: 42 }, { dex: 31, level: 44 }, { dex: 34, level: 45 }, { dex: 112, level: 50 }] }
    ]
};

export const eliteFourData = {
    1: [
        { id: 'lorelei', name: 'Olga', team: [{ dex: 87, level: 54 }, { dex: 91, level: 53 }, { dex: 80, level: 54 }, { dex: 124, level: 56 }, { dex: 131, level: 56 }] },
        { id: 'bruno', name: 'Aldo', team: [{ dex: 95, level: 53 }, { dex: 107, level: 55 }, { dex: 106, level: 55 }, { dex: 95, level: 56 }, { dex: 68, level: 58 }] },
        { id: 'agatha', name: 'Agatha', team: [{ dex: 94, level: 56 }, { dex: 42, level: 56 }, { dex: 93, level: 55 }, { dex: 24, level: 58 }, { dex: 94, level: 60 }] },
        { id: 'lance', name: 'Peter', team: [{ dex: 130, level: 58 }, { dex: 148, level: 56 }, { dex: 148, level: 56 }, { dex: 142, level: 60 }, { dex: 149, level: 62 }] },
        { id: 'champion-blue', name: 'Maître Blue', team: [{ dex: 18, level: 61 }, { dex: 65, level: 59 }, { dex: 112, level: 61 }, { dex: 103, level: 63 }, { dex: 130, level: 61 }, { dex: 6, level: 65 }] }
    ]
};

export const bossData = { id: 'boss-week', name: 'Boss Hebdo', entry: 250000, rewardMult: 5, difficulty: 5 };

export const challengesData = [
    { id: 'ch-no-click', name: 'No-Click Run', desc: 'Clic manuel interdit', reward: 'Titre: Zen', effect: { noClick: true } },
    { id: 'ch-shiny-only', name: 'Shiny Only', desc: 'Seuls les shiny produisent du MPS', reward: 'Titre: Brillant', effect: { shinyOnly: true } },
    { id: 'ch-gen-lock', name: 'Gen Lock', desc: 'Bloqué à la génération actuelle', reward: 'Titre: Puriste', effect: { genLock: true } }
];

export const consumablesData = [
    { id: 'berry-shiny', name: 'Baie Lumi', desc: '+2% shiny pendant 60s', effect: { shinyBonus: 0.02 }, duration: 60000 },
    { id: 'incense-click', name: 'Encens Turbo', desc: 'Clics x2 pendant 45s', effect: { clickMult: 2 }, duration: 45000 },
    { id: 'coupon-store', name: 'Coupon Shop', desc: '-20% coûts store pendant 60s', effect: { storeDiscount: 0.2 }, duration: 60000 },
    { id: 'berry-attack', name: 'Baie Attaque', desc: '+10% MPS 60s', effect: { mpsMult: 1.1 }, duration: 60000 },
    { id: 'berry-defense', name: 'Baie Défense', desc: '-10% pertes combat 60s', effect: { lossReduction: 0.1 }, duration: 60000 },
    { id: 'berry-speed', name: 'Baie Vitesse', desc: '+25% clics 45s', effect: { clickMult: 1.25 }, duration: 45000 },
    { id: 'berry-focus', name: 'Baie Focus', desc: '+5% crit 45s', effect: { critChance: 0.05, critMult: 3 }, duration: 45000 },
    { id: 'berry-odor', name: 'Baie Odor', desc: '+1% shiny 60s', effect: { shinyBonus: 0.01 }, duration: 60000 },
    { id: 'berry-stamina', name: 'Baie Stamina', desc: '+5% MPS 120s', effect: { mpsMult: 1.05 }, duration: 120000 },
    { id: 'berry-luck', name: 'Baie Chance', desc: '+5% drops objets 60s', effect: { itemDropBonus: 0.05 }, duration: 60000 },
    { id: 'berry-chill', name: 'Baie Glace', desc: 'Boost combat +5% 60s', effect: { battleBoost: 1.05 }, duration: 60000 },
    { id: 'berry-blaze', name: 'Baie Feu', desc: 'Boost combat +8% 45s', effect: { battleBoost: 1.08 }, duration: 45000 },
    { id: 'berry-mind', name: 'Baie Esprit', desc: '+5% XP gain 60s', effect: { xpBonus: 0.05 }, duration: 60000 },
    { id: 'berry-charge', name: 'Baie Charge', desc: '+15% clics 30s', effect: { clickMult: 1.15 }, duration: 30000 },
    { id: 'incense-mps', name: 'Encens Profit', desc: 'MPS x1.3 45s', effect: { mpsMult: 1.3 }, duration: 45000 },
    { id: 'incense-shiny', name: 'Encens Brillant', desc: '+2% shiny 45s', effect: { shinyBonus: 0.02 }, duration: 45000 },
    { id: 'incense-calm', name: 'Encens Calme', desc: '-15% coûts upgrades 45s', effect: { upgradeDiscount: 0.15 }, duration: 45000 },
    { id: 'incense-shop', name: 'Encens Marchand', desc: '-15% coûts store 45s', effect: { storeDiscount: 0.15 }, duration: 45000 },
    { id: 'incense-crit', name: 'Encens Critique', desc: '+3% crit 60s', effect: { critChance: 0.03, critMult: 4 }, duration: 60000 },
    { id: 'incense-rally', name: 'Encens Rallye', desc: '+10% MPS 90s', effect: { mpsMult: 1.1 }, duration: 90000 },
    { id: 'incense-guard', name: 'Encens Gardien', desc: '-20% pertes combat 45s', effect: { lossReduction: 0.2 }, duration: 45000 },
    { id: 'coupon-upgrade', name: 'Coupon Upgrade', desc: '-20% upgrades 60s', effect: { upgradeDiscount: 0.2 }, duration: 60000 },
    { id: 'coupon-battle', name: 'Ticket Combat', desc: '+20% récompense combat 45s', effect: { battleReward: 1.2 }, duration: 45000 },
    { id: 'coupon-shiny', name: 'Ticket Shiny', desc: '+3% shiny 30s', effect: { shinyBonus: 0.03 }, duration: 30000 },
    { id: 'coupon-event', name: 'Ticket Event', desc: 'Events +15% durée', effect: { eventDurationBonus: 0.15 }, duration: 60000 },
    { id: 'potion-mini', name: 'Potion Mini', desc: '+3% MPS 60s', effect: { mpsMult: 1.03 }, duration: 60000 },
    { id: 'potion-plus', name: 'Potion Plus', desc: '+8% MPS 45s', effect: { mpsMult: 1.08 }, duration: 45000 },
    { id: 'potion-crit', name: 'Potion Critique', desc: '+2% crit 30s', effect: { critChance: 0.02, critMult: 5 }, duration: 30000 },
    { id: 'potion-click', name: 'Potion Clic', desc: 'Clics x1.5 30s', effect: { clickMult: 1.5 }, duration: 30000 },
    { id: 'potion-xp', name: 'Potion XP', desc: '+10% XP gain 60s', effect: { xpBonus: 0.1 }, duration: 60000 },
    { id: 'potion-guard', name: 'Potion Gardien', desc: '-10% pertes combat 60s', effect: { lossReduction: 0.1 }, duration: 60000 },
    { id: 'potion-marchand', name: 'Potion Marchand', desc: '-10% coûts store 60s', effect: { storeDiscount: 0.1 }, duration: 60000 },
    { id: 'potion-ingenieur', name: 'Potion Ingé', desc: '-10% coûts upgrades 60s', effect: { upgradeDiscount: 0.1 }, duration: 60000 },
    { id: 'potion-rally', name: 'Potion Rallye', desc: '+12% MPS 60s', effect: { mpsMult: 1.12 }, duration: 60000 },
    { id: 'potion-dynamo', name: 'Potion Dynamo', desc: 'Clics x1.8 20s', effect: { clickMult: 1.8 }, duration: 20000 },
    { id: 'potion-brio', name: 'Potion Brio', desc: '+1% shiny 45s', effect: { shinyBonus: 0.01 }, duration: 45000 },
    { id: 'potion-omega', name: 'Potion Omega', desc: '+15% MPS 45s', effect: { mpsMult: 1.15 }, duration: 45000 },
    { id: 'stone-dawn', name: 'Pierre Aube', desc: '+5% MPS 90s', effect: { mpsMult: 1.05 }, duration: 90000 },
    { id: 'stone-dusk', name: 'Pierre Nuit', desc: '+7% shiny 20s', effect: { shinyBonus: 0.07 }, duration: 20000 },
    { id: 'stone-water', name: 'Pierre Eau', desc: '-5% coûts store 120s', effect: { storeDiscount: 0.05 }, duration: 120000 },
    { id: 'stone-fire', name: 'Pierre Feu', desc: '+2% crit 60s', effect: { critChance: 0.02, critMult: 5 }, duration: 60000 },
    { id: 'stone-thunder', name: 'Pierre Foudre', desc: 'Clics x2 25s', effect: { clickMult: 2 }, duration: 25000 },
    { id: 'stone-leaf', name: 'Pierre Plante', desc: '+10% MPS 50s', effect: { mpsMult: 1.1 }, duration: 50000 },
    { id: 'stone-ice', name: 'Pierre Glace', desc: '+5% récompenses combat 60s', effect: { battleReward: 1.05 }, duration: 60000 },
    { id: 'stone-dragon', name: 'Pierre Dragon', desc: '+15% MPS 30s', effect: { mpsMult: 1.15 }, duration: 30000 },
    { id: 'stone-dark', name: 'Pierre Obscur', desc: 'Shiny +2% 30s', effect: { shinyBonus: 0.02 }, duration: 30000 },
    { id: 'stone-light', name: 'Pierre Brillante', desc: '-15% coûts store 45s', effect: { storeDiscount: 0.15 }, duration: 45000 },
    { id: 'stone-metal', name: 'Pierre Métal', desc: '-15% coûts upgrades 45s', effect: { upgradeDiscount: 0.15 }, duration: 45000 },
    { id: 'stone-sky', name: 'Pierre Ciel', desc: '+5% XP gain 90s', effect: { xpBonus: 0.05 }, duration: 90000 },
    { id: 'stone-mind', name: 'Pierre Esprit', desc: '+3% crit 40s', effect: { critChance: 0.03, critMult: 4 }, duration: 40000 },
    { id: 'stone-spirit', name: 'Pierre Esprit+', desc: '+20% MPS 25s', effect: { mpsMult: 1.2 }, duration: 25000 }
];

export const itemDrops = [
    { id: 'berry-shiny', name: 'Baie Lumi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lum-berry.png' },
    { id: 'incense-click', name: 'Encens Turbo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/odd-incense.png' },
    { id: 'coupon-store', name: 'Coupon Shop', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coupon-1.png' },
    { id: 'berry-attack', name: 'Baie Attaque', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/liechi-berry.png' },
    { id: 'berry-defense', name: 'Baie Défense', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ganlon-berry.png' },
    { id: 'berry-speed', name: 'Baie Vitesse', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/salac-berry.png' },
    { id: 'berry-focus', name: 'Baie Focus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/petaya-berry.png' },
    { id: 'berry-odor', name: 'Baie Odor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/apscotch-berry.png' },
    { id: 'berry-stamina', name: 'Baie Stamina', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/apicot-berry.png' },
    { id: 'berry-luck', name: 'Baie Chance', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/starf-berry.png' },
    { id: 'berry-chill', name: 'Baie Glace', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-gem.png' },
    { id: 'berry-blaze', name: 'Baie Feu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-gem.png' },
    { id: 'berry-mind', name: 'Baie Esprit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/psychic-gem.png' },
    { id: 'berry-charge', name: 'Baie Charge', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-claw.png' },
    { id: 'incense-mps', name: 'Encens Profit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luck-incense.png' },
    { id: 'incense-shiny', name: 'Encens Brillant', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/odd-incense.png' },
    { id: 'incense-calm', name: 'Encens Calme', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pure-incense.png' },
    { id: 'incense-shop', name: 'Encens Marchand', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rose-incense.png' },
    { id: 'incense-crit', name: 'Encens Critique', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/scope-lens.png' },
    { id: 'incense-rally', name: 'Encens Rallye', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/muscle-band.png' },
    { id: 'incense-guard', name: 'Encens Gardien', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png' },
    { id: 'coupon-upgrade', name: 'Coupon Upgrade', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coupon-2.png' },
    { id: 'coupon-battle', name: 'Ticket Combat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/relic-gold.png' },
    { id: 'coupon-shiny', name: 'Ticket Shiny', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dream-ball.png' },
    { id: 'coupon-event', name: 'Ticket Event', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-toy.png' },
    { id: 'potion-mini', name: 'Potion Mini', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png' },
    { id: 'potion-plus', name: 'Potion Plus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png' },
    { id: 'potion-crit', name: 'Potion Critique', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/zoom-lens.png' },
    { id: 'potion-click', name: 'Potion Clic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pp-max.png' },
    { id: 'potion-xp', name: 'Potion XP', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/exp-share.png' },
    { id: 'potion-guard', name: 'Potion Gardien', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sitrus-berry.png' },
    { id: 'potion-marchand', name: 'Potion Marchand', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/amulet-coin.png' },
    { id: 'potion-ingenieur', name: 'Potion Ingé', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/iron.png' },
    { id: 'potion-rally', name: 'Potion Rallye', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/macho-brace.png' },
    { id: 'potion-dynamo', name: 'Potion Dynamo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/light-ball.png' },
    { id: 'potion-brio', name: 'Potion Brio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pearl.png' },
    { id: 'potion-omega', name: 'Potion Omega', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png' },
    { id: 'stone-dawn', name: 'Pierre Aube', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dawn-stone.png' },
    { id: 'stone-dusk', name: 'Pierre Nuit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png' },
    { id: 'stone-water', name: 'Pierre Eau', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png' },
    { id: 'stone-fire', name: 'Pierre Feu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png' },
    { id: 'stone-thunder', name: 'Pierre Foudre', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png' },
    { id: 'stone-leaf', name: 'Pierre Plante', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png' },
    { id: 'stone-ice', name: 'Pierre Glace', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-stone.png' },
    { id: 'stone-dragon', name: 'Pierre Dragon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png' },
    { id: 'stone-dark', name: 'Pierre Obscur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dark-stone.png' },
    { id: 'stone-light', name: 'Pierre Brillante', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-stone.png' },
    { id: 'stone-metal', name: 'Pierre Métal', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png' },
    { id: 'stone-sky', name: 'Pierre Ciel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sky-plate.png' },
    { id: 'stone-mind', name: 'Pierre Esprit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mind-plate.png' },
    { id: 'stone-spirit', name: 'Pierre Esprit+', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/spiritomb.png' }
];
