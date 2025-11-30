import { calcStat } from '../utils/math.js';

const POKEAPI_CSV_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const TYPE_ID_MAP = {
    1: 'normal', 2: 'fighting', 3: 'flying', 4: 'poison', 5: 'ground',
    6: 'rock', 7: 'bug', 8: 'ghost', 9: 'steel', 10: 'fire', 11: 'water',
    12: 'grass', 13: 'electric', 14: 'psychic', 15: 'ice', 16: 'dragon',
    17: 'dark', 18: 'fairy'
};

const BATTLE_LEVEL_BASE = 30;
const movesById = {};
const pokemonTypesMap = {};
const typeChart = {};
const baseStatsByPokemon = {};
const learnsetByPokemon = {};
let battleDataLoaded = false;

async function fetchCsv(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CSV fetch failed: ${url}`);
    const text = await res.text();
    return text.split('\n').map(l => l.trim()).filter(Boolean);
}

function parseCsvRow(line) {
    return line.split(',');
}

export async function loadBattleData() {
    if (battleDataLoaded) return;
    const [movesCsv, typesCsv, efficacyCsv, pokemonTypesCsv, pokemonStatsCsv, pokemonMovesCsv] = await Promise.all([
        fetchCsv(`${POKEAPI_CSV_BASE}/moves.csv`),
        fetchCsv(`${POKEAPI_CSV_BASE}/types.csv`),
        fetchCsv(`${POKEAPI_CSV_BASE}/type_efficacy.csv`),
        fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_types.csv`),
        fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_stats.csv`),
        fetchCsv(`${POKEAPI_CSV_BASE}/pokemon_moves.csv`)
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
            damageClass: damageClassId === 3 ? 'special' : damageClassId === 2 ? 'physical' : 'status'
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

export function pickMovesForPokemon(pokemonId) {
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

export function buildCombatantFromDex(dex, options = {}) {
    const {
        pokemonData = [],
        localizePokemonName = (p) => p?.name || `Pokemon #${dex}`,
        currentLanguage = () => 'en',
        levelBoost = 0,
        level: directLevel = 0
    } = options;
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
    const localizedName = pokemon ? localizePokemonName(pokemon, currentLanguage()) : `Pokemon #${pokemonId}`;
    return {
        id: pokemonId,
        name: localizedName,
        sprite: pokemon ? pokemon.imageUrl : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
        types,
        level,
        stats,
        currentHp: stats.hp,
        moves: pickMovesForPokemon(pokemonId)
    };
}

export function typeEffectiveness(moveType, defenderTypes) {
    let mult = 1;
    defenderTypes.forEach(t => {
        const eff = (typeChart[moveType] && typeChart[moveType][t]) || 1;
        mult *= eff;
    });
    return mult;
}

export function computeDamage(attacker, defender, move) {
    if (!move || move.damageClass === 'status' || !move.power) return 0;
    const atk = move.damageClass === 'special' ? attacker.stats.spa : attacker.stats.atk;
    const def = move.damageClass === 'special' ? defender.stats.spd : defender.stats.def;
    const base = (((2 * attacker.level / 5 + 2) * move.power * (atk / Math.max(1, def))) / 50) + 2;
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const eff = typeEffectiveness(move.type, defender.types);
    const rand = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.floor(base * stab * eff * rand));
}

export function chooseBestMove(attacker, target) {
    if (!attacker || !attacker.moves || !attacker.moves.length) return null;
    let bestMove = null;
    let bestValue = -Infinity;
    attacker.moves.forEach(move => {
        const dmg = computeDamage(attacker, target, move);
        if (dmg > bestValue) {
            bestValue = dmg;
            bestMove = move;
        }
    });
    return bestMove;
}
