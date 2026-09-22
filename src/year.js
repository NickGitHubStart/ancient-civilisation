import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EARTH_R, conditions, vernalLongitude } from "./astro.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";

export async function startYear(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const params = new URLSearchParams(location.search);
  const startYear = Number(params.get("year") ?? 2026);
  const year0 = Number.isFinite(startYear) ? startYear : 2026;
  const state = {
    year: year0,
    tempo: 72,
    playing: false,
    snapSpring: true,
    orbitPhase: vernalLongitude(year0) + Math.PI,
    dayPhase: 0.4,
    globe: false,
    crustOn: false,
    fieldOn: false,
    slip: 0,
    shiftPlay: false,
    shiftT: 0,
  };

  const { scene, camera, earthGroup, earth, update, zodiac } = await createScene(renderer);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.target.set(0, 0, 0);

  const ui = createUI(state, camera);
  controls.addEventListener("start", () => {
    ui.followCamera();
    if (state.globe) state.globeReady = true;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  let home = null;
  const camGoal = new THREE.Vector3();

  function slipFromYear(year) {
    const t = (year - -16000) / (2026 - -16000);
    return Math.min(1, Math.max(0, 1 - t));
  }

  function enterGlobe() {
    if (state.globe) return;
    home = {
      pos: camera.position.clone(),
      target: controls.target.clone(),
      maxPolar: controls.maxPolarAngle,
      minDist: controls.minDistance,
      maxDist: controls.maxDistance,
    };
    state.globe = true;
    state.globeReady = false;
    state.globeAnchor = earthGroup.position.clone();
    controls.maxPolarAngle = Math.PI - 0.02;
    controls.minPolarAngle = 0.02;
    controls.minDistance = EARTH_R * 1.35;
    controls.maxDistance = EARTH_R * 8;
    state.crustOn = true;
    if (state.year > -2000) {
      ui.setYear(-14500);
      state.snapSpring = true;
    }
    ui.syncCrust();
  }

  function leaveGlobe() {
    state.globe = false;
    state.crustOn = false;
    state.fieldOn = false;
    state.slip = 0;
    state.shiftPlay = false;
    ui.syncCrust();
    if (home) {
      camera.position.copy(home.pos);
      controls.target.copy(home.target);
      controls.maxPolarAngle = home.maxPolar;
      controls.minPolarAngle = 0;
      controls.minDistance = home.minDist;
      controls.maxDistance = home.maxDist;
      home = null;
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    down = null;
    if (dx * dx + dy * dy > 16) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(earth, false);
    if (hits.length) {
      if (!state.globe) enterGlobe();
    } else if (state.globe) {
      leaveGlobe();
    }
  });

  function resize() {
    const w = innerWidth;
    const h = innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());

    if (state.wantGlobe) {
      state.wantGlobe = false;
      if (!state.globe) enterGlobe();
    }

    if (state.shiftPlay) {
      state.shiftT = Math.min(1, state.shiftT + dt / 18);
      ui.setYear(-14500 + state.shiftT * (2026 + 14500));
      state.crustOn = true;
      if (state.shiftT >= 1) state.shiftPlay = false;
    } else if (state.playing) {
      ui.setYear(state.year + dt * state.tempo);
      if (state.tempo <= 1) {
        const frac = state.year - Math.floor(state.year);
        state.orbitPhase = vernalLongitude(state.year) + Math.PI + frac * Math.PI * 2;
        state.dayPhase += dt * 0.9;
      } else {
        state.orbitPhase = vernalLongitude(state.year) + Math.PI;
      }
    } else if (state.snapSpring) {
      state.orbitPhase = vernalLongitude(state.year) + Math.PI;
      state.snapSpring = false;
    }

    state.slip = state.globe && state.crustOn ? slipFromYear(state.year) : 0;

    const cond = conditions(state.year);
    update({
      year: state.year,
      e: cond.e,
      eps: cond.eps,
      orbitPhase: state.orbitPhase,
      dayPhase: state.dayPhase,
      ice: cond.all ? Math.max(0.75, cond.ice) : cond.ice * 0.7,
      onA: cond.onA,
      onB: cond.onB,
      onC: cond.onC,
      globe: state.globe,
      crustOn: state.crustOn,
      fieldOn: state.fieldOn,
      slip: state.slip,
    });

    if (state.globe && state.globeAnchor) {
      earthGroup.position.copy(state.globeAnchor);
      controls.target.copy(state.globeAnchor);
      if (!state.globeReady) {
        const p = state.globeAnchor;
        camGoal.set(p.x + EARTH_R * 0.2, p.y + EARTH_R * 0.9, p.z + EARTH_R * 2.8);
        camera.position.lerp(camGoal, 0.12);
        if (camera.position.distanceTo(camGoal) < 0.35) state.globeReady = true;
      }
    }

    const sign = zodiac.active?.name ?? "";
    ui.tick(dt, cond, sign);

    if (state.planets && !state.globe) {
      controls.maxDistance = 460;
      if (!state.planetsFramed) {
        camera.position.set(0, 70, 130);
        controls.target.set(0, 0, 0);
        state.planetsFramed = true;
      }
    } else if (!state.globe && home == null) {
      controls.maxDistance = 80;
      state.planetsFramed = false;
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
