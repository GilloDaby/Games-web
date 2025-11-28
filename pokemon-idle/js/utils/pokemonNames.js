import { kantoPokemonNames } from '../features/gameData.js';

const POKEAPI_SPECIES_BASE = 'https://pokeapi.co/api/v2/pokemon-species/';
const nameCache = {};
let onNameUpdate = () => {};

export function setNameUpdateCallback(callback) {
    onNameUpdate = typeof callback === 'function' ? callback : () => {};
}

export function primeKantoNames(lang = 'en') {
    if (!kantoPokemonNames.length) return;
    if (!nameCache[lang]) nameCache[lang] = {};
    kantoPokemonNames.forEach((name, index) => {
        const dex = index + 1;
        if (!nameCache[lang][dex]) {
            nameCache[lang][dex] = name;
        }
    });
}

function sanitizeDex(dex) {
    if (typeof dex === 'string') {
        return Number(dex.replace('dex-', '')) || null;
    }
    return typeof dex === 'number' ? dex : null;
}

export function ensureName(dex, lang = 'en') {
    const pokemonDex = sanitizeDex(dex);
    if (!pokemonDex) return '';
    if (!nameCache[lang]) nameCache[lang] = {};
    if (nameCache[lang][pokemonDex]) {
        return nameCache[lang][pokemonDex];
    }
    const fallback = (nameCache['en'] && nameCache['en'][pokemonDex]) ? nameCache['en'][pokemonDex] : `Pokemon #${pokemonDex}`;
    nameCache[lang][pokemonDex] = fallback;

    fetch(`${POKEAPI_SPECIES_BASE}${pokemonDex}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.names) {
                const localized = data.names.find(n => n.language.name === lang)?.name
                    || data.names.find(n => n.language.name === 'en')?.name
                    || data.name;
                if (localized) {
                    nameCache[lang][pokemonDex] = localized.charAt(0).toUpperCase() + localized.slice(1);
                    onNameUpdate();
                }
            }
        })
        .catch(() => {});

    return fallback;
}

export function getLocalizedPokemonName(pokemon, lang = 'en') {
    if (!pokemon) return '';
    const dex = pokemon.dex || Number(String(pokemon.id || '').replace('dex-', ''));
    if (!dex) {
        return pokemon.name || '';
    }
    return ensureName(dex, lang);
}
