/*
  Canonical route labels

  Route codes published on the source maps are the stable route names. Keep one
  canonical label per route so UI, imports, and joins do not depend on invented
  terminal-based aliases.
*/

UPDATE transit_routes
SET
  code = upper(trim(code)),
  name = CASE upper(trim(code))
    WHEN 'RED' THEN 'Red Line'
    WHEN 'ORANGE' THEN 'Orange Airport Line'
    WHEN 'BLUE' THEN 'Blue Line'
    WHEN 'GREEN' THEN 'Green Line'
    ELSE upper(trim(code))
  END;

-- Merge case/whitespace variants of the same station before making the
-- normalized name unique. Route-stop ordering stays intact because it is
-- keyed by route and stop_order, not by the station UUID.
WITH canonical_stations AS (
  SELECT
    id,
    min(id::text) OVER (
      PARTITION BY lower(regexp_replace(trim(name), '\\s+', ' ', 'g'))
    )::uuid AS canonical_id
  FROM transit_stations
)
UPDATE route_stations AS route_stop
SET station_id = canonical_stations.canonical_id
FROM canonical_stations
WHERE route_stop.station_id = canonical_stations.id
  AND canonical_stations.id <> canonical_stations.canonical_id;

WITH canonical_stations AS (
  SELECT
    id,
    min(id::text) OVER (
      PARTITION BY lower(regexp_replace(trim(name), '\\s+', ' ', 'g'))
    )::uuid AS canonical_id
  FROM transit_stations
)
DELETE FROM transit_stations AS station
USING canonical_stations
WHERE station.id = canonical_stations.id
  AND canonical_stations.id <> canonical_stations.canonical_id;

UPDATE transit_stations
SET name = regexp_replace(trim(name), '\\s+', ' ', 'g');

-- A route name now identifies exactly one route, independently of its UUID.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transit_routes_canonical_name
  ON transit_routes (lower(name));

-- Prevent whitespace variants of the same physical station from creating
-- duplicate dropdown entries in future imports.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transit_stations_normalized_name
  ON transit_stations (lower(regexp_replace(trim(name), '\\s+', ' ', 'g')));
