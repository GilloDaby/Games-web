// Petit HUD en overlay DOM qui lit l'etat du Game et met a jour quelques cartes.
export default class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById("hud");
    this.resEl = document.getElementById("hud-resources");
    this.popEl = document.getElementById("hud-population");
    this.unitsEl = document.getElementById("hud-units");
    this.buildEl = document.getElementById("hud-build");
    this.objectiveEl = document.getElementById("hud-objective");
    this.messagesEl = document.getElementById("hud-messages");
    this.lastUpdate = 0;
  }

  // Rafraichit le HUD (throttle leger pour limiter le travail).
  update(nowMs) {
    if (!this.root) return;
    if (nowMs - this.lastUpdate < 120) return;
    this.lastUpdate = nowMs;
    this.renderResources();
    this.renderPopulation();
    this.renderBuild();
    this.renderObjective();
    this.renderMessages();
  }

  renderResources() {
    if (!this.resEl) return;
    const { wood, stone, food, gold } = this.game.player.resources;
    this.resEl.textContent = `Bois ${wood} | Pierre ${stone} | Nourriture ${food} | Or ${gold}`;
  }

  renderPopulation() {
    if (!this.popEl || !this.unitsEl) return;
    const { population, populationCap } = this.game.player;
    this.popEl.textContent = `Population ${population}/${populationCap}`;
    this.unitsEl.textContent = `Citoyens ${this.game.player.citizens.length} | Soldats ${this.game.soldiers.length}`;
  }

  renderBuild() {
    if (!this.buildEl) return;
    if (this.game.currentBuildType) {
      this.buildEl.textContent = `Construction: ${this.game.currentBuildType.toUpperCase()} (clic pour placer)`;
    } else {
      this.buildEl.textContent = `Raccourcis: H=Maison | B=Caserne | S=Soldat | Formation: ${this.game.formationMode} | Camera: ZQSD/Fleches, molette zoom`;
    }
  }

  renderObjective() {
    if (!this.objectiveEl) return;
    if (this.game.enemyCity && !this.game.enemyCity.conquered && this.game.enemyCity.hp > 0) {
      this.objectiveEl.textContent = "Objectif: detruire la ville ennemie (clic dessus avec des soldats)";
    } else if (this.game.enemyCity && this.game.enemyCity.conquered) {
      this.objectiveEl.textContent = "Ville ennemie conquise ! Population absorbee.";
    } else {
      this.objectiveEl.textContent = "Objectif: explorer / recolter / construire.";
    }
  }

  // Affiche les messages actifs (inverses pour voir le plus recent en haut).
  renderMessages() {
    if (!this.messagesEl) return;
    this.messagesEl.innerHTML = "";
    const msgs = [...this.game.messages].sort((a, b) => b.created - a.created);
    for (const m of msgs) {
      const div = document.createElement("div");
      div.className = "hud-toast";
      div.textContent = m.text;
      this.messagesEl.appendChild(div);
    }
  }
}
