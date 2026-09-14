import * as THREE from "three";

function courseTexture() {
  const w = 512;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#cfc0a4";
  ctx.fillRect(0, 0, w, h);
  const rows = 48;
  for (let i = 0; i < rows; i++) {
    const y = (i / rows) * h;
    const rh = h / rows;
    ctx.fillStyle = i % 2 ? "#c4b496" : "#d2c3a8";
    ctx.fillRect(0, y, w, rh - 1.4);
    ctx.fillStyle = "rgba(90, 70, 40, 0.18)";
    ctx.fillRect(0, y + rh - 1.6, w, 1.6);
    const blocks = 6 + (i % 3);
    for (let b = 1; b < blocks; b++) {
      const x = ((b + (i % 2) * 0.5) / blocks) * w;
      ctx.fillRect(x, y, 1.2, rh);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function graniteTexture() {
  const w = 256;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#7a4c46";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = 0.6 + Math.random() * 2.2;
    ctx.fillStyle = Math.random() > 0.55 ? "rgba(210,180,160,0.28)" : "rgba(40,20,18,0.25)";
    ctx.fillRect(x, y, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeMaterials() {
  const courses = courseTexture();
  const graniteMap = graniteTexture();

  const casing = new THREE.MeshStandardMaterial({
    color: "#e2d3b6",
    roughness: 0.42,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const core = new THREE.MeshStandardMaterial({
    map: courses,
    color: "#d2c4a8",
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const limestone = new THREE.MeshStandardMaterial({
    color: "#cbbba0",
    roughness: 0.7,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  const granite = new THREE.MeshStandardMaterial({
    map: graniteMap,
    color: "#9a6a62",
    roughness: 0.5,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  const sand = new THREE.MeshStandardMaterial({
    color: "#8a7344",
    roughness: 0.95,
    metalness: 0,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: "#d7b56a",
    roughness: 0.28,
    metalness: 0.65,
  });

  const ghost = new THREE.MeshStandardMaterial({
    color: "#9fd4ea",
    transparent: true,
    opacity: 0.18,
    roughness: 0.2,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const pavement = new THREE.MeshStandardMaterial({
    color: "#b7a88c",
    roughness: 0.82,
    metalness: 0.02,
  });

  return { casing, core, limestone, granite, sand, gold, ghost, pavement, courses };
}
