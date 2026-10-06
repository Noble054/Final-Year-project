import Sidebar from './Sidebar';
import NotificationsPanel from './NotificationsPanel';
import DailyTipPopup from './DailyTipPopup';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-obsidian text-white flex-col lg:flex-row">
      <Sidebar />
      <DailyTipPopup />
      <main className="flex-1 lg:ml-64 relative animate-fade-in flex flex-col min-h-screen">
        <div className="absolute top-4 right-4 z-50">
          <NotificationsPanel />
        </div>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
