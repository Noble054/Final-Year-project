import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  BatteryCharging, Plus, Trash2, ArrowLeft, RefreshCw, Activity,
  CheckCircle, XCircle, AlertTriangle, Zap, TrendingUp, Search 
} from 'lucide-react';

const BatteryInventory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingBattery, setAddingBattery] = useState(false);
  const [newBattery, setNewBattery] = useState({
    serial_number: '',
    battery_type: 'Lithium-Ion',
    charge_level: 100,
    health_status: 100,
    status: 'available',
    bike_type: '',
    bike_model: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
        setStations(data.swapStations || []);
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
    setAddingBattery(false);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${station.swap_id}/batteries`, config);
      setBatteries(data || []);
    } catch (error) {
      console.error('Error fetching batteries:', error);
    }
  };

  const handleAddBattery = async (e) => {
    e.preventDefault();
    if (!newBattery.serial_number.trim() || !selectedStation) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      console.log('Adding battery with data:', newBattery);
      console.log('Station ID:', selectedStation.swap_id);
      
      await axios.post(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${selectedStation.swap_id}/batteries`, newBattery, config);
      
      // Refresh batteries
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${selectedStation.swap_id}/batteries`, config);
      setBatteries(data || []);
      
      // Reset form
      setNewBattery({
        serial_number: '',
        battery_type: 'Lithium-Ion',
        charge_level: 100,
        health_status: 100,
        status: 'available',
        bike_type: '',
        bike_model: ''
      });
      setAddingBattery(false);
      
      alert('Battery added successfully');
    } catch (error) {
      console.error('Error adding battery:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add battery';
      alert(`Failed to add battery: ${errorMessage}`);
    }
  };

  const handleUpdateBatteryStatus = async (batteryId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${import.meta.env.VITE_API_URL}/stations/batteries/${batteryId}`, { status: newStatus }, config);
      
      // Refresh batteries
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${selectedStation.swap_id}/batteries`, config);
      setBatteries(data || []);
      
      alert('Battery status updated successfully');
    } catch (error) {
      console.error('Error updating battery:', error);
      alert('Failed to update battery status');
    }
  };

  const handleSimulateCharge = async () => {
    if (!selectedStation) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/stations/batteries/simulate-charge`, {}, config);
      
      // Refresh batteries
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${selectedStation.swap_id}/batteries`, config);
      setBatteries(data || []);
      
      alert('Charge simulation completed');
    } catch (error) {
      console.error('Error simulating charge:', error);
      alert('Failed to simulate charge');
    }
  };

  const getBatteryStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'charging':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'swapped':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'maintenance':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-emerald-400';
    if (health >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const filteredBatteries = batteries.filter(battery =>
    battery.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    battery.battery_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400">
                <BatteryCharging size={28} />
              </div>
              {selectedStation ? 'Battery Inventory' : 'Select Station'}
            </h1>
            <p className="text-gray-400 mt-2">
              {selectedStation ? 'Manage battery inventory, charge levels, and health status' : 'Choose a swap station to manage its batteries'}
            </p>
          </div>
          {selectedStation && (
            <button 
              onClick={() => { setSelectedStation(null); setBatteries([]); }}
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
              <Activity className="text-emerald-400" size={20} />
              Your Battery Swap Stations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <BatteryCharging className="mx-auto mb-2 text-gray-600" size={32} />
                  <p>No swap stations found</p>
                </div>
              ) : (
                stations.map((station) => (
                  <div 
                    key={station.swap_id}
                    onClick={() => handleSelectStation(station)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{station.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        station.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {station.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
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
        ) : (
          <div className="space-y-6">
            {/* Station Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Batteries</span>
                  <BatteryCharging className="text-emerald-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-white">{batteries.length}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Available</span>
                  <CheckCircle className="text-emerald-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-white">{batteries.filter(b => b.status === 'available').length}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Charging</span>
                  <Zap className="text-amber-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-white">{batteries.filter(b => b.status === 'charging').length}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Avg Health</span>
                  <TrendingUp className="text-blue-400" size={16} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {batteries.length > 0 
                    ? Math.round(batteries.reduce((sum, b) => sum + b.health_status, 0) / batteries.length) 
                    : 0}%
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setAddingBattery(!addingBattery)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-all border border-emerald-500/30"
              >
                <Plus size={16} />
                <span className="text-sm">Add Battery</span>
              </button>
              <button 
                onClick={handleSimulateCharge}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-all border border-amber-500/30"
              >
                <RefreshCw size={16} />
                <span className="text-sm">Simulate Charge</span>
              </button>
            </div>

            {/* Add Battery Form */}
            {addingBattery && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Register New Battery</h3>
                <form onSubmit={handleAddBattery} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Serial Number</label>
                    <input
                      type="text"
                      required
                      value={newBattery.serial_number}
                      onChange={(e) => setNewBattery({ ...newBattery, serial_number: e.target.value })}
                      className="input-field"
                      placeholder="CM-BATT-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Battery Type</label>
                    <select
                      value={newBattery.battery_type}
                      onChange={(e) => setNewBattery({ ...newBattery, battery_type: e.target.value })}
                      className="input-field bg-obsidian"
                    >
                      <option value="Lithium-Ion">Lithium-Ion</option>
                      <option value="Solid-State">Solid-State</option>
                      <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Bike Type</label>
                    <select
                      value={newBattery.bike_type}
                      onChange={(e) => setNewBattery({ ...newBattery, bike_type: e.target.value })}
                      className="input-field bg-obsidian"
                    >
                      <option value="">Universal</option>
                      <option value="Electric Scooter">Electric Scooter</option>
                      <option value="Electric Motorcycle">Electric Motorcycle</option>
                      <option value="Electric Bicycle">Electric Bicycle</option>
                      <option value="Electric Rickshaw">Electric Rickshaw</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Bike Model</label>
                    <input
                      type="text"
                      value={newBattery.bike_model}
                      onChange={(e) => setNewBattery({ ...newBattery, bike_model: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Honda PCX, Niu NQi"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Charge Level (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newBattery.charge_level}
                      onChange={(e) => setNewBattery({ ...newBattery, charge_level: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Health Status (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newBattery.health_status}
                      onChange={(e) => setNewBattery({ ...newBattery, health_status: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-400">Initial Status</label>
                    <select
                      value={newBattery.status}
                      onChange={(e) => setNewBattery({ ...newBattery, status: e.target.value })}
                      className="input-field bg-obsidian"
                    >
                      <option value="available">Available</option>
                      <option value="charging">Charging</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="flex-1 btn-primary">Add Battery</button>
                    <button 
                      type="button"
                      onClick={() => setAddingBattery(false)}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search batteries by serial number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            {/* Battery List */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Battery Inventory ({filteredBatteries.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBatteries.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <BatteryCharging className="mx-auto mb-2 text-gray-600" size={32} />
                    <p>No batteries found</p>
                  </div>
                ) : (
                  filteredBatteries.map((battery) => (
                    <div key={battery.battery_id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getBatteryStatusColor(battery.status)}`}>
                          {battery.status === 'available' && <CheckCircle size={12} />}
                          {battery.status === 'charging' && <Zap size={12} />}
                          {battery.status === 'maintenance' && <AlertTriangle size={12} />}
                          {battery.status}
                        </span>
                        <span className={`text-sm font-semibold ${getHealthColor(battery.health_status)}`}>
                          {battery.health_status}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-400">Serial Number</p>
                          <p className="text-sm font-mono text-white">{battery.serial_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Type</p>
                          <p className="text-sm text-white">{battery.battery_type}</p>
                        </div>
                        {(battery.bike_type || battery.bike_model) && (
                          <div>
                            <p className="text-xs text-gray-400">Compatible</p>
                            <p className="text-sm text-white">{battery.bike_type || 'Universal'}{battery.bike_model ? ` - ${battery.bike_model}` : ''}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Charge</p>
                            <p className="text-sm text-white">{battery.charge_level}%</p>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                battery.charge_level >= 50 ? 'bg-emerald-400' : 
                                battery.charge_level >= 20 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${battery.charge_level}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10 items-center">
                        <span className="text-xs text-gray-400">Status:</span>
                        <select
                          value={battery.status}
                          onChange={(e) => handleUpdateBatteryStatus(battery.battery_id, e.target.value)}
                          className={`flex-1 text-xs px-2 py-1.5 bg-white/5 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-white cursor-pointer ${
                            battery.status === 'available' ? 'border-emerald-500/30 text-emerald-400' :
                            battery.status === 'charging' ? 'border-amber-500/30 text-amber-400' :
                            battery.status === 'swapped' ? 'border-blue-500/30 text-blue-400' :
                            'border-red-500/30 text-red-400'
                          }`}
                        >
                          <option value="available" className="bg-obsidian text-emerald-400">Available</option>
                          <option value="charging" className="bg-obsidian text-amber-400">Charging</option>
                          <option value="swapped" className="bg-obsidian text-blue-400">Swapped</option>
                          <option value="maintenance" className="bg-obsidian text-red-400">Maintenance</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatteryInventory;