import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  Zap, Clock, TrendingUp, ArrowLeft, Save, RefreshCw, 
  Settings, Activity, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';

const SlotManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [slotStats, setSlotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newAvailableSlots, setNewAvailableSlots] = useState(0);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
        setStations(data.chargingStations || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stations:', error);
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  const handleSelectStation = async (station) => {
    setSelectedStation(station);
    setNewAvailableSlots(station.available_slots);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/charging/${station.station_id}/slots/stats`, config);
      setSlotStats(data);
    } catch (error) {
      console.error('Error fetching slot stats:', error);
    }
  };

  const handleUpdateSlots = async () => {
    if (!selectedStation) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${import.meta.env.VITE_API_URL}/stations/charging/${selectedStation.station_id}/slots`, 
        { available_slots: newAvailableSlots }, config);
      
      // Refresh station data
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
      setStations(data.chargingStations || []);
      
      // Refresh slot stats
      const statsData = await axios.get(`${import.meta.env.VITE_API_URL}/stations/charging/${selectedStation.station_id}/slots/stats`, config);
      setSlotStats(statsData.data);
      
      setSelectedStation({ ...selectedStation, available_slots: newAvailableSlots });
      alert('Slot availability updated successfully');
    } catch (error) {
      console.error('Error updating slots:', error);
      alert('Failed to update slot availability');
    } finally {
      setUpdating(false);
    }
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 80) return 'text-red-400';
    if (rate >= 60) return 'text-amber-400';
    if (rate >= 40) return 'text-emerald-400';
    return 'text-blue-400';
  };

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-blue-400">
                <Zap size={28} />
              </div>
              {selectedStation ? 'Slot Management' : 'Select Station'}
            </h1>
            <p className="text-gray-400 mt-2">
              {selectedStation ? 'Manage charging slot availability and utilization' : 'Choose a station to manage its slots'}
            </p>
          </div>
          {selectedStation && (
            <button 
              onClick={() => { setSelectedStation(null); setSlotStats(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back to List</span>
            </button>
          )}
        </div>

        {!selectedStation ? (
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="text-blue-400" size={20} />
              Your Charging Stations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Zap className="mx-auto mb-2 text-gray-600" size={32} />
                  <p>No charging stations found</p>
                </div>
              ) : (
                stations.map((station) => (
                  <div 
                    key={station.station_id}
                    onClick={() => handleSelectStation(station)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{station.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        station.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {station.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Slots</span>
                        <span className="text-white font-semibold">{station.total_slots}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Available</span>
                        <span className="text-emerald-400 font-semibold">{station.available_slots}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Occupied</span>
                        <span className="text-blue-400 font-semibold">{station.total_slots - station.available_slots}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Utilization</span>
                        <span className={`font-semibold ${getUtilizationColor(((station.total_slots - station.available_slots) / station.total_slots) * 100)}`}>
                          {(((station.total_slots - station.available_slots) / station.total_slots) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Slot Stats */}
            {slotStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Slots</span>
                    <Zap className="text-blue-400" size={18} />
                  </div>
                  <p className="text-3xl font-bold text-white">{slotStats.total_slots}</p>
                </div>
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Available</span>
                    <CheckCircle className="text-emerald-400" size={18} />
                  </div>
                  <p className="text-3xl font-bold text-white">{slotStats.available_slots}</p>
                </div>
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Occupied</span>
                    <Clock className="text-blue-400" size={18} />
                  </div>
                  <p className="text-3xl font-bold text-white">{slotStats.occupied_slots}</p>
                </div>
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Utilization</span>
                    <TrendingUp className="text-purple-400" size={18} />
                  </div>
                  <p className={`text-3xl font-bold ${getUtilizationColor(slotStats.utilization_rate)}`}>
                    {slotStats.utilization_rate}%
                  </p>
                </div>
              </div>
            )}

            {/* Update Slot Availability */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="text-neonCyan" size={20} />
                Update Slot Availability
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Available Slots</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="0"
                      max={selectedStation.total_slots}
                      value={newAvailableSlots}
                      onChange={(e) => setNewAvailableSlots(parseInt(e.target.value) || 0)}
                      className="input-field flex-1"
                    />
                    <span className="text-gray-400 text-sm">of {selectedStation.total_slots} total</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full transition-all duration-500" 
                    style={{ width: `${(newAvailableSlots / selectedStation.total_slots) * 100}%` }}
                  ></div>
                </div>
                <button
                  onClick={handleUpdateSlots}
                  disabled={updating}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {updating ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  {updating ? 'Updating...' : 'Update Availability'}
                </button>
              </div>
            </div>

            {/* Station Info */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="text-electricPurple" size={20} />
                Station Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Station Name</p>
                  <p className="text-white font-medium">{selectedStation.name}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Charger Type</p>
                  <p className="text-white font-medium">{selectedStation.charger_type}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Price per kWh</p>
                  <p className="text-white font-medium">${selectedStation.price_per_kwh}/kWh</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Contact</p>
                  <p className="text-white font-medium">{selectedStation.contact_number || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotManagement;