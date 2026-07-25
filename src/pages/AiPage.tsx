import { useState, useRef, useEffect } from 'react';
import { ALL_ROUTES, STATION_ROUTES, calculateFare, planJourney, describeJourney, type RouteDef } from '@/data/transitData';

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

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      text: "Assalam-o-Alaikum! I am your Rah-Numa digital assistant for the Islamabad & Rawalpindi transit network. Ask me about routes, fares, schedules, or any station. I have the full Dec 2025 network data ready.",
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

    setTimeout(() => {
      const aiMsg: Message = { id: Date.now() + 1, text: getResponse(text), isUser: false };
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

      <div className="flex-1 overflow-y-auto px-container-margin py-xl flex flex-col gap-lg bg-surface-container-lowest">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-md max-w-2xl mx-auto w-full animate-fade-in ${msg.isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.isUser ? 'bg-secondary-container' : 'bg-primary-container'}`}>
              {msg.isUser ? (
                <span className="material-symbols-outlined text-on-secondary-container text-sm">person</span>
              ) : (
                <img src={AI_AVATAR_URL} alt="AI Assistant" className="w-full h-full object-contain rounded-full" />
              )}
            </div>
            <div className={`p-lg rounded-2xl shadow-sm border border-outline-variant/10 max-w-[80%] ${msg.isUser ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'}`}>
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

      <footer className="w-full px-container-margin py-lg bg-surface-bright border-t border-outline-variant/10">
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
