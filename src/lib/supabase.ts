import { createClient } from '@supabase/supabase-js';
import { ALL_ROUTES, ALL_STATIONS, STATION_ROUTES, calculateFare, buildTransitSummary, type RouteDef, type StationDef } from '@/data/transitData';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TransitRoute = {
  id: string;
  code: string;
  name: string;
  type: 'brt' | 'islamabad_feeder' | 'rawalpindi_feeder';
  color: string;
  from_terminal: string;
  to_terminal: string;
  first_service: string;
  last_service: string;
  frequency_peak_min: number;
  frequency_offpeak_min: number;
  fare: number;
};

export type TransitStation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'brt' | 'feeder' | 'transfer';
  city: string;
};

export type RouteStation = {
  id: string;
  route_id: string;
  station_id: string;
  stop_order: number;
  station: TransitStation;
  route: TransitRoute;
};

const CACHE_KEY = 'rahnuma_transit_cache_v3';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

interface CachedData {
  ts: number;
  routes: TransitRoute[];
  stations: TransitStation[];
  routeStations: RouteStation[];
}

function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedData;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CachedData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

// Build static fallback data from the bundled transit definitions.
function staticRoutes(): TransitRoute[] {
  return ALL_ROUTES.map((r, i) => ({
    id: `static-route-${i}`,
    code: r.code,
    name: r.name,
    type: r.type,
    color: r.color,
    from_terminal: r.from_terminal,
    to_terminal: r.to_terminal,
    first_service: r.first_service,
    last_service: r.last_service,
    frequency_peak_min: r.frequency_peak_min,
    frequency_offpeak_min: r.frequency_offpeak_min,
    fare: r.fare,
  }));
}

function staticStations(): TransitStation[] {
  return ALL_STATIONS.map((s, i) => ({
    id: `static-station-${i}`,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    type: s.type,
    city: s.city,
  }));
}

function staticRouteStations(routes: TransitRoute[], stations: TransitStation[]): RouteStation[] {
  const out: RouteStation[] = [];
  const stationByName = new Map(stations.map((s) => [s.name, s]));
  const routeByCode = new Map(routes.map((r) => [r.code, r]));
  let id = 0;
  for (const def of ALL_ROUTES) {
    const route = routeByCode.get(def.code);
    if (!route) continue;
    def.stations.forEach((name, order) => {
      const station = stationByName.get(name);
      if (!station) return;
      out.push({
        id: `static-rs-${id++}`,
        route_id: route.id,
        station_id: station.id,
        stop_order: order + 1,
        station,
        route,
      });
    });
  }
  return out;
}

export async function fetchRoutes(): Promise<TransitRoute[]> {
  const cached = readCache();
  if (cached) return cached.routes;
  try {
    const { data, error } = await supabase.from('transit_routes').select('*').order('type').order('code');
    if (error) throw error;
    if (data && data.length > 0) {
      return data as TransitRoute[];
    }
    return staticRoutes();
  } catch {
    return staticRoutes();
  }
}

export async function fetchStations(): Promise<TransitStation[]> {
  const cached = readCache();
  if (cached) return cached.stations;
  try {
    const { data, error } = await supabase.from('transit_stations').select('*').order('name');
    if (error) throw error;
    if (data && data.length > 0) {
      return data as TransitStation[];
    }
    return staticStations();
  } catch {
    return staticStations();
  }
}

export async function fetchRouteStations(): Promise<RouteStation[]> {
  const cached = readCache();
  if (cached) return cached.routeStations;
  try {
    const { data, error } = await supabase
      .from('route_stations')
      .select('*, station:transit_stations(*), route:transit_routes(*)')
      .order('route_id')
      .order('stop_order');
    if (error) throw error;
    if (data && data.length > 0) {
      return data as unknown as RouteStation[];
    }
    return staticRouteStations(staticRoutes(), staticStations());
  } catch {
    return staticRouteStations(staticRoutes(), staticStations());
  }
}

// Fetch everything and persist to localStorage for offline use.
export async function fetchAllForCache(): Promise<void> {
  try {
    const [routes, stations, routeStations] = await Promise.all([
      fetchRoutes(),
      fetchStations(),
      fetchRouteStations(),
    ]);
    writeCache({ ts: Date.now(), routes, stations, routeStations });
  } catch {
    // caching is best-effort
  }
}

export { STATION_ROUTES, calculateFare, buildTransitSummary, type RouteDef, type StationDef };
