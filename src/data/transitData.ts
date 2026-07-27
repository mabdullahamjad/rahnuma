// Complete transit network data for Islamabad & Rawalpindi (Dec 2025).
// Used as the offline fallback, AI context, and seed source for Supabase.

export type RouteType = 'brt' | 'islamabad_feeder' | 'rawalpindi_feeder';

export interface RouteDef {
  code: string;
  name: string;
  type: RouteType;
  color: string;
  from_terminal: string;
  to_terminal: string;
  first_service: string;
  last_service: string;
  frequency_peak_min: number;
  frequency_offpeak_min: number;
  fare: number; // PKR
  stations: string[]; // ordered station names
}

export interface StationDef {
  name: string;
  lat: number;
  lng: number;
  type: 'brt' | 'feeder' | 'transfer';
  city: 'Islamabad' | 'Rawalpindi';
}

// Approximate GPS coordinates along the actual Red/Blue/Green/Orange line corridors.
const STATION_COORDS: Record<string, [number, number]> = {
  // Red Line (BRT) — Faiz Ahmed Faiz to Pak Secretariat
  'Faiz Ahmed Faiz': [33.6520, 73.0770],
  'Faizabad': [33.6670, 73.0800],
  'IJP Road': [33.6760, 73.0830],
  'Pir Wadhai': [33.6800, 73.0720],
  'Saddar': [33.6850, 73.0690],
  'Rialto Chowk': [33.6870, 73.0670],
  'Marrir Chowk': [33.6900, 73.0650],
  'Liaquat Bagh': [33.6920, 73.0630],
  'Committee Chowk': [33.6950, 73.0610],
  'Waris Khan': [33.6980, 73.0590],
  'Rehmanabad': [33.7010, 73.0570],
  'Chandni Chowk': [33.7040, 73.0550],
  'Sadiqabad': [33.7070, 73.0530],
  'Fauji Foundation': [33.7100, 73.0510],
  'Shamsabad': [33.7130, 73.0490],
  'Khayaban-e-Johar': [33.7160, 73.0470],
  'Faiz-e-Aam': [33.7190, 73.0450],
  'I-8': [33.7220, 73.0430],
  'I-9': [33.7250, 73.0410],
  'Pak Secretariat': [33.7280, 73.0390],
  'Stock Exchange': [33.7300, 73.0370],
  '7th Avenue': [33.7320, 73.0350],
  'Shaheed': [33.7340, 73.0330],
  'Kashmir Highway': [33.7360, 73.0310],
  'PIMS': [33.7380, 73.0290],
  'PIMS Hospital': [33.7372, 73.0308],
  'Koral Chowk': [33.6115, 73.0705],
  'Nust': [33.7400, 73.0270],
  'G-9 Markaz': [33.7420, 73.0250],
  'G-8 Markaz': [33.7440, 73.0230],
  'G-7 Markaz': [33.7460, 73.0210],
  'Aabpara': [33.7480, 73.0190],
  'Saudi Pak Tower': [33.7500, 73.0170],
  'Parliament House': [33.7520, 73.0150],
  'D-Chowk': [33.7540, 73.0130],
  // Blue / Green / Orange Lines — shared station names where lines overlap
  'Bhara Kahu': [33.6700, 73.1400],
  'Quaid-e-Azam University': [33.6800, 73.1300],
  'Bari Imam': [33.6900, 73.1200],
  'Malpur': [33.6750, 73.1300],
  // Orange Line
  'Chaklala': [33.6000, 73.0900],
  'Airport': [33.6100, 73.1000],
  'Khanna': [33.6200, 73.0850],
  'Sohan': [33.6300, 73.0800],
  'Pir Sohawa': [33.6400, 73.0750],
  // Feeder hubs
  'Pakistan Secretariat': [33.7280, 73.0390],
  'Satra Meel': [33.6600, 73.0900],
  'Nadir Chowk': [33.6650, 73.0850],
  'Saddar Hub': [33.6850, 73.0690],
  'Faizabad Hub': [33.6670, 73.0800],
  'I-8 Hub': [33.7220, 73.0430],
  'G-9 Hub': [33.7420, 73.0250],
  'G-7 Hub': [33.7460, 73.0210],
  'F-8 Markaz': [33.7180, 73.0500],
  'F-11 Markaz': [33.6800, 73.0200],
  'E-11 Markaz': [33.6700, 73.0300],
  'G-10 Markaz': [33.7300, 73.0400],
  'G-11 Markaz': [33.7350, 73.0350],
  'H-8 Markaz': [33.7250, 73.0450],
  'H-9 Markaz': [33.7280, 73.0480],
  'H-12 Markaz': [33.7400, 73.0500],
  'I-10 Markaz': [33.7150, 73.0400],
  'I-11 Markaz': [33.7200, 73.0450],
  'F-6 Markaz': [33.7350, 73.0600],
  'F-7 Markaz': [33.7400, 73.0550],
  'Blue Area': [33.7250, 73.0700],
  'Karachi Company': [33.7300, 73.0600],
  'Aabpara Market': [33.7480, 73.0190],
  'Melody Market': [33.7320, 73.0650],
  'Super Market': [33.7350, 73.0550],
  'Jinnah Super': [33.7400, 73.0550],
  'Kohsar Market': [33.7380, 73.0580],
  'China Chowk': [33.7200, 73.0500],
  'NADRA Headquarters': [33.7250, 73.0450],
  'Centaurus': [33.7150, 73.0550],
  'Faisal Mosque': [33.7280, 73.0700],
  'Daman-e-Koh': [33.7450, 73.0800],
  'Lok Virsa': [33.7350, 73.0750],
  'Pakistan Monument': [33.7400, 73.0850],
  'Shakarparian': [33.7000, 73.0700],
  'Rawal Lake': [33.6900, 73.0600],
  'Murree Road': [33.6950, 73.0550],
  'Commercial Market': [33.6900, 73.0450],
  'Sadiqabad Hub': [33.7070, 73.0530],
  'Shamsabad Hub': [33.7130, 73.0490],
  'Chandni Chowk Hub': [33.7040, 73.0550],
  'Raja Bazaar': [33.6850, 73.0650],
  'Trunk Bazaar': [33.6880, 73.0630],
  'Banni': [33.6910, 73.0610],
  'Gordon College': [33.6930, 73.0590],
  'Liaquat Bagh Hub': [33.6920, 73.0630],
  'Marrir Chowk Hub': [33.6900, 73.0650],
  'Rialto Hub': [33.6870, 73.0670],
  'Pir Wadhai Hub': [33.6800, 73.0720],
  'IJP Hub': [33.6760, 73.0830],
  'Faizabad Terminal': [33.6670, 73.0800],
  'Satra Meel Terminal': [33.6600, 73.0900],
  'Khanna Pull': [33.6200, 73.0850],
  'Koral': [33.6100, 73.0750],
  'Taramri': [33.6000, 73.0700],
  'Lehtarar': [33.5900, 73.0650],
  'Sohan Hub': [33.6300, 73.0800],
  'Bharakahu Hub': [33.6700, 73.1400],
  'Malpur Hub': [33.6750, 73.1300],
  'Bari Imam Hub': [33.6850, 73.1200],
  'Quaid-e-Azam Hub': [33.6800, 73.1250],
  'Pir Sohawa Hub': [33.6400, 73.0750],
  'Chaklala Hub': [33.6000, 73.0900],
  'Airport Hub': [33.6100, 73.1000],
  'Nadir Chowk Hub': [33.6650, 73.0850],
  'G-6 Markaz': [33.7450, 73.0250],
  'G-5 Markaz': [33.7500, 73.0200],
  'F-5 Markaz': [33.7450, 73.0650],
  'G-13 Markaz': [33.7400, 73.0300],
  'G-12 Markaz': [33.7380, 73.0280],
  'I-8 Markaz': [33.7220, 73.0430],
  'I-9 Markaz': [33.7250, 73.0410],
};

