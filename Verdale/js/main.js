import * as THREE from 'three';
import { Player } from './player.js';
import { ResourceManager } from './resources.js';
import { QuestManager } from './quests.js';
import { MapManager } from './map.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gameContainer = document.getElementById('game');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('start-btn');

const inventoryElements = {
  wood: document.getElementById('wood-count'),
  stone: document.getElementById('stone-count'),
  gold: document.getElementById('gold-count'),
};

const resources = {
  wood: 0,
  stone: 0,
  gold: 0,
};

let isRunning = false;

const devState = {
  enabled: false,
  freecam: false,
  placing: 'none',
  devPlacements: [],
  removedNodes: [],
  prefabPlacements: [],
  selected: null, // { kind:'resource'|'prefab', id }
  moveKeys: new Set(),
  lookActive: false,
  lookYaw: 0,
  lookPitch: 0,
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
gameContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bc8ff);
scene.fog = new THREE.Fog(0x8bc8ff, 40, 120);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(20, 18, 20);
camera.lookAt(0, 0, 0);

const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x223322, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
dirLight.position.set(12, 25, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);

const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x3aa871,
  roughness: 0.9,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const clock = new THREE.Clock();

const player = new Player(scene, camera);
const resourceManager = new ResourceManager(scene, handleResourceGain);
const mapManager = new MapManager(scene, resourceManager);
player.setObstacleProvider(() => resourceManager.getObstacles());

const questData = [
  { id: 1, goal: 'Collect 10 Wood', wood: 10, stone: 0, gold: 0, unlock: 'tile2', isUnlocked: true },
  { id: 2, goal: 'Collect 20 Stone', wood: 0, stone: 20, gold: 0, unlock: 'tile3', isUnlocked: false },
  { id: 3, goal: 'Collect 5 Gold', wood: 0, stone: 0, gold: 5, unlock: 'tile4', isUnlocked: false },
];

const savedState = loadState();

const questManager = new QuestManager(savedState.quests || questData, handleQuestComplete);
questManager.setOnChange(() => saveState());
questManager.render();

mapManager.init(devState.enabled);
if (savedState.resources) {
  resources.wood = savedState.resources.wood || 0;
  resources.stone = savedState.resources.stone || 0;
  resources.gold = savedState.resources.gold || 0;
}
updateInventoryUI();

if (Array.isArray(savedState.devPlacements) && savedState.devPlacements.length) {
  const spawns = savedState.devPlacements.map((p) => ({
    type: p.type,
    position: new THREE.Vector3(p.x, 0, p.z),
    scale: p.scale || 1,
    id: p.id,
  }));
  resourceManager.addResources('dev', spawns);
  devState.devPlacements = [...savedState.devPlacements];
}
if (Array.isArray(savedState.removedNodes) && savedState.removedNodes.length) {
  devState.removedNodes = [...savedState.removedNodes];
  resourceManager.removeByMatch(devState.removedNodes);
}
if (Array.isArray(savedState.prefabs) && savedState.prefabs.length) {
  devState.prefabPlacements = [...savedState.prefabs];
  savedState.prefabs.forEach((p) => {
    placePrefab(p.path, new THREE.Vector3(p.x, 0, p.z), p.id, p.scale || 1);
  });
}

const harvestAudio = new Audio('./audio/harvest.mp3');
harvestAudio.volume = 0.35;

const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
const freecamVelocity = new THREE.Vector3();

