// Configuration centralisee : stats, couts, regles. Ajustable sans toucher au code.
const gameConfig = {
  rules: {
    baseHp: 220,
    enemyCityHp: 250,
  },
  costs: {
    house: { wood: 50, stone: 20, food: 0, gold: 0 },
    barracks: { wood: 80, stone: 60, food: 0, gold: 0 },
    soldier: { food: 30, gold: 10 },
  },
  units: {
    citizen: { speed: 6 },
    soldier: {
      speed: 8,
      hp: 50,
      attackRange: 1.2,
      damagePerShot: 10,
      fireRate: 1.0,
    },
  },
  ai: {
    easy: { attackInterval: 26, soldiersPerWave: 2 },
    normal: { attackInterval: 22, soldiersPerWave: 3 },
    hard: { attackInterval: 16, soldiersPerWave: 5 },
  },
};

export default gameConfig;
