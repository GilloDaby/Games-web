import Arena from "./Arena.js";
import UIManager from "./UIManager.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");
  const overlay = document.getElementById("mainMenu");
  const startBtn = document.getElementById("startSimulation");
  const hudElements = {
    generation: document.getElementById("statGeneration"),
    best: document.getElementById("statBest"),
    average: document.getElementById("statAverage"),
    alive: document.getElementById("statAlive"),
    time: document.getElementById("statTime"),
    energy: document.getElementById("statEnergy"),
    hydration: document.getElementById("statHydration"),
    weather: document.getElementById("statWeather"),
    wood: document.getElementById("statWood"),
    stone: document.getElementById("statStone"),
    crystal: document.getElementById("statCrystal"),
    structures: document.getElementById("statStructures"),
    selectedName: document.getElementById("selectedName"),
    selectedTraits: document.getElementById("selectedTraits"),
  };
  const recordElements = {
    kills: document.getElementById("statKills"),
    recordKills: document.getElementById("statRecordKills"),
    recordFitness: document.getElementById("statRecordFitness"),
    zones: document.getElementById("statZones"),
  };
  const controlElements = {
    population: document.getElementById("controlPopulation"),
    populationValue: document.getElementById("controlPopulationValue"),
    mutation: document.getElementById("controlMutation"),
    mutationValue: document.getElementById("controlMutationValue"),
    generationInput: document.getElementById("controlGenerationTime"),
    restartBtn: document.getElementById("controlRestart"),
    skipBtn: document.getElementById("controlSkipGeneration"),
    speed: document.getElementById("controlSpeed"),
    infiniteTime: document.getElementById("controlInfiniteTime"),
    teamSelect: document.getElementById("controlTeamSelect"),
    teamJump: document.getElementById("controlTeamJump"),
  };

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const uiManager = new UIManager({
    hudElements,
    recordElements,
    controlElements,
  });

  let arena = null;

  const bindArena = (newArena) => {
    arena = newArena;
    uiManager.bindArena(arena);
    const viewSize = arena.getViewSize();
    canvas.width = viewSize.width;
    canvas.height = viewSize.height;
    arena.start();
  };

  canvas.addEventListener(
    "wheel",
    (event) => {
      if (arena) {
        arena.handleWheel(event);
      }
    },
    { passive: false },
  );

  canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    if (arena) {
      arena.startCameraDrag(event.clientX - rect.left, event.clientY - rect.top);
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (!arena?.camera?.isDragging) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    arena.dragCamera(event.clientX - rect.left, event.clientY - rect.top);
  });

  const endDrag = () => {
    arena.endCameraDrag();
  };
  canvas.addEventListener("mouseup", endDrag);
  canvas.addEventListener("mouseleave", endDrag);

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    if (arena) {
      arena.handleCanvasClick(screenX, screenY);
    }
  });

  const startSimulation = () => {
    const mode = "infinite";
    const seed = null;
    if (arena) {
      arena.stop();
    }
    
    // Get the actual size of the canvas from the layout
    const viewWidth = canvas.clientWidth;
    const viewHeight = canvas.clientHeight;

    const arenaOptions = {
      worldMode: mode,
      seed,
      viewWidth,
      viewHeight,
    };

    const nextArena = new Arena(canvas, hudElements, uiManager, arenaOptions);
    if (mode === "infinite") {
      nextArena.setGenerationDuration(Number.POSITIVE_INFINITY);
    }
    bindArena(nextArena);
    overlay?.classList.remove("open");
    window.geneticArena = arena;
  };

  if (startBtn) {
    startBtn.addEventListener("click", startSimulation);
  }
});
