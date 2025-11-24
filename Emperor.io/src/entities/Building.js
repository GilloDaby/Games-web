import { BUILD_CONFIG } from "../utils/buildingConfig.js";

// Represente un batiment place sur la grille.
export default class Building {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.buildProgress = 0;
    this.completed = false;
    this.config = BUILD_CONFIG[type];
    this.buildTime = this.config?.buildTime ?? 6;
  }

  // Ajoute de la progression de construction. Retourne true si vient d'etre complet.
  addProgress(amount) {
    if (this.completed) return false;
    this.buildProgress += amount;
    if (this.buildProgress >= this.buildTime) {
      this.completed = true;
      return true;
    }
    return false;
  }

  progressRatio() {
    return Math.min(1, this.buildProgress / this.buildTime);
  }

  color() {
    return this.config?.color || "#9ca3af";
  }
}
