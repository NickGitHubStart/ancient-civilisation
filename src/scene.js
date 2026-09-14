import * as THREE from "three";
import {
  AU,
  DEG,
  EARTH_R,
  SKY_R,
  SUN_R,
  earthPosition,
  eclipticDir,
  poleDir,
  raDecToDir,
} from "./astro.js";
import { ZODIAC } from "./stars.js";

const GOLD = new THREE.Color("#d7b56a");
const ICE = new THREE.Color("#9fd4ea");
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintEarth() {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, "#16324c");
  ocean.addColorStop(0.5, "#0b2742");
  ocean.addColorStop(1, "#16324c");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  const xy = (lon, lat) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];

  const blob = (pts, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = xy(p[0], p[1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  };

  const land = "#3f8f5c";
  const land2 = "#4fa06a";

  blob(
    [
      [-17, 20],
      [-10, 36],
      [10, 37],
      [32, 31],
      [51, 12],
      [50, 0],
      [43, -15],
      [40, -34],
      [18, -34],
      [12, -18],
      [8, 4],
      [-15, 12],
    ],
    land
  );
  blob(
    [
      [-10, 36],
      [-9, 44],
      [-1, 43],
      [-9, 52],
      [5, 58],
      [24, 70],
      [40, 68],
      [60, 70],
      [90, 72],
      [140, 70],
      [180, 66],
      [180, 42],
      [145, 50],
      [130, 38],
      [100, 28],
      [80, 8],
      [72, 20],
      [60, 25],
      [45, 40],
      [28, 41],
      [12, 36],
    ],
    land2
  );
  blob(
    [
      [95, 8],
      [110, 22],
      [122, 16],
      [125, 0],
      [104, -8],
      [78, 5],
    ],
    land
  );
  blob(
    [
      [113, -12],
      [153, -12],
      [153, -38],
      [115, -38],
    ],
    land
  );
  blob(
    [
      [-168, 66],
      [-140, 70],
      [-125, 58],
      [-80, 48],
      [-65, 58],
      [-55, 48],
      [-80, 32],
      [-95, 30],
      [-124, 48],
      [-140, 58],
      [-166, 54],
    ],
    land2
  );
  blob(
    [
      [-110, 32],
      [-78, 26],
      [-82, 8],
      [-105, 8],
      [-118, 22],
    ],
    land
  );
  blob(
    [
      [-82, 12],
      [-60, 12],
      [-35, 0],
      [-40, -22],
      [-70, -55],
      [-75, -20],
      [-80, 0],
    ],
    land
  );
  blob(
    [
      [165, -35],
      [178, -35],
      [178, -47],
      [165, -47],
    ],
    land
  );

  ctx.strokeStyle = "rgba(180, 210, 230, 0.08)";
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = xy(0, lat)[1];
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function goldTexture(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
        px[i + 3] = lum < 22 ? 0 : Math.min(255, lum * 1.15);
      }
      ctx.putImageData(data, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.src = url;
  });
}

function makeSunSprite(draw, scale) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  draw(ctx, 256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale, scale, 1);
  return s;
}

