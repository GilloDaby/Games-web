import Arena from "./Arena.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("arenaCanvas");
  const statsElements = {
    generation: document.getElementById("statGeneration"),
    best: document.getElementById("statBest"),
    average: document.getElementById("statAverage"),
  };

  if (!canvas) {
    throw new Error("Canvas introuvable : #arenaCanvas");
  }

  const arena = new Arena(canvas, statsElements);
  arena.start();
});
