(() => {
  const STORAGE_KEY = "minecraft2d-save";

  class SaveSystem {
    constructor(app, { onSave, onLoad }) {
      this.app = app;
      this.onSave = onSave;
      this.onLoad = onLoad;
      this.container = new PIXI.Container();
      this.message = null;
      this.messageTimer = 0;

      this.buildUI();
      this.onResize();
      app.stage.addChild(this.container);
    }

    buildUI() {
      const buttonSave = this.createButton("Save", () => this.save());
      const buttonLoad = this.createButton("Load", () => this.load());
      buttonSave.x = 0;
      buttonLoad.x = 100;
      this.container.addChild(buttonSave, buttonLoad);

      this.message = new PIXI.Text("", {
        fontFamily: "Consolas, monospace",
        fontSize: 14,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      });
      this.message.visible = false;
      this.message.y = 42;
      this.container.addChild(this.message);
    }

    createButton(label, onClick) {
      const container = new PIXI.Container();
      const bg = new PIXI.Graphics();
      bg.beginFill(0x11141e);
      bg.lineStyle(2, 0x3a435e, 1);
      bg.drawRoundedRect(0, 0, 90, 32, 6);
      bg.endFill();
      container.addChild(bg);

      const text = new PIXI.Text(label, {
        fontFamily: "Consolas, monospace",
        fontSize: 14,
        fill: "#ffffff",
      });
      text.anchor.set(0.5);
      text.position.set(45, 16);
      container.addChild(text);

      container.eventMode = "static";
      container.cursor = "pointer";
      container.on("pointerdown", onClick);
      return container;
    }

    save(showMessage = true) {
      try {
        const state = this.onSave();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (showMessage) this.flash("Game Saved!");
      } catch (e) {
        console.error("Save error", e);
        this.flash("Save failed");
      }
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          this.flash("No save");
          return;
        }
        const state = JSON.parse(raw);
        this.onLoad(state);
        this.flash("Game Loaded!");
      } catch (e) {
        console.error("Load error", e);
        this.flash("Load failed");
      }
    }

    flash(text) {
      this.message.text = text;
      this.message.visible = true;
      this.messageTimer = 1.8;
    }

    update(dt) {
      if (this.messageTimer > 0) {
        this.messageTimer -= dt;
        if (this.messageTimer <= 0) {
          this.message.visible = false;
        }
      }
    }

    onResize() {
      const width = this.app.renderer.width;
      this.container.x = width - 210;
      this.container.y = 12;
    }
  }

  window.createSaveSystem = function createSaveSystem(app, hooks) {
    return new SaveSystem(app, hooks);
  };
})();
