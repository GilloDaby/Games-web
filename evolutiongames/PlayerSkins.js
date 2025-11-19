const DEFAULT_SKINS = [
  "img/player/skin-blue.png",
  "img/player/skin-green.png",
  "img/player/skin-orange.png",
  "img/player/skin-purple.png",
];

export default class PlayerSkinManager {
  constructor(skinPaths = DEFAULT_SKINS) {
    this.images = [];
    this.loadSkins(skinPaths);
  }

  loadSkins(paths) {
    this.images = paths.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  /**
   * Retourne un skin aléatoire (objet Image) ou null si rien n'est dispo.
   */
  getRandomSkin() {
    if (!this.images.length) {
      return null;
    }
    const index = Math.floor(Math.random() * this.images.length);
    return this.images[index];
  }
}