function coordFor(name: string): [number, number] {
  return STATION_COORDS[name] ?? [33.68, 73.05];
}

function cityFor(name: string): 'Islamabad' | 'Rawalpindi' {
  const rawalpindiHints = [
    'Saddar', 'Rialto', 'Marrir', 'Liaquat Bagh', 'Committee Chowk', 'Waris Khan',
    'Rehmanabad', 'Chandni Chowk', 'Sadiqabad', 'Shamsabad', 'Faiz Ahmed Faiz',
    'Faizabad', 'IJP', 'Pir Wadhai', 'Raja Bazaar', 'Trunk Bazaar', 'Banni',
    'Gordon', 'Commercial Market', 'Murree Road', 'Chaklala', 'Nadir', 'Satra Meel',
    'Khanna', 'Sohan', 'Pir Sohawa', 'Fauji Foundation', 'Khayaban',
  ];
  return rawalpindiHints.some((h) => name.includes(h)) ? 'Rawalpindi' : 'Islamabad';
}

function stationType(routeType: RouteType, name: string): 'brt' | 'feeder' | 'transfer' {
  if (routeType === 'brt') return 'brt';
  // Feeder stations that overlap with BRT stations become transfer points.
  const brtStations = new Set<string>(BRT_ROUTES.flatMap((r) => r.stations));
  return brtStations.has(name) ? 'transfer' : 'feeder';
}

