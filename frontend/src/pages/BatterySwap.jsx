import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  BatteryCharging, CreditCard, ArrowLeft, Battery, Cpu, 
  X, CheckCircle, AlertTriangle, Info, Zap, Clock, TrendingUp, 
  ArrowRight, Shield, Percent, Ban as LockIcon 
} from 'lucide-react';

const BatterySwapDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  
  const [station, setStation] = useState(null);
  const [stationBatteries, setStationBatteries] = useState([]);
  const [activeBattery, setActiveBattery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [showBatteryPopup, setShowBatteryPopup] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [stationRes, batteriesRes, activeBatteryRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/stations/swap/${id}`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/${id}/batteries`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/driver/active-battery`, config)
        ]);
        setStation(stationRes.data);
        setStationBatteries(batteriesRes.data);
        setActiveBattery(activeBatteryRes.data);
      } catch (error) {
        console.error('Error fetching swap station details', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user.token, refreshTrigger]);

  const handleBatterySelect = (battery) => {
    setSelectedBattery(battery);
    setShowBatteryPopup(true);
  };

  const handlePopupClose = () => {
    setShowBatteryPopup(false);
    setSelectedBattery(null);
  };

  const handleConfirmSwap = async () => {
    if (!selectedBattery) return;
    
    // Check if user can swap based on depletion rule
    if (!canSwap()) {
      alert(getSwapRestrictionMessage());
      return;
    }
    
    setShowBatteryPopup(false);
    setSwapping(true);
    setSuccessMsg('');
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/reservations/swap`, {
        swap_id: Number(id),
        battery_id: selectedBattery.battery_id
      }, config);
      
      // Delay so driver can visualize the physical process simulation
      setTimeout(() => {
        setSuccessMsg(`Swap Completed! Battery equipped: ${selectedBattery.serial_number} (${selectedBattery.charge_level}% SoC)`);
        setRefreshTrigger(prev => prev + 1);
        setSwapping(false);
        setSelectedBattery(null);
      }, 2500);

    } catch (error) {
      alert(error.response?.data?.message || 'Swap failed');
      setSwapping(false);
      setSelectedBattery(null);
    }
  };

  const getBatteryQuality = (health, charge) => {
    if (health >= 90 && charge >= 90) return { label: 'Excellent', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
    if (health >= 75 && charge >= 75) return { label: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    if (health >= 60 && charge >= 60) return { label: 'Fair', color: 'text-amber-400', bgColor: 'bg-amber-500/20' };
    return { label: 'Poor', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const canSwap = () => {
    if (!activeBattery) return true; // First-time users can always swap
    const depletedThreshold = 30;
    return activeBattery.charge_level <= depletedThreshold;
  };

  const getSwapRestrictionMessage = () => {
    if (!activeBattery) return null;
    const depletedThreshold = 30;
    if (activeBattery.charge_level > depletedThreshold) {
      return `Your current battery (${activeBattery.serial_number}) has ${activeBattery.charge_level}% charge. You can only swap when it's depleted (below ${depletedThreshold}%).`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center font-heading">
        <p className="animate-pulse">Loading swap hub telemetry...</p>
      </div>
    );
  }

  const availableBMS = stationBatteries.filter(b => b.status === 'available' && b.charge_level >= 70);

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-electricPurple/5 blur-[120px] rounded-full pointer-events-none"></div>

      {swapping && (
        <div className="fixed inset-0 bg-obsidian/95 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in text-center p-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-neonCyan/20 rounded-full blur-[40px] animate-pulse"></div>
            <div className="w-24 h-24 rounded-full border-4 border-neonCyan border-t-transparent animate-spin flex items-center justify-center">
              <BatteryCharging size={40} className="text-neonCyan animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">Executing Battery Swap Sequence</h2>
          <p className="text-gray-400 max-w-sm text-sm">
            Please stand by. Your depleted battery is being checked in to charge. Locking onto high-capacity battery from bay grid...
          </p>
        </div>
      )}

      {/* Battery Details Popup */}
      {showBatteryPopup && selectedBattery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <BatteryCharging className="text-neonCyan" size={24} />
                Battery Details
              </h3>
              <button 
                onClick={handlePopupClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quality Badge */}
              <div className={`p-4 rounded-xl border ${getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).color} size={20} />
                    <span className="text-sm font-medium text-gray-300">Overall Quality</span>
                  </div>
                  <span className={`text-lg font-bold ${getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).color}`}>
                    {getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).label}
                  </span>
                </div>
              </div>

              {/* Serial Number */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Serial Number</p>
                <p className="text-lg font-mono font-bold text-white">{selectedBattery.serial_number}</p>
              </div>

              {/* Battery Type */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Battery Type</p>
                <p className="text-lg font-semibold text-white">{selectedBattery.battery_type}</p>
              </div>

              {/* Bike Compatibility */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Bike Type</p>
                  <p className="text-sm font-semibold text-white">{selectedBattery.bike_type || 'Universal'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Bike Model</p>
                  <p className="text-sm font-semibold text-white">{selectedBattery.bike_model || 'All Models'}</p>
                </div>
              </div>

              {/* Charge Level */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="text-neonCyan" size={18} />
                    <span className="text-sm text-gray-400">Charge Level</span>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono">{selectedBattery.charge_level}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedBattery.charge_level >= 90 ? 'bg-emerald-400' : 
                      selectedBattery.charge_level >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                    }`} 
                    style={{ width: `${selectedBattery.charge_level}%` }}
                  ></div>
                </div>
              </div>

              {/* Health Status */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-electricPurple" size={18} />
                    <span className="text-sm text-gray-400">Health Status (SoH)</span>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono">{selectedBattery.health_status}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedBattery.health_status >= 90 ? 'bg-emerald-400' : 
                      selectedBattery.health_status >= 75 ? 'bg-blue-400' : 
                      selectedBattery.health_status >= 60 ? 'bg-amber-400' : 'bg-red-400'
                    }`} 
                    style={{ width: `${selectedBattery.health_status}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Status</span>
                  </div>
                  <span className="text-sm font-semibold text-white capitalize">{selectedBattery.status}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-1 mb-1">
                    <Cpu size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Bay ID</span>
                  </div>
                  <span className="text-sm font-semibold text-white font-mono">#{selectedBattery.battery_id}</span>
                </div>
              </div>

              {/* Swap Cost */}
              <div className="p-4 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Swap Cost</p>
                  <p className="text-xs text-gray-500 mt-1">Flat fee for this battery</p>
                </div>
                <p className="text-2xl font-bold text-emerald-400 font-mono">$15.00</p>
              </div>

              {/* Depletion Rule Info */}
              {!canSwap() && (
                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-amber-400 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Swap Restricted</p>
                      <p className="text-xs text-amber-300 mt-1">
                        Your current battery has {activeBattery?.charge_level || 0}% charge. You can only swap when it's depleted (≤30%).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handlePopupClose}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmSwap}
                  disabled={!canSwap()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-electricPurple to-blue-600 hover:shadow-[0_0_20px_rgba(79,172,254,0.4)] rounded-lg transition-all text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!canSwap() ? 'Battery Not Depleted' : 'Confirm Swap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        <Link to="/map" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 font-medium">
          <ArrowLeft size={18} /> Back to Map
        </Link>

        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold">{station?.name || 'Swap Station'}</h1>
            <p className="text-gray-400 mt-1">Available Batteries: {stationBatteries.filter(b => b.status === 'available').length}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 font-mono">
              Hub ID: <span className="text-white">#{id}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 font-mono">
              Status: <span className="text-emerald-400 font-semibold uppercase">{station?.status}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Live Bay Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-semibold text-white flex items-center gap-2">
                  <Battery size={20} className="text-neonCyan" /> Available Batteries
                </h3>
                <div className="text-xs text-gray-400">
                  Click on any battery to view details
                </div>
              </div>
              
              {stationBatteries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No batteries connected to station bays.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stationBatteries.filter(b => b.status === 'available').map((batt) => (
                    <div 
                      key={batt.battery_id}
                      onClick={() => batt.charge_level >= 70 && canSwap() && handleBatterySelect(batt)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        batt.status === 'available' && batt.charge_level >= 70 && canSwap()
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40' 
                          : batt.status === 'available' && batt.charge_level >= 70 && !canSwap()
                            ? 'bg-amber-500/5 border-amber-500/20 opacity-60 cursor-not-allowed'
                            : batt.status === 'available' && batt.charge_level < 70
                              ? 'bg-amber-500/5 border-amber-500/20 opacity-60'
                              : 'bg-white/5 border-white/10 opacity-40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono text-sm font-semibold text-white">{batt.serial_number}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{batt.battery_type}</p>
                          {(batt.bike_type || batt.bike_model) && (
                            <p className="text-[10px] text-neonCyan mt-0.5">
                              {batt.bike_type || 'Universal'}{batt.bike_model ? ` - ${batt.bike_model}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono capitalize border ${
                            batt.status === 'available' && batt.charge_level >= 70
                              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                              : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          }`}>
                            {batt.charge_level >= 70 ? 'Available' : 'Low Charge'}
                          </div>
                          {!canSwap() && batt.charge_level >= 70 && (
                            <div className="flex items-center gap-1 text-[8px] text-amber-400">
                              <LockIcon size={10} />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Charge Level</span>
                          <span className="font-bold text-white font-mono">{batt.charge_level}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              batt.charge_level >= 90 ? 'bg-emerald-400' : 
                              batt.charge_level >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                            }`} 
                            style={{ width: `${batt.charge_level}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Health</span>
                          <span className="text-gray-300 font-mono">{batt.health_status}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap Panel */}
          <div>
            <div className="glass-panel p-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-semibold text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-electricPurple" /> Swap Summary
                </h3>
                
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold text-white">Flat Swap Fee</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Exchange depleted battery for charged (&gt;=70%)</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">$15.00</p>
                </div>

                {/* Selected Battery details */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Selected Battery</h4>
                  {selectedBattery ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-gray-300 font-bold">{selectedBattery.serial_number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono capitalize ${getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).bgColor} ${getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).color}`}>
                          {getBatteryQuality(selectedBattery.health_status, selectedBattery.charge_level).label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Charge:</span>
                          <span className="font-bold text-white font-mono">{selectedBattery.charge_level}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              selectedBattery.charge_level >= 90 ? 'bg-emerald-400' : 
                              selectedBattery.charge_level >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                            }`} 
                            style={{ width: `${selectedBattery.charge_level}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Health:</span>
                        <span className="font-bold text-white font-mono">{selectedBattery.health_status}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No battery selected. Click on an available battery to view details and proceed with swap.</p>
                  )}
                </div>

                {/* Equipped Battery details */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Equipped Battery (Vehicle)</h4>
                  {activeBattery ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-gray-300 font-bold">{activeBattery.serial_number}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono capitalize ${
                            activeBattery.charge_level <= 30 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {activeBattery.charge_level <= 30 ? 'Ready to Swap' : 'Not Depleted'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono capitalize">{activeBattery.status}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Current Charge:</span>
                          <span className={`font-bold font-mono ${activeBattery.charge_level <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{activeBattery.charge_level}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              activeBattery.charge_level <= 30 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`} 
                            style={{ width: `${activeBattery.charge_level}%` }}
                          ></div>
                        </div>
                        {activeBattery.charge_level > 30 && (
                          <p className="text-[10px] text-amber-400 mt-1">
                            ⚠️ Battery must be depleted (≤30%) to swap
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No active battery currently registered in your vehicle. A mock check-in will be simulated.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {successMsg && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-center text-sm font-medium animate-pulse">
                    {successMsg}
                  </div>
                )}
                
                {getSwapRestrictionMessage() && (
                  <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-center text-sm">
                    <AlertTriangle size={16} className="inline mr-2" />
                    {getSwapRestrictionMessage()}
                  </div>
                )}
                
                <button
                  onClick={handleConfirmSwap}
                  disabled={swapping || !selectedBattery || !canSwap()}
                  className="w-full relative overflow-hidden font-heading font-semibold tracking-wide text-white bg-gradient-to-r from-electricPurple to-blue-600 rounded-xl px-6 py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,172,254,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {swapping ? 'Executing Swapping Sequence...' : 
                   !canSwap() ? 'Battery Not Depleted' :
                   !selectedBattery ? 'Select a battery' :
                   `Swap Battery: ${selectedBattery.serial_number}`}
                </button>
                
                {!selectedBattery && (
                  <p className="text-center text-xs text-gray-400 mt-1">Select an available battery to proceed with the swap</p>
                )}
                {selectedBattery && !canSwap() && (
                  <p className="text-center text-xs text-amber-400 mt-1">You can only swap when your current battery is depleted (≤30% charge)</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BatterySwapDetail;