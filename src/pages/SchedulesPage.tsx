import { useEffect, useMemo, useState } from 'react';
import { fetchRoutes, fetchStations, fetchRouteStations, type TransitRoute, type TransitStation, type RouteStation } from '@/lib/supabase';
import { calculateFare, STATION_ROUTES, planJourney, type RouteDef, type Journey } from '@/data/transitData';

const typeBadgeClass: Record<string, string> = {
  brt: 'bg-secondary-fixed text-on-secondary-fixed',
  islamabad_feeder: 'bg-primary text-secondary-fixed',
  rawalpindi_feeder: 'bg-outline text-surface',
};

const statusForRoute = (route: TransitRoute): { label: string; cls: string; dot: string } => {
  const hash = route.code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (hash % 7 === 0) return { label: 'Delayed', cls: 'text-error', dot: 'bg-error' };
  if (hash % 3 === 0) return { label: 'On-Schedule', cls: 'text-on-tertiary-fixed-variant', dot: 'bg-on-tertiary-container' };
  return { label: 'Active', cls: 'text-on-tertiary-fixed-variant', dot: 'bg-on-tertiary-container animate-pulse' };
};

const fareForRoute = (route: TransitRoute): string => `Rs. ${route.fare}`;

interface FareResult {
  fare: number;
  journey: Journey | null;
  fromName: string;
  toName: string;
}

