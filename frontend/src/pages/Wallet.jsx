import { useState, useEffect, useContext } from 'react';

import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Wallet as WalletIcon, PlusCircle, ArrowDownRight, ArrowUpRight, ArrowLeft, TrendingUp, TrendingDown, CreditCard, Zap, Calendar, Filter, Download, Clock } from 'lucide-react';

const Wallet = () => {
  const { user, setUser } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/wallet`, config);
        setBalance(data.balance);
        setTransactions(data.transactions);
        
        // Fetch analytics data
        const analyticsRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallet/analytics`, config);
        setAnalytics(analyticsRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wallet data', error);
        setLoading(false);
      }
    };
    fetchWalletData();
  }, [user.token, refreshTrigger]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!topUpAmount || isNaN(topUpAmount) || topUpAmount <= 0) return;
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/wallet`, { amount: Number(topUpAmount) }, config);
      setBalance(data.balance);
      setUser({ ...user, wallet_balance: data.balance });
      setTopUpAmount('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Top up failed', error);
      alert('Top up failed');
    }
  };

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString());
  };

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filterType);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight size={20} />;
      case 'charge':
        return <Zap size={20} />;
      case 'swap':
        return <CreditCard size={20} />;
      case 'penalty':
        return <Clock size={20} />;
      default:
        return <ArrowUpRight size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'charge':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'swap':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'penalty':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) return <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-neonCyan/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-electricPurple/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-4xl font-heading font-bold flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neonCyan">
              <WalletIcon size={28} />
            </div>
            My Wallet
          </h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10">
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neonCyan/10 blur-[40px] rounded-full group-hover:bg-neonCyan/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Current Balance</span>
              <WalletIcon className="text-neonCyan" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">${balance.toFixed(2)}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp size={12} /> Available
            </p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Deposited</span>
              <TrendingUp className="text-emerald-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              ${analytics?.summary?.totalDeposited?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-400">Lifetime deposits</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[40px] rounded-full group-hover:bg-red-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Spent</span>
              <TrendingDown className="text-red-400" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              ${analytics?.summary?.totalSpent?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-400">Charging & swaps</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-electricPurple/10 blur-[40px] rounded-full group-hover:bg-electricPurple/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Transactions</span>
              <Calendar className="text-electricPurple" size={18} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {analytics?.summary?.transactionCount || 0}
            </p>
            <p className="text-xs text-gray-400">Total activity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Balance & Top Up */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="glass-card p-8 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-neonCyan/20 blur-[60px] rounded-full pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-electricPurple/10 blur-[40px] rounded-full pointer-events-none"></div>
              <h2 className="text-lg font-medium text-gray-400 mb-2">Available Balance</h2>
              <p className="text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                ${balance.toFixed(2)}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                <span className="px-2 py-1 bg-green-400/10 text-green-400 rounded-full text-xs">Active</span>
                <span>•</span>
                <span>USD Currency</span>
              </div>
            </div>

            {/* Top Up Section */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <PlusCircle className="text-neonCyan" size={20} />
                Add Funds
              </h2>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[10, 25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickTopUp(amount)}
                    className="py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm font-medium border border-white/10 hover:border-neonCyan/30"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <form onSubmit={handleTopUp} className="flex flex-col gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="input-field pl-8 font-mono text-lg"
                  />
                </div>
                <button type="submit" className="btn-primary flex items-center justify-center gap-2">
                  <PlusCircle size={20} />
                  Confirm Top Up
                </button>
              </form>
            </div>
          </div>

          {/* Spending Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={20} />
              Spending Breakdown
            </h2>
            <div className="space-y-4">
              {analytics?.spendingByType?.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{item.type}</span>
                    <span className="font-semibold text-white">${item.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-neonCyan to-electricPurple rounded-full transition-all duration-500" 
                      style={{ width: `${(item.total / (analytics?.summary?.totalSpent || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{item.count} transactions</p>
                </div>
              ))}
              {(!analytics?.spendingByType || analytics.spendingByType.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="mx-auto mb-2 text-gray-600" size={32} />
                  <p>No spending data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                <Calendar className="text-electricPurple" size={20} />
                Transaction History
              </h2>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-neonCyan/50"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits</option>
                  <option value="charge">Charges</option>
                  <option value="swap">Swaps</option>
                  <option value="penalty">Penalties</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Calendar className="mx-auto mb-2 text-gray-600" size={32} />
                <p>No transactions found.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.transaction_id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${getTransactionColor(tx.type)}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-lg text-white capitalize">{tx.description || tx.type}</p>
                      <p className="text-sm text-gray-500 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`text-xl font-bold font-mono ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
