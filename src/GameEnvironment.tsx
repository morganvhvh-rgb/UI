import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import animalsUrl from '../sprites/animals.png';
import foodUrl from '../sprites/food.png';

type EnvironmentCategory = 'Food' | 'Animals';

const WORLD_SPRITE_NUMBERS: Record<EnvironmentCategory, number> = {
  Food: Math.floor(Math.random() * 25) + 1,
  Animals: Math.floor(Math.random() * 25) + 1,
};

const TREE_POSITIONS = [
  [-4.4, -2.5, 0.95],
  [4.7, -3.8, 1.08],
  [-8.2, 1.2, 1.16],
  [8.5, 2.1, 1.2],
  [-5.8, 4.6, 1.08],
  [5.6, 5.4, 1.12],
  [-6.2, -7.2, 1.18],
  [6.6, -8.5, 1.26],
  [-3.1, -11.2, 1.08],
  [3.8, -13.4, 1.22],
  [-7.2, -13.8, 1.24],
  [7.3, -14.2, 1.2],
  [-1.4, -15.4, 1.14],
  [4.6, -14.8, 1.2],
] as const;

const ROCK_POSITIONS = [
  [-2.8, 2.6, 0.8],
  [2.9, 0.4, 0.65],
  [-4.1, -5.4, 0.9],
  [3.2, -8.7, 0.72],
  [-1.9, -13.8, 0.76],
  [5.7, -11.1, 0.88],
  [-5.8, -18.4, 0.95],
] as const;

function terrainHeight(x: number, z: number) {
  return (
    Math.sin(x * 0.34) * 0.25 +
    Math.cos(z * 0.27) * 0.2 +
    Math.sin((x + z) * 0.18) * 0.12
  );
}

function createGround() {
  const geometry = new THREE.PlaneGeometry(48, 48, 14, 14);
  const positions = geometry.attributes.position;
  const colors: number[] = [];
  const color = new THREE.Color();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    const height = terrainHeight(x, z);
    positions.setZ(index, height);

    const variation = Math.sin(x * 1.7 + z * 0.8) * 0.018;
    color.setHSL(0.31, 0.38, 0.31 + variation);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  );
}

function createPath() {
  const points = [
    { x: -0.72, z: 10, halfWidth: 0.95 },
    { x: -0.1, z: 6, halfWidth: 0.78 },
    { x: -0.42, z: 2, halfWidth: 0.68 },
    { x: 0.48, z: -3, halfWidth: 0.58 },
    { x: -0.08, z: -8, halfWidth: 0.44 },
    { x: 0.38, z: -14, halfWidth: 0.3 },
    { x: 0.1, z: -21, halfWidth: 0.2 },
  ];
  const vertices: number[] = [];
  const indices: number[] = [];

  points.forEach(({ x, z, halfWidth }) => {
    const height = terrainHeight(x, z) + 0.035;
    vertices.push(x - halfWidth, height, z, x + halfWidth, height, z);
  });

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = index * 2;
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color: 0x88734f,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
  );
}

function addTrees(scene: THREE.Scene) {
  const trunkGeometry = new THREE.CylinderGeometry(0.17, 0.28, 2.2, 5, 1);
  const crownGeometry = new THREE.IcosahedronGeometry(1, 0);
  const trunks = new THREE.InstancedMesh(
    trunkGeometry,
    new THREE.MeshLambertMaterial({ color: 0x674631, flatShading: true }),
    TREE_POSITIONS.length,
  );
  const lowerCrowns = new THREE.InstancedMesh(
    crownGeometry,
    new THREE.MeshLambertMaterial({ color: 0x315f3a, flatShading: true }),
    TREE_POSITIONS.length,
  );
  const upperCrowns = new THREE.InstancedMesh(
    crownGeometry,
    new THREE.MeshLambertMaterial({ color: 0x477a42, flatShading: true }),
    TREE_POSITIONS.length,
  );
  const transform = new THREE.Object3D();

  TREE_POSITIONS.forEach(([x, z, scale], index) => {
    const ground = terrainHeight(x, z);
    transform.position.set(x, ground + 1.1 * scale, z);
    transform.rotation.set(0, index * 0.73, 0);
    transform.scale.set(scale, scale, scale);
    transform.updateMatrix();
    trunks.setMatrixAt(index, transform.matrix);

    transform.position.set(x - 0.16 * scale, ground + 2.35 * scale, z);
    transform.rotation.set(index * 0.11, index * 0.61, index * 0.08);
    transform.scale.set(1.05 * scale, 0.88 * scale, 1.02 * scale);
    transform.updateMatrix();
    lowerCrowns.setMatrixAt(index, transform.matrix);

    transform.position.set(x + 0.23 * scale, ground + 3.05 * scale, z - 0.05);
    transform.rotation.set(index * 0.09, index * 0.47, -index * 0.06);
    transform.scale.set(0.82 * scale, 0.9 * scale, 0.78 * scale);
    transform.updateMatrix();
    upperCrowns.setMatrixAt(index, transform.matrix);
  });

  trunks.instanceMatrix.needsUpdate = true;
  lowerCrowns.instanceMatrix.needsUpdate = true;
  upperCrowns.instanceMatrix.needsUpdate = true;
  scene.add(trunks, lowerCrowns, upperCrowns);
}

