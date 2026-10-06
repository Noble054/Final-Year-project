import { useState, useEffect, useContext } from 'react';
import axios from 'axios';

import AuthContext from '../context/AuthContext';
import { Zap, BatteryCharging, Plus, MapPin, Trash2, ArrowLeft, Loader2, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getMapTileConfig } from '../utils/mapTileLayer';
import { resolveUserLocation } from '../utils/geoLocator';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ChangeView = ({ center }) => {
  const map = useMap();
  if (center) {
    map.flyTo(center, 14, { duration: 1.5 });
  }
  return null;
};

const LocationMarker = ({ formData, setFormData }) => {
  useMapEvents({
    click(e) {
      setFormData(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
    },
  });

  const position = formData.latitude && formData.longitude 
    ? [formData.latitude, formData.longitude] 
    : null;

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const ManageStations = () => {
  const { user } = useContext(AuthContext);
  const [stations, setStations] = useState({ chargingStations: [], swapStations: [] });
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'charging',
    latitude: '',
    longitude: '',
    slots: 4,
    price: 0.30
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // BMS States
  const [selectedSwapHub, setSelectedSwapHub] = useState(null);
  const [hubBatteries, setHubBatteries] = useState([]);
  const [loadingBatteries, setLoadingBatteries] = useState(false);
  const [newBattery, setNewBattery] = useState({
    serial_number: '',
    battery_type: 'Lithium-Ion',
    charge_level: 100,
    health_status: 100,
    status: 'available',
    bike_type: '',
    bike_model: ''
  });

  const fetchHubBatteries = async (hubId) => {
    setLoadingBatteries(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${hubId}/batteries`, config);
      setHubBatteries(data);
    } catch (error) {
      console.error('Error fetching hub batteries', error);
    } finally {
      setLoadingBatteries(false);
    }
  };

  const handleRegisterBattery = async (e) => {
    e.preventDefault();
    if (!newBattery.serial_number.trim() || !selectedSwapHub) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${selectedSwapHub.swap_id}/batteries`, newBattery, config);
      
      setNewBattery({
        serial_number: '',
        battery_type: 'Lithium-Ion',
        charge_level: 100,
        health_status: 100,
        status: 'available',
        bike_type: '',
        bike_model: ''
      });
      fetchHubBatteries(selectedSwapHub.swap_id);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register battery');
    }
  };

  const handleUpdateBatteryStatus = async (batteryId, newStatus) => {
    if (!selectedSwapHub) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${import.meta.env.VITE_API_URL}/stations/batteries/${batteryId}`, { status: newStatus }, config);
      fetchHubBatteries(selectedSwapHub.swap_id);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating battery status', error);
      alert('Failed to update battery status');
    }
  };

  const handleSimulateCharge = async () => {
    if (!selectedSwapHub) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/stations/batteries/simulate-charge`, {}, config);
      fetchHubBatteries(selectedSwapHub.swap_id);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error simulating charge', error);
      alert('Failed to simulate charge cycle');
    }
  };

  useEffect(() => {
    const fetchMyStations = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
        setStations(data);
        
        // If a hub is currently selected, refresh its details from the list
        if (selectedSwapHub) {
          const updatedHub = data.swapStations.find(h => h.swap_id === selectedSwapHub.swap_id);
          if (updatedHub) {
            setSelectedSwapHub(updatedHub);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stations', error);
        setLoading(false);
      }
    };
    fetchMyStations();
  }, [user.token, refreshTrigger, selectedSwapHub]);

  const handleMapSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching for location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await resolveUserLocation();
      const newLoc = [loc.lat, loc.lng];
      setFormData(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng }));
      setMapCenter(newLoc);
    } catch (err) {
      console.error('Location error:', err);
      alert(err.message || 'Could not determine your location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/stations`, formData, config);
      setIsAdding(false);
      setRefreshTrigger(prev => prev + 1);
      setFormData({ name: '', type: 'charging', latitude: '', longitude: '', slots: 4, price: 0.30 });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create station');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isAdding) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neonCyan/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
              <Zap size={24} sm={28} />
            </div>
            <span className="truncate">
              {selectedSwapHub ? 'Hub Battery Inventory' : 'Manage Stations'}
            </span>
          </h1>
          <button 
            onClick={() => { setSelectedSwapHub(null); setIsAdding(!isAdding); }}
            className="btn-primary flex items-center gap-2 p-3 sm:px-6"
          >
            {isAdding || selectedSwapHub ? <ArrowLeft size={20}/> : <Plus size={20}/>}
            <span className="hidden sm:inline">
              {isAdding || selectedSwapHub ? 'Back' : 'Add New Station'}
            </span>
          </button>
        </div>

        {isAdding ? (
          <div className="glass-panel p-8 max-w-2xl mx-auto animate-slide-up">
            <h2 className="text-2xl font-heading font-bold mb-6">Register New Station</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Station Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. GreenCharge Hub"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Station Type</label>
                  <select
                    className="input-field bg-obsidian"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="charging">Charging Station</option>
                    <option value="swap">Battery Swap Hub</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-400">Station Location</label>
                  
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search for a city or address to center the map..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neonCyan/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleMapSearch(); } }}
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                    <button 
                      type="button"
                      onClick={handleMapSearch}
                      disabled={isSearching}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-colors flex items-center justify-center min-w-[48px]"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin text-neonCyan" /> : <Search size={16} className="text-neonCyan" />}
                    </button>
                    <button 
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      title="Use My Current Location"
                      className="px-3 py-2 bg-neonCyan/10 border border-neonCyan/30 hover:bg-neonCyan/20 text-neonCyan rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {isLocating ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                      <span className="hidden sm:inline">Locate Me</span>
                    </button>
                  </div>

                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-white/10 z-0 relative mt-2">
                    <MapContainer center={mapCenter || [7.9465, -1.0232]} zoom={6} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                      {mapCenter && <ChangeView center={mapCenter} />}
                      <TileLayer {...getMapTileConfig()} />
                      <LocationMarker formData={formData} setFormData={setFormData} />
                    </MapContainer>
                  </div>
                  {formData.latitude && formData.longitude ? (
                    <p className="text-xs text-neonCyan mt-2 font-mono flex items-center gap-1"><MapPin size={12}/> Coordinates Saved: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2 italic">Click anywhere on the map to drop the station pin.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    {formData.type === 'charging' ? 'Total Slots' : 'Initial Battery Stock'}
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.slots}
                    onChange={(e) => setFormData({...formData, slots: e.target.value})}
                  />
                </div>
                {formData.type === 'charging' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Price per kWh ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary h-14 text-lg">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Register Station'}
              </button>
            </form>
          </div>
        ) : selectedSwapHub ? (
          <div className="glass-panel p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
              <div>
                <button 
                  onClick={() => { setSelectedSwapHub(null); setHubBatteries([]); }}
                  className="text-sm text-gray-400 hover:text-white mb-2 flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft size={16} /> Back to Stations
                </button>
                <h2 className="text-2xl font-heading font-bold">{selectedSwapHub.name}</h2>
                <p className="text-sm text-gray-400 mt-1">Manage battery inventory, bays, and simulation charging triggers.</p>
              </div>
              
              <button 
                onClick={handleSimulateCharge}
                className="btn-secondary flex items-center gap-2"
              >
                <Zap size={18} className="text-neonCyan animate-pulse" /> Simulate Charge Step (+10%)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Battery Register Form */}
              <div className="glass-card p-6 h-fit space-y-4">
                <h3 className="text-lg font-heading font-bold text-white">Register New Battery Pack</h3>
                <form onSubmit={handleRegisterBattery} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Serial Number</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. CM-BATT-8888" 
                      className="input-field text-sm"
                      value={newBattery.serial_number}
                      onChange={e => setNewBattery({ ...newBattery, serial_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Chemistry Type</label>
                    <select 
                      className="input-field text-sm bg-obsidian text-white"
                      value={newBattery.battery_type}
                      onChange={e => setNewBattery({ ...newBattery, battery_type: e.target.value })}
                    >
                      <option value="Lithium-Ion">Lithium-Ion</option>
                      <option value="Solid-State">Solid-State</option>
                      <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium">Bike Type</label>
                      <select 
                        className="input-field text-sm bg-obsidian text-white"
                        value={newBattery.bike_type}
                        onChange={e => setNewBattery({ ...newBattery, bike_type: e.target.value })}
                      >
                        <option value="">Universal</option>
                        <option value="Electric Scooter">Electric Scooter</option>
                        <option value="Electric Motorcycle">Electric Motorcycle</option>
                        <option value="Electric Bicycle">Electric Bicycle</option>
                        <option value="Electric Rickshaw">Electric Rickshaw</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium">Bike Model</label>
                      <input 
                        type="text" 
                        className="input-field text-sm"
                        value={newBattery.bike_model}
                        onChange={e => setNewBattery({ ...newBattery, bike_model: e.target.value })}
                        placeholder="e.g. Honda PCX"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium">SoC (Charge %)</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        className="input-field text-sm"
                        value={newBattery.charge_level}
                        onChange={e => setNewBattery({ ...newBattery, charge_level: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium">SoH (Health %)</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        className="input-field text-sm"
                        value={newBattery.health_status}
                        onChange={e => setNewBattery({ ...newBattery, health_status: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Initial Status</label>
                    <select 
                      className="input-field text-sm bg-obsidian text-white"
                      value={newBattery.status}
                      onChange={e => setNewBattery({ ...newBattery, status: e.target.value })}
                    >
                      <option value="available">Available (In Hub)</option>
                      <option value="charging">Charging (In Bay)</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full btn-primary py-2.5 text-sm font-semibold">
                    Add Battery
                  </button>
                </form>
              </div>

              {/* Batteries Live list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-heading font-bold flex items-center gap-2 text-electricPurple">
                  <BatteryCharging size={20} /> Live Bay Grid ({hubBatteries.length} total)
                </h3>
                {loadingBatteries ? (
                  <p className="text-gray-400 text-sm">Loading battery list...</p>
                ) : hubBatteries.length === 0 ? (
                  <p className="text-gray-500 italic p-4 glass-card">No batteries connected to station bays.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hubBatteries.map(batt => (
                      <div 
                        key={batt.battery_id} 
                        className={`p-4 rounded-xl border transition-all ${
                          batt.status === 'available' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : batt.status === 'charging' 
                              ? 'bg-amber-500/5 border-amber-500/20' 
                              : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-sm font-semibold text-white">{batt.serial_number}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{batt.battery_type}</p>
                              {(batt.bike_type || batt.bike_model) && (
                                <p className="text-[10px] text-neonCyan mt-0.5">
                                  {batt.bike_type || 'Universal'}{batt.bike_model ? ` - ${batt.bike_model}` : ''}
                                </p>
                              )}
                            </div>
                            <select
                              value={batt.status}
                              onChange={e => handleUpdateBatteryStatus(batt.battery_id, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize border bg-black/40 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${
                                batt.status === 'available' ? 'text-emerald-400 border-emerald-500/30' :
                                batt.status === 'charging' ? 'text-amber-400 border-amber-500/30' :
                                batt.status === 'swapped' ? 'text-blue-400 border-blue-500/30' :
                                'text-red-400 border-red-500/30'
                              }`}
                            >
                              <option value="available" className="bg-obsidian text-emerald-400">Available</option>
                              <option value="charging" className="bg-obsidian text-amber-400">Charging</option>
                              <option value="swapped" className="bg-obsidian text-blue-400">Swapped</option>
                              <option value="maintenance" className="bg-obsidian text-red-400">Maintenance</option>
                            </select>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Charge Level</span>
                              <span className="font-bold text-white font-mono">{batt.charge_level}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  batt.charge_level >= 90 ? 'bg-emerald-400' : 'bg-amber-400'
                                }`} 
                                style={{ width: `${batt.charge_level}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between text-[11px] text-gray-500">
                              <span>State of Health (SoH)</span>
                              <span className="font-mono">{batt.health_status}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Charging Stations Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold flex items-center gap-2 text-neonCyan">
                <Zap size={20} /> Charging Stations
              </h3>
              {stations.chargingStations.length === 0 ? (
                <p className="text-gray-500 italic p-4 glass-card">No charging stations registered.</p>
              ) : (
                stations.chargingStations.map(s => (
                  <div key={s.station_id} className="glass-card p-6 flex justify-between items-center group">
                    <div>
                      <h4 className="text-lg font-bold text-white">{s.name}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {s.latitude}, {s.longitude}</span>
                        <span className="text-emerald-400">${s.price_per_kwh}/kWh</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Available Slots</p>
                        <p className="font-bold text-neonCyan">{s.available_slots} / {s.total_slots}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Swap Stations Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold flex items-center gap-2 text-electricPurple">
                <BatteryCharging size={20} /> Battery Swap Hubs
              </h3>
              {stations.swapStations.length === 0 ? (
                <p className="text-gray-500 italic p-4 glass-card">No swap hubs registered.</p>
              ) : (
                stations.swapStations.map(s => (
                  <div 
                    key={s.swap_id} 
                    onClick={() => { setSelectedSwapHub(s); fetchHubBatteries(s.swap_id); }}
                    className="glass-card p-6 flex justify-between items-center group cursor-pointer hover:border-electricPurple/40 transition-all"
                  >
                    <div>
                      <h4 className="text-lg font-bold text-white">{s.name}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {s.latitude}, {s.longitude}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Battery Stock</p>
                        <p className="font-bold text-electricPurple">{s.battery_stock}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStations;
