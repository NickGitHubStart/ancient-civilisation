import * as THREE from "three";
import { AU } from "./astro.js";

const BODIES = [
  { id: "mercury", name: "Merkur", au: 0.387, years: 0.241, size: 0.55 },
  { id: "venus", name: "Venus", au: 0.723, years: 0.615, size: 0.85 },
  { id: "mars", name: "Mars", au: 1.524, years: 1.881, size: 0.7 },
  { id: "jupiter", name: "Jupiter", au: 5.204, years: 11.86, size: 1.35 },
  { id: "saturn", name: "Saturn", au: 9.583, years: 29.46, size: 1.15, ring: true },
  { id: "uranus", name: "Uranus", au: 19.19, years: 84.01, size: 0.72 },
  { id: "neptune", name: "Neptun", au: 30.07, years: 164.8, size: 0.7 },
];

function loadTex(url) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

export async function createPlanets() {
  const group = new THREE.Group();
  group.visible = false;
  const bodies = [];
  for (const body of BODIES) {
    const tex = await loadTex(`/planets/${body.id}.jpg`);
    const mat = tex
      ? new THREE.MeshBasicMaterial({ map: tex })
      : new THREE.MeshBasicMaterial({ color: "#c4b8a4" });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(body.size, 32, 24), mat);
    const pivot = new THREE.Group();
    mesh.position.set(AU * body.au, 0, 0);
    pivot.add(mesh);
    if (body.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(body.size * 1.3, body.size * 2.1, 64),
        new THREE.MeshBasicMaterial({
          color: "#d9c7a2",
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      ring.rotation.x = Math.PI / 2.4;
      mesh.add(ring);
    }
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 128 }, (_, i) => {
          const a = (i / 128) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * AU * body.au, 0, Math.sin(a) * AU * body.au);
        })
      ),
      new THREE.LineBasicMaterial({ color: "#d7b56a", transparent: true, opacity: 0.28 })
    );
    group.add(pivot, orbit);
    bodies.push({ pivot, years: body.years, mesh });
  }

  function update(year) {
    for (const body of bodies) {
      body.pivot.rotation.y = (year / body.years) * Math.PI * 2;
      body.mesh.rotation.y += 0.004;
    }
  }

  function setVisible(on) {
    group.visible = on;
  }

  return { group, update, setVisible };
}