function addRocks(scene: THREE.Scene) {
  const rocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.42, 0),
    new THREE.MeshLambertMaterial({ color: 0x73766d, flatShading: true }),
    ROCK_POSITIONS.length,
  );
  const transform = new THREE.Object3D();

  ROCK_POSITIONS.forEach(([x, z, scale], index) => {
    transform.position.set(x, terrainHeight(x, z) + 0.2 * scale, z);
    transform.rotation.set(index * 0.37, index * 0.83, index * 0.21);
    transform.scale.set(scale * 1.25, scale * 0.62, scale);
    transform.updateMatrix();
    rocks.setMatrixAt(index, transform.matrix);
  });

  rocks.instanceMatrix.needsUpdate = true;
  scene.add(rocks);
}

function addMountains(scene: THREE.Scene) {
  const geometry = new THREE.ConeGeometry(6.5, 10, 7, 1);
  const material = new THREE.MeshLambertMaterial({ color: 0x647774, flatShading: true });

  [
    [-11, -30, 1.15],
    [-3.5, -33, 0.82],
    [5.5, -31, 1.02],
    [13, -34, 1.22],
    [27, -10, 1.1],
    [-28, -7, 1.2],
    [-14, 20, 1.08],
    [11, 21, 1.18],
  ].forEach(([x, z, scale], index) => {
    const mountain = new THREE.Mesh(geometry, material);
    mountain.position.set(x, 3.5 * scale - 1.1, z);
    mountain.rotation.y = index * 0.54;
    mountain.scale.set(scale, scale, scale * 0.72);
    scene.add(mountain);
  });
}

function createClouds() {
  const group = new THREE.Group();
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xd6ddcf, fog: true });

  [
    [-5.5, 8.4, -17, 1.2],
    [3.7, 9.5, -22, 0.9],
    [8.2, 7.7, -18, 0.72],
    [-7.8, 8.8, 9, 0.82],
    [5.4, 9.2, 12, 1.05],
  ].forEach(([x, y, z, scale], cloudIndex) => {
    for (let part = 0; part < 3; part += 1) {
      const cloud = new THREE.Mesh(geometry, material);
      cloud.position.set(x + part * 1.15 * scale, y + (part % 2) * 0.22, z);
      cloud.rotation.set(part * 0.4, cloudIndex * 0.7, 0);
      cloud.scale.set(1.15 * scale, 0.52 * scale, 0.62 * scale);
      group.add(cloud);
    }
  });

  return group;
}

function addBox(
  parent: THREE.Object3D,
  geometry: THREE.BoxGeometry,
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
  rotationY = 0,
) {
  const box = new THREE.Mesh(geometry, material);
  box.position.set(...position);
  box.rotation.y = rotationY;
  box.scale.set(...size);
  parent.add(box);
  return box;
}

function addShopShelf(
  scene: THREE.Scene,
  boxGeometry: THREE.BoxGeometry,
  woodMaterial: THREE.Material,
  x: number,
  z: number,
  rotationY: number,
  width: number,
) {
  const shelf = new THREE.Group();
  shelf.position.set(x, 0, z);
  shelf.rotation.y = rotationY;

  [0.45, 1.25, 2.05, 2.85].forEach((height) => {
    addBox(shelf, boxGeometry, woodMaterial, [width, 0.13, 0.72], [0, height, 0]);
  });
  [-width / 2 + 0.1, width / 2 - 0.1].forEach((postX) => {
    addBox(shelf, boxGeometry, woodMaterial, [0.16, 3, 0.18], [postX, 1.5, 0]);
  });

  scene.add(shelf);
}

