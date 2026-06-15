/**
 * Isomorphic Keplerian Astronomy Engine
 * No native C++ addons, pure typescript computations of sidetral (sidereal) longitudes,
 * Krishnamurti ayanamsa, and Placidus Cusps with Cuspal Pole divisions.
 */

import { SIGNS } from './constants';

export interface AstronomicalState {
  ayanamsa: number;
  planets: Record<string, {
    longitude: number;
    speed: number;
    rawSpeed: number;
    retrograde: boolean;
  }>;
  cusps: Record<number, number>; // 1 to 12
  ramc: number;
}

// Convert deg to rad
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function Math_sin(deg: number) { return Math.sin(deg * RAD); }
function Math_cos(deg: number) { return Math.cos(deg * RAD); }
function Math_tan(deg: number) { return Math.tan(deg * RAD); }
function Math_asin(val: number) { return Math.asin(val) * DEG; }
function Math_acos(val: number) { return Math.acos(val) * DEG; }
function Math_atan2(y: number, x: number) { return Math.atan2(y, x) * DEG; }

function normalizeDegrees(deg: number) {
  let val = deg % 360;
  if (val < 0) val += 360;
  return val;
}

export function getKrishnamurtiAyanamsa(julianCenturies: number): number {
  // Krishnamurti ayanamsa is approx 23.853056 in 2000.0, shifts by approx 50.238 arcseconds per year
  const base2000 = 23.853056;
  const ratePerCentury = 50.238 / 3600.0 * 100.0; // in degrees per century
  return normalizeDegrees(base2000 + ratePerCentury * julianCenturies);
}

export function getJulianCenturies(year: number, month: number, day: number, hoursUtc: number): { jd: number, T: number } {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + (hoursUtc / 24.0);
  const T = (jd - 2451545.0) / 36525.0;
  return { jd, T };
}

// Orbital elements parameters
interface OrbitalElements {
  a: number; // semimajor axis
  e0: number; // eccentricity const
  eT: number; // eccentricity century rate
  i: number; // inclination
  L0: number; // mean longitude const
  LT: number; // mean longitude century rate
  p0: number; // longitude of perihelion const
  pT: number; // perihelion century rate
  o0: number; // longitude of node const
  oT: number; // node century rate
}

const ORBITAL_DATA: Record<string, OrbitalElements> = {
  mercury: {
    a: 0.38709893,
    e0: 0.20563069, eT: 0.00002040,
    i: 7.00487,
    L0: 252.25084, LT: 149472.67411,
    p0: 77.45645, pT: 573.57 / 3600,
    o0: 48.33167, oT: -446.30 / 3600
  },
  venus: {
    a: 0.72333199,
    e0: 0.00677323, eT: -0.00004776,
    i: 3.39471,
    L0: 181.97973, LT: 58517.81538,
    p0: 131.53298, pT: 109.65 / 3600,
    o0: 76.68069, oT: -996.89 / 3600
  },
  earth: { // heliocentric Earth
    a: 1.00000011,
    e0: 0.01671022, eT: -0.00003804,
    i: 0.0,
    L0: 100.46435, LT: 35999.37287,
    p0: 102.94719, pT: 1198.28 / 3600,
    o0: 0.0, oT: 0.0
  },
  mars: {
    a: 1.52366231,
    e0: 0.09341233, eT: 0.00011902,
    i: 1.85061,
    L0: 355.45332, LT: 19140.30268,
    p0: 336.04084, pT: 1560.78 / 3600,
    o0: 49.57854, oT: -1020.19 / 3600
  },
  jupiter: {
    a: 5.20336301,
    e0: 0.04839266, eT: -0.00012880,
    i: 1.30530,
    L0: 34.40438, LT: 3034.74612,
    p0: 14.75385, pT: 839.93 / 3600,
    o0: 100.55615, oT: 1217.17 / 3600
  },
  saturn: {
    a: 9.53707032,
    e0: 0.05415060, eT: -0.00036762,
    i: 2.48446,
    L0: 49.94432, LT: 1222.11379,
    p0: 92.43194, pT: -1948.89 / 3600,
    o0: 113.71504, oT: -259.14 / 3600
  }
};

