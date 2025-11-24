import Game from "./Game.js";
import Hud from "./systems/Hud.js";
import MiniMap from "./systems/MiniMap.js";
import gameConfig from "./config/gameConfig.js";
import { setDebug, info, error } from "./utils/logger.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Screens
const menuScreen = document.getElementById("menu-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const optionsScreen = document.getElementById("options-screen");
const endScreen = document.getElementById("end-screen");

const lobbyForm = document.getElementById("lobby-form");
const optionsForm = document.getElementById("options-form");
const endTitle = document.getElementById("end-title");
const endStats = document.getElementById("end-stats");
const btnAutoFarm = document.getElementById("btn-autofarm");

const btnPlay = document.getElementById("btn-play");
const btnOptions = document.getElementById("btn-options");
const btnBackLobby = document.getElementById("btn-back-lobby");
const btnBackMenuFromOptions = document.getElementById("btn-back-menu-options");
const btnBackMenuFromEnd = document.getElementById("btn-back-menu-end");
const btnReplay = document.getElementById("btn-replay");

let currentGame = null;
let hud = null;
let minimap = null;
let lastTime = performance.now();
let appOptions = {
  volume: 0.8,
  quality: "medium",
  gameSpeed: 1,
  debug: false,
};

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Screen helpers
function showScreen(screen) {
  [menuScreen, lobbyScreen, optionsScreen, endScreen].forEach((s) => {
    if (s) s.style.display = "none";
  });
  if (screen) screen.style.display = "flex";
}

function startGame(config) {
  disposeGame();
  setDebug(appOptions.debug);
  currentGame = new Game(
    canvas,
    { ...config, config: gameConfig },
    (result) => {
      showEndScreen(result);
    },
    (err) => {
      error("Game crashed", err);
      alert("Erreur inattendue. Voir la console pour plus de détails.");
    }
  );
  hud = new Hud(currentGame);
  minimap = new MiniMap(currentGame);
  if (btnAutoFarm) {
    btnAutoFarm.textContent = currentGame.autoFarm ? "On" : "Off";
    btnAutoFarm.onclick = () => {
      const state = currentGame.toggleAutoFarm();
      btnAutoFarm.textContent = state ? "On" : "Off";
      btnAutoFarm.style.background = state ? "#22c55e" : "#9ca3af";
    };
  }
  showScreen(null);
}

function disposeGame() {
  if (currentGame && currentGame.dispose) currentGame.dispose();
  currentGame = null;
  hud = null;
  minimap = null;
}

function showEndScreen(result) {
  if (!result) return;
  endTitle.textContent = result.state === "win" ? "Victoire !" : "Défaite";
  endStats.textContent = `Temps: ${result.time.toFixed(1)}s | Citoyens: ${result.citizens} | Soldats: ${result.soldiers} | Bâtiments: ${result.buildings}`;
  showScreen(endScreen);
}

// Event wiring
btnPlay.addEventListener("click", () => {
  showScreen(lobbyScreen);
});

btnOptions.addEventListener("click", () => {
  showScreen(optionsScreen);
});

btnBackLobby.addEventListener("click", () => {
  showScreen(menuScreen);
});

btnBackMenuFromOptions.addEventListener("click", () => {
  showScreen(menuScreen);
});

btnBackMenuFromEnd.addEventListener("click", () => {
  showScreen(menuScreen);
});

btnReplay.addEventListener("click", () => {
  showScreen(lobbyScreen);
});

lobbyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const difficulty = lobbyForm.elements["difficulty"].value;
  const mapSize = lobbyForm.elements["map-size"].value;
  const config = buildConfigFromLobby(difficulty, mapSize);
  startGame(config);
});

optionsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  appOptions.volume = parseFloat(optionsForm.elements["volume"].value);
  appOptions.quality = optionsForm.elements["quality"].value;
  appOptions.gameSpeed = parseFloat(optionsForm.elements["game-speed"].value);
  appOptions.debug = optionsForm.elements["debug"].value === "true";
  showScreen(menuScreen);
});

function buildConfigFromLobby(difficulty, mapSize) {
  const sizeMap = {
    small: { width: 80, height: 80 },
    medium: { width: 100, height: 100 },
    large: { width: 130, height: 130 },
  };
  const diffMap = {
    easy: { attackInterval: 26, soldiersPerWave: 2 },
    normal: { attackInterval: 22, soldiersPerWave: 3 },
    hard: { attackInterval: 16, soldiersPerWave: 5 },
  };
  const size = sizeMap[mapSize] || sizeMap.medium;
  const diff = diffMap[difficulty] || diffMap.normal;
  return {
    mapWidth: size.width,
    mapHeight: size.height,
    aiConfig: diff,
    gameSpeed: appOptions.gameSpeed,
  };
}

// Loop
function gameLoop(timestamp) {
  const dt = ((timestamp - lastTime) / 1000) * (currentGame?.speed || 1);
  lastTime = timestamp;

  if (currentGame) {
    try {
      currentGame.update(dt);
      currentGame.render(ctx);
      if (hud) hud.update(timestamp);
      if (minimap) minimap.render(timestamp);
    } catch (err) {
      error("Loop error", err);
      if (currentGame.onError) currentGame.onError(err);
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
showScreen(menuScreen);
