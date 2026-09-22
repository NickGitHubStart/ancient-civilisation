export const DEG = Math.PI / 180;
export const GREAT_YEAR = 25920;
export const YEAR_PER_DEGREE = 72;
export const HOUSE_YEARS = 2160;
export const OBLIQUITY_J2000 = 23.4393 * DEG;
export const EPOCH = 2000;
export const AU = 12;
export const EARTH_R = 1.45;
export const SUN_R = 1.85;
export const SKY_R = 48;
export const ECC_VISUAL = 7.5;
export const YEAR_MIN = -80000;
export const YEAR_MAX = 20000;

export function clamp(x, a = 0, b = 1) {
  return Math.min(b, Math.max(a, x));
}

export function formatYear(year, lang = "en") {
  const y = Math.round(year);
  const abs = Math.abs(y);
  const n =
    lang === "de"
      ? abs >= 10000
        ? abs.toLocaleString("de-DE")
        : String(abs)
      : abs >= 10000
        ? abs.toLocaleString("en-US")
        : String(abs);
  const ce = lang === "de" ? "n. Chr." : "AD";
  const bce = lang === "de" ? "v. Chr." : "BC";
  if (y >= 1) return `${n} ${ce}`;
  if (y === 0) return `1 ${bce}`;
  return `${n} ${bce}`;
}

export function formatTilt(eps) {
  const d = eps / DEG;
  return `${d.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°`;
}

export function formatPointer(year, today = 2026, lang = "en") {
  const deg = (year - today) / YEAR_PER_DEGREE;
  const n = Math.abs(deg).toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (Math.abs(deg) < 0.05) return "0°";
  if (deg > 0) return lang === "de" ? `${n}° westlich` : `${n}° west`;
  return `${n}°`;
}

export function vernalLongitude(year) {
  return -((year - EPOCH) / GREAT_YEAR) * Math.PI * 2;
}

export function poleLongitude(year) {
  return Math.PI / 2 + vernalLongitude(year);
}

export function eccentricity(year) {
  const a = Math.cos((2 * Math.PI * (year + 25000)) / 100000);
  const b = Math.cos((2 * Math.PI * year) / 405000);
  return 0.017 + 0.021 * a + 0.006 * b;
}

export function obliquity(year) {
  return (23.3 + 1.2 * Math.cos((2 * Math.PI * (year + 7450)) / 41000)) * DEG;
}

export function tiltRising(year) {
  const phase = (2 * Math.PI * (year + 7450)) / 41000;
  return -Math.sin(phase) > 0;
}

export function perihelionLongitude(year) {
  return 102.9 * DEG + ((year - EPOCH) / 112000) * Math.PI * 2;
}

export function raDecToDir(raDeg, decDeg, out = { x: 0, y: 0, z: 0 }) {
  let ra = raDeg;
  if (ra < 0) ra += 360;
  ra *= DEG;
  const dec = decDeg * DEG;
  const eps = OBLIQUITY_J2000;
  const xEq = Math.cos(dec) * Math.cos(ra);
  const yEq = Math.cos(dec) * Math.sin(ra);
  const zEq = Math.sin(dec);
  const yEcl = yEq * Math.cos(eps) + zEq * Math.sin(eps);
  const zEcl = -yEq * Math.sin(eps) + zEq * Math.cos(eps);
  out.x = xEq;
  out.y = zEcl;
  out.z = yEcl;
  return out;
}

export function eclipticDir(lambda, beta, out = { x: 0, y: 0, z: 0 }) {
  const cb = Math.cos(beta);
  out.x = cb * Math.cos(lambda);
  out.y = Math.sin(beta);
  out.z = cb * Math.sin(lambda);
  return out;
}

export function poleDir(year, eps, out = { x: 0, y: 0, z: 0 }) {
  return eclipticDir(poleLongitude(year), Math.PI / 2 - eps, out);
}

export function earthRadius(trueAnomaly, e, a = AU) {
  const ev = Math.min(0.48, e * ECC_VISUAL);
  return (a * (1 - ev * ev)) / (1 + ev * Math.cos(trueAnomaly));
}

export function earthPosition(heliocentricLong, e, a = AU) {
  const peri = perihelionLongitude(0);
  const nu = heliocentricLong - peri;
  const r = earthRadius(nu, e, a);
  return {
    x: r * Math.cos(heliocentricLong),
    y: 0,
    z: r * Math.sin(heliocentricLong),
  };
}

export function conditions(year) {
  const e = eccentricity(year);
  const eps = obliquity(year);
  const psi = poleLongitude(year);
  const peri = perihelionLongitude(year);
  const summerEarth = psi + Math.PI;
  const aphelion = peri + Math.PI;
  let d = Math.abs(summerEarth - aphelion) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;

  const A = clamp((e - 0.014) / 0.028);
  const B = clamp((23.7 * DEG - eps) / (1.5 * DEG));
  const C = clamp(1 - d / (90 * DEG));

  return {
    e,
    eps,
    A,
    B,
    C,
    onA: A > 0.62,
    onB: B > 0.62,
    onC: C > 0.62,
    ice: clamp(A * 0.28 + B * 0.32 + C * 0.4),
    all: A > 0.62 && B > 0.62 && C > 0.62,
  };
}
