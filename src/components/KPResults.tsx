import React, { useState } from 'react';
import { 
  Sparkles, CalendarRange, Award, Info, 
  ChevronRight, Clipboard, Check, Activity, AlertTriangle, AlertCircle, Compass 
} from 'lucide-react';
import { KPEngineResult, EVENT_RULES, formatDegree, getZodiacSignDetails, getNakshatraDetails } from '../lib/kp/calculate';
import { buildAstronPromptPayload } from '../lib/kp/format';
import { getJulianCenturies, computePlanetTropicalLongitude, getKrishnamurtiAyanamsa } from '../lib/kp/astronomy';

interface KPResultsProps {
  result: KPEngineResult;
  nativeName: string;
  dob: string;
  tob: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export default function KPResults({
  result,
  nativeName,
  dob,
  tob,
  placeName,
  latitude,
  longitude,
  timezone
}: KPResultsProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'significators' | 'promise' | 'transit' | 'copier'>('chart');
  
  // States for Event Analyzer
  const [selectedEventId, setSelectedEventId] = useState<string>('marriage');
  
  // States for Transit Scanner
  const [transitDate, setTransitDate] = useState<string>('2026-10-15');
  const [copied, setCopied] = useState<boolean>(false);

  // Parse transit date
  const transitDateObj = new Date(transitDate);
  const tYear = transitDateObj.getFullYear();
  const tMonth = transitDateObj.getMonth() + 1;
  const tDay = transitDateObj.getDate();
  // Assume midnight transit for simplicity
  const { T: tCenturies } = getJulianCenturies(tYear, tMonth, tDay, 12);
  const tAyanamsa = getKrishnamurtiAyanamsa(tCenturies);

  // Compute Transiting Positions of Sun, Moon, Jupiter
  const getTransitingPlanet = (pId: string) => {
    const rawLon = computePlanetTropicalLongitude(pId === 'jupiter' ? 'jupiter' : pId, tCenturies);
    const sidLon = (rawLon - tAyanamsa + 360) % 360;
    const sign = getZodiacSignDetails(sidLon);
    const nak = getNakshatraDetails(sidLon);
    return {
      name: pId === 'jupiter' ? 'Jupiter' : pId === 'sun' ? 'Sun' : 'Moon',
      longitude: sidLon,
      signName: sign.signName,
      signLord: sign.signLord,
      degreeInSign: sign.degreeInSign,
      starLord: nak.starLord,
      subLord: nak.subLord
    };
  };

  const transits = {
    sun: getTransitingPlanet('sun'),
    moon: getTransitingPlanet('moon'),
    jupiter: getTransitingPlanet('jupiter')
  };

  // Find Operating Dasha for the specified transit date
  const getOperatingDashaAt = (date: Date) => {
    // Find matching MD
    const md = result.dashas.find(d => date >= d.startDate && date < d.endDate);
    if (!md) return { md: 'N/A', ad: 'N/A', pd: 'N/A' };
    
    // Find matching AD (Bhukti)
    const ad = md.bhuktis.find(b => date >= b.startDate && date < b.endDate);
    const adLord = ad ? ad.lordName : 'N/A';
    
    // Antar dasha approximation (9 proportional divisions of Bhukti)
    let pdLord = 'N/A';
    if (ad) {
      const bhuktiDuration = ad.endDate.getTime() - ad.startDate.getTime();
      const bhuktiOrderIndex = VIMSHOTTARI_ORDER.indexOf(ad.lord);
      let pdAccumulator = ad.startDate.getTime();
      for (let i = 0; i < 9; i++) {
        const pdLordKey = VIMSHOTTARI_ORDER[(bhuktiOrderIndex + i) % 9];
        const pdDef = { id: pdLordKey, name: pdLordKey.toUpperCase() }; // fallback
        const dYears = pdLordKey === 'venus' ? 20 : pdLordKey === 'sun' ? 6 : pdLordKey === 'moon' ? 10 : pdLordKey === 'mars' ? 7 : pdLordKey === 'rahu' ? 18 : pdLordKey === 'jupiter' ? 16 : pdLordKey === 'saturn' ? 19 : pdLordKey === 'mercury' ? 17 : 7;
        const pdSpan = bhuktiDuration * (dYears / 120);
        if (date.getTime() >= pdAccumulator && date.getTime() < pdAccumulator + pdSpan) {
          pdLord = pdLordKey.toUpperCase();
          break;
        }
        pdAccumulator += pdSpan;
      }
    }

    return {
      md: md.mahadashaName,
      ad: adLord,
      pd: pdLord
    };
  };

  const VIMSHOTTARI_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
  const activeDasha = getOperatingDashaAt(transitDateObj);

  // Compute RP Match Percentage
  // Let's create a robust comparison between native's RPs and Transit RPs
  const nativeRPs = [
    result.cusps[0].signLord, // Lagna Sign Lord
    result.cusps[0].starLord, // Lagna Star Lord
    result.planets.find(p => p.id === 'moon')?.signLord || '', // Moon Sign Lord
    result.planets.find(p => p.id === 'moon')?.starLord || '', // Moon Star Lord
    result.planets.find(p => p.id === 'sun')?.signLord || '' // Day Lord approx
  ].map(p => p.toLowerCase()).filter(Boolean);

  const transitRPs = [
    transits.sun.signLord.toLowerCase(),
    transits.sun.starLord.toLowerCase(),
    transits.moon.signLord.toLowerCase(),
    transits.moon.starLord.toLowerCase(),
    transits.jupiter.signLord.toLowerCase()
  ];

  const matchedRPs = nativeRPs.filter(rp => transitRPs.includes(rp));
  const rpMatchPercentage = Math.round((matchedRPs.length / Math.max(1, nativeRPs.length)) * 100);

  // Copy Prompt Function
  const handleCopyPrompt = () => {
    const payload = buildAstronPromptPayload(result, {
      name: nativeName,
      dob,
      tob,
      placeName,
      latitude,
      longitude,
      timezone
    });
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Visual Identity Brief Header */}
      <div className="bg-gradient-to-r from-card to-surface border border-border/80 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-gold font-mono block">Ecliptic Solution Loaded</span>
          <h1 className="text-3xl font-display font-medium text-foreground">{nativeName || 'Querent'}'s KP Horary State</h1>
          <p className="text-sm text-muted-foreground">{placeName} | {dob} at {tob} (UTC {timezone >= 0 ? '+' : ''}{timezone})</p>
        </div>
        <button
          onClick={handleCopyPrompt}
          className="bg-primary hover:bg-gold-soft text-primary-foreground font-mono text-xs font-medium py-2.5 px-4 rounded-md shadow-md flex items-center gap-2 cursor-pointer transition-all self-stretch sm:self-auto justify-center"
        >
          {copied ? <Check className="w-4 h-4 text-green-700" /> : <Clipboard className="w-4 h-4 text-primary-foreground" />}
          {copied ? 'Astrological Data Copied!' : 'Copy AI Prompts Data'}
        </button>
      </div>

      {/* Modern Horizontal Glass Tabs */}
      <div className="flex border-b border-border/40 overflow-x-auto gap-2 no-scrollbar pb-px">
        {[
          { id: 'chart', name: 'Zodiac & House Cusps', icon: Compass },
          { id: 'significators', name: 'Significators & Strength', icon: Award },
          { id: 'promise', name: 'Event Promise Engine', icon: Sparkles },
          { id: 'transit', name: 'Transit Scanner (Gochara)', icon: CalendarRange },
          { id: 'copier', name: 'AI Integration Center', icon: Activity }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-gold text-gold bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${activeTab === tab.id ? 'text-gold' : 'text-muted-foreground'}`} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'chart' && (
        <div className="space-y-6 animate-fade-in">
          {/* Cusp Table Grid */}
          <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-muted/40 px-6 py-4 border-b border-border/60 flex justify-between items-center">
              <h3 className="text-lg font-display text-gold">Computed Placidus Cusps (House Divisions)</h3>
              <span className="text-xs font-mono text-muted-foreground">Coordinates relative to KM Ayanamsa</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background/80 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                    <th className="py-3 px-4 font-semibold">Cusp</th>
                    <th className="py-3 px-4 font-semibold">Zodiac Sign</th>
                    <th className="py-3 px-4 font-semibold text-right">Degree In Sign</th>
                    <th className="py-3 px-4 font-semibold">Cusp Lord (RL)</th>
                    <th className="py-3 px-4 font-semibold">Star Lord (NL)</th>
                    <th className="py-3 px-4 font-semibold">Sub Lord (SL)</th>
                    <th className="py-3 px-4 font-semibold">Core Significance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cusps.map((c) => (
                    <tr key={c.house} className="border-b border-border/20 hover:bg-primary/5 transition-all">
                      <td className="py-3.5 px-4 font-mono font-medium text-gold">House {c.house}</td>
                      <td className="py-3.5 px-4 font-display font-medium text-foreground">{c.signName}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-gold-soft">{formatDegree(c.degreeInSign)}</td>
                      <td className="py-3.5 px-4 capitalize text-foreground">{c.signLord}</td>
                      <td className="py-3.5 px-4 capitalize text-foreground">{c.starLord}</td>
                      <td className="py-3.5 px-4 capitalize font-semibold text-gold">{c.subLord}</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{c.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planet Positions Table */}
          <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-muted/40 px-6 py-4 border-b border-border/60">
              <h3 className="text-lg font-display text-gold">Planetary Degrees & Coordinate Residences</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background/80 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                    <th className="py-3 px-4 font-semibold">Planet</th>
                    <th className="py-3 px-4 font-semibold">Longitude</th>
                    <th className="py-3 px-4 font-semibold">Sign Residence</th>
                    <th className="py-3 px-4 font-semibold">Star Lord (NL)</th>
                    <th className="py-3 px-4 font-semibold">Sub Lord (SL)</th>
                    <th className="py-3 px-4 font-semibold text-center">Retrograde?</th>
                    <th className="py-3 px-4 text-right font-semibold">Daily Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {result.planets.map((p) => (
                    <tr key={p.id} className="border-b border-border/20 hover:bg-primary/5 transition-all">
                      <td className="py-3.5 px-4 font-medium flex items-center gap-2 text-foreground">
                        <span className="text-gold font-mono text-md">{p.symbol}</span>
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gold-soft">{formatDegree(p.longitude)}</td>
                      <td className="py-3.5 px-4 font-display text-foreground">{p.signName} ({Math.floor(p.degreeInSign)}°)</td>
                      <td className="py-3.5 px-4 capitalize text-foreground">{p.starLord}</td>
                      <td className="py-3.5 px-4 capitalize font-semibold text-gold">{p.subLord}</td>
                      <td className="py-3.5 px-4 text-center">
                        {p.retrograde ? (
                          <span className="text-xs bg-destructive/10 text-destructive border border-destructive/30 px-2 py-0.5 rounded font-mono font-bold">
                            RETRO (R)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">Direct</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-muted-foreground">
                        {p.rawSpeed.toFixed(4)}°/day
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* House Occupation and Ownership Side-by-side Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* House Occupation Table */}
            <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-muted/40 px-6 py-4 border-b border-border/60">
                <h4 className="text-base font-display text-gold">House Occupation Table</h4>
                <p className="text-xs text-muted-foreground">Planets mapped to the houses they reside in based on unequal cusp divides.</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {result.planets.map((p) => (
                    <div key={p.id} className="bg-background/40 hover:bg-background/80 border border-border/40 p-3 rounded-md flex justify-between items-center transition-all">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <span className="text-gold font-mono">{p.symbol}</span> {p.name}
                      </span>
                      <span className="num font-semibold text-gold-soft bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-xs">
                        House {p.houseOccupied}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* House Ownership Table */}
            <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-muted/40 px-6 py-4 border-b border-border/60">
                <h4 className="text-base font-display text-gold">House Ownership Table</h4>
                <p className="text-xs text-muted-foreground">Houses ruled by each planet based on zodiac sign rulership of house starting cusps.</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {result.planets.filter(p => !['rahu', 'ketu'].includes(p.id)).map((p) => (
                    <div key={p.id} className="bg-background/40 hover:bg-background/80 border border-border/40 p-3 rounded-md flex justify-between items-center transition-all">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <span className="text-gold font-mono">{p.symbol}</span> {p.name} Rules
                      </span>
                      <div className="flex gap-1.5">
                        {p.housesOwned.length > 0 ? (
                          p.housesOwned.map(h => (
                            <span key={h} className="num font-semibold text-gold-soft bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-xs">
                              Cusp {h}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Cusps Ruled</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Nodes disclaimer */}
                  <div className="text-[11px] text-muted-foreground/80 bg-background/20 p-2 rounded border border-border/20 italic">
                    Note: Rahu & Ketu do not physically rule zodiac signs, they command significance through co-residence and star lordship.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Significators & Strength Engine */}
      {activeTab === 'significators' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graded Significators */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-muted/40 px-6 py-4 border-b border-border/60 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-display text-gold">Planet Significators (Levels 1 - 4)</h3>
                    <p className="text-xs text-muted-foreground">The ultimate KP strength rules defining planetary control over houses.</p>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {result.planets.map((p) => {
                    const sig = result.significators[p.id];
                    return (
                      <div key={p.id} className="border border-border/40 rounded-lg p-4 bg-background/20 hover:border-primary/40 transition-all space-y-3">
                        <div className="flex justify-between items-center border-b border-border/20 pb-2">
                          <span className="font-semibold text-foreground flex items-center gap-2 text-md">
                            <span className="text-gold font-mono">{p.symbol}</span> {p.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Sublord of houses: {result.cusps.filter(c => c.subLord === p.id).map(c => c.house).join(', ') || 'None'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="bg-card/50 p-2 rounded border border-border/20">
                            <span className="text-gold block mb-1">Level 1 (Occupied by Star Lord {p.starLord}):</span>
                            <span className="font-semibold text-foreground">{sig.level1.join(', ') || 'N/A'}</span>
                          </div>
                          <div className="bg-card/50 p-2 rounded border border-border/20">
                            <span className="text-gold block mb-1">Level 2 (House Planet Occupies):</span>
                            <span className="font-semibold text-foreground">{sig.level2.join(', ') || 'N/A'}</span>
                          </div>
                          <div className="bg-card/50 p-2 rounded border border-border/20">
                            <span className="text-gold block mb-1">Level 3 (Owned by Star Lord {p.starLord}):</span>
                            <span className="font-semibold text-foreground">{sig.level3.join(', ') || 'N/A'}</span>
                          </div>
                          <div className="bg-card/50 p-2 rounded border border-border/20">
                            <span className="text-gold block mb-1">Level 4 (Houses Owned by Planet):</span>
                            <span className="font-semibold text-foreground">{sig.level4.join(', ') || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono pt-1 text-muted-foreground">
                          <span>All Signified Houses: <strong className="text-primary font-bold">[{sig.allList.join(', ')}]</strong></span>
                          <span>Strength Index: <strong className="text-primary">{result.planetStrengths[p.id]}%</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Planet Strengths Index Panel */}
            <div className="space-y-6">
              {/* Strength Rating engine widget */}
              <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xl space-y-4">
                <div className="border-b border-border/40 pb-2">
                  <h3 className="text-md font-display text-gold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-gold" />
                    Computed Planet Strength Index
                  </h3>
                  <p className="text-xs text-muted-foreground">Based on positive house connections. Retrograde reduces overall velocity index (-15%).</p>
                </div>
                <div className="space-y-3.5">
                  {result.planets.map((p) => {
                    const score = result.planetStrengths[p.id];
                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            <span className="text-gold font-mono">{p.symbol}</span>
                            {p.name} {p.retrograde && <span className="text-[10px] text-destructive font-bold font-mono">(R)</span>}
                          </span>
                          <span className="font-mono text-gold-soft font-semibold">{score}%</span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border/30">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              score > 75 ? 'bg-green-500' : score > 50 ? 'bg-primary' : 'bg-gold-soft'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cuspal Sublord Signification Table (Ready Format) */}
              <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xl space-y-4">
                <div className="border-b border-border/40 pb-2">
                  <h3 className="text-md font-display text-gold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-gold" />
                    Cuspal Sublord Signification Table
                  </h3>
                  <p className="text-xs text-muted-foreground">Fast Lookup for each index's Cuspal Sub Lord (CSL) and its signified houses.</p>
                </div>
                <div className="overflow-y-auto max-h-[300px] space-y-1.5 pr-2 font-mono scrollbar-custom text-xs">
                  {result.cusps.map((c) => {
                    const cSigs = result.cuspalSublordSignifications[c.house];
                    return (
                      <div key={c.house} className="flex justify-between items-center p-2 bg-background border border-border/20 rounded hover:border-primary/40 transition-all">
                        <span className="text-gold font-medium">Cusp {c.house} SL ({c.subLord.toUpperCase()})</span>
                        <span className="font-semibold text-foreground bg-primary/5 px-2 py-0.5 border border-primary/20 rounded">
                          [{cSigs.join(', ')}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Event Analyzer & Promise Engine */}
      {activeTab === 'promise' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="border-b border-border/40 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-display text-gold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  Life Event Promise & Judgment Engine
                </h3>
                <p className="text-xs text-muted-foreground">The algorithm evaluates the Primary Cusp Sub Lord (CSL) alignment to supportive house clusters vs negating clusters.</p>
              </div>
              
              {/* Dropdown selector */}
              <div className="flex flex-col space-y-1 min-w-[200px] self-stretch sm:self-auto">
                <label className="text-[10px] text-gold uppercase tracking-widest font-mono">Select Event for Auto-Scan</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="bg-background text-sm text-foreground border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer select-astrology"
                >
                  {EVENT_RULES.map((rule) => (
                    <option key={rule.id} value={rule.id}>{rule.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Promise Calculations Card rendering */}
            {(() => {
              const rule = EVENT_RULES.find(r => r.id === selectedEventId)!;
              const cuspInfo = result.cusps[rule.primaryCusp - 1]; // 0-indexed
              const cslName = cuspInfo.subLord;
              const cslPlanet = result.planets.find(p => p.id === cslName)!;
              const cslSigs = result.significators[cslName]?.allList || [];

              const matchesPrimary = cslSigs.includes(rule.primaryCusp);
              const positiveMatches = cslSigs.filter(h => rule.positiveHouses.includes(h));
              const negativeMatches = cslSigs.filter(h => rule.dangerHouses.includes(h));

              const isRetro = cslPlanet.retrograde;

              // Promise Verdict Determination
              let verdictTitle = 'NO DIRECT CHARACTER PROMISE';
              let verdictDesc = 'The Cuspal Sub Lord does not actively signify the necessary house structures. The event is unlikely to materialize under normal circumstances.';
              let verdictType: 'promise' | 'delay' | 'negation' = 'delay';

              if (positiveMatches.length > negativeMatches.length && (matchesPrimary || positiveMatches.includes(rule.primaryCusp))) {
                if (isRetro) {
                  verdictTitle = 'EVENT PROMISED BUT WITH RETROGRADE OBSTACLES';
                  verdictDesc = `The event is promised due to strong supportive houses [${positiveMatches.join(', ')}], but since ${cslName.toUpperCase()} is Retrograde, fruitions will be substantially delayed, with unexpected reversals or multiple attempts before final success.`;
                  verdictType = 'delay';
                } else {
                  verdictTitle = 'EVENT HIGHLY PROMISED / EXTREMELY FAVORABLE';
                  verdictDesc = `Excellent alignment! The Cuspal Sub Lord ${cslPlanet.name} signifies primary and supportive houses [${positiveMatches.join(', ')}] with zero retrogrades, promising smooth execution, favorable results, and timely materialization.`;
                  verdictType = 'promise';
                }
              } else if (negativeMatches.length > positiveMatches.length) {
                verdictTitle = 'HIGH NEGATION & OBSTRUCTION RISK';
                verdictDesc = `The Cuspal Sub Lord ${cslPlanet.name} is heavily aligned with the negating house cluster [${negativeMatches.join(', ')}], creating severe counter-significations that could cancel or heavily negate the event's fruition. Relies heavily on remedial transits.`;
                verdictType = 'negation';
              } else if (positiveMatches.length > 0) {
                verdictTitle = 'MODERATE PROMISE WITH DEFERRED FRUITION';
                verdictDesc = `The event has supportive significators [${positiveMatches.join(', ')}] but lacks primary cusp integration. Fruitfulness may occur with delay, requiring stellar operating dasha triggers.`;
                verdictType = 'delay';
              }

              return (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Detailed Analysis Breakdowns */}
                  <div className="col-span-2 space-y-4">
                    <div className="p-4 bg-background/40 border border-border/40 rounded-lg space-y-3">
                      <span className="text-[10px] font-mono text-gold-soft uppercase tracking-wider block">Rule Explanation</span>
                      <p className="text-sm text-foreground">{rule.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* CSL */}
                      <div className="bg-background/25 border border-border/30 rounded p-4 text-center">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Cuspal Sub Lord</span>
                        <span className="font-display font-medium text-lg text-gold flex items-center justify-center gap-1">
                          <span className="font-mono text-sm">{cslPlanet.symbol}</span>
                          {cslPlanet.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-1">Rule: Cusp {rule.primaryCusp} SL</span>
                      </div>

                      {/* Supportive houses */}
                      <div className="bg-background/25 border border-border/30 rounded p-4 text-center">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Supportive Match</span>
                        <span className="font-mono font-bold text-lg text-green-500 flex items-center justify-center">
                          {positiveMatches.length > 0 ? `[${positiveMatches.join(', ')}]` : 'None'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-1">Goal: {rule.positiveHouses.join(', ')}</span>
                      </div>

                      {/* Negating houses */}
                      <div className="bg-background/25 border border-border/30 rounded p-4 text-center">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Negating Match</span>
                        <span className="font-mono font-bold text-lg text-destructive flex items-center justify-center">
                          {negativeMatches.length > 0 ? `[${negativeMatches.join(', ')}]` : 'None'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-1">Danger: {rule.dangerHouses.join(', ')}</span>
                      </div>
                    </div>

                    {/* Retrograde checking detail */}
                    <div className={`p-4 rounded border text-xs flex gap-3 ${
                      isRetro ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-green-500/10 border-green-500/30 text-green-500'
                    }`}>
                      {isRetro ? (
                        <>
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <strong>Retrograde Alert Warning!</strong> The CSL <strong>{cslPlanet.name}</strong> is currently retrograde.
                            In Krishnamurti Paddhati, a retrograde sublord represents hesitation, unexpected delays, and multiple attempts. The prediction must suggest patient planning.
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 shrink-0 text-green-400" />
                          <div>
                            <strong>Direct Coordinate Speed.</strong> CSL <strong>{cslPlanet.name}</strong> is direct and moving forward.
                            No structural delays through retrograde speeds are indicated for this event promise.
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Verdict Card */}
                  <div className={`border p-6 rounded-lg flex flex-col justify-between space-y-4 shadow-lg pr-promise-glow ${
                    verdictType === 'promise' 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : verdictType === 'negation' 
                        ? 'bg-destructive/5 border-destructive/30' 
                        : 'bg-gold/5 border-gold/30'
                  }`}>
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-gold block">Automated Verdict</span>
                      <h4 className={`text-xl font-display font-medium ${
                        verdictType === 'promise' ? 'text-green-500' : verdictType === 'negation' ? 'text-destructive' : 'text-primary'
                      }`}>
                        {verdictTitle}
                      </h4>
                      <p className="text-xs text-foreground/90 leading-relaxed pt-2">
                        {verdictDesc}
                      </p>
                    </div>

                    <div className="bg-background/40 border border-border/20 p-3 rounded font-mono text-[10px] text-muted-foreground">
                      <span className="font-semibold block text-gold-soft uppercase mb-1">Calculative Meta:</span>
                      CSL_Signified = [{cslSigs.join(', ')}]<br />
                      Pos_Cluster_Matches = {positiveMatches.length}<br />
                      Neg_Cluster_Matches = {negativeMatches.length}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: Transit Simulator & Ruling Planets */}
      {activeTab === 'transit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-border/40 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-display text-gold flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-gold" />
                  Gochara Active Transit Scanning Module
                </h3>
                <p className="text-xs text-muted-foreground">Input any hypothetical future date to automatically scan operating dasha periods, transits, and Ruling Planets matching index.</p>
              </div>

              {/* Transit Date Picker */}
              <div className="flex flex-col space-y-1 self-stretch sm:self-auto min-w-[200px]">
                <label className="text-[10px] text-gold uppercase tracking-widest font-mono">Future Target Date</label>
                <input
                  type="date"
                  value={transitDate}
                  onChange={(e) => setTransitDate(e.target.value)}
                  className="bg-background text-sm text-foreground border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary font-mono cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated positions on that date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dasha Period at transit date */}
              <div className="bg-background/40 border border-border/30 rounded-lg p-5 space-y-3">
                <span className="text-[10px] text-gold uppercase tracking-wider font-mono block">Dasha Profile At Transit Date</span>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-sm border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Mahadasha (MD):</span>
                    <span className="font-semibold text-foreground font-mono">{activeDasha.md}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Bhukti (AD):</span>
                    <span className="font-semibold text-foreground font-mono">{activeDasha.ad}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Antara (PD):</span>
                    <span className="font-semibold text-foreground font-mono">{activeDasha.pd}</span>
                  </div>
                </div>

                {/* DBASP Support Check */}
                {(() => {
                  const mRule = EVENT_RULES.find(r => r.id === selectedEventId)!;
                  const mdSigs = result.significators[activeDasha.md.toLowerCase()]?.allList || [];
                  const adSigs = result.significators[activeDasha.ad.toLowerCase()]?.allList || [];

                  const mdSupports = mdSigs.some(h => mRule.positiveHouses.includes(h));
                  const adSupports = adSigs.some(h => mRule.positiveHouses.includes(h));

                  return (
                    <div className="bg-background/60 p-2.5 rounded border border-border/20 text-[11px] text-muted-foreground/90 space-y-1">
                      <span className="font-bold text-gold-soft block uppercase text-[10px] tracking-wide">Dasha Support Check ({mRule.name}):</span>
                      <span>MD {activeDasha.md} {mdSupports ? '✔️ Support active' : '❌ No active support'}</span><br />
                      <span>AD {activeDasha.ad} {adSupports ? '✔️ Support active' : '❌ No active support'}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Transit Positions */}
              <div className="bg-background/40 border border-border/30 rounded-lg p-5 space-y-3 col-span-2">
                <span className="text-[10px] text-gold uppercase tracking-wider font-mono block">Simulated Celestial Transits ({tYear}-{tMonth}-{tDay})</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[transits.sun, transits.moon, transits.jupiter].map((tr) => (
                    <div key={tr.name} className="bg-background border border-border/20 p-3 rounded text-xs space-y-1">
                      <span className="font-bold text-foreground block border-b border-border/10 pb-1 text-center text-gold-soft">
                        Transiting {tr.name}
                      </span>
                      <span>Sign: {tr.signName}</span><br />
                      <span>Longitude: {tr.longitude.toFixed(2)}°</span><br />
                      <span className="font-semibold block text-gold text-[11px] pt-1">SL: {tr.starLord.toUpperCase()} | Sub: {tr.subLord.toUpperCase()}</span>
                    </div>
                  ))}
                </div>

                {/* Transit Activation triggers */}
                {(() => {
                  const rule = EVENT_RULES.find(r => r.id === selectedEventId)!;
                  // check if transit star lords touch native's natal significator planets
                  const natalMarriageSignificators = result.cusps[rule.primaryCusp - 1]?.longitude; // primary trigger
                  
                  // Let's check matching trigger planets
                  const isTransitActive = transits.jupiter.starLord.toLowerCase() === result.cusps[rule.primaryCusp - 1].subLord.toLowerCase() ||
                                         transits.sun.starLord.toLowerCase() === result.cusps[rule.primaryCusp - 1].subLord.toLowerCase();

                  return (
                    <div className={`p-3 rounded border text-xs flex items-center gap-2.5 mt-2 ${
                      isTransitActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-background/40 border-border/20 text-muted-foreground'
                    }`}>
                      {isTransitActive ? (
                        <>
                          <Activity className="w-5 h-5 text-green-400 shrink-0 animate-pulse" />
                          <div>
                            <strong>Transit Activation Success!</strong> For {transitDate}, transiting Jupiter/Sun's NL elements directly touch the natal {rule.name} planet significators. Trigger condition active!
                          </div>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            No active trigger alignment matches for {transitDate}. Transit Sun/Jupiter did not hit natal event sign lords directly.
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Ruling Planet RPs Matching Engine */}
            <div className="bg-background/20 border border-border/30 rounded-xl p-5 space-y-4">
              <div className="border-b border-border/20 pb-2 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-display text-gold">Dynamic Ruling Planet (RP) Matching Engine</h4>
                  <p className="text-xs text-muted-foreground">Cross-verifies native dasha lords against transit rulers to identify the exact execution match percentage.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-mono tracking-widest text-[#caa05a] block">RP Match Rating</span>
                  <span className="text-2xl font-mono font-bold text-gold">{rpMatchPercentage}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-background border border-border/10 p-3 rounded">
                  <span className="text-gold block mb-1">Native Ruling Planets (RP List):</span>
                  <p className="capitalize text-foreground font-semibold">
                    {Array.from(new Set(nativeRPs)).join(', ') || 'N/A'}
                  </p>
                </div>
                <div className="bg-background border border-border/10 p-3 rounded">
                  <span className="text-gold block mb-1">Transit Ruling Planets (At Transit Date):</span>
                  <p className="capitalize text-foreground font-semibold">
                    {Array.from(new Set(transitRPs)).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI Integration Center */}
      {activeTab === 'copier' && (
        <div className="space-y-6 animate-fade-in">
          {/* Clipboard copy box & retro warning briefs */}
          <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xl space-y-4">
            <div className="border-b border-border/40 pb-2">
              <h3 className="text-lg font-display text-gold">AI Counselling Prompt Generator Portal</h3>
              <p className="text-xs text-muted-foreground">This system compiles all calculations, strengths, significations, and automated promise verdicts into a markdown text document optimal of pasting into ChatGPT, Gemini, or Clause AI models.</p>
            </div>

            {/* retro warnings advisory */}
            <div className="bg-background border border-border/30 p-4 rounded-lg text-xs space-y-2 leading-relaxed">
              <div className="flex items-center gap-1.5 text-gold-soft font-bold uppercase tracking-wider text-[11px]">
                <AlertTriangle className="w-4 h-4 text-gold-soft" />
                Retrograde & Obstruction Advice Flag
              </div>
              <p className="text-foreground/90">
                If the Operating Dasha lord or the Event Primary CSL is currently <strong>Retrograde (R)</strong>, the prompt payload embeds specific directives guiding the AI model to explain temporary obstacles, necessary patience, or structural delays to the native rather than promising immediate direct outcome.
              </p>
            </div>

            {/* Prompt Viewport */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Markdown Prompt Payload Outlook:</span>
                <button
                  onClick={handleCopyPrompt}
                  className="bg-primary/20 hover:bg-gold-soft hover:text-primary-foreground border border-primary/30 text-gold font-mono text-[11px] py-1 px-3 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Details!' : 'Copy Matrix Payload'}
                </button>
              </div>

              <textarea
                readOnly
                value={buildAstronPromptPayload(result, {
                  name: nativeName,
                  dob,
                  tob,
                  placeName,
                  latitude,
                  longitude,
                  timezone
                })}
                className="w-full h-80 bg-background border border-border/60 hover:border-border rounded-lg p-4 font-mono text-[11px] text-muted-foreground/90 focus:outline-none focus:ring-1 focus:ring-primary scrollbar-custom resize-none leading-normal select-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
