/**
 * KP Astrology Core Calculation Engine
 */

import { PLANETS, VIMSHOTTARI_ORDER, NAKSHATRAS, SIGNS, HOUSE_TITLES } from './constants';
import { calculateAstronomicalData, AstronomicalState } from './astronomy';

export interface PlanetPosition {
  id: string;
  name: string;
  symbol: string;
  longitude: number;
  retrograde: boolean;
  rawSpeed: number;
  signIndex: number;
  signName: string;
  signLord: string;
  degreeInSign: number;
  nakshatraIndex: number;
  nakshatraName: string;
  starLord: string;
  subLord: string;
  houseOccupied: number;
  housesOwned: number[];
}

export interface CuspPosition {
  house: number;
  longitude: number;
  signIndex: number;
  signName: string;
  signLord: string;
  degreeInSign: number;
  nakshatraIndex: number;
  nakshatraName: string;
  starLord: string;
  subLord: string;
  title: string;
}

export interface DashaSpan {
  lord: string;
  lordName: string;
  startDate: Date;
  endDate: Date;
}

export interface DashaHierarchy {
  mahadasha: string;
  mahadashaName: string;
  startDate: Date;
  endDate: Date;
  bhuktis: DashaSpan[];
}

export interface EventRule {
  id: string;
  name: string;
  primaryCusp: number;
  positiveHouses: number[];
  dangerHouses: number[];
  description: string;
}

export const EVENT_RULES: EventRule[] = [
  {
    id: 'marriage',
    name: 'Marriage',
    primaryCusp: 7,
    positiveHouses: [2, 7, 11],
    dangerHouses: [1, 6, 10],
    description: 'Scanning 7th Cuspal Sublord for connections to 2nd (family), 7th (spouse), 11th (gains/desires) vs bad houses 1st (self), 6th (disease/debts), 10th (reputation negation).'
  },
  {
    id: 'career',
    name: 'Career & Job Change',
    primaryCusp: 10,
    positiveHouses: [2, 6, 10, 11],
    dangerHouses: [1, 5, 9],
    description: 'Scanning 10th Cuspal Sublord for connections to 10th (career), 2nd (wealth), 6th (service), 11th (gains) vs negating houses 1st, 5th, 9th.'
  },
  {
    id: 'foreign_travel',
    name: 'Foreign Travel & Residence',
    primaryCusp: 12,
    positiveHouses: [3, 9, 12],
    dangerHouses: [4], // 4 represents home, strong 4 connection negates foreign settlement
    description: 'Scanning 12th Cuspal Sublord for connections to 3rd (short travel), 9th (far journeys), 12th (foreign lands) vs 4th (negation of foreign settlement).'
  },
  {
    id: 'child_birth',
    name: 'Child Birth',
    primaryCusp: 5,
    positiveHouses: [2, 5, 11],
    dangerHouses: [1, 4, 10],
    description: 'Scanning 5th Cuspal Sublord for connections to 5th (children), 2nd (family addition), 11th (desire fulfillment) vs bad houses 1, 4, 10.'
  },
  {
    id: 'property',
    name: 'Property Purchase',
    primaryCusp: 4,
    positiveHouses: [4, 11, 12],
    dangerHouses: [3, 8],
    description: 'Scanning 4th Cuspal Sublord for connections to 4th (property), 11th (gains), 12th (investment/expenditures).'
  },
  {
    id: 'litigation',
    name: 'Disease & Litigation',
    primaryCusp: 6,
    positiveHouses: [1, 6, 8, 12],
    dangerHouses: [5, 11],
    description: 'Scanning 6th Cuspal Sublord for active diseases (6th), pain/secret issues (8th), hospitalization (12th), litigation vs protective houses 5th & 11th.'
  }
];

export interface SignificatorsMap {
  [planetId: string]: {
    level1: number[]; // occupied by star lord
    level2: number[]; // occupied by planet
    level3: number[]; // owned by star lord
    level4: number[]; // owned by planet
    allList: number[];
  };
}

export interface KPEngineResult {
  ayanamsa: number;
  planets: PlanetPosition[];
  cusps: CuspPosition[];
  significators: SignificatorsMap;
  planetStrengths: Record<string, number>;
  cuspalSublordSignifications: Record<number, number[]>; // house -> list of signified houses
  dashas: DashaHierarchy[];
}

export function formatDegree(decimalDegrees: number): string {
  const d = Math.floor(decimalDegrees);
  const m = Math.floor((decimalDegrees - d) * 60);
  const s = Math.floor(((decimalDegrees - d) * 60 - m) * 60);
  return `${d}°${m}'${s}"`;
}

export function getZodiacSignDetails(lon: number) {
  const signIndex = Math.floor(lon / 30);
  const sign = SIGNS[signIndex];
  const degreeInSign = lon % 30;
  return {
    signIndex,
    signName: sign.name,
    signLord: sign.lord,
    degreeInSign
  };
}