// Debug scale overlay (F9)
const debugPanel = document.createElement('div');
debugPanel.className = 'debug-panel hidden';
debugPanel.innerHTML = `
  <div><strong>Debug Player Scale (F9)</strong></div>
  <div class="row">
    <button id="dev-toggle">Dev Mode</button>
    <button id="freecam-toggle">Freecam</button>
  </div>
  <div class="row">
    <input id="scale-slider" type="range" min="0.0005" max="0.05" step="0.0005">
    <span id="scale-value">0</span>
  </div>
  <div class="row">
    <button id="skin-prev">Prev</button>
    <span id="skin-name" style="flex:1;text-align:center;">skin</span>
    <button id="skin-next">Next</button>
  </div>
  <div class="section-title">Selection</div>
  <div class="row">
    <span id="sel-name" style="flex:1;">None</span>
    <button id="sel-delete">Delete</button>
  </div>
  <div class="row">
    <input id="sel-scale" type="range" min="0.3" max="3" step="0.05">
    <span id="sel-scale-value">1.00</span>
  </div>
  <div class="row">
    <select id="place-type">
      <option value="none">none</option>
      <option value="wood">wood</option>
      <option value="stone">stone</option>
      <option value="gold">gold</option>
    </select>
    <button id="place-resource">Place @click</button>
  </div>
  <div class="row">
    <input id="quest-goal" placeholder="Quest goal" style="flex:2;">
  </div>
  <div class="row">
    <input id="quest-wood" type="number" min="0" placeholder="wood" style="width:60px;">
    <input id="quest-stone" type="number" min="0" placeholder="stone" style="width:60px;">
    <input id="quest-gold" type="number" min="0" placeholder="gold" style="width:60px;">
  </div>
  <div class="row" style="justify-content:flex-end;">
    <button id="quest-add">Add Quest</button>
  </div>
  <div class="row" style="justify-content:flex-end;">
    <button id="scale-reset">Reset auto</button>
  </div>
`;
document.body.appendChild(debugPanel);
const scaleSlider = debugPanel.querySelector('#scale-slider');
const scaleValue = debugPanel.querySelector('#scale-value');
const scaleReset = debugPanel.querySelector('#scale-reset');
const skinPrev = debugPanel.querySelector('#skin-prev');
const skinNext = debugPanel.querySelector('#skin-next');
const skinName = debugPanel.querySelector('#skin-name');
const devToggle = debugPanel.querySelector('#dev-toggle');
const freecamToggle = debugPanel.querySelector('#freecam-toggle');
const placeType = debugPanel.querySelector('#place-type');
const placeBtn = debugPanel.querySelector('#place-resource');
const questGoal = debugPanel.querySelector('#quest-goal');
const questWood = debugPanel.querySelector('#quest-wood');
const questStone = debugPanel.querySelector('#quest-stone');
const questGold = debugPanel.querySelector('#quest-gold');
const questAdd = debugPanel.querySelector('#quest-add');
const selName = debugPanel.querySelector('#sel-name');
const selDelete = debugPanel.querySelector('#sel-delete');
const selScale = debugPanel.querySelector('#sel-scale');
const selScaleValue = debugPanel.querySelector('#sel-scale-value');
if (placeType) placeType.value = devState.placing;

const prefabOptions = [
  { value: './3dmodels/building/tente.glb', label: 'tente' },
  { value: './3dmodels/building/bateau.glb', label: 'bateau' },
  { value: './3dmodels/building/Blueberry_house.glb', label: 'house' },
  { value: './3dmodels/building/storage.glb', label: 'storage' },
  { value: './3dmodels/building/woodworkshop.glb', label: 'woodworkshop' },
  { value: './3dmodels/building/woodworkshop2.glb', label: 'woodworkshop2' },
  { value: './3dmodels/building/fishworkshop.glb', label: 'fishworkshop' },
  { value: './3dmodels/building/weaponworkshop.glb', label: 'weaponworkshop' },
  { value: './3dmodels/resource/tree.glb', label: 'tree model' },
  { value: './3dmodels/resource/rock.glb', label: 'rock model' },
];

if (placeType) {
  prefabOptions.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    placeType.appendChild(o);
  });
}

function syncDebugScale() {
  const current = player.getDebugScale ? player.getDebugScale() : 0.01;
  scaleSlider.value = current;
  scaleValue.textContent = current.toFixed(4);
  if (skinName && player.getCurrentSkinName) {
    skinName.textContent = player.getCurrentSkinName();
  }
  syncSelectionUI();
}
syncDebugScale();

scaleSlider.addEventListener('input', () => {
  const v = Number(scaleSlider.value);
  player.setDebugScale && player.setDebugScale(v);
  scaleValue.textContent = v.toFixed(4);
});
scaleReset.addEventListener('click', () => {
  player.resetScale && player.resetScale();
  syncDebugScale();
});

