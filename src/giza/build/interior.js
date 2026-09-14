import * as THREE from "three";

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _along = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _mid = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function v(p) {
  return new THREE.Vector3(p.x, p.y, p.z);
}

function collider(mesh) {
  mesh.userData.collider = true;
  mesh.receiveShadow = true;
  return mesh;
}

function frame(from, to) {
  _a.copy(from);
  _b.copy(to);
  _along.subVectors(_b, _a);
  const len = _along.length();
  _along.multiplyScalar(1 / len);
  _right.crossVectors(_along, WORLD_UP);
  if (_right.lengthSq() < 1e-8) _right.set(1, 0, 0);
  else _right.normalize();
  _up.crossVectors(_right, _along).normalize();
  _mid.addVectors(_a, _b).multiplyScalar(0.5);
  return { len, along: _along.clone(), right: _right.clone(), up: _up.clone(), mid: _mid.clone() };
}

function boxAlong(from, to, width, height, material, yShift = 0) {
  const f = frame(from, to);
  const geom = new THREE.BoxGeometry(width, height, f.len);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.copy(f.mid).addScaledVector(f.up, yShift);
  const m = new THREE.Matrix4().makeBasis(f.right, f.up, f.along);
  mesh.quaternion.setFromRotationMatrix(m);
  return collider(mesh);
}

/** Hollow corridor: floor, ceiling, two walls. `height` is perpendicular to the floor. */
export function makePassage(from, to, width, height, mats, wall = 0.45) {
  const group = new THREE.Group();
  const f = frame(from, to);
  const floor = boxAlong(from, to, width + wall * 2, wall, mats.limestone, -height / 2 - wall / 2);
  const ceil = boxAlong(from, to, width + wall * 2, wall, mats.limestone, height / 2 + wall / 2);
  const left = boxAlong(from, to, wall, height, mats.limestone, 0);
  left.position.addScaledVector(f.right, -(width / 2 + wall / 2));
  const right = boxAlong(from, to, wall, height, mats.limestone, 0);
  right.position.addScaledVector(f.right, width / 2 + wall / 2);
  group.add(floor, ceil, left, right);
  group.userData.floor = floor;
  return group;
}

function roomBox({ x, y, z, ew, ns, h }, mats, material, wall = 0.5, open = []) {
  const group = new THREE.Group();
  const inner = { w: ew, d: ns, h };
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(inner.w + wall * 2, wall, inner.d + wall * 2),
    material
  );
  floor.position.set(x, y - wall / 2, z);
  const ceil = floor.clone();
  ceil.position.y = y + h + wall / 2;
  const n = new THREE.Mesh(new THREE.BoxGeometry(inner.w + wall * 2, h, wall), material);
  n.position.set(x, y + h / 2, z - inner.d / 2 - wall / 2);
  const s = n.clone();
  s.position.z = z + inner.d / 2 + wall / 2;
  const e = new THREE.Mesh(new THREE.BoxGeometry(wall, h, inner.d), material);
  e.position.set(x + inner.w / 2 + wall / 2, y + h / 2, z);
  const w = e.clone();
  w.position.x = x - inner.w / 2 - wall / 2;
  const faces = { n, s, e, w };
  group.add(collider(floor), collider(ceil));
  for (const [key, mesh] of Object.entries(faces)) {
    if (!open.includes(key)) group.add(collider(mesh));
  }
  return group;
}

function gableRoof({ x, y, z, ew, ns, wallH, ridgeH }, mats) {
  const group = new THREE.Group();
  const rise = ridgeH - wallH;
  const half = ew / 2;
  const geom = new THREE.BufferGeometry();
  const y0 = y + wallH;
  const y1 = y + ridgeH;
  const pos = new Float32Array([
    x - half, y0, z - ns / 2, x, y1, z - ns / 2, x, y1, z + ns / 2,
    x - half, y0, z - ns / 2, x, y1, z + ns / 2, x - half, y0, z + ns / 2,
    x + half, y0, z - ns / 2, x + half, y0, z + ns / 2, x, y1, z + ns / 2,
    x + half, y0, z - ns / 2, x, y1, z + ns / 2, x, y1, z - ns / 2,
  ]);
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.computeVertexNormals();
  const roof = new THREE.Mesh(geom, mats.limestone);
  group.add(collider(roof));
  const gableGeomN = new THREE.BufferGeometry();
  gableGeomN.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        x - half, y0, z - ns / 2, x + half, y0, z - ns / 2, x, y1, z - ns / 2,
      ]),
      3
    )
  );
  gableGeomN.computeVertexNormals();
  const gableGeomS = new THREE.BufferGeometry();
  gableGeomS.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        x - half, y0, z + ns / 2, x, y1, z + ns / 2, x + half, y0, z + ns / 2,
      ]),
      3
    )
  );
  gableGeomS.computeVertexNormals();
  group.add(
    collider(new THREE.Mesh(gableGeomN, mats.limestone)),
    collider(new THREE.Mesh(gableGeomS, mats.limestone))
  );
  return group;
}