export function getNakshatraDetails(lon: number) {
  const nakDegree = 13.33333333; // 13 degrees 20 minutes
  const nakshatraIndex = Math.floor(lon / nakDegree) % 27;
  const remDegrees = lon % nakDegree;
  const nak = NAKSHATRAS[nakshatraIndex];

  // Sub lord division logic
  // division starts at the nakshatra lord. Let's find its dasha order index
  const startLord = nak.lord;
  const startIndex = VIMSHOTTARI_ORDER.indexOf(startLord);

  let subLord = startLord;
  let currentAccumulator = 0;
  for (let i = 0; i < 9; i++) {
    const currentLord = VIMSHOTTARI_ORDER[(startIndex + i) % 9];
    const planetDef = PLANETS.find(p => p.id === currentLord)!;
    const span = (planetDef.dashaYears / 120) * nakDegree;
    if (remDegrees >= currentAccumulator && remDegrees < currentAccumulator + span) {
      subLord = currentLord;
      break;
    }
    currentAccumulator += span;
  }

  return {
    nakshatraIndex,
    nakshatraName: nak.name,
    starLord: nak.lord,
    subLord
  };
}

export function getHouseOccupied(lon: number, cusps: Record<number, number>): number {
  for (let h = 1; h <= 12; h++) {
    const start = cusps[h];
    const end = cusps[h === 12 ? 1 : h + 1];
    if (start < end) {
      if (lon >= start && lon < end) return h;
    } else {
      if (lon >= start || lon < end) return h;
    }
  }
  return 1;
}

