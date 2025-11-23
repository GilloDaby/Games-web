(() => {
  const SLOT_SIZE = 56;
  const SLOT_GAP = 10;
  const PADDING = 18;

  const SLOT_DEFS = [
    { id: 1, key: "grass", label: "Herbe" },
    { id: 2, key: "dirt", label: "Terre" },
    { id: 3, key: "stone", label: "Pierre" },
  ];

  class HotbarUI {
    constructor(app, tileTextures, inventory, getSelectedTile) {
      this.app = app;
      this.tileTextures = tileTextures;
      this.inventory = inventory;
      this.getSelectedTile = getSelectedTile;
      this.container = new PIXI.Container();
      this.slots = [];

      this.buildSlots();
      this.onResize();
      app.stage.addChild(this.container);
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

    updateInventory(inventory) {
      this.inventory = inventory;
      this.slots.forEach((slot) => {
        const value = inventory[slot.def.key] ?? 0;
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
    }
  }

  window.createHotbarUI = function createHotbarUI(app, tileTextures, inventory, getSelectedTile) {
    return new HotbarUI(app, tileTextures, inventory, getSelectedTile);
  };
})();
