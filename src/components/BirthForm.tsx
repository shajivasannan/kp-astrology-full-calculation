import React, { useState } from 'react';
import { Compass, MapPin, Clock, Calendar } from 'lucide-react';

export interface BirthProfile {
  name: string;
  dob: string; // YYYY-MM-DD
  tob: string; // HH:MM
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

interface BirthFormProps {
  onCalculate: (profile: BirthProfile) => void;
  isLoading: boolean;
}

const QUICK_CITIES = [
  { name: 'Chennai, India', lat: 13.0827, lon: 80.2707, tz: 5.5 },
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, tz: 1 },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060, tz: -4 }
];

export default function BirthForm({ onCalculate, isLoading }: BirthFormProps) {
  const [profile, setProfile] = useState<BirthProfile>({
    name: 'Srinivasa Ramanujan',
    dob: '1887-12-22',
    tob: '18:20',
    placeName: 'Erode, Tamil Nadu, India',
    latitude: 11.3410,
    longitude: 77.7172,
    timezone: 5.5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' || name === 'timezone' ? parseFloat(value) : value
    }));
  };

  const handleQuickCity = (city: typeof QUICK_CITIES[0]) => {
    setProfile(prev => ({
      ...prev,
      placeName: city.name,
      latitude: city.lat,
      longitude: city.lon,
      timezone: city.tz
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card/75 border border-border/80 backdrop-blur-md rounded-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-2xl font-display font-medium text-gold flex items-center gap-2">
          <Compass className="w-5 h-5 text-gold animate-spin-slow" />
          Birth Space-Time Coordinates
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Provide precise birth parameters. Latitude and time-offsets are vital for accurate Placidus cusp subdivisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Full Name / Label</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Enter native name"
            required
            className="bg-background border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground/60 transition-all"
          />
        </div>

        {/* Place */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Place of Birth</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="placeName"
              value={profile.placeName}
              onChange={handleChange}
              placeholder="E.g., Chennai, India"
              required
              className="w-full bg-background border border-border/80 rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
            />
          </div>
        </div>

        {/* Date of birth */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Date of Birth</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              required
              className="w-full bg-background border border-border/80 rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
            />
          </div>
        </div>

        {/* Time of birth */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Time of Birth (Local Civil)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="time"
              name="tob"
              step="1"
              value={profile.tob}
              onChange={handleChange}
              required
              className="w-full bg-background border border-border/80 rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/30 pt-4">
        {/* Latitude */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Latitude (Deg Decimal)</label>
          <input
            type="number"
            step="0.0001"
            name="latitude"
            min="-90"
            max="90"
            value={profile.latitude}
            onChange={handleChange}
            required
            className="num bg-background border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
          />
        </div>

        {/* Longitude */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Longitude (Deg Decimal)</label>
          <input
            type="number"
            step="0.0001"
            name="longitude"
            min="-180"
            max="180"
            value={profile.longitude}
            onChange={handleChange}
            required
            className="num bg-background border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gold-soft uppercase tracking-wider">Timezone (Hours from UTC)</label>
          <input
            type="number"
            step="0.1"
            name="timezone"
            min="-12"
            max="14"
            value={profile.timezone}
            onChange={handleChange}
            required
            className="num bg-background border border-border/80 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground transition-all"
          />
        </div>
      </div>

      {/* Quick Cities */}
      <div className="border-t border-border/30 pt-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
          Or Quick-Fill Standard Locations:
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => handleQuickCity(city)}
              className="text-xs bg-background/50 hover:bg-primary/20 hover:text-primary border border-border/60 rounded px-2.5 py-1 text-foreground transition-all"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-gold-soft text-primary-foreground font-medium py-3 rounded-md shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? 'Computing Sidereal Matrix...' : 'Generate Krishnamurti Paddhati Chart'}
      </button>
    </form>
  );
}
