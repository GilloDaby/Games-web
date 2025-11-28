export function formatNumber(value) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    let idx = 0;
    let val = value;
    while (val >= 1000 && idx < suffixes.length - 1) {
        val /= 1000;
        idx++;
    }
    return `${val % 1 === 0 ? val : val.toFixed(1)}${suffixes[idx]}`;
}

export function getXpToLevelUp(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1));
}

export function getLevelForXp(xp) {
    let level = 1;
    let required = getXpToLevelUp(level);
    while (xp >= required) {
        xp -= required;
        level++;
        required = getXpToLevelUp(level);
    }
    return level;
}

export function getCurrentXpForLevel(xp) {
    let level = 1;
    let required = getXpToLevelUp(level);
    while (xp >= required) {
        xp -= required;
        level++;
        required = getXpToLevelUp(level);
    }
    return xp;
}

export function calcStat(base, level, isHp = false) {
    if (!base) base = 50;
    return isHp
        ? Math.floor(((base * 2 * level) / 100) + level + 10)
        : Math.floor(((base * 2 * level) / 100) + 5);
}