function getHeliocentricXYZ(planet: string, T: number) {
  const data = ORBITAL_DATA[planet];
  if (!data) return { x: 0, y: 0, z: 0 };

  const a = data.a;
  const e = data.e0 + data.eT * T;
  const i = data.i;
  const L = normalizeDegrees(data.L0 + data.LT * T);
  const p = normalizeDegrees(data.p0 + data.pT * T);
  const o = normalizeDegrees(data.o0 + data.oT * T);

  const M = normalizeDegrees(L - p);
  const w = normalizeDegrees(p - o);

  // Solve Kepler equation E - e*sin(E) = M
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    E = E - (E - e * Math_sin(E) - M) / (1 - e * Math_cos(E));
  }

  // Position in orbital plane
  const xp = a * (Math_cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math_sin(E);

  // Rotate to ecliptic 3D
  const x = xp * (Math_cos(w) * Math_cos(o) - Math_sin(w) * Math_sin(o) * Math_cos(i)) -
            yp * (Math_sin(w) * Math_cos(o) + Math_cos(w) * Math_sin(o) * Math_cos(i));
  const y = xp * (Math_cos(w) * Math_sin(o) + Math_sin(w) * Math_cos(o) * Math_cos(i)) -
            yp * (Math_sin(w) * Math_sin(o) - Math_cos(w) * Math_cos(o) * Math_cos(i));
  const z = xp * (Math_sin(w) * Math_sin(i)) + yp * (Math_cos(w) * Math_sin(i));

  return { x, y, z };
}

export function computePlanetTropicalLongitude(planet: string, T: number): number {
  if (planet === 'sun') {
    // Geocentric Sun is opposite heliocentric Earth
    const earth = getHeliocentricXYZ('earth', T);
    const lon = Math_atan2(-earth.y, -earth.x);
    return normalizeDegrees(lon);
  }

  if (planet === 'moon') {
    // Simple Moon series expansion
    const L = normalizeDegrees(218.3164477 + 481267.8812233 * T);
    const M = normalizeDegrees(134.9633964 + 477198.8675055 * T);
    const D = normalizeDegrees(297.8501921 + 445267.1114034 * T);
    const F = normalizeDegrees(93.2720950 + 483202.0175381 * T);

    let lon = L + 6.289 * Math_sin(M)
                - 1.274 * Math_sin(M - 2 * D)
                + 0.658 * Math_sin(2 * D)
                + 0.214 * Math_sin(2 * M)
                - 0.186 * Math_sin(normalizeDegrees(100.46435 + 35999.37 * T)) // Solar terms
                - 0.114 * Math_sin(2 * F);
    return normalizeDegrees(lon);
  }

  if (planet === 'rahu') {
    // Mean node of Moon
    return normalizeDegrees(125.0445222 - 1934.1362608 * T);
  }

  if (planet === 'ketu') {
    return normalizeDegrees(125.0445222 - 1934.1362608 * T + 180.0);
  }

  // Major outer/inner planets
  const planetXYZ = getHeliocentricXYZ(planet, T);
  const earthXYZ = getHeliocentricXYZ('earth', T);

  const dx = planetXYZ.x - earthXYZ.x;
  const dy = planetXYZ.y - earthXYZ.y;

  return normalizeDegrees(Math_atan2(dy, dx));
}

/**
 * Calculates Placidus House Cusps (1 to 12)
 * Based on Local Mean Sidereal Time (LMST) and Obliquity of Ecliptic
 */
