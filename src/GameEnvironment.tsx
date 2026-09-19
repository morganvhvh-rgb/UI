import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TREE_POSITIONS = [
  [-4.4, -2.5, 0.95],
  [4.7, -3.8, 1.08],
  [-6.2, -7.2, 1.18],
  [6.6, -8.5, 1.26],
  [-3.1, -11.2, 1.08],
  [3.8, -13.4, 1.22],
  [-7.5, -15.2, 1.35],
  [7.7, -16.8, 1.32],
  [-1.4, -19.2, 1.16],
  [4.8, -21.5, 1.3],
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

export function GameEnvironment() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x86a9b2);
    scene.fog = new THREE.Fog(0x86a9b2, 17, 39);

    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 60);
    camera.position.set(0, 4.15, 9.5);

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

    scene.add(new THREE.HemisphereLight(0xc6dbe0, 0x455034, 2.15));
    const sunlight = new THREE.DirectionalLight(0xffe0ad, 2.35);
    sunlight.position.set(-6, 10, 7);
    scene.add(sunlight);

    scene.add(createGround(), createPath());
    addTrees(scene);
    addRocks(scene);
    addMountains(scene);
    const clouds = createClouds();
    scene.add(clouds);

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
      camera.position.x = Math.sin(seconds * 0.18) * 0.1;
      camera.position.y = 4.15 + Math.sin(seconds * 0.14) * 0.035;
      camera.lookAt(Math.sin(seconds * 0.12) * 0.08, 1.15, -5.2);
      clouds.position.x = Math.sin(seconds * 0.055) * 0.45;
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="environment-stage" aria-hidden="true" />;
}