// --- Route definitions ---

const BRT_ROUTES: RouteDef[] = [
  {
    code: 'RED',
    name: 'Red Line',
    type: 'brt',
    color: '#d32f2f',
    from_terminal: 'Secretariat',
    to_terminal: 'Saddar',
    first_service: '05:30',
    last_service: '23:00',
    frequency_peak_min: 4,
    frequency_offpeak_min: 10,
    fare: 30,
    stations: [
      'Secretariat', 'Parade Ground', 'Shaheed-e-Millat', '7th Avenue',
      'Stock Exchange', 'PIMS', 'Katchery', 'Ibn-e-Sina', 'Chaman',
      'Kashmir Highway', 'Faiz Ahmed Faiz', 'Khayaban-e-Johar', 'Potohar',
      'IJP', 'Faizabad', 'Shamsabad', '6th Road', 'Rehmanabad',
      'Chandni Chowk', 'Waris Khan', 'Committee Chowk', 'Liaquat Bagh',
      'Marir', 'Saddar',
    ],
  },
  {
    code: 'BLUE',
    name: 'Blue Line',
    type: 'brt',
    color: '#1976d2',
    from_terminal: 'PIMS',
    to_terminal: 'Koral Chowk',
    first_service: '06:00',
    last_service: '22:30',
    frequency_peak_min: 8,
    frequency_offpeak_min: 15,
    fare: 30,
    stations: [
      'PIMS', 'F-9 Park', 'Koral Chowk',
    ],
  },
  {
    code: 'GREEN',
    name: 'Green Line',
    type: 'brt',
    color: '#388e3c',
    from_terminal: 'Bhara Kahu',
    to_terminal: 'PIMS',
    first_service: '06:00',
    last_service: '22:30',
    frequency_peak_min: 6,
    frequency_offpeak_min: 12,
    fare: 30,
    stations: [
      'Bhara Kahu', 'Malpur', 'Quaid-e-Azam University',
      'Bari Imam', 'PIMS',
    ],
  },
  {
    code: 'ORANGE',
    name: 'Orange Line',
    type: 'brt',
    color: '#f57c00',
    from_terminal: 'Faiz Ahmed Faiz',
    to_terminal: 'Airport',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 10,
    frequency_offpeak_min: 20,
    fare: 30,
    stations: [
      'Faiz Ahmed Faiz', 'Faizabad', 'Khanna', 'Koral Chowk', 'Airport',
    ],
  },
];

