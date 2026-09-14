const canvas = document.getElementById("c");

function exhibit() {
  const h = location.hash.replace(/^#\/?/, "");
  return h === "giza" ? "giza" : "year";
}

function syncNav() {
  const id = exhibit();
  document.getElementById("ex-year")?.classList.toggle("on", id === "year");
  document.getElementById("ex-giza")?.classList.toggle("on", id === "giza");
  const yearHud = document.getElementById("hud");
  const gizaHud = document.getElementById("giza-hud");
  if (yearHud) yearHud.hidden = id !== "year";
  if (gizaHud) gizaHud.hidden = id !== "giza";
  document.title = id === "giza" ? "Giza — Ancient Civilisation" : "Great Year";
}

syncNav();
addEventListener("hashchange", () => location.reload());

if (exhibit() === "giza") {
  const { startGiza } = await import("./giza/app.js");
  await startGiza(canvas);
} else {
  const { startYear } = await import("./year.js");
  await startYear(canvas);
}
