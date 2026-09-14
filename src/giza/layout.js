import { setCubitInches, toMeters } from "./units.js";

export function dmsToDeg({ deg = 0, min = 0, sec = 0, sign = 1 } = {}) {
  return sign * (deg + min / 60 + sec / 3600);
}

function m(measure) {
  return toMeters(measure);
}

function lerp3(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/** Meter positions from Petrie/Cole originals. +X east, +Y up, +Z south. */
export function buildLayout(khufu) {
  setCubitInches(khufu.cubit.original.value);

  const base = m(khufu.exterior.baseMeanPetrie);
  const height = m(khufu.exterior.heightOriginal);
  const half = base / 2;
  const east = m(khufu.entrance.eastOfCenter);
  const pw = m(khufu.passageSection.width);
  const ph = m(khufu.passageSection.height);

  const entrance = {
    x: east,
    y: m(khufu.entrance.abovePavement),
    z: -half + m(khufu.entrance.southOfNorthCasing),
  };

  const descEnd = {
    x: east,
    y: m(khufu.descending.endLevel),
    z: -m(khufu.descending.endNorthOfCenter),
  };

  const jT =
    khufu.descending.junctionOnFloor.original.value /
    khufu.descending.lengthFloor.original.value;
  const junction = lerp3(entrance, descEnd, jT);

  const galleryN = {
    x: east,
    y: m(khufu.ascending.endLevel),
    z: -m(khufu.ascending.endNorthOfCenter),
  };

  const galleryS = {
    x: east,
    y: m(khufu.gallery.southWallLevel),
    z: m(khufu.gallery.southWallSouthOfCenter),
  };

  const stepLen = m(khufu.gallery.stepLength);
  const galDir = {
    x: galleryS.x - galleryN.x,
    y: galleryS.y - galleryN.y,
    z: galleryS.z - galleryN.z,
  };
  const galLen = Math.hypot(galDir.x, galDir.y, galDir.z);
  const galU = { x: galDir.x / galLen, y: galDir.y / galLen, z: galDir.z / galLen };
  const stepFront = {
    x: galleryS.x - galU.x * stepLen,
    y: galleryS.y - galU.y * stepLen,
    z: galleryS.z - galU.z * stepLen,
  };
  const stepTopY = m(khufu.gallery.stepTopLevel);

  const qcNs = m(khufu.queensChamber.ns);
  const qcEw = m(khufu.queensChamber.ew);
  const qcFloor = m(khufu.queensPassage.floorLow);
  const qcN = -m(khufu.queensChamber.nWallNorthOfCenter);
  const queens = {
    x: east,
    y: qcFloor,
    z: qcN + qcNs / 2,
    ew: qcEw,
    ns: qcNs,
    wallH: m(khufu.queensChamber.heightWall),
    ridgeH: m(khufu.queensChamber.heightRidge),
    nicheD: m(khufu.queensChamber.nicheDepth),
    nicheW: m(khufu.queensChamber.nicheWidthBase),
    nicheH: m(khufu.queensChamber.nicheHeight),
  };

  const qpStart = { x: east, y: m(khufu.queensPassage.floorHigh) + 0.02, z: galleryN.z };
  const qpStepAt =
    khufu.queensPassage.stepAt.original.value / khufu.queensPassage.lengthToNWall.original.value;
  const qpEnd = { x: east, y: qcFloor, z: qcN };
  const qpMid = lerp3(
    { ...qpStart, y: m(khufu.queensPassage.floorHigh) },
    { x: east, y: m(khufu.queensPassage.floorHigh), z: qcN },
    qpStepAt
  );

  const kcNs = m(khufu.kingsChamber.ns);
  const kcEw = m(khufu.kingsChamber.ew);
  const kcN = m(khufu.kingsChamber.nWallSouthOfCenter);
  const kcFloor = stepTopY;
  const kings = {
    x: east,
    y: kcFloor,
    z: kcN + kcNs / 2,
    ew: kcEw,
    ns: kcNs,
    h: m(khufu.kingsChamber.height),
    courseH: m(khufu.kingsChamber.courseHeight),
  };

  const acLen = m(khufu.antechamber.length);
  const acFrom = m(khufu.antechamber.fromGallerySouth);
  const acN = galleryS.z + acFrom;
  const ante = {
    x: east,
    y: stepTopY,
    z: acN + acLen / 2,
    ns: acLen,
    ew: m(khufu.antechamber.width),
    h: m(khufu.antechamber.height),
  };

  const kpLen = m(khufu.kingsPassage.length);
  const kpStart = { x: east, y: stepTopY, z: acN + acLen };
  const kpEnd = { x: east, y: stepTopY, z: kcN };

  const subEw = m(khufu.subterranean.ew);
  const subNs = m(khufu.subterranean.ns);
  const subN = m(khufu.subterranean.nWallNorthOfCenter);
  const subRoof = m(khufu.subterranean.roofLevel);
  const subH = 3.4;
  const subterranean = {
    x: east,
    y: subRoof - subH,
    z: subN + subNs / 2,
    ew: subEw,
    ns: subNs,
    h: subH,
    roof: subRoof,
  };

  const deadStart = { ...descEnd };
  const deadEndPtM = {
    x: east,
    y: descEnd.y + 0.15,
    z: descEnd.z + m(khufu.subterranean.deadEndLength),
  };

  const plugStartT =
    khufu.ascending.plugFromFloorJoin.original.value / khufu.ascending.lengthFloor.original.value;
  const plugEndT =
    khufu.ascending.plugAncientTop.original.value / khufu.ascending.lengthFloor.original.value;
  const plugs = {
    start: lerp3(junction, galleryN, plugStartT),
    end: lerp3(junction, galleryN, plugEndT),
    wN: m(khufu.ascending.plugWidthN),
    wS: m(khufu.ascending.plugWidthS),
    h: m(khufu.ascending.plugHeight),
  };

  const coffer = {
    l: m(khufu.coffer.outerLength),
    w: m(khufu.coffer.outerWidth),
    h: m(khufu.coffer.outerHeight),
    il: m(khufu.coffer.innerLength),
    iw: m(khufu.coffer.innerWidth),
    id: m(khufu.coffer.innerDepth),
    x: kings.x - kcEw / 2 + m(khufu.coffer.outerWidth) / 2 + 0.45,
    y: kcFloor,
    z: kings.z,
  };

  const galH = m(khufu.gallery.heightHalf) * 2;
  const voidLen = m(khufu.bigVoid.minLength);
  const galMid = lerp3(galleryN, galleryS, 0.45);
  const bigVoid = {
    x: east,
    y: galMid.y + galH * 0.55 + 6,
    z: galMid.z + 4,
    length: voidLen,
    w: m(khufu.gallery.widthOverall),
    h: galH * 0.85,
    slope: galU,
  };

  return {
    base,
    height,
    half,
    east,
    pw,
    ph,
    azimuthDeg: dmsToDeg(khufu.exterior.azimuthMeanCole.dms),
    angleDeg: dmsToDeg(khufu.exterior.angleMean.dms),
    entrance,
    descEnd,
    junction,
    galleryN,
    galleryS,
    galU,
    galLen,
    galH,
    stepFront,
    stepTopY,
    stepLen,
    queens,
    qpStart: { x: east, y: m(khufu.queensPassage.floorHigh), z: galleryN.z + 0.3 },
    qpMid: { x: east, y: m(khufu.queensPassage.floorHigh), z: qpMid.z },
    qpEnd,
    kings,
    ante,
    kpStart,
    kpEnd,
    subterranean,
    deadStart,
    deadEnd: deadEndPtM,
    deadW: m(khufu.subterranean.horizWidth),
    deadH: m(khufu.subterranean.horizHeight),
    plugs,
    coffer,
    bigVoid,
    galleryWidth: m(khufu.gallery.widthOverall),
    galleryFloorW: m(khufu.gallery.widthFloorBetweenRamps),
    corbelSum: m(khufu.gallery.corbelSum),
    corbelCount: khufu.gallery.corbelCount,
    holeLong: m(khufu.gallery.holeLong),
    holeShort: m(khufu.gallery.holeShort),
    relH: m(khufu.relieving.eachHeight),
    relCount: khufu.relieving.count,
    shaftN: dmsToDeg(khufu.queensChamber.shaftNorthAngle.dms),
    shaftS: dmsToDeg(khufu.queensChamber.shaftSouthAngle.dms),
    shaftSize: m(khufu.queensChamber.shaftHeight),
    measures: khufu,
  };
}
