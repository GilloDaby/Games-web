// Represente un joueur (meme si on reste solo pour l'instant).
export default class Player {
  constructor(id, color, spawnPosition, initialPopulation = 10) {
    this.id = id;
    this.color = color;

    // Position du centre-ville sur la grille (cases)
    this.cityCenter = {
      x: spawnPosition.x,
      y: spawnPosition.y,
    };

    // Liste des citoyens
    this.citizens = [];
    this.soldiers = [];

    this.resources = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
    };

    this.population = initialPopulation;
    this.populationCap = 20; // valeur de base, evolutive avec des maisons plus tard
  }
}
