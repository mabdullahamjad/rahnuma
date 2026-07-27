interface SideNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAQnumRWkoV4qGBsrFP-BzV7u3_JCRv-kI8XCfYS7cReD4N83y9HJs_63c38main10ZJpP5i1J3tNAD1VPR3XgcV7FHbI0SItArl5_S0R2I_yu05qVVQiy3dtFuQwHS6cVcJ3-SHPx6OjL1ATILPDFhXhq3XCMijZvEy7oA3v16YF0FfdIjvOTx2uYIUQ3Akq49dXyzOz5KbglxLR7j2QURbyOzKLsVj6JFz8xkv7aRJ4LN3QvSPNSMvfGabR1A0Of4BqFtkDmtMl1';
const LOGO2_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV9_Rug1cR5g288nKyg0Ar-DKR8GgbOQNbcvAZ2xydUd8LMW5WX3q67QU6BRBkQC43izMDVWkz8MdbNLgQxWfae36u1ShcMDwcTNCwY_WU7EwnDsCaLZNvO7oETVafOiTpqBi0o0vviSfOA3vBWMUeC19cZloRUQ4A2qWZHWKbQRpZZ-B7zlHI_ivGZOK_fiMtxNrHE517dsM38VPXOyFs1ywlotYmM8nOV2BSWXFTD0w63NzKekLK9fswCw3mwwpxr225nNiSlzeF';

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'map', label: 'Live Map', icon: 'map' },
  { id: 'schedules', label: 'Schedules', icon: 'schedule' },
  { id: 'ai', label: 'AI Assistant', icon: 'smart_toy' },
];

export default function SideNav({ activePage, onNavigate }: SideNavProps) {
  return (
    <nav className="hidden md:flex flex-col h-full fixed left-0 top-0 py-lg px-md w-64 bg-primary z-50 border-r border-outline-variant/10 shadow-xl">
      {/* Logo */}
      <div className="flex gap-md px-md mb-xl flex-col">
        <div className="flex items-center gap-md">
          <div className="w-20 h-20 flex items-center justify-center rounded-lg">
            <img src={LOGO_URL} alt="Rah-Numa Official Logo" className="w-full h-full object-contain" />
          </div>
          <div className="h-20 flex items-center">
            <img src={LOGO2_URL} alt="Secondary Logo" className="h-full object-contain" />
          </div>
        </div>
        <div>
          <h1 className="text-headline-lg font-headline-lg text-secondary-fixed leading-none">Rahnuma</h1>
          <p className="text-label-sm font-label-sm text-tertiary-fixed-dim uppercase tracking-widest opacity-80">One app, Every Route</p>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 space-y-sm">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-md px-md py-sm rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-tertiary-container text-secondary-fixed translate-x-1 shadow-inner'
                  : 'text-tertiary-fixed-dim hover:bg-primary-fixed-dim/10 hover:text-secondary-fixed'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-md font-label-md">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Plan Journey CTA */}
      <button
        onClick={() => onNavigate('home')}
        className="mb-lg mx-md py-md bg-secondary-container text-on-secondary-fixed text-label-md font-label-md rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        Plan Journey
      </button>

      {/* Footer Links */}
      <div className="pt-md border-t border-outline-variant/10 space-y-xs">
        <button onClick={() => onNavigate('support')} className={`w-full flex items-center gap-md px-md py-sm transition-colors ${activePage === 'support' ? 'text-secondary-fixed' : 'text-tertiary-fixed-dim hover:text-secondary-fixed'}`}>
          <span className="material-symbols-outlined">help</span>
          <span className="text-label-md font-label-md">Support</span>
        </button>
      </div>
    </nav>
  );
}
