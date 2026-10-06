import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, History, UserRound, CalendarDays, Receipt, X, Loader2, Pencil, Check, Sparkles } from 'lucide-react';

const AdminFinancials = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [overviewResponse, plansResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/admin/overview`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/admin/subscription-plans`, config)
        ]);
        setTransactions(overviewResponse.data.recentTransactions || []);
        setPlans(plansResponse.data || []);
      } catch (requestError) {
        console.error('Error fetching financial transactions', requestError);
        setError(requestError.response?.data?.message || 'Failed to load recent transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user.token]);

  const getTransactionColor = (type) => {
    if (type === 'deposit') return 'text-emerald-400';
    if (type === 'penalty') return 'text-amber-400';
    return 'text-red-400';
  };

  const handlePlanSave = async () => {
    if (!editingPlan) return;
    try {
      setSavingPlan(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/subscription-plans/${editingPlan.plan_id}`,
        editingPlan,
        config
      );
      setPlans((currentPlans) => currentPlans.map((plan) => plan.plan_id === response.data.plan_id ? response.data : plan));
      setEditingPlan(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update subscription plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const updatePlanField = (field, value) => {
    setEditingPlan((currentPlan) => ({ ...currentPlan, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neonCyan/5 to-electricPurple/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400">
            <DollarSign size={28} />
          </div>
          Financials & Payouts
        </h1>
        
        <p className="text-gray-400 max-w-2xl">
          Oversee wallet transactions, platform revenue, and process payouts for Station Operators.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <DollarSign size={24} />
                </div>
                <p className="text-gray-400 font-medium">Platform Revenue</p>
              </div>
              <span className="text-emerald-400 flex items-center text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded"><ArrowUpRight size={14} className="mr-1"/> +12%</span>
            </div>
            <p className="text-4xl font-bold font-mono text-white">$4,250.00</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center">
             <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <CreditCard size={24} />
                </div>
                <p className="text-gray-400 font-medium">Pending Payouts</p>
              </div>
            </div>
            <p className="text-4xl font-bold font-mono text-white">$1,840.50</p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-electricPurple" size={22} />
            <div>
              <h2 className="text-xl font-heading font-semibold text-white">Subscription Plans</h2>
              <p className="text-sm text-gray-400">Manage monthly pricing and member benefits available on the platform.</p>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isEditing = editingPlan?.plan_id === plan.plan_id;
              const displayedPlan = isEditing ? editingPlan : plan;
              return (
                <div key={plan.plan_id} className={`glass-card p-5 space-y-5 border ${plan.active ? 'border-white/10' : 'border-red-500/20 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-white">{plan.name}</h3>
                      <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
                    </div>
                    {!isEditing && (
                      <button
                        type="button"
                        title={`Edit ${plan.name}`}
                        onClick={() => setEditingPlan({ ...plan })}
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    {isEditing ? (
                      <label className="flex items-center gap-2 text-2xl font-bold text-white">
                        $<input type="number" min="0" step="0.01" value={displayedPlan.monthly_price} onChange={(event) => updatePlanField('monthly_price', event.target.value)} className="w-28 bg-black/30 border border-white/10 rounded-lg px-2 py-1 font-mono text-xl" />
                      </label>
                    ) : <span className="text-3xl font-bold font-mono text-white">${Number(displayedPlan.monthly_price).toFixed(2)}</span>}
                    <span className="pb-1 text-sm text-gray-500">/ month</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400"><span>Booking discount</span>{isEditing ? <input type="number" min="0" max="100" value={displayedPlan.booking_discount} onChange={(event) => updatePlanField('booking_discount', event.target.value)} className="w-16 rounded bg-black/30 border border-white/10 px-2 text-right text-white" /> : <span className="font-semibold text-white">{displayedPlan.booking_discount}%</span>}</div>
                    <div className="flex justify-between text-gray-400"><span>Swap discount</span>{isEditing ? <input type="number" min="0" max="100" value={displayedPlan.swap_discount} onChange={(event) => updatePlanField('swap_discount', event.target.value)} className="w-16 rounded bg-black/30 border border-white/10 px-2 text-right text-white" /> : <span className="font-semibold text-white">{displayedPlan.swap_discount}%</span>}</div>
                    <div className="flex justify-between text-gray-400"><span>Monthly bookings</span>{isEditing ? <input type="number" min="0" value={displayedPlan.monthly_bookings} onChange={(event) => updatePlanField('monthly_bookings', event.target.value)} className="w-16 rounded bg-black/30 border border-white/10 px-2 text-right text-white" /> : <span className="font-semibold text-white">{displayedPlan.monthly_bookings || 'Unlimited'}</span>}</div>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={Boolean(Number(displayedPlan.active))} onChange={(event) => updatePlanField('active', event.target.checked ? 1 : 0)} /> Active</label>
                      <button type="button" disabled={savingPlan} onClick={handlePlanSave} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"><Check size={15} /> Save</button>
                    </div>
                  ) : <span className={`inline-block text-xs font-semibold uppercase tracking-wider ${plan.active ? 'text-emerald-400' : 'text-red-400'}`}>{plan.active ? 'Active plan' : 'Inactive plan'}</span>}
                </div>
              );
            })}
          </div>
        </section>

        <div className="glass-panel overflow-hidden mt-8">
          <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
            <History className="text-emerald-400" size={20} />
            <h2 className="text-xl font-heading font-semibold">Recent Transactions</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-emerald-400" size={32} />
              <p className="text-sm">Loading transaction ledger...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
              <DollarSign size={48} className="text-white/10" />
              <p>No transactions have been recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((transaction) => (
                <button
                  key={transaction.transaction_id}
                  type="button"
                  onClick={() => setSelectedTransaction(transaction)}
                  className="w-full p-5 flex flex-col gap-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`rounded-xl border border-white/10 bg-white/[0.04] p-3 ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'deposit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium capitalize text-white">{transaction.description || transaction.type}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {transaction.user_name || `User ID: ${transaction.user_id}`} · {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className={`shrink-0 font-mono text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
            aria-labelledby="financial-transaction-title"
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
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-400">
                <Receipt size={26} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Transaction Details</p>
                <h2 id="financial-transaction-title" className="mt-1 text-2xl font-heading font-bold capitalize text-white">{selectedTransaction.type}</h2>
              </div>
            </div>
            <div className="grid gap-3 py-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Receipt size={16} /><span className="text-xs uppercase tracking-wider">Description</span></div>
                <p className="text-sm text-white">{selectedTransaction.description || 'No description provided'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><UserRound size={16} /><span className="text-xs uppercase tracking-wider">User</span></div>
                <p className="text-sm font-semibold text-white">{selectedTransaction.user_name || 'Unknown user'}</p>
                <p className="mt-1 break-all text-xs text-gray-500">{selectedTransaction.user_email || `User ID: ${selectedTransaction.user_id}`}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><DollarSign size={16} /><span className="text-xs uppercase tracking-wider">Amount</span></div>
                <p className={`font-mono text-lg font-bold ${getTransactionColor(selectedTransaction.type)}`}>
                  {selectedTransaction.type === 'deposit' ? '+' : '-'}${Number(selectedTransaction.amount).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><CalendarDays size={16} /><span className="text-xs uppercase tracking-wider">Created</span></div>
                <p className="text-sm text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500"><Receipt size={16} /><span className="text-xs uppercase tracking-wider">Transaction ID</span></div>
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

export default AdminFinancials;