function makeGallery(layout, mats) {
  const group = new THREE.Group();
  const from = v(layout.galleryN);
  const to = v(layout.galleryS);
  const f = frame(from, to);
  const laps = layout.corbelCount;
  const totalH = layout.galH;
  const lapH = totalH / laps;
  const extra = layout.corbelSum;
  const floorW = layout.galleryFloorW;
  const overall = layout.galleryWidth;

  const floor = boxAlong(from, to, overall + 0.5, 0.4, mats.limestone, -0.2);
  group.add(floor);

  for (let i = 0; i < laps; i++) {
    const t = i / (laps - 1);
    const w = overall - extra * 2 * t;
    const yOff = lapH * (i + 0.5);
    const strip = boxAlong(from, to, 0.35, lapH * 0.92, mats.limestone, yOff);
    const left = strip.clone();
    left.position.copy(f.mid).addScaledVector(f.up, yOff).addScaledVector(f.right, -(w / 2));
    const right = strip.clone();
    right.position.copy(f.mid).addScaledVector(f.up, yOff).addScaledVector(f.right, w / 2);
    group.add(collider(left), collider(right));
  }

  const ceil = boxAlong(from, to, layout.measures.gallery.widthTop ? 1.05 : 1.05, 0.35, mats.limestone, totalH + 0.15);
  group.add(ceil);

  const rampH = 0.58;
  const rampW = (overall - floorW) / 2;
  const rL = boxAlong(from, to, rampW, rampH, mats.limestone, rampH / 2);
  rL.position.addScaledVector(f.right, -(floorW / 2 + rampW / 2));
  const rR = rL.clone();
  rR.position.copy(f.mid).addScaledVector(f.up, rampH / 2).addScaledVector(f.right, floorW / 2 + rampW / 2);
  group.add(collider(rL), collider(rR));

  const holes = 27;
  for (let i = 0; i < holes; i++) {
    const t = (i + 0.7) / (holes + 0.4);
    const along = f.len * t;
    const len = i % 2 === 0 ? layout.holeLong : layout.holeShort;
    const hole = new THREE.Mesh(new THREE.BoxGeometry(rampW * 0.7, 0.22, len), mats.granite);
    const pos = from.clone().addScaledVector(f.along, along).addScaledVector(f.up, rampH);
    hole.position.copy(pos).addScaledVector(f.right, -(floorW / 2 + rampW / 2));
    const m = new THREE.Matrix4().makeBasis(f.right, f.up, f.along);
    hole.quaternion.setFromRotationMatrix(m);
    const hole2 = hole.clone();
    hole2.position.copy(pos).addScaledVector(f.right, floorW / 2 + rampW / 2);
    group.add(hole, hole2);
  }

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(overall, layout.stepTopY - layout.galleryS.y + 0.05, layout.stepLen),
    mats.limestone
  );
  step.position.set(layout.east, (layout.stepTopY + layout.galleryS.y) / 2, (layout.galleryS.z + layout.stepFront.z) / 2);
  group.add(collider(step));
  return group;
}

function makeCoffer(layout, mats) {
  const c = layout.coffer;
  const group = new THREE.Group();
  const wall = (c.l - c.il) / 2;
  const side = (c.w - c.iw) / 2;
  const bottom = c.h - c.id;
  const outer = new THREE.Mesh(new THREE.BoxGeometry(c.w, bottom, c.l), mats.granite);
  outer.position.set(c.x, c.y + bottom / 2, c.z);
  const n = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.id, wall), mats.granite);
  n.position.set(c.x, c.y + bottom + c.id / 2, c.z - c.l / 2 + wall / 2);
  const s = n.clone();
  s.position.z = c.z + c.l / 2 - wall / 2;
  const e = new THREE.Mesh(new THREE.BoxGeometry(side, c.id, c.il), mats.granite);
  e.position.set(c.x + c.w / 2 - side / 2, c.y + bottom + c.id / 2, c.z);
  const w = e.clone();
  w.position.x = c.x - c.w / 2 + side / 2;
  [outer, n, s, e, w].forEach((mesh) => group.add(collider(mesh)));
  group.position.y += 0.02;
  return group;
}

