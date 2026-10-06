import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  MapPin, Phone, Clock, Save, ArrowLeft, AlertTriangle, 
  CheckCircle, XCircle, Settings, Building2, Zap, BatteryCharging 
} from 'lucide-react';

const StationProfile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stations, setStations] = useState({ charging: [], swap: [] });
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    operating_hours: '24/7',
    status: 'active'
  });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
        setStations({
          charging: data.chargingStations || [],
          swap: data.swapStations || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stations:', error);
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  const handleSelectStation = (station, type) => {
    setSelectedStation({ ...station, type });
    setFormData({
      name: station.name,
      contact_number: station.contact_number || '',
      operating_hours: station.operating_hours || '24/7',
      status: station.status || 'active'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const endpoint = selectedStation.type === 'charging' 
        ? `/stations/charging/${selectedStation.station_id}/profile`
        : `/stations/swap/${selectedStation.swap_id}/profile`;
      
      console.log('Updating station profile:', {
        endpoint,
        formData,
        stationId: selectedStation.type === 'charging' ? selectedStation.station_id : selectedStation.swap_id
      });
      
      await axios.put(`${import.meta.env.VITE_API_URL}${endpoint}`, formData, config);
      
      // Refresh stations
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
      setStations({
        charging: data.chargingStations || [],
        swap: data.swapStations || []
      });
      
      alert('Station profile updated successfully');
    } catch (error) {
      console.error('Error updating station:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update station profile';
      alert(`Failed to update station profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'inactive':
        return <XCircle size={16} />;
      case 'maintenance':
        return <AlertTriangle size={16} />;
      default:
        return <XCircle size={16} />;
    }
  };

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neonCyan/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
                <Building2 size={28} />
              </div>
              {selectedStation ? 'Station Profile' : 'Manage Stations'}
            </h1>
            <p className="text-gray-400 mt-2">
              {selectedStation ? 'Update station information and operating status' : 'Select a station to manage its profile'}
            </p>
          </div>
          {selectedStation && (
            <button 
              onClick={() => setSelectedStation(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back to List</span>
            </button>
          )}
        </div>

        {!selectedStation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Charging Stations */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="text-blue-400" size={20} />
                Charging Stations
              </h2>
              <div className="space-y-3">
                {stations.charging.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="mx-auto mb-2 text-gray-600" size={32} />
                    <p>No charging stations found</p>
                  </div>
                ) : (
                  stations.charging.map((station) => (
                    <div 
                      key={station.station_id}
                      onClick={() => handleSelectStation(station, 'charging')}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{station.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(station.status)}`}>
                          {getStatusIcon(station.status)}
                          {station.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {station.available_slots}/{station.total_slots} slots
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Swap Stations */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BatteryCharging className="text-emerald-400" size={20} />
                Battery Swap Stations
              </h2>
              <div className="space-y-3">
                {stations.swap.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="mx-auto mb-2 text-gray-600" size={32} />
                    <p>No swap stations found</p>
                  </div>
                ) : (
                  stations.swap.map((station) => (
                    <div 
                      key={station.swap_id}
                      onClick={() => handleSelectStation(station, 'swap')}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{station.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(station.status)}`}>
                          {getStatusIcon(station.status)}
                          {station.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BatteryCharging size={12} />
                          {station.battery_stock} batteries
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div className={`p-3 rounded-xl border ${getStatusColor(selectedStation.status)}`}>
                {getStatusIcon(selectedStation.status)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedStation.name}</h2>
                <p className="text-sm text-gray-400">
                  {selectedStation.type === 'charging' ? 'Charging Station' : 'Battery Swap Station'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Station Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Operating Hours</label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  className="input-field"
                  placeholder="24/7 or 9:00 AM - 9:00 PM"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Station Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field bg-obsidian"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {saving ? <Settings className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStation(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationProfile;