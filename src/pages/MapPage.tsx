import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoutes, fetchRouteStations, fetchStations, type TransitRoute, type TransitStation, type RouteStation } from '@/lib/supabase';
import { METRO_GEO_LINES } from '@/data/metroGeo';

// Fix default marker icons in Leaflet bundled with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeStationIcon(color: string, filled: boolean) {
  return L.divIcon({
    className: 'rahnuma-station-icon',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${
      filled ? color : '#fff'
    };border:3px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,0.3);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeLiveIcon(color: string) {
  return L.divIcon({
    className: 'rahnuma-live-icon',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 0 0 0 ${color}66;animation:rahnuma-pulse 2s infinite;"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const TWIN_CITIES_CENTER: [number, number] = [33.68, 73.05];

const filterChips = [
  { id: 'all', label: 'All', icon: 'all_inclusive' },
  { id: 'brt', label: 'BRT Metro', icon: 'train' },
  { id: 'islamabad_feeder', label: 'Islamabad Feeders', icon: 'directions_bus' },
  { id: 'rawalpindi_feeder', label: 'Rawalpindi Feeders', icon: 'airport_shuttle' },
];

type Arrival = {
  stationName: string;
  routeCode: string;
  routeName: string;
  routeColor: string;
  etaMin: number;
  status: 'On Time' | 'Scheduled' | 'Delayed';
  vehicleType: 'train' | 'directions_bus';
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [stations, setStations] = useState<TransitStation[]>([]);
  const [routeStations, setRouteStations] = useState<RouteStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recenterTarget, setRecenterTarget] = useState<[number, number]>(TWIN_CITIES_CENTER);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, s, rs] = await Promise.all([fetchRoutes(), fetchStations(), fetchRouteStations()]);
        if (cancelled) return;
        setRoutes(r);
        setStations(s);
        setRouteStations(rs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load map data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRoutes = useMemo(
    () => (activeFilter === 'all' ? routes : routes.filter((r) => r.type === activeFilter)),
    [routes, activeFilter]
  );

  const visibleRouteIds = useMemo(() => new Set(visibleRoutes.map((r) => r.id)), [visibleRoutes]);

  const polylines = useMemo(() => {
    const byRoute = new Map<string, { color: string; points: [number, number][] }>();
    for (const rs of routeStations) {
      if (!visibleRouteIds.has(rs.route_id)) continue;
      const entry =
        byRoute.get(rs.route_id) ?? { color: rs.route.color, points: [] };
      entry.points.push([rs.station.lat, rs.station.lng]);
      byRoute.set(rs.route_id, entry);
    }
    return Array.from(byRoute.values());
  }, [routeStations, visibleRouteIds]);

  const visibleStations = useMemo(() => {
    const ids = new Set<string>();
    for (const rs of routeStations) {
      if (visibleRouteIds.has(rs.route_id)) ids.add(rs.station_id);
    }
    return stations.filter((s) => ids.has(s.id));
  }, [stations, routeStations, visibleRouteIds]);

  // Simulated live vehicle markers — one per visible route, positioned along its polyline.
  const liveVehicles = useMemo(() => {
    const now = Date.now();
    return visibleRoutes.map((route, i) => {
      const stops = routeStations
        .filter((rs) => rs.route_id === route.id)
        .sort((a, b) => a.stop_order - b.stop_order);
      if (stops.length < 2) return null;
      const t = ((now / 1000 / 30) + i * 0.17) % 1;
      const segIndex = Math.floor(t * (stops.length - 1));
      const segT = t * (stops.length - 1) - segIndex;
      const a = stops[segIndex].station;
      const b = stops[Math.min(segIndex + 1, stops.length - 1)].station;
      const lat = a.lat + (b.lat - a.lat) * segT;
      const lng = a.lng + (b.lng - a.lng) * segT;
      return { route, lat, lng, heading: b.name };
    }).filter(Boolean) as { route: TransitRoute; lat: number; lng: number; heading: string }[];
  }, [visibleRoutes, routeStations]);

  // Nearest station + arrivals (simulated ETAs based on frequency)
  const arrivals: Arrival[] = useMemo(() => {
    const confirmedStations = stations.filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lng));
    if (!confirmedStations.length || !routes.length) return [];
    const sorted = [...confirmedStations].sort(
      (a, b) =>
        Math.hypot(a.lat - TWIN_CITIES_CENTER[0], a.lng - TWIN_CITIES_CENTER[1]) -
        Math.hypot(b.lat - TWIN_CITIES_CENTER[0], b.lng - TWIN_CITIES_CENTER[1])
    );
    const nearest = sorted[0];
    if (!nearest) return [];
    const stationRoutes = routeStations
      .filter((rs) => rs.station_id === nearest.id)
      .map((rs) => rs.route);
    const unique = Array.from(new Map(stationRoutes.map((r) => [r.id, r])).values()).slice(0, 3);
    return unique.map((route, i) => {
      const eta = Math.max(1, Math.round((route.frequency_peak_min / 2) * (1 - i * 0.2)));
      const status: Arrival['status'] = i === 2 ? 'Delayed' : i === 0 ? 'On Time' : 'Scheduled';
      return {
        stationName: nearest.name,
        routeCode: route.code,
        routeName: route.name,
        routeColor: route.color,
        etaMin: eta,
        status,
        vehicleType: route.type === 'brt' ? 'train' : 'directions_bus',
      };
    });
  }, [stations, routes, routeStations]);

  const nearestStation = useMemo(() => {
    const confirmedStations = stations.filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lng));
    if (!confirmedStations.length) return null;
    return [...confirmedStations].sort(
      (a, b) =>
        Math.hypot(a.lat - TWIN_CITIES_CENTER[0], a.lng - TWIN_CITIES_CENTER[1]) -
        Math.hypot(b.lat - TWIN_CITIES_CENTER[0], b.lng - TWIN_CITIES_CENTER[1])
    )[0];
  }, [stations]);

  const filteredArrivals = useMemo(
    () => (search ? arrivals.filter((a) => a.stationName.toLowerCase().includes(search.toLowerCase()) || a.routeName.toLowerCase().includes(search.toLowerCase())) : arrivals),
    [arrivals, search]
  );

  if (loading) {
    return (
      <main className="md:ml-64 h-screen flex items-center justify-center bg-surface-container-low">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
          <p className="text-body-md font-body-md text-on-surface-variant">Loading live network...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="md:ml-64 h-screen flex items-center justify-center bg-surface-container-low">
        <div className="flex flex-col items-center gap-md text-center px-lg">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <p className="text-body-md font-body-md text-on-surface-variant">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-full md:ml-64 relative">
      <style>{`@keyframes rahnuma-pulse{0%{box-shadow:0 0 0 0 rgba(50,106,64,0.5)}70%{box-shadow:0 0 0 12px rgba(50,106,64,0)}100%{box-shadow:0 0 0 0 rgba(50,106,64,0)}}`}</style>
      <MapContainer center={TWIN_CITIES_CENTER} zoom={12} zoomControl={false} className="absolute inset-0 z-0 h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Only the user-supplied MetroJSON geometry is drawn on this map. */}
        {METRO_GEO_LINES.filter(() => activeFilter === 'all' || activeFilter === 'brt').map((line) => (
          <Polyline key={line.name} positions={line.points} pathOptions={{ color: line.color, weight: 6, opacity: 0.9 }}>
            <Popup>{line.name} - supplied route geometry</Popup>
          </Polyline>
        ))}

        {false && visibleStations.map((s) => {
          const isTransfer = s.type === 'transfer';
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={makeStationIcon('#00290f', isTransfer)}>
              <Popup>
                <div className="font-sans">
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-gray-600">{s.city} · {s.type.toUpperCase()}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {false && liveVehicles.map((v) => (
          <Marker key={v.route.id} position={[v.lat, v.lng]} icon={makeLiveIcon(v.route.color)}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-sm">{v.route.code} · {v.route.name}</p>
                <p className="text-xs text-gray-600">Heading: {v.heading}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <Recenter center={recenterTarget} />
      </MapContainer>

      {/* Float Controls */}
      <div className="absolute top-md md:top-lg right-md md:right-lg z-[1000] flex flex-col gap-sm">
        <div className="glass-panel p-xs rounded-xl shadow-lg border border-outline-variant/30 flex flex-col items-center">
          <button
            onClick={() => {
              const map = L as unknown as { _maps?: L.Map };
              void map;
            }}
            className="p-sm text-primary hover:bg-primary-container hover:text-white rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className="w-8 h-[1px] bg-outline-variant/30 my-xs" />
          <button className="p-sm text-primary hover:bg-primary-container hover:text-white rounded-lg transition-all">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button
          onClick={() => setRecenterTarget([TWIN_CITIES_CENTER[0] + (Math.random() - 0.5) * 0.001, TWIN_CITIES_CENTER[1] + (Math.random() - 0.5) * 0.001])}
          className="glass-panel p-md rounded-xl shadow-lg border border-outline-variant/30 text-primary hover:bg-primary-container hover:text-white transition-all"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="absolute bottom-24 md:bottom-lg left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-sm glass-panel p-sm rounded-2xl shadow-xl border border-outline-variant/20 max-w-[calc(100%-40px)] overflow-x-auto">
        {filterChips.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-md py-sm rounded-full text-label-md font-label-md flex items-center gap-xs transition-colors whitespace-nowrap ${
              activeFilter === filter.id
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Live Arrivals Sidebar */}
      <aside className="absolute top-auto md:top-lg bottom-20 md:bottom-lg left-0 md:left-lg h-[42vh] md:h-auto w-full md:w-80 z-[1000]">
        <div className="flex flex-col h-full glass-panel rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden">
          <div className="p-md bg-primary-container text-on-primary-container">
            <h2 className="text-title-md font-title-md text-white mb-md">Live Arrivals</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-tertiary-fixed-dim">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a station..."
                className="w-full bg-white/10 border-none rounded-xl pl-11 py-sm text-label-md font-label-md text-white placeholder-tertiary-fixed-dim focus:ring-2 focus:ring-secondary-container outline-none"
              />
            </div>
          </div>

          <div className="p-md flex-1 overflow-y-auto space-y-md">
            {nearestStation && (
              <div>
                <p className="text-label-sm font-label-sm text-outline uppercase tracking-widest mb-sm">Nearest Station</p>
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shrink-0">
                    <span className="material-symbols-outlined text-secondary-fixed">location_on</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-title-md font-title-md text-primary leading-tight">{nearestStation.name}</h3>
                    <p className="text-label-md font-label-md text-outline">{nearestStation.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-on-primary-container font-bold bg-primary-fixed-dim/20 px-xs rounded">
                      {Math.round(Math.hypot(nearestStation.lat - TWIN_CITIES_CENTER[0], nearestStation.lng - TWIN_CITIES_CENTER[1]) * 111000)}m
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-sm">
              {filteredArrivals.map((a) => (
                <div
                  key={a.routeCode + a.stationName}
                  className="p-md bg-surface border border-outline-variant/30 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow group cursor-pointer"
                >
                  <div className="flex items-center gap-md">
                    <div className="relative">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">{a.vehicleType}</span>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white" style={{ background: a.routeColor }} />
                    </div>
                    <div>
                      <p className="text-label-md font-label-md font-bold text-primary">{a.stationName}</p>
                      <p className="text-[12px] text-outline">{a.routeCode} · {a.routeName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-title-md font-title-md text-primary">{a.etaMin} min</p>
                    <p className={`text-[10px] font-bold ${a.status === 'Delayed' ? 'text-error' : 'text-on-primary-container'}`}>{a.status}</p>
                  </div>
                </div>
              ))}
              {filteredArrivals.length === 0 && (
                <p className="text-label-md font-label-md text-outline text-center py-md">No arrivals found.</p>
              )}
            </div>

            <button className="w-full py-md text-primary font-bold border-2 border-primary/10 rounded-2xl hover:bg-primary/5 transition-colors">
              View Full Schedule
            </button>
          </div>
        </div>
      </aside>

      {/* Status Micro-Panel */}
      <div className="absolute top-md md:top-lg left-[21rem] hidden xl:flex glass-panel p-sm px-md rounded-full shadow-lg border border-outline-variant/20 items-center gap-md z-[1000]">
        <div className="flex items-center gap-sm pr-md border-r border-outline-variant/30">
          <span className="material-symbols-outlined text-secondary">wb_sunny</span>
          <span className="text-label-md font-label-md font-bold">32°C</span>
        </div>
        <div className="flex items-center gap-sm">
          <div className="w-2 h-2 rounded-full bg-on-primary-container animate-pulse" />
          <span className="text-label-md font-label-md text-primary">{routes.length} Routes Live</span>
        </div>
      </div>
    </main>
  );
}
