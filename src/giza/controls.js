import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const EYE = 1.7;

export function createControls(camera, canvas, colliders) {
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.minDistance = 8;
  orbit.maxDistance = 900;
  orbit.maxPolarAngle = Math.PI * 0.49;
  orbit.target.set(0, 40, 0);

  const walk = new PointerLockControls(camera, canvas);
  const keys = new Set();
  let mode = "orbit";
  const vel = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const wish = new THREE.Vector3();

  function setMode(next) {
    if (mode === "walk" && next !== "walk") walk.unlock();
    mode = next;
    orbit.enabled = next === "orbit";
    canvas.style.cursor = next === "orbit" ? "grab" : "none";
    if (next === "fly" || next === "walk") walk.lock();
  }

  canvas.addEventListener("click", () => {
    if (mode === "fly" || mode === "walk") walk.lock();
  });

  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "KeyF") setMode("fly");
    if (e.code === "KeyG") setMode("walk");
    if (e.code === "Escape") setMode("orbit");
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));

  function wishDir(cam) {
    wish.set(0, 0, 0);
    const fwd = keys.has("KeyW") || keys.has("ArrowUp");
    const back = keys.has("KeyS") || keys.has("ArrowDown");
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const up = keys.has("KeyE") || keys.has("Space");
    const downK = keys.has("KeyQ") || keys.has("ShiftLeft");
    if (fwd) wish.z -= 1;
    if (back) wish.z += 1;
    if (left) wish.x -= 1;
    if (right) wish.x += 1;
    if (mode === "fly") {
      if (up) wish.y += 1;
      if (downK) wish.y -= 1;
    }
    if (wish.lengthSq() > 0) wish.normalize();
    wish.applyQuaternion(cam.quaternion);
    if (mode === "walk") wish.y = 0;
    return wish;
  }

  function blocked(origin, dir, dist) {
    if (!colliders.length || dir.lengthSq() === 0) return false;
    ray.set(origin, dir);
    const hits = ray.intersectObjects(colliders, false);
    return hits.length > 0 && hits[0].distance < dist;
  }

  function tick(dt) {
    if (mode === "orbit") {
      orbit.update();
      return;
    }
    const speed = (mode === "fly" ? (keys.has("ShiftLeft") ? 48 : 18) : 4.2) * dt;
    const dir = wishDir(camera);
    if (dir.lengthSq() === 0) return;
    const step = dir.multiplyScalar(speed);
    const origin = camera.position.clone();
    if (mode === "walk") {
      const horiz = new THREE.Vector3(step.x, 0, step.z);
      const hLen = horiz.length();
      if (hLen > 0 && blocked(origin, horiz.clone().normalize(), hLen + 0.45)) {
        /* stay */
      } else {
        camera.position.add(horiz);
      }
      ray.set(camera.position.clone().setY(camera.position.y + 0.4), down);
      const floors = ray.intersectObjects(colliders, false);
      if (floors[0] && floors[0].distance < 8) {
        camera.position.y = floors[0].point.y + EYE;
      }
    } else {
      if (!blocked(origin, step.clone().normalize(), step.length() + 0.3)) {
        camera.position.add(step);
      }
    }
  }

  function lookEastCutaway(layout) {
    camera.position.set(layout.half + 180, layout.height * 0.42, 30);
    orbit.target.set(layout.east, layout.height * 0.28, 0);
    orbit.update();
    camera.lookAt(layout.east, layout.height * 0.28, 0);
  }

  return { orbit, walk, tick, setMode, get mode() { return mode; }, lookEastCutaway };
}
