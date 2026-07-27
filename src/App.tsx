import { useState } from 'react';
import SideNav from '@/components/SideNav';
import MobileNav from '@/components/MobileNav';
import HomePage from '@/pages/HomePage';
import MapPage from '@/pages/MapPage';
import SchedulesPage from '@/pages/SchedulesPage';
import AiPage from '@/pages/AiPage';
import SupportPage from '@/pages/SupportPage';

function App() {
  const [page, setPage] = useState('home');
  const [routeTypeFilter, setRouteTypeFilter] = useState<string | undefined>();

  const handleNavigate = (p: string) => {
    if (p === 'profile') {
      setPage('ai');
      return;
    }
    setPage(p);
  };

  const openRouteGroup = (type?: string) => {
    setRouteTypeFilter(type);
    setPage('schedules');
  };

  const renderPage = () => {
    switch (page) {
      case 'map':
        return <MapPage />;
      case 'schedules':
        return <SchedulesPage routeTypeFilter={routeTypeFilter} />;
      case 'ai':
        return <AiPage />;
      case 'support':
        return <SupportPage />;
      default:
        return <HomePage onNavigate={handleNavigate} onOpenRouteGroup={openRouteGroup} />;
    }
  };

  const isMapPage = page === 'map';

  return (
    <div className={isMapPage ? 'h-screen overflow-hidden flex flex-col md:flex-row bg-surface' : 'min-h-screen bg-background'}>
      <SideNav activePage={page} onNavigate={handleNavigate} />
      {renderPage()}
      <MobileNav activePage={page} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
