import { useEffect, useMemo, useState } from 'react';
import { fetchRoutes, fetchStations, fetchRouteStations, type TransitRoute, type TransitStation, type RouteStation } from '@/lib/supabase';
import { planJourney, type Journey } from '@/data/transitData';

const MAP_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFbSEKJDRMU4cgjTQOg6A7bn8IhLu7Y7-N_0i6H2W4q8w08mNOAFRKwTJjywpIQAbAWyPEe7mzxlIuvfsVqkGblYVHzQloHbNv9OZmATazHui_HKXVFnWiIg7cdsPCHsRLPnf0_wwIyye3VR6838NuqU3eALFq8VvXidlCYoXDQNRNIsawtTFu_sJCotpKizn_A9fULvx612F1TxqX64ZeIFbzSLYOUDZ_067pgwV23jf9v4SRaXZu3w';

const transportModeIcons: Record<string, string> = {
  brt: 'directions_bus',
  islamabad_feeder: 'train',
  rawalpindi_feeder: 'alt_route',
};

const transportModeLabels: Record<string, string> = {
  brt: 'BRT Metro',
  islamabad_feeder: 'Islamabad Feeders',
  rawalpindi_feeder: 'Rawalpindi Feeders',
};

export default function HomePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [stations, setStations] = useState<TransitStation[]>([]);
  const [routeStations, setRouteStations] = useState<RouteStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [journeyMessage, setJourneyMessage] = useState<string | null>(null);

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load transit data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
    setJourney(null);
    setJourneyMessage(null);
  };

  const handleShowRoutes = () => {
    if (!from || !to || from === to) {
      setJourney(null);
      setJourneyMessage('Choose two different stations to see the shortest route.');
      return;
    }
    const result = planJourney(from, to);
    setJourney(result);
    setJourneyMessage(result ? null : 'No connected bus route was found between these stations.');
  };

  const stationOptions = useMemo(
    () => [...stations].sort((a, b) => a.name.localeCompare(b.name)),
    [stations]
  );

  const findNearestStation = (latitude: number, longitude: number) => {
    if (stations.length === 0) return;

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const distanceInKm = (station: TransitStation) => {
      const earthRadiusKm = 6371;
      const deltaLat = toRadians(station.lat - latitude);
      const deltaLng = toRadians(station.lng - longitude);
      const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(toRadians(latitude)) * Math.cos(toRadians(station.lat))
        * Math.sin(deltaLng / 2) ** 2;
      return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const nearest = stations.reduce((closest, station) => (
      distanceInKm(station) < distanceInKm(closest) ? station : closest
    ));
    const distance = distanceInKm(nearest);
    setFrom(nearest.name);
    setLocationStatus(`Nearest station: ${nearest.name} (${distance.toFixed(1)} km away)`);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser. Please choose a station.');
      return;
    }
    setLocationStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => findNearestStation(coords.latitude, coords.longitude),
      () => setLocationStatus('We could not access your location. Please choose a station.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Frequent destinations: top transfer/BRT stations by number of routes passing through
  const frequentDestinations = useMemo(() => {
    const counts = new Map<string, { station: TransitStation; routeCount: number }>();
    for (const rs of routeStations) {
      const existing = counts.get(rs.station_id);
      if (existing) existing.routeCount += 1;
      else counts.set(rs.station_id, { station: rs.station, routeCount: 1 });
    }
    return Array.from(counts.values())
      .sort((a, b) => b.routeCount - a.routeCount)
      .slice(0, 3)
      .map(({ station }) => ({
        icon: station.type === 'transfer' ? 'apartment' : station.type === 'brt' ? 'business' : 'shopping_bag',
        name: station.name,
        sub: station.city,
      }));
  }, [routeStations]);

  // Recent journeys: simulate from first few routes
  const recentJourneys = useMemo(() => {
    return routes.slice(0, 2).map((route) => ({
      icon: route.type === 'brt' ? 'directions_bus' : 'train',
      route: `${route.from_terminal} → ${route.to_terminal}`,
      time: `${route.first_service} – ${route.last_service}`,
      fare: route.type === 'brt' ? 'Rs. 30' : 'Rs. 20',
    }));
  }, [routes]);

  const transportModes = useMemo(() => {
    const modes = ['brt', 'islamabad_feeder', 'rawalpindi_feeder'];
    return modes.map((type) => ({
      icon: transportModeIcons[type] ?? 'directions_bus',
      label: transportModeLabels[type] ?? type,
      count: routes.filter((r) => r.type === type).length,
    }));
  }, [routes]);

  if (loading) {
    return (
      <main className="md:ml-64 pb-12 px-container-margin pt-lg">
        <div className="flex items-center justify-center py-xl">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="md:ml-64 pb-12 px-container-margin pt-lg">
        <div className="flex flex-col items-center gap-md py-xl text-center">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <p className="text-body-md font-body-md text-on-surface-variant">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="md:ml-64 pb-12 px-container-margin pt-lg">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Journey Planner */}
        <section className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-lg shadow-sm border border-outline-variant/10 flex flex-col relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="mb-lg relative">
            <h1 className="text-headline-lg font-headline-lg text-primary mb-xs">Where to?</h1>
            <p className="text-body-md font-body-md text-on-surface-variant opacity-80">Plan your transit across the twin cities.</p>
          </div>

          <div className="flex flex-col gap-md relative">
            <div className="space-y-sm relative">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">location_on</span>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="Where from"
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/30 rounded-xl py-4 pl-12 pr-10 text-body-md font-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="">Where from?</option>
                  {stationOptions.map((station) => (
                    <option key={station.id} value={station.name}>{station.name} — {station.city}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">expand_more</span>
              </div>
              <div className="absolute left-7 top-[52px] w-[1px] h-8 bg-outline-variant/50 z-10" />
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary">my_location</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="Where to"
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/30 rounded-xl py-4 pl-12 pr-10 text-body-md font-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="">Where to?</option>
                  {stationOptions.map((station) => (
                    <option key={station.id} value={station.name} disabled={station.name === from}>{station.name} — {station.city}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">expand_more</span>
              </div>
            </div>
            <button
              onClick={handleSwap}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface p-2 rounded-full shadow-md border border-outline-variant/20 text-primary hover:rotate-180 transition-transform duration-500 z-20"
            >
              <span className="material-symbols-outlined">swap_vert</span>
            </button>
          </div>

          <div className="mt-md relative flex flex-wrap items-center gap-sm">
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-label-md font-label-md text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">my_location</span>
              Use my location
            </button>
            {locationStatus && <p className="text-label-sm font-label-sm text-on-surface-variant">{locationStatus}</p>}
          </div>

          <div className="mt-lg grid grid-cols-1 sm:grid-cols-3 gap-md">
            {transportModes.map((mode) => (
              <button
                key={mode.label}
                className="flex flex-col items-center justify-center p-md bg-surface border border-outline-variant/10 rounded-2xl hover:bg-primary group transition-all duration-300 shadow-sm"
              >
                <span className="material-symbols-outlined text-primary group-hover:text-secondary-fixed text-[32px] mb-2">{mode.icon}</span>
                <span className="text-label-md font-label-md font-bold text-on-surface group-hover:text-white">{mode.label}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant opacity-60 group-hover:text-secondary-fixed">{mode.count} routes</span>
              </button>
            ))}
          </div>

          <button onClick={handleShowRoutes} className="mt-lg w-full bg-primary text-on-primary py-4 rounded-xl text-title-md font-title-md font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
            Show Routes
          </button>
          {(journey || journeyMessage) && (
            <div className="mt-md rounded-2xl border border-outline-variant/20 bg-surface-container-low p-md relative">
              {journey ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-sm mb-sm">
                    <p className="text-title-sm font-title-sm text-primary">Shortest journey</p>
                    <p className="text-label-md font-label-md text-on-surface-variant">{journey.legs.length} bus{journey.legs.length !== 1 ? 'es' : ''} · {journey.transfers} transfer{journey.transfers !== 1 ? 's' : ''} · {journey.totalStops} stops · Rs. {journey.fare}</p>
                  </div>
                  <div className="space-y-sm">
                    {journey.legs.map((leg, index) => (
                      <div key={`${leg.route.code}-${index}`} className="flex gap-sm text-body-sm font-body-sm text-on-surface-variant">
                        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-label-sm font-label-sm text-on-primary">{leg.route.code}</span>
                        <p>Take {leg.route.name} from <strong className="text-on-surface">{leg.boardAt}</strong> to <strong className="text-on-surface">{leg.alightAt}</strong> ({leg.stops.length - 1} stops).</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-body-sm font-body-sm text-error">{journeyMessage}</p>}
            </div>
          )}
        </section>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          {/* Map Card */}
          <div className="h-48 rounded-3xl overflow-hidden relative shadow-sm border border-outline-variant/20 group">
            <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url("${MAP_URL}")` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent z-10" />
            <div className="absolute bottom-4 left-4 z-20 flex flex-col">
              <span className="text-label-sm font-label-sm text-secondary-fixed uppercase tracking-widest">Live View</span>
              <span className="text-title-md font-title-md text-white">Network Map</span>
            </div>
            <button className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
          </div>

          {/* Frequent Destinations */}
          <section className="bg-surface-container-low rounded-3xl p-lg flex-grow border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-title-md font-title-md text-primary">Frequent</h3>
              <span className="material-symbols-outlined text-outline">history</span>
            </div>
            <div className="space-y-sm">
              {frequentDestinations.map((dest) => (
                <button
                  key={dest.name}
                  className="w-full flex items-center gap-md p-md bg-white rounded-2xl hover:bg-secondary-fixed/10 transition-colors border border-outline-variant/5 shadow-sm group"
                >
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">{dest.icon}</span>
                  </div>
                  <div className="text-left flex-grow">
                    <p className="text-label-md font-label-md font-bold text-on-surface">{dest.name}</p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant opacity-60">{dest.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
              ))}
              {frequentDestinations.length === 0 && (
                <p className="text-label-md font-label-md text-outline text-center py-md">No destinations yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Insights Section */}
      <section className="mt-xl grid grid-cols-1 gap-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {/* Recent Journeys */}
          <div className="bg-surface-container-low rounded-3xl p-lg border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-title-md font-title-md text-primary">Recent Journeys</h3>
              <button className="text-primary text-label-md font-label-md hover:underline">View All</button>
            </div>
            <div className="space-y-sm">
              {recentJourneys.map((journey) => (
                <div key={journey.route} className="flex items-center gap-md p-md bg-white rounded-2xl border border-outline-variant/5">
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{journey.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-label-md font-label-md font-bold">{journey.route}</p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant opacity-60">{journey.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-label-md font-label-md font-bold text-primary">{journey.fare}</p>
                  </div>
                </div>
              ))}
              {recentJourneys.length === 0 && (
                <p className="text-label-md font-label-md text-outline text-center py-md">No recent journeys.</p>
              )}
            </div>
          </div>

          {/* Your Impact */}
          <div className="bg-primary text-white rounded-3xl p-lg shadow-lg relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-md mb-lg">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary-fixed">eco</span>
                </div>
                <div>
                  <h3 className="text-title-md font-title-md">Your Impact</h3>
                  <p className="text-label-sm font-label-sm text-tertiary-fixed-dim">Eco-Warrior Level</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="bg-white/10 p-md rounded-2xl">
                  <p className="text-[24px] font-bold text-secondary-fixed">12.4kg</p>
                  <p className="text-label-sm font-label-sm opacity-80">CO2 Saved</p>
                </div>
                <div className="bg-white/10 p-md rounded-2xl">
                  <p className="text-[24px] font-bold text-secondary-fixed">240</p>
                  <p className="text-label-sm font-label-sm opacity-80">Green Points</p>
                </div>
              </div>
              <p className="mt-lg text-label-sm font-label-sm opacity-70 italic">"You've saved the equivalent of 2 trees this month!"</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
