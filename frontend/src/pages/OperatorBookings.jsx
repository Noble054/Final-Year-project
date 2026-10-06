import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Search, Filter, Clock, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const OperatorBookings = () => {
  const { user } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/reservations/operator`, config);
        setReservations(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching operator reservations', error);
        setLoading(false);
      }
    };
    fetchReservations();
  }, [user.token]);

  const filteredReservations = reservations.filter(res => 
    res.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.station_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-cyan-400">
            <Calendar size={28} />
          </div>
          Station Bookings
        </h1>
        
        <p className="text-gray-400 max-w-2xl">
          View and manage upcoming driver reservations across all your registered charging locations.
        </p>

        <div className="glass-panel overflow-hidden mt-8">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search driver or station name..." 
                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
              <Filter size={18} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center text-cyan-400">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
                 <Calendar size={48} className="text-white/10" />
                 <p>No reservations found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-sm text-gray-400 uppercase tracking-wider">
                    <th className="p-4 font-medium">Driver</th>
                    <th className="p-4 font-medium">Station</th>
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium">Deposit</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReservations.map((res) => (
                    <tr key={res.reservation_id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <p className="font-semibold text-white">{res.user_name}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin size={14} className="text-cyan-400" />
                          <span>{res.station_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock size={14} className="text-gray-500" />
                          <span>{new Date(res.slot_time).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-cyan-400">
                        ${res.deposit_amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        {res.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock size={12}/> Pending</span>}
                        {res.status === 'confirmed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><CheckCircle size={12}/> Confirmed</span>}
                        {res.status === 'completed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20"><CheckCircle size={12}/> Completed</span>}
                        {res.status === 'missed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12}/> Missed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorBookings;
