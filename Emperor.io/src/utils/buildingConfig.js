// Types de batiments disponibles.
export const BUILD_TYPES = {
  HOUSE: "house",
  BARRACKS: "barracks",
};

// Configurations des batiments (temps de construction en secondes, couleur d'affichage, bonus).
export const BUILD_CONFIG = {
  [BUILD_TYPES.HOUSE]: {
    buildTime: 6,
    color: "#8ecae6",
    populationBonus: 5,
  },
  [BUILD_TYPES.BARRACKS]: {
    buildTime: 8,
    color: "#ffb703",
    populationBonus: 0, // effets a venir (entrainement de soldats)
  },
};

// Vitesse de construction par citoyen (unités de progression par seconde).
export const BUILD_RATE = 1.5;