export function computePlacidusCusps(T: number, jd: number, timeUtc: number, longitude: number, latitude: number, ayanamsa: number): { cusps: Record<number, number>, ramc: number } {
  // Greenwich Mean Sidereal Time
  let gmst = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T;
  gmst = normalizeDegrees(gmst + 15.041068 * timeUtc); // adjust by UTC time

  const ramc = normalizeDegrees(gmst + longitude);
  const epsilon = 23.4392911 - (46.8150 * T + 0.00059 * T * T) / 3600.0; // obliquity of ecliptic

  const cusps: Record<number, number> = {};

  // For House 10 (MC)
  const tanMC = Math_tan(ramc) / Math_cos(epsilon);
  let mc = Math_atan2(Math_sin(ramc), Math_cos(ramc) * Math_cos(epsilon));
  mc = normalizeDegrees(mc);

  // Auxiliary poles for Placidus division
  // Latitude poles for houses 11, 12, 1, 2, 3
  const poles: Record<number, number> = {
    11: Math_asin(Math_sin(latitude) * Math_sin(30)),
    12: Math_asin(Math_sin(latitude) * Math_sin(60)),
    1: latitude,
    2: Math_asin(Math_sin(latitude) * Math_sin(60)),
    3: Math_asin(Math_sin(latitude) * Math_sin(30))
  };

  const ramcAdjustments: Record<number, number> = {
    11: ramc + 30,
    12: ramc + 60,
    1: ramc + 90,
    2: ramc + 120,
    3: ramc + 150
  };

  const rawHouses: Record<number, number> = {};
  rawHouses[10] = mc;

  // Compute other houses
  [11, 12, 1, 2, 3].forEach((h) => {
    const r = normalizeDegrees(ramcAdjustments[h]);
    const pol = poles[h];

    // standard house formula
    let hLong = Math_atan2(
      Math_sin(r),
      Math_cos(r) * Math_cos(epsilon) - Math_tan(pol) * Math_sin(epsilon)
    );
    hLong = normalizeDegrees(hLong);
    rawHouses[h] = hLong;
  });

  // Check wrapping/sorting of houses with Ascendant (House 1)
  // Opposites
  rawHouses[4] = normalizeDegrees(rawHouses[10] + 180);
  rawHouses[5] = normalizeDegrees(rawHouses[11] + 180);
  rawHouses[6] = normalizeDegrees(rawHouses[12] + 180);
  rawHouses[7] = normalizeDegrees(rawHouses[1] + 180);
  rawHouses[8] = normalizeDegrees(rawHouses[2] + 180);
  rawHouses[9] = normalizeDegrees(rawHouses[3] + 180);

  // Siderealize all house cusps
  for (let i = 1; i <= 12; i++) {
    cusps[i] = normalizeDegrees(rawHouses[i] - ayanamsa);
  }

  return { cusps, ramc };
}

/**
 * High-performing calculations wrapper
 */
export function calculateAstronomicalData(
  year: number,
  month: number,
  day: number,
  localHours: number,
  timezoneOffset: number, // positive for East, negative for West
  latitude: number,
  longitude: number
): AstronomicalState {
  const hoursUtc = localHours - timezoneOffset;
  const { jd, T } = getJulianCenturies(year, month, day, hoursUtc);
  const ayanamsa = getKrishnamurtiAyanamsa(T);

  const planetKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  const planets: Record<string, { longitude: number, speed: number, rawSpeed: number, retrograde: boolean }> = {};

  // For speed calculations: daily step
  const dayStep = 1.0 / 36525.0; // 1 day in Julian centuries

  planetKeys.forEach((p) => {
    const latTropical = computePlanetTropicalLongitude(p, T);
    const latTropicalTomorrow = computePlanetTropicalLongitude(p, T + dayStep);

    let speed = latTropicalTomorrow - latTropical;
    if (speed < -180) speed += 360;
    if (speed > 180) speed -= 360;

    const rawSpeed = speed; // degrees per day
    const siderealLon = normalizeDegrees(latTropical - ayanamsa);

    const isRetrograde = rawSpeed < 0 && p !== 'rahu' && p !== 'ketu';

    planets[p] = {
      longitude: siderealLon,
      speed: Math.abs(rawSpeed),
      rawSpeed: rawSpeed,
      retrograde: isRetrograde
    };
  });

  const { cusps, ramc } = computePlacidusCusps(T, jd, hoursUtc, longitude, latitude, ayanamsa);

  return {
    ayanamsa,
    planets,
    cusps,
    ramc
  };
}