export function computeKPEngine(
  year: number,
  month: number,
  day: number,
  localHours: number,
  timezoneOffset: number,
  latitude: number,
  longitude: number
): KPEngineResult {
  const astro = calculateAstronomicalData(year, month, day, localHours, timezoneOffset, latitude, longitude);
  const ayanamsa = astro.ayanamsa;

  // Setup houses owned by each planet
  const ownedHouses: Record<string, number[]> = {};
  PLANETS.forEach(p => ownedHouses[p.id] = []);
  for (let h = 1; h <= 12; h++) {
    const cuspLon = astro.cusps[h];
    const details = getZodiacSignDetails(cuspLon);
    ownedHouses[details.signLord].push(h);
  }

  // Planet Mapping
  const planetPositions: PlanetPosition[] = PLANETS.map((p) => {
    const rawData = astro.planets[p.id];
    const lon = rawData.longitude;
    const sign = getZodiacSignDetails(lon);
    const nak = getNakshatraDetails(lon);
    const house = getHouseOccupied(lon, astro.cusps);

    return {
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      longitude: lon,
      retrograde: rawData.retrograde,
      rawSpeed: rawData.rawSpeed,
      signIndex: sign.signIndex,
      signName: sign.signName,
      signLord: sign.signLord,
      degreeInSign: sign.degreeInSign,
      nakshatraIndex: nak.nakshatraIndex,
      nakshatraName: nak.nakshatraName,
      starLord: nak.starLord,
      subLord: nak.subLord,
      houseOccupied: house,
      housesOwned: ownedHouses[p.id]
    };
  });

  // Cusp Mapping
  const cuspPositions: CuspPosition[] = [];
  for (let h = 1; h <= 12; h++) {
    const lon = astro.cusps[h];
    const sign = getZodiacSignDetails(lon);
    const nak = getNakshatraDetails(lon);

    cuspPositions.push({
      house: h,
      longitude: lon,
      signIndex: sign.signIndex,
      signName: sign.signName,
      signLord: sign.signLord,
      degreeInSign: sign.degreeInSign,
      nakshatraIndex: nak.nakshatraIndex,
      nakshatraName: nak.nakshatraName,
      starLord: nak.starLord,
      subLord: nak.subLord,
      title: HOUSE_TITLES[h]
    });
  }

  // Double significators map
  const significators: SignificatorsMap = {};
  PLANETS.forEach((p) => {
    const planetData = planetPositions.find(pRef => pRef.id === p.id)!;
    const starLordPlanet = planetPositions.find(pRef => pRef.id === planetData.starLord)!;

    const level2 = [planetData.houseOccupied];
    const level4 = planetData.housesOwned;

    // level 1: houses occupied by star lord
    const level1 = [starLordPlanet.houseOccupied];
    // level 3: houses owned by star lord
    const level3 = starLordPlanet.housesOwned;

    const allList = Array.from(new Set([...level1, ...level2, ...level3, ...level4])).sort((a, b) => a - b);

    significators[p.id] = {
      level1,
      level2,
      level3,
      level4,
      allList
    };
  });

  // Cuspal Sublord Significations mapping
  const cuspalSublordSignifications: Record<number, number[]> = {};
  for (let h = 1; h <= 12; h++) {
    const cCSL = cuspPositions[h - 1].subLord; // index is h-1
    const pSig = significators[cCSL];
    cuspalSublordSignifications[h] = pSig ? pSig.allList : [];
  }

  // Planet Strength & Ranking Engine (0 - 100)
  // Auspicious house indicators: 1, 2, 3, 4, 5, 9, 10, 11 (especially 2, 11, 10)
  // Reductions for bad houses: 6, 8, 12, or retrogrades.
  const planetStrengths: Record<string, number> = {};
  PLANETS.forEach((p) => {
    const sigs = significators[p.id];
    let score = 50; // base score

    const planetMeta = planetPositions.find(pRef => pRef.id === p.id)!;

    // Add points for positive houses, with weights
    sigs.level1.forEach(h => {
      if ([2, 10, 11].includes(h)) score += 8;
      else if ([1, 3, 4, 5, 9].includes(h)) score += 4;
      else if ([6, 8, 12].includes(h)) score -= 6;
    });

    sigs.level2.forEach(h => {
      if ([2, 10, 11].includes(h)) score += 10;
      else if ([1, 3, 4, 5, 9].includes(h)) score += 5;
      else if ([6, 8, 12].includes(h)) score -= 8;
    });

    sigs.level3.forEach(h => {
      if ([2, 10, 11].includes(h)) score += 4;
      else if ([1, 3, 4, 5, 9].includes(h)) score += 2;
      else if ([6, 8, 12].includes(h)) score -= 3;
    });

    sigs.level4.forEach(h => {
      if ([2, 10, 11].includes(h)) score += 5;
      else if ([1, 3, 4, 5, 9].includes(h)) score += 2;
      else if ([6, 8, 12].includes(h)) score -= 4;
    });

    if (planetMeta.retrograde) {
      score -= 15; // retro diminishes execution speed/confidence
    }

    // Cap strength between 15 and 98
    planetStrengths[p.id] = Math.max(15, Math.min(98, score));
  });

  // Dasha Computations
  // initial balance of dasha
  const sMoon = planetPositions.find(p => p.id === 'moon')!;
  const nakDegree = 13.33333333;
  const remDegrees = sMoon.longitude % nakDegree;
  const moonNakLordId = sMoon.starLord;

  const currentDashaIndex = VIMSHOTTARI_ORDER.indexOf(moonNakLordId);
  const basePlanetRef = PLANETS.find(p => p.id === moonNakLordId)!;

  const remainingRatio = (nakDegree - remDegrees) / nakDegree;
  const initYearsRemaining = remainingRatio * basePlanetRef.dashaYears;

  const birthDate = new Date(year, month - 1, day, Math.floor(localHours), Math.floor((localHours % 1) * 60));

  // Loop through dashas from birth
  const dashas: DashaHierarchy[] = [];
  let dashaCursorDate = new Date(birthDate);

  // Initial dasha is smaller due to degrees consumed
  const initEnd = new Date(dashaCursorDate);
  initEnd.setFullYear(initEnd.getFullYear() + Math.floor(initYearsRemaining));
  initEnd.setMonth(initEnd.getMonth() + Math.floor((initYearsRemaining % 1) * 12));

  // Build the Mahadasha timeline (chain 9 planets, cycle around VIMSHOTTARI_ORDER)
  let dashaOrderCursor = currentDashaIndex;
  for (let cycle = 0; cycle < 9; cycle++) {
    const lord = VIMSHOTTARI_ORDER[dashaOrderCursor % 9];
    const pDef = PLANETS.find(p => p.id === lord)!;

    const start = new Date(dashaCursorDate);
    const end = new Date(dashaCursorDate);
    
    if (cycle === 0) {
      // remaining balance of first dasha
      end.setTime(initEnd.getTime());
    } else {
      end.setFullYear(end.getFullYear() + pDef.dashaYears);
    }

    // Bhukti subdivision calculations (9 divisions proportional to years)
    const bhuktis: DashaSpan[] = [];
    let bhuktiCursor = new Date(start);
    const dashaDurationMs = end.getTime() - start.getTime();

    for (let b = 0; b < 9; b++) {
      const bLord = VIMSHOTTARI_ORDER[(dashaOrderCursor + b) % 9];
      const bDef = PLANETS.find(p => p.id === bLord)!;
      const bSpanRatio = bDef.dashaYears / 120;
      const bDurationMs = dashaDurationMs * bSpanRatio;

      const bStart = new Date(bhuktiCursor);
      const bEnd = new Date(bhuktiCursor.getTime() + bDurationMs);

      bhuktis.push({
        lord: bLord,
        lordName: bDef.name,
        startDate: bStart,
        endDate: bEnd
      });

      bhuktiCursor = bEnd;
    }

    dashas.push({
      mahadasha: lord,
      mahadashaName: pDef.name,
      startDate: start,
      endDate: end,
      bhuktis
    });

    dashaCursorDate = end;
    dashaOrderCursor++;
  }

  return {
    ayanamsa,
    planets: planetPositions,
    cusps: cuspPositions,
    significators,
    planetStrengths,
    cuspalSublordSignifications,
    dashas
  };
}
