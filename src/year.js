import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { conditions, vernalLongitude } from "./astro.js";
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
  };

  const { scene, camera, update, zodiac } = await createScene(renderer);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.target.set(0, 0, 0);

  const ui = createUI(state, camera);
  controls.addEventListener("start", () => ui.followCamera());

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

    if (state.playing) {
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
    });

    const sign = zodiac.active?.name ?? "";
    ui.tick(dt, cond, sign);

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
