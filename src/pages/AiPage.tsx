import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const AI_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6onKgyzSSjPBW24l-n4JXEw4tGFwjHzbj7ZSW1HDFlfjkXkvXkn79b6J3FS2j0Rst9h4C1PUsclgAQ50EeiouLmH90LZtx_XUclsMkDtGPKt7N5P3fBmV9UVpqXkpQwKUy_i_bHNeJTSZB0lN8qC4jqqGcq6clRxbY7R67OKe3-5xE2F0uW_8OrrQrie2axqhbxltdC-ZFALi7rdxz6Ad0Qxv5I93uaTwThCGp6-GYNTPFT7yLvKkB4HszXKgq2BEB3sIKFqyMVE4';

const starters = [
  'How do I get to Faisal Mosque?',
  "What's the next bus to Saddar?",
  'Help me plan a scenic route.',
];

function getResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('faisal mosque')) {
    return "To reach Faisal Mosque, take Metro Route 1 to Centaurus Station. From there, you can use the Green Line shuttle or a brief 5-minute taxi ride. Would you like me to book a ride-hailing partner for the last mile?";
  }
  if (q.includes('saddar')) {
    return "The next Metro Bus towards Saddar Station is arriving at your nearest station in approximately 4 minutes. The service is currently running with low congestion.";
  }
  return "I'm looking that up in the official Rah-Numa database. Please wait a moment while I fetch the latest route schedules for Islamabad/Rawalpindi.";
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: "Assalam-o-Alaikum! I am your official Rah-Numa digital assistant. How may I facilitate your transit today across the twin cities?",
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
    const userMsg: Message = { id: Date.now(), text, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowStarters(false);

    setTimeout(() => {
      const aiMsg: Message = { id: Date.now() + 1, text: getResponse(text), isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  const handleSubmit = () => sendMessage(input);

  return (
    <main className="md:ml-64 h-screen flex flex-col relative">
      {/* Header */}
      <header className="w-full bg-surface/80 backdrop-blur-md px-container-margin py-lg flex flex-col items-center justify-center text-center z-10">
        <h2 className="text-headline-lg font-headline-lg text-primary tracking-tight mb-xs">AI Journey Guide</h2>
        <p className="text-body-md font-body-md text-outline">Ask me anything about routes, schedules, or landmarks in Islamabad &amp; Rawalpindi.</p>
      </header>

      {/* Chat History */}
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
              <p className="text-body-md font-body-md">{msg.text}</p>
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

      {/* Input Bar */}
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
            placeholder="Enter your transit query here..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface placeholder:text-outline-variant outline-none"
          />
          <button onClick={handleSubmit} className="bg-primary text-secondary-fixed p-md rounded-xl hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <p className="text-center mt-sm text-[10px] text-outline text-label-sm font-label-sm uppercase tracking-widest opacity-60">Government of Pakistan Transit Services</p>
      </footer>
    </main>
  );
}
