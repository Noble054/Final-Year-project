import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Clock, FileWarning, Loader2, Send } from 'lucide-react';

const Complaints = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ category: 'Charging Station', subject: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/complaints`, config);
      setComplaints(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/complaints`, form, config);
      setForm({ category: 'Charging Station', subject: '', description: '' });
      setMessage('Your complaint has been submitted for review.');
      await fetchComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'resolved') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
    if (status === 'rejected') return 'border-red-500/20 bg-red-500/10 text-red-400';
    if (status === 'in_review') return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
    return 'border-amber-500/20 bg-amber-500/10 text-amber-400';
  };

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <header>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400"><FileWarning size={28} /></div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold">Complaints</h1>
              <p className="text-gray-400 mt-1">Report a problem and follow its progress.</p>
            </div>
          </div>
        </header>

        {(message || error) && (
          <div className={`rounded-xl border p-4 text-sm ${message ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
            {message || error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-8">
          <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-5 h-fit">
            <div>
              <h2 className="text-xl font-heading font-semibold">Submit a Complaint</h2>
              <p className="mt-1 text-sm text-gray-400">Include enough detail to help the support team investigate.</p>
            </div>
            <div>
              <label htmlFor="complaint-category" className="block text-sm text-gray-400 mb-2">Category</label>
              <select id="complaint-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neonCyan">
                <option>Charging Station</option>
                <option>Battery Swap</option>
                <option>Reservation</option>
                <option>Payment or Wallet</option>
                <option>Account</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="complaint-subject" className="block text-sm text-gray-400 mb-2">Subject</label>
              <input id="complaint-subject" required maxLength={150} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Briefly describe the issue" className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-neonCyan" />
            </div>
            <div>
              <label htmlFor="complaint-description" className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea id="complaint-description" required maxLength={2000} rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell us what happened..." className="w-full resize-none bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-neonCyan" />
            </div>
            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neonCyan to-blue-500 py-3 font-bold text-obsidian transition-opacity hover:opacity-90 disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Submit Complaint
            </button>
          </form>

          <section className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3"><AlertTriangle className="text-neonCyan" size={20} /><h2 className="text-xl font-heading font-semibold">My Complaints</h2></div>
            {loading ? <div className="p-12 flex justify-center text-gray-400"><Loader2 className="animate-spin" /></div> : complaints.length === 0 ? <div className="p-12 text-center text-gray-500"><FileWarning size={40} className="mx-auto mb-3 text-white/10" /><p>No complaints submitted yet.</p></div> : <div className="divide-y divide-white/5">{complaints.map((complaint) => <article key={complaint.complaint_id} className="p-5 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-white">{complaint.subject}</p><p className="text-xs text-gray-500 mt-1">{complaint.category} · #{complaint.complaint_id}</p></div><span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(complaint.status)}`}>{complaint.status === 'resolved' ? <CheckCircle size={14} /> : <Clock size={14} />}{complaint.status.replace('_', ' ')}</span></div><p className="text-sm leading-relaxed text-gray-400">{complaint.description}</p><p className="text-xs text-gray-600">Submitted {new Date(complaint.created_at).toLocaleString()}</p></article>)}</div>}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
