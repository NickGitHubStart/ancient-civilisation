import {
  UNITS,
  UNIT_LABEL,
  formatMeasure,
  formatOriginal,
  formatAngle,
} from "./units.js";

const excerptFiles = import.meta.glob("./data/excerpts/*.txt", {
  eager: true,
  query: "?raw",
  import: "default",
});

function excerptById(id) {
  if (!id) return "";
  const key = Object.keys(excerptFiles).find((k) => k.endsWith(`${id}.txt`));
  return key ? excerptFiles[key].trim() : "";
}

function flattenMeasures(khufu, out = {}, prefix = "") {
  if (!khufu || typeof khufu !== "object") return out;
  if (khufu.original || khufu.dms) {
    out[khufu.id || prefix] = khufu;
    return out;
  }
  for (const [k, v] of Object.entries(khufu)) {
    if (v && typeof v === "object") flattenMeasures(v, out, k);
  }
  return out;
}

export function createGizaUI({
  khufu,
  sources,
  hotspots,
  onUnit,
  onCutaway,
  onMode,
  onSourceFilter,
}) {
  const measures = flattenMeasures(khufu);
  let unit = "m";
  let active = null;

  const unitBtns = [...document.querySelectorAll("#giza-units button")];
  const cutBtn = document.getElementById("giza-cut");
  const modeBtns = [...document.querySelectorAll("#giza-modes button")];
  const panel = document.getElementById("giza-panel");
  const panelTitle = document.getElementById("giza-panel-title");
  const panelBody = document.getElementById("giza-panel-body");
  const panelClose = document.getElementById("giza-panel-close");
  const sourceBtn = document.getElementById("giza-source-toggle");
  const drawer = document.getElementById("giza-sources");
  const drawerList = document.getElementById("giza-source-list");
  const hint = document.getElementById("giza-hint");

  function setUnit(next) {
    unit = next;
    unitBtns.forEach((b) => b.classList.toggle("on", b.dataset.unit === unit));
    onUnit(unit);
    if (active) openHotspot(active);
  }

  unitBtns.forEach((b) => b.addEventListener("click", () => setUnit(b.dataset.unit)));
  cutBtn.addEventListener("click", () => {
    const on = onCutaway();
    cutBtn.classList.toggle("on", on);
    cutBtn.textContent = on ? "Schnitt an" : "Schnitt aus";
  });
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      onMode(b.dataset.mode);
      modeBtns.forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  panelClose.addEventListener("click", () => {
    panel.hidden = true;
    active = null;
  });
  sourceBtn.addEventListener("click", () => {
    drawer.hidden = !drawer.hidden;
  });

  const used = new Set(hotspots.map((h) => h.source?.id).filter(Boolean));
  drawerList.innerHTML = "";
  for (const id of used) {
    const src = sources[id];
    if (!src) continue;
    const li = document.createElement("button");
    li.type = "button";
    li.className = "src-item";
    li.dataset.source = id;
    li.innerHTML = `<strong>${src.author}</strong><span>${src.title} (${src.year})</span>`;
    li.addEventListener("click", () => {
      const on = li.classList.toggle("on");
      drawerList.querySelectorAll(".src-item").forEach((el) => {
        if (el !== li) el.classList.remove("on");
      });
      onSourceFilter(on ? id : null);
    });
    drawerList.appendChild(li);
  }

  function measureLine(id) {
    const meas = measures[id];
    if (!meas) return "";
    if (meas.dms) {
      return `<div class="num">${formatAngle(meas.dms)}</div>`;
    }
    if (!meas.original) return "";
    return `<div class="num">
      <span>${formatMeasure(meas, unit)}</span>
      <small>Original: ${formatOriginal(meas)}</small>
    </div>`;
  }

  function openHotspot(item) {
    active = item;
    panel.hidden = false;
    panel.dataset.cat = item.category;
    panelTitle.textContent = item.title;
    const nums = (item.measureIds || []).map(measureLine).join("");
    const src = sources[item.source?.id];
    const excerpt = excerptById(item.source?.excerptId);
    const srcBlock = src
      ? `<details class="src">
          <summary>Quelle</summary>
          <p>${src.author}, <em>${src.title}</em> (${src.year})${item.source.loc ? `, ${item.source.loc}` : ""}.</p>
          ${excerpt ? `<blockquote>${excerpt.replace(/\n/g, "<br/>")}</blockquote>` : ""}
          ${src.url ? `<p><a href="${src.url}" target="_blank" rel="noreferrer">Original öffnen</a></p>` : ""}
          ${src.doi ? `<p>DOI: ${src.doi}</p>` : ""}
          <p class="license">${src.license === "pd" ? "Public Domain" : "Nur Nachweis, kein Volltext."}</p>
        </details>`
      : "";
    panelBody.innerHTML = `
      ${nums}
      ${item.precision ? `<p class="prec">${item.precision}</p>` : ""}
      <p class="meas"><em>Gemessen.</em> ${item.measured}</p>
      ${item.theory ? `<p class="thy"><em>Deutung.</em> ${item.theory}</p>` : ""}
      ${srcBlock}
    `;
  }

  function setHint(text) {
    hint.textContent = text;
    hint.classList.add("show");
  }

  setUnit("m");
  cutBtn.classList.add("on");
  return { setUnit, openHotspot, setHint, get unit() { return unit; } };
}

export { UNIT_LABEL, UNITS };