const ISLAMABAD_FEEDERS: RouteDef[] = [
  {
    code: 'FR-1',
    name: 'F-11 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'F-11 Markaz',
    to_terminal: 'G-10 Markaz',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 10,
    frequency_offpeak_min: 20,
    fare: 20,
    stations: ['F-11 Markaz', 'E-11 Markaz', 'G-10 Markaz', 'G-9 Markaz', 'G-8 Markaz'],
  },
  {
    code: 'FR-2',
    name: 'G-7 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'G-7 Markaz',
    to_terminal: 'PIMS',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 12,
    frequency_offpeak_min: 25,
    fare: 20,
    stations: ['G-7 Markaz', 'G-8 Markaz', 'G-9 Markaz', 'PIMS Hospital'],
  },
  {
    code: 'FR-3',
    name: 'F-6 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'F-6 Markaz',
    to_terminal: 'Pak Secretariat',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['F-6 Markaz', 'F-7 Markaz', 'Blue Area', 'Melody Market', 'Super Market', 'Pak Secretariat'],
  },
  {
    code: 'FR-4',
    name: 'F-8 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'F-8 Markaz',
    to_terminal: 'Centaurus',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['F-8 Markaz', 'Jinnah Super', 'Kohsar Market', 'China Chowk', 'Centaurus'],
  },
  {
    code: 'FR-5',
    name: 'H-8 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'H-8 Markaz',
    to_terminal: 'I-8',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 12,
    frequency_offpeak_min: 25,
    fare: 20,
    stations: ['H-8 Markaz', 'H-9 Markaz', 'H-12 Markaz', 'I-10 Markaz', 'I-11 Markaz', 'I-8'],
  },
  {
    code: 'FR-6',
    name: 'I-8 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'I-8 Markaz',
    to_terminal: 'PIMS Hospital',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['I-8 Markaz', 'I-9 Markaz', 'G-9 Markaz', 'PIMS Hospital'],
  },
  {
    code: 'FR-7',
    name: 'G-11 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'G-11 Markaz',
    to_terminal: 'G-9 Markaz',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 20,
    frequency_offpeak_min: 40,
    fare: 20,
    stations: ['G-11 Markaz', 'G-13 Markaz', 'G-12 Markaz', 'G-10 Markaz', 'G-9 Markaz'],
  },
  {
    code: 'FR-8',
    name: 'Faisal Mosque Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'Faisal Mosque',
    to_terminal: 'Pak Secretariat',
    first_service: '07:00',
    last_service: '21:00',
    frequency_peak_min: 20,
    frequency_offpeak_min: 40,
    fare: 20,
    stations: ['Faisal Mosque', 'Daman-e-Koh', 'Lok Virsa', 'Pakistan Monument', 'Pak Secretariat'],
  },
  {
    code: 'FR-9',
    name: 'Shakarparian Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'Shakarparian',
    to_terminal: 'Rawal Lake',
    first_service: '07:00',
    last_service: '20:00',
    frequency_peak_min: 30,
    frequency_offpeak_min: 60,
    fare: 20,
    stations: ['Shakarparian', 'Rawal Lake', 'Aabpara Market'],
  },
  {
    code: 'FR-10',
    name: 'G-6 Markaz Feeder',
    type: 'islamabad_feeder',
    color: '#00897b',
    from_terminal: 'G-6 Markaz',
    to_terminal: 'G-5 Markaz',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 20,
    frequency_offpeak_min: 40,
    fare: 20,
    stations: ['G-6 Markaz', 'G-5 Markaz', 'F-5 Markaz', 'Melody Market'],
  },
];

