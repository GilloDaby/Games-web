(() => {
  const ITEM_DEFS = {
    grass: { id: "grass", name: "Herbe", color: 0x6faa3d, stack: 64 },
    log: { id: "log", name: "Bois", color: 0x8b5a2b, stack: 64 },
    plank: { id: "plank", name: "Planche", color: 0xcfa36a, stack: 64 },
    stick: { id: "stick", name: "Baton", color: 0xded6c4, stack: 64 },
    stone: { id: "stone", name: "Pierre", color: 0x9da3ad, stack: 64 },
    dirt: { id: "dirt", name: "Terre", color: 0x8a5a2d, stack: 64 },
    sand: { id: "sand", name: "Sable", color: 0xd5c17a, stack: 64 },
    snow: { id: "snow", name: "Neige", color: 0xf5f7fb, stack: 64 },
    leaf: { id: "leaf", name: "Feuille", color: 0x4d8a3b, stack: 64 },
    cactus: { id: "cactus", name: "Cactus", color: 0x1f8a5c, stack: 64 },
    torch: { id: "torch", name: "Torche", color: 0xf9d976, stack: 64 },
    stone_pickaxe: { id: "stone_pickaxe", name: "Pioche", color: 0x888888, stack: 1 },
    berry: { id: "berry", name: "Baie", color: 0xc23b3b, stack: 32 },
    meat: { id: "meat", name: "Viande", color: 0xcc6b5c, stack: 32 },
    pork: { id: "pork", name: "Porc", color: 0xd8957a, stack: 32 },
    wool: { id: "wool", name: "Laine", color: 0xe4e4e4, stack: 64 },
    feather: { id: "feather", name: "Plume", color: 0xf8f5ef, stack: 64 },
    chicken_meat: { id: "chicken_meat", name: "Poulet", color: 0xf2c7a5, stack: 32 },
  };

  class InventoryManager {
    constructor(size = 9) {
      this.size = size;
      this.slots = Array.from({ length: size }, () => ({ itemId: null, count: 0 }));
    }

    addItem(itemId, count = 1) {
      const def = ITEM_DEFS[itemId];
      if (!def) return count;
      let remaining = count;
      // Fill existing stacks
      for (const slot of this.slots) {
        if (remaining <= 0) break;
        if (slot.itemId === itemId && slot.count < def.stack) {
          const space = def.stack - slot.count;
          const add = Math.min(space, remaining);
          slot.count += add;
          remaining -= add;
        }
      }
      // Fill empty slots
      for (const slot of this.slots) {
        if (remaining <= 0) break;
        if (!slot.itemId) {
          const add = Math.min(def.stack, remaining);
          slot.itemId = itemId;
          slot.count = add;
          remaining -= add;
        }
      }
      return remaining;
    }

    removeItem(itemId, count = 1) {
      let remaining = count;
      for (const slot of this.slots) {
        if (slot.itemId !== itemId) continue;
        const used = Math.min(slot.count, remaining);
        slot.count -= used;
        remaining -= used;
        if (slot.count <= 0) {
          slot.itemId = null;
          slot.count = 0;
        }
        if (remaining <= 0) break;
      }
      return remaining === 0;
    }

    getCount(itemId) {
      return this.slots.reduce((sum, s) => (s.itemId === itemId ? sum + s.count : sum), 0);
    }

    moveStack(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      const a = this.slots[fromIndex];
      const b = this.slots[toIndex];
      if (!a.itemId) return;
      if (!b.itemId) {
        this.slots[toIndex] = { itemId: a.itemId, count: a.count };
        this.slots[fromIndex] = { itemId: null, count: 0 };
        return;
      }
      if (a.itemId === b.itemId) {
        const def = ITEM_DEFS[a.itemId];
        const space = def.stack - b.count;
        const moved = Math.min(space, a.count);
        b.count += moved;
        a.count -= moved;
        if (a.count <= 0) {
          this.slots[fromIndex] = { itemId: null, count: 0 };
        }
      } else {
        const temp = { itemId: a.itemId, count: a.count };
        this.slots[fromIndex] = { itemId: b.itemId, count: b.count };
        this.slots[toIndex] = temp;
      }
    }

    getState() {
      return this.slots.map((s) => ({ itemId: s.itemId, count: s.count }));
    }

    setState(data) {
      if (!Array.isArray(data)) return;
      this.slots = Array.from({ length: this.size }, (_, i) => {
        const src = data[i] || { itemId: null, count: 0 };
        if (!src || !ITEM_DEFS[src.itemId]) return { itemId: null, count: 0 };
        const def = ITEM_DEFS[src.itemId];
        const count = Math.max(0, Math.min(def.stack, src.count || 0));
        if (count === 0) return { itemId: null, count: 0 };
        return { itemId: src.itemId, count };
      });
    }
  }

  class InventoryUI {
    constructor(app, manager, tileTextures, itemToTile) {
      this.app = app;
      this.manager = manager;
      this.tileTextures = tileTextures;
      this.itemToTile = itemToTile;
      this.container = new PIXI.Container();
      this.slotSize = 52;
      this.gap = 8;
      this.slots = [];
      this.iconCache = new Map();
      this.dragFrom = null;
      this.container.eventMode = "static";
      this.container.hitArea = new PIXI.Rectangle(0, 0, this.slotSize * this.manager.size + this.gap * (this.manager.size - 1), this.slotSize);
      this.buildSlots();
      this.onResize();
    }

    buildSlots() {
      for (let i = 0; i < this.manager.size; i++) {
        const slot = this.createSlot(i);
        slot.container.x = i * (this.slotSize + this.gap);
        this.container.addChild(slot.container);
        this.slots.push(slot);
      }
      this.container.pivot.x = (this.manager.size * this.slotSize + (this.manager.size - 1) * this.gap) / 2;
    }

    createSlot(index) {
      const container = new PIXI.Container();
      container.eventMode = "static";
      const bg = new PIXI.Graphics();
      bg.lineStyle(2, 0x1c1f2a, 1);
      bg.beginFill(0x141722);
      bg.drawRoundedRect(0, 0, this.slotSize, this.slotSize, 6);
      bg.endFill();
      container.addChild(bg);

      const icon = new PIXI.Sprite();
      icon.anchor.set(0.5);
      icon.position.set(this.slotSize / 2, this.slotSize / 2 - 4);
      container.addChild(icon);

      const count = new PIXI.Text("", {
        fontFamily: "Consolas, monospace",
        fontSize: 14,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      });
      count.anchor.set(1, 1);
      count.position.set(this.slotSize - 6, this.slotSize - 6);
      container.addChild(count);

      container.cursor = "pointer";
      container.on("pointerdown", (e) => {
        e.stopPropagation();
        this.dragFrom = index;
      });
      container.on("pointerup", (e) => {
        e.stopPropagation();
        this.handleDrop(index);
      });
      container.on("pointerupoutside", () => {
        this.dragFrom = null;
      });

      return { container, icon, count };
    }

    refresh() {
      for (let i = 0; i < this.manager.size; i++) {
        const slot = this.manager.slots[i];
        const view = this.slots[i];
        if (slot.itemId) {
          const icon = this.getIcon(slot.itemId);
          view.icon.texture = icon;
          view.icon.visible = true;
          view.count.text = slot.count > 1 ? slot.count : "";
        } else {
          view.icon.visible = false;
          view.count.text = "";
        }
      }
    }

    handleDrop(index) {
      if (this.dragFrom == null) return;
      if (this.dragFrom !== index) {
        this.manager.moveStack(this.dragFrom, index);
      }
      this.dragFrom = null;
      this.refresh();
    }

    getIcon(itemId) {
      if (this.iconCache.has(itemId)) return this.iconCache.get(itemId);
      const def = ITEM_DEFS[itemId];
      // custom item icons
      const customTex = createItemIconTexture(this.app, itemId);
      if (customTex) {
        this.iconCache.set(itemId, customTex);
        return customTex;
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
      const texture = this.app.renderer.generateTexture(g);
      this.iconCache.set(itemId, texture);
      return texture;
    }

    onResize() {
      const width = this.app.renderer.width;
      const height = this.app.renderer.height;
      this.container.x = width / 2;
      this.container.y = height - 140;
    }
  }

  window.ITEM_DEFS = ITEM_DEFS;
  window.InventoryManager = InventoryManager;
  window.createInventoryUI = function createInventoryUI(app, manager, tileTextures, itemToTile) {
    const ui = new InventoryUI(app, manager, tileTextures, itemToTile);
    ui.refresh();
    return ui;
  };

  function createItemIconTexture(app, itemId) {
    const size = 42;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");

    if (itemId === "berry") {
      ctx.fillStyle = "#b12c2c";
      ctx.beginPath();
      ctx.ellipse(size / 2, size / 2 + 4, 14, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(size / 2 - 3, size / 2 - 12, 6, 8);
    } else if (itemId === "meat" || itemId === "pork" || itemId === "chicken_meat") {
      const base = itemId === "pork" ? "#d48f73" : itemId === "chicken_meat" ? "#e8c7a5" : "#c36b5a";
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.ellipse(size / 2, size / 2, 16, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(size / 2 - 4, size / 2 - 6, 8, 12);
    } else if (itemId === "wool") {
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.ellipse(size / 2, size / 2, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dcdcdc";
      ctx.beginPath();
      ctx.ellipse(size / 2 - 5, size / 2 - 4, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemId === "feather") {
      ctx.strokeStyle = "#fdfaf2";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.25, size * 0.7);
      ctx.lineTo(size * 0.7, size * 0.2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, size * 0.6);
      ctx.lineTo(size * 0.6, size * 0.3);
      ctx.stroke();
    } else {
      return null;
    }

    return PIXI.Texture.from(c);
  }

  window.getItemIconTexture = createItemIconTexture;
})();
