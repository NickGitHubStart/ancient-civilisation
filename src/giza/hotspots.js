import * as THREE from "three";

function markerTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8, 10, 16, 0.82)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#d7b56a";
  ctx.stroke();
  ctx.fillStyle = "#d7b56a";
  ctx.font = "italic 72px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("i", 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function theoryTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8, 10, 16, 0.82)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#9fd4ea";
  ctx.stroke();
  ctx.fillStyle = "#9fd4ea";
  ctx.font = "italic 72px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("i", 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function resolveAnchor(anchor, layout) {
  const k = layout.kings;
  const q = layout.queens;
  switch (anchor) {
    case "apex":
      return new THREE.Vector3(0, layout.height, 0);
    case "mid-face-n":
      return new THREE.Vector3(0, layout.height * 0.35, -layout.half * 0.62);
    case "base-n":
      return new THREE.Vector3(0, 2.2, -layout.half);
    case "entrance":
      return new THREE.Vector3(layout.entrance.x, layout.entrance.y + 1.4, layout.entrance.z);
    case "descending-mid":
      return new THREE.Vector3(
        (layout.entrance.x + layout.descEnd.x) / 2,
        (layout.entrance.y + layout.descEnd.y) / 2,
        (layout.entrance.z + layout.descEnd.z) / 2
      );
    case "plugs":
      return new THREE.Vector3(layout.plugs.start.x, layout.plugs.start.y + 1, layout.plugs.start.z);
    case "subterranean":
      return new THREE.Vector3(layout.subterranean.x, layout.subterranean.y + 2.2, layout.subterranean.z);
    case "queens-chamber":
      return new THREE.Vector3(q.x, q.y + 3.2, q.z);
    case "gallery-mid":
      return new THREE.Vector3(
        (layout.galleryN.x + layout.galleryS.x) / 2,
        (layout.galleryN.y + layout.galleryS.y) / 2 + 4.2,
        (layout.galleryN.z + layout.galleryS.z) / 2
      );
    case "antechamber":
      return new THREE.Vector3(layout.ante.x, layout.ante.y + 2.2, layout.ante.z);
    case "kings-chamber":
      return new THREE.Vector3(k.x, k.y + 2.4, k.z);
    case "coffer":
      return new THREE.Vector3(layout.coffer.x, layout.coffer.y + 1.5, layout.coffer.z);
    case "relieving":
      return new THREE.Vector3(k.x, k.y + k.h + 6, k.z);
    case "big-void":
      return new THREE.Vector3(layout.bigVoid.x, layout.bigVoid.y, layout.bigVoid.z);
    default:
      return new THREE.Vector3(0, 20, 0);
  }
}

export function createHotspots(items, layout) {
  const group = new THREE.Group();
  group.name = "hotspots";
  const gold = markerTexture();
  const ice = theoryTexture();
  const sprites = [];

  for (const item of items) {
    const pos = resolveAnchor(item.anchor, layout);
    if (item.offset) pos.add(new THREE.Vector3(...item.offset));
    const mat = new THREE.SpriteMaterial({
      map: item.category === "measured" ? gold : ice,
      transparent: true,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(pos);
    s.scale.set(2.4, 2.4, 1);
    s.userData.hotspot = item;
    group.add(s);
    sprites.push(s);
  }

  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function pick(event, camera, canvas) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(sprites, false);
    return hits[0]?.object.userData.hotspot ?? null;
  }

  function setFilter(sourceId) {
    for (const s of sprites) {
      const id = s.userData.hotspot.source?.id;
      s.visible = !sourceId || id === sourceId;
    }
  }

  return { group, sprites, pick, setFilter };
}
