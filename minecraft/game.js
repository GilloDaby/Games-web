(() => {
  const canvas = document.getElementById("game-canvas");

  const app = new PIXI.Application({
    view: canvas,
    resizeTo: window,
    background: "#1b1f2f",
    antialias: false,
  });

  const blockTextureUrl = createBlockTextureDataURL();

  init().catch((err) => console.error("Erreur d'initialisation", err));

  async function init() {
    const texture = await PIXI.Assets.load(blockTextureUrl);
    const block = new PIXI.Sprite(texture);
    block.anchor.set(0.5);
    block.scale.set(4); // agrandir le bloc pour qu'il soit bien visible
    centerOnScreen(block);
    app.stage.addChild(block);

    window.addEventListener("resize", () => centerOnScreen(block));
  }

  function centerOnScreen(displayObject) {
    displayObject.position.set(app.screen.width / 2, app.screen.height / 2);
  }

  function createBlockTextureDataURL() {
    const size = 32;
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const ctx = tile.getContext("2d");

    // Couche herbe
    ctx.fillStyle = "#6faa3d";
    ctx.fillRect(0, 0, size, 10);
    ctx.fillStyle = "#5c8e33";
    for (let x = 0; x < size; x += 4) {
      ctx.fillRect(x, 6, 2, 4);
    }

    // Terre
    ctx.fillStyle = "#8a5a2d";
    ctx.fillRect(0, 10, size, size - 10);
    ctx.fillStyle = "#7b5129";
    for (let y = 12; y < size; y += 6) {
      for (let x = (y % 8); x < size; x += 8) {
        ctx.fillRect(x, y, 3, 3);
      }
    }

    // Petites pierres
    ctx.fillStyle = "#b07b44";
    for (let i = 0; i < 6; i++) {
      const x = 2 + (i * 5) % 28;
      const y = 14 + ((i * 7) % 16);
      ctx.fillRect(x, y, 2, 2);
    }

    return tile.toDataURL("image/png");
  }
})();
