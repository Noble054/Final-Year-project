import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LayoutDashboard, Users, Zap, BatteryCharging, History, ArrowLeft, CalendarDays, Mail, Shield, UserRound, X, ExternalLink, Receipt, Clock3 } from 'lucide-react';

const AdminOverview = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/overview`, config);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data', error);
        setLoading(false);
      }
    };
    fetchOverview();
  }, [user.token]);

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
            <LayoutDashboard size={28} />
          </div>
          Admin Overview
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                <Users size={24} />
              </div>
              <p className="text-gray-400 font-medium">Total Users</p>
            </div>
            <p className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{data?.userCount}</p>
          </div>
          
          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
                <Zap size={24} />
              </div>
              <p className="text-gray-400 font-medium">Charging Stations</p>
            </div>
            <p className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-neonCyan to-blue-500">{data?.stationCount}</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-electricPurple">
                <BatteryCharging size={24} />
              </div>
              <p className="text-gray-400 font-medium">Swap Stations</p>
            </div>
            <p className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-electricPurple to-pink-500">{data?.swapCount}</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400">
                <BatteryCharging size={24} />
              </div>
              <p className="text-gray-400 font-medium">Avg Battery Health</p>
            </div>
            <p className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{data?.batteryDiagnostics?.avgHealth || 100}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <History className="text-neonCyan" size={20} />
              <h2 className="text-xl font-heading font-semibold">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-white/5 flex-1 max-h-[400px] overflow-y-auto">
              {data?.recentTransactions.map(tx => (
                <button
                  key={tx.transaction_id}
                  type="button"
                  onClick={() => setSelectedTransaction(tx)}
                  className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neonCyan transition-colors"
                >
                  <div>
                    <p className="font-medium text-white capitalize">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500 mt-1">{tx.user_name || `User ID: ${tx.user_id}`}</p>
                  </div>
                  <div className={`font-bold font-mono ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${tx.amount.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <Users className="text-electricPurple" size={20} />
              <h2 className="text-xl font-heading font-semibold">Recent Users</h2>
            </div>
            <div className="divide-y divide-white/5 flex-1 max-h-[400px] overflow-y-auto">
              {data?.recentUsers.map(u => (
                <button
                  key={u.user_id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electricPurple transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{u.email}</p>
                  </div>
                  <div className="text-xs px-2 py-1 bg-white/10 border border-white/10 rounded font-medium tracking-wide">
                    {u.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Battery Diagnostics Panel */}
        <div className="glass-panel p-6 space-y-6">
          <h2 className="text-xl font-heading font-semibold text-white flex items-center gap-2">
            <BatteryCharging size={22} className="text-emerald-400" /> BMS Platform Diagnostics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Battery Status Breakdown</h3>
              {data?.batteryDiagnostics?.statusBreakdown?.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No battery status data.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {data?.batteryDiagnostics?.statusBreakdown?.map(st => (
                    <div key={st.status} className="flex justify-between items-center text-sm font-mono">
                      <span className="capitalize text-gray-400">{st.status}</span>
                      <span className="font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs">{st.count} packs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-black/20 border border-white/5 p-4 rounded-xl">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Critical Attention Required (Health &lt; 80%)</h3>
              {data?.batteryDiagnostics?.lowHealthBatteries?.length === 0 ? (
                <p className="text-sm text-emerald-400 mt-2 font-medium">✓ All platform batteries are in optimal health (SoH &gt;= 80%)</p>
              ) : (
                <div className="divide-y divide-white/5 max-h-[160px] overflow-y-auto mt-2 font-mono">
                  {data?.batteryDiagnostics?.lowHealthBatteries?.map(batt => (
                    <div key={batt.battery_id} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-bold">{batt.serial_number}</span>
                        <span className="text-gray-500 ml-2">({batt.battery_type})</span>
                        <span className="text-gray-500 ml-2">Hub ID: #{batt.swap_id || 'unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 capitalize">{batt.status}</span>
                        <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">{batt.health_status}% SoH</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedUser(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="glass-panel relative w-full max-w-lg border border-white/10 bg-obsidian/95 p-6 shadow-2xl animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              aria-label="Close user details"
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-5 pr-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-electricPurple/30 bg-electricPurple/10 text-electricPurple">
                {selectedUser.role === 'Admin' ? <Shield size={26} /> : <UserRound size={26} />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-electricPurple">User Profile</p>
                <h2 id="user-details-title" className="mt-1 text-2xl font-heading font-bold text-white">{selectedUser.name}</h2>
              </div>
            </div>

            <div className="grid gap-3 py-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Mail size={16} /><span className="text-xs uppercase tracking-wider">Email</span></div>
                <p className="break-all text-sm text-white">{selectedUser.email || 'No email registered'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Shield size={16} /><span className="text-xs uppercase tracking-wider">Role</span></div>
                <p className="text-sm text-white">{selectedUser.role}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><CalendarDays size={16} /><span className="text-xs uppercase tracking-wider">Registered</span></div>
                <p className="text-sm text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><UserRound size={16} /><span className="text-xs uppercase tracking-wider">User ID</span></div>
                <p className="font-mono text-sm text-white">#{selectedUser.user_id}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Close
              </button>
              <Link
                to="/admin/users"
                onClick={() => setSelectedUser(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-electricPurple to-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Manage User <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTransaction(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="glass-panel relative w-full max-w-lg border border-white/10 bg-obsidian/95 p-6 shadow-2xl animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              aria-label="Close transaction details"
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-5 pr-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neonCyan/30 bg-neonCyan/10 text-neonCyan">
                <Receipt size={26} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neonCyan">Transaction Details</p>
                <h2 id="transaction-details-title" className="mt-1 text-2xl font-heading font-bold capitalize text-white">
                  {selectedTransaction.type}
                </h2>
              </div>
            </div>

            <div className="grid gap-3 py-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Receipt size={16} /><span className="text-xs uppercase tracking-wider">Description</span></div>
                <p className="text-sm text-white">{selectedTransaction.description || 'No description provided'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><span className="text-xs uppercase tracking-wider">Amount</span></div>
                <p className={`font-mono text-lg font-bold ${selectedTransaction.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${Number(selectedTransaction.amount).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><UserRound size={16} /><span className="text-xs uppercase tracking-wider">Made By</span></div>
                <p className="text-sm font-semibold text-white">{selectedTransaction.user_name || 'Unknown user'}</p>
                <p className="mt-1 break-all text-xs text-gray-500">{selectedTransaction.user_email || `User ID: ${selectedTransaction.user_id}`}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Clock3 size={16} /><span className="text-xs uppercase tracking-wider">Created</span></div>
                <p className="text-sm text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><span className="text-xs uppercase tracking-wider">Transaction ID</span></div>
                <p className="font-mono text-sm text-white">#{selectedTransaction.transaction_id}</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