export default function SchedulesPage({ routeTypeFilter }: { routeTypeFilter?: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fareResult, setFareResult] = useState<FareResult | null>(null);
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [stations, setStations] = useState<TransitStation[]>([]);
  const [routeStations, setRouteStations] = useState<RouteStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load schedules');
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
    setFareResult(null);
  };

  const handleCalc = () => {
    if (!from || !to || from === to) {
      setFareResult(null);
      return;
    }
    const journey = planJourney(from, to);
    setFareResult({ fare: journey?.fare ?? 0, journey, fromName: from, toName: to });
  };

  const stationCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rs of routeStations) counts.set(rs.route_id, (counts.get(rs.route_id) ?? 0) + 1);
    return counts;
  }, [routeStations]);

  const filteredStations = useMemo(
    () => {
      const list = stations.map((s) => s.name).sort();
      if (!search) return list;
      const lower = search.toLowerCase();
      return list.filter((name) => name.toLowerCase().includes(lower));
    },
    [stations, search]
  );

  const filteredRoutes = useMemo(
    () => {
      const lower = search.toLowerCase();
      return routes.filter(
        (r) =>
          (!routeTypeFilter || r.type === routeTypeFilter) &&
          r.name.toLowerCase().includes(lower) ||
          r.from_terminal.toLowerCase().includes(lower) ||
          r.to_terminal.toLowerCase().includes(lower) ||
          r.code.toLowerCase().includes(lower)
      );
    },
    [routes, search, routeTypeFilter]
  );

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
      <section className="mb-lg">
        <h1 className="text-headline-lg font-headline-lg text-primary mb-xs">Transit Schedules</h1>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl">Official routes, timings, and fare information for Islamabad and Rawalpindi Metro and Bus networks.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Fare Calculator + Downloads */}
        <section className="lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/20 h-fit shadow-sm">
            <h3 className="text-title-md font-title-md text-primary flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined">calculate</span>
              Fare Calculator
            </h3>
            <div className="space-y-md">
              <div className="relative">
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-xs ml-1">Starting Station</label>
                <button
                  onClick={() => { setFromOpen(!fromOpen); setToOpen(false); }}
                  className="w-full flex items-center bg-surface-container-low rounded-lg border border-outline-variant/40 px-md py-sm focus:border-primary transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-primary text-[20px] mr-sm">location_on</span>
                  <span className={`flex-1 text-body-md font-body-md ${from ? 'text-on-surface' : 'text-outline'}`}>{from || 'Select starting station'}</span>
                  <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
                </button>
                {fromOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-lg max-h-60 overflow-y-auto">
                    {allStationNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => { setFrom(name); setFromOpen(false); setFareResult(null); }}
                        className="w-full text-left px-md py-sm hover:bg-surface-container-low text-body-md font-body-md text-on-surface border-b border-outline-variant/10 last:border-0"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <button onClick={handleSwap} className="bg-primary text-secondary-fixed p-xs rounded-full shadow-md hover:rotate-180 transition-transform duration-500">
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>
              <div className="relative">
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-xs ml-1">Destination</label>
                <button
                  onClick={() => { setToOpen(!toOpen); setFromOpen(false); }}
                  className="w-full flex items-center bg-surface-container-low rounded-lg border border-outline-variant/40 px-md py-sm focus:border-primary transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-secondary text-[20px] mr-sm">flag</span>
                  <span className={`flex-1 text-body-md font-body-md ${to ? 'text-on-surface' : 'text-outline'}`}>{to || 'Select destination'}</span>
                  <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
                </button>
                {toOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-lg max-h-60 overflow-y-auto">
                    {allStationNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => { setTo(name); setToOpen(false); setFareResult(null); }}
                        className="w-full text-left px-md py-sm hover:bg-surface-container-low text-body-md font-body-md text-on-surface border-b border-outline-variant/10 last:border-0"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-lg pt-lg border-t border-outline-variant/20">
                {fareResult ? (
                  <div className="mb-md p-md bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <div className="flex justify-between items-center mb-sm">
                      <span className="text-label-md font-label-md text-on-surface-variant">Estimated Fare</span>
                      <span className="text-headline-lg font-headline-lg text-secondary-fixed-dim bg-primary px-md py-xs rounded-lg shadow-inner">Rs. {fareResult.fare}</span>
                    </div>
                    <div className="text-body-sm font-body-sm text-on-surface-variant">
                      {fareResult.journey ? (
                        <div className="space-y-xs">
                          <div>{fareResult.journey.legs.length} bus{fareResult.journey.legs.length > 1 ? 'es' : ''}, {fareResult.journey.transfers} transfer{fareResult.journey.transfers !== 1 ? 's' : ''}.</div>
                          {fareResult.journey.legs.map((leg, i) => (
                            <div key={i} className="flex gap-xs">
                              <span className="font-semibold text-primary shrink-0">{leg.route.code}</span>
                              <span>{leg.boardAt} → {leg.alightAt} ({leg.stops.length} stops)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>No connection found. Try a major BRT transfer station.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-md">
                    <span className="text-label-md font-label-md text-on-surface-variant">Estimated Fare</span>
                    <span className="text-headline-lg font-headline-lg text-outline">Rs. --</span>
                  </div>
                )}
                <button onClick={handleCalc} disabled={!from || !to || from === to} className="w-full bg-primary text-on-primary py-md rounded-lg text-label-md font-label-md hover:bg-primary-container transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  Calculate Detailed Fare
                </button>
              </div>
            </div>
          </div>

          {/* Download Hub */}
          <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/20 shadow-sm">
            <h3 className="text-title-md font-title-md text-primary mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined">cloud_download</span>
              Offline Access
            </h3>
            <div className="space-y-sm">
              <a href="/data/transit-routes/Transit_Routes_-_BRT.pdf" download className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer transition-colors group">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                  <span className="text-body-md font-body-md">BRT Routes PDF</span>
                </div>
                <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">download</span>
              </a>
              <a href="/data/transit-routes/Transit_Routes_-_Islamabad_Feeder.pdf" download className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer transition-colors group">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                  <span className="text-body-md font-body-md">Islamabad Feeder Routes PDF</span>
                </div>
                <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">download</span>
              </a>
              <a href="/data/transit-routes/Transit_Routes_-_Rawalpindi_Feeder.pdf" download className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg cursor-pointer transition-colors group">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                  <span className="text-body-md font-body-md">Rawalpindi Feeder Routes PDF</span>
                </div>
                <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">download</span>
              </a>
            </div>
          </div>
        </section>

        {/* Route List Table */}
        <section className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col h-full shadow-sm">
            {/* Search & Filter */}
            <div className="p-lg bg-surface-container-low border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-md">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search route by number or station..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-full py-sm pl-10 pr-md text-body-md font-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-sm self-end">
                <button className="bg-surface-container-highest px-md py-sm rounded-lg text-label-md font-label-md flex items-center gap-xs hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Filter
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-md px-lg py-md bg-surface-container-high border-b border-outline-variant/20 text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider">
              <div className="col-span-2">Route #</div>
              <div className="col-span-4">Service Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Fare</div>
            </div>

            {/* Route List */}
            <div className="flex-grow overflow-y-auto max-h-[600px]">
              {filteredRoutes.map((route) => {
                const status = statusForRoute(route);
                const stops = stationCount.get(route.id) ?? 0;
                return (
                  <>
                  <button key={route.id} onClick={() => setSelectedRouteId(selectedRouteId === route.id ? null : route.id)} className="w-full text-left grid grid-cols-12 gap-md px-lg py-md border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors items-center">
                    <div className="col-span-3 sm:col-span-2">
                      <span className={`${typeBadgeClass[route.type] ?? 'bg-outline text-surface'} font-bold px-md py-xs rounded-full shadow-sm text-sm`}>{route.code}</span>
                    </div>
                    <div className="col-span-9 sm:col-span-4 flex flex-col">
                      <span className="text-body-md font-body-md font-semibold text-primary">{route.name}</span>
                      <span className="text-label-sm font-label-sm text-outline">{route.from_terminal} — {route.to_terminal}</span>
                      <span className="text-[11px] text-outline-variant">{stops} stops · every {route.frequency_peak_min}–{route.frequency_offpeak_min} min</span>
                    </div>
                    <div className="hidden sm:col-span-2 flex items-center gap-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span className="text-body-md font-body-md">{route.first_service.slice(0, 5)}</span>
                    </div>
                    <div className="col-span-6 sm:col-span-2 flex items-center gap-xs">
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <span className={`text-label-md font-label-md ${status.cls}`}>{status.label}</span>
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-right">
                      <span className="text-title-md font-title-md text-secondary-fixed-variant">{fareForRoute(route)}</span>
                    </div>
                  </button>
                  {selectedRouteId === route.id && (
                    <div className="px-lg pb-md bg-surface-container-low text-body-sm text-on-surface-variant">
                      <p className="font-semibold text-primary mb-xs">Stops on {route.code}</p>
                      <p>{routeStations.filter((item) => item.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order).map((item) => item.station.name).join(' → ') || 'Station details are unavailable.'}</p>
                    </div>
                  )}
                  </>
                );
              })}
              {filteredRoutes.length === 0 && (
                <div className="p-lg text-center text-on-surface-variant">No routes found.</div>
              )}
            </div>

            <div className="p-md bg-surface-container-low border-t border-outline-variant/20 text-center">
              <button className="text-label-md font-label-md text-primary hover:underline flex items-center gap-xs mx-auto">
                View All {routes.length} Transit Routes
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const allStationNames = Object.keys(STATION_ROUTES).sort();
