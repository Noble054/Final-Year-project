import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  Zap, Activity, Users, BatteryCharging, TrendingUp, TrendingDown, 
  AlertTriangle, DollarSign, Clock, MapPin, BarChart3, Settings, 
  Wrench, MoreHorizontal, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Plus, Calendar, Building2, Power 
} from 'lucide-react';

const OperatorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stations: [],
    stats: {
      totalStations: 0,
      activeStations: 0,
      offlineStations: 0,
      ongoingSessions: 0,
      todayRevenue: 0,
      todayEnergy: 0,
      uptime: 0,
      avgSessionDuration: 0
    },
    recentAlerts: [],
    revenueTrend: [],
    topStations: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [stationsRes, analyticsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/stations/operator/analytics`, config)
        ]);

        const chargingStations = stationsRes.data.chargingStations || [];
        const swapStations = stationsRes.data.swapStations || [];
        const allStations = [
          ...chargingStations.map(s => ({ ...s, type: 'charging' })),
          ...swapStations.map(s => ({ ...s, type: 'swap' }))
        ];

        const analytics = analyticsRes.data;
        const activeStations = allStations.filter(s => s.status === 'active').length;
        const offlineStations = allStations.filter(s => s.status === 'inactive' || s.status === 'closed').length;
        const maintenanceStations = allStations.filter(s => s.status === 'maintenance').length;
        const todayRevenue = Number(analytics.today_performance?.total_revenue || 0);
        const today = new Date();
        const revenueTrend = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: index === 6 ? todayRevenue : 0
          };
        });
        const recentAlerts = allStations
          .filter(station => station.status !== 'active')
          .map((station) => ({
            id: `${station.type}-${station.station_id || station.swap_id}`,
            type: station.status === 'maintenance' ? 'warning' : 'error',
            message: `${station.name} is ${station.status}.`,
            time: 'Current status'
          }))
          .slice(0, 5);

        setDashboardData({
          stations: allStations,
          stats: {
            totalStations: allStations.length,
            activeStations: activeStations,
            offlineStations: offlineStations,
            maintenanceStations: maintenanceStations,
            ongoingSessions: analytics.today_performance?.total_sessions || 0,
            todayRevenue,
            todayEnergy: 0,
            uptime: allStations.length > 0 ? ((activeStations / allStations.length) * 100).toFixed(1) : 0,
            avgSessionDuration: 45
          },
          recentAlerts,
          revenueTrend,
          topStations: allStations.slice(0, 3)
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getStationStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStationStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Zap size={16} />;
      case 'inactive':
        return <XCircle size={16} />;
      case 'maintenance':
        return <Settings size={16} />;
      case 'closed':
        return <Power size={16} />;
      default:
        return <XCircle size={16} />;
    }
  };

  const getStationStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Online';
      case 'inactive':
        return 'Offline';
      case 'maintenance':
        return 'Maintenance';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <CheckCircle size={16} className="text-blue-400" />;
    }
  };

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-blue-400">
                <Activity size={28} />
              </div>
              Operator Dashboard
            </h1>
            <p className="text-gray-400 mt-2 max-w-2xl">
              Real-time network monitoring and station management
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/manage-stations')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
            >
              <Settings size={16} />
              <span className="text-sm">Settings</span>
            </button>
            <button 
              onClick={() => navigate('/manage-stations')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all border border-blue-500/30"
            >
              <Plus size={16} />
              <span className="text-sm">Add Station</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Stations</span>
              <Zap className="text-blue-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{dashboardData.stats.totalStations}</p>
            <p className="text-xs text-gray-400">Network wide</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Active Stations</span>
              <CheckCircle className="text-emerald-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{dashboardData.stats.activeStations}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} /> {dashboardData.stats.totalStations > 0 ? ((dashboardData.stats.activeStations / dashboardData.stats.totalStations) * 100).toFixed(0) : 0}% uptime
            </p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[40px] rounded-full group-hover:bg-amber-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Maintenance</span>
              <Settings className="text-amber-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{dashboardData.stats.maintenanceStations}</p>
            <p className="text-xs text-amber-400">Under repair</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Ongoing Sessions</span>
              <BatteryCharging className="text-purple-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{dashboardData.stats.ongoingSessions}</p>
            <p className="text-xs text-gray-400">Currently charging</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neonCyan/10 blur-[40px] rounded-full group-hover:bg-neonCyan/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Today's Revenue</span>
              <DollarSign className="text-neonCyan" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">${dashboardData.stats.todayRevenue}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp size={12} /> +12% vs yesterday
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Station Status Overview */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="text-emerald-400" size={20} />
                  Station Status
                </h2>
                <button 
                  onClick={() => navigate('/manage-stations')}
                  className="text-sm text-neonCyan hover:text-white transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {dashboardData.stations.slice(0, 4).map((station) => (
                  <div key={station.station_id || station.swap_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg border ${getStationStatusColor(station.status)}`}>
                        {getStationStatusIcon(station.status)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{station.name}</p>
                        <p className="text-xs text-gray-400">
                          {station.charger_type ? `${station.charger_type} • ${station.available_slots}/${station.total_slots} slots` : 
                           station.battery_stock ? `${station.battery_stock} batteries` : 
                           'Station'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white capitalize">{getStationStatusText(station.status)}</p>
                        <p className="text-xs text-gray-400">
                          {station.status === 'active' ? '98% uptime' : 
                           station.status === 'maintenance' ? 'Under maintenance' :
                           station.status === 'closed' ? 'Temporarily closed' :
                           'Check connection'}
                        </p>
                      </div>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {dashboardData.stations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="mx-auto mb-2 text-gray-600" size={32} />
                    <p>No stations found. Add your first station to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="text-neonCyan" size={20} />
                  Revenue Overview
                </h2>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>This month</option>
                </select>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dashboardData.revenueTrend.map((item) => (
                  <div key={item.day} className="text-center">
                    <div className="h-24 bg-white/5 rounded-lg relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neonCyan to-blue-500 transition-all duration-500"
                        style={{ height: `${(item.revenue / 700) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{item.day}</p>
                    <p className="text-xs font-semibold text-white">${item.revenue}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">${dashboardData.revenueTrend.reduce((sum, item) => sum + item.revenue, 0)}</p>
                  <p className="text-xs text-gray-400">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">${Math.round(dashboardData.revenueTrend.reduce((sum, item) => sum + item.revenue, 0) / 7)}</p>
                  <p className="text-xs text-gray-400">Daily Average</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+18%</p>
                  <p className="text-xs text-gray-400">Growth Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Network Health */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="text-blue-400" size={18} />
                Network Health
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Overall Uptime</span>
                    <span className="text-white font-semibold">{dashboardData.stats.uptime}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${dashboardData.stats.uptime}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Session Success Rate</span>
                    <span className="text-white font-semibold">94.5%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '94.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Avg Session Duration</span>
                    <span className="text-white font-semibold">{dashboardData.stats.avgSessionDuration} min</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: '56%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-400" size={18} />
                  Recent Alerts
                </h2>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">{dashboardData.recentAlerts.length}</span>
              </div>
              <div className="space-y-3">
                {dashboardData.recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-white/5 rounded-lg border-l-2 border-amber-400">
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="text-neonCyan" size={18} />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/station-profile')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-left"
                >
                  <Building2 className="text-electricPurple" size={16} />
                  <span className="text-sm">Station Profile</span>
                  <ArrowUpRight size={16} className="ml-auto text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/slot-management')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-left"
                >
                  <Zap className="text-blue-400" size={16} />
                  <span className="text-sm">Slot Management</span>
                  <ArrowUpRight size={16} className="ml-auto text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/battery-inventory')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-left"
                >
                  <BatteryCharging className="text-emerald-400" size={16} />
                  <span className="text-sm">Battery Inventory</span>
                  <ArrowUpRight size={16} className="ml-auto text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/manage-stations')}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-left"
                >
                  <Wrench className="text-blue-400" size={16} />
                  <span className="text-sm">Add New Station</span>
                  <ArrowUpRight size={16} className="ml-auto text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
