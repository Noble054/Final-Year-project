import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Battery, TrendingUp, TrendingDown, Zap, DollarSign, Activity, AlertTriangle, Bolt, CheckCircle, XCircle } from 'lucide-react';

const BatteryHealthTracking = () => {
  const [batteryData, setBatteryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatteryData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/battery/health-history`, config);
        setBatteryData(data);
      } catch (error) {
        console.error('Error fetching battery data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatteryData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!batteryData) {
    return (
      <div className="glass-card p-8">
        <p className="text-gray-500">Unable to load battery health data.</p>
      </div>
    );
  }

  // Prepare health trend data
  const healthTrendData = batteryData.healthTrends.map((trend, index) => ({
    index: batteryData.healthTrends.length - index,
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    healthIn: trend.batteryIn.health,
    healthOut: trend.batteryOut.health,
    chargeIn: trend.batteryIn.charge,
    chargeOut: trend.batteryOut.charge
  })).reverse();

  // Prepare swap efficiency data
  const efficiencyData = batteryData.statistics.swapEfficiency.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    chargeGained: item.chargeGained,
    cost: item.cost,
    costPerPercent: parseFloat(item.costPerPercent)
  }));

  return (
    <div className="space-y-6">
      {/* Current Active Battery */}
      {batteryData.activeBattery && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Battery className="text-emerald-400" size={20} />
              Current Active Battery
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                batteryData.activeBattery.health_status >= 80 ? 'bg-emerald-400/20 text-emerald-400' :
                batteryData.activeBattery.health_status >= 60 ? 'bg-amber-400/20 text-amber-400' :
                'bg-red-400/20 text-red-400'
              }`}>
                {batteryData.activeBattery.health_status}% Health
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                batteryData.activeBattery.charge_level <= 30 ? 'bg-emerald-400/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'
              }`}>
                {batteryData.activeBattery.charge_level <= 30 ? (
                  <><CheckCircle size={12} /> Ready to Swap</>
                ) : (
                  <><XCircle size={12} /> Not Depleted</>
                )}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Serial Number</p>
              <p className="text-lg font-mono font-semibold text-white">{batteryData.activeBattery.serial_number}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Current Charge</p>
              <p className={`text-lg font-mono font-semibold ${batteryData.activeBattery.charge_level <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {batteryData.activeBattery.charge_level}%
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Battery Type</p>
              <p className="text-lg font-semibold text-white">{batteryData.activeBattery.battery_type}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Swap Eligibility</p>
              <p className={`text-lg font-semibold ${batteryData.activeBattery.charge_level <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {batteryData.activeBattery.charge_level <= 30 ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>

          {batteryData.activeBattery.charge_level > 30 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-amber-400 mt-0.5" size={16} />
                <p className="text-xs text-amber-300">
                  Battery must be depleted (≤30% charge) to be eligible for swap. Current charge: {batteryData.activeBattery.charge_level}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Swaps</span>
            <Activity className="text-neonCyan" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">{batteryData.statistics.totalSwaps}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span className="text-neonCyan">Lifetime swaps</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg. Incoming Health</span>
            <TrendingUp className="text-emerald-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">{batteryData.statistics.avgHealthIncoming}%</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span className="text-emerald-400">Battery quality</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg. Outgoing Health</span>
            <TrendingDown className="text-amber-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">{batteryData.statistics.avgHealthOutgoing}%</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span className="text-amber-400">Returned condition</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Cost Efficiency</span>
            <DollarSign className="text-electricPurple" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">${batteryData.statistics.avgCostPerPercent}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span className="text-electricPurple">Per % charge</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trend Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Battery Health Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="healthIn" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Incoming Health"
                dot={{ fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="healthOut" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Outgoing Health"
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Swap Efficiency Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Swap Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar 
                dataKey="chargeGained" 
                fill="#3b82f6" 
                name="Charge Gained (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="cost" 
                fill="#8b5cf6" 
                name="Cost ($)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Swap History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Swap History</h3>
        <div className="space-y-3">
          {batteryData.swapHistory.slice(0, 5).map((swap) => (
            <div key={swap.swap_log_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-400/20 rounded-full">
                  <Zap className="text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{swap.station_name || 'Unknown Station'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(swap.swapped_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">${swap.cost?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-400">
                  {swap.charge_level_out}% → {swap.charge_level_in}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Alerts */}
      {batteryData.statistics.avgHealthIncoming < 70 && (
        <div className="glass-card p-6 border border-amber-400/50 bg-amber-400/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-white mb-1">Battery Quality Alert</p>
              <p className="text-xs text-gray-300">
                The average health of batteries you've been receiving is below optimal levels. 
                Consider checking stations with higher battery quality ratings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryHealthTracking;