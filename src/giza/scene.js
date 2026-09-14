import * as THREE from "three";
import { makeMaterials } from "./build/materials.js";
import { makeKhufuExterior, makeNeighbor } from "./build/khufu.js";
import { makeInterior, collectColliders } from "./build/interior.js";
import { createCutaway } from "./cutaway.js";
import { createHotspots } from "./hotspots.js";
import { buildLayout } from "./layout.js";

function desert(size) {
  const g = new THREE.PlaneGeometry(size, size, 40, 40);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 0.01) * 1.4 + Math.cos(y * 0.008) * 1.1);
  }
  g.computeVertexNormals();
  return g;
}

export function createGizaScene(khufu, plateau, hotspotItems) {
  const layout = buildLayout(khufu);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05060a");
  scene.fog = new THREE.FogExp2("#05060a", 0.00115);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.15, 4000);
  camera.position.set(layout.half + 180, layout.height * 0.42, 30);

  const mats = makeMaterials();
  scene.add(new THREE.HemisphereLight("#6a7a90", "#2a2014", 0.55));
  const sun = new THREE.DirectionalLight("#fff1d0", 2.1);
  sun.position.set(220, 280, 140);
  sun.castShadow = false;
  scene.add(sun);
  scene.add(new THREE.AmbientLight("#3a3228", 0.35));

  const ground = new THREE.Mesh(desert(2400), mats.sand);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  scene.add(ground);

  const khufuGroup = new THREE.Group();
  khufuGroup.name = "khufu";
  const exterior = makeKhufuExterior(layout, mats);
  const interior = makeInterior(layout, mats);
  khufuGroup.add(exterior, interior);
  khufuGroup.rotation.y = THREE.MathUtils.degToRad(layout.azimuthDeg);
  scene.add(khufuGroup);

  scene.add(makeNeighbor("khafre", plateau.khafre, mats));
  scene.add(makeNeighbor("menkaure", plateau.menkaure, mats));

  const cutaway = createCutaway(layout, mats.casing);
  const hot = createHotspots(hotspotItems, layout);
  khufuGroup.add(hot.group);

  const colliders = collectColliders(interior);
  colliders.push(ground);

  return {
    scene,
    camera,
    layout,
    cutaway,
    hotspots: hot,
    colliders,
    mats,
  };
}
