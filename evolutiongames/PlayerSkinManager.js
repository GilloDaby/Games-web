import PlayerSkin from "./PlayerSkin.js";

const DEFAULT_SKIN_FILES = ["Male 01-1.png", "Male 01-2.png", "Male 02-1.png", "Male 02-2.png"];

export default class PlayerSkinManager {
  constructor({ basePath = "img/player/", manifest = "skins.json" } = {}) {
    this.basePath = basePath.endsWith("/") ? basePath : `${basePath}/`;
    this.manifest = manifest;
    this.skins = [];
    this.ready = this.loadAll();
  }

  async loadAll() {
    const files = await this.fetchSkinList();
    const loaded = await Promise.all(files.map((file) => this.loadSkin(file)));
    this.skins = loaded.filter(Boolean);
  }

  async fetchSkinList() {
    try {
      const response = await fetch(`${this.basePath}${this.manifest}`, { cache: "no-cache" });
      if (response.ok) {
        const files = await response.json();
        if (Array.isArray(files) && files.length > 0) {
          return files;
        }
      }
    } catch (error) {
      console.warn("Impossible de récupérer skins.json, utilisation de la liste par défaut.", error);
    }
    return DEFAULT_SKIN_FILES;
  }

  loadSkin(fileName) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(new PlayerSkin(fileName, img));
      img.onerror = () => {
        console.warn(`Échec du chargement du skin ${fileName}`);
        resolve(null);
      };
      img.src = `${this.basePath}${fileName}`;
    });
  }

  getRandomSkin() {
    if (!this.skins.length) {
      return null;
    }
    const index = Math.floor(Math.random() * this.skins.length);
    return this.skins[index];
  }

  drawSkin(ctx, skin, x, y, directionIndex, animTimeSeconds, radius) {
    if (!skin) {
      return;
    }
    skin.draw(ctx, x, y, directionIndex, animTimeSeconds, radius);
  }
}
