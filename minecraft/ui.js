(() => {
  const SLOT_SIZE = 56;
  const SLOT_GAP = 10;
  const PADDING = 18;
  const BIOME_MARGIN = 12;

  class HotbarUI {
    constructor(app, inventoryManager, tileTextures, itemToTile) {
      this.app = app;
      this.inventoryManager = inventoryManager;
      this.tileTextures = tileTextures;
      this.itemToTile = itemToTile;
      this.container = new PIXI.Container();
      this.overlay = new PIXI.Container();
      this.slots = [];
      this.selectedIndex = 0;
      this.slotDefs = Array.from({ length: inventoryManager.size }, (_, i) => ({ id: i }));
      this.iconCache = new Map();
      this.buildSlots();
      this.buildOverlay();
      this.onResize();
      app.stage.addChild(this.container);
      app.stage.addChild(this.overlay);
    }

    buildSlots() {
      let x = 0;
      this.slotDefs.forEach((def, index) => {
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

      const icon = new PIXI.Sprite();
      icon.scale.set(1.1);
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

      return { def, container, outline, count, icon };
    }

    updateInventory() {
      this.slots.forEach((slot, idx) => {
        const data = this.inventoryManager.slots[idx];
        if (data.itemId) {
          const tex = this.getIcon(data.itemId);
          slot.icon.texture = tex;
          slot.icon.visible = true;
          slot.count.text = data.count > 1 ? data.count : "";
        } else {
          slot.icon.visible = false;
          slot.count.text = "";
        }
        const active = idx === this.selectedIndex;
        slot.outline.visible = active;
        slot.container.scale.set(active ? 1.1 : 1);
      });
    }

    setSelectionIndex(idx) {
      this.selectedIndex = idx;
      this.updateInventory();
    }

    getIcon(itemId) {
      if (this.iconCache.has(itemId)) return this.iconCache.get(itemId);
      const def = window.ITEM_DEFS[itemId];
      const custom = window.getItemIconTexture ? window.getItemIconTexture(this.app, itemId) : null;
      if (custom) {
        this.iconCache.set(itemId, custom);
        return custom;
      }
      const tileId = this.itemToTile ? this.itemToTile(itemId) : null;
      if (tileId != null && this.tileTextures?.[tileId]) {
        this.iconCache.set(itemId, this.tileTextures[tileId]);
        return this.tileTextures[tileId];
      }
      const g = new PIXI.Graphics();
      g.beginFill(def?.color ?? 0xffffff);
      g.drawRoundedRect(0, 0, 40, 40, 6);
      g.endFill();
      const tex = this.app.renderer.generateTexture(g);
      this.iconCache.set(itemId, tex);
      return tex;
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

      this.hungerLabel = new PIXI.Text("Food", {
        fontFamily: "Consolas, monospace",
        fontSize: 12,
        fill: "#ffffff",
      });
      this.hungerLabel.position.set(10, 54);

      this.hungerBarBg = new PIXI.Graphics();
      this.hungerBarBg.beginFill(0x2d3145);
      this.hungerBarBg.drawRoundedRect(52, 52, 92, 12, 4);
      this.hungerBarBg.endFill();

      this.hungerBar = new PIXI.Graphics();
      this.hungerBar.beginFill(0xf1c40f);
      this.hungerBar.drawRoundedRect(52, 52, 92, 12, 4);
      this.hungerBar.endFill();

      this.overlay.addChild(
        bg,
        this.biomeText,
        this.healthBarBg,
        this.healthBar,
        this.healthLabel,
        this.hungerBarBg,
        this.hungerBar,
        this.hungerLabel
      );
    }

    setBiome(name) {
      const label = name ? name.charAt(0).toUpperCase() + name.slice(1) : "?";
      this.biomeText.text = `Biome: ${label}`;
    }

    setHealth(current, max) {
      const ratio = Math.max(0, Math.min(1, current / max));
      this.healthBar.width = 112 * ratio;
    }

    setHunger(current, max) {
      const ratio = Math.max(0, Math.min(1, current / max));
      this.hungerBar.width = 92 * ratio;
    }
  }

  window.createHotbarUI = function createHotbarUI(app, tileTextures, inventoryManager, itemToTile) {
    return new HotbarUI(app, inventoryManager, tileTextures, itemToTile);
  };
})();
