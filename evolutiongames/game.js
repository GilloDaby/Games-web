import Arena from "./Arena.js";
import UIManager from "./UIManager.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");
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
  };

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const uiManager = new UIManager({
    hudElements,
    recordElements,
    controlElements,
  });

  const arena = new Arena(canvas, hudElements, uiManager);
  canvas.width = arena.tileMap.width * arena.tileMap.tileSize;
  canvas.height = arena.tileMap.height * arena.tileMap.tileSize;
  uiManager.bindArena(arena);
  arena.start();

  canvas.addEventListener(
    "wheel",
    (event) => {
      arena.handleWheel(event);
    },
    { passive: false },
  );

  canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    arena.startCameraDrag(event.clientX - rect.left, event.clientY - rect.top);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (!arena.camera?.isDragging) {
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
    arena.handleCanvasClick(screenX, screenY);
  });

  window.geneticArena = arena;
});
