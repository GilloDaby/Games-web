import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const HARVEST_RANGE = 2.4;

export class ResourceManager {
  constructor(scene, onCollect) {
    this.scene = scene;
    this.onCollect = onCollect;
    this.nodes = [];
    this.particles = [];
    this.wantHarvest = false;
    this.loader = new GLTFLoader();
    this.modelCache = new Map();
  }

  requestHarvest() {
    this.wantHarvest = true;
  }

  addResources(tileId, spawns) {
    spawns.forEach((spawn) => {
      const mesh = this.createNodeMesh(spawn.type);
      mesh.position.copy(spawn.position);
      if (spawn.scale) {
        mesh.scale.setScalar(spawn.scale);
      }
      // Tile top is ~0.6; lift to sit above the tile surface
      this.alignToGround(mesh, 0.6, 0.05);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.nodes.push({
        tileId,
        type: spawn.type,
        mesh,
        radius: this.getRadiusForType(spawn.type) * (spawn.scale || 1),
        collected: false,
        targetScale: 1,
        baseScale: spawn.scale || mesh.scale.x || 1,
        id: spawn.id || crypto.randomUUID?.() || `node-${Date.now()}-${Math.random()}`,
      });
    });
  }

  createNodeMesh(type) {
    const group = new THREE.Group();
    group.add(this.createPlaceholder(type));

    const path = this.getModelPath(type);
    if (path) {
      this.loadModel(path)
        .then((scene) => {
          const instance = scene.clone(true);
          this.prepareInstance(instance, type);
          group.add(instance);
          if (group.children.length > 1) {
            group.remove(group.children[0]);
          }
          this.alignToGround(group, 0.6, 0.05);
        })
        .catch(() => {
          // keep placeholder on error
        });
    }

    return group;
  }

  createPlaceholder(type) {
    if (type === 'wood') return this.createTree();
    if (type === 'stone') return this.createRock();
    return this.createCrystal();
  }

  createTree() {
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.6;

    const crownGeo = new THREE.SphereGeometry(0.8, 10, 10);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x3fa56a, roughness: 0.4 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 1.4;

    const group = new THREE.Group();
    group.add(trunk);
    group.add(crown);
    group.scale.setScalar(2); // trees twice as big
    return group;
  }

  createRock() {
    const geo = new THREE.DodecahedronGeometry(0.9);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9a9fb1, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.9;
    const s = 0.7;
    mesh.scale.set(1 * s, 0.8 * s, 1 * s); // rocks smaller
    return mesh;
  }

