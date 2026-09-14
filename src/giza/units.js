/** Length conversion. Canonical values live in the source unit of the surveyor. */

export const UNITS = ["m", "cubit", "ft", "in"];

export const UNIT_LABEL = {
  m: "m",
  cubit: "Elle",
  ft: "ft",
  in: "in",
};

const IN_PER_FT = 12;
const M_PER_IN = 0.0254;
const M_PER_FT = 0.3048;

/** Petrie §52: mean cubit from King's Chamber base sides. Overridden by khufu.json. */
let cubitInches = 20.632;

export function setCubitInches(inches) {
  cubitInches = inches;
}

export function getCubitInches() {
  return cubitInches;
}

export function toInches(value, unit) {
  switch (unit) {
    case "in":
      return value;
    case "ft":
      return value * IN_PER_FT;
    case "m":
      return value / M_PER_IN;
    case "cubit":
      return value * cubitInches;
    default:
      throw new Error(`unknown unit: ${unit}`);
  }
}

export function fromInches(inches, unit) {
  switch (unit) {
    case "in":
      return inches;
    case "ft":
      return inches / IN_PER_FT;
    case "m":
      return inches * M_PER_IN;
    case "cubit":
      return inches / cubitInches;
    default:
      throw new Error(`unknown unit: ${unit}`);
  }
}

export function convert(value, from, to) {
  if (from === to) return value;
  return fromInches(toInches(value, from), to);
}

export function toMeters(measure) {
  const { value, unit } = measure.original ?? measure;
  return convert(value, unit, "m");
}

export function formatNumber(value, unit) {
  const abs = Math.abs(value);
  let digits = 2;
  if (unit === "in") digits = abs >= 100 ? 1 : 2;
  if (unit === "m") digits = abs >= 20 ? 2 : 3;
  if (unit === "cubit") digits = abs >= 10 ? 2 : 3;
  if (unit === "ft") digits = abs >= 20 ? 2 : 3;
  const n = value.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${n} ${UNIT_LABEL[unit]}`;
}

export function formatMeasure(measure, displayUnit) {
  const inches = toInches(measure.original.value, measure.original.unit);
  return formatNumber(fromInches(inches, displayUnit), displayUnit);
}

export function formatOriginal(measure) {
  const { value, unit, error } = measure.original;
  const core = formatNumber(value, unit);
  if (error != null) {
    const err = formatNumber(error, unit).replace(` ${UNIT_LABEL[unit]}`, "");
    return `${core} ± ${err}`;
  }
  return core;
}

export function formatAngle(dms) {
  const { deg = 0, min = 0, sec = 0, sign = 1 } = dms;
  const s = sign < 0 ? "−" : "";
  if (sec) return `${s}${deg}° ${min}′ ${sec}″`;
  if (min) return `${s}${deg}° ${min}′`;
  return `${s}${deg}°`;
}
