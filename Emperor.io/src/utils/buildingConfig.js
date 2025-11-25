// Types de batiments disponibles.
export const BUILD_TYPES = {
  HOUSE: "house",
  BARRACKS: "barracks",
  FARM: "farm",
  STOREHOUSE: "storehouse",
};

// Configurations des batiments (temps de construction en secondes, couleur d'affichage, bonus).
export const BUILD_CONFIG = {
  [BUILD_TYPES.HOUSE]: {
    buildTime: 6,
    color: "#8ecae6",
    populationBonus: 5,
    cost: { wood: 60, stone: 20, food: 0, gold: 0 },
  },
  [BUILD_TYPES.BARRACKS]: {
    buildTime: 8,
    color: "#ffb703",
    populationBonus: 0, // effets a venir (entrainement de soldats)
    cost: { wood: 80, stone: 60, food: 30, gold: 0 },
  },
  [BUILD_TYPES.FARM]: {
    buildTime: 7,
    color: "#6abf69",
    populationBonus: 0,
    passiveFood: 1.2, // nourriture par seconde
    cost: { wood: 50, stone: 10, food: 30, gold: 0 },
  },
  [BUILD_TYPES.STOREHOUSE]: {
    buildTime: 9,
    color: "#c084fc",
    populationBonus: 4, // petite hausse de cap pop
    gatherBonus: 0.15, // multiplicateur de recolte
    cost: { wood: 90, stone: 70, food: 20, gold: 0 },
  },
};

// Vitesse de construction par citoyen (unites de progression par seconde).
export const BUILD_RATE = 1.5;
