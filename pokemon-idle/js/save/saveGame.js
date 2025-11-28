export function persistGameState(payload) {
    try {
        localStorage.setItem('pokemonIdleSave', JSON.stringify(payload));
    } catch (error) {
        console.error('Failed to persist save data', error);
    }
}

export function readGameState() {
    try {
        const savedState = localStorage.getItem('pokemonIdleSave');
        if (!savedState) return null;
        return JSON.parse(savedState);
    } catch (error) {
        console.error('Failed to parse saved game', error);
        return null;
    }
}
