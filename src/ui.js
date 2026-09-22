import { YEAR_MAX, YEAR_MIN, formatPointer, formatTilt, formatYear } from "./astro.js";

const TOUR = [
  {
    title: "Ein Jahr",
    text: "Jedes Jahr umrundet die Erde die Sonne einmal. Dabei wandert die Sonne vorwärts durch die zwölf Sternbilder — ungefähr eines pro Monat.",
    cam: { x: 10, y: 16, z: 18 },
    year: 2026,
    tempo: 1,
    play: true,
  },
  {
    title: "Hinter der Sonne",
    text: "Tagsüber überstrahlt die Sonne das Sternbild. Nachts steht das gegenüberliegende am Himmel. Daraus wussten sie, wo die Sonne steht.",
    cam: { x: 14, y: 10, z: 22 },
    play: false,
  },
  {
    title: "Der Zeiger",
    text: "Am 21. März, Frühlingsanfang, steht die Sonne vor genau einem Sternbild. Das ist der Zeiger des Weltalters — heute die Fische.",
    cam: { x: 8, y: 14, z: 20 },
    tempo: 72,
    play: false,
    snap: true,
  },
  {
    title: "Präzession",
    text: "Die Achse taumelt wie ein Kreisel, einmal in 25.920 Jahren. Deshalb kriecht dieser Zeiger rückwärts durch die Sternbilder. Ein Grad braucht 72 Jahre.",
    cam: { x: 6, y: 22, z: 16 },
    tempo: 72,
    play: true,
  },
  {
    title: "Die Zahlen",
    text: "72 Jahre = 1°. Ein Sternbild hat 30°, also 2.160 Jahre. Zwölf Sternbilder: 25.920 Jahre. Das ist Hancock’s Great Year — ein voller Umlauf des Zeigers.",
    cam: { x: 4, y: 28, z: 10 },
    play: false,
  },
  {
    title: "Die Neigung",
    text: "Die Achse lehnt 22,1° bis 24,5° von der Senkrechten weg — die Zahl unter B. Je weiter sie lehnt, desto höher steht die Sommersonne über den Polen und desto tiefer die Wintersonne. Deshalb werden Sommer wärmer und Winter kälter. Steht sie steiler, bleiben beide gemäßigter.",
    cam: { x: 16, y: 10, z: 16 },
    play: false,
  },
  {
    title: "Drei Uhren",
    text: "A Bahn, rund 100.000 Jahre: wie oval die Ellipse ist. B Neigung, 41.000 Jahre: 22° bis 24,5°, wie stark Sommer und Winter sind. C Präzession, 26.000 Jahre: der Zeiger durch die Sternbilder.",
    cam: { x: 12, y: 18, z: 18 },
    play: false,
  },
  {
    title: "Wenn sie zusammenfallen",
    text: "Bahn länglich, Achse steil, Nord-Sommer am fernsten Punkt: der Schnee schmilzt nicht. Dann Eiszeiten — Flut, Feuer und Eis. Die Mühlen der Götter mahlen langsam.",
    cam: { x: 20, y: 9, z: 22 },
    year: -21000,
    play: false,
  },
];

const EXPLAIN = {
  A: "Die Bahn ist am länglichsten. Am fernsten Punkt liegt die Erde Millionen Meilen weiter von der Sonne.",
  B: "Die Achse lehnt 22,1° bis 24,5° von der Senkrechten. Je weiter, desto höher die Sommersonne über den Polen — Sommer wärmer, Winter kälter. Steiler: beides gemäßigter.",
  C: "Durch die Präzession fällt der Winter einer Halbkugel auf den fernsten Punkt der Bahn.",
};

