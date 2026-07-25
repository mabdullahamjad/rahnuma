interface MobileNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const items = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'map', label: 'Live Map', icon: 'map' },
  { id: 'schedules', label: 'Tickets', icon: 'confirmation_number' },
  { id: 'profile', label: 'Profile', icon: 'person' },
];

export default function MobileNav({ activePage, onNavigate }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-primary flex justify-around items-center py-4 px-container-margin z-50">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 ${activePage === 'home' ? 'text-secondary-fixed' : 'text-tertiary-fixed-dim'}`}
      >
        <span className="material-symbols-outlined" style={activePage === 'home' ? { fontVariationSettings: '"FILL" 1' } : undefined}>home</span>
        <span className="text-[10px]">Home</span>
      </button>
      <button
        onClick={() => onNavigate('map')}
        className={`flex flex-col items-center gap-1 ${activePage === 'map' ? 'text-secondary-fixed' : 'text-tertiary-fixed-dim'}`}
      >
        <span className="material-symbols-outlined" style={activePage === 'map' ? { fontVariationSettings: '"FILL" 1' } : undefined}>map</span>
        <span className="text-[10px]">Live Map</span>
      </button>
      <div className="relative -top-6">
        <button
          onClick={() => onNavigate('home')}
          className="bg-secondary-container text-on-secondary-container w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-background"
        >
          <span className="material-symbols-outlined text-[32px]">navigation</span>
        </button>
      </div>
      <button
        onClick={() => onNavigate('schedules')}
        className={`flex flex-col items-center gap-1 ${activePage === 'schedules' ? 'text-secondary-fixed' : 'text-tertiary-fixed-dim'}`}
      >
        <span className="material-symbols-outlined" style={activePage === 'schedules' ? { fontVariationSettings: '"FILL" 1' } : undefined}>confirmation_number</span>
        <span className="text-[10px]">Tickets</span>
      </button>
      <button
        onClick={() => onNavigate('ai')}
        className={`flex flex-col items-center gap-1 ${activePage === 'ai' ? 'text-secondary-fixed' : 'text-tertiary-fixed-dim'}`}
      >
        <span className="material-symbols-outlined" style={activePage === 'ai' ? { fontVariationSettings: '"FILL" 1' } : undefined}>person</span>
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
}
