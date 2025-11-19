import Arena from "./Arena.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");
  const statsElements = {
    generation: document.getElementById("statGeneration"),
    best: document.getElementById("statBest"),
    average: document.getElementById("statAverage"),
    alive: document.getElementById("statAlive"),
    kills: document.getElementById("statKills"),
    recordKills: document.getElementById("statRecordKills"),
    recordFitness: document.getElementById("statRecordFitness"),
  };
  const resetButton = document.getElementById("resetSimulation");

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const arena = new Arena(canvas, statsElements);
  arena.start();

  if (resetButton) {
    resetButton.addEventListener("click", () => arena.resetSimulation());
  }

  window.geneticArena = arena;
});
