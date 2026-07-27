import { useState, useRef, useEffect } from 'react';
import { ALL_ROUTES, ALL_STATIONS, STATION_ROUTES, planJourney, describeJourney, buildTransitSummary, type RouteDef } from '@/data/transitData';
import { supabase } from '@/lib/supabase';

interface Message {
  id: number;
  text: string;
  isUser: false;
}

interface UserMessage {
  id: number;
  text: string;
  isUser: true;
}

type ChatMessage = Message | UserMessage;

const AI_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6onKgyzSSjPBW24l-n4JXEw4tGFwjHzbj7ZSW1HDFlfjkXkvXkn79b6J3FS2j0Rst9h4C1PUsclgAQ50EeiouLmH90LZtx_XUclsMkDtGPKt7N5P3fBmV9UVpqXkpQwKUy_i_bHNeJTSZB0lN8qC4jqqGcq6clRxbY7R67OKe3-5xE2F0uW_8OrrQrie2axqhbxltdC-ZFALi7rdxz6Ad0Qxv5I93uaTwThCGp6-GYNTPFT7yLvKkB4HszXKgq2BEB3sIKFqyMVE4';

const starters = [
  'How do I get from Saddar to Bhara Kahu?',
  "What's the fare from Faizabad to Pak Secretariat?",
  'Which routes pass through PIMS?',
  'Tell me about the Red Line',
];

const allStationNames = Object.keys(STATION_ROUTES).sort();

function findStationInQuery(q: string): string | null {
  const lower = q.toLowerCase();
  // Exact match first (longest names first to avoid partial overlap)
  const sorted = [...allStationNames].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  // Partial/fuzzy match
  for (const name of sorted) {
    const tokens = name.toLowerCase().split(/[\s-]+/);
    if (tokens.length > 1 && tokens.every((t) => lower.includes(t))) return name;
  }
  return null;
}

// Find a "from X to Y" pair in the query, returning both station names.
function findFromToPair(q: string): { from: string; to: string } | null {
  const lower = q.toLowerCase();
  const sorted = [...allStationNames].sort((a, b) => b.length - a.length);
  // Look for "from <station> to <station>"
  const fromIdx = lower.indexOf('from ');
  const toIdx = lower.indexOf(' to ');
  if (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) {
    const fromSegment = lower.slice(fromIdx, toIdx);
    const toSegment = lower.slice(toIdx);
    const from = sorted.find((s) => fromSegment.includes(s.toLowerCase()));
    const to = sorted.find((s) => toSegment.includes(s.toLowerCase()) && s !== from);
    if (from && to) return { from, to };
  }
  // Pattern: "X to Y" without explicit "from"
  if (toIdx !== -1) {
    const before = lower.slice(0, toIdx);
    const after = lower.slice(toIdx);
    const from = sorted.find((s) => before.endsWith(s.toLowerCase()) || before.includes(` ${s.toLowerCase()}`));
    const to = sorted.find((s) => after.includes(s.toLowerCase()) && s !== from);
    if (from && to) return { from, to };
  }
  return null;
}

function findRouteInQuery(q: string): RouteDef | null {
  const lower = q.toLowerCase();
  for (const r of ALL_ROUTES) {
    if (lower.includes(r.code.toLowerCase())) return r;
    if (lower.includes(r.name.toLowerCase())) return r;
  }
  return null;
}

function routeSummary(r: RouteDef): string {
  return `${r.code} (${r.name}): ${r.from_terminal} → ${r.to_terminal}. Fare Rs.${r.fare}. Service ${r.first_service}–${r.last_service}, every ${r.frequency_peak_min}–${r.frequency_offpeak_min} min. ${r.stations.length} stops: ${r.stations.join(', ')}.`;
}