const RAWALPINDI_FEEDERS: RouteDef[] = [
  {
    code: 'R-1',
    name: 'Saddar Hub Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Saddar Hub',
    to_terminal: 'Raja Bazaar',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 10,
    frequency_offpeak_min: 20,
    fare: 20,
    stations: ['Saddar', 'Raja Bazaar', 'Trunk Bazaar', 'Banni', 'Gordon College'],
  },
  {
    code: 'R-2',
    name: 'Liaquat Bagh Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Liaquat Bagh Hub',
    to_terminal: 'Commercial Market',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 12,
    frequency_offpeak_min: 25,
    fare: 20,
    stations: ['Liaquat Bagh', 'Marrir Chowk', 'Rialto Chowk', 'Commercial Market'],
  },
  {
    code: 'R-3',
    name: 'Shamsabad Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Shamsabad Hub',
    to_terminal: 'Chandni Chowk Hub',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['Shamsabad', 'Sadiqabad', 'Chandni Chowk'],
  },
  {
    code: 'R-4',
    name: 'Pir Wadhai Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Pir Wadhai Hub',
    to_terminal: 'IJP Hub',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['Pir Wadhai', 'IJP Road', 'Faizabad'],
  },
  {
    code: 'R-5',
    name: 'Faizabad Terminal Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Faizabad Terminal',
    to_terminal: 'Satra Meel Terminal',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 12,
    frequency_offpeak_min: 25,
    fare: 20,
    stations: ['Faizabad', 'Nadir Chowk Hub', 'Satra Meel Terminal'],
  },
  {
    code: 'R-6',
    name: 'Khanna Pull Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Khanna Pull',
    to_terminal: 'Koral',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 20,
    frequency_offpeak_min: 40,
    fare: 20,
    stations: ['Khanna Pull', 'Taramri', 'Koral'],
  },
  {
    code: 'R-7',
    name: 'Sohan Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Sohan Hub',
    to_terminal: 'Lehtarar',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 30,
    frequency_offpeak_min: 60,
    fare: 20,
    stations: ['Sohan', 'Lehtarar'],
  },
  {
    code: 'R-8',
    name: 'Bharakahu Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Bharakahu Hub',
    to_terminal: 'Malpur Hub',
    first_service: '06:30',
    last_service: '21:30',
    frequency_peak_min: 20,
    frequency_offpeak_min: 40,
    fare: 20,
    stations: ['Bhara Kahu', 'Malpur', 'Bari Imam', 'Quaid-e-Azam University'],
  },
  {
    code: 'R-9',
    name: 'Chaklala Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Chaklala Hub',
    to_terminal: 'Airport Hub',
    first_service: '06:00',
    last_service: '22:00',
    frequency_peak_min: 15,
    frequency_offpeak_min: 30,
    fare: 20,
    stations: ['Chaklala', 'Airport'],
  },
  {
    code: 'R-10',
    name: 'Pir Sohawa Feeder',
    type: 'rawalpindi_feeder',
    color: '#7b1fa2',
    from_terminal: 'Pir Sohawa Hub',
    to_terminal: 'Sohan Hub',
    first_service: '07:00',
    last_service: '20:00',
    frequency_peak_min: 30,
    frequency_offpeak_min: 60,
    fare: 20,
    stations: ['Pir Sohawa', 'Sohan'],
  },
];

// Fare policy supplied for this project: Red Metro is Rs.30; every other
// service is Rs.50. Keeping it here prevents screens from drifting apart.
export const ALL_ROUTES: RouteDef[] = [...BRT_ROUTES, ...ISLAMABAD_FEEDERS, ...RAWALPINDI_FEEDERS]
  .map((route) => ({ ...route, fare: route.code === 'RED' ? 30 : 50 }));

// Build unique station list across all routes.
export const ALL_STATIONS: StationDef[] = (() => {
  const seen = new Map<string, StationDef>();
  for (const route of ALL_ROUTES) {
    for (const name of route.stations) {
      if (seen.has(name)) continue;
      const [lat, lng] = coordFor(name);
      seen.set(name, {
        name,
        lat,
        lng,
        type: stationType(route.type, name),
        city: cityFor(name),
      });
    }
  }
  return Array.from(seen.values());
})();

// Map station name -> list of routes passing through it.
export const STATION_ROUTES: Record<string, RouteDef[]> = (() => {
  const map: Record<string, RouteDef[]> = {};
  for (const route of ALL_ROUTES) {
    for (const name of route.stations) {
      if (!map[name]) map[name] = [];
      map[name].push(route);
    }
  }
  return map;
})();

// A single leg of a journey: board a route at one station, ride to another.
export interface JourneyLeg {
  route: RouteDef;
  boardAt: string;
  alightAt: string;
  stops: string[]; // ordered stations traveled on this leg
  mode?: 'ride' | 'walk';
}

// A full multi-hop journey from origin to destination.
export interface Journey {
  legs: JourneyLeg[];
  fare: number;
  transfers: number;
  totalStops: number;
  fromName: string;
  toName: string;
}

export interface JourneyImpact {
  distanceKm: number;
  co2SavedKg: number;
  greenPoints: number;
}

