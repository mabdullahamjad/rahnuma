/*
# Islamabad Rawalpindi Metro Transit Schema

## Purpose
Stores the complete transit network data for the Rah-Numa app, including all
BRT and feeder routes, their stations with GPS coordinates, and schedule information.

## Tables Created

### transit_routes
Stores every bus/metro route from the official December 2025 metro map.
- id (uuid, pk)
- code (text) – e.g. "RED", "FR-1", "R-2"
- name (text) – full human-readable name
- type (text) – 'brt' | 'islamabad_feeder' | 'rawalpindi_feeder'
- color (text) – hex color for map rendering
- from_terminal (text) – origin terminal name
- to_terminal (text) – destination terminal name
- first_service (time) – first departure of day
- last_service (time) – last departure of day
- frequency_peak_min (int) – minutes between buses during peak hours
- frequency_offpeak_min (int) – minutes between buses off-peak

### transit_stations
All physical stations/stops with GPS coordinates.
- id (uuid, pk)
- name (text)
- lat / lng (double precision) – WGS84 coordinates
- type (text) – 'brt' | 'feeder' | 'transfer'
- city (text) – 'Islamabad' | 'Rawalpindi'

### route_stations
Junction table ordering stations per route.
- route_id (fk → transit_routes)
- station_id (fk → transit_stations)
- stop_order (int) – 1-based ordering along route

## Security
RLS enabled on all tables. Public (anon + authenticated) SELECT only — transit
data is intentionally public information.
*/

-- Routes
CREATE TABLE IF NOT EXISTS transit_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('brt','islamabad_feeder','rawalpindi_feeder')),
  color text NOT NULL DEFAULT '#326a40',
  from_terminal text NOT NULL,
  to_terminal text NOT NULL,
  first_service time NOT NULL DEFAULT '05:30',
  last_service time NOT NULL DEFAULT '23:00',
  frequency_peak_min int NOT NULL DEFAULT 10,
  frequency_offpeak_min int NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transit_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_routes" ON transit_routes;
CREATE POLICY "public_select_routes" ON transit_routes FOR SELECT
  TO anon, authenticated USING (true);

-- Stations
CREATE TABLE IF NOT EXISTS transit_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  type text NOT NULL CHECK (type IN ('brt','feeder','transfer')),
  city text NOT NULL DEFAULT 'Islamabad',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transit_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_stations" ON transit_stations;
CREATE POLICY "public_select_stations" ON transit_stations FOR SELECT
  TO anon, authenticated USING (true);

-- Route-Station junction
CREATE TABLE IF NOT EXISTS route_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES transit_routes(id) ON DELETE CASCADE,
  station_id uuid NOT NULL REFERENCES transit_stations(id) ON DELETE CASCADE,
  stop_order int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_id, stop_order)
);

ALTER TABLE route_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_route_stations" ON route_stations;
CREATE POLICY "public_select_route_stations" ON route_stations FOR SELECT
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_route_stations_route ON route_stations(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stations_station ON route_stations(station_id);
CREATE INDEX IF NOT EXISTS idx_stations_city ON transit_stations(city);
CREATE INDEX IF NOT EXISTS idx_routes_type ON transit_routes(type);
