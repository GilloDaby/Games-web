import { calcStat, formatNumber, getLevelForXp, getCurrentXpForLevel, getXpToLevelUp } from '../utils/math.js';
import { bossData, eliteFourData, gymLeadersData, leaguesData } from '../features/gameData.js';

const POKEAPI_CSV_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const TYPE_ID_MAP = {
    1: 'normal', 2: 'fighting', 3: 'flying', 4: 'poison', 5: 'ground',
    6: 'rock', 7: 'bug', 8: 'ghost', 9: 'steel', 10: 'fire', 11: 'water',
    12: 'grass', 13: 'electric', 14: 'psychic', 15: 'ice', 16: 'dragon',
    17: 'dark', 18: 'fairy'
};
const BATTLE_LEVEL_BASE = 30;

export function createBattleSystem(deps) {
    const {
        getPokemonData,
        getOwnedPokemon,
        getPokemonXPForId,
        addPokemonXp,
        isShinyPokemon,
        getCurrentGeneration,
        getMoneyPerSecond,
        getMoney,
        addMoney,
        incrementQuestProgress,
        gainXp,
        calculateMoneyPerSecond,
        updateStats,
        checkQuests,
        toast,
        t,
        translateWithParams,
        getLocalizedPokemonName,
        getSpriteUrl,
        closeChangePokemonModal = () => {},
        onBattlePokemonSelected = () => {},
        closeGymsModal = () => {},
        closeLeaguesModal = () => {},
        getPrestigeMultiplier = () => 1
    } = deps;

    const movesById = {};
    const pokemonTypesMap = {};
    const typeChart = {};
    const baseStatsByPokemon = {};
    const learnsetByPokemon = {};

    let battleDataLoaded = false;
    let battleState = null;
    let currentOpponent = null;
    let nextBattleAllowedAt = 0;
    let battlesFought = 0;
    let currentGymBattle = null;
    let battlePokemonId = null;
    let defeatedGyms = {};

    const battleLog = document.getElementById('battle-log');
    const battleActions = document.getElementById('battle-actions');
    const battlePlayerLabel = document.getElementById('battle-player-label');
    const battlePlayerSprite = document.getElementById('battle-player-sprite');
    const battlePlayerHpFill = document.getElementById('battle-player-hp-fill');
    const battlePlayerHpText = document.getElementById('battle-player-hp-text');
    const battleFoeLabel = document.getElementById('battle-foe-label');
    const battleFoeSprite = document.getElementById('battle-foe-sprite');
    const battleFoeHpFill = document.getElementById('battle-foe-hp-fill');
    const battleFoeHpText = document.getElementById('battle-foe-hp-text');
    const battlePokemonXpContainer = document.getElementById('battle-pokemon-xp-container');
    const battlePokemonXpBar = document.getElementById('battle-pokemon-xp-bar');
    const battlePokemonXpText = document.getElementById('battle-pokemon-xp-text');
    const battlePokemonIdSlot = document.getElementById('favorite-pokemon-slot');
    const battleOpponentName = document.getElementById('battle-opponent-name');
    const battleOpponentSprite = document.getElementById('battle-opponent-sprite');
    const battleOpponentPower = document.getElementById('battle-opponent-power');
    const battleRisk = document.getElementById('battle-risk');
    const battlePlayerPower = document.getElementById('battle-player-power');

    function fetchCsv(url) {
        return fetch(url).then(res => {
            if (!res.ok) throw new Error(`CSV fetch failed: ${url}`);
            return res.text();
        }).then(text => text.split('\n').map(line => line.trim()).filter(Boolean));
    }

    function parseCsvRow(line) {
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
            const typeId = Number(cols[3]);
            const power = cols[4] ? Number(cols[4]) : 0;
            const pp = cols[5] ? Number(cols[5]) : 10;
            const accuracy = cols[6] ? Number(cols[6]) : 100;
            const damageClassId = Number(cols[9]);
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
            if (pokemonId > 251) return;
            const versionGroupId = Number(cols[1]);
            const moveId = Number(cols[2]);
            const learnMethodId = Number(cols[3]);
            const level = Number(cols[4]);
            if (learnMethodId !== 1) return;
            if (!learnsetByPokemon[pokemonId]) learnsetByPokemon[pokemonId] = [];
            learnsetByPokemon[pokemonId].push({ moveId, level, versionGroupId });
        });

        battleDataLoaded = true;
    }

    function pickMovesForPokemon(pokemonId) {
        const learnset = learnsetByPokemon[pokemonId] || [];
        if (!learnset.length) {
            const fallback = Object.values(movesById).find(m => m.name === 'tackle');
            return [fallback || { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' }];
        }
        const maxVersion = Math.max(...learnset.map(l => l.versionGroupId || 0));
        const candidates = learnset
            .filter(l => (l.versionGroupId || 0) === maxVersion)
            .map(m => ({ ...movesById[m.moveId], level: m.level }))
            .filter(Boolean);
        candidates.sort((a, b) => (b.level || 0) - (a.level || 0) || (b.power || 0) - (a.power || 0));
        const unique = [];
        const names = new Set();
        for (const mv of candidates) {
            if (!mv || names.has(mv.name)) continue;
            unique.push(mv);
            names.add(mv.name);
            if (unique.length >= 4) break;
        }
        if (!unique.length) {
            const fallback = Object.values(movesById).find(m => m.name === 'tackle');
            unique.push(fallback || { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' });
        }
        return unique;
    }

    function buildCombatantFromDex(dex, options = {}) {
        const { levelBoost = 0, level: directLevel = 0 } = options;
        const pokemonData = getPokemonData();
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
        const localizedName = pokemon ? getLocalizedPokemonName(pokemon) : `Pokemon #${pokemonId}`;
        return {
            id: pokemonId,
            name: localizedName,
            sprite: pokemon ? pokemon.imageUrl : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
            types,
            level,
            stats,
            currentHp: stats.hp,
            moves: pickMovesForPokemon(pokemonId),
        };
    }

    function typeEffectiveness(moveType, defenderTypes) {
        return defenderTypes.reduce((mult, t) => {
            const eff = (typeChart[moveType] && typeChart[moveType][t]) || 1;
            return mult * eff;
        }, 1);
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
        const owned = getOwnedPokemon();
        const pokemonData = getPokemonData();
        const entries = Object.keys(owned);
        if (!entries.length) return null;
        let bestMon = null;
        let bestCost = -1;
        pokemonData.forEach(p => {
            const qty = owned[p.id] || 0;
            if (qty > 0 && p.cost > bestCost) {
                bestMon = p;
                bestCost = p.cost;
            }
        });
        if (battlePokemonId && owned[battlePokemonId]) {
            const fav = pokemonData.find(p => p.id === battlePokemonId);
            if (fav) bestMon = fav;
        }
        return bestMon;
    }

    function getHighestOwnedDexIndex() {
        const owned = getOwnedPokemon();
        const pokemonData = getPokemonData();
        let maxIndex = 0;
        Object.keys(owned).forEach(id => {
            const pokemon = pokemonData.find(p => p.id === id);
            if (pokemon && owned[id] > 0 && pokemon.dex > maxIndex) {
                maxIndex = pokemon.dex;
            }
        });
        return maxIndex;
    }

    function generateBattleOpponentCombatant(playerLevel = 1) {
        const pokemonData = getPokemonData();
        const maxDex = Math.max(...pokemonData.map(p => p.dex));
        const playerOwnedMax = getHighestOwnedDexIndex() + 1;
        const dex = Math.max(1, Math.min(maxDex, playerOwnedMax + Math.floor(Math.random() * 5)));
        const levelVariance = Math.floor(Math.random() * 5) - 2;
        const opponentLevel = Math.max(1, playerLevel + levelVariance);
        return buildCombatantFromDex(dex, { level: opponentLevel });
    }

    function effectivenessText(mult) {
        if (mult === 0) return "Ça n'a aucun effet...";
        if (mult > 1.5) return "C'est super efficace !";
        if (mult < 0.9) return "Ce n'est pas très efficace...";
        return "";
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

    function chooseBestMove(attacker, target) {
        const scored = attacker.moves.map(mv => {
            const eff = typeEffectiveness(mv.type, target.types);
            const dmg = computeDamage(attacker, target, mv);
            const score = (dmg || 0) * eff * (mv.accuracy ? mv.accuracy / 100 : 1);
            return { mv, score };
        }).sort((a, b) => b.score - a.score);
        const top = scored[0] ? scored[0].mv : attacker.moves[0];
        if (scored.length > 1 && Math.random() < 0.2) return scored[1].mv;
        return top;
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

    function endBattle(victory) {
        if (!battleState) return;
        if (currentGymBattle && victory) {
            currentGymBattle.teamIndex++;
            if (currentGymBattle.teamIndex < currentGymBattle.leader.team.length) {
                const nextFoePokemon = currentGymBattle.leader.team[currentGymBattle.teamIndex];
                const nextFoe = buildCombatantFromDex(nextFoePokemon.dex, { level: nextFoePokemon.level });
                logBattle(`Le champion envoie ${nextFoe.name} !`, '#ffb347');
                startBattle(nextFoe, true);
                return;
            } else {
                const gen = getCurrentGeneration();
                if (!defeatedGyms[gen]) defeatedGyms[gen] = [];
                defeatedGyms[gen].push(currentGymBattle.leader.id);
                toast(`Victoire ! Vous avez vaincu ${currentGymBattle.leader.name} !`);
                currentGymBattle = null;
                renderGyms();
            }
        } else if (currentGymBattle && !victory) {
            toast(`Défaite contre ${currentGymBattle.leader.name}...`);
            currentGymBattle = null;
            nextBattleAllowedAt = Date.now() + 10000;
        } else {
             const { foe } = battleState;
            if (victory) {
                const xpGained = 80;
                const reward = Math.floor(foe.level * 120 * (deps.getPrestigeMultiplier ? deps.getPrestigeMultiplier() : 1));
                addMoney(reward);
                gainXp(xpGained);
                if (battlePokemonId) {
                    addPokemonXp(battlePokemonId, xpGained);
                }
                incrementQuestProgress('money', reward);
                incrementQuestProgress('battles', 1);
                toast('toast-victory', { reward: formatNumber(reward) });
            } else {
                const lossMoney = Math.floor(getMoney() * 0.08);
                addMoney(-lossMoney);
                incrementQuestProgress('battles', 0);
                toast('toast-defeat', { loss: formatNumber(lossMoney) });
                nextBattleAllowedAt = Date.now() + 10000;
            }
        }
        battlesFought += 1;
        updateStats();
        checkQuests();
        if (!currentGymBattle) {
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
        if (playerPriority === 0) {
            order.push({ actor: player, target: foe, move: playerMove, isPlayer: true }, { actor: foe, target: player, move: foeMove, isPlayer: false });
        } else {
            order.push({ actor: foe, target: player, move: foeMove, isPlayer: false }, { actor: player, target: foe, move: playerMove, isPlayer: true });
        }
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

    async function startBattle(predefinedFoe = null, isContinuation = false) {
        const now = Date.now();
        if (!isContinuation && now < nextBattleAllowedAt) {
            const wait = Math.ceil((nextBattleAllowedAt - now) / 1000);
            toast('toast-wait-battle', { seconds: wait });
            return;
        }
        const owned = getOwnedPokemon();
        if (!Object.keys(owned).length) {
            toast('toast-no-battle-team');
            return;
        }
        await loadBattleData().catch(() => toast('toast-battle-load-fail'));
        const playerMon = pickPlayerPokemonForBattle();
        if (!playerMon) {
            toast('toast-no-battle-pokemon');
            return;
        }
        const playerPokemonId = playerMon.id;
        const playerXp = getPokemonXPForId(playerPokemonId);
        const playerLevel = getLevelForXp(playerXp);
        const player = (isContinuation && battleState && battleState.player)
            ? battleState.player
            : buildCombatantFromDex(playerMon.dex || Number(playerMon.id.replace('dex-', '')), { level: playerLevel });
        if (isContinuation && battleState && battleState.player) {
            player.currentHp = battleState.player.currentHp;
        }
        const foe = predefinedFoe || generateBattleOpponentCombatant(playerLevel);
        battleState = { player, foe, finished: false };
        if (!isContinuation && battleLog) battleLog.innerHTML = '';
        logBattle(`${foe.name} (Lv.${foe.level}) entre en scène !`, '#ffd166');
        renderBattleUI();
    }

    function refreshBattlePreview() {
        const previewPlayerImg = document.getElementById('preview-player-sprite');
        const previewPlayerName = document.getElementById('preview-player-name');
        if (!battleOpponentName || !battleOpponentSprite || !battleOpponentPower || !battleRisk) return;
        if (!currentOpponent) currentOpponent = generateOpponent();
        battleOpponentName.textContent = `#${currentOpponent.dex} ${currentOpponent.name}`;
        battleOpponentSprite.src = currentOpponent.imageUrl;
        battleOpponentPower.textContent = `${t('battle-power')}: ${formatNumber(currentOpponent.power)}`;
        const playerMon = pickPlayerPokemonForBattle();
        if (battlePlayerPower) {
            if (playerMon) {
                const playerXp = getPokemonXPForId(playerMon.id);
                const playerLevel = getLevelForXp(playerXp);
                const combatant = buildCombatantFromDex(playerMon.dex, { level: playerLevel });
                const power = combatant.stats.atk + combatant.stats.spa;
                battlePlayerPower.textContent = `${t('player-power')}: ${formatNumber(power || 1)}`;
            } else {
                battlePlayerPower.textContent = `${t('player-power')}: 0`;
            }
        }
        if (playerMon) {
            if (previewPlayerImg) previewPlayerImg.src = playerMon.imageUrl;
            if (previewPlayerName) previewPlayerName.textContent = playerMon.name;
        } else {
            if (previewPlayerImg) previewPlayerImg.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
            if (previewPlayerName) previewPlayerName.textContent = 'Aucun';
        }
        battleRisk.textContent = t('battle-risk-text');
    }

    function generateOpponent() {
        const pokemonData = getPokemonData();
        const ownedMax = Math.max(5, getHighestOwnedDexIndex());
        const minIdx = Math.max(0, ownedMax - 5);
        const maxIdx = Math.min(pokemonData.length - 1, ownedMax + 5);
        const chosen = pokemonData[Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx];
        const basePower = getMoneyPerSecond() || 10;
        const variance = (Math.random() * 0.5 + 0.75);
        const difficulty = Math.pow(1.12, battlesFought) * (1 + (getCurrentGeneration() - 1) * 0.5);
        const power = Math.max(15, basePower * variance * difficulty);
        return { ...chosen, power };
    }

    function renderBattlePokemon() {
        if (!battlePokemonIdSlot) return;
        battlePokemonIdSlot.innerHTML = '';
        if (!battlePokemonId) {
            battlePokemonIdSlot.innerHTML = '<span>Choisissez un Pokémon pour le combat.</span>';
            if (battlePokemonXpContainer) battlePokemonXpContainer.style.display = 'none';
            return;
        }
        const pokemon = getPokemonData().find(p => p.id === battlePokemonId);
        if (!pokemon) return;

        const xp = getPokemonXPForId(battlePokemonId);
        const level = getLevelForXp(xp);
        const currentLevelXp = getCurrentXpForLevel(xp);
        const xpForNext = getXpToLevelUp(level);

        const pokemonElement = document.createElement('div');
        pokemonElement.className = 'pokemon-instance favorite';
        if (isShinyPokemon(battlePokemonId)) {
            pokemonElement.classList.add('shiny');
        }
        const localizedName = getLocalizedPokemonName(pokemon);
        pokemonElement.innerHTML = `
            <img src="${getSpriteUrl(pokemon)}" alt="${localizedName}">
            <span>${localizedName} <small>(Lvl ${level})</small></span>
        `;
        battlePokemonIdSlot.appendChild(pokemonElement);
        if (battlePokemonXpContainer) battlePokemonXpContainer.style.display = 'block';
        if (battlePokemonXpBar) {
            battlePokemonXpBar.value = currentLevelXp;
            battlePokemonXpBar.max = xpForNext;
        }
        if (battlePokemonXpText) {
            battlePokemonXpText.textContent = `${formatNumber(currentLevelXp)} / ${formatNumber(xpForNext)} XP`;
        }
    }

    function setBattlePokemon(pokemonId) {
        const owned = getOwnedPokemon();
        if (!owned[pokemonId]) return;
        battlePokemonId = pokemonId;
        onBattlePokemonSelected();
        closeChangePokemonModal();
        renderBattlePokemon();
    }

    function renderLeagues() {
        const container = document.getElementById('leagues-list');
        if (!container) return;
        container.innerHTML = '';
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
            container.appendChild(pill);
        });
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
        container.appendChild(bossPill);
    }

    function renderGyms() {
        const container = document.getElementById('gyms-list');
        if (!container) return;
        container.innerHTML = '';
        const gen = getCurrentGeneration();
        const leaders = [...(gymLeadersData[gen] || []), ...(eliteFourData[gen] || [])];
        if (!defeatedGyms[gen]) defeatedGyms[gen] = [];
        leaders.forEach((leader, index) => {
            const defeated = defeatedGyms[gen].includes(leader.id);
            const prevDefeated = index === 0 || defeatedGyms[gen].includes(leaders[index - 1]?.id);
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
            container.appendChild(pill);
        });
    }

    async function startLeagueBattle(league, isBoss = false) {
        const entry = league.entry;
        const currentMoney = getMoney();
        if (currentMoney < entry) {
            toast('toast-no-league-money');
            return;
        }
        addMoney(-entry);
        toast('toast-league-start', { name: league.name, difficulty: league.difficulty || 1 });
        await startBattle();
        if (isBoss) battlesFought += 2;
        closeLeaguesModal();
    }

    async function startGymBattle(leader) {
        closeGymsModal();
        currentGymBattle = { leader, teamIndex: 0 };
        const foePokemon = leader.team[0];
        const foe = buildCombatantFromDex(foePokemon.dex, { level: foePokemon.level });
        logBattle(`Vous défiez ${leader.name} !`, '#f3d947');
        await startBattle(foe);
    }

    function clearBattleCooldown() {
        nextBattleAllowedAt = 0;
    }

    function getDefeatedGymsCount(gen) {
        return (defeatedGyms[gen] || []).length;
    }

    function resetBattleProgress() {
        battlePokemonId = null;
        defeatedGyms = {};
        battlesFought = 0;
        currentGymBattle = null;
        battleState = null;
        currentOpponent = null;
        nextBattleAllowedAt = 0;
        renderBattlePokemon();
    }

    function getStateForSave() {
        return {
            battlePokemonId,
            defeatedGyms,
            battlesFought
        };
    }

    function loadState(saved = {}) {
        battlePokemonId = saved.battlePokemonId || null;
        defeatedGyms = saved.defeatedGyms || {};
        battlesFought = saved.battlesFought || 0;
    }

    return {
        startBattle,
        renderBattlePokemon,
        refreshBattlePreview,
        setBattlePokemon,
        renderGyms,
        renderLeagues,
        startGymBattle,
        startLeagueBattle,
        getBattlePokemonId: () => battlePokemonId,
        getDefeatedGymsCount,
        resetBattleProgress,
        getStateForSave,
        loadState,
        clearBattleCooldown,
        generateBattlePreview
    };
}