  createCrystal() {
    const geo = new THREE.OctahedronGeometry(0.8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf8d25c,
      emissive: 0xcc8b2f,
      roughness: 0.2,
      metalness: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.9;
    return mesh;
  }

  update(delta, playerPos) {
    if (!playerPos) return;

    let closest = null;
    let closestDist = Infinity;

    this.nodes.forEach((node) => {
      if (node.collected) return;
      const dist = node.mesh.position.distanceTo(playerPos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
      const highlighted = dist < HARVEST_RANGE + 0.6;
      const highlightScale = highlighted ? 1.08 : 1;
      const target = node.baseScale * highlightScale;
      const targetVec = new THREE.Vector3(target, target, target);
      node.mesh.scale.lerp(targetVec, 0.12);
    });

    if (this.wantHarvest) {
      if (closest && closestDist <= HARVEST_RANGE && !closest.collected) {
        this.collectNode(closest);
      }
      this.wantHarvest = false;
    }

    this.nodes.forEach((node) => {
      if (node.collected && node.animation) {
        node.animation.elapsed += delta;
        const t = node.animation.elapsed / node.animation.duration;
        const scale = THREE.MathUtils.lerp(1, 0.01, t);
        node.mesh.scale.setScalar(scale);
        node.mesh.position.y = Math.max(0, node.mesh.position.y - delta * 1.2);

        if (t >= 1) {
          this.scene.remove(node.mesh);
          node.remove = true;
        }
      }
    });

    this.nodes = this.nodes.filter((node) => !node.remove);

    this.updateParticles(delta);
  }

  collectNode(node) {
    node.collected = true;
    node.animation = { duration: 0.35, elapsed: 0 };
    this.spawnParticles(node.mesh.position.clone(), node.type);

    if (typeof this.onCollect === 'function') {
      this.onCollect(node.type);
    }
  }

  spawnParticles(origin, type) {
    const count = 20;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const color =
      type === 'wood' ? 0x6bcf8c : type === 'stone' ? 0xc4cad6 : 0xffd46c;

    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const speed = 2 + Math.random() * 3;
      dir.multiplyScalar(speed);
      velocities.push(dir);

      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y + 0.6;
      positions[i * 3 + 2] = origin.z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.userData = { velocities, life: 0.75 };
    this.scene.add(points);
    this.particles.push(points);
  }

  updateParticles(delta) {
    this.particles.forEach((p) => {
      const velocities = p.userData.velocities;
      const positions = p.geometry.getAttribute('position');

      for (let i = 0; i < velocities.length; i++) {
        velocities[i].y -= 6 * delta;
        const vx = velocities[i].x * delta;
        const vy = velocities[i].y * delta;
        const vz = velocities[i].z * delta;

        positions.array[i * 3] += vx;
        positions.array[i * 3 + 1] += vy;
        positions.array[i * 3 + 2] += vz;
      }

      positions.needsUpdate = true;
      p.userData.life -= delta;
      p.material.opacity = Math.max(0, p.userData.life);
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        p.remove = true;
      }
    });

    this.particles = this.particles.filter((p) => !p.remove);
  }

  getModelPath(type) {
    if (type === 'wood') return './3dmodels/resource/tree.glb';
    if (type === 'stone') return './3dmodels/resource/rock.glb';
    if (type === 'gold') return './3dmodels/resource/rock.glb';
    return null;
  }

  getRadiusForType(type) {
    if (type === 'wood') return 0.8; // smaller tree collision
    if (type === 'stone') return 0.8;
    if (type === 'gold') return 0.8;
    return 0.8;
  }

  async loadModel(path) {
    if (this.modelCache.has(path)) return this.modelCache.get(path);
    const promise = new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => reject(err)
      );
    });
    this.modelCache.set(path, promise);
    return promise;
  }

  prepareInstance(instance, type) {
    const scaleMap = { wood: 1.6, stone: 0.56, gold: 0.8 }; // wood 2x, stone 0.7x (0.8*0.7)
    const targetScale = scaleMap[type] || 1;
    instance.scale.setScalar(targetScale);

    const box = new THREE.Box3().setFromObject(instance);
    instance.position.y -= box.min.y;

    instance.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone();
        if (type === 'gold') {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m.color) m.color.set(0xffd265);
            if (m.emissive) m.emissive.set(0x9b6a1a);
            if ('metalness' in m) m.metalness = 0.55;
            if ('roughness' in m) m.roughness = 0.35;
          });
        }
      }
    });
  }

  alignToGround(obj, surfaceY = 0.6, margin = 0.05) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const lift = surfaceY - box.min.y + margin;
    if (isFinite(lift)) {
      obj.position.y += lift;
      obj.updateMatrixWorld(true);
    }
  }

  getObstacles() {
    return this.nodes
      .filter((n) => !n.collected)
      .map((n) => ({ position: n.mesh.position, radius: n.radius }));
  }

  findNearest(point, maxDist = 2) {
    let nearest = null;
    let best = maxDist;
    this.nodes.forEach((n) => {
      if (n.collected) return;
      const d = n.mesh.position.distanceTo(point);
      if (d < best) {
        best = d;
        nearest = n;
      }
    });
    return nearest;
  }

  setNodeScale(nodeId, scale) {
    const n = this.nodes.find((x) => x.id === nodeId);
    if (!n) return;
    n.mesh.scale.setScalar(scale);
    n.baseScale = scale;
    n.radius = this.getRadiusForType(n.type) * scale;
    this.alignToGround(n.mesh, 0.6, 0.05);
  }

  removeNode(nodeId) {
    const idx = this.nodes.findIndex((x) => x.id === nodeId);
    if (idx === -1) return;
    const n = this.nodes[idx];
    this.scene.remove(n.mesh);
    this.nodes.splice(idx, 1);
  }

  removeByMatch(matches = [], epsilon = 0.6) {
    if (!Array.isArray(matches) || !matches.length) return;
    const toRemove = new Set();
    this.nodes.forEach((n) => {
      matches.forEach((m) => {
        if (m.id && n.id === m.id) {
          toRemove.add(n.id);
          return;
        }
        if (m.type && m.type !== n.type) return;
        if (m.x === undefined || m.z === undefined) return;
        const d = n.mesh.position.distanceTo(new THREE.Vector3(m.x, n.mesh.position.y, m.z));
        if (d <= (m.epsilon || epsilon)) {
          toRemove.add(n.id);
        }
      });
    });
    if (!toRemove.size) return;
    this.nodes = this.nodes.filter((n) => {
      if (toRemove.has(n.id)) {
        this.scene.remove(n.mesh);
        return false;
      }
      return true;
    });
  }
}
