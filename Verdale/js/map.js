import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class MapManager {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.tiles = new Map();
    this.unlocking = [];
    this.loader = new GLTFLoader();
    this.modelCache = new Map();
    this.island = null;
    this.water = null;
    this.river = null;
    this.mountains = [];
    this.tileDefs = this.createTileDefinitions();
  }

  createTileDefinitions() {
    return {
      tile1: {
        id: 'tile1',
        isUnlocked: true,
        size: 18,
        color: 0xd4b178,
        position: new THREE.Vector3(0, 0, 0),
        connectsTo: null,
        resourceSpawns: [
          { type: 'wood', position: new THREE.Vector3(-5, 0, -2), scale: 1.2 },
          { type: 'wood', position: new THREE.Vector3(4, 0, -5), scale: 1.4 },
          { type: 'stone', position: new THREE.Vector3(2, 0, 4), scale: 0.9 },
          { type: 'wood', position: new THREE.Vector3(-2, 0, 5), scale: 1.1 },
        ],
        decos: [
          { path: './3dmodels/building/tente.glb', position: new THREE.Vector3(0, 0, -5), scale: 0.6, ry: Math.PI * 0.2 },
          { path: './3dmodels/building/bateau.glb', position: new THREE.Vector3(-10, 0, 9), scale: 0.42, ry: -Math.PI / 2 },
        ],
      },
      tile2: {
        id: 'tile2',
        isUnlocked: false,
        size: 16,
        color: 0x49a86f,
        position: new THREE.Vector3(20, 0, 2),
        connectsTo: 'tile1',
        resourceSpawns: [
          { type: 'wood', position: new THREE.Vector3(18, 0, -2), scale: 1.3 },
          { type: 'wood', position: new THREE.Vector3(22, 0, -4), scale: 1.2 },
          { type: 'stone', position: new THREE.Vector3(20, 0, 3), scale: 0.9 },
          { type: 'stone', position: new THREE.Vector3(23, 0, 5), scale: 0.8 },
        ],
        decos: [
          { path: './3dmodels/building/Blueberry_house.glb', position: new THREE.Vector3(20, 0, 0), scale: 0.6, ry: Math.PI * 0.15 },
        ],
      },
      tile3: {
        id: 'tile3',
        isUnlocked: false,
        size: 18,
        color: 0x4f9fb3,
        position: new THREE.Vector3(40, 0, -2),
        connectsTo: 'tile2',
        resourceSpawns: [
          { type: 'gold', position: new THREE.Vector3(40, 0, -4), scale: 0.9 },
          { type: 'gold', position: new THREE.Vector3(42, 0, 2), scale: 0.9 },
          { type: 'stone', position: new THREE.Vector3(38, 0, 4), scale: 0.8 },
          { type: 'wood', position: new THREE.Vector3(44, 0, -1), scale: 1.1 },
        ],
        decos: [
          { path: './3dmodels/building/storage.glb', position: new THREE.Vector3(40, 0, 0), scale: 0.55, ry: -Math.PI / 4 },
          { path: './3dmodels/building/woodworkshop.glb', position: new THREE.Vector3(36, 0, -6), scale: 0.5, ry: Math.PI / 6 },
        ],
      },
      tile4: {
        id: 'tile4',
        isUnlocked: false,
        size: 20,
        color: 0x46b8a6,
        position: new THREE.Vector3(20, 0, -20),
        connectsTo: 'tile2',
        resourceSpawns: [
          { type: 'stone', position: new THREE.Vector3(18, 0, -22), scale: 0.8 },
          { type: 'gold', position: new THREE.Vector3(24, 0, -18), scale: 0.9 },
          { type: 'wood', position: new THREE.Vector3(22, 0, -24), scale: 1.0 },
        ],
        decos: [
          { path: './3dmodels/building/fishworkshop.glb', position: new THREE.Vector3(20, 0, -20), scale: 0.55, ry: Math.PI * 0.35 },
          { path: './3dmodels/building/tente.glb', position: new THREE.Vector3(16, 0, -16), scale: 0.5, ry: 0 },
        ],
      },
    };
  }

  init(devForceUnlock = false) {
    this.buildIsland();
    this.buildTile(this.tileDefs.tile1);
    if (devForceUnlock) {
      this.unlockAll();
    }
  }

  buildTile(def, initialScale) {
    const group = new THREE.Group();
    const tileHeight = 0.6;
    const baseGeo = new THREE.BoxGeometry(def.size, tileHeight, def.size);
    const baseMat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.85,
      metalness: 0.03,
      transparent: true,
      opacity: 0.01,
      depthWrite: false,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = tileHeight / 2;
    group.add(base);

    // edges hidden for organic look

    group.position.copy(def.position);
    group.userData.id = def.id;

    const targetScale = typeof initialScale === 'number' ? initialScale : def.isUnlocked ? 1 : 0.01;
    group.scale.setScalar(targetScale);
    this.scene.add(group);

    this.tiles.set(def.id, { ...def, mesh: group, isUnlocked: def.isUnlocked });

    if (def.isUnlocked) {
      this.resourceManager.addResources(def.id, def.resourceSpawns);
      this.spawnDecorations(def);
    }
  }

  unlockTile(tileId) {
    const def = this.tileDefs[tileId];
    if (!def) return;
    const existing = this.tiles.get(tileId);
    if (existing && existing.isUnlocked) return;

    def.isUnlocked = true;
    this.buildTile(def, 0.01);
    const tile = this.tiles.get(tileId);
    this.unlocking.push({ mesh: tile.mesh, elapsed: 0, duration: 0.6 });
    this.createBridge(def);
    this.spawnDecorations(def);
  }

  createBridge(def) {
    // bridges hidden for organic layout
    return;
  }

  update(delta) {
    this.unlocking = this.unlocking.filter((u) => {
      u.elapsed += delta;
      const t = Math.min(1, u.elapsed / u.duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      u.mesh.scale.setScalar(eased);
      u.mesh.position.y = Math.sin(eased * Math.PI) * 0.3;
      return t < 1;
    });
  }

  getPlayableBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    this.tiles.forEach((tile) => {
      if (!tile.isUnlocked) return;
      const half = tile.size / 2;
      minX = Math.min(minX, tile.position.x - half);
      maxX = Math.max(maxX, tile.position.x + half);
      minZ = Math.min(minZ, tile.position.z - half);
      maxZ = Math.max(maxZ, tile.position.z + half);
    });

    if (!isFinite(minX)) {
      return { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    }

    return { minX, maxX, minZ, maxZ };
  }

  unlockAll() {
    Object.values(this.tileDefs).forEach((def) => {
      if (def.isUnlocked) return;
      def.isUnlocked = true;
      this.buildTile(def, 0.5);
      const tile = this.tiles.get(def.id);
      this.unlocking.push({ mesh: tile.mesh, elapsed: 0, duration: 0.4 });
      this.createBridge(def);
      this.spawnDecorations(def);
    });
  }

  buildIsland() {
    const size = 110;
    const segments = 120;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + z * z) / (size * 0.5);
      const mask = Math.max(0, 1 - Math.pow(r, 1.35));
      const noise = (Math.sin(x * 0.22) + Math.cos(z * 0.24) + Math.sin((x + z) * 0.15)) * 0.45;
      const height = mask * (noise * 0.5 + Math.sin(r * Math.PI) * 1.4);
      pos.setY(i, height);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xa6d6a1,
      roughness: 0.85,
      metalness: 0.02,
    });
    this.island = new THREE.Mesh(geo, mat);
    this.island.rotation.x = -Math.PI / 2;
    this.island.receiveShadow = true;
    this.island.castShadow = true;
    this.scene.add(this.island);

    const waterGeo = new THREE.CircleGeometry(size * 0.9, 96);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x63b3ff,
      opacity: 0.65,
      transparent: true,
      roughness: 0.2,
      metalness: 0.1,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -0.5;
    this.water.receiveShadow = false;
    this.scene.add(this.water);

    this.buildMountains();
    this.buildRiver();
  }

  buildMountains() {
    const spots = [new THREE.Vector3(-12, 0, 10), new THREE.Vector3(14, 0, -12), new THREE.Vector3(5, 0, 18)];
    spots.forEach((p, idx) => {
      const geo = new THREE.ConeGeometry(3 + idx, 6 + idx, 6 + idx * 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.95 });
      const c = new THREE.Mesh(geo, mat);
      c.position.copy(p);
      c.position.y = 3 + idx * 0.4;
      c.castShadow = true;
      c.receiveShadow = true;
      this.scene.add(c);
      this.mountains.push(c);
    });
  }

  buildRiver() {
    const pts = [
      new THREE.Vector3(-40, 0, 14),
      new THREE.Vector3(-18, 0, 8),
      new THREE.Vector3(5, 0, 4),
      new THREE.Vector3(26, 0, -4),
      new THREE.Vector3(46, 0, -18),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 80, 0.9, 8, false);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4da6ff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.15,
      metalness: 0.05,
    });
    this.river = new THREE.Mesh(geo, mat);
    this.river.rotation.x = Math.PI / 2;
    this.river.position.y = 0.05;
    this.river.castShadow = false;
    this.river.receiveShadow = false;
    this.scene.add(this.river);
  }

  async spawnDecorations(def) {
    if (!def.decos || !def.decos.length) return;
    const promises = def.decos.map(async (d) => {
      const scene = await this.loadModel(d.path);
      const inst = scene.clone(true);
      inst.scale.setScalar(d.scale || 1);
      inst.position.copy(d.position);
      inst.position.y = 0;
      if (d.ry) inst.rotation.y = d.ry;
      inst.traverse((c) => {
        if (!c.isMesh) return;
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material.clone();
        }
      });
      this.alignDecoration(inst, 0);
      this.scene.add(inst);
    });
    await Promise.all(promises);
  }

  alignDecoration(obj, targetY = 0, margin = 0.02) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const lift = targetY - box.min.y + margin;
    if (isFinite(lift)) {
      obj.position.y += lift;
      obj.updateMatrixWorld(true);
    }
  }

  async loadModel(path) {
    if (this.modelCache.has(path)) return this.modelCache.get(path);
    const promise = new Promise((resolve, reject) => {
      this.loader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
    });
    this.modelCache.set(path, promise);
    return promise;
  }
}
