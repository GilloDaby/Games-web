const DEFAULT_TIME_FORMAT = new Intl.NumberFormat("fr-FR", {
  minimumIntegerDigits: 2,
});

export default class UIManager {
  constructor({ hudElements, recordElements, controlElements }) {
    this.hud = hudElements;
    this.records = recordElements;
    this.controls = controlElements;
    this.arena = null;
    this.bindControlHandlers();
  }

  bindArena(arena) {
    this.arena = arena;
    this.syncControlsFromArena();
  }

  updateHud({
    generation,
    best,
    average,
    alive,
    timeRemaining,
    kills,
    recordKills,
    recordFitness,
    zones,
    energy,
    hydration,
    weatherLabel,
    resources = {},
    structures = 0,
  }) {
    if (this.hud.generation) {
      this.hud.generation.textContent = generation.toString();
    }
    if (this.hud.best) {
      this.hud.best.textContent = best.toFixed(1);
    }
    if (this.hud.average) {
      this.hud.average.textContent = average.toFixed(1);
    }
    if (this.hud.alive) {
      this.hud.alive.textContent = alive.toString();
    }
    if (this.hud.time) {
      this.hud.time.textContent = UIManager.formatTime(timeRemaining);
    }
    if (this.hud.energy) {
      this.hud.energy.textContent = UIManager.formatPercentage(energy ?? 0);
    }
    if (this.hud.hydration) {
      this.hud.hydration.textContent = UIManager.formatPercentage(hydration ?? 0);
    }
    if (this.hud.wood) {
      this.hud.wood.textContent = UIManager.formatInteger(resources.wood ?? 0);
    }
    if (this.hud.stone) {
      this.hud.stone.textContent = UIManager.formatInteger(resources.stone ?? 0);
    }
    if (this.hud.crystal) {
      this.hud.crystal.textContent = UIManager.formatInteger(resources.crystal ?? 0);
    }
    if (this.hud.structures) {
      this.hud.structures.textContent = UIManager.formatInteger(structures ?? 0);
    }

    if (this.records.kills) {
      this.records.kills.textContent = kills.toString();
    }
    if (this.records.recordKills) {
      this.records.recordKills.textContent = recordKills.toString();
    }
    if (this.records.recordFitness) {
      this.records.recordFitness.textContent = recordFitness.toFixed(1);
    }
    if (this.records.zones) {
      this.records.zones.textContent = (zones ?? 0).toString();
    }
    if (this.hud.weather) {
      this.hud.weather.textContent = weatherLabel ?? "-";
    }
  }

  syncControlsFromArena() {
    if (!this.arena) {
      return;
    }
    const settings = this.arena.getSimulationSettings();
    this.updateSlider(this.controls.population, this.controls.populationValue, settings.populationSize);
    this.updateSlider(
      this.controls.mutation,
      this.controls.mutationValue,
      settings.mutationRate,
      UIManager.formatPercentage,
    );
    if (this.controls.generationInput) {
      this.controls.generationInput.value = Number.isFinite(settings.generationDuration)
        ? settings.generationDuration.toFixed(0)
        : "";
    }
    if (this.controls.speed) {
      this.controls.speed.value = settings.timeScale.toString();
    }
  }

  bindControlHandlers() {
    if (this.controls.population) {
      this.controls.population.addEventListener("input", (event) => {
        const value = Number(event.target.value);
        this.updateSlider(this.controls.population, this.controls.populationValue, value);
      });
      this.controls.population.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        if (this.arena) {
          this.arena.setPopulationSize(value);
          this.syncControlsFromArena();
        }
      });
    }

    if (this.controls.mutation) {
      this.controls.mutation.addEventListener("input", (event) => {
        const value = Number(event.target.value);
        this.updateSlider(
          this.controls.mutation,
          this.controls.mutationValue,
          value,
          UIManager.formatPercentage,
        );
      });
      this.controls.mutation.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        if (this.arena) {
          this.arena.setMutationRate(value);
          this.syncControlsFromArena();
        }
      });
    }

    if (this.controls.generationInput) {
      this.controls.generationInput.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        if (this.arena) {
          this.arena.setGenerationDuration(value);
          this.syncControlsFromArena();
        }
      });
    }

    if (this.controls.speed) {
      this.controls.speed.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        if (this.arena) {
          this.arena.setTimeScale(value);
        }
      });
    }

    if (this.controls.restartBtn) {
      this.controls.restartBtn.addEventListener("click", () => {
        this.arena?.resetSimulation();
        this.syncControlsFromArena();
      });
    }

    if (this.controls.skipBtn) {
      this.controls.skipBtn.addEventListener("click", () => {
        this.arena?.skipGeneration();
      });
    }
  }

  updateSlider(input, valueElement, value, formatter = UIManager.formatInteger) {
    if (input && input.value !== value.toString()) {
      input.value = value;
    }
    if (valueElement) {
      valueElement.textContent = formatter(value);
    }
  }

  static formatInteger(value) {
    return Math.round(value).toString();
  }

  static formatPercentage(value) {
    return `${(value * 100).toFixed(0)}%`;
  }

  static formatTime(timeSeconds) {
    if (!Number.isFinite(timeSeconds)) {
      return "∞";
    }
    const totalSeconds = Math.max(0, Math.floor(timeSeconds));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${DEFAULT_TIME_FORMAT.format(minutes)}:${DEFAULT_TIME_FORMAT.format(seconds)}`;
  }
}
