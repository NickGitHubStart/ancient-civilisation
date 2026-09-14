import * as THREE from "three";

/** North–south section through the passage axis. Clips the east half of the shell. */
export function createCutaway(layout, shellMaterial) {
  const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), layout.east);
  let on = true;

  function apply(enabled) {
    on = enabled;
    const planes = enabled ? [plane] : [];
    const mats = Array.isArray(shellMaterial) ? shellMaterial : [shellMaterial];
    for (const mat of mats) {
      mat.clippingPlanes = planes;
      mat.clipShadows = enabled;
      mat.needsUpdate = true;
    }
  }

  apply(true);
  return {
    plane,
    get on() {
      return on;
    },
    set(enabled) {
      apply(enabled);
    },
    toggle() {
      apply(!on);
      return on;
    },
  };
}