function makeRelieving(layout, mats) {
  const group = new THREE.Group();
  const k = layout.kings;
  let y = k.y + k.h + 0.8;
  for (let i = 0; i < layout.relCount; i++) {
    const h = i === layout.relCount - 1 ? layout.relH * 1.6 : layout.relH;
    const room = roomBox({ x: k.x, y, z: k.z, ew: k.ew, ns: k.ns, h }, mats, i ? mats.limestone : mats.granite, 0.4);
    group.add(room);
    if (i === layout.relCount - 1) {
      group.add(
        gableRoof(
          { x: k.x, y, z: k.z, ew: k.ew, ns: k.ns, wallH: h, ridgeH: h + 2.4 },
          mats
        )
      );
    }
    y += h + 0.55;
  }
  return group;
}

function makeShafts(layout, mats) {
  const group = new THREE.Group();
  const size = Math.max(0.18, layout.shaftSize);
  const k = layout.kings;
  const q = layout.queens;
  const mk = (origin, angleDeg, south, length) => {
    const rad = (angleDeg * Math.PI) / 180;
    const dir = new THREE.Vector3(0, Math.sin(rad), south ? Math.cos(rad) : -Math.cos(rad));
    const end = origin.clone().addScaledVector(dir, length);
    group.add(boxAlong(origin, end, size, size, mats.limestone, 0));
  };
  mk(new THREE.Vector3(k.x, k.y + k.h * 0.18, k.z - k.ns / 2), 32.5, false, 55);
  mk(new THREE.Vector3(k.x, k.y + k.h * 0.18, k.z + k.ns / 2), 45, true, 50);
  mk(new THREE.Vector3(q.x, q.y + 1.71, q.z - q.ns / 2), layout.shaftN, false, 18);
  mk(new THREE.Vector3(q.x, q.y + 1.71, q.z + q.ns / 2), layout.shaftS, true, 18);
  return group;
}

function makeNiche(layout, mats) {
  const q = layout.queens;
  const group = new THREE.Group();
  const laps = 5;
  for (let i = 0; i < laps; i++) {
    const t = i / (laps - 1);
    const w = q.nicheW * (1 - t * 0.67);
    const y0 = q.y + (q.nicheH / laps) * i;
    const h = q.nicheH / laps;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(q.nicheD, h * 0.96, w), mats.limestone);
    slab.position.set(q.x + q.ew / 2 + q.nicheD / 2, y0 + h / 2, q.z);
    group.add(collider(slab));
  }
  return group;
}

function makeChevrons(layout, mats) {
  const group = new THREE.Group();
  const e = layout.entrance;
  const size = 3.2;
  for (const side of [-1, 1]) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(size, 1.4, 4.2), mats.limestone);
    block.position.set(e.x + side * 1.7, e.y + layout.ph + 1.6, e.z - 1.2);
    block.rotation.z = side * 0.7;
    group.add(collider(block));
  }
  return group;
}