function getResponse(query: string): string {
  const q = query.toLowerCase();
  const pair = findFromToPair(query);

  // Fare calculation — uses multi-hop planner for accuracy
  if (q.includes('fare') || q.includes('cost') || q.includes('price') || q.includes('ticket')) {
    if (pair) {
      const journey = planJourney(pair.from, pair.to);
      if (journey) {
        const direct = journey.transfers === 0;
        const path = direct
          ? `Take ${journey.legs[0].route.code} (${journey.legs[0].route.name}) directly.`
          : journey.legs.map((l, i) => `${i + 1}. ${l.route.code} from ${l.boardAt} to ${l.alightAt}`).join(' → ');
        return `The fare from ${pair.from} to ${pair.to} is Rs.${journey.fare} (${journey.legs.length} bus${journey.legs.length > 1 ? 'es' : ''}, ${journey.transfers} transfer${journey.transfers !== 1 ? 's' : ''}). Route: ${path}`;
      }
      return `I couldn't find a connection between ${pair.from} and ${pair.to}. Try a major BRT transfer point like Faizabad, Pak Secretariat, or PIMS.`;
    }
  }

  // Check an origin/destination request before a single-station lookup.
  if (pair && (q.includes('how do i get') || q.includes('how to get') || q.includes('how to reach') || q.includes('how do i reach') || q.includes('get from') || (q.includes('from') && q.includes('to')))) {
    return describeJourney(planJourney(pair.from, pair.to));
  }

  // Route info
  const route = findRouteInQuery(q);
  if (route) {
    return routeSummary(route);
  }

  // Station info / which routes pass
  const station = findStationInQuery(q);
  if (station) {
    const routes = STATION_ROUTES[station] ?? [];
    if (routes.length > 0) {
      const list = routes.map((r) => `${r.code} (${r.name})`).join(', ');
      return `${station} is served by ${routes.length} route${routes.length > 1 ? 's' : ''}: ${list}. ` +
        routes.map((r) => `On ${r.code}, it runs ${r.first_service}–${r.last_service} (fare Rs.${r.fare}).`).join(' ');
    }
  }

  // How to get / route between two stations — multi-hop journey planner
  if (q.includes('how do i get') || q.includes('how to get') || q.includes('how to reach') || q.includes('how do i reach') || q.includes('get from') || q.includes('from') && q.includes('to') && (q.includes('bus') || q.includes('route') || q.includes('go'))) {
    if (pair) {
      return describeJourney(planJourney(pair.from, pair.to));
    }
    // Single destination, no origin given
    const dest = findStationInQuery(q);
    if (dest) {
      const routes = STATION_ROUTES[dest] ?? [];
      if (routes.length > 0) {
        return `To reach ${dest}, you can use ${routes.map((r) => r.code).join(' or ')}. ` +
          routes.map((r) => `${r.code} runs from ${r.from_terminal} to ${r.to_terminal} (${r.first_service}–${r.last_service}, Rs.${r.fare}).`).join(' ');
      }
    }
  }

  // Schedule query
  if (q.includes('schedule') || q.includes('timing') || q.includes('time') || q.includes('when')) {
    const station = findStationInQuery(q);
    if (station) {
      const routes = STATION_ROUTES[station] ?? [];
      if (routes.length > 0) {
        return `Buses at ${station}: ` + routes.map((r) => `${r.code} runs ${r.first_service}–${r.last_service}, every ${r.frequency_peak_min}–${r.frequency_offpeak_min} min`).join('; ') + '.';
      }
    }
    return 'Service hours vary by line. Red Line: 05:30–23:00, Blue/Green: 06:00–22:30, Orange: 06:00–22:00, Feeders: 06:00–22:00. Ask about a specific station for details.';
  }

  // General network info
  if (q.includes('route') || q.includes('lines') || q.includes('network') || q.includes('overview')) {
    return `The Islamabad-Rawalpindi transit network has ${ALL_ROUTES.length} routes: 4 BRT lines (Red, Blue, Green, Orange) and 20 feeder routes (FR-1 to FR-10 for Islamabad, R-1 to R-10 for Rawalpindi). BRT fare is Rs.30, feeders Rs.20. Ask me about any route code or station name for details.`;
  }

  return "I can help with routes, fares, schedules, and station info across the Islamabad-Rawalpindi transit network. Try asking: 'Which routes pass through Faizabad?' or 'Fare from Saddar to Pak Secretariat?'";
}

function distanceKm(lat: number, lng: number, station: { lat: number; lng: number }): number {
  const r = (value: number) => value * Math.PI / 180;
  const dLat = r(station.lat - lat);
  const dLng = r(station.lng - lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat)) * Math.cos(r(station.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLocation(): Promise<GeolocationPosition | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }));
}

