import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Activity, Radio, MapPin, Zap, Loader2, AlertTriangle, BatteryCharging, RefreshCw } from 'lucide-react';

const AdminNetwork = () => {
  const { user } = useContext(AuthContext);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNetworkHealth = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/network-health`, config);
      setNetwork(response.data);
      setError('');
    } catch (requestError) {
      console.error('Error fetching network health', requestError);
      setError(requestError.response?.data?.message || 'Failed to load network health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkHealth();
  }, [user.token]);

  const getStatusClass = (status) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'maintenance') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
            <Activity size={28} />
          </div>
          Network Health
        </h1>

        <p className="text-gray-400 max-w-2xl">
          Monitor the global status of all ChargeMate charging and battery swap stations. Keep track of hardware performance and operational uptime.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Radio size={24} />
              </div>
              <p className="text-gray-400 font-medium">Online Stations</p>
            </div>
            <p className="text-4xl font-bold font-mono text-white">{network?.summary.online ?? '-'}</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center border-amber-500/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Zap size={24} />
              </div>
              <p className="text-gray-400 font-medium">Under Heavy Load</p>
            </div>
            <p className="text-4xl font-bold font-mono text-white">{network?.summary.heavyLoad ?? '-'}</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center border-red-500/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <Activity size={24} />
              </div>
              <p className="text-gray-400 font-medium">Offline / Errors</p>
            </div>
            <p className="text-4xl font-bold font-mono text-white">{network?.summary.offline ?? '-'}</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden mt-8">
          <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <MapPin className="text-neonCyan" size={20} />
            <h2 className="text-xl font-heading font-semibold">Active Alerts</h2>
            </div>
            <button type="button" onClick={fetchNetworkHealth} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-neonCyan" size={32} /><p className="text-sm">Loading station health...</p></div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : network?.stations.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4"><MapPin size={48} className="text-white/10" /><p>No stations have been registered yet.</p></div>
          ) : (
            <div className="divide-y divide-white/5">
              {network?.stations.map((station) => (
                <div key={`${station.station_type}-${station.id}`} className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`rounded-xl border p-3 ${station.station_type === 'Charging' ? 'border-neonCyan/20 bg-neonCyan/10 text-neonCyan' : 'border-electricPurple/20 bg-electricPurple/10 text-electricPurple'}`}>
                      {station.station_type === 'Charging' ? <Zap size={20} /> : <BatteryCharging size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{station.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{station.station_type} · Operator ID: {station.operator_id || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    <div className="min-w-40">
                      <div className="mb-1 flex justify-between text-xs"><span className="text-gray-500">Utilization</span><span className="font-mono text-gray-300">{station.utilization}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${station.utilization >= 75 ? 'bg-amber-400' : 'bg-neonCyan'}`} style={{ width: `${station.utilization}%` }} /></div>
                    </div>
                    <span className="text-xs text-gray-400">{station.available}/{station.capacity} available</span>
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(station.status)}`}>{station.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && network && network.summary.offline > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            {network.summary.offline} station{network.summary.offline === 1 ? '' : 's'} require attention.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNetwork;