devToggle.addEventListener('click', () => {
  devState.enabled = !devState.enabled;
  devToggle.textContent = devState.enabled ? 'Dev ON' : 'Dev Mode';
  questManager.setDevMode(devState.enabled);
});

freecamToggle.addEventListener('click', () => {
  devState.freecam = !devState.freecam;
  freecamToggle.textContent = devState.freecam ? 'Freecam ON' : 'Freecam';
  if (devState.freecam) {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    devState.lookYaw = euler.y;
    devState.lookPitch = euler.x;
  }
});

skinPrev.addEventListener('click', () => {
  player.cycleSkin && player.cycleSkin(-1);
  syncDebugScale();
});

skinNext.addEventListener('click', () => {
  player.cycleSkin && player.cycleSkin(1);
  syncDebugScale();
});

placeType.addEventListener('change', () => {
  devState.placing = placeType.value;
});

placeBtn.addEventListener('click', () => {
  devState.enabled = true;
  devToggle.textContent = 'Dev ON';
});

questAdd.addEventListener('click', () => {
  questManager.addQuest({
    goal: questGoal.value || 'New Quest',
    wood: questWood.value,
    stone: questStone.value,
    gold: questGold.value,
    unlock: '',
  });
  questGoal.value = '';
  questWood.value = '';
  questStone.value = '';
  questGold.value = '';
  saveState();
});

selScale.addEventListener('input', () => {
  const v = Number(selScale.value);
  selScaleValue.textContent = v.toFixed(2);
  if (!devState.selected) return;
  if (devState.selected.kind === 'resource') {
    resourceManager.setNodeScale(devState.selected.id, v);
    const p = devState.devPlacements.find((d) => d.id === devState.selected.id);
    if (p) p.scale = v;
  } else if (devState.selected.kind === 'prefab') {
    setPrefabScale(devState.selected.id, v);
    const p = devState.prefabPlacements.find((d) => d.id === devState.selected.id);
    if (p) p.scale = v;
  }
  saveState();
});

selDelete.addEventListener('click', () => {
  if (!devState.selected) return;
  if (devState.selected.kind === 'resource') {
    resourceManager.removeNode(devState.selected.id);
    devState.devPlacements = devState.devPlacements.filter((p) => p.id !== devState.selected.id);
    devState.removedNodes.push({ id: devState.selected.id });
  } else if (devState.selected.kind === 'prefab') {
    removePrefab(devState.selected.id);
    devState.prefabPlacements = devState.prefabPlacements.filter((p) => p.id !== devState.selected.id);
  }
  devState.selected = null;
  syncSelectionUI();
  saveState();
});

function handleResourceGain(type) {
  if (!resources[type] && resources[type] !== 0) return;
  resources[type] += 1;
  updateInventoryUI();
  questManager.update(resources);
  saveState();
  playHarvestSound();
}

function handleQuestComplete(quest) {
  mapManager.unlockTile(quest.unlock);
  saveState();
}

function updateInventoryUI() {
  inventoryElements.wood.textContent = resources.wood;
  inventoryElements.stone.textContent = resources.stone;
  inventoryElements.gold.textContent = resources.gold;
}

function playHarvestSound() {
  try {
    harvestAudio.currentTime = 0;
    harvestAudio.play();
  } catch (err) {
    // ignore autoplay issues
  }
}

window.addEventListener('resize', onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateFreecam(delta) {
  const moveSpeed = (devState.moveKeys.has('shiftleft') ? 18 : 10) * delta;
  const dirForward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(devState.lookPitch, devState.lookYaw, 0, 'YXZ')).normalize();
  const dirRight = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, devState.lookYaw, 0, 'YXZ')).normalize();
  const dirUp = new THREE.Vector3(0, 1, 0);

  if (devState.moveKeys.has('keyw')) camera.position.addScaledVector(dirForward, moveSpeed);
  if (devState.moveKeys.has('keys')) camera.position.addScaledVector(dirForward, -moveSpeed);
  if (devState.moveKeys.has('keya')) camera.position.addScaledVector(dirRight, -moveSpeed);
  if (devState.moveKeys.has('keyd')) camera.position.addScaledVector(dirRight, moveSpeed);
  if (devState.moveKeys.has('space')) camera.position.addScaledVector(dirUp, moveSpeed);
  if (devState.moveKeys.has('controlleft')) camera.position.addScaledVector(dirUp, -moveSpeed);

  camera.rotation.set(devState.lookPitch, devState.lookYaw, 0, 'YXZ');
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'e' || e.code === 'Space') {
    resourceManager.requestHarvest();
  }
  if (e.code === 'F9') {
    e.preventDefault();
    debugPanel.classList.toggle('hidden');
    syncDebugScale();
  }
  if (devState.enabled && devState.freecam) {
    devState.moveKeys.add(e.code.toLowerCase());
  }
});

window.addEventListener('keyup', (e) => {
  if (devState.enabled && devState.freecam) {
    devState.moveKeys.delete(e.code.toLowerCase());
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (devState.enabled && devState.freecam && e.button === 0) {
    devState.lookActive = true;
  }
});

window.addEventListener('mouseup', () => {
  devState.lookActive = false;
});

window.addEventListener('mousemove', (e) => {
  if (devState.enabled && devState.freecam && devState.lookActive) {
    devState.lookYaw -= e.movementX * 0.003;
    devState.lookPitch -= e.movementY * 0.003;
    devState.lookPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, devState.lookPitch));
  }
});

renderer.domElement.addEventListener('click', (e) => {
  if (!devState.enabled) return;
  if (devState.freecam && devState.lookActive) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseNdc, camera);
  const point = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, point)) {
    // try selecting existing
    const nearResource = resourceManager.findNearest(point, 1.5);
    const nearPrefab = findNearestPrefab(point, 1.5);
    const pick = chooseNearest(point, nearResource, nearPrefab);
    if (pick) {
      devState.selected = pick;
      syncSelectionUI();
      return;
    }
    // otherwise place new
    if (devState.placing === 'none') return;
    if (devState.placing.endsWith('.glb')) {
      const id = `prefab-${Date.now()}`;
      placePrefab(devState.placing, point.clone(), id, 1);
      devState.prefabPlacements.push({ id, path: devState.placing, x: point.x, z: point.z, scale: 1 });
      devState.selected = { kind: 'prefab', id };
      syncSelectionUI();
      saveState();
      return;
    }
    const nodeId = `dev-${Date.now()}`;
    resourceManager.addResources('dev', [
      { type: devState.placing || 'wood', position: point.clone(), id: nodeId, scale: 1 },
    ]);
    devState.devPlacements.push({ id: nodeId, type: devState.placing || 'wood', x: point.x, z: point.z, scale: 1 });
    devState.selected = { kind: 'resource', id: nodeId };
    syncSelectionUI();
    saveState();
  }
});
startBtn.addEventListener('click', () => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  if (devState.enabled) {
    mapManager.unlockAll();
  }
  isRunning = true;
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (!isRunning) return;

  if (devState.freecam) {
    updateFreecam(delta);
  } else {
    player.setBounds(mapManager.getPlayableBounds());
    player.update(delta);
  }

  mapManager.update(delta);
  resourceManager.update(delta, player.getPosition());

  renderer.render(scene, camera);
}

animate();

function syncSelectionUI(node) {
  let label = 'None';
  let scale = 1;
  if (node) {
    if (node.kind === 'resource') {
      const n = node.ref;
      label = `${n.type} (${n.id.slice(0, 6)})`;
      scale = n.mesh.scale.x || 1;
    } else if (node.kind === 'prefab') {
      label = `Prefab (${node.id.slice(0, 6)})`;
      scale = node.scale || 1;
    }
    devState.selected = { kind: node.kind, id: node.id };
  } else if (devState.selected) {
    if (devState.selected.kind === 'resource') {
      const n = resourceManager.nodes.find((x) => x.id === devState.selected.id);
      if (n) {
        label = `${n.type} (${n.id.slice(0, 6)})`;
        scale = n.mesh.scale.x || 1;
      }
    } else if (devState.selected.kind === 'prefab') {
      const p = getPrefabById(devState.selected.id);
      if (p) {
        label = `Prefab (${p.id.slice(0, 6)})`;
        scale = p.scale || 1;
      }
    }
  }
  selName.textContent = label;
  selScale.value = scale;
  selScaleValue.textContent = Number(scale).toFixed(2);
}

