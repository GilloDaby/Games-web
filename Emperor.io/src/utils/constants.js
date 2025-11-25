// Constantes de base pour la carte et les types de cases.
export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 100;

export const TILE_TYPES = {
  EMPTY: "empty",
  WOOD: "wood",
  STONE: "stone",
  FOOD: "food",
};

// Biomes : probabilites locales pour generer des nappes coherentes.
export const BIOMES = [
  {
    key: "forest",
    tint: "#12301f",
    probabilities: [
      { type: TILE_TYPES.WOOD, chance: 0.35 },
      { type: TILE_TYPES.STONE, chance: 0.08 },
      { type: TILE_TYPES.FOOD, chance: 0.08 },
    ],
  },
  {
    key: "mountain",
    tint: "#2c313b",
    probabilities: [
      { type: TILE_TYPES.STONE, chance: 0.32 },
      { type: TILE_TYPES.WOOD, chance: 0.05 },
      { type: TILE_TYPES.FOOD, chance: 0.03 },
    ],
  },
  {
    key: "plains",
    tint: "#2f3c1f",
    probabilities: [
      { type: TILE_TYPES.FOOD, chance: 0.24 },
      { type: TILE_TYPES.WOOD, chance: 0.12 },
      { type: TILE_TYPES.STONE, chance: 0.06 },
    ],
  },
  {
    key: "lake",
    tint: "#0b1e33",
    probabilities: [
      { type: TILE_TYPES.EMPTY, chance: 0 }, // eau -> vide (non exploitable) dans notre rendu actuel
    ],
  },
];

// Palette pour le rendu de la grille.
export const TILE_COLORS = {
  [TILE_TYPES.EMPTY]: "#0f1b2b",
  [TILE_TYPES.WOOD]: "#2e8b57",  // foret (bois)
  [TILE_TYPES.STONE]: "#6c7a89", // pierre
  [TILE_TYPES.FOOD]: "#c9a227",  // champs/nourriture
};

// Probabilites de generation pour chaque ressource (somme <= 1, le reste est vide).
export const TILE_PROBABILITIES = [
  { type: TILE_TYPES.WOOD, chance: 0.28 },
  { type: TILE_TYPES.STONE, chance: 0.18 },
  { type: TILE_TYPES.FOOD, chance: 0.22 },
];

// Temps de recolte (secondes) par ressource.
export const GATHER_TIME = {
  [TILE_TYPES.WOOD]: 2,
  [TILE_TYPES.STONE]: 3,
  [TILE_TYPES.FOOD]: 2,
};

// Quantite rapportee par cycle de recolte.
export const GATHER_YIELD = {
  [TILE_TYPES.WOOD]: 8,
  [TILE_TYPES.STONE]: 6,
  [TILE_TYPES.FOOD]: 10,
};

// Quantite totale par spot (deplete -> vide).
export const RESOURCE_CAPACITY = {
  [TILE_TYPES.WOOD]: 180,
  [TILE_TYPES.STONE]: 180,
  [TILE_TYPES.FOOD]: 180,
};
