export const PROFESSIONS = {
  GUERRIER: {
    name: "Guerrier",
    description: "Damage +20%, HP +10%, Attack Cooldown -10%.",
    apply: (creature) => {
      creature.damage *= 1.2;
      creature.maxHp *= 1.1;
      creature.attackCooldown *= 0.9;
    },
  },
  TANK: {
    name: "Tank",
    description: "HP +40%, Damage -20%, Speed -10%.",
    apply: (creature) => {
      creature.maxHp *= 1.4;
      creature.damage *= 0.8;
      creature.speed *= 0.9;
    },
  },
  EXPLORATEUR: {
    name: "Explorateur",
    description: "Speed +15%, Vision Range +10%, Energy Max +10%.",
    apply: (creature) => {
      creature.speed *= 1.15;
      creature.genome.visionRange *= 1.1;
      creature.energyMax *= 1.1;
    },
  },
  MINEUR: {
    name: "Mineur",
    description: "+30% resources from stone and crystal nodes.",
    resourceBonus: {
      stone: 1.3,
      crystal: 1.3,
    },
  },
  BUCHERON: {
    name: "Bûcheron",
    description: "+30% resources from wood nodes.",
    resourceBonus: {
      wood: 1.3,
    },
  },
  FERMIER: {
    name: "Fermier",
    description: "+30% resources from food nodes.",
    resourceBonus: {
      food: 1.3,
    },
  },
  CHASSEUR: {
    name: "Chasseur",
    description: "+25% damage against Animals and Bosses.",
    // This will be applied in the tryAttack method
  },
  CONSTRUCTEUR: {
    name: "Constructeur",
    description: "Structure costs -15%, Build Cooldown -20%.",
    // This will be applied in tryCraftStructure
  },
  MEDECIN: {
    name: "Médecin",
    description: "Has a small healing aura for allies.",
    // This will be applied in the update method
  },
  ERUDIT: {
    name: "Érudit",
    description: "zoneLearningTime effectiveness +25%.",
    // This will be applied in processZoneImpact
  },
};

export const PROFESSION_LIST = Object.values(PROFESSIONS);
