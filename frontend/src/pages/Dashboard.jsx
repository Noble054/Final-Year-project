import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Wallet, Map as MapIcon, Calendar, BarChart3, Battery, Zap, TrendingUp, Clock, Activity, ArrowRight, Star, Leaf, AlertTriangle, Bolt } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeBattery, setActiveBattery] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depleting, setDepleting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fetch active battery
        const batteryRes = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/driver/active-battery`, config);
        setActiveBattery(batteryRes.data);
        
        // Fetch recent transactions/activity
        const analyticsRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallet/analytics`, config);
        setRecentActivity(analyticsRes.data.transactions?.slice(0, 3) || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'EV Driver') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSimulateDepletion = async () => {
    if (!activeBattery) return;
    
    setDepleting(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/stations/batteries/simulate-depletion`, 
        { depletion_amount: 15 }, config);
      
      // Refresh battery data
      const batteryRes = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/driver/active-battery`, config);
      setActiveBattery(batteryRes.data);
      
    } catch (error) {
      console.error('Error simulating depletion:', error);
      alert('Failed to simulate battery depletion');
    } finally {
      setDepleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-neonCyan/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
            <p className="text-gray-400 mt-2">Here's what's happening with your account today.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <Clock size={16} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neonCyan/10 blur-[40px] rounded-full group-hover:bg-neonCyan/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Wallet Balance</span>
            <Wallet className="text-neonCyan" size={18} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">${user?.wallet_balance?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <TrendingUp size={12} /> Available funds
          </p>
        </div>

        {user?.role === 'EV Driver' && (
          <>
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Battery Status</span>
                <Battery className="text-emerald-400" size={18} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {loading ? '...' : (activeBattery ? `${activeBattery.charge_level}%` : 'N/A')}
              </p>
              <p className="text-xs text-gray-400">
                {loading ? 'Loading...' : (activeBattery ? (
                  <span className={activeBattery.charge_level <= 30 ? 'text-emerald-400' : 'text-amber-400'}>
                    {activeBattery.charge_level <= 30 ? 'Ready to swap' : `${activeBattery.health_status}% health`}
                  </span>
                ) : 'No active battery')}
              </p>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-electricPurple/10 blur-[40px] rounded-full group-hover:bg-electricPurple/20 transition-all"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Swaps</span>
                <Zap className="text-electricPurple" size={18} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">12</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">CO₂ Saved</span>
                <Leaf className="text-blue-400" size={18} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">45kg</p>
              <p className="text-xs text-green-400">Environmental impact</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Actions Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          {user?.role === 'EV Driver' && (
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-electricPurple/10 blur-[50px] rounded-full"></div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="text-electricPurple" size={20} />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/map')}
                  className="bg-gradient-to-r from-neonCyan/20 to-transparent hover:from-neonCyan/30 p-4 rounded-xl transition-all flex items-center gap-4 border border-neonCyan/20 hover:border-neonCyan/40 group"
                >
                  <div className="p-3 bg-neonCyan/20 rounded-lg group-hover:bg-neonCyan/30 transition-all">
                    <MapIcon className="text-neonCyan" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">Find Stations</p>
                    <p className="text-xs text-gray-400">Locate nearby charging points</p>
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-neonCyan transition-colors" size={20} />
                </button>

                <button 
                  onClick={() => navigate('/reservations')}
                  className="bg-gradient-to-r from-electricPurple/20 to-transparent hover:from-electricPurple/30 p-4 rounded-xl transition-all flex items-center gap-4 border border-electricPurple/20 hover:border-electricPurple/40 group"
                >
                  <div className="p-3 bg-electricPurple/20 rounded-lg group-hover:bg-electricPurple/30 transition-all">
                    <Calendar className="text-electricPurple" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">My Reservations</p>
                    <p className="text-xs text-gray-400">Manage your bookings</p>
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-electricPurple transition-colors" size={20} />
                </button>

                {activeBattery && activeBattery.charge_level > 30 && (
                  <button 
                    onClick={handleSimulateDepletion}
                    disabled={depleting}
                    className="bg-gradient-to-r from-amber-500/20 to-transparent hover:from-amber-500/30 p-4 rounded-xl transition-all flex items-center gap-4 border border-amber-500/20 hover:border-amber-500/40 group disabled:opacity-50"
                  >
                    <div className="p-3 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-all">
                      <Bolt className="text-amber-400" size={24} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-white">Simulate Depletion</p>
                      <p className="text-xs text-gray-400">Reduce battery charge by 15%</p>
                    </div>
                    <ArrowRight className="text-gray-500 group-hover:text-amber-400 transition-colors" size={20} />
                  </button>
                )}

                <button 
                  onClick={() => navigate('/analytics')}
                  className="bg-gradient-to-r from-blue-500/20 to-transparent hover:from-blue-500/30 p-4 rounded-xl transition-all flex items-center gap-4 border border-blue-500/20 hover:border-blue-500/40 group"
                >
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                    <BarChart3 className="text-blue-400" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">Usage Analytics</p>
                    <p className="text-xs text-gray-400">Track your spending & usage</p>
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-blue-400 transition-colors" size={20} />
                </button>

                <button 
                  onClick={() => navigate('/battery-health')}
                  className="bg-gradient-to-r from-emerald-500/20 to-transparent hover:from-emerald-500/30 p-4 rounded-xl transition-all flex items-center gap-4 border border-emerald-500/20 hover:border-emerald-500/40 group"
                >
                  <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all">
                    <Battery className="text-emerald-400" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">Battery Health</p>
                    <p className="text-xs text-gray-400">Monitor battery performance</p>
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-emerald-400 transition-colors" size={20} />
                </button>
              </div>
            </div>
          )}

          {user?.role === 'EV Driver' && activeBattery && activeBattery.charge_level > 30 && (
            <div className="glass-card p-4 bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400">Battery Swap Restriction</p>
                  <p className="text-xs text-amber-300 mt-1">
                    Your current battery has {activeBattery.charge_level}% charge. You can only swap when it's depleted (≤30%). Use the "Simulate Depletion" button to test the swap functionality.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {user?.role === 'EV Driver' && (
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neonCyan/10 blur-[50px] rounded-full"></div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="text-neonCyan" size={20} />
                  Recent Activity
                </h2>
                <button 
                  onClick={() => navigate('/analytics')}
                  className="text-sm text-neonCyan hover:text-white transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading activity...</div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.transaction_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'deposit' ? 'bg-green-400/20 text-green-400' :
                          activity.type === 'charge' ? 'bg-red-400/20 text-red-400' :
                          activity.type === 'swap' ? 'bg-blue-400/20 text-blue-400' :
                          'bg-amber-400/20 text-amber-400'
                        }`}>
                          {activity.type === 'deposit' && <TrendingUp size={16} />}
                          {activity.type === 'charge' && <Zap size={16} />}
                          {activity.type === 'swap' && <Battery size={16} />}
                          {activity.type === 'penalty' && <Clock size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{activity.type}</p>
                          <p className="text-xs text-gray-400">{activity.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          activity.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {activity.type === 'deposit' ? '+' : '-'}${activity.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="mx-auto mb-2 text-gray-600" size={32} />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neonCyan/10 blur-[50px] rounded-full group-hover:bg-neonCyan/20 transition-all"></div>
            <h2 className="text-lg font-medium text-gray-400 mb-2">Wallet Balance</h2>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4">${user?.wallet_balance?.toFixed(2) || '0.00'}</p>
            {user?.role === 'EV Driver' && (
              <button 
                onClick={() => navigate('/wallet')}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Wallet size={18} /> Top Up Wallet
              </button>
            )}
          </div>

          {/* Environmental Impact */}
          {user?.role === 'EV Driver' && (
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full"></div>
              <h2 className="text-lg font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Leaf className="text-green-400" size={18} />
                Environmental Impact
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">CO₂ Saved</span>
                  <span className="text-sm font-semibold text-green-400">45kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Trees Equivalent</span>
                  <span className="text-sm font-semibold text-green-400">2.3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Green Miles</span>
                  <span className="text-sm font-semibold text-green-400">1,240</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={16} />
                    <span className="text-xs text-gray-400">Eco Warrior Level 3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Station Operator Card */}
          {user?.role === 'Station Operator' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-medium text-gray-400 mb-2">My Stations</h2>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed mb-6">Manage your charging and battery swap stations.</p>
              <button 
                onClick={() => navigate('/manage-stations')}
                className="w-full btn-primary"
              >
                Manage Stations
              </button>
            </div>
          )}

          {/* Admin Card */}
          {user?.role === 'Admin' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-medium text-gray-400 mb-2">Platform Admin</h2>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed mb-6">View system analytics, users, and transactions.</p>
              <button 
                onClick={() => navigate('/admin')}
                className="w-full btn-primary"
              >
                Go to Admin Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
