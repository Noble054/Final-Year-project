import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Trash2, 
  DollarSign, 
  X, 
  Check, 
  ArrowLeft, 
  Shield, 
  User, 
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);

  const [selectedUserForReview, setSelectedUserForReview] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/users?search=${searchTerm}&role=${roleFilter}`, 
        config
      );
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  // Flash alerts auto-dismiss
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle User Delete
  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    try {
      setActionLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/users/${selectedUserForDelete.user_id}`,
        config
      );
      setSuccess(`Successfully deleted user ${selectedUserForDelete.name}`);
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovalStatusUpdate = async (approvalStatus) => {
    if (!selectedUserForReview) return;
    try {
      setActionLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/users/${selectedUserForReview.user_id}/status`,
        { approval_status: approvalStatus },
        config
      );
      setSuccess(`${selectedUserForReview.name}'s application was ${approvalStatus}.`);
      setSelectedUserForReview(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update approval status');
    } finally {
      setActionLoading(false);
    }
  };

  // Render role badges
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Station Operator':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getApprovalBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const pendingUsers = users.filter((currentUser) => currentUser.approval_status === 'pending');
  const managedUsers = users.filter((currentUser) => currentUser.approval_status !== 'pending');

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      {/* Background radial Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation & Title */}
        <div className="space-y-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Overview
          </Link>
          <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-electricPurple">
              <Users size={28} />
            </div>
            User Management
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Review incoming registrations, manage account balances, and monitor approved users.
          </p>
        </div>

        {/* Banners */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl animate-fade-in">
            <Check size={20} className="shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl animate-fade-in">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!loading && pendingUsers.length > 0 && (
          <section className="glass-panel overflow-hidden border-amber-500/20">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-amber-500/[0.04] p-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-amber-400" size={22} />
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Pending Approvals</h2>
                  <p className="mt-1 text-sm text-gray-400">Review each profile before approving or rejecting the registration.</p>
                </div>
              </div>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
                {pendingUsers.length} awaiting review
              </span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.user_id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{pendingUser.name}</p>
                      <p className="truncate text-xs text-gray-500">{pendingUser.email || 'No email registered'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForReview(pendingUser)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-neonCyan/20 bg-neonCyan/10 px-3 py-2 text-xs font-semibold text-neonCyan transition-colors hover:bg-neonCyan/20"
                  >
                    <Eye size={15} /> Review Profile
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filter / Search Bar */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-electricPurple transition-colors text-sm"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <select 
                 value={roleFilter}
                 onChange={(e) => setRoleFilter(e.target.value)}
                 className="w-full md:w-auto bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-gray-300 focus:outline-none focus:border-electricPurple text-sm cursor-pointer"
               >
                  <option value="all">All Roles</option>
                  <option value="EV Driver">EV Drivers</option>
                  <option value="Station Operator">Station Operators</option>
                  <option value="Admin">Admins</option>
               </select>
            </div>
          </div>

          {/* User Data Table */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-electricPurple" size={36} />
              <p className="text-sm">Fetching users data...</p>
            </div>
          ) : managedUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
              <Users size={48} className="text-white/10" />
              <p className="font-medium text-lg">No users found</p>
              <p className="text-sm max-w-sm">No registered users matched your current search filters or keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase bg-white/[0.01]">
                    <th className="py-4 px-6">User / Email</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Approval Status</th>
                    <th className="py-4 px-6">Wallet Balance</th>
                    <th className="py-4 px-6">Registered On</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {managedUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400">
                            {u.role === 'Admin' ? <Shield size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{u.email || 'No email registered'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold px-2.5 py-1 border rounded-lg tracking-wide inline-block ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold px-2.5 py-1 border rounded-lg tracking-wide inline-block capitalize ${getApprovalBadgeClass(u.approval_status)}`}>
                          {u.approval_status || 'approved'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-emerald-400">
                        ${u.wallet_balance.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          title="View User Profile"
                          onClick={() => setSelectedUserForReview(u)}
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-neonCyan hover:text-white rounded-lg transition-colors inline-flex items-center"
                        >
                          <Eye size={15} />
                        </button>
                        {u.user_id !== user?.user_id && (
                          <button
                            title="Delete Account"
                            onClick={() => {
                              setSelectedUserForDelete(u);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 bg-white/5 hover:bg-red-500/10 border border-white/10 text-red-400 hover:text-red-300 rounded-lg transition-colors inline-flex items-center"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* User Profile Review Modal */}
      {selectedUserForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 space-y-6 relative border border-white/10 bg-obsidian/95 animate-scale-up">
            <button
              type="button"
              onClick={() => setSelectedUserForReview(null)}
              aria-label="Close user profile"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 border-b border-white/10 pb-5 pr-8">
              <div className="p-3 bg-electricPurple/10 border border-electricPurple/20 rounded-xl text-electricPurple">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs text-electricPurple font-semibold uppercase tracking-wider">Profile Review</p>
                <h3 className="text-2xl font-heading font-bold text-white">{selectedUserForReview.name}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2"><Mail size={15} /> Email</div>
                <p className="text-sm text-white break-all">{selectedUserForReview.email || 'No email registered'}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2"><Shield size={15} /> Role</div>
                <p className="text-sm text-white">{selectedUserForReview.role}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2"><CalendarDays size={15} /> Registered</div>
                <p className="text-sm text-white">{new Date(selectedUserForReview.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2"><DollarSign size={15} /> Wallet</div>
                <p className="text-sm font-mono text-emerald-400">${Number(selectedUserForReview.wallet_balance).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-5 gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 border rounded-lg tracking-wide capitalize ${getApprovalBadgeClass(selectedUserForReview.approval_status)}`}>
                {selectedUserForReview.approval_status || 'approved'}
              </span>
              {(selectedUserForReview.approval_status || 'approved') === 'approved' ? (
                <span className="text-xs text-gray-500">Approval is final</span>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprovalStatusUpdate('rejected')}
                    className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprovalStatusUpdate('approved')}
                    className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 relative border border-white/10 bg-obsidian/95 animate-scale-up">
            <button 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUserForDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">
                Delete Account?
              </h3>
              <p className="text-gray-400 text-sm">
                Are you sure you want to delete <strong className="text-white">{selectedUserForDelete?.name}</strong>'s profile? This operation is permanent and will cascade deletion to their transaction logs, reservations, and battery assignments.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserForDelete(null);
                }}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-colors w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full"
              >
                {actionLoading && <Loader2 className="animate-spin" size={16} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
