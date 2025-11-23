(() => {
  const RECIPES = [
    {
      id: "plank_from_log",
      inputs: { log: 1 },
      output: { plank: 4 },
    },
    {
      id: "stick_from_plank",
      inputs: { plank: 2 },
      output: { stick: 4 },
    },
    {
      id: "stone_pickaxe",
      inputs: { stone: 3, stick: 2 },
      output: { stone_pickaxe: 1 },
    },
  ];

  class CraftingUI {
    constructor(app, inventoryManager) {
      this.app = app;
      this.manager = inventoryManager;
      this.container = new PIXI.Container();
      this.container.visible = false;
      this.gridSize = 3;
      this.slotSize = 48;
      this.gap = 6;
      this.gridSlots = Array.from({ length: this.gridSize * this.gridSize }, () => ({ itemId: null, count: 0 }));
      this.slotViews = [];
      this.resultSlot = { itemId: null, count: 0 };
      this.resultView = null;
      this.iconCache = new Map();
      this.buildUI();
      this.onResize();
    }

    buildUI() {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0c0e16, 0.8);
      bg.drawRoundedRect(0, 0, 260, 200, 10);
      bg.endFill();
      bg.lineStyle(1, 0xffffff, 0.15);
      bg.drawRoundedRect(0, 0, 260, 200, 10);
      this.container.addChild(bg);

      let index = 0;
      for (let y = 0; y < this.gridSize; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          const view = this.createSlot(() => this.handleGridClick(index));
          view.container.x = 12 + x * (this.slotSize + this.gap);
          view.container.y = 12 + y * (this.slotSize + this.gap);
          this.container.addChild(view.container);
          this.slotViews.push(view);
          index++;
        }
      }

      const arrow = new PIXI.Text("→", {
        fontFamily: "Consolas, monospace",
        fontSize: 22,
        fill: "#ffffff",
      });
      arrow.position.set(12 + this.gridSize * (this.slotSize + this.gap) + 4, 60);
      this.container.addChild(arrow);

      this.resultView = this.createSlot(() => this.handleResultClick());
      this.resultView.container.x = 12 + this.gridSize * (this.slotSize + this.gap) + 28;
      this.resultView.container.y = 40;
      this.container.addChild(this.resultView.container);

      this.refresh();
    }

    createSlot(onClick) {
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
        fontSize: 12,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      });
      count.anchor.set(1, 1);
      count.position.set(this.slotSize - 4, this.slotSize - 4);
      container.addChild(count);

      container.eventMode = "static";
      container.cursor = "pointer";
      container.on("pointerdown", onClick);

      return { container, icon, count };
    }

    refresh() {
      for (let i = 0; i < this.gridSlots.length; i++) {
        const slot = this.gridSlots[i];
        const view = this.slotViews[i];
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
      const r = this.resultSlot;
      if (r.itemId) {
        const icon = this.getIcon(r.itemId);
        this.resultView.icon.texture = icon;
        this.resultView.icon.visible = true;
        this.resultView.count.text = r.count > 1 ? r.count : "";
      } else {
        this.resultView.icon.visible = false;
        this.resultView.count.text = "";
      }
    }

    handleGridClick(index) {
      const slot = this.gridSlots[index];
      const drag = window.ItemDragState;
      if (!drag.itemId && slot.itemId) {
        drag.itemId = slot.itemId;
        drag.count = slot.count;
        this.gridSlots[index] = { itemId: null, count: 0 };
      } else if (drag.itemId) {
        if (!slot.itemId) {
          this.gridSlots[index] = { itemId: drag.itemId, count: drag.count };
          drag.itemId = null;
          drag.count = 0;
        } else if (slot.itemId === drag.itemId) {
          const def = window.ITEM_DEFS[slot.itemId];
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
          this.gridSlots[index] = { itemId: drag.itemId, count: drag.count };
          drag.itemId = temp.itemId;
          drag.count = temp.count;
        }
      }
      this.computeRecipe();
      this.refresh();
    }

    handleResultClick() {
      if (!this.resultSlot.itemId) return;
      const remaining = this.manager.addItem(this.resultSlot.itemId, this.resultSlot.count);
      if (remaining > 0) return; // no space
      this.consumeInputs(this.currentRecipe);
      this.computeRecipe();
      this.refresh();
    }

    consumeInputs(recipe) {
      if (!recipe) return;
      Object.entries(recipe.inputs).forEach(([id, needed]) => {
        let remain = needed;
        for (const slot of this.gridSlots) {
          if (slot.itemId !== id) continue;
          const used = Math.min(slot.count, remain);
          slot.count -= used;
          remain -= used;
          if (slot.count <= 0) {
            slot.itemId = null;
            slot.count = 0;
          }
          if (remain <= 0) break;
        }
      });
    }

    computeRecipe() {
      const counts = {};
      for (const slot of this.gridSlots) {
        if (!slot.itemId) continue;
        counts[slot.itemId] = (counts[slot.itemId] || 0) + slot.count;
      }
      const match = RECIPES.find((r) => {
        const ids = Object.keys(counts);
        const inputs = Object.keys(r.inputs);
        if (ids.length !== inputs.length) return false;
        return inputs.every((id) => counts[id] >= r.inputs[id]);
      });
      this.currentRecipe = match || null;
      if (match) {
        const [outId, outCount] = Object.entries(match.output)[0];
        this.resultSlot = { itemId: outId, count: outCount };
      } else {
        this.resultSlot = { itemId: null, count: 0 };
      }
    }

    getIcon(itemId) {
      if (this.iconCache.has(itemId)) return this.iconCache.get(itemId);
      const def = window.ITEM_DEFS[itemId];
      const g = new PIXI.Graphics();
      g.beginFill(def?.color ?? 0xffffff);
      g.drawRoundedRect(0, 0, 36, 36, 6);
      g.endFill();
      const tex = this.app.renderer.generateTexture(g);
      this.iconCache.set(itemId, tex);
      return tex;
    }

    onResize() {
      const width = this.app.renderer.width;
      this.container.x = width - 280;
      this.container.y = 100;
    }
  }

  window.createCraftingUI = function createCraftingUI(app, inventoryManager) {
    return new CraftingUI(app, inventoryManager);
  };
})();
