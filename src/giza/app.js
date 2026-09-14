// Giza is a measured Three.js teaching model. Future: real CAD or Unity
// (or similar) so it plays like a game and is more precise than this mesh.
import * as THREE from "three";
import khufu from "./data/khufu.json";
import plateau from "./data/plateau.json";
import hotspotData from "./data/hotspots.json";
import sources from "./data/sources.json";
import { createGizaScene } from "./scene.js";
import { createControls } from "./controls.js";
import { createGizaUI } from "./ui.js";
import { setCubitInches } from "./units.js";

export async function startGiza(canvas) {
  setCubitInches(khufu.cubit.original.value);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;

  const { scene, camera, layout, cutaway, hotspots, colliders } = createGizaScene(
    khufu,
    plateau,
    hotspotData.items
  );

  const controls = createControls(camera, canvas, colliders);
  controls.lookEastCutaway(layout);

  const ui = createGizaUI({
    khufu,
    sources,
    hotspots: hotspotData.items,
    onUnit: () => {},
    onCutaway: () => cutaway.toggle(),
    onMode: (mode) => controls.setMode(mode),
    onSourceFilter: (id) => hotspots.setFilter(id),
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (controls.mode !== "orbit") return;
    const item = hotspots.pick(e, camera, canvas);
    if (item) ui.openHotspot(item);
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyC") {
      const on = cutaway.toggle();
      const btn = document.getElementById("giza-cut");
      btn.classList.toggle("on", on);
      btn.textContent = on ? "Schnitt an" : "Schnitt aus";
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

  ui.setHint("Schnitt durch die Gänge. F fliegen, G gehen, C Schnitt, i anklicken.");

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    controls.tick(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
