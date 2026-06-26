import React, { useState } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  RefreshCw, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Scale, 
  Trash2, 
  Edit2, 
  Eye, 
  X, 
  Calendar, 
  ArrowRight,
  Filter,
  CheckCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

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
  onSaveTransaction?: (tx: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onRefresh: () => void;
}

export default function FinanceView({
  transactions = [],
  onSaveTransaction,
  onDeleteTransaction,
  onRefresh,
}: FinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  
  // Month Filters Setup
  // We extract all Month/Year combinations from transactions
  const getMonthsList = () => {
    const list: string[] = [];
    transactions.forEach(t => {
      if (t.date) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const monthNum = String(d.getMonth() + 1).padStart(2, '0');
          const monthLabel = d.toLocaleString('default', { month: 'long' });
          const key = `${year}-${monthNum}`; // '2026-06'
          const label = `${monthLabel} ${year}`;
          if (!list.some(item => item.startsWith(key))) {
            list.push(`${key}|${label}`);
          }
        }
      }
    });

    // Sort chronologically descending
    list.sort((a, b) => b.localeCompare(a));

    // Also inject current month if not exists
    const currD = new Date();
    const currYear = currD.getFullYear();
    const currMonNum = String(currD.getMonth() + 1).padStart(2, '0');
    const currMonLabel = currD.toLocaleString('default', { month: 'long' });
    const currKey = `${currYear}-${currMonNum}`;
    const currLabel = `${currMonLabel} ${currYear}`;
    if (!list.some(item => item.startsWith(currKey))) {
      list.unshift(`${currKey}|${currLabel}`);
    }

    return list;
  };

  const monthsList = getMonthsList();
  const [selectedMonth, setSelectedMonth] = useState<string>('All'); // 'All' or '2026-06'

  // Dynamic Multi-add Form / Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // List of items in the creation form to support "multiple add at once"!
  const [formRows, setFormRows] = useState<Array<{
    type: 'income' | 'expense';
    category: string;
    customCategory: string;
    amount: string;
    date: string;
    description: string;
  }>>([
    {
      type: 'income',
      category: 'Consultation Fee',
      customCategory: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  ]);

  // Reader individual viewer modal
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  // Handles adding/editing row inside form
  const addFormRow = () => {
    setFormRows([
      ...formRows,
      {
        type: activeTab === 'all' ? 'income' : activeTab,
        category: activeTab === 'expense' ? 'Medical Equipment' : 'Consultation Fee',
        customCategory: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      }
    ]);
  };

  const removeFormRow = (index: number) => {
    if (formRows.length === 1) return; // keep at least one row
    setFormRows(formRows.filter((_, i) => i !== index));
  };

  const updateFormRow = (index: number, field: string, value: any) => {
    const updated = [...formRows];
    updated[index] = { ...updated[index], [field]: value };
    // Set default category when type swings
    if (field === 'type') {
      updated[index].category = value === 'expense' ? 'Medical Equipment' : 'Consultation Fee';
    }
    setFormRows(updated);
  };

  // Submit all rows to backend
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveTransaction) return;

    // Validate and submit
    for (const row of formRows) {
      if (!row.type) {
        alert("Transaction Type is required.");
        return;
      }
      if (!row.category) {
        alert("Transaction Category is required.");
        return;
      }
      if (row.category === 'Other (Custom...)' && (!row.customCategory || !row.customCategory.trim())) {
        alert("Please specify details for the custom category.");
        return;
      }
      if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }
      if (!row.date) {
        alert("Please enter a valid date");
        return;
      }
      if (!row.description || !row.description.trim()) {
        alert("Description/Remarks are required for each financial entry.");
        return;
      }
    }

    // Submit sequentially
    try {
      if (formMode === 'edit' && editingId) {
        const row = formRows[0];
        const finalCategory = row.category === 'Other (Custom...)' ? row.customCategory : row.category;
        await onSaveTransaction({
          id: editingId,
          type: row.type,
          category: finalCategory || 'Miscellaneous',
          amount: Number(row.amount),
          date: row.date,
          description: row.description
        });
      } else {
        // Multi-add mode
        for (const row of formRows) {
          const finalCategory = row.category === 'Other (Custom...)' ? row.customCategory : row.category;
          await onSaveTransaction({
            type: row.type,
            category: finalCategory || 'Miscellaneous',
            amount: Number(row.amount),
            date: row.date,
            description: row.description
          });
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setEditingId(null);
    setFormRows([
      {
        type: activeTab === 'all' ? 'income' : activeTab,
        category: activeTab === 'expense' ? 'Medical Equipment' : 'Consultation Fee',
        customCategory: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      }
    ]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setFormMode('edit');
    setEditingId(tx.id);

    // Check if category is standard
    const isStandard = [
      'Consultation Fee', 'Pharmacy Sales', 'IPD Deposit', 'Lab & Diagnostics', 
      'Insurance Claim Reimbursements', 'OPD Registrations', 'External Consulting',
      'Medical Equipment', 'Staff Salary', 'Rent & Utilities', 'Office Supplies',
      'Pharmacy Inventory Purchase', 'Maintenance & Repairs', 'Marketing & Branding', 
      'Medical Waste Disposal'
    ].includes(tx.category);

    setFormRows([
      {
        type: tx.type,
        category: isStandard ? tx.category : 'Other (Custom...)',
        customCategory: isStandard ? '' : tx.category,
        amount: String(tx.amount),
        date: tx.date || new Date().toISOString().split('T')[0],
        description: tx.description || ''
      }
    ]);
    setIsFormOpen(true);
  };

  // Base list filtering
  const filteredByMonthAndTab = transactions.filter((t) => {
    // Tab Filter
    const matchesTab = activeTab === 'all' || t.type === activeTab;
    
    // Month Filter
    let matchesMonth = true;
    if (selectedMonth !== 'All' && t.date) {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        matchesMonth = key === selectedMonth;
      } else {
        matchesMonth = false;
      }
    }

    // Search query Filter
    const matchesSearch = search === '' ||
      (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesMonth && matchesSearch;
  });

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (filteredByMonthAndTab.length === 0) {
      showToast("No matching financial ledger transactions to export.");
      return;
    }
    const headers = ['Transaction ID', 'Flow Type', 'Category Head', 'Description', 'Transaction Date', 'Amount (₹)'];
    const keys = ['id', 'type', 'category', 'description', 'date', 'amount'];
    const filename = `finance_transactions_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filteredByMonthAndTab, headers, keys, filename);
      showToast("Financial ledger exported smoothly as CSV.");
    } else if (format === 'Excel') {
      downloadExcel(filteredByMonthAndTab, headers, keys, filename);
      showToast("Financial ledger exported smoothly as Excel sheet.");
    } else if (format === 'Word') {
      downloadWord(filteredByMonthAndTab, headers, keys, filename, 'Hospital Financial Ledger Statement');
      showToast("Financial ledger exported smoothly as Word document.");
    } else if (format === 'PDF') {
      downloadPDFFile(filteredByMonthAndTab, headers, keys, filename, 'Hospital Audit Financial Transactions Roll');
      showToast("Financial ledger exported smoothly as PDF file.");
    }
  };

  // Calculate stats based on Tab and Month filter
  const statsIncome = transactions
    .filter((t) => {
      const matchesTab = t.type === 'income';
      let matchesMonth = true;
      if (selectedMonth !== 'All' && t.date) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = key === selectedMonth;
        }
      }
      return matchesTab && matchesMonth;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const statsExpense = transactions
    .filter((t) => {
      const matchesTab = t.type === 'expense';
      let matchesMonth = true;
      if (selectedMonth !== 'All' && t.date) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = key === selectedMonth;
        }
      }
      return matchesTab && matchesMonth;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netSavings = statsIncome - statsExpense;
  const marginPercentage = statsIncome > 0 ? ((statsIncome - statsExpense) / statsIncome) * 100 : 0;

  const categoriesIncome = [
    'Consultation Fee',
    'Pharmacy Sales',
    'IPD Deposit',
    'Lab & Diagnostics',
    'Insurance Claim Reimbursements',
    'OPD Registrations',
    'External Consulting',
    'Other (Custom...)'
  ];

  const categoriesExpense = [
    'Medical Equipment',
    'Staff Salary',
    'Rent & Utilities',
    'Office Supplies',
    'Pharmacy Inventory Purchase',
    'Maintenance & Repairs',
    'Marketing & Branding',
    'Medical Waste Disposal',
    'Other (Custom...)'
  ];

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="finance-view-root">
      
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle className="text-[#007f6e]" size={18} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center" id="finance-top-panel">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="finance-title">Finance & Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">Log, update and filter monthly hospital transactions, invoices and cash streams.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Multiple / Log Transaction</span>
          </button>
          
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl"
            title="Refresh logs"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* THREE TIER FILTERS: Tab Selection + Dynamic Month Selector */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs" id="filter-wrapper">
        <div className="flex bg-slate-50 p-1 rounded-xl w-full md:w-auto" id="transactions-tab-bar">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-[#007f6e] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Ledger
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'income' ? 'bg-[#007f6e] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Revenues Only
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'expense' ? 'bg-[#007f6e] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Expenses Only
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-slate-450 text-xs font-medium">
            <Filter size={13} className="text-[#007f6e]" />
            <span>Month Range:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-1.8 text-xs font-semibold border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#007f6e] text-slate-700 w-full md:w-56"
          >
            <option value="All">All Months (Full History)</option>
            {monthsList.map((item) => {
              const [key, label] = item.split('|');
              return (
                <option key={key} value={key}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* MONTH-BASED STATS BLOCK CARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="finance-stats-grid">
        {/* Monthly Income Card */}
        <div className="bg-white border border-slate-900/5 rounded-xl p-4 flex items-center justify-between shadow-xs hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
              {selectedMonth === 'All' ? 'Total Income' : 'Monthly Income'}
            </span>
            <span className="text-xl font-black text-emerald-600 block">
              ₹{statsIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-555 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="bg-white border border-slate-900/5 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
              {selectedMonth === 'All' ? 'Total Expenses' : 'Monthly Expenses'}
            </span>
            <span className="text-xl font-black text-rose-550 block">
              ₹{statsExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <TrendingDown size={18} />
          </div>
        </div>

        {/* Net Savings / Flow */}
        <div className="bg-white border border-slate-900/5 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
              Net Balance / Cashflow
            </span>
            <span className={`text-xl font-black block ${netSavings >= 0 ? 'text-teal-605' : 'text-rose-600'}`}>
              {netSavings < 0 ? '-' : ''}₹{Math.abs(netSavings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netSavings >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-500'}`}>
            <Scale size={18} />
          </div>
        </div>

        {/* Margin / Health */}
        <div className="bg-white border border-slate-900/5 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
              Profit / Cash Margin
            </span>
            <span className="text-xl font-black text-indigo-600 block">
              {marginPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* DATA TRANSACTION LEDGER CONTAINER */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="finance-table-card">
        {/* Table Search & Status */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs font-bold text-slate-450 flex items-center gap-2 flex-wrap">
            <span>Showing {filteredByMonthAndTab.length} operations</span>
            {selectedMonth !== 'All' && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                Filtered: Month Range Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search category, custom type, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <span>Export Ledger</span>
              </button>
              {showExportDropdown && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-lg shadow-lg z-20 py-1 divide-y divide-slate-50 text-[11px] text-slate-700">
                  <button onClick={() => handleExport('CSV')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-705 font-medium block cursor-pointer">CSV format</button>
                  <button onClick={() => handleExport('Excel')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-medium block cursor-pointer">Excel sheet</button>
                  <button onClick={() => handleExport('Word')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-blue-600 font-medium block cursor-pointer">Word document</button>
                  <button onClick={() => handleExport('PDF')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 font-medium block cursor-pointer">PDF file</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic List */}
        {filteredByMonthAndTab.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-3" id="blank-ledger-state">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
              <IndianRupee size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No financial ledgers logged</p>
              <p className="text-xs text-slate-400 mt-1">Change month intervals or click "Multiple / Log Transaction" to populate entry lists.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Flow Type</th>
                  <th className="px-6 py-3">Category Head</th>
                  <th className="px-6 py-3">Brief Description</th>
                  <th className="px-6 py-3">Transaction Date</th>
                  <th className="px-6 py-3 text-right">Cash Amount (₹)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredByMonthAndTab.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                        t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {t.category}
                    </td>
                    <td className="px-6 py-4 text-slate-450 max-w-sm truncate" title={t.description}>
                      {t.description || <span className="italic text-slate-300">No reference write-up</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {t.date}
                    </td>
                    <td className={`px-6 py-4 text-right font-extrabold font-mono text-sm ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-550'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}₹{Number(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setViewingTx(t)}
                          className="p-1.5 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                          title="View statement details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Edit transaction info"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Permanently delete this ledger item entry?")) {
                              if (onDeleteTransaction) onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 rounded bg-rose-50 text-rose-605 hover:bg-rose-100"
                          title="Delete from safe ledger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL WITH DYNAMIC MULTI-ADD CAPABILITIES ("form mamutiplae add ka rakan") */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full p-6 shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee size={15} className="text-[#007f6e]" />
                  {formMode === 'add' ? 'Log Multiple Transactions Ledger' : 'Modify Ledger Entry Form'}
                </h3>
                {formMode === 'add' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Use the "Add Row" function to register multiple income/expense lines at once.</p>
                )}
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Dynamic Interactive Panel */}
            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto flex-1 py-4 pr-1">
              <div className="space-y-3.5">
                {formRows.map((row, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-150 relative space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    {/* Row counter and delete */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-150 px-2 py-0.5 rounded-full">
                        Entry Line #{idx + 1}
                      </span>
                      {formRows.length > 1 && formMode === 'add' && (
                        <button
                          type="button"
                          onClick={() => removeFormRow(idx)}
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-550 hover:text-rose-700 bg-white px-2 py-0.7 border border-rose-100 rounded-lg"
                        >
                          <Trash2 size={11} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      
                      {/* TYPE (Income / Expense) */}
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Type</label>
                        <select
                          value={row.type}
                          onChange={(e) => updateFormRow(idx, 'type', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700 font-bold"
                        >
                          <option value="income">Revenue (+)</option>
                          <option value="expense">Expense (-)</option>
                        </select>
                      </div>

                      {/* CATEGORY SELECTOR */}
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Category Head</label>
                        <select
                          value={row.category}
                          onChange={(e) => updateFormRow(idx, 'category', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700 font-medium"
                        >
                          <option disabled className="font-bold text-slate-400">--- Standard Revenues ---</option>
                          {categoriesIncome.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option disabled className="font-bold text-slate-400">--- Standard Expenses ---</option>
                          {categoriesExpense.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* CASH CASH AMOUNT */}
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateFormRow(idx, 'amount', e.target.value)}
                          placeholder="e.g. 1500"
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-805 font-mono font-bold"
                          required
                        />
                      </div>

                      {/* TRANSACTION DATE */}
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Transaction Date</label>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateFormRow(idx, 'date', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                          required
                        />
                      </div>

                    </div>

                    {/* DYNAMIC FIELD FOR CUSTOM CATEGORIES / koi b third Finance */}
                    {row.category === 'Other (Custom...)' && (
                      <div className="animate-in fade-in zoom-in-95 duration-100">
                        <label className="block text-[9px] font-bold text-teal-605 uppercase mb-1">Type Custom / Third-Party Category Name</label>
                        <input
                          type="text"
                          value={row.customCategory}
                          onChange={(e) => updateFormRow(idx, 'customCategory', e.target.value)}
                          placeholder="e.g. Diagnostic Machine Commission"
                          className="w-full text-xs px-3 py-2 border border-[#007f6e] bg-white rounded-lg focus:outline-none"
                          required
                        />
                      </div>
                    )}

                    {/* DESCRIPTION / MEMO */}
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Description Reference / Payer / Memo Details</label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateFormRow(idx, 'description', e.target.value)}
                        placeholder="e.g. Received from Medicare Insurance Corp or Supplier Bill #029"
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                      />
                    </div>

                  </div>
                ))}
              </div>

              {/* Add row controller */}
              {formMode === 'add' && (
                <button
                  type="button"
                  onClick={addFormRow}
                  className="w-full py-3 border border-dashed border-slate-300 hover:border-[#007f6e] rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#007f6e] bg-slate-50/50 hover:bg-slate-50/100 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>➕ Add Transaction Row</span>
                </button>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#007f6e] text-white rounded-lg hover:bg-[#006657] font-bold shadow-xs flex items-center gap-1.5"
                >
                  <span>{formMode === 'add' ? `Save All (${formRows.length}) Entries` : 'Save Entry Changes'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* TRANSACTION COMPREHENSIVE VIEW DETAILS STATEMENT MODAL */}
      {viewingTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-[#007f6e]" />
                Hospital Transaction Statement
              </h3>
              <button 
                onClick={() => setViewingTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                    viewingTx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {viewingTx.type}
                  </span>
                  <h4 className="text-sm font-black text-slate-800 mt-2">{viewingTx.category}</h4>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Statement ID</span>
                  <span className="font-mono text-slate-500 font-medium block mt-0.5">{viewingTx.id}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200/60">
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Value Date</span>
                    <span className="text-slate-850 font-bold block mt-0.5">{viewingTx.date}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Amount</span>
                    <span className={`text-base font-black font-mono block mt-0.5 ${viewingTx.type === 'income' ? 'text-emerald-600' : 'text-rose-550'}`}>
                      ₹{Number(viewingTx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Transaction Description / Notes</span>
                  <p className="text-xs text-slate-705 leading-relaxed font-sans font-medium">
                    {viewingTx.description || <span className="italic text-slate-350 font-normal">No additional statement memos registered.</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingTx(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
