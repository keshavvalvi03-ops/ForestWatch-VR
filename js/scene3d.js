/**
 * ForestWatch VR - Three.js 3D Forest Simulator & WebXR Engine
 * Generates procedural terrain, dynamic forest flora, day/night cycles, 
 * interactive tree felling/planting, and WebXR stereoscopic experiences.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

class Forest3DScene {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Environmental Lights
    this.sunLight = null;
    this.hemiLight = null;
    this.ambientLight = null;

    // Collections
    this.trees = []; // array of tree objects
    this.stumps = [];
    this.particles = null;
    this.fireflies = null;
    this.terrainMesh = null;
    this.waterMesh = null;

    // Interaction & Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.activeTool = 'inspect'; // 'inspect', 'fell', 'plant'
    this.activeSpecies = 'teak';

    // State & Animations
    this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    this.clock = new THREE.Clock();
    this.animatingTrees = []; // trees currently falling or growing
    this.isStereoMode = false;
    this.cameraMode = 'orbit'; // 'orbit', 'fps'

    // FPS Walk mode keys
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.fpsVelocity = new THREE.Vector3();

    // Bound methods
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.animate = this.animate.bind(this);
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a2219);
    this.scene.fog = new THREE.FogExp2(0x0a2219, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 600);
    this.camera.position.set(0, 38, 75);

    // 3. Renderer with WebXR
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // WebXR Enablement
    if ('xr' in navigator) {
      this.renderer.xr.enabled = true;
    }

    this.canvas = this.renderer.domElement;
    this.canvas.id = 'forest-canvas';
    this.container.appendChild(this.canvas);

    // 4. Controls (Orbit)
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
      this.controls.minDistance = 8;
      this.controls.maxDistance = 160;
      this.controls.target.set(0, 4, 0);
    }

    // 5. Lighting
    this._setupLighting();

    // 6. Terrain & River
    this._createTerrain();
    this._createRiver();

    // 7. Initial Forest Generation
    this._generateForest(140);

    // 8. Atmospheric Particles
    this._createSporeParticles();
    this._createFireflies();

    // 9. Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this._setupKeyboardControls();

    // 10. Start Render Loop
    this.renderer.setAnimationLoop(this.animate);

    // Hide loading screen
    const loader = document.getElementById('canvas-loader');
    if (loader) loader.classList.add('hidden');

    console.log('ForestWatch VR 3D Scene Initialized.');
  }

  _setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xdcfce7, 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xbbf7d0, 0x14532d, 0.5);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.position.set(65, 75, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  /**
   * Procedural terrain with undulating hills and river valley
   */
  _createTerrain() {
    const size = 180;
    const segments = 64;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // River depression along x-axis curved slightly
      const distToRiver = Math.abs(z - Math.sin(x * 0.04) * 12);
      let y = Math.sin(x * 0.05) * 3 + Math.cos(z * 0.04) * 3.5 + Math.sin((x + z) * 0.08) * 1.5;

      // Carve riverbed
      if (distToRiver < 14) {
        const factor = distToRiver / 14;
        y = y * factor - (1 - factor) * 3.2;
      }

      // Slightly raise outer edges for natural valley bowl
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter > 50) {
        y += (distFromCenter - 50) * 0.15;
      }

      pos.setY(i, y);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1f472e,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'terrain';
    this.scene.add(this.terrainMesh);

    // Add scattered boulders & river rocks
    this._addEnvironmentalBoulders();
  }

  _addEnvironmentalBoulders() {
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x525c56, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 35; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const x = (Math.random() - 0.5) * 140;
      const z = (Math.random() - 0.5) * 140;
      const y = this._getTerrainHeight(x, z);
      rock.position.set(x, y + 0.4, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const scale = 0.5 + Math.random() * 1.2;
      rock.scale.set(scale, scale * 0.7, scale);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  _createRiver() {
    const riverGeo = new THREE.PlaneGeometry(170, 22, 32, 8);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x165b6e,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(riverGeo, riverMat);
    this.waterMesh.position.set(0, -1.8, 0);
    this.waterMesh.receiveShadow = true;
    this.waterMesh.name = 'water';
    this.scene.add(this.waterMesh);
  }

  _getTerrainHeight(x, z) {
    if (!this.terrainMesh) return 0;
    const distToRiver = Math.abs(z - Math.sin(x * 0.04) * 12);
    let y = Math.sin(x * 0.05) * 3 + Math.cos(z * 0.04) * 3.5 + Math.sin((x + z) * 0.08) * 1.5;
    if (distToRiver < 14) {
      const factor = distToRiver / 14;
      y = y * factor - (1 - factor) * 3.2;
    }
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 50) {
      y += (distFromCenter - 50) * 0.15;
    }
    return y;
  }

  /**
   * Builds distinct stylized 3D tree species
   */
  _buildTreeMesh(species = 'teak') {
    const group = new THREE.Group();
    group.castShadow = true;
    group.receiveShadow = true;

    if (species === 'conifer') {
      // Conifer / Pine Tree: Tall tapered trunk + 3 stacked cones
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9, flatShading: true });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8, flatShading: true });
      for (let i = 0; i < 3; i++) {
        const radius = 2.8 - i * 0.6;
        const height = 3.6 - i * 0.4;
        const coneGeo = new THREE.ConeGeometry(radius, height, 7);
        const cone = new THREE.Mesh(coneGeo, leafMat);
        cone.position.y = 4.5 + i * 2.2;
        cone.castShadow = true;
        cone.receiveShadow = true;
        group.add(cone);
      }
    } else if (species === 'fruit') {
      // Biodiversity Flowering/Fruit Tree: Round crown with colorful blossom spheres
      const trunkGeo = new THREE.CylinderGeometry(0.45, 0.7, 4.5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3c1e, roughness: 0.9, flatShading: true });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      group.add(trunk);

      const crownGeo = new THREE.DodecahedronGeometry(3.2, 1);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, flatShading: true });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 5.6;
      crown.castShadow = true;
      crown.receiveShadow = true;
      group.add(crown);

      // Blossoms / Berries
      const blossomMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
      for (let b = 0; b < 12; b++) {
        const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.25, 4, 4), blossomMat);
        blossom.position.set(
          (Math.random() - 0.5) * 4.2,
          5.6 + (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 4.2
        );
        group.add(blossom);
      }
    } else {
      // Default: Native Tropical Broadleaf Oak/Teak
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.85, 5.5, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2612, roughness: 0.9, flatShading: true });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.75;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Multi-cluster canopy
      const leafColors = [0x166534, 0x15803d, 0x22c55e];
      for (let c = 0; c < 3; c++) {
        const leafMat = new THREE.MeshStandardMaterial({
          color: leafColors[c % leafColors.length],
          roughness: 0.75,
          flatShading: true
        });
        const leafGeo = new THREE.IcosahedronGeometry(2.3 + (c === 0 ? 0.7 : 0), 1);
        const foliage = new THREE.Mesh(leafGeo, leafMat);
        foliage.position.set(
          (c === 1 ? 1.4 : c === 2 ? -1.4 : 0),
          6.0 + c * 1.1,
          (c === 1 ? -0.8 : c === 2 ? 0.8 : 0)
        );
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        group.add(foliage);
      }
    }

    return group;
  }

  /**
   * Spawns forest trees avoiding the river center
   */
  _generateForest(count = 140) {
    this.clearTrees();
    const speciesList = ['teak', 'teak', 'conifer', 'fruit'];

    for (let i = 0; i < count; i++) {
      const species = speciesList[Math.floor(Math.random() * speciesList.length)];
      const mesh = this._buildTreeMesh(species);

      // Find position outside deep river
      let x, z, distToRiver;
      let tries = 0;
      do {
        x = (Math.random() - 0.5) * 140;
        z = (Math.random() - 0.5) * 140;
        distToRiver = Math.abs(z - Math.sin(x * 0.04) * 12);
        tries++;
      } while (distToRiver < 9 && tries < 30);

      const y = this._getTerrainHeight(x, z);
      mesh.position.set(x, y, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;

      // Slight scale variance
      const s = 0.8 + Math.random() * 0.45;
      mesh.scale.set(s, s, s);

      mesh.userData = {
        treeId: `tree_${i}`,
        species,
        state: 'healthy', // 'healthy', 'felled'
        baseY: y,
        originalScale: s
      };

      this.scene.add(mesh);
      this.trees.push(mesh);
    }
  }

  clearTrees() {
    this.trees.forEach(t => this.scene.remove(t));
    this.trees = [];
    this.stumps.forEach(s => this.scene.remove(s));
    this.stumps = [];
  }

  /**
   * Creates floating atmospheric spores/dust
   */
  _createSporeParticles() {
    const particleCount = 200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 140;
      positions[i + 1] = 2 + Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 140;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.6,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
  }

  /**
   * Night mode bioluminescent glowing fireflies
   */
  _createFireflies() {
    const count = 90;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = 1.5 + Math.random() * 12;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 1.2,
      transparent: true,
      opacity: 0.0, // hidden in day
      blending: THREE.AdditiveBlending
    });

    this.fireflies = new THREE.Points(geom, mat);
    this.scene.add(this.fireflies);
  }

  /**
   * Interactivity: Mouse movement & Hover Detection
   */
  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Reset previous hover highlight
    if (this.hoveredObject) {
      this._setHighlight(this.hoveredObject, false);
      this.hoveredObject = null;
      this.canvas.style.cursor = 'grab';
    }

    if (intersects.length > 0) {
      const hit = intersects[0];
      const treeGroup = this._findParentTreeGroup(hit.object);

      if (treeGroup && treeGroup.userData.state === 'healthy') {
        this.hoveredObject = treeGroup;
        this.canvas.style.cursor = this.activeTool === 'fell' ? 'crosshair' : 'pointer';
        if (this.activeTool === 'fell') {
          this._setHighlight(treeGroup, true, 0xef4444); // red glow on chop
        } else {
          this._setHighlight(treeGroup, true, 0x34d399); // green info glow
        }
      } else if (hit.object.name === 'terrain' && this.activeTool === 'plant') {
        this.canvas.style.cursor = 'copy';
      }
    }
  }

  _findParentTreeGroup(obj) {
    let curr = obj;
    while (curr && curr.parent && curr !== this.scene) {
      if (curr.userData && curr.userData.treeId) return curr;
      curr = curr.parent;
    }
    return null;
  }

  _setHighlight(group, isHighlighted, hex = 0x34d399) {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        if (isHighlighted) {
          if (!child.userData.origEmissive) {
            child.userData.origEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
          }
          child.material.emissive = new THREE.Color(hex);
        } else {
          if (child.userData.origEmissive !== undefined) {
            child.material.emissive = new THREE.Color(child.userData.origEmissive);
          }
        }
      }
    });
  }

  /**
   * Click Actions: Chop tree or Plant tree
   */
  onPointerDown(e) {
    if (e.button !== 0) return; // Left click only

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const treeGroup = this._findParentTreeGroup(hit.object);

      // Tool 1: Chop / Deforest Tree
      if (this.activeTool === 'fell' && treeGroup && treeGroup.userData.state === 'healthy') {
        this.fellTree(treeGroup);
      }
      // Tool 2: Plant Tree on bare terrain
      else if (this.activeTool === 'plant' && hit.object.name === 'terrain') {
        this.plantTreeAt(hit.point.x, hit.point.z, this.activeSpecies);
      }
      // Tool 3: Inspect Mode (click tree to view quick tooltip or fell if clicked directly)
      else if (this.activeTool === 'inspect' && treeGroup) {
        this.fellTree(treeGroup); // In inspect mode, clicking fells as standard simulation
      }
    }
  }

  /**
   * Animates tree falling, creates stump, triggers audio & updates simulator
   */
  fellTree(treeGroup) {
    if (!treeGroup || treeGroup.userData.state !== 'healthy') return;
    treeGroup.userData.state = 'falling';

    // Play procedural wood crack SFX
    if (window.ForestAudio) {
      window.ForestAudio.playChopSound();
    }

    // Add fallen wood stump at the root base
    const stumpGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.8, 6);
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0x3d2612, roughness: 0.95 });
    const stump = new THREE.Mesh(stumpGeo, stumpMat);
    stump.position.set(treeGroup.position.x, treeGroup.position.y + 0.4, treeGroup.position.z);
    stump.castShadow = true;
    stump.receiveShadow = true;
    this.scene.add(stump);
    this.stumps.push(stump);

    // Animation record
    this.animatingTrees.push({
      type: 'fall',
      mesh: treeGroup,
      progress: 0,
      tiltAxis: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
    });

    // Notify simulator
    if (window.ForestSimulator) {
      window.ForestSimulator.recordTreeFelled();
    }
  }

  /**
   * Plants virtual tree at coordinates with smooth growth animation
   */
  plantTreeAt(x, z, species = 'teak') {
    const y = this._getTerrainHeight(x, z);
    const mesh = this._buildTreeMesh(species);
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.set(0.08, 0.08, 0.08); // start as tiny sapling

    const targetScale = 0.85 + Math.random() * 0.35;
    mesh.userData = {
      treeId: `planted_${Date.now()}_${Math.random()}`,
      species,
      state: 'healthy',
      baseY: y,
      originalScale: targetScale
    };

    this.scene.add(mesh);
    this.trees.push(mesh);

    // Play planting chime SFX
    if (window.ForestAudio) {
      window.ForestAudio.playPlantSound();
    }

    // Growth animation
    this.animatingTrees.push({
      type: 'grow',
      mesh,
      progress: 0,
      targetScale
    });

    // Notify simulator
    if (window.ForestSimulator) {
      window.ForestSimulator.recordTreePlanted();
    }
  }

  /**
   * Batch Reforestation: Drone Seed Bombing
   */
  seedBombDroneReforestation(batchSize = 15) {
    let planted = 0;
    const speciesList = ['teak', 'conifer', 'fruit'];
    const timer = setInterval(() => {
      if (planted >= batchSize) {
        clearInterval(timer);
        return;
      }
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      const dist = Math.abs(z - Math.sin(x * 0.04) * 12);
      if (dist > 8) {
        const spec = speciesList[Math.floor(Math.random() * speciesList.length)];
        this.plantTreeAt(x, z, spec);
        planted++;
      }
    }, 110);
  }

  /**
   * Deforestation slider / scenario synchronization
   */
  syncToTreeCount(targetCount, scenario = '') {
    const activeHealthy = this.trees.filter(t => t.userData.state === 'healthy');
    const diff = activeHealthy.length - targetCount;

    if (diff > 0) {
      // Fell difference
      for (let i = 0; i < diff && i < activeHealthy.length; i++) {
        const target = activeHealthy[i];
        target.userData.state = 'felled';
        this.scene.remove(target);
      }
    } else if (diff < 0) {
      // Spawn extra trees to meet target
      const toSpawn = Math.abs(diff);
      for (let i = 0; i < toSpawn; i++) {
        const x = (Math.random() - 0.5) * 130;
        const z = (Math.random() - 0.5) * 130;
        const dist = Math.abs(z - Math.sin(x * 0.04) * 12);
        if (dist > 9) {
          const mesh = this._buildTreeMesh('teak');
          const y = this._getTerrainHeight(x, z);
          mesh.position.set(x, y, z);
          const s = 0.85 + Math.random() * 0.35;
          mesh.scale.set(s, s, s);
          mesh.userData = { treeId: `sync_${i}`, species: 'teak', state: 'healthy', baseY: y, originalScale: s };
          this.scene.add(mesh);
          this.trees.push(mesh);
        }
      }
    }

    // Apply scenario visual fog/sky modifications
    if (scenario === 'wildfire_clearcut') {
      this.scene.fog.color.setHex(0x382414); // smoky ash brown
      this.renderer.setClearColor(0x2d1b0f);
    } else {
      this.setTimeOfDay(this.timeOfDay); // restore normal atmospheric palette
    }
  }

  resetForest() {
    this._generateForest(140);
    this.setTimeOfDay('day');
  }

  /**
   * Atmosphere: Day / Sunset / Night Toggle
   */
  setTimeOfDay(time) {
    this.timeOfDay = time;
    if (!this.scene) return;

    if (time === 'night') {
      this.scene.background.setHex(0x040d0a);
      this.scene.fog.color.setHex(0x040d0a);
      this.scene.fog.density = 0.016;
      this.ambientLight.color.setHex(0x1e3a2f);
      this.ambientLight.intensity = 0.25;
      this.sunLight.color.setHex(0x93c5fd); // silvery moonlight
      this.sunLight.intensity = 0.45;
      this.sunLight.position.set(-40, 60, -30);
      if (this.fireflies) this.fireflies.material.opacity = 0.85;
      if (this.particles) this.particles.material.opacity = 0.15;
      if (window.ForestAudio) window.ForestAudio.setNightMode(true);
    } else if (time === 'sunset') {
      this.scene.background.setHex(0x2a1708);
      this.scene.fog.color.setHex(0x2a1708);
      this.scene.fog.density = 0.014;
      this.ambientLight.color.setHex(0xf59e0b);
      this.ambientLight.intensity = 0.45;
      this.sunLight.color.setHex(0xfb923c); // golden amber
      this.sunLight.intensity = 1.6;
      this.sunLight.position.set(70, 25, 60);
      if (this.fireflies) this.fireflies.material.opacity = 0.25;
      if (this.particles) this.particles.material.opacity = 0.65;
      if (window.ForestAudio) window.ForestAudio.setNightMode(false);
    } else {
      // Day
      this.scene.background.setHex(0x0a2219);
      this.scene.fog.color.setHex(0x0a2219);
      this.scene.fog.density = 0.012;
      this.ambientLight.color.setHex(0xdcfce7);
      this.ambientLight.intensity = 0.45;
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.35;
      this.sunLight.position.set(65, 75, 45);
      if (this.fireflies) this.fireflies.material.opacity = 0.0;
      if (this.particles) this.particles.material.opacity = 0.55;
      if (window.ForestAudio) window.ForestAudio.setNightMode(false);
    }
  }

  /**
   * Camera Presets
   */
  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;
    switch (preset) {
      case 'canopy':
        this._smoothCameraTransition({ x: 0, y: 55, z: 90 }, { x: 0, y: 5, z: 0 });
        break;
      case 'walk':
        this._smoothCameraTransition({ x: 12, y: 4.5, z: 22 }, { x: 0, y: 4, z: -10 });
        break;
      case 'deforestation_edge':
        this._smoothCameraTransition({ x: -45, y: 15, z: 40 }, { x: 0, y: 4, z: 0 });
        break;
      case 'river':
        this._smoothCameraTransition({ x: 35, y: 7, z: -22 }, { x: -10, y: 0, z: 0 });
        break;
      default:
        this._smoothCameraTransition({ x: 0, y: 38, z: 75 }, { x: 0, y: 4, z: 0 });
    }
  }

  _smoothCameraTransition(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let t = 0;

    const animateCam = () => {
      t += 0.04;
      if (t <= 1) {
        this.camera.position.lerpVectors(startPos, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), t);
        this.controls.target.lerpVectors(startTarget, new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z), t);
        this.controls.update();
        requestAnimationFrame(animateCam);
      }
    };
    animateCam();
  }

  /**
   * Keyboard Controls for First-Person Walk
   */
  _setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
      }
    });
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
      }
    });
  }

  /**
   * WebXR VR Integration
   */
  enterVR() {
    if (!('xr' in navigator)) {
      this._showVRUnsupportedModal('WebXR is not available in your current browser.');
      return;
    }

    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
      if (supported) {
        navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] })
          .then(session => {
            this.renderer.xr.setSession(session);
            this._setupVRControllers();
            console.log('WebXR Immersive VR Session started.');
          })
          .catch(err => {
            console.warn('VR session request error:', err);
            this._showVRUnsupportedModal('Could not establish VR session: ' + err.message);
          });
      } else {
        this._showVRUnsupportedModal('No tethered or standalone VR headset (Meta Quest, Vive, Vision Pro) detected on this hardware.');
      }
    }).catch(err => {
      this._showVRUnsupportedModal('VR Hardware Check Failed: ' + err.message);
    });
  }

  _setupVRControllers() {
    if (!this.renderer.xr) return;
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('select', () => this._onVRSelect(controller));

      // Visual laser pointer ray
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -8)
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x34d399 });
      const ray = new THREE.Line(lineGeo, lineMat);
      controller.add(ray);
      this.scene.add(controller);
    }
  }

  _onVRSelect(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    const ray = new THREE.Raycaster();
    ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    ray.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = ray.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const treeGroup = this._findParentTreeGroup(hit.object);
      if (this.activeTool === 'fell' && treeGroup) {
        this.fellTree(treeGroup);
      } else if (this.activeTool === 'plant' && hit.object.name === 'terrain') {
        this.plantTreeAt(hit.point.x, hit.point.z, this.activeSpecies);
      } else if (treeGroup) {
        this.fellTree(treeGroup);
      }
    }
  }

  _showVRUnsupportedModal(reason) {
    const modal = document.getElementById('vr-modal');
    const msg = document.getElementById('vr-modal-msg');
    if (modal && msg) {
      msg.textContent = reason;
      modal.classList.add('open');
    } else {
      alert(reason + '\n\nYou can still enjoy the full 3D interactive simulator in your browser!');
    }
  }

  /**
   * Main Render Loop
   */
  animate() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Controls update
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    // 2. Keyboard FPS walk motion if keys pressed
    if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const side = new THREE.Vector3();
      side.crossVectors(this.camera.up, forward).normalize();

      const speed = 18 * delta;
      if (this.keys.forward) this.camera.position.addScaledVector(forward, speed);
      if (this.keys.backward) this.camera.position.addScaledVector(forward, -speed);
      if (this.keys.left) this.camera.position.addScaledVector(side, speed);
      if (this.keys.right) this.camera.position.addScaledVector(side, -speed);

      // Keep camera above terrain
      const currentHeight = this._getTerrainHeight(this.camera.position.x, this.camera.position.z);
      this.camera.position.y = Math.max(currentHeight + 3.2, this.camera.position.y);
      if (this.controls) this.controls.target.copy(this.camera.position).add(forward);
    }

    // 3. Gentle wind sway on healthy trees
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i];
      if (tree.userData.state === 'healthy') {
        const sway = Math.sin(elapsedTime * 1.5 + tree.position.x * 0.15) * 0.022;
        tree.rotation.z = sway;
      }
    }

    // 4. Update falling/growing tree animations
    for (let i = this.animatingTrees.length - 1; i >= 0; i--) {
      const anim = this.animatingTrees[i];
      anim.progress += delta * 1.8;

      if (anim.type === 'fall') {
        // Fall tilt animation
        const angle = Math.min(Math.PI / 2, anim.progress * (Math.PI / 2));
        anim.mesh.rotation.x = angle;
        // Fade & shrink slightly into ground
        if (anim.progress >= 1.0) {
          anim.mesh.userData.state = 'felled';
          this.scene.remove(anim.mesh);
          this.animatingTrees.splice(i, 1);
        }
      } else if (anim.type === 'grow') {
        // Growth bounce
        const scaleVal = Math.min(anim.targetScale, (anim.progress * anim.targetScale));
        anim.mesh.scale.set(scaleVal, scaleVal, scaleVal);
        if (anim.progress >= 1.0) {
          anim.mesh.scale.set(anim.targetScale, anim.targetScale, anim.targetScale);
          this.animatingTrees.splice(i, 1);
        }
      }
    }

    // 5. Water shimmer
    if (this.waterMesh) {
      this.waterMesh.material.opacity = 0.82 + Math.sin(elapsedTime * 2) * 0.05;
    }

    // 6. Particles drift
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      for (let i = 1; i < pos.count * 3; i += 3) {
        pos.array[i] += Math.sin(elapsedTime + i) * 0.015;
        if (pos.array[i] > 30) pos.array[i] = 2;
      }
      pos.needsUpdate = true;
    }

    // 7. Fireflies glowing wander
    if (this.fireflies && this.timeOfDay !== 'day') {
      const fpos = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < fpos.count * 3; i += 3) {
        fpos.array[i] += Math.sin(elapsedTime * 1.2 + i) * 0.04;
        fpos.array[i + 1] += Math.cos(elapsedTime * 1.5 + i) * 0.03;
        fpos.array[i + 2] += Math.sin(elapsedTime * 0.8 + i) * 0.04;
      }
      fpos.needsUpdate = true;
    }

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.Forest3D = new Forest3DScene();