function saveState() {
  const state = {
    resources: { ...resources },
    quests: questManager.exportState(),
    devPlacements: devState.devPlacements,
    removedNodes: devState.removedNodes,
    prefabs: devState.prefabPlacements,
  };
  try {
    localStorage.setItem('verdale_state', JSON.stringify(state));
  } catch (err) {
    // ignore
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem('verdale_state');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

// Prefab helpers
function placePrefab(path, position, id, scale = 1) {
  // Instant placeholder
  const ph = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff99cc, roughness: 0.6 })
  );
  ph.position.copy(position);
  ph.scale.setScalar(scale);
  ph.userData.id = id;
  ph.userData.kind = 'prefab';
  alignObjectToGround(ph, 0);
  scene.add(ph);

  loadPrefab(path)
    .then((scene) => {
      const inst = scene.clone(true);
      inst.position.copy(position);
      inst.scale.setScalar(scale);
      inst.traverse((c) => {
        if (!c.isMesh) return;
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material.clone();
        }
      });
      inst.userData.id = id;
      inst.userData.kind = 'prefab';
      alignObjectToGround(inst, 0);
      // replace placeholder
      if (ph.parent) ph.parent.remove(ph);
      scene.add(inst);
    })
    .catch(() => {
      // keep placeholder
    });
}

function loadPrefab(path) {
  if (!loadPrefab.cache) loadPrefab.cache = new Map();
  if (loadPrefab.cache.has(path)) return loadPrefab.cache.get(path);
  const p = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => {
        console.warn('Failed to load prefab', path, err);
        // fallback placeholder box
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0xff66aa, roughness: 0.6 })
        );
        resolve(box);
      }
    );
  });
  loadPrefab.cache.set(path, p);
  return p;
}

function getPrefabById(id) {
  return devState.prefabPlacements.find((p) => p.id === id);
}

function setPrefabScale(id, scale) {
  const p = getPrefabById(id);
  if (!p) return;
  p.scale = scale;
  const obj = findPrefabObject(id);
  if (obj) {
    obj.scale.setScalar(scale);
    alignObjectToGround(obj, 0);
  }
}

function removePrefab(id) {
  const obj = findPrefabObject(id);
  if (obj && obj.parent) {
    obj.parent.remove(obj);
  }
}

function findPrefabObject(id) {
  let found = null;
  scene.traverse((child) => {
    if (child.userData && child.userData.id === id && child.userData.kind === 'prefab') {
      found = child;
    }
  });
  return found;
}

function findNearestPrefab(point, maxDist = 2) {
  let nearest = null;
  let best = maxDist;
  scene.traverse((child) => {
    if (!child.userData || child.userData.kind !== 'prefab' || !child.userData.id) return;
    const box = new THREE.Box3().setFromObject(child);
    const center = box.getCenter(new THREE.Vector3());
    const d = Math.hypot(point.x - center.x, point.z - center.z);
    if (d < best) {
      best = d;
      nearest = { kind: 'prefab', id: child.userData.id, scale: child.scale?.x || 1, ref: child, position: center };
    }
  });
  return nearest;
}

function chooseNearest(point, resNode, prefabNode) {
  const distRes = resNode ? point.distanceTo(resNode.mesh.position) : Infinity;
  const distPrefab = prefabNode && prefabNode.position ? Math.hypot(point.x - prefabNode.position.x, point.z - prefabNode.position.z) : Infinity;
  if (distRes < distPrefab) {
    return resNode ? { kind: 'resource', id: resNode.id, ref: resNode } : null;
  }
  if (prefabNode) return { kind: 'prefab', id: prefabNode.id, scale: prefabNode.scale, ref: prefabNode.ref };
  return null;
}

function alignObjectToGround(obj, targetY = 0, margin = 0.02) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const lift = targetY - box.min.y + margin;
  if (isFinite(lift)) {
    obj.position.y += lift;
    obj.updateMatrixWorld(true);
  }
}