function addDisplayTable(
  scene: THREE.Scene,
  boxGeometry: THREE.BoxGeometry,
  woodMaterial: THREE.Material,
  accentMaterial: THREE.Material,
  x: number,
  z: number,
) {
  addBox(scene, boxGeometry, woodMaterial, [2.65, 0.16, 1.35], [x, 1.05, z]);
  addBox(scene, boxGeometry, accentMaterial, [2.15, 0.86, 0.95], [x, 0.55, z]);
}

function createShop(scene: THREE.Scene) {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xc8b99d, flatShading: true });
  const lowerWallMaterial = new THREE.MeshLambertMaterial({ color: 0x61736a, flatShading: true });
  const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x76543c, flatShading: true });
  const accentMaterial = new THREE.MeshLambertMaterial({ color: 0x9b654e, flatShading: true });
  const counterMaterial = new THREE.MeshLambertMaterial({ color: 0x536962, flatShading: true });

  const lightTiles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.43, 0.06, 1.43),
    new THREE.MeshLambertMaterial({ color: 0xaa987c, flatShading: true }),
    72,
  );
  const darkTiles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.43, 0.06, 1.43),
    new THREE.MeshLambertMaterial({ color: 0x95846d, flatShading: true }),
    72,
  );
  const tileTransform = new THREE.Object3D();
  let lightIndex = 0;
  let darkIndex = 0;

  for (let row = 0; row < 12; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      tileTransform.position.set((column - 5.5) * 1.47, -0.03, (row - 5.5) * 1.47);
      tileTransform.updateMatrix();
      if ((row + column) % 2 === 0) {
        lightTiles.setMatrixAt(lightIndex, tileTransform.matrix);
        lightIndex += 1;
      } else {
        darkTiles.setMatrixAt(darkIndex, tileTransform.matrix);
        darkIndex += 1;
      }
    }
  }
  lightTiles.instanceMatrix.needsUpdate = true;
  darkTiles.instanceMatrix.needsUpdate = true;
  scene.add(lightTiles, darkTiles);

  addBox(scene, boxGeometry, wallMaterial, [18, 5.8, 0.25], [0, 2.9, -8.8]);
  addBox(scene, boxGeometry, wallMaterial, [18, 5.8, 0.25], [0, 2.9, 8.8]);
  addBox(scene, boxGeometry, wallMaterial, [0.25, 5.8, 18], [-8.8, 2.9, 0]);
  addBox(scene, boxGeometry, wallMaterial, [0.25, 5.8, 18], [8.8, 2.9, 0]);

  addBox(scene, boxGeometry, lowerWallMaterial, [18, 0.62, 0.32], [0, 0.31, -8.62]);
  addBox(scene, boxGeometry, lowerWallMaterial, [18, 0.62, 0.32], [0, 0.31, 8.62]);
  addBox(scene, boxGeometry, lowerWallMaterial, [0.32, 0.62, 18], [-8.62, 0.31, 0]);
  addBox(scene, boxGeometry, lowerWallMaterial, [0.32, 0.62, 18], [8.62, 0.31, 0]);

  addShopShelf(scene, boxGeometry, woodMaterial, 0, -7.8, 0, 5.2);
  addShopShelf(scene, boxGeometry, woodMaterial, -7.75, -1.7, Math.PI / 2, 4.2);
  addShopShelf(scene, boxGeometry, woodMaterial, 7.75, -2.1, Math.PI / 2, 4.2);

  addDisplayTable(scene, boxGeometry, woodMaterial, accentMaterial, -1.35, -0.9);
  addDisplayTable(scene, boxGeometry, woodMaterial, accentMaterial, 2.25, -2.5);
  addBox(scene, boxGeometry, counterMaterial, [3.7, 1.15, 1.15], [3.4, 0.58, 4.4]);
  addBox(scene, boxGeometry, woodMaterial, [3.95, 0.16, 1.35], [3.4, 1.18, 4.4]);

  const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8d704a, flatShading: true });
  [
    [-2.15, 1.33, -0.9],
    [-0.55, 1.33, -0.9],
    [1.4, 1.33, -2.5],
    [3.05, 1.33, -2.5],
  ].forEach(([x, y, z], index) => {
    addBox(scene, boxGeometry, crateMaterial, [0.72, 0.42, 0.74], [x, y, z], index * 0.12);
  });
}

