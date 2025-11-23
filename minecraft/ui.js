(() => {
  const SLOT_SIZE = 56;
  const SLOT_GAP = 10;
  const PADDING = 18;
  const BIOME_MARGIN = 12;

  const SLOT_DEFS = [
    { id: 1, key: "grass", label: "Herbe" },
    { id: 2, key: "dirt", label: "Terre" },
    { id: 3, key: "stone", label: "Pierre" },
    { id: 4, key: "torch", label: "Torche" },
  ];

  class HotbarUI {
    constructor(app, tileTextures, inventory, getSelectedTile) {
      this.app = app;
      this.tileTextures = tileTextures;
      this.inventory = inventory;
      this.getSelectedTile = getSelectedTile;
      this.container = new PIXI.Container();
      this.overlay = new PIXI.Container();
      this.slots = [];

      this.buildSlots();
      this.buildOverlay();
      this.onResize();
      app.stage.addChild(this.container);
      app.stage.addChild(this.overlay);
    }

    buildSlots() {
      let x = 0;
      SLOT_DEFS.forEach((def, index) => {
        const slot = this.createSlot(def);
        slot.container.x = x;
        this.container.addChild(slot.container);
        this.slots.push(slot);
        x += SLOT_SIZE + SLOT_GAP;
      });
      // Center pivot
      this.container.pivot.x = (this.slots.length * SLOT_SIZE + (this.slots.length - 1) * SLOT_GAP) / 2;
    }

    createSlot(def) {
      const container = new PIXI.Container();
      const bg = new PIXI.Graphics();
      bg.lineStyle(2, 0x1c1f2a, 1);
      bg.beginFill(0x141722);
      bg.drawRoundedRect(0, 0, SLOT_SIZE, SLOT_SIZE, 6);
      bg.endFill();

      const icon = new PIXI.Sprite(this.tileTextures[def.id]);
      icon.scale.set(1.2);
      icon.anchor.set(0.5);
      icon.position.set(SLOT_SIZE / 2, SLOT_SIZE / 2 - 6);

      const count = new PIXI.Text("0", {
        fontFamily: "Consolas, monospace",
        fontSize: 14,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
      });
      count.anchor.set(0.5);
      count.position.set(SLOT_SIZE / 2, SLOT_SIZE - 14);

      const outline = new PIXI.Graphics();
      outline.lineStyle(3, 0xf4d35e, 1);
      outline.drawRoundedRect(-2, -2, SLOT_SIZE + 4, SLOT_SIZE + 4, 8);
      outline.visible = false;

      container.addChild(bg, icon, count, outline);

      return { def, container, outline, count };
    }

    updateInventory(source) {
      this.inventory = source;
      this.slots.forEach((slot) => {
        let value = 0;
        if (typeof source === "function") value = source(slot.def.key) ?? 0;
        else value = source?.[slot.def.key] ?? 0;
        slot.count.text = value.toString();
      });
    }

    setSelection(tileId) {
      this.slots.forEach((slot) => {
        const active = slot.def.id === tileId;
        slot.outline.visible = active;
        slot.container.scale.set(active ? 1.1 : 1);
      });
    }

    tick() {
      // reserved for small UI animations if needed
    }

    onResize() {
      const width = this.app.renderer.width;
      const height = this.app.renderer.height;
      this.container.x = width / 2;
      this.container.y = height - SLOT_SIZE - PADDING;
      this.overlay.x = BIOME_MARGIN;
      this.overlay.y = BIOME_MARGIN;
    }

    buildOverlay() {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0c0e16, 0.65);
      bg.drawRoundedRect(0, 0, 160, 62, 6);
      bg.endFill();
      bg.lineStyle(1, 0xffffff, 0.25);
      bg.drawRoundedRect(0, 0, 160, 62, 6);

      this.biomeText = new PIXI.Text("Biome: ?", {
        fontFamily: "Consolas, monospace",
        fontSize: 14,
        fill: "#ffffff",
      });
      this.biomeText.position.set(10, 8);

      this.healthLabel = new PIXI.Text("HP", {
        fontFamily: "Consolas, monospace",
        fontSize: 12,
        fill: "#ffffff",
      });
      this.healthLabel.position.set(10, 34);

      this.healthBarBg = new PIXI.Graphics();
      this.healthBarBg.beginFill(0x2d3145);
      this.healthBarBg.drawRoundedRect(32, 32, 112, 14, 4);
      this.healthBarBg.endFill();

      this.healthBar = new PIXI.Graphics();
      this.healthBar.beginFill(0xe74c3c);
      this.healthBar.drawRoundedRect(32, 32, 112, 14, 4);
      this.healthBar.endFill();

      this.overlay.addChild(bg, this.biomeText, this.healthBarBg, this.healthBar, this.healthLabel);
    }

    setBiome(name) {
      const label = name ? name.charAt(0).toUpperCase() + name.slice(1) : "?";
      this.biomeText.text = `Biome: ${label}`;
    }

    setHealth(current, max) {
      const ratio = Math.max(0, Math.min(1, current / max));
      this.healthBar.width = 112 * ratio;
    }
  }

  window.createHotbarUI = function createHotbarUI(app, tileTextures, inventory, getSelectedTile) {
    return new HotbarUI(app, tileTextures, inventory, getSelectedTile);
  };
})();
