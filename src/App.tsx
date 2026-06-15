import React, { useState } from 'react';
import { Compass, Sparkles, RefreshCw, Star, Info } from 'lucide-react';
import { computeKPEngine, KPEngineResult } from './lib/kp/calculate';
import BirthForm, { BirthProfile } from './components/BirthForm';
import KPResults from './components/KPResults';

export default function App() {
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [result, setResult] = useState<KPEngineResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = (newProfile: BirthProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        // Parse raw dob & tob values
        const birthDate = new Date(newProfile.dob);
        const year = birthDate.getFullYear();
        const month = birthDate.getMonth() + 1;
        const day = birthDate.getDate();

        // Convert tob (HH:MM) to decimal hours
        const [hStr, mStr, sStr] = newProfile.tob.split(':');
        const h = parseInt(hStr || '0', 10);
        const m = parseInt(mStr || '0', 10);
        const s = parseInt(sStr || '0', 10);
        const decimalHours = h + m / 60.0 + s / 3600.0;

        const calculated = computeKPEngine(
          year,
          month,
          day,
          decimalHours,
          newProfile.timezone,
          newProfile.latitude,
          newProfile.longitude
        );

        setProfile(newProfile);
        setResult(calculated);
      } catch (err) {
        console.error('Computation Error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 800); // minor intuitive latency to simulate high-precision calculation
  };

  const handleReset = () => {
    setProfile(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Brand Header */}
        <header className="flex justify-between items-center border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary">
              <Compass className="w-6 h-6 text-gold animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-display font-medium tracking-wide text-foreground flex items-center gap-1.5">
                URANIA <span className="text-[#caa05a] font-normal text-sm">KP Stellar System</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Astronomical Krishnamurti Paddhati Core
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 py-1 px-3 bg-muted/30 border border-border/40 rounded-full text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span className="font-mono text-[10px]">Precision Ephemeris Engine Active</span>
          </div>
        </header>

        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-card/85 to-surface-2/80 rounded-xl p-8 border border-border/80 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-3xl space-y-3 relative z-10">
            <span className="text-xs uppercase font-mono tracking-widest text-gold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> Automated predictive analysis & transit triggers
            </span>
            <h2 className="text-4xl font-display md:text-5xl font-medium tracking-tight text-white leading-tight">
              Predictive Krishnamurti Astrology with AI Counselling
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
              Calculate sidereal longitudes, unequal Placidus house dividers, 4-level gradations, and dynamic planet strengths. Pack coordinates instantly to guide advanced AI prediction.
            </p>
          </div>
        </div>

        {/* Dashboard Master Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coordinates input form */}
          <div className="lg:col-span-4">
            <BirthForm onCalculate={handleCalculate} isLoading={isLoading} />
            
            {/* Short helpful tips/FAQ */}
            <div className="mt-6 bg-card/45 border border-border/40 rounded-lg p-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-1.5 text-gold-soft font-semibold uppercase tracking-wider text-[10px]">
                <Info className="w-4 h-4 text-gold-soft" />
                Astronomic Calculation parameters
              </div>
              <p>
                Calculations use the <strong>Krishnamurti (KP) Ayanamsa</strong>. Planets and Placidus Cusps are generated geo-centrically relative to Keplerian parameters.
              </p>
              <p>
                The resulting 4-level significations, Retrograde states, and Cuspal promises are packed as a Counselling prompt. Copy and paste it to get deep corrective answers from advanced models.
              </p>
            </div>
          </div>

          {/* Results Tabbed Panel */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="bg-card/40 border border-border/40 rounded-xl p-24 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                <div className="space-y-1">
                  <p className="font-display text-lg text-gold-soft">Solving Celestial Coordinates...</p>
                  <p className="text-xs text-muted-foreground">Fitting orbits, evaluating Placidus semi-arcs, and generating Vimshottari timelines.</p>
                </div>
              </div>
            ) : result && profile ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-mono text-muted-foreground">Calculation Status: <span className="text-green-500 font-bold">Solved</span></span>
                  <button
                    onClick={handleReset}
                    className="text-xs text-gold hover:text-white underline cursor-pointer bg-transparent border-0 focus:outline-none transition-all"
                  >
                    Clear Computations
                  </button>
                </div>
                <KPResults
                  result={result}
                  nativeName={profile.name}
                  dob={profile.dob}
                  tob={profile.tob}
                  placeName={profile.placeName}
                  latitude={profile.latitude}
                  longitude={profile.longitude}
                  timezone={profile.timezone}
                />
              </div>
            ) : (
              <div className="bg-card/40 border border-border/40 rounded-xl p-20 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-full bg-radial-glow pointer-events-none opacity-40" />
                
                <div className="p-4 bg-primary/5 rounded-full border border-primary/20 text-gold relative z-10 animate-pulse">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm relative z-10">
                  <h3 className="font-display text-xl text-gold-soft">Awaiting Birth Space-Time Inputs</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Provide birth date, time, and coordinates on the left column to resolve the complete sidereal chart matrix and unlock prediction analyzers.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
