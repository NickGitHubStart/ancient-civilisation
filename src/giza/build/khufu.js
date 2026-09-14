import * as THREE from "three";
import { toMeters } from "../units.js";

function pyramidGeometry(base, height) {
  const b = base / 2;
  const h = height;
  const pos = new Float32Array([
    -b, 0, -b, b, 0, -b, 0, h, 0,
    b, 0, -b, b, 0, b, 0, h, 0,
    b, 0, b, -b, 0, b, 0, h, 0,
    -b, 0, b, -b, 0, -b, 0, h, 0,
  ]);
  const uvs = new Float32Array([
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

export function makePyramidShell(base, height, material, name) {
  const mesh = new THREE.Mesh(pyramidGeometry(base, height), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(0.6, base * 0.008), height * 0.018, 4),
    material
  );
  cap.rotation.y = Math.PI / 4;
  cap.position.y = height + height * 0.009;
  cap.name = `${name}-pyramidion`;
  const group = new THREE.Group();
  group.add(mesh, cap);
  group.userData.shell = mesh;
  return group;
}

export function makeKhufuExterior(layout, materials) {
  const group = new THREE.Group();
  group.name = "khufu-exterior";

  const shell = makePyramidShell(layout.base, layout.height, materials.casing, "khufu-casing");
  group.add(shell);

  const pave = new THREE.Mesh(
    new THREE.BoxGeometry(layout.base + 26, 0.4, layout.base + 26),
    materials.pavement
  );
  pave.position.y = -0.2;
  pave.receiveShadow = true;
  group.add(pave);

  const northMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.2, 4),
    materials.gold
  );
  northMarker.position.set(0, 1.2, -layout.half - 8);
  group.add(northMarker);

  group.userData.shell = shell.userData.shell;
  group.userData.apex = new THREE.Vector3(0, layout.height, 0);
  return group;
}

export function makeNeighbor(id, spec, materials) {
  const base = toMeters(spec.base);
  const height = toMeters(spec.heightOriginal);
  const group = makePyramidShell(base, height, materials.core, id);
  group.position.set(spec.x, 0, spec.z);
  group.name = id;
  return group;
}