function addPaperSprite(
  scene: THREE.Scene,
  category: EnvironmentCategory,
  spriteNumber: number,
  position: THREE.Vector3,
  scale: number,
  shadowHeight: number,
) {
  const columns = 20;
  const rows = category === 'Food' ? 11 : 6;
  const zeroBasedIndex = spriteNumber - 1;
  const texture = new THREE.TextureLoader().load(category === 'Food' ? foodUrl : animalsUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.repeat.set(1 / columns, 1 / rows);
  texture.offset.set(
    (zeroBasedIndex % columns) / columns,
    1 - (Math.floor(zeroBasedIndex / columns) + 1) / rows,
  );

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: true,
    }),
  );
  sprite.position.copy(position);
  sprite.scale.set(scale, scale, 1);
  scene.add(sprite);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(scale * 0.28, 12),
    new THREE.MeshBasicMaterial({ color: 0x172017, transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(position.x, shadowHeight, position.z);
  shadow.scale.set(1.25, 0.55, 1);
  scene.add(shadow);
}

type GameEnvironmentProps = {
  category: EnvironmentCategory;
};

export function GameEnvironment({ category }: GameEnvironmentProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 60);
    let clouds: THREE.Group | null = null;

    if (category === 'Animals') {
      scene.background = new THREE.Color(0x86a9b2);
      scene.fog = new THREE.Fog(0x86a9b2, 17, 39);
      camera.position.set(0, 5.25, 14);

      scene.add(new THREE.HemisphereLight(0xc6dbe0, 0x455034, 2.15));
      const sunlight = new THREE.DirectionalLight(0xffe0ad, 2.35);
      sunlight.position.set(-6, 10, 7);
      scene.add(sunlight);

      scene.add(createGround(), createPath());
      addTrees(scene);
      addRocks(scene);
      addMountains(scene);
      clouds = createClouds();
      scene.add(clouds);

      const animalX = -1.7;
      const animalZ = -3.8;
      const animalGround = terrainHeight(animalX, animalZ);
      addPaperSprite(
        scene,
        category,
        WORLD_SPRITE_NUMBERS.Animals,
        new THREE.Vector3(animalX, animalGround + 0.82, animalZ),
        1.55,
        animalGround + 0.025,
      );
    } else {
      scene.background = new THREE.Color(0x70685b);
      scene.fog = new THREE.Fog(0x70685b, 12, 25);
      camera.position.set(0, 4.2, 7.4);

      scene.add(new THREE.HemisphereLight(0xffead0, 0x463e35, 2.3));
      const shopLight = new THREE.DirectionalLight(0xffd49b, 2.6);
      shopLight.position.set(-4, 9, 5);
      scene.add(shopLight);

      createShop(scene);
      addPaperSprite(
        scene,
        category,
        WORLD_SPRITE_NUMBERS.Food,
        new THREE.Vector3(-1.35, 1.72, -0.9),
        1,
        1.145,
      );
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25) * 0.72);
    renderer.domElement.className = 'environment-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    if (category === 'Animals') {
      controls.target.set(0, 1.15, -5.2);
      controls.minDistance = 17;
      controls.maxDistance = 23;
    } else {
      controls.target.set(0, 1.2, 0);
      controls.minDistance = 6.4;
      controls.maxDistance = 8.2;
    }
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minPolarAngle = category === 'Food' ? Math.PI * 0.34 : Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.rotateSpeed = 0.58;
    controls.zoomSpeed = 0.7;
    controls.update();

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frameId = 0;
    let lastRender = 0;
    const render = (time: number) => {
      frameId = requestAnimationFrame(render);
      if (document.hidden || time - lastRender < 1000 / 30) return;
      lastRender = time;

      const seconds = time * 0.001;
      controls.update();
      if (clouds) clouds.position.x = Math.sin(seconds * 0.055) * 0.45;
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Sprite)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [category]);

  return <div ref={hostRef} className="environment-stage" aria-hidden="true" />;
}
