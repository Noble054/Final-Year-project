import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, MapPin, ArrowLeft, Filter, Plus, TrendingUp, AlertTriangle, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';

const Reservations = () => {
  const { user } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/reservations`, config);
        setReservations(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reservations', error);
        setLoading(false);
      }
    };
    fetchReservations();
  }, [user.token, refreshTrigger]);

  const handleAction = async (id, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/reservations/${id}/${action}`, {}, config);
      setRefreshTrigger(prev => prev + 1); 
    } catch (error) {
      console.error(`Failed to ${action} session`, error);
      alert(`Failed to ${action} session`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'missed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'missed':
        return <AlertTriangle size={16} />;
      case 'pending':
        return <Calendar size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const filteredAndSortedReservations = () => {
    let filtered = filterStatus === 'all' 
      ? reservations 
      : reservations.filter(res => res.status === filterStatus);

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.slot_time) - new Date(a.slot_time);
      } else if (sortBy === 'status') {
        const statusOrder = { pending: 0, confirmed: 1, completed: 2, missed: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return 0;
    });
  };

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const getReservationStats = () => {
    const total = reservations.length;
    const completed = reservations.filter(r => r.status === 'completed').length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const missed = reservations.filter(r => r.status === 'missed').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    
    return { total, completed, pending, missed, confirmed };
  };

  const stats = getReservationStats();

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  const displayReservations = filteredAndSortedReservations();

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-electricPurple/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neonCyan/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-electricPurple">
              <Calendar size={28} />
            </div>
            <span className="text-2xl sm:text-4xl">My Reservations</span>
          </h1>
          <button 
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
          >
            <Plus size={16} />
            <span className="text-sm">New Reservation</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neonCyan/10 blur-[30px] rounded-full group-hover:bg-neonCyan/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Total</span>
              <Calendar className="text-neonCyan" size={16} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">All reservations</p>
          </div>

          <div className="glass-card p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-[30px] rounded-full group-hover:bg-yellow-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Pending</span>
              <Clock className="text-yellow-400" size={16} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-xs text-gray-400">Awaiting check-in</p>
          </div>

          <div className="glass-card p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-[30px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Active</span>
              <Zap className="text-blue-400" size={16} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
            <p className="text-xs text-gray-400">In progress</p>
          </div>

          <div className="glass-card p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Completed</span>
              <CheckCircle className="text-emerald-400" size={16} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
            <p className="text-xs text-gray-400">Finished sessions</p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neonCyan/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neonCyan/50"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          {stats.missed > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm text-red-400">{stats.missed} missed reservation(s)</span>
            </div>
          )}
        </div>

        {/* Reservations List */}
        <div className="space-y-4">
          {displayReservations.length === 0 ? (
            <div className="glass-card p-10 text-center flex flex-col items-center">
              <Calendar size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-heading font-semibold text-white mb-2">No Reservations Found</h3>
              <p className="text-gray-400 mb-6">
                {filterStatus !== 'all' 
                  ? `No reservations with status "${filterStatus}"` 
                  : "You haven't booked any charging slots yet."}
              </p>
              <button onClick={() => navigate('/map')} className="btn-secondary">Find a Station</button>
            </div>
          ) : (
            displayReservations.map(res => (
              <div key={res.reservation_id} className="glass-card overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${getStatusColor(res.status)}`}>
                          {getStatusIcon(res.status)}
                          {res.status}
                        </span>
                        {res.status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs flex items-center gap-1">
                            <Clock size={12} />
                            Action Required
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-heading font-bold text-white mb-2">{res.station_name}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-electricPurple" /> 
                          {new Date(res.slot_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-neonCyan" /> 
                          {new Date(res.slot_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-emerald-400" /> 
                          Charging Station
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto shrink-0">
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => handleAction(res.reservation_id, 'checkin')}
                          className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2"
                        >
                          <MapPin size={18} /> Check In Now
                        </button>
                      )}
                      {res.status === 'confirmed' && (
                        <button 
                          onClick={() => handleAction(res.reservation_id, 'complete')}
                          className="flex-1 md:flex-none bg-white hover:bg-gray-200 text-obsidian font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} /> Finish Session
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(res.reservation_id)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                      >
                        {expandedCard === res.reservation_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedCard === res.reservation_id && (
                  <div className="px-6 pb-6 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Reservation ID</p>
                        <p className="text-sm font-mono text-white">#{res.reservation_id}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Deposit Amount</p>
                        <p className="text-sm font-semibold text-white">${res.deposit_amount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Booked On</p>
                        <p className="text-sm text-white">{new Date(res.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Expected Duration</p>
                        <p className="text-sm text-white">~45 minutes</p>
                      </div>
                    </div>
                    {res.status === 'missed' && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-400" />
                        <p className="text-sm text-red-400">This reservation was missed. The deposit may have been forfeited.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
