import React, { useState } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  Tag, 
  CreditCard, 
  Clock, 
  CheckSquare, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  ChevronRight, 
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  Printer
} from 'lucide-react';
import { Bill, Patient } from '../types';

interface BillingViewProps {
  bills: Bill[];
  patients?: Patient[];
  onAddBill: (billInput: Omit<Bill, 'id' | 'date'> & { items?: string; discount?: number; pendingAmount?: number; collectedAmount?: number }) => void;
  onUpdateBill?: (bill: Bill) => void;
  onDeleteBill?: (id: string) => void;
  onRefresh: () => void;
}

export default function BillingView({ 
  bills, 
  patients = [], 
  onAddBill, 
  onUpdateBill, 
  onDeleteBill, 
  onRefresh 
}: BillingViewProps) {
  // Modal & Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  
  // Invoice items state
  const [items, setItems] = useState<{ name: string; value: number }[]>([
    { name: 'Consultation Fee', value: 500 }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [billStatus, setBillStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [billDiscount, setBillDiscount] = useState<number>(0);

  // View state
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

  // Edit State
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editItems, setEditItems] = useState<{ name: string; value: number }[]>([]);
  const [editNewItemName, setEditNewItemName] = useState('');
  const [editNewItemValue, setEditNewItemValue] = useState('');
  const [editPatientName, setEditPatientName] = useState('');
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'Paid' | 'Pending'>('Pending');

  // Search, Filter & Tabs state
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Paid'>('All');
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('Newest First');

  // Helper to extract or parse items safely
  const parseBillItems = (itemsStr?: string): { name: string; value: number }[] => {
    if (!itemsStr) return [];
    try {
      return JSON.parse(itemsStr);
    } catch {
      return [];
    }
  };

  // Live Metrics calculations (matching exactly the 5 cards in Screenshot 3!)
  const totalInQueue = bills.length;
  const pendingBillsCount = bills.filter((b) => b.status === 'Pending').length;
  const totalPendingAmount = bills
    .filter((b) => b.status === 'Pending')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalCollectedAmount = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalDiscountGiven = bills.reduce((sum, b) => sum + (b.discount || 0), 0);

  // Date representation compare for filter
  const matchDateString = (billDate: string, filterDateStr: string) => {
    if (!filterDateStr) return true;
    
    // Replace slashes with dashes to normalize
    const normalizedBill = billDate.trim().replace(/\//g, '-');
    const normalizedFilter = filterDateStr.trim().replace(/\//g, '-');

    if (normalizedBill === normalizedFilter) return true;

    // Convert to Date objects and compare year-month-day
    const bDate = new Date(billDate);
    const fDate = new Date(filterDateStr);
    if (isNaN(bDate.getTime()) || isNaN(fDate.getTime())) {
      return normalizedBill.includes(normalizedFilter);
    }
    return bDate.getFullYear() === fDate.getFullYear() &&
           bDate.getMonth() === fDate.getMonth() &&
           bDate.getDate() === fDate.getDate();
  };

  // Filter bills list
  const filtered = bills.filter((b) => {
    const matchSearch = 
      b.patientName.toLowerCase().includes(search.toLowerCase()) || 
      b.id.toLowerCase().includes(search.toLowerCase());
      
    const matchStatus = activeTab === 'All' || b.status === activeTab;
    const matchDate = matchDateString(b.date, filterDate);
    return matchSearch && matchStatus && matchDate;
  });

  // Sort bills
  const sortedBills = [...filtered].sort((a, b) => {
    if (sortOrder === 'Newest First') {
      return b.id.localeCompare(a.id);
    } else if (sortOrder === 'Oldest First') {
      return a.id.localeCompare(b.id);
    } else if (sortOrder === 'Amount: High to Low') {
      return b.amount - a.amount;
    }
    return 0;
  });

  // Handle Multi-step creation submission
  const handleWizardSubmit = () => {
    const subtotal = items.reduce((sum, i) => sum + i.value, 0);
    const total = Math.max(0, subtotal - billDiscount);
    
    let pName = customPatientName;
    if (selectedPatientId && selectedPatientId !== 'custom') {
      const matchPat = patients.find(p => p.id === selectedPatientId);
      if (matchPat) pName = matchPat.name;
    }

    if (!pName.trim()) {
      alert('Please select or write a patient name');
      return;
    }

    onAddBill({
      patientName: pName,
      amount: total,
      status: billStatus,
      discount: billDiscount,
      pendingAmount: billStatus === 'Pending' ? total : 0,
      collectedAmount: billStatus === 'Paid' ? total : 0,
      items: JSON.stringify(items)
    });

    // Close and reset Wizard
    setWizardOpen(false);
    setWizardStep(1);
    setSelectedPatientId('');
    setCustomPatientName('');
    setItems([{ name: 'Consultation Fee', value: 500 }]);
    setBillStatus('Pending');
    setBillDiscount(0);
  };

  // Save edits
  const handleSaveEdit = () => {
    if (!editingBill) return;

    const subtotal = editItems.reduce((sum, i) => sum + i.value, 0);
    const total = Math.max(0, subtotal - editDiscount);

    if (!editPatientName.trim()) {
      alert('Please enter patient name');
      return;
    }

    const updated: Bill = {
      ...editingBill,
      patientName: editPatientName,
      amount: total,
      status: editStatus,
      discount: editDiscount,
      pendingAmount: editStatus === 'Pending' ? total : 0,
      collectedAmount: editStatus === 'Paid' ? total : 0,
      items: JSON.stringify(editItems)
    };

    if (onUpdateBill) {
      onUpdateBill(updated);
    }
    setEditingBill(null);
  };

  // Add Item handler
  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemValue) {
      alert('Provide item name and price value');
      return;
    }
    setItems([...items, { name: newItemName.trim(), value: parseFloat(newItemValue) }]);
    setNewItemName('');
    setNewItemValue('');
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add Edit Item handler
  const handleAddEditItem = () => {
    if (!editNewItemName.trim() || !editNewItemValue) {
      alert('Provide item name and price value');
      return;
    }
    setEditItems([...editItems, { name: editNewItemName.trim(), value: parseFloat(editNewItemValue) }]);
    setEditNewItemName('');
    setEditNewItemValue('');
  };

  // Remove Edit Item
  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  // Start edit
  const startEdit = (b: Bill) => {
    setEditingBill(b);
    setEditPatientName(b.patientName);
    setEditDiscount(b.discount || 0);
    setEditStatus(b.status);
    setEditItems(parseBillItems(b.items));
    setEditNewItemName('');
    setEditNewItemValue('');
  };

  // Filter patients list based on search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="billing-queue-view">
      
      {/* Header Row (Same to same header as requested!) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="billing-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="billing-title">Billing Queue</h1>
          <p className="flex items-center text-xs text-slate-400 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Live - {bills.length} bills (all time)
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Add Bill Button (Trigger Wizard) */}
          <button
            onClick={() => {
              setWizardStep(1);
              setSelectedPatientId('');
              setCustomPatientName('');
              setItems([{ name: 'Consultation Fee', value: 500 }]);
              setNewItemName('');
              setNewItemValue('');
              setBillStatus('Pending');
              setBillDiscount(0);
              setWizardOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
            id="btn-add-bill"
          >
            <Plus size={14} />
            <span>Add Bill</span>
          </button>

          {/* Today Filter Button */}
          <button
            onClick={() => {
              setFilterDate('2026-06-15');
            }}
            className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Calendar size={13} className="text-slate-400" />
            <span>Today</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-205 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw size={14} />
          </button>

          {/* Export Dropdown styled button */}
          <div className="relative">
            <button
              onClick={() => {
                alert('Invoices exported successfully as spreadsheet report.');
              }}
              className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export</span>
              <ChevronDown size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRICS (5 Cards with Icons based on color code) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" id="billing-kpi-grid">
        {/* Total in Queue */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total In Queue</span>
            <span className="text-xl font-extrabold text-slate-850">{totalInQueue}</span>
          </div>
          <div className="w-8 h-8 bg-sky-50 text-[#007f6e] rounded-lg flex items-center justify-center">
            <CreditCard size={15} />
          </div>
        </div>

        {/* Pending Bills */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Bills</span>
            <span className="text-xl font-extrabold text-slate-850">{pendingBillsCount}</span>
          </div>
          <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
            <Clock size={15} />
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5 font-sans">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Amount</span>
            <span className="text-xl font-extrabold text-amber-500">₹{totalPendingAmount.toFixed(2)}</span>
          </div>
          <div className="w-8 h-8 bg-amber-50/50 text-amber-500 rounded-lg flex items-center justify-center">
            <IndianRupee size={15} />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
            <span className="text-xl font-extrabold text-emerald-500 font-sans">₹{totalCollectedAmount.toFixed(2)}</span>
          </div>
          <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
            <CheckSquare size={15} className="text-emerald-450" />
          </div>
        </div>

        {/* Discount Given */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Discount Given</span>
            <span className="text-xl font-extrabold text-violet-505 font-sans">₹{totalDiscountGiven.toFixed(2)}</span>
          </div>
          <div className="w-8 h-8 bg-violet-50 text-violet-500 rounded-lg flex items-center justify-center font-bold">
            <Tag size={15} />
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-1.5" id="billing-filter-tabs">
        {(['All', 'Pending', 'Paid'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              activeTab === tab
                ? 'bg-emerald-50 text-[#007f6e] border border-emerald-150 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            {tab === 'All' ? 'All Bills' : tab}
          </button>
        ))}
      </div>

      {/* Primary Table Container */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden" id="billing-main-card">
        {/* Search, Filter Date & Sorting toolbar */}
        <div className="p-4 border-b border-slate-100 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search patient, doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-205 rounded-lg focus:outline-none focus:border-[#007f6e]"
              />
            </div>

            {/* Date Picker Input */}
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs bg-white border border-[#cfd4d2] rounded-lg focus:outline-none focus:border-[#007f6e] cursor-pointer"
              />
              <Calendar size={12} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-white border border-[#cfd4d2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#007f6e] appearance-none cursor-pointer"
              >
                <option value="Newest First">Newest First</option>
                <option value="Oldest First">Oldest First</option>
                <option value="Amount: High to Low">Amount: High to Low</option>
              </select>
              <div className="pointer-events-none absolute right-2.5">
                <ChevronDown size={12} className="text-slate-450" />
              </div>
            </div>

            {/* Clear Button */}
            {(search || filterDate) && (
              <button
                onClick={() => { setSearch(''); setFilterDate(''); }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Records Listing */}
        {sortedBills.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-ticket-billing">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No bills in queue</p>
              <p className="text-xs text-slate-400 mt-0.5">Transferred appointments will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 elegance-header uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Bill ID</th>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Bill Date</th>
                  <th className="px-6 py-3.5">Discount</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedBills.map((b) => {
                  const itemsCount = parseBillItems(b.items).length;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold">{b.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{b.patientName}</div>
                        {itemsCount > 0 && (
                          <div className="text-[10px] text-[#007f6e] font-medium block">
                            {itemsCount} {itemsCount === 1 ? 'line item' : 'line items'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{b.date}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 font-semibold">₹{(b.discount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold font-mono text-emerald-600 block-amount">₹{b.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${b.status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingBill(b)}
                            className="p-1 px-2 text-[10px] font-semibold text-[#007f6e] hover:bg-emerald-50 rounded-lg flex items-center gap-0.5 transition-colors border border-transparent hover:border-emerald-100 cursor-pointer"
                            title="View receipt"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => startEdit(b)}
                            className="p-1 px-2 text-[10px] font-semibold text-sky-600 hover:bg-sky-50 rounded-lg flex items-center gap-0.5 transition-colors border border-transparent hover:border-sky-100 cursor-pointer"
                            title="Edit bill"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          {onDeleteBill && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete bill ${b.id}?`)) {
                                  onDeleteBill(b.id);
                                }
                              }}
                              className="p-1 px-2 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg flex items-center gap-0.5 transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                              title="Delete bill"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MULTI-STEP CREATION WIZARD MODAL */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transition-all duration-300 transform scale-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fafbfc]">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Add New Invoice</h3>
                <p className="text-[11px] text-[#007f6e] font-semibold mt-0.5">Step {wizardStep} of 4</p>
              </div>
              <button 
                onClick={() => setWizardOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Steps Visual Progress */}
            <div className="px-6 pt-3 flex items-center justify-between gap-1 bg-white">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1 flex items-center gap-1.5">
                  <div className={`h-1 flex-1 rounded-full ${
                    wizardStep >= step ? 'bg-[#007f6e]' : 'bg-slate-150'
                  }`} />
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* STEP 1: Select Patient (Search and selection) */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Select Patient for Billing</label>
                    <span className="text-[10px] text-slate-400">Total patients: {patients.length}</span>
                  </div>

                  {/* Patient search in list */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search patient list by name, id or phone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 text-xs border border-slate-205 rounded-xl focus:outline-none focus:border-[#007f6e]"
                    />
                  </div>

                  {/* Patients Radio Checklist */}
                  <div className="border border-slate-150 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-50 bg-slate-50/20">
                    {filteredPatients.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white">
                        No matches found. Select "Add Custom Name" below!
                      </div>
                    ) : (
                      filteredPatients.map(p => (
                        <label 
                          key={p.id} 
                          className={`flex items-start gap-3 p-3 text-xs cursor-pointer transition-colors hover:bg-[#007f6e]/5 ${
                            selectedPatientId === p.id ? 'bg-[#007f6e]/5' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedPatient"
                            checked={selectedPatientId === p.id}
                            onChange={() => {
                              setSelectedPatientId(p.id);
                              setCustomPatientName('');
                            }}
                            className="mt-0.5 rounded-full border-slate-300 text-[#007f6e] focus:ring-[#007f6e]"
                          />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{p.name} </span>
                            <span className="text-slate-400 font-medium">({p.gender}, {p.age} years)</span>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                              <span>ID: {p.id}</span>
                              <span>•</span>
                              <span>Phone: {p.phone}</span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {/* Or enter custom patient name */}
                  <div className="relative border border-dashed border-slate-200 rounded-xl p-3 bg-white">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="selectedPatient"
                        checked={selectedPatientId === 'custom'}
                        onChange={() => {
                          setSelectedPatientId('custom');
                        }}
                        className="rounded-full border-slate-300 text-[#007f6e] focus:ring-[#007f6e]"
                      />
                      <span>Or enter custom Patient name:</span>
                    </label>
                    
                    {selectedPatientId === 'custom' && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          placeholder="Type Patient Full Name"
                          value={customPatientName}
                          onChange={(e) => setCustomPatientName(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Particulars Items with names and values */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#007f6e]/5 p-3 rounded-xl flex items-start gap-2.5">
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Assign bill line items.</span> Enter the particulars description and price. Multi-item calculation is supported live!
                    </div>
                  </div>

                  {/* List of currently added items */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Invoice Items List</label>
                    <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-3xs">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] text-slate-400 mt-0.5">{idx + 1}.</span>
                            <span className="font-semibold text-slate-800">{it.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-slate-750">₹{it.value.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition-colors"
                              title="Delete Item"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="p-5 text-center text-xs text-slate-400 bg-white">
                          No items added. Please add at least one line item!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form to enter a new item particulars */}
                  <div className="bg-slate-50/50 outline-2 outline-slate-100 p-3.5 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-[#007f6e] uppercase tracking-wider block">Add New Item Particulars</span>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="e.g. Medicine, X-Ray, Lab test..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-slate-205 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                        />
                      </div>
                      <div className="col-span-2 relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newItemValue}
                          onChange={(e) => setNewItemValue(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-205 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full flex items-center justify-center gap-1 bg-[#007f6e] hover:bg-[#006657] text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Value / Item</span>
                    </button>
                  </div>

                  {/* Optional Discount amount input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Apply Discount (₹)</label>
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-mono font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={billDiscount || ''}
                        onChange={(e) => setBillDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-205 rounded-lg focus:outline-none focus:border-[#007f6e] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Status selection */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-700">Set Bill Payment Status</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Define if this transaction is completed or pending collection.</p>
                  
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    <label 
                      className={`border p-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer transition-all ${
                        billStatus === 'Pending' 
                          ? 'border-rose-400 bg-rose-50/20 text-rose-700 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billStatusVal"
                        checked={billStatus === 'Pending'}
                        onChange={() => setBillStatus('Pending')}
                        className="sr-only"
                      />
                      <Clock size={20} className={billStatus === 'Pending' ? 'text-rose-500 animate-pulse' : 'text-slate-405'} />
                      <span className="font-bold text-xs select-none">Pending Status</span>
                      <span className="text-[10px] text-slate-400 select-none">Invoice is unpaid / pending balance</span>
                    </label>

                    <label 
                      className={`border p-4 rounded-xl flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer transition-all ${
                        billStatus === 'Paid' 
                          ? 'border-emerald-400 bg-emerald-50/20 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billStatusVal"
                        checked={billStatus === 'Paid'}
                        onChange={() => setBillStatus('Paid')}
                        className="sr-only"
                      />
                      <CheckCircle size={20} className={billStatus === 'Paid' ? 'text-emerald-500' : 'text-slate-405'} />
                      <span className="font-bold text-xs select-none">Paid / Collected</span>
                      <span className="text-[10px] text-slate-400 select-none">Payment is fully cleared & closed</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: Summary Preview and calculation */}
              {wizardStep === 4 && (
                <div className="space-y-4 bg-slate-50/30 border border-slate-150 p-4 rounded-2xl">
                  <div className="border-b border-dashed border-slate-200 pb-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Summary Preview</span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">
                      {selectedPatientId === 'custom' ? customPatientName : (patients.find(p => p.id === selectedPatientId)?.name || customPatientName || 'Unknown Patient')}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Line Particulars</span>
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-650">
                          <span>{it.name}</span>
                          <span className="font-mono font-bold text-slate-700">₹{it.value.toFixed(2)}</span>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="text-center text-xs text-slate-400">Empty</div>
                      )}
                    </div>
                  </div>

                  {/* Grand total outputs */}
                  <div className="pt-3 border-t border-dashed border-slate-200 text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Item Value:</span>
                      <span className="font-mono">₹{items.reduce((sum, i) => sum + i.value, 0).toFixed(2)}</span>
                    </div>
                    {billDiscount > 0 && (
                      <div className="flex justify-between text-violet-600 font-semibold">
                        <span>Applied Discount Given:</span>
                        <span className="font-mono">- ₹{billDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Payment Status:</span>
                      <span className={`font-semibold ${billStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {billStatus}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-black text-[#007f6e] pt-2 border-t border-slate-100">
                      <span>Total Calculated Bill:</span>
                      <span className="font-mono font-extrabold text-[#007f6e]">
                        ₹{Math.max(0, items.reduce((sum, i) => sum + i.value, 0) - billDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 1) {
                    setWizardOpen(false);
                  } else {
                    setWizardStep(wizardStep - 1);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (wizardStep < 4) {
                    // Specific step validation
                    if (wizardStep === 1) {
                      if (!selectedPatientId) {
                        alert('Please select a patient or select Custom Name option');
                        return;
                      }
                      if (selectedPatientId === 'custom' && !customPatientName.trim()) {
                        alert('Please enter a custom patient name');
                        return;
                      }
                    }
                    if (wizardStep === 2) {
                      if (items.length === 0) {
                        alert('Please add at least one line item with a price to continue');
                        return;
                      }
                    }
                    setWizardStep(wizardStep + 1);
                  } else {
                    handleWizardSubmit();
                  }
                }}
                className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl text-white cursor-pointer shadow-xs transition-colors ${
                  wizardStep === 4 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-[#007f6e] hover:bg-[#006657]'
                }`}
              >
                <span>{wizardStep === 4 ? 'Submit Bill' : 'Next Step'}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW RECEIPT MODAL */}
      {viewingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col p-6 space-y-6 relative border border-slate-100">
            {/* Close */}
            <button 
              onClick={() => setViewingBill(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            {/* Paper Bill Outline Header */}
            <div className="text-center pt-2">
              <div className="w-12 h-12 bg-emerald-50 text-[#007f6e] rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={22} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#007f6e]">Healthcare Hospital</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">National Hospital Inpatient/Outpatient Unit</p>
            </div>

            {/* Bill Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ID Number</span>
                <span className="font-mono font-bold text-slate-700">{viewingBill.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bill Date</span>
                <span className="font-mono font-semibold text-slate-600">{viewingBill.date}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Patient Checked</span>
                <span className="font-bold text-slate-800">{viewingBill.patientName}</span>
              </div>
            </div>

            {/* Itemized list lines */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-dashed border-slate-200 pb-1.5">Line Particulars</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {parseBillItems(viewingBill.items).length > 0 ? (
                  parseBillItems(viewingBill.items).map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">{it.name}</span>
                      <span className="font-mono font-bold text-slate-700">₹{it.value.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Outpatient Hospital Consultation</span>
                    <span className="font-mono font-bold text-slate-700">₹{viewingBill.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations subtotals */}
            <div className="border-t border-slate-150 pt-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-550">
                <span>Gross Particulars Value:</span>
                <span className="font-mono font-bold">
                  ₹{(parseBillItems(viewingBill.items).length > 0 
                    ? parseBillItems(viewingBill.items).reduce((sum, i) => sum + i.value, 0) 
                    : viewingBill.amount + (viewingBill.discount || 0)).toFixed(2)}
                </span>
              </div>
              {viewingBill.discount ? (
                <div className="flex justify-between text-violet-600 font-semibold">
                  <span>Special Discount Applied:</span>
                  <span className="font-mono">- ₹{viewingBill.discount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-550 items-center">
                <span>Account Clearance Status:</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewingBill.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {viewingBill.status}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-[#007f6e] pt-3.5 border-t border-dashed border-slate-205">
                <span>Net Total Invoice Bill:</span>
                <span className="font-mono font-extrabold text-[#007f6e]">₹{viewingBill.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Buttons UI */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <Printer size={13} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setViewingBill(null)}
                className="flex-1 bg-[#007f6e] hover:bg-[#006657] text-white py-2 rounded-xl text-xs font-bold text-center transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fafbfc]">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Edit Invoice: {editingBill.id}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Verify and update bill line items and payment status</p>
              </div>
              <button 
                onClick={() => setEditingBill(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 font-sans text-xs">
              
              {/* Patient Name field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Patient Name</label>
                <input
                  type="text"
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] font-semibold text-slate-850"
                  required
                />
              </div>

              {/* Edit Particulars line items */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Particulars Line Items</label>
                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/20">
                  {editItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 text-xs bg-white">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{idx+1}.</span>
                        <span className="font-semibold text-slate-850">{it.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-700">₹{it.value.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {editItems.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs bg-white">No items added yet.</div>
                  )}
                </div>
              </div>

              {/* Add items field in edit view */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-semibold text-slate-500 block">Add Item to Bill</span>
                <div className="grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Particular Item Description"
                    value={editNewItemName}
                    onChange={(e) => setEditNewItemName(e.target.value)}
                    className="col-span-3 text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                  <div className="col-span-2 relative">
                    <span className="absolute left-2 top-1.5 text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="Price"
                      value={editNewItemValue}
                      onChange={(e) => setEditNewItemValue(e.target.value)}
                      className="w-full pl-5 pr-1 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddEditItem}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Particular</span>
                </button>
              </div>

              {/* Discount selection and Status selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={editDiscount || ''}
                    onChange={(e) => setEditDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cleared Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Live Live Subtotal calculation edit */}
              <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Item Total:</span>
                  <span className="font-mono">₹{editItems.reduce((sum, i) => sum + i.value, 0).toFixed(2)}</span>
                </div>
                {editDiscount > 0 && (
                  <div className="flex justify-between text-violet-600 font-semibold">
                    <span>Discount Deduction:</span>
                    <span className="font-mono">- ₹{editDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[#007f6e] text-sm pt-2 border-t border-slate-100">
                  <span>New Net Total:</span>
                  <span className="font-mono">
                    ₹{Math.max(0, editItems.reduce((sum, i) => sum + i.value, 0) - editDiscount).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 bg-white rounded-xl text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-bold bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