// Per-passenger-km estimates used consistently across the dashboard. The route
// distance is calculated from the selected journey's station coordinates.
const CAR_KG_CO2_PER_KM = 0.192;
const BRT_KG_CO2_PER_KM = 0.069;
const FEEDER_KG_CO2_PER_KM = 0.089;

function distanceKm(a: StationDef, b: StationDef): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function calculateJourneyImpact(journey: Journey | null): JourneyImpact | null {
  if (!journey) return null;
  const stationsByName = new Map(ALL_STATIONS.map((station) => [station.name, station]));
  let transitEmissions = 0;
  let totalDistance = 0;

  for (const leg of journey.legs) {
    if (leg.mode === 'walk') continue;
    const emissionRate = leg.route.type === 'brt' ? BRT_KG_CO2_PER_KM : FEEDER_KG_CO2_PER_KM;
    for (let index = 1; index < leg.stops.length; index++) {
      const start = stationsByName.get(leg.stops[index - 1]);
      const end = stationsByName.get(leg.stops[index]);
      if (!start || !end) continue;
      const segmentDistance = distanceKm(start, end);
      totalDistance += segmentDistance;
      transitEmissions += segmentDistance * emissionRate;
    }
  }

  const co2SavedKg = Math.max(0, totalDistance * CAR_KG_CO2_PER_KM - transitEmissions);
  return { distanceKm: totalDistance, co2SavedKg, greenPoints: Math.round(totalDistance * 10) };
}

// BFS over the route-station graph to find the journey with the fewest transfers.
// Two stations are connected if a single route passes through both (in order).
// Transfers happen at stations shared between routes.
function planJourneyBreadthFirst(fromName: string, toName: string, maxTransfers = 3): Journey | null {
  if (fromName === toName) return null;
  if (!STATION_ROUTES[fromName] || !STATION_ROUTES[toName]) return null;

  // Precompute which routes serve each station and the ordered index of stations.
  const routeStationIndex = new Map<string, Map<string, number>>();
  for (const r of ALL_ROUTES) {
    const m = new Map<string, number>();
    r.stations.forEach((s, i) => m.set(s, i));
    routeStationIndex.set(r.code, m);
  }

  // State: (currentStation, routeCodeWeArrivedOn | null). BFS gives fewest legs.
  type State = { station: string; arrivedOn: string | null };
  type Path = { state: State; legs: JourneyLeg[] };

  const visited = new Set<string>(); // key: station + '|' + arrivedOn
  const queue: Path[] = [];

  // Seed: from the origin, try boarding every route that serves it — both directions.
  for (const r of STATION_ROUTES[fromName]) {
    const idx = routeStationIndex.get(r.code)!;
    const fromIdx = idx.get(fromName)!;
    for (let i = 0; i < r.stations.length; i++) {
      if (i === fromIdx) continue;
      const dest = r.stations[i];
      const stops = i > fromIdx
        ? r.stations.slice(fromIdx, i + 1)
        : r.stations.slice(i, fromIdx + 1).reverse();
      const leg: JourneyLeg = {
        route: r,
        boardAt: fromName,
        alightAt: dest,
        stops,
      };
      if (dest === toName) {
        return { legs: [leg], fare: r.fare, transfers: 0, totalStops: leg.stops.length - 1, fromName, toName };
      }
      const key = `${dest}|${r.code}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: { station: dest, arrivedOn: r.code }, legs: [leg] });
      }
    }
  }

  while (queue.length > 0) {
    const { state, legs } = queue.shift()!;
    if (legs.length - 1 >= maxTransfers) continue;

    // From the current station, try every OTHER route that serves it.
    for (const r of STATION_ROUTES[state.station]) {
      if (r.code === state.arrivedOn) continue; // don't re-board the same route
      const idx = routeStationIndex.get(r.code)!;
      const boardIdx = idx.get(state.station)!;
      for (let i = 0; i < r.stations.length; i++) {
        if (i === boardIdx) continue;
        const dest = r.stations[i];
        const stops = i > boardIdx ? r.stations.slice(boardIdx, i + 1) : r.stations.slice(i, boardIdx + 1).reverse();
        const leg: JourneyLeg = {
          route: r,
          boardAt: state.station,
          alightAt: dest,
          stops,
        };
        const newLegs = [...legs, leg];
        if (dest === toName) {
          const fare = newLegs.reduce((sum, l) => sum + l.route.fare, 0);
          return { legs: newLegs, fare, transfers: newLegs.length - 1, totalStops: newLegs.reduce((sum, leg) => sum + leg.stops.length - 1, 0), fromName, toName };
        }
        const key = `${dest}|${r.code}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ state: { station: dest, arrivedOn: r.code }, legs: newLegs });
        }
      }
    }
  }

  return null;
}

