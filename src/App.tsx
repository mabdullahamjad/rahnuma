import { useState } from 'react';
import SideNav from '@/components/SideNav';
import MobileNav from '@/components/MobileNav';
import HomePage from '@/pages/HomePage';
import MapPage from '@/pages/MapPage';
import SchedulesPage from '@/pages/SchedulesPage';
import AiPage from '@/pages/AiPage';

function App() {
  const [page, setPage] = useState('home');

  const handleNavigate = (p: string) => {
    if (p === 'profile') {
      setPage('ai');
      return;
    }
    setPage(p);
  };

  const renderPage = () => {
    switch (page) {
      case 'map':
        return <MapPage />;
      case 'schedules':
        return <SchedulesPage />;
      case 'ai':
        return <AiPage />;
      default:
        return <HomePage />;
    }
  };

  const isMapPage = page === 'map';
  const isAiPage = page === 'ai';

  return (
    <div className={isMapPage ? 'h-screen overflow-hidden flex flex-col md:flex-row bg-surface' : 'min-h-screen bg-background'}>
      <SideNav activePage={page} onNavigate={handleNavigate} />
      {renderPage()}
      {!isAiPage && <MobileNav activePage={page} onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
