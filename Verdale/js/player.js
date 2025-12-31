import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.speed = 6;
    this.bounds = { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    this.direction = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.keys = new Set();

    this.skinPaths = ['./3dmodels/character/irongirl.glb'];
    this.skinIndex = 0;
    this.placeholder = null;
    this.wrapper = null;
    this.defaultScale = 1;
    this.obstacleProvider = null;

    this.loader = new GLTFLoader();
    this.mesh = this.createMesh();
    scene.add(this.mesh);

    this.shadow = this.createShadow();
    scene.add(this.shadow);

    this.cameraOffset = new THREE.Vector3(16, 16, 16);
    this.tmpForward = new THREE.Vector3();
    this.tmpRight = new THREE.Vector3();
    this.tmpMove = new THREE.Vector3();

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  createMesh() {
    const group = new THREE.Group();
    const placeholder = this.createPlaceholder();
    this.placeholder = placeholder;
    group.add(placeholder);
    group.position.set(0, 0, 0);

    this.loadCharacterModel(group, placeholder);
    return group;
  }

  createPlaceholder() {
    const bodyGeo = new THREE.BoxGeometry(1, 1.6, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.4,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.y = 0.8;

    const headGeo = new THREE.BoxGeometry(0.9, 0.6, 0.9);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff1c1 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = true;
    head.position.y = 1.55;

    const group = new THREE.Group();
    group.add(body);
    group.add(head);
    return group;
  }

  async loadCharacterModel(container, placeholder) {
    if (this.wrapper) {
      container.remove(this.wrapper);
      this.wrapper = null;
    }

    const ordered = [];
    for (let i = 0; i < this.skinPaths.length; i++) {
      ordered.push(this.skinPaths[(this.skinIndex + i) % this.skinPaths.length]);
    }

    for (const path of ordered) {
      try {
        const gltf = await this.loadGltf(path);
        const model = gltf.scene.clone(true);
        const wrapper = new THREE.Group();
        wrapper.add(model);
        const ok = this.prepareCharacter(wrapper, model);
        container.add(wrapper);
        this.wrapper = wrapper;
        if (ok) {
          if (placeholder && container.children.includes(placeholder)) {
            container.remove(placeholder);
          }
          return;
        }
      } catch (err) {
        // try next
      }
    }
  }

  loadGltf(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  prepareCharacter(wrapper, model) {
    // Respect original transforms from the GLB, just measure then rescale.
    model.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3();
    let hasMesh = false;
    model.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      child.updateWorldMatrix(true, false);
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      const cbox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
      if (!hasMesh) {
        bbox.copy(cbox);
        hasMesh = true;
      } else {
        bbox.union(cbox);
      }
    });

    if (!hasMesh) return false;

    // Anchor feet: move so lowest point sits at y=0 before scaling
    model.position.y -= bbox.min.y;
    model.updateWorldMatrix(true, true);

    // Recompute after anchoring
    const anchoredBox = new THREE.Box3().setFromObject(model);
    const size = anchoredBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.0001);

    // Fixed tiny scale so giant models become small but visible
    const targetHeight = 1.6;
    const rawScale = targetHeight / maxDim;
    const scale = Math.min(0.01, rawScale, 1 / maxDim);
    this.defaultScale = scale;
    this.applyWrapperScale(scale);

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone();
      }
    });

    return true;
  }

  applyWrapperScale(scale) {
    if (!this.wrapper) return;
    this.wrapper.scale.setScalar(scale);
    this.wrapper.position.set(0, 0, 0);
    this.wrapper.updateMatrixWorld(true);
    this.alignWrapperToGround();
  }

  alignWrapperToGround() {
    if (!this.wrapper) return;
    const finalBox = new THREE.Box3().setFromObject(this.wrapper);
    const groundY = 0.6; // tile top height (tile box height is 0.6)
    const lift = groundY - finalBox.min.y + 0.05; // small margin above tile
    if (isFinite(lift)) {
      this.wrapper.position.y += lift;
      this.wrapper.updateMatrixWorld(true);
    }
  }

  setDebugScale(scale) {
    this.applyWrapperScale(scale);
  }

  resetScale() {
    this.applyWrapperScale(this.defaultScale || 1);
  }

  getDebugScale() {
    if (!this.wrapper) return this.defaultScale || 1;
    return this.wrapper.scale.x;
  }

  cycleSkin(direction = 1) {
    const len = this.skinPaths.length;
    this.skinIndex = (this.skinIndex + direction + len) % len;
    this.loadCharacterModel(this.mesh, this.placeholder);
  }

  getCurrentSkinName() {
    const path = this.skinPaths[this.skinIndex] || '';
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  setObstacleProvider(fn) {
    this.obstacleProvider = fn;
  }

  createShadow() {
    const geo = new THREE.CircleGeometry(0.8, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(geo, mat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    shadow.renderOrder = 1;
    return shadow;
  }

  onKeyDown(event) {
    this.keys.add(event.key.toLowerCase());
  }

  onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  setBounds(bounds) {
    if (!bounds) return;
    this.bounds = bounds;
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  update(delta) {
    this.direction.set(0, 0, 0);

    const forwardKeys = ['w', 'arrowup', 'z'];
    const backKeys = ['s', 'arrowdown'];
    const leftKeys = ['a', 'arrowleft', 'q'];
    const rightKeys = ['d', 'arrowright'];

    if (forwardKeys.some((k) => this.keys.has(k))) this.direction.z += 1;
    if (backKeys.some((k) => this.keys.has(k))) this.direction.z -= 1;
    if (leftKeys.some((k) => this.keys.has(k))) this.direction.x -= 1;
    if (rightKeys.some((k) => this.keys.has(k))) this.direction.x += 1;

    if (this.direction.lengthSq() > 0) {
      // Make movement relative to camera yaw (forward = camera look on XZ)
      this.direction.normalize();

      this.camera.getWorldDirection(this.tmpForward);
      this.tmpForward.y = 0;
      if (this.tmpForward.lengthSq() < 0.0001) this.tmpForward.set(0, 0, -1);
      this.tmpForward.normalize();
      this.tmpRight.crossVectors(this.tmpForward, new THREE.Vector3(0, 1, 0)).normalize();

      this.tmpMove
        .copy(this.tmpForward)
        .multiplyScalar(this.direction.z)
        .add(this.tmpRight.clone().multiplyScalar(this.direction.x));

      this.velocity.copy(this.tmpMove.normalize()).multiplyScalar(this.speed * delta);
      const nextPos = this.mesh.position.clone().add(this.velocity);

      // Obstacle collision push
      if (this.obstacleProvider) {
        const obstacles = this.obstacleProvider() || [];
        obstacles.forEach((obs) => {
          if (!obs || !obs.position || !obs.radius) return;
          const dir = nextPos.clone().sub(obs.position);
          const dist = dir.length();
          const minDist = obs.radius + 0.5; // tighter player radius
          if (dist < minDist) {
            if (dist < 0.0001) dir.set(1, 0, 0);
            dir.normalize();
            const push = minDist - dist + 0.02;
            nextPos.add(dir.multiplyScalar(push));
          }
        });
      }

      this.mesh.position.copy(nextPos);

      const angle = Math.atan2(this.tmpMove.x, this.tmpMove.z);
      this.mesh.rotation.y = angle;
    }

    // Collision: clamp to unlocked tile bounds
    this.mesh.position.x = Math.min(
      this.bounds.maxX,
      Math.max(this.bounds.minX, this.mesh.position.x)
    );
    this.mesh.position.z = Math.min(
      this.bounds.maxZ,
      Math.max(this.bounds.minZ, this.mesh.position.z)
    );

    const surfaceY = 0.6; // top of tile height

    // Keep shadow under the player
    this.shadow.position.x = this.mesh.position.x;
    this.shadow.position.z = this.mesh.position.z;
    this.shadow.position.y = surfaceY + 0.01;

    // Subtle bobbing when moving, anchored to surface
    const isMoving = this.direction.lengthSq() > 0;
    const bob = isMoving ? Math.sin(performance.now() * 0.012) * 0.05 : 0;
    this.mesh.position.y = surfaceY + bob;
    this.shadow.material.opacity = isMoving ? 0.32 : 0.38;

    this.updateCamera();
  }

  updateCamera() {
    const target = this.mesh.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(target, 0.08);
    this.camera.lookAt(this.mesh.position.x, 0, this.mesh.position.z);
  }
}