type RouteState = { route: RouteDef; index: number };

// Explicit walking links let the planner bridge nearby service stops without
// inventing map coordinates.  They are used only while planning, never shown
// as scheduled bus routes.
const WALKING_LINKS: Array<{ code: string; name: string; from: string; to: string; metres: number }> = [
  { code: 'WALK-PIMS-CEN', name: 'Walk to Centaurus', from: 'PIMS', to: 'Centaurus', metres: 1200 },
  { code: 'WALK-AAB-F8', name: 'Walk to F-8 Markaz', from: 'Aabpara', to: 'F-8 Markaz', metres: 1700 },
];

const WALKING_ROUTES: RouteDef[] = WALKING_LINKS.map((link) => ({
  code: link.code, name: `${link.name} (~${link.metres} m)`, type: 'islamabad_feeder', color: '#64748b',
  from_terminal: link.from, to_terminal: link.to, first_service: '00:00', last_service: '23:59',
  frequency_peak_min: 0, frequency_offpeak_min: 0, fare: 0, stations: [link.from, link.to],
}));

// Dijkstra's algorithm over stations and buses. Adjacent stops cost one unit;
// changing buses costs three units, so the shortest path avoids needless swaps.
export function planJourney(fromName: string, toName: string): Journey | null {
  if (fromName === toName) return null;
  if (!STATION_ROUTES[fromName] || !STATION_ROUTES[toName]) return null;

  const planningRoutes = [...ALL_ROUTES, ...WALKING_ROUTES];
  const planningStationRoutes: Record<string, RouteDef[]> = {};
  for (const route of planningRoutes) for (const station of route.stations) (planningStationRoutes[station] ??= []).push(route);
  const routeStationIndex = new Map<string, Map<string, number>>();
  for (const route of planningRoutes) {
    routeStationIndex.set(route.code, new Map(route.stations.map((station, index) => [station, index])));
  }

  const keyFor = (route: RouteDef, index: number) => `${route.code}:${index}`;
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const states = new Map<string, RouteState>();
  const queue: Array<{ key: string; cost: number }> = [];
  const add = (route: RouteDef, index: number, cost: number, parent?: string) => {
    const key = keyFor(route, index);
    if (cost >= (distances.get(key) ?? Infinity)) return;
    distances.set(key, cost);
    states.set(key, { route, index });
    if (parent) previous.set(key, parent);
    queue.push({ key, cost });
  };

  for (const route of planningStationRoutes[fromName]) {
    add(route, routeStationIndex.get(route.code)!.get(fromName)!, 0);
  }

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (current.cost !== distances.get(current.key)) continue;
    const currentState = states.get(current.key)!;
    const station = currentState.route.stations[currentState.index];

    if (station === toName) {
      const path: RouteState[] = [];
      for (let key: string | undefined = current.key; key; key = previous.get(key)) path.unshift(states.get(key)!);

      const legs: JourneyLeg[] = [];
      let active: JourneyLeg = { route: path[0].route, boardAt: fromName, alightAt: fromName, stops: [fromName], mode: path[0].route.code.startsWith('WALK-') ? 'walk' : 'ride' };
      for (let i = 1; i < path.length; i++) {
        const next = path[i];
        const stop = next.route.stations[next.index];
        if (next.route.code !== active.route.code) {
          if (active.stops.length > 1) legs.push(active);
          active = { route: next.route, boardAt: stop, alightAt: stop, stops: [stop], mode: next.route.code.startsWith('WALK-') ? 'walk' : 'ride' };
        } else {
          active.stops.push(stop);
          active.alightAt = stop;
        }
      }
      if (active.stops.length > 1) legs.push(active);
      if (legs.length === 0) return null;
      return {
        legs,
        fare: legs.reduce((sum, leg) => sum + leg.route.fare, 0),
        transfers: Math.max(0, legs.filter((leg) => leg.mode !== 'walk').length - 1),
        totalStops: legs.reduce((sum, leg) => sum + leg.stops.length - 1, 0),
        fromName,
        toName,
      };
    }

    for (const nextIndex of [currentState.index - 1, currentState.index + 1]) {
      if (nextIndex >= 0 && nextIndex < currentState.route.stations.length) add(currentState.route, nextIndex, current.cost + 1, current.key);
    }
    for (const transferRoute of planningStationRoutes[station]) {
      if (transferRoute.code !== currentState.route.code) {
        add(transferRoute, routeStationIndex.get(transferRoute.code)!.get(station)!, current.cost + 3, current.key);
      }
    }
  }
  return null;
}
// Human-readable journey description for the AI assistant.
export function describeJourney(j: Journey | null): string {
  if (!j) return 'No connection found between those stations. Try a major BRT transfer point like Faizabad, Pak Secretariat, or PIMS.';
  const parts: string[] = [];
  const busLegs = j.legs.filter((leg) => leg.mode !== 'walk');
  parts.push(`Shortest route from ${j.fromName} to ${j.toName}: ${busLegs.length} bus${busLegs.length !== 1 ? 'es' : ''}, ${j.transfers} transfer${j.transfers !== 1 ? 's' : ''}, ${j.totalStops} stops, total fare Rs.${j.fare}.`);
  j.legs.forEach((leg, i) => {
    if (leg.mode === 'walk') {
      parts.push(`${i + 1}. Walk from ${leg.boardAt} to ${leg.alightAt} (${leg.route.name.match(/~\\d+ m/)?.[0] ?? 'short walking link'}).`);
      return;
    }
    const dir = leg.stops.length > 1 ? ` via ${leg.stops.slice(1, -1).join(', ')}` : '';
    parts.push(`${i + 1}. Take ${leg.route.code} (${leg.route.name}) from ${leg.boardAt} to ${leg.alightAt}${dir ? ` (${leg.stops.length} stops)` : ''}.`);
  });
  return parts.join('\n');
}

