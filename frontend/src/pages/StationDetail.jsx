import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Zap, Clock, CreditCard, ArrowLeft, AlertTriangle } from 'lucide-react';

const StationDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [slotTime, setSlotTime] = useState('');
  const [station, setStation] = useState(null);
  const [bookingSettings, setBookingSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [stationResponse, settingsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/stations/${id}`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/reservations/settings`, config)
        ]);
        setStation(stationResponse.data);
        setBookingSettings(settingsResponse.data);
      } catch (error) {
        console.error('Error fetching station', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStation();
  }, [id, user.token]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!slotTime) return alert('Please select a time');
    
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/reservations/book`, {
        station_id: id,
        slot_time: slotTime
      }, config);
      
      navigate('/reservations');
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neonCyan/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/map" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft size={18} /> Back to Map
        </Link>

        <div className="glass-panel p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neonCyan mb-4 animate-pulse-glow">
              <Zap size={36} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white text-center">{station?.name || 'Loading Station...'}</h2>
            <p className="text-gray-400 mt-1">{station?.charger_type || 'Charging Hub'} • {station?.available_slots} slots available</p>
          </div>

          {station?.congestion?.isFull && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-300">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold">This station is currently full and highly congested.</p>
                <p className="mt-1 text-sm text-red-200/70">
                  {station.congestion.estimatedAvailableAt
                    ? `The next slot may be available around ${new Date(station.congestion.estimatedAvailableAt).toLocaleString()}.`
                    : 'No estimated release time is available yet. Please check again shortly.'}
                </p>
              </div>
            </div>
          )}

          {station?.congestion?.isHighlyCongested && !station?.congestion?.isFull && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-300">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold">This station is highly congested.</p>
                <p className="mt-1 text-sm text-amber-200/70">Only {station.available_slots} slot{station.available_slots === 1 ? '' : 's'} remain available.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock size={16} className="text-neonCyan" /> Arrival Time
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
              />
            </div>

            <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-emerald-400">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-heading font-semibold text-white">Deposit Required</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {bookingSettings ? `$${Number(bookingSettings.reservationDeposit).toFixed(2)}` : 'Loading...'}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Deducted from your wallet now. The remainder is charged after your session.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || station?.congestion?.isFull}
              className="w-full btn-primary mt-4"
            >
              {loading ? 'Processing...' : station?.congestion?.isFull ? 'Station Full' : 'Confirm Reservation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StationDetail;
