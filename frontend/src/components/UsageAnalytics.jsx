import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Zap, Calendar, Battery } from 'lucide-react';

const UsageAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/wallet/analytics`, config);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-card p-8">
        <p className="text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // Prepare chart data
  const monthlyData = analytics.monthlySpending.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
    spent: parseFloat(item.spent) || 0,
    deposited: parseFloat(item.deposited) || 0
  }));

  const spendingByTypeData = analytics.spendingByType.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: parseFloat(item.total) || 0,
    count: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Spent</span>
            <DollarSign className="text-red-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">${analytics.summary.totalSpent.toFixed(2)}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <TrendingUp className="text-green-400 mr-1" size={12} />
            <span>Lifetime spending</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Deposited</span>
            <DollarSign className="text-green-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">${analytics.summary.totalDeposited.toFixed(2)}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <TrendingUp className="text-green-400 mr-1" size={12} />
            <span>Total wallet top-ups</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Transactions</span>
            <Zap className="text-neonCyan" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.summary.transactionCount}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <Calendar className="text-neonCyan mr-1" size={12} />
            <span>Total activity</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg. Transaction</span>
            <TrendingDown className="text-amber-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white">${analytics.summary.averageTransaction.toFixed(2)}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span className="text-neonCyan">Per transaction</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Spending vs Deposits</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="deposited" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Deposited"
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                stackId="2" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
                name="Spent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Type */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Spending by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={spendingByTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {spendingByTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {analytics.transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.transaction_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'deposit' ? 'bg-green-400/20 text-green-400' :
                  transaction.type === 'charge' ? 'bg-red-400/20 text-red-400' :
                  transaction.type === 'swap' ? 'bg-blue-400/20 text-blue-400' :
                  'bg-amber-400/20 text-amber-400'
                }`}>
                  {transaction.type === 'deposit' && <TrendingUp size={16} />}
                  {transaction.type === 'charge' && <Zap size={16} />}
                  {transaction.type === 'swap' && <Battery size={16} />}
                  {transaction.type === 'penalty' && <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">{transaction.type}</p>
                  <p className="text-xs text-gray-400">{transaction.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;