/**
 * KP Astrology Core Constants & Metadata
 */

export interface PlanetDef {
  id: string;
  name: string;
  symbol: string;
  dashaYears: number;
}

export const PLANETS: PlanetDef[] = [
  { id: 'ketu', name: 'Ketu', symbol: '☋', dashaYears: 7 },
  { id: 'venus', name: 'Venus', symbol: '♀', dashaYears: 20 },
  { id: 'sun', name: 'Sun', symbol: '☉', dashaYears: 6 },
  { id: 'moon', name: 'Moon', symbol: '☽', dashaYears: 10 },
  { id: 'mars', name: 'Mars', symbol: '♂', dashaYears: 7 },
  { id: 'rahu', name: 'Rahu', symbol: '☊', dashaYears: 18 },
  { id: 'jupiter', name: 'Jupiter', symbol: '♃', dashaYears: 16 },
  { id: 'saturn', name: 'Saturn', symbol: '♄', dashaYears: 19 },
  { id: 'mercury', name: 'Mercury', symbol: '☿', dashaYears: 17 }
];

export const VIMSHOTTARI_ORDER: string[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'
];

export const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'ketu' },
  { name: 'Bharani', lord: 'venus' },
  { name: 'Krittika', lord: 'sun' },
  { name: 'Rohini', lord: 'moon' },
  { name: 'Mrigashira', lord: 'mars' },
  { name: 'Ardra', lord: 'rahu' },
  { name: 'Punarvasu', lord: 'jupiter' },
  { name: 'Pushya', lord: 'saturn' },
  { name: 'Ashlesha', lord: 'mercury' },
  { name: 'Magha', lord: 'ketu' },
  { name: 'Purva Phalguni', lord: 'venus' },
  { name: 'Uttara Phalguni', lord: 'sun' },
  { name: 'Hasta', lord: 'moon' },
  { name: 'Chitra', lord: 'mars' },
  { name: 'Swati', lord: 'rahu' },
  { name: 'Vishakha', lord: 'jupiter' },
  { name: 'Anuradha', lord: 'saturn' },
  { name: 'Jyeshtha', lord: 'mercury' },
  { name: 'Mula', lord: 'ketu' },
  { name: 'Purva Ashadha', lord: 'venus' },
  { name: 'Uttara Ashadha', lord: 'sun' },
  { name: 'Shravana', lord: 'moon' },
  { name: 'Dhanishta', lord: 'mars' },
  { name: 'Shatabhisha', lord: 'rahu' },
  { name: 'Purva Bhadrapada', lord: 'jupiter' },
  { name: 'Uttara Bhadrapada', lord: 'saturn' },
  { name: 'Revati', lord: 'mercury' }
];

export const SIGNS = [
  { name: 'Aries', lord: 'mars', symbol: '♈' },
  { name: 'Taurus', lord: 'venus', symbol: '♉' },
  { name: 'Gemini', lord: 'mercury', symbol: '♊' },
  { name: 'Cancer', lord: 'moon', symbol: '♋' },
  { name: 'Leo', lord: 'sun', symbol: '♌' },
  { name: 'Virgo', lord: 'mercury', symbol: '♍' },
  { name: 'Libra', lord: 'venus', symbol: '♎' },
  { name: 'Scorpio', lord: 'mars', symbol: '♏' },
  { name: 'Sagittarius', lord: 'jupiter', symbol: '♐' },
  { name: 'Capricorn', lord: 'saturn', symbol: '♑' },
  { name: 'Aquarius', lord: 'saturn', symbol: '♒' },
  { name: 'Pisces', lord: 'jupiter', symbol: '♓' }
];

export const HOUSE_TITLES: Record<number, string> = {
  1: 'Self, Physicality, Life Force',
  2: 'Wealth, Family, Speech, Assets',
  3: 'Short Journeys, Siblings, Courage, Communications',
  4: 'Home, Mother, Property, Vehicle, Comforts',
  5: 'Intellect, Children, Creativity, Speculation',
  6: 'Debts, Diseases, Obstacles, Daily Employment',
  7: 'Spouse, Partnerships, Legal Contracts, Public',
  8: 'Longevity, Sudden Events, Inheritance, Secret Matters',
  9: 'Higher Learning, Father, Long Journeys, Destiny',
  10: 'Career, Status, Profession, Power, Reputation',
  11: 'Gains, Desires Fulfilled, Friends, Prosperity',
  12: 'Losses, Hospitalization, Investments, Foreign Lands'
};