function makeSun() {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_R, 48, 48),
    new THREE.MeshBasicMaterial({ color: "#ffb020" })
  );
  group.add(core);

  group.add(
    makeSunSprite((ctx, r) => {
      const g = ctx.createRadialGradient(r, r, 6, r, r, r);
      g.addColorStop(0, "rgba(255, 252, 230, 1)");
      g.addColorStop(0.08, "rgba(255, 210, 70, 0.95)");
      g.addColorStop(0.22, "rgba(255, 150, 30, 0.55)");
      g.addColorStop(0.5, "rgba(255, 90, 10, 0.16)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, r * 2, r * 2);
    }, 11)
  );

  group.add(
    makeSunSprite((ctx, r) => {
      ctx.translate(r, r);
      const rays = 16;
      for (let i = 0; i < rays; i++) {
        ctx.rotate((Math.PI * 2) / rays);
        const long = i % 2 === 0;
        const grd = ctx.createLinearGradient(0, 0, 0, long ? r : r * 0.62);
        grd.addColorStop(0, "rgba(255, 220, 80, 0.55)");
        grd.addColorStop(0.35, "rgba(255, 140, 20, 0.12)");
        grd.addColorStop(1, "rgba(255, 80, 0, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-2.2, 0);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(0.4, long ? r * 0.92 : r * 0.55);
        ctx.lineTo(-0.4, long ? r * 0.92 : r * 0.55);
        ctx.closePath();
        ctx.fill();
      }
    }, 18)
  );

  return group;
}

export async function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05060a");
  scene.fog = new THREE.FogExp2("#05060a", 0.0025);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  camera.position.set(5, 16, 18);

  const sunLight = new THREE.PointLight("#ffc56a", 220, 80, 1.35);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight("#243044", 0.7));
  const fill = new THREE.HemisphereLight("#4a6080", "#0a0c10", 0.55);
  scene.add(fill);
  scene.add(makeSun());

  const earthGroup = new THREE.Group();
  const earthTex = paintEarth();
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTex,
    roughness: 0.78,
    metalness: 0.05,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 48), earthMat);
  earthGroup.add(earth);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.06, 48, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uIce: { value: 0 } },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-p.xyz);
          gl_Position = projectionMatrix * p;
        }`,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vV;
        uniform float uIce;
        void main() {
          float f = pow(1.0 - abs(dot(vN, vV)), 2.6);
          vec3 warm = vec3(0.45, 0.7, 1.0);
          vec3 cold = vec3(0.7, 0.85, 1.0);
          gl_FragColor = vec4(mix(warm, cold, uIce), f * 0.62);
        }`,
    })
  );
  earthGroup.add(atmo);

  const iceMat = new THREE.MeshStandardMaterial({
    color: "#e8f2fa",
    roughness: 0.55,
    transparent: true,
    opacity: 0.92,
  });
  const iceN = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.01, 32, 16, 0, Math.PI * 2, 0, 0.55), iceMat);
  const iceS = iceN.clone();
  iceS.rotation.x = Math.PI;
  earthGroup.add(iceN, iceS);

  const axisMat = new THREE.MeshBasicMaterial({ color: GOLD });
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, EARTH_R * 3.4, 8), axisMat);
  const axisTip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 10), axisMat);
  axisTip.position.y = EARTH_R * 1.7 + 0.1;
  const axisTipS = axisTip.clone();
  axisTipS.position.y *= -1;
  axisTipS.rotation.x = Math.PI;
  const equator = new THREE.Mesh(
    new THREE.TorusGeometry(EARTH_R * 1.02, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({ color: "#d7b56a", transparent: true, opacity: 0.55 })
  );
  equator.rotation.x = Math.PI / 2;
  earthGroup.add(axis, axisTip, axisTipS, equator);
  scene.add(earthGroup);

  const uprightMat = new THREE.MeshBasicMaterial({
    color: "#c8c4b8",
    transparent: true,
    opacity: 0.28,
  });
  const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, EARTH_R * 3.6, 8), uprightMat);
  scene.add(upright);

  const orbitGeom = new THREE.BufferGeometry();
  const orbitMat = new THREE.LineBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.35,
  });
  const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
  scene.add(orbitLine);

  const ecliptic = new THREE.Mesh(
    new THREE.TorusGeometry(SKY_R, 0.04, 8, 180),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.18 })
  );
  ecliptic.rotation.x = Math.PI / 2;
  scene.add(ecliptic);

  const field = makeStarField();
  scene.add(field);

  const zodiac = await makeZodiac();
  scene.add(zodiac.group);

  const pointer = makePointer();
  scene.add(pointer.group);

  const poleTrail = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: 0.22 })
  );
  scene.add(poleTrail);

  function updateOrbit(e) {
    const n = 180;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const L = (i / n) * Math.PI * 2;
      const p = earthPosition(L, e);
      pts.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    orbitGeom.setFromPoints(pts);
  }

  function updatePoleTrail(eps) {
    const n = 96;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const psi = (i / n) * Math.PI * 2;
      eclipticDir(psi, Math.PI / 2 - eps, _v);
      pts.push(_v.clone().multiplyScalar(SKY_R * 0.92));
    }
    poleTrail.geometry.setFromPoints(pts);
  }

  let lastE = -1;
  let lastEps = -1;

  function update(state) {
    const { year, e, eps, orbitPhase, dayPhase, ice, onA, onB, onC } = state;

    if (Math.abs(e - lastE) > 0.0004) {
      updateOrbit(e);
      lastE = e;
    }
    if (Math.abs(eps - lastEps) > 0.0005) {
      updatePoleTrail(eps);
      lastEps = eps;
    }

    const pos = earthPosition(orbitPhase, e);
    earthGroup.position.set(pos.x, pos.y, pos.z);
    upright.position.set(pos.x, pos.y, pos.z);
    poleDir(year, eps, _v);
    _q.setFromUnitVectors(_up, _v2.copy(_v).normalize());
    earthGroup.quaternion.copy(_q);
    earth.rotation.y = dayPhase;

    const iceScale = 0.55 + ice * 0.85;
    iceN.scale.setScalar(iceScale);
    iceS.scale.setScalar(iceScale);
    iceN.visible = ice > 0.12;
    iceS.visible = ice > 0.12;
    atmo.material.uniforms.uIce.value = ice;

    axisMat.color.copy(onB ? ICE : GOLD);
    orbitMat.color.copy(onA ? ICE : GOLD);
    orbitMat.opacity = onA ? 0.7 : 0.32;
    equator.material.opacity = onB ? 0.9 : 0.45;

    sunLight.color.set(ice > 0.72 ? "#c5d8f0" : "#ffc56a");
    sunLight.intensity = 160 + ice * 40;
    scene.fog.color.set(ice > 0.75 ? "#071018" : "#05060a");

    pointer.update(earthGroup.position, onC);
    zodiac.setActive(pointer.hitDir, camera);
  }

  updateOrbit(0.017);
  updatePoleTrail(23.44 * DEG);

  return { scene, camera, earthGroup, update, zodiac };
}

