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
  };

  const ItemDragState = {
    itemId: null,
    count: 0,
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
    constructor(app, manager, opts = {}) {
      this.app = app;
      this.manager = manager;
      this.container = new PIXI.Container();
      this.slotSize = 52;
      this.gap = 8;
      this.slots = [];
      this.iconCache = new Map();
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

      container.eventMode = "static";
      container.cursor = "pointer";
      container.on("pointerdown", () => this.handleSlot(index));

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

    handleSlot(index) {
      const slot = this.manager.slots[index];
      const drag = ItemDragState;
      if (!drag.itemId && slot.itemId) {
        // pick up
        drag.itemId = slot.itemId;
        drag.count = slot.count;
        this.manager.slots[index] = { itemId: null, count: 0 };
      } else if (drag.itemId) {
        if (!slot.itemId) {
          this.manager.slots[index] = { itemId: drag.itemId, count: drag.count };
          drag.itemId = null;
          drag.count = 0;
        } else if (slot.itemId === drag.itemId) {
          const def = ITEM_DEFS[slot.itemId];
          const space = def.stack - slot.count;
          const moved = Math.min(space, drag.count);
          slot.count += moved;
          drag.count -= moved;
          if (drag.count <= 0) {
            drag.itemId = null;
            drag.count = 0;
          }
        } else {
          const temp = { itemId: slot.itemId, count: slot.count };
          this.manager.slots[index] = { itemId: drag.itemId, count: drag.count };
          drag.itemId = temp.itemId;
          drag.count = temp.count;
        }
      }
      this.refresh();
    }

    getIcon(itemId) {
      if (this.iconCache.has(itemId)) return this.iconCache.get(itemId);
      const def = ITEM_DEFS[itemId];
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
  window.ItemDragState = ItemDragState;
  window.InventoryManager = InventoryManager;
  window.createInventoryUI = function createInventoryUI(app, manager) {
    const ui = new InventoryUI(app, manager);
    ui.refresh();
    return ui;
  };
})();
