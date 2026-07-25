import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

export async function fetchRoutes(): Promise<TransitRoute[]> {
  const { data, error } = await supabase.from('transit_routes').select('*').order('type').order('code');
  if (error) throw error;
  return data ?? [];
}

export async function fetchStations(): Promise<TransitStation[]> {
  const { data, error } = await supabase.from('transit_stations').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchRouteStations(): Promise<RouteStation[]> {
  const { data, error } = await supabase
    .from('route_stations')
    .select('*, station:transit_stations(*), route:transit_routes(*)')
    .order('route_id')
    .order('stop_order');
  if (error) throw error;
  return (data ?? []) as unknown as RouteStation[];
}
