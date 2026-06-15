/**
 * Packaging and Formatting Module for KP Astrology Prompt Copying
 */

import { KPEngineResult, PlanetPosition, CuspPosition, EVENT_RULES } from './calculate';

export interface FormattedPromptOptions {
  name: string;
  dob: string;
  tob: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export function buildAstronPromptPayload(
  result: KPEngineResult,
  options: FormattedPromptOptions
): string {
  const { name, dob, tob, placeName, latitude, longitude, timezone } = options;

  let md = ``;
  md += `# KP ASTROLOGY ANALYSIS DATA PAYLOAD\n`;
  md += `Dear Oracle AI, perform a highly precise, classical Krishnamurti Paddhati (KP) counseling analysis for the native. Here is the fully computed astrological chart state coordinate matrix:\n\n`;

  md += `## SECTION 1: NATIVE BIRTH PROFILE\n`;
  md += `- **Name**: ${name || 'Querent/Native'}\n`;
  md += `- **Birth Date**: ${dob} (DD/MM/YYYY)\n`;
  md += `- **Birth Time**: ${tob} (Local Civil Time)\n`;
  md += `- **Place of Birth**: ${placeName}\n`;
  md += `- **Coordinates**: Latitude ${latitude.toFixed(4)}°, Longitude ${longitude.toFixed(4)}°\n`;
  md += `- **Timezone Offset**: UTC ${timezone >= 0 ? '+' : ''}${timezone} hours\n`;
  md += `- **Krishnamurti Ayanamsa**: ${result.ayanamsa.toFixed(4)}° (${Math.floor(result.ayanamsa)}° ${Math.floor((result.ayanamsa % 1) * 60)}' ${Math.floor(((result.ayanamsa % 1) * 60 % 1) * 60)}")\n\n`;

  md += `## SECTION 2: CUSPAL COORDINATE MATRIX (12 HOUSES)\n`;
  md += `| Cusp | Total Longitude | Sign Ruler (Sub-Lord) | Star Lord | Sub Lord | Sign Ruler | Degree in Sign | Meaning & Areas Ruled |\n`;
  md += `|------|-----------------|---------------------|-----------|----------|------------|----------------|-----------------------|\n`;
  result.cusps.forEach((c) => {
    const deg = c.degreeInSign;
    const formattedDeg = `${Math.floor(deg)}° ${Math.floor((deg % 1) * 60)}' ${Math.floor(((deg % 1) * 60 % 1) * 60)}"`;
    md += `| ${c.house} | ${c.longitude.toFixed(4)}° | ${c.signName} | ${c.starLord} | **${c.subLord}** | ${c.signLord} | ${formattedDeg} | ${c.title} |\n`;
  });
  md += `\n`;

  md += `## SECTION 3: PLANETARY DEGREES & RESIDENCES\n`;
  md += `| Planet | Sidereal Longitude | Sign Name | Occupied House | Owned Houses | Star Lord | Sub Lord | Retrograde? | Speed (Deg/Day) |\n`;
  md += `|--------|---------------------|-----------|----------------|--------------|-----------|----------|-------------|------------------|\n`;
  result.planets.forEach((p) => {
    md += `| ${p.name} | ${p.longitude.toFixed(4)}° | ${p.signName} | **House ${p.houseOccupied}** | Houses: [${p.housesOwned.join(', ')}] | ${p.starLord} | **${p.subLord}** | ${p.retrograde ? 'YES' : 'No'} | ${p.rawSpeed.toFixed(4)} |\n`;
  });
  md += `\n`;

  md += `## SECTION 4: KP 4-LEVEL GRADED HOUSE SIGNIFICATIONS\n`;
  md += `The Level 1-4 significations determine exactly what houses each planet is empowered to control and execute:\n`;
  result.planets.forEach((p) => {
    const sig = result.significators[p.id];
    md += `- **${p.name}** signifies:\n`;
    md += `  - *Grade A (Level 1 - Strongest - Houses of Star Lord)*: [${sig.level1.join(', ')}]\n`;
    md += `  - *Grade B (Level 2 - Very Strong - House of Planet)*: [${sig.level2.join(', ')}]\n`;
    md += `  - *Grade C (Level 3 - Medium - Houses Owned by Star Lord)*: [${sig.level3.join(', ')}]\n`;
    md += `  - *Grade D (Level 4 - Weakest - Houses Owned by Planet)*: [${sig.level4.join(', ')}]\n`;
    md += `  - *Overall Unified Significations (Level 1+2+3+4)*: Houses **[${sig.allList.join(', ')}]**\n`;
    md += `  - *Dynamic Astrological Strength Index*: **${result.planetStrengths[p.id]} / 100**\n`;
  });
  md += `\n`;

  md += `## SECTION 5: AUTOMATED LIFE EVENT CHARACTER PROMISES\n`;
  md += `The system checked the respective Cuspal Sub Lord (CSL) significations for core life query categories:\n`;
  EVENT_RULES.forEach((rule) => {
    const cuspInfo = result.cusps[rule.primaryCusp - 1]; // 0-indexed
    const cslName = cuspInfo.subLord;
    const cslSigs = result.significators[cslName]?.allList || [];

    const matchesPrimary = cslSigs.includes(rule.primaryCusp);
    const positiveMatches = cslSigs.filter(h => rule.positiveHouses.includes(h));
    const negativeMatches = cslSigs.filter(h => rule.dangerHouses.includes(h));

    const isRuleCslRetro = result.planets.find(p => p.id === cslName)?.retrograde || false;

    let verdict = 'NEUTRAL / UNPROMISED';
    if (positiveMatches.length > negativeMatches.length && (matchesPrimary || positiveMatches.includes(rule.primaryCusp))) {
      verdict = isRuleCslRetro ? 'EVENT PROMISED BUT WITH RETROGRADE DELAYS / OBSTACLES' : 'EVENT HIGHLY PROMISED / FAVORABLE';
    } else if (negativeMatches.length > positiveMatches.length) {
      verdict = 'EVENT BLOCKED / HIGH NEGATION RISK';
    } else if (positiveMatches.length > 0) {
      verdict = 'MODERATE PROMISE / DELAYED FRUITION';
    }

    md += `### Event: ${rule.name}\n`;
    md += `- **Primary Cusp Evaluated**: Cusp ${rule.primaryCusp} (Cusp Sub Lord ruling: **${cslName.toUpperCase()}**)\n`;
    md += `- **CSL Signified Houses**: Houses [${cslSigs.join(', ')}]\n`;
    md += `- **Positive Supportive Houses Involved**: [${positiveMatches.join(', ')}] (Target rules: ${rule.positiveHouses.join(', ')})\n`;
    md += `- **Negation / Obstruction Houses Involved**: [${negativeMatches.join(', ')}] (Target rules: ${rule.dangerHouses.join(', ')})\n`;
    md += `- **Retrograde Conflict Guard**: CSL ${cslName} is ${isRuleCslRetro ? 'RETROGRADE (Delays and reversals will apply)' : 'non-retrograde (direct speed)'}\n`;
    md += `- **Computed Promise Verdict**: **${verdict}**\n\n`;
  });

  md += `## SECTION 6: INSTRUCTIONS FOR COUNSELING PREDICTION\n`;
  md += `Review the above astrological parameters and provide a comprehensive prediction. Analyze the native's character, explain the exact status of the event promises, warn about negative significations (e.g. 6th house for litigation/sickness, 12th for loss), and suggest remedy measures. Keep the output beautifully written, psychological, deep, and deeply traditional.`;

  return md;
}