export function createUI(state, camera) {
  const yearEl = document.getElementById("year");
  const signEl = document.getElementById("sign");
  const tiltEl = document.getElementById("tilt");
  const pointerEl = document.getElementById("pointer-deg");
  const planetsToggle = document.getElementById("planets-toggle");
  const crustPanel = document.getElementById("crust-panel");
  const shiftBtn = document.getElementById("shift-play");
  const abcEl = document.getElementById("abc");
  const gateBtns = [...document.querySelectorAll("#crust-conds button")];
  const CRUST_EXPLAIN = {
    ice: "Das Eis liegt nicht mittig auf dem Pol. Diese schiefe, schwere Kappe ist der Auslöser.",
    spin: "Die Erde dreht diese schiefe Masse. Daraus wird Zug auf die ganze Kruste.",
    gate: "Der Zug reicht. Die Kruste gleitet als eine Haut: die Antarktis rutscht in den Pol, Nordamerika unter dem Eis hervor.",
  };
  const hintEl = document.getElementById("hint");
  const slider = document.getElementById("slider");
  const playBtn = document.getElementById("play");
  const tourBox = document.getElementById("tour");
  const tourStep = document.getElementById("tour-step");
  const tourTitle = document.getElementById("tour-title");
  const tourText = document.getElementById("tour-text");
  const tourNext = document.getElementById("tour-next");
  const condBtns = [...document.querySelectorAll("#abc button")];
  const tempoWrap = document.getElementById("tempo");
  const tempoToggle = document.getElementById("tempo-toggle");
  const tempoMenu = document.getElementById("tempo-menu");
  const tempoBtns = [...tempoMenu.querySelectorAll("button")];
  const TEMPO = {
    month: { yearsPerSec: 1 / 12, label: "1 Monat" },
    1: { yearsPerSec: 1, label: "1 Jahr" },
    72: { yearsPerSec: 72, label: "72 Jahre" },
    2160: { yearsPerSec: 2160, label: "2160 Jahre" },
  };

  slider.min = YEAR_MIN;
  slider.max = YEAR_MAX;
  slider.value = state.year;

  const camTarget = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  let hintTimer = 0;
  let tourIndex = -1;
  let openCond = null;

  function setHint(text, seconds = 4.5) {
    hintEl.textContent = text;
    hintEl.classList.add("show");
    hintTimer = seconds;
  }

  function setYear(y, fromSlider = false) {
    state.year = Math.min(YEAR_MAX, Math.max(YEAR_MIN, y));
    if (!fromSlider) slider.value = state.year;
    yearEl.textContent = formatYear(state.year);
  }

  function setTempoOpen(open) {
    tempoWrap.classList.toggle("open", open);
    tempoMenu.hidden = !open;
    tempoToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setTempo(tempo) {
    const id = String(tempo);
    const t = TEMPO[id];
    if (!t) return;
    state.tempo = t.yearsPerSec;
    state.tempoId = id;
    tempoToggle.textContent = t.label;
    tempoBtns.forEach((b) => {
      const on = b.dataset.tempo === id;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    setTempoOpen(false);
  }

  shiftBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.shiftPlay) {
      state.shiftPlay = false;
    } else {
      state.wantGlobe = true;
      state.crustOn = true;
      state.shiftPlay = true;
      state.shiftT = 0;
      setYear(-14500);
    }
    syncCrust();
  });
  gateBtns.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const k = b.dataset.gate;
      if (openCond === k) {
        openCond = null;
        hintEl.classList.remove("show");
        return;
      }
      openCond = k;
      hintEl.textContent = CRUST_EXPLAIN[k];
      hintEl.classList.add("show");
      hintTimer = 15;
    });
  });

  function syncCrust() {
    const on = !!state.globe;
    crustPanel.hidden = !on;
    abcEl.style.display = on ? "none" : "";
    document.getElementById("crust-caption").hidden = !on;
    shiftBtn.classList.toggle("on", !!state.shiftPlay);
    shiftBtn.textContent = state.shiftPlay ? "Stopp" : "Verschiebung";
    const slip = state.slip || 0;
    const gates = {
      ice: state.crustOn && slip > 0.35,
      spin: !!state.crustOn,
      gate: state.crustOn && slip > 0.72,
    };
    gateBtns.forEach((b) => b.classList.toggle("on", !!gates[b.dataset.gate]));
  }

  planetsToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    state.planets = !state.planets;
    planetsToggle.setAttribute("aria-pressed", state.planets ? "true" : "false");
    planetsToggle.classList.toggle("on", state.planets);
  });

  function setPlaying(on) {
    state.playing = on;
    playBtn.classList.toggle("on", on);
    playBtn.textContent = on ? "❚❚" : "▶";
  }

  slider.addEventListener("input", () => {
    setYear(Number(slider.value), true);
    state.snapSpring = true;
  });
  playBtn.addEventListener("click", () => {
    state.playing = !state.playing;
    playBtn.classList.toggle("on", state.playing);
    playBtn.textContent = state.playing ? "❚❚" : "▶";
  });
  tempoToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setTempoOpen(tempoMenu.hidden);
  });
  tempoBtns.forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      setTempo(b.dataset.tempo);
    })
  );

  condBtns.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const k = b.dataset.cond;
      if (openCond === k) {
        openCond = null;
        hintEl.classList.remove("show");
        return;
      }
      openCond = k;
      hintEl.textContent = EXPLAIN[k];
      hintEl.classList.add("show");
      hintTimer = 15;
    });
  });
  document.addEventListener("click", () => {
    if (openCond && tourIndex < 0) {
      openCond = null;
      hintEl.classList.remove("show");
    }
    setTempoOpen(false);
  });

  document.getElementById("tour-btn").addEventListener("click", startTour);
  document.getElementById("tour-skip").addEventListener("click", endTour);
  tourNext.addEventListener("click", () => {
    if (tourIndex >= TOUR.length - 1) return;
    tourIndex += 1;
    applyTour(TOUR[tourIndex]);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      setYear(state.year - (e.shiftKey ? 720 : 72));
      state.snapSpring = true;
    }
    if (e.key === "ArrowRight") {
      setYear(state.year + (e.shiftKey ? 720 : 72));
      state.snapSpring = true;
    }
    if (e.key === " ") {
      e.preventDefault();
      playBtn.click();
    }
  });

  function startTour() {
    tourIndex = 0;
    openCond = null;
    tourBox.hidden = false;
    applyTour(TOUR[0]);
  }

  function endTour() {
    tourBox.hidden = true;
    tourIndex = -1;
    setPlaying(false);
    hintEl.classList.remove("show");
  }

  function applyTour(step) {
    tourStep.textContent = `${tourIndex + 1} / ${TOUR.length}`;
    tourTitle.textContent = step.title;
    tourText.textContent = step.text;
    if (step.cam) Object.assign(camTarget, step.cam);
    if (step.tempo) setTempo(step.tempo);
    if (step.year != null) setYear(step.year);
    if (step.snap || (step.tempo && step.tempo !== 1)) state.snapSpring = true;
    setPlaying(!!step.play);
    tourNext.hidden = tourIndex >= TOUR.length - 1;
  }

  function tick(dt, cond, signName) {
    signEl.textContent = signName;
    tiltEl.textContent = formatTilt(cond.eps);
    pointerEl.textContent = formatPointer(state.year);
    if (state.globe) syncCrust();
    condBtns.forEach((b) => {
      const k = b.dataset.cond;
      b.classList.toggle("on", cond["on" + k]);
    });
    if (hintTimer > 0) {
      hintTimer -= dt;
      if (hintTimer <= 0) {
        hintEl.classList.remove("show");
        openCond = null;
      }
    }
    if (tourIndex >= 0) {
      camera.position.x += (camTarget.x - camera.position.x) * Math.min(1, dt * 1.6);
      camera.position.y += (camTarget.y - camera.position.y) * Math.min(1, dt * 1.6);
      camera.position.z += (camTarget.z - camera.position.z) * Math.min(1, dt * 1.6);
    }
  }

  function followCamera() {
    camTarget.x = camera.position.x;
    camTarget.y = camera.position.y;
    camTarget.z = camera.position.z;
  }

  setYear(state.year);
  setTempo(state.tempo);

  return { setYear, setTempo, setPlaying, setHint, tick, followCamera, startTour, syncCrust };
}
