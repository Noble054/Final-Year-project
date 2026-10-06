import { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Wallet, Map as MapIcon, Calendar, Zap, Menu, X, Activity, Users, DollarSign, Settings, BarChart3, Battery, Building2, BatteryCharging, MessageSquareWarning } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['EV Driver'] },
    { name: 'My Wallet', path: '/wallet', icon: Wallet, roles: ['EV Driver'] },
    { name: 'Usage Analytics', path: '/analytics', icon: BarChart3, roles: ['EV Driver'] },
    { name: 'Battery Health', path: '/battery-health', icon: Battery, roles: ['EV Driver'] },
    { name: 'Find Stations', path: '/map', icon: MapIcon, roles: ['EV Driver'] },
    { name: 'Reservations', path: '/reservations', icon: Calendar, roles: ['EV Driver'] },
    { name: 'Complaints', path: '/complaints', icon: MessageSquareWarning, roles: ['EV Driver'] },
    { name: 'Operator Dashboard', path: '/operator', icon: LayoutDashboard, roles: ['Station Operator'] },
    { name: 'Station Profile', path: '/station-profile', icon: Building2, roles: ['Station Operator'] },
    { name: 'Slot Management', path: '/slot-management', icon: Zap, roles: ['Station Operator'] },
    { name: 'Battery Inventory', path: '/battery-inventory', icon: BatteryCharging, roles: ['Station Operator'] },
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, roles: ['Admin'] },
    { name: 'Network Health', path: '/admin/network', icon: Activity, roles: ['Admin'] },
    { name: 'User Management', path: '/admin/users', icon: Users, roles: ['Admin'] },
    { name: 'Financials', path: '/admin/financials', icon: DollarSign, roles: ['Admin'] },
    { name: 'System Settings', path: '/admin/settings', icon: Settings, roles: ['Admin'] },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden p-4 flex items-center justify-between glass-panel border-x-0 border-t-0 rounded-none z-[1001] sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-neonCyan to-electricPurple rounded-lg text-obsidian">
            <Zap size={20} />
          </div>
          <span className="text-lg font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-neonCyan to-electricPurple">ChargeMate</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1002] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`
        w-64 glass-panel border-y-0 border-l-0 rounded-none flex flex-col fixed h-full z-[1003] transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 hidden lg:flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-neonCyan to-electricPurple rounded-lg text-obsidian">
            <Zap size={24} />
          </div>
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-neonCyan to-electricPurple">ChargeMate</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 lg:mt-0 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(user?.role)).map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path) 
                  ? 'bg-white/10 text-white font-medium shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-neonCyan' : ''} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-black/20 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-electricPurple to-neonCyan flex items-center justify-center text-obsidian font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
