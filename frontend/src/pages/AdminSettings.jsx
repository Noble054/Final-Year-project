import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Settings, Sliders, Shield, Bell, Loader2, Check } from 'lucide-react';

const AdminSettings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/system-settings`, config);
        setSettings(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user.token]);

  const updateSetting = (key, value) => {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/admin/system-settings`, settings, config);
      setSettings(response.data);
      setMessage('System settings saved successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-300">
            <Settings size={28} />
          </div>
          System Settings
        </h1>
        
        <p className="text-gray-400 max-w-2xl">
          Configure global platform rules, pricing models, penalty fees, and security policies.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
           <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <Sliders className="text-neonCyan" size={20} />
              <h2 className="text-xl font-heading font-semibold">Pricing & Fees</h2>
            </div>
            <form onSubmit={saveSettings} className="p-6 space-y-6">
               {loading ? (
                 <div className="py-8 flex items-center justify-center text-gray-400"><Loader2 className="animate-spin text-neonCyan" size={28} /></div>
               ) : error ? (
                 <p className="text-sm text-red-400">{error}</p>
               ) : (
                 <>
               <div>
                 <label htmlFor="reservationDeposit" className="block text-sm font-medium text-gray-400 mb-2">Reservation Deposit ($)</label>
                 <input id="reservationDeposit" type="number" min="0" step="0.01" value={settings?.reservationDeposit ?? ''} onChange={(event) => updateSetting('reservationDeposit', event.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neonCyan transition-colors" />
               </div>
               <div>
                 <label htmlFor="sessionCompletionFee" className="block text-sm font-medium text-gray-400 mb-2">Session Completion Fee ($)</label>
                 <input id="sessionCompletionFee" type="number" min="0" step="0.01" value={settings?.sessionCompletionFee ?? ''} onChange={(event) => updateSetting('sessionCompletionFee', event.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neonCyan transition-colors" />
               </div>
               <div>
                 <label htmlFor="batterySwapFee" className="block text-sm font-medium text-gray-400 mb-2">Battery Swap Fee ($)</label>
                 <input id="batterySwapFee" type="number" min="0" step="0.01" value={settings?.batterySwapFee ?? ''} onChange={(event) => updateSetting('batterySwapFee', event.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neonCyan transition-colors" />
               </div>
               <div>
                 <label htmlFor="penaltyAmount" className="block text-sm font-medium text-gray-400 mb-2">Missed Reservation Penalty ($)</label>
                 <input id="penaltyAmount" type="number" min="0" step="0.01" value={settings?.penaltyAmount ?? ''} onChange={(event) => updateSetting('penaltyAmount', event.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neonCyan transition-colors" />
               </div>
               <div>
                 <label htmlFor="penaltyTimeWindowMinutes" className="block text-sm font-medium text-gray-400 mb-2">Penalty Time Window (minutes)</label>
                 <input id="penaltyTimeWindowMinutes" type="number" min="0" step="1" value={settings?.penaltyTimeWindowMinutes ?? ''} onChange={(event) => updateSetting('penaltyTimeWindowMinutes', event.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neonCyan transition-colors" />
               </div>
               <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-neonCyan to-blue-500 text-obsidian font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Save Changes
               </button>
                 </>
               )}
               {message && <p className="text-sm text-emerald-400">{message}</p>}
            </form>
          </div>
          
          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <Shield className="text-electricPurple" size={20} />
              <h2 className="text-xl font-heading font-semibold">Security Settings</h2>
            </div>
            <div className="p-8 space-y-5">
               <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
                 <Shield size={22} />
                 <div><p className="font-semibold">Protected admin controls</p><p className="text-xs text-emerald-300/70">Only authenticated administrators can change platform settings.</p></div>
               </div>
               <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-gray-400">
                 <Bell size={20} /><p className="text-sm">Financial changes are applied to new charges and penalties immediately.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
