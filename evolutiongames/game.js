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
  };
  const recordElements = {
    kills: document.getElementById("statKills"),
    recordKills: document.getElementById("statRecordKills"),
    recordFitness: document.getElementById("statRecordFitness"),
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
  uiManager.bindArena(arena);
  arena.start();

  window.geneticArena = arena;
});
