import React from 'react';
import { DollarSign, Download, ArrowUpRight } from 'lucide-react';

const OperatorEarnings = () => {
  return (
    <div className="min-h-screen bg-obsidian text-white p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-heading font-bold flex items-center gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400">
                <DollarSign size={28} />
              </div>
              Earnings & Payouts
            </h1>
            <p className="text-gray-400 mt-2 max-w-2xl">
              Track your revenue generated from charging sessions and request payouts to your bank account.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            Request Payout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="glass-card p-6 flex flex-col justify-center border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <DollarSign size={24} />
                </div>
                <p className="text-gray-400 font-medium">Available for Payout</p>
              </div>
            </div>
            <p className="text-5xl font-bold font-mono text-white">$1,240.50</p>
          </div>

          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <ArrowUpRight size={24} />
                </div>
                <p className="text-gray-400 font-medium">Total Lifetime Earnings</p>
              </div>
            </div>
            <p className="text-5xl font-bold font-mono text-gray-400">$8,450.00</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden mt-8">
          <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="text-emerald-400" size={20} />
              <h2 className="text-xl font-heading font-semibold">Payout History</h2>
            </div>
            <button className="text-sm flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
             <DollarSign size={48} className="text-white/10" />
             <p>The transaction history module is currently under construction.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorEarnings;