async function getAssistantResponse(query: string, location: GeolocationPosition | null = null): Promise<string> {
  const pair = findFromToPair(query);
  const destination = findStationInQuery(query);
  const isJourneyRequest = /how|reach|get|go|route/i.test(query);

  let routeContext = '';

  // Build real route data first (source of truth)
  if (!pair && destination && location) {
    const { latitude, longitude } = location.coords;

    const nearest = [...ALL_STATIONS].sort(
      (a, b) =>
        distanceKm(latitude, longitude, a) -
        distanceKm(latitude, longitude, b)
    )[0];

    let placeName = 'your current location';

    try {
      const placeResponse = await fetch(
        `/api/place?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`
      );
      const place = await placeResponse.json();
      placeName = place.name ?? placeName;
    } catch {
      // Ignore reverse geocoding failures
    }

    if (nearest) {
      routeContext = `
User location:
${placeName}

Nearest station:
${nearest.name}

Distance:
${distanceKm(latitude, longitude, nearest).toFixed(1)} km

Suggested route:
${describeJourney(planJourney(nearest.name, destination))}
`;
    }
  }

  // Ask Groq with route information included
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        routeContext,
        network: buildTransitSummary(),
      }),
    });

    const data = await response.json();

    if (response.ok && typeof data?.answer === 'string') {
      return data.answer;
    }
  } catch {
    // Continue to fallbacks
  }

  // Supabase Edge Function fallback
  try {
    const { data, error } = await supabase.functions.invoke('assistant', {
      body: {
        query,
        routeContext,
        network: buildTransitSummary(),
      },
    });

    if (!error && typeof data?.answer === 'string') {
      return data.answer;
    }
  } catch {
    // Continue to offline fallback
  }

  // If location was needed but unavailable
  if (!pair && destination && isJourneyRequest && !location) {
    return `To plan a trip to ${destination}, please allow location access. I will use your location to find the nearest station and the best route.`;
  }

  // Final offline fallback
  return getResponse(query);
}
export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      text: "Assalam-o-Alaikum! I can plan journeys, fares and station routes. For a destination without a starting point, I will ask for your location and choose the nearest station.",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [showStarters, setShowStarters] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: UserMessage = { id: Date.now(), text, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowStarters(false);

    const requiresLocation = !findFromToPair(text) && !!findStationInQuery(text) && /how|reach|get|go|route/i.test(text);
    const locationPromise = requiresLocation ? getLocation() : Promise.resolve(null);
    setTimeout(async () => {
      const aiMsg: Message = { id: Date.now() + 1, text: await getAssistantResponse(text, await locationPromise), isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  const handleSubmit = () => sendMessage(input);

  return (
    <main className="md:ml-64 h-screen flex flex-col relative">
      <header className="w-full bg-surface/80 backdrop-blur-md px-container-margin py-lg flex flex-col items-center justify-center text-center z-10">
        <h2 className="text-headline-lg font-headline-lg text-primary tracking-tight mb-xs">AI Journey Guide</h2>
        <p className="text-body-md font-body-md text-outline">Ask me anything about routes, fares, schedules, or stations in Islamabad &amp; Rawalpindi.</p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-container-margin py-lg md:py-xl flex flex-col gap-lg bg-surface-container-lowest">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-md max-w-2xl mx-auto w-full animate-fade-in ${msg.isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.isUser ? 'bg-secondary-container' : 'bg-primary-container'}`}>
              {msg.isUser ? (
                <span className="material-symbols-outlined text-on-secondary-container text-sm">person</span>
              ) : (
                <img src={AI_AVATAR_URL} alt="AI Assistant" className="w-full h-full object-contain rounded-full" />
              )}
            </div>
            <div className={`p-md md:p-lg rounded-2xl shadow-sm border border-outline-variant/10 max-w-[88%] md:max-w-[80%] ${msg.isUser ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'}`}>
              <p className="text-body-md font-body-md whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}

        {showStarters && (
          <div className="max-w-2xl mx-auto w-full flex flex-wrap gap-sm mt-lg">
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-md py-sm bg-surface-bright border border-outline-variant rounded-full text-label-md font-label-md text-on-surface-variant hover:bg-tertiary-fixed/30 hover:border-tertiary-fixed transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <footer className="w-full mb-20 md:mb-0 px-container-margin py-lg bg-surface-bright border-t border-outline-variant/10">
        <div className="max-w-3xl mx-auto flex items-center gap-md bg-surface-container p-sm rounded-2xl shadow-inner border border-outline-variant/5">
          <button className="p-md text-outline hover:text-primary transition-colors">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask about a route, station, or fare..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface placeholder:text-outline-variant outline-none"
          />
          <button onClick={handleSubmit} className="bg-primary text-secondary-fixed p-md rounded-xl hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <p className="text-center mt-sm text-[10px] text-outline text-label-sm font-label-sm uppercase tracking-widest opacity-60">Powered by live transit network data</p>
      </footer>
    </main>
  );
}
