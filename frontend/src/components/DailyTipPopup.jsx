import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Lightbulb, X } from 'lucide-react';

const tips = [
  {
    title: 'Plan ahead',
    message: 'Reserve your charging slot early to get the arrival time that suits you best.',
  },
  {
    title: 'Keep an eye on battery health',
    message: 'Regularly checking battery health can help you spot performance changes before they become a problem.',
  },
  {
    title: 'Avoid missed reservations',
    message: 'Check in on time to keep your reservation active and avoid missed-reservation penalties.',
  },
  {
    title: 'Compare stations',
    message: 'Use the station map to compare availability, charger types, prices, and operating hours.',
  },
  {
    title: 'Keep your wallet ready',
    message: 'Maintain enough wallet balance for reservation deposits and session completion fees.',
  },
];

const fallbackTip = (dateKey) => tips[Math.floor(new Date(`${dateKey}T00:00:00Z`).getTime() / 86400000) % tips.length];

const getDateKey = () => new Date().toISOString().slice(0, 10);

const DailyTipPopup = () => {
  const { user } = useContext(AuthContext);
  const dateKey = getDateKey();
  const storageKey = user ? `chargemate-daily-tip-${user._id || user.id || user.name}` : '';
  const [dismissed, setDismissed] = useState(() => user ? localStorage.getItem(storageKey) === dateKey : true);
  const [tip, setTip] = useState(() => fallbackTip(dateKey));

  useEffect(() => {
    if (!user || dismissed) return;

    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    const loadDynamicTip = async () => {
      try {
        let dynamicTip = fallbackTip(dateKey);

        if (user.role === 'EV Driver') {
          const [walletResponse, reservationsResponse, batteryResponse] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/wallet`, config),
            axios.get(`${import.meta.env.VITE_API_URL}/reservations`, config),
            axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap/driver/active-battery`, config)
          ]);
          const walletBalance = Number(walletResponse.data.balance || 0);
          const reservations = reservationsResponse.data || [];
          const activeBattery = batteryResponse.data;
          const pendingReservation = reservations.find((reservation) => reservation.status === 'pending');

          if (walletBalance < 10) {
            dynamicTip = { title: 'Top up before booking', message: `Your wallet balance is $${walletBalance.toFixed(2)}. Keep enough funds available for your next reservation deposit.` };
          } else if (pendingReservation) {
            dynamicTip = { title: 'Reservation reminder', message: `You have a pending reservation at ${pendingReservation.station_name || 'your selected station'}. Check in on time to avoid a missed-reservation penalty.` };
          } else if (activeBattery && activeBattery.charge_level <= 30) {
            dynamicTip = { title: 'Battery ready to swap', message: `Your active battery is at ${activeBattery.charge_level}% charge. You can now look for a nearby swap station.` };
          }
        } else if (user.role === 'Station Operator') {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/stations/me`, config);
          const chargingStations = response.data.chargingStations || [];
          const busyStation = chargingStations.find((station) => station.total_slots > 0 && station.available_slots / station.total_slots <= 0.25);
          dynamicTip = busyStation
            ? { title: 'Station needs attention', message: `${busyStation.name} is at high capacity. Review its slot availability to keep drivers informed.` }
            : { title: 'Monitor availability', message: 'Keeping station availability accurate helps drivers choose your services with confidence.' };
        } else if (user.role === 'Admin') {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/overview`, config);
          dynamicTip = { title: 'Platform snapshot', message: `ChargeMate currently has ${response.data.userCount} users, ${response.data.stationCount} charging stations, and ${response.data.swapCount} swap stations.` };
        }

        setTip(dynamicTip);
      } catch (error) {
        console.error('Error loading daily tip context', error);
      }
    };

    loadDynamicTip();
  }, [user, dismissed, dateKey]);

  const dismissTip = () => {
    localStorage.setItem(storageKey, getDateKey());
    setDismissed(true);
  };

  if (!user || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="daily-tip-title" className="glass-panel relative w-full max-w-md border border-neonCyan/20 bg-obsidian/95 p-6 shadow-2xl animate-scale-up">
        <button type="button" onClick={dismissTip} aria-label="Close daily tip" className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
          <X size={20} />
        </button>
        <div className="flex items-center gap-4 pr-8">
          <div className="rounded-2xl border border-neonCyan/30 bg-neonCyan/10 p-4 text-neonCyan">
            <Lightbulb size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neonCyan">Daily Tip</p>
            <h2 id="daily-tip-title" className="mt-1 text-2xl font-heading font-bold text-white">{tip.title}</h2>
          </div>
        </div>
        <p className="mt-6 leading-relaxed text-gray-300">{tip.message}</p>
        <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
          <button type="button" onClick={dismissTip} className="btn-primary px-5 py-2.5 text-sm">Got it</button>
        </div>
      </div>
    </div>
  );
};

export default DailyTipPopup;