export function makeInterior(layout, mats) {
  const root = new THREE.Group();
  root.name = "khufu-interior";

  root.add(makePassage(v(layout.entrance), v(layout.descEnd), layout.pw, layout.ph, mats));
  root.add(makePassage(v(layout.junction), v(layout.galleryN), layout.pw, layout.ph, mats));
  root.add(makePassage(v(layout.qpStart), v(layout.qpMid), layout.pw, layout.ph, mats));
  root.add(makePassage(v(layout.qpMid), v(layout.qpEnd), layout.pw, layout.ph + 0.42, mats));
  root.add(makePassage(v(layout.kpStart), v(layout.kpEnd), layout.pw, layout.ph, { ...mats, limestone: mats.granite }));
  root.add(
    makePassage(
      v(layout.deadStart),
      new THREE.Vector3(layout.subterranean.x, layout.deadStart.y + 0.4, layout.subterranean.z - layout.subterranean.ns / 2),
      layout.deadW,
      layout.deadH,
      mats,
      0.3
    )
  );
  root.add(makePassage(v(layout.deadStart), v(layout.deadEnd), layout.deadW, layout.deadH, mats, 0.3));

  const plug = boxAlong(
    v(layout.plugs.start),
    v(layout.plugs.end),
    (layout.plugs.wN + layout.plugs.wS) / 2,
    layout.plugs.h,
    mats.granite,
    layout.plugs.h / 2 - layout.ph / 2
  );
  root.add(plug);

  root.add(makeGallery(layout, mats));

  const k = layout.kings;
  root.add(roomBox({ x: k.x, y: k.y, z: k.z, ew: k.ew, ns: k.ns, h: k.h }, mats, mats.granite, 0.55, ["n"]));
  for (let i = 1; i < 5; i++) {
    const y = k.y + k.courseH * i;
    const band = new THREE.Mesh(new THREE.BoxGeometry(k.ew + 0.02, 0.04, k.ns + 0.02), mats.granite);
    band.position.set(k.x, y, k.z);
    root.add(band);
  }
  const beams = 9;
  for (let i = 0; i < beams; i++) {
    const x = k.x - k.ew / 2 + ((i + 0.5) / beams) * k.ew;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(k.ew / beams - 0.04, 1.15, k.ns + 2.4), mats.granite);
    beam.position.set(x, k.y + k.h + 0.55, k.z);
    root.add(collider(beam));
  }

  const q = layout.queens;
  root.add(roomBox({ x: q.x, y: q.y, z: q.z, ew: q.ew, ns: q.ns, h: q.wallH }, mats, mats.limestone, 0.45, ["n"]));
  root.add(gableRoof(q, mats));
  root.add(makeNiche(layout, mats));

  const a = layout.ante;
  root.add(roomBox({ x: a.x, y: a.y, z: a.z, ew: a.ew, ns: a.ns, h: a.h }, mats, mats.granite, 0.4, ["n", "s"]));
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(a.ew * 0.92, a.h * 0.55, 0.28), mats.granite);
  leaf.position.set(a.x, a.y + a.h * 0.4, a.z);
  root.add(collider(leaf));

  const sub = layout.subterranean;
  root.add(roomBox(sub, mats, mats.limestone, 0.6, ["n", "s"]));
  const pit = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4.2, 2.1), mats.limestone);
  pit.position.set(sub.x + 2.2, sub.y - 1.6, sub.z);
  root.add(collider(pit));

  root.add(makeCoffer(layout, mats));
  root.add(makeRelieving(layout, mats));
  root.add(makeShafts(layout, mats));
  root.add(makeChevrons(layout, mats));

  const voidMesh = new THREE.Mesh(
    new THREE.BoxGeometry(layout.bigVoid.w, layout.bigVoid.h, layout.bigVoid.length),
    mats.ghost
  );
  voidMesh.position.set(layout.bigVoid.x, layout.bigVoid.y, layout.bigVoid.z);
  const slope = Math.atan2(layout.galU.y, Math.hypot(layout.galU.z, layout.galU.x));
  voidMesh.rotation.x = -slope;
  voidMesh.name = "big-void";
  root.add(voidMesh);

  addLights(root, layout);
  return root;
}

function addLights(root, layout) {
  const k = layout.kings;
  const q = layout.queens;
  const g = v(layout.galleryN).lerp(v(layout.galleryS), 0.5);
  const pts = [
    [k.x, k.y + k.h * 0.55, k.z, 18, "#f2d7b0"],
    [q.x, q.y + 3.2, q.z, 10, "#efe6d2"],
    [g.x, g.y + 4, g.z, 12, "#e8d4a8"],
    [layout.entrance.x, layout.entrance.y + 1, layout.entrance.z, 6, "#d7b56a"],
    [layout.subterranean.x, layout.subterranean.y + 2, layout.subterranean.z, 5, "#c8b89a"],
    [layout.ante.x, layout.ante.y + 2.4, layout.ante.z, 8, "#f0c9a0"],
  ];
  for (const [x, y, z, intensity, color] of pts) {
    const l = new THREE.PointLight(color, intensity, 28, 1.6);
    l.position.set(x, y, z);
    root.add(l);
  }
}

export function collectColliders(root) {
  const list = [];
  root.traverse((o) => {
    if (o.isMesh && o.userData.collider) list.push(o);
  });
  return list;
}
