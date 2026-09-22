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
import { createPlanets } from "./planets.js";

const GOLD = new THREE.Color("#d7b56a");
const ICE = new THREE.Color("#9fd4ea");
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _upQuat = new THREE.Quaternion();

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadEarthTexture() {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      "/earth.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      () => resolve(paintEarth())
    );
  });
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
  const desert = "#c4a15a";
  const iceLand = "#d5e4ee";

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
  blob(
    [
      [-12, 18],
      [10, 22],
      [35, 30],
      [55, 18],
      [50, 12],
      [30, 8],
      [10, 12],
    ],
    desert
  );
  blob(
    [
      [-60, -62],
      [-20, -70],
      [40, -68],
      [80, -72],
      [140, -66],
      [170, -72],
      [-170, -70],
      [-120, -66],
    ],
    iceLand
  );
  blob(
    [
      [-45, 60],
      [-20, 72],
      [-40, 82],
      [-70, 76],
      [-60, 62],
    ],
    iceLand
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
    new THREE.SphereGeometry(SUN_R, 64, 48),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-p.xyz);
          gl_Position = projectionMatrix * p;
        }
      `,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          float limb = pow(f, 0.45);
          vec3 edge = vec3(0.85, 0.22, 0.02);
          vec3 mid = vec3(1.0, 0.62, 0.12);
          vec3 core = vec3(1.0, 0.96, 0.82);
          vec3 col = mix(edge, mid, smoothstep(0.0, 0.45, limb));
          col = mix(col, core, smoothstep(0.45, 1.0, limb));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  group.add(core);

  group.add(
    makeSunSprite((ctx, r) => {
      const g = ctx.createRadialGradient(r, r, r * 0.15, r, r, r * 0.72);
      g.addColorStop(0, "rgba(255, 220, 140, 0.45)");
      g.addColorStop(0.45, "rgba(255, 140, 30, 0.12)");
      g.addColorStop(1, "rgba(255, 80, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, r * 2, r * 2);
    }, 6.5)
  );

  group.add(
    makeSunSprite((ctx, r) => {
      ctx.translate(r, r);
      const rays = 16;
      for (let i = 0; i < rays; i++) {
        ctx.rotate((Math.PI * 2) / rays);
        const long = i % 2 === 0;
        const len = long ? r * 0.72 : r * 0.48;
        const grd = ctx.createLinearGradient(0, 0, 0, len);
        grd.addColorStop(0, "rgba(255, 220, 120, 0.7)");
        grd.addColorStop(0.4, "rgba(255, 150, 30, 0.28)");
        grd.addColorStop(1, "rgba(255, 90, 0, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-2.4, r * 0.12);
        ctx.lineTo(2.4, r * 0.12);
        ctx.lineTo(0.35, len);
        ctx.lineTo(-0.35, len);
        ctx.closePath();
        ctx.fill();
      }
    }, 9.5)
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
  const sunGroup = makeSun();
  scene.add(sunGroup);

  const earthGroup = new THREE.Group();
  const crust = new THREE.Group();
  const earthTex = await loadEarthTexture();
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: earthTex },
      pole: { value: new THREE.Vector3(0, 1, 0) },
      slip: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 pole;
      uniform float slip;
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vec3 dir = normalize(vPos);
        vec3 p = normalize(pole);
        float facing = dot(dir, p);
        vec3 tex = texture2D(map, vUv).rgb;
        tex = pow(max(tex, vec3(0.0)), vec3(0.62)) * 1.08;
        float luma = dot(tex, vec3(0.299, 0.587, 0.114));
        float mx = max(tex.r, max(tex.g, tex.b));
        float mn = min(tex.r, min(tex.g, tex.b));
        float snow = smoothstep(0.52, 0.78, luma) * smoothstep(0.2, 0.05, mx - mn);
        float ocean = smoothstep(0.0, 0.1, tex.b - max(tex.r, tex.g));
        float geo = max(smoothstep(0.9, 0.97, facing), smoothstep(0.9, 0.97, -facing));
        float fringe = max(smoothstep(0.84, 0.91, facing), smoothstep(0.84, 0.91, -facing));
        vec3 forest = vec3(0.28, 0.45, 0.26);
        vec3 tundra = vec3(0.46, 0.44, 0.28);
        vec3 sea = vec3(0.07, 0.2, 0.36);
        vec3 melted = mix(mix(tundra, forest, 0.6), sea, ocean);
        if (slip < 0.02) {
          gl_FragColor = vec4(tex, 1.0);
          return;
        }
        vec3 col = mix(tex, melted, snow * (1.0 - geo) * slip);
        col = mix(col, tundra, fringe * (1.0 - geo) * (1.0 - ocean) * snow * slip);
        col = mix(col, vec3(0.94, 0.97, 0.99), geo * slip);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 48), earthMat);
  earth.name = "earth";
  crust.add(earth);
  for (const [name, lat, lon] of [
    ["Nordamerika", 45, -100],
    ["Südamerika", -18, -60],
    ["Europa", 50, 12],
    ["Afrika", 4, 20],
    ["Asien", 38, 90],
    ["Australien", -25, 134],
    ["Antarktis", -82, 40],
  ]) {
    const spr = labelSprite(name);
    spr.position.copy(spherePoint(lat, lon).multiplyScalar(EARTH_R * 1.03));
    spr.scale.set(0.72, 0.16, 1);
    crust.add(spr);
  }
  earthGroup.add(crust);

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

  const mag = makeDipole(EARTH_R * 2.4);
  earthGroup.add(mag);

  mag.visible = false;

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
  const skyRoot = new THREE.Group();
  scene.add(skyRoot);
  skyRoot.add(ecliptic);

  const field = makeStarField();
  skyRoot.add(field);

  const zodiac = await makeZodiac();
  skyRoot.add(zodiac.group);

  const pointer = makePointer();
  scene.add(pointer.group);

  const poleTrail = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: 0.22 })
  );
  skyRoot.add(poleTrail);

  const planets = await createPlanets();
  scene.add(planets.group);

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
    earthGroup.quaternion.copy(state.globe ? _upQuat : _q);
    earth.rotation.y = state.globe ? 0 : dayPhase;

    const globe = !!state.globe;
    const crustOn = globe && !!state.crustOn;
    const slip = crustOn ? Math.min(1, Math.max(0, state.slip ?? 0)) : 0;
    crust.quaternion.copy(slipQuat(slip));
    _v.set(0, 1, 0).applyQuaternion(_slipQ.clone().invert());
    if (earthMat.uniforms) {
      earthMat.uniforms.pole.value.copy(_v);
      earthMat.uniforms.slip.value = globe ? slip : 0;
    }
    iceN.visible = !globe && ice > 0.12;
    iceS.visible = !globe && ice > 0.12;
    axis.visible = !globe;
    axisTip.visible = !globe;
    axisTipS.visible = !globe;
    equator.visible = true;
    equator.material.opacity = globe ? 0.9 : (onB ? 0.9 : 0.45);

    const showPlanets = !!state.planets && !globe;
    planets.setVisible(showPlanets);
    planets.update(year);
    const skyScale = showPlanets ? (AU * 32) / SKY_R : 1;
    skyRoot.scale.setScalar(skyScale);
    scene.fog.density = showPlanets ? 0.00028 : 0.0025;
    mag.visible = globe && !!state.fieldOn;

    const orreryOn = !globe;
    sunGroup.visible = orreryOn;
    orbitLine.visible = orreryOn;
    ecliptic.visible = orreryOn;
    field.visible = orreryOn;
    zodiac.group.visible = orreryOn;
    pointer.group.visible = orreryOn;
    poleTrail.visible = orreryOn;
    upright.visible = orreryOn;

    const iceScale = 0.55 + ice * 0.85;
    iceN.scale.setScalar(iceScale);
    iceS.scale.setScalar(iceScale);
    atmo.material.uniforms.uIce.value = ice;

    axisMat.color.copy(onB ? ICE : GOLD);
    orbitMat.color.copy(onA ? ICE : GOLD);
    orbitMat.opacity = onA ? 0.7 : 0.32;


    sunLight.color.set(ice > 0.72 ? "#c5d8f0" : "#ffc56a");
    sunLight.intensity = 160 + ice * 40;
    scene.fog.color.set(ice > 0.75 ? "#071018" : "#05060a");

    pointer.update(earthGroup.position, onC);
    zodiac.setActive(pointer.hitDir, camera);
  }

  updateOrbit(0.017);
  updatePoleTrail(23.44 * DEG);

  return { scene, camera, earthGroup, earth, update, zodiac };
}

const _hub = spherePoint(60, -85);
const _slipAxis = new THREE.Vector3().crossVectors(_hub, new THREE.Vector3(0, 1, 0)).normalize();
const _slipAng = Math.acos(Math.min(1, _hub.y));
const _slipQ = new THREE.Quaternion();

function slipQuat(slip) {
  _slipQ.setFromAxisAngle(_slipAxis, slip * _slipAng);
  return _slipQ;
}

function spherePoint(lat, lon) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );
}

function addMarker(parent, label, lat, lon) {
  const p = spherePoint(lat, lon).multiplyScalar(EARTH_R * 1.04);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 8),
    new THREE.MeshBasicMaterial({ color: "#d7b56a" })
  );
  dot.position.copy(p);
  parent.add(dot);
  const spr = labelSprite(label);
  spr.position.copy(p).multiplyScalar(1.08);
  parent.add(spr);
}

function labelSprite(text) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#efe6d2";
  ctx.font = "500 42px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 48);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(1.6, 0.3, 1);
  return s;
}

function makeDipole(r) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({
    color: "#7ec8e3",
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= 32; k++) {
      const t = (k / 32) * Math.PI;
      const rad = Math.sin(t) * r;
      pts.push(new THREE.Vector3(Math.cos(a0) * rad, Math.cos(t) * r * 0.92, Math.sin(a0) * rad));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  return g;
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
