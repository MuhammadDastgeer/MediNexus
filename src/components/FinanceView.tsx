import React, { useState } from 'react';
import { IndianRupee, Plus, Search, RefreshCw, FileText, TrendingUp, AlertTriangle, Scale } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface FinanceViewProps {
  transactions?: Transaction[];
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onRefresh: () => void;
}

export default function FinanceView({
  transactions = [],
  onAddTransaction,
  onRefresh,
}: FinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('Consultation Fee');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    if (onAddTransaction) {
      onAddTransaction({
        type: activeTab,
        category,
        amount: Number(amount),
        date,
        description,
      });
    }
    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = transactions.filter(
    (t) =>
      t.type === activeTab &&
      (t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="finance-view">
      {/* Title block */}
      <div className="flex justify-between items-center" id="finance-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="finance-title">Finance & Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track real-time billing cycles, logs, expenditures and margins.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Log Transaction</span>
          </button>
          <button
            onClick={() => alert('Export Financial Sheets Summary')}
            className="flex items-center gap-1.5 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText size={14} />
            <span>Export Summary</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm max-w-lg">
          <h3 className="text-sm font-bold text-slate-800 capitalize">Log {activeTab} Transaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
              >
                {activeTab === 'income' ? (
                  <>
                    <option value="Consultation Fee">Consultation Fee</option>
                    <option value="Pharmacy Sales">Pharmacy Sales</option>
                    <option value="IPD Deposit">IPD Deposit</option>
                    <option value="Lab & Diagnostics">Lab & Diagnostics</option>
                  </>
                ) : (
                  <>
                    <option value="Medical Equipment">Medical Equipment</option>
                    <option value="Staff Salary">Staff Salary</option>
                    <option value="Rent & Utilities">Rent & Utilities</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the payment..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#007f6e] text-white font-semibold rounded-lg hover:bg-[#006657]"
            >
              Log Entry
            </button>
          </div>
        </form>
      )}

      {/* TABS (Incomes, Expenses) */}
      <div className="flex border-b border-slate-100" id="finance-tabs-group">
        <button
          onClick={() => setActiveTab('income')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'income'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Revenue Stream
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'expense'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Expenses Queue
        </button>
      </div>

      {/* KPI Card block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="finance-kpis">
        {/* Income Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Income</span>
            <span className="text-xl font-extrabold text-[#00a85a]">₹{totalIncome.toFixed(2)}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
            <span className="text-xl font-extrabold text-rose-500">₹{totalExpense.toFixed(2)}</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <IndianRupee size={18} className="text-rose-400" />
          </div>
        </div>

        {/* Outstanding Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
            <span className="text-xl font-extrabold text-slate-800">₹0.00</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Net Profit Margin Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profit Margin</span>
            <span className="text-xl font-extrabold text-[#8e52e9]">100%</span>
          </div>
          <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center">
            <Scale size={18} />
          </div>
        </div>
      </div>

      {/* Transactions list card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="finance-main-card">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs font-semibold text-slate-400">
            Total {filtered.length} logs found
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search category, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-rupee">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <IndianRupee size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No transactions logged</p>
              <p className="text-xs text-slate-400 mt-0.5">Transaction streams transferred from bill records or manually logged here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{t.category}</td>
                    <td className="px-6 py-4 text-slate-600">{t.description || 'No description'}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{t.date}</td>
                    <td className={`px-6 py-4 text-right font-bold font-mono ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