function makeStarField() {
  const rnd = mulberry32(7);
  const n = 1400;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const dir = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < n; i++) {
    const ra = rnd() * 360 - 180;
    const dec = (rnd() * 2 - 1) * 78;
    raDecToDir(ra, dec, dir);
    pos[i * 3] = dir.x * SKY_R;
    pos[i * 3 + 1] = dir.y * SKY_R;
    pos[i * 3 + 2] = dir.z * SKY_R;
    const b = 0.35 + rnd() * 0.65;
    col[i * 3] = b;
    col[i * 3 + 1] = b * 0.96;
    col[i * 3 + 2] = b * 0.88;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    })
  );
}

async function makeZodiac() {
  const group = new THREE.Group();
  const entries = [];
  const starPos = [];
  const starCol = [];
  const linePositions = [];

  for (const z of ZODIAC) {
    const dirs = [];
    const seen = new Set();
    for (const line of z.lines) {
      for (let i = 0; i < line.length; i++) {
        const [ra, dec] = line[i];
        const d = raDecToDir(ra, dec);
        const key = `${ra.toFixed(3)},${dec.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          dirs.push(new THREE.Vector3(d.x, d.y, d.z));
          starPos.push(d.x * SKY_R, d.y * SKY_R, d.z * SKY_R);
          starCol.push(0.95, 0.86, 0.62);
        }
        if (i > 0) {
          const a = raDecToDir(line[i - 1][0], line[i - 1][1]);
          linePositions.push(a.x * SKY_R, a.y * SKY_R, a.z * SKY_R, d.x * SKY_R, d.y * SKY_R, d.z * SKY_R);
        }
      }
    }

    const centroid = new THREE.Vector3();
    dirs.forEach((d) => centroid.add(d));
    centroid.normalize();

    let maxAng = 0.18;
    dirs.forEach((d) => {
      maxAng = Math.max(maxAng, Math.acos(clampDot(centroid.dot(d))));
    });

    const tex = await goldTexture(`/constellations/${z.file}`);
    const size = Math.sin(maxAng) * SKY_R * 1.25;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0.11,
        side: THREE.DoubleSide,
      })
    );
    plane.position.copy(centroid).multiplyScalar(SKY_R * 0.9);
    plane.lookAt(0, 0, 0);
    group.add(plane);

    entries.push({ ...z, centroid, plane, dirs });
  }

  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  sg.setAttribute("color", new THREE.Float32BufferAttribute(starCol, 3));
  group.add(
    new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        size: 0.42,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    )
  );

  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.38,
  });
  const lines = new THREE.LineSegments(lg, lineMat);
  group.add(lines);

  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 6.8),
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      opacity: 0.92,
      side: THREE.DoubleSide,
    })
  );
  group.add(card);

  let active = null;
  function setActive(pointerDir, camera) {
    let best = entries[0];
    let bestDot = -2;
    for (const e of entries) {
      const d = pointerDir.dot(e.centroid);
      if (d > bestDot) {
        bestDot = d;
        best = e;
      }
    }
    if (best !== active) {
      if (active) {
        active.plane.material.opacity = 0.11;
        active.plane.scale.setScalar(1);
      }
      best.plane.material.opacity = 0.4;
      best.plane.scale.setScalar(1.15);
      card.material.map = best.plane.material.map;
      card.material.needsUpdate = true;
      active = best;
    }
    card.position.copy(pointerDir).multiplyScalar(AU * 1.42);
    card.lookAt(camera.position);
    return best;
  }

  return { group, entries, setActive, get active() { return active; } };
}

function clampDot(x) {
  return Math.min(1, Math.max(-1, x));
}

function makePointer() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.85,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8), mat);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 10), mat);
  group.add(shaft, tip);
  const hitDir = new THREE.Vector3(1, 0, 0);

  function update(earthPos, onC) {
    hitDir.copy(earthPos).multiplyScalar(-1).normalize();
    const end = _v.copy(hitDir).multiplyScalar(SKY_R);
    const mid = _v2.copy(earthPos).add(end).multiplyScalar(0.5);
    const len = earthPos.distanceTo(end);
    shaft.position.copy(mid);
    shaft.scale.set(1, len, 1);
    shaft.quaternion.setFromUnitVectors(_up, hitDir);
    tip.position.copy(end);
    tip.quaternion.setFromUnitVectors(_up, hitDir);
    mat.color.copy(onC ? ICE : GOLD);
    mat.opacity = onC ? 1 : 0.8;
  }

  return { group, hitDir, update };
}