// Fare calculation: same-route = route fare; transfer = sum of two route fares.
export function calculateFare(fromName: string, toName: string): { fare: number; routes: RouteDef[]; direct: boolean } {
  const fromRoutes = STATION_ROUTES[fromName] ?? [];
  const toRoutes = STATION_ROUTES[toName] ?? [];
  // Direct route sharing both stations.
  for (const r of fromRoutes) {
    if (toRoutes.includes(r)) {
      return { fare: r.fare, routes: [r], direct: true };
    }
  }
  // Transfer: pick cheapest pair.
  let best: { fare: number; routes: RouteDef[] } | null = null;
  for (const r1 of fromRoutes) {
    for (const r2 of toRoutes) {
      if (r1.code === r2.code) continue;
      // Check for a shared transfer station between r1 and r2.
      const shared = r1.stations.find((s) => r2.stations.includes(s));
      if (shared) {
        const fare = r1.fare + r2.fare;
        if (!best || fare < best.fare) best = { fare, routes: [r1, r2] };
      }
    }
  }
  if (best) return { ...best, direct: false };
  return { fare: 0, routes: [], direct: false };
}

// Plain-text summary for AI context injection.
export function buildTransitSummary(): string {
  const lines: string[] = [];
  lines.push('Islamabad & Rawalpindi Metro Transit Network (Dec 2025). Routes:');
  for (const r of ALL_ROUTES) {
    lines.push(
      `${r.code} (${r.name}, ${r.type.replace('_', ' ')}): ${r.from_terminal} -> ${r.to_terminal}. ` +
        `Fare Rs.${r.fare}. Service ${r.first_service}-${r.last_service}. ` +
        `Stations: ${r.stations.join(', ')}.`
    );
  }
  return lines.join('\n');
}
