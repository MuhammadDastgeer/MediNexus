import React, { useState } from 'react';
import { Search, RotateCw, FileText, Plus, Eye, Pencil, Trash2, X, AlertTriangle, BookOpen, PlusCircle, MinusCircle } from 'lucide-react';
import { Purchase, Supplier, InventoryItem } from '../types';

interface InventoryPurchasesTabProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  onUpdatePurchase: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
}

export default function InventoryPurchasesTab({
  purchases,
  suppliers,
  inventory,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}: InventoryPurchasesTabProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // New Purchase Wizard states
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [paidAmount, setPaidAmount] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Dynamic Item Lines
  const [itemLines, setItemLines] = useState<Array<{ name: string; quantity: number; price: number }>>([
    { name: '', quantity: 100, price: 10 },
  ]);

  const totalPurchases = purchases.length;
  const totalAmountVal = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmountVal = purchases.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
  const paidAmountVal = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const filteredPurchases = purchases.filter((p) => {
    return p.supplierName.toLowerCase().includes(search.toLowerCase()) || 
           p.id.toLowerCase().includes(search.toLowerCase()) || 
           p.paymentStatus.toLowerCase().includes(search.toLowerCase());
  });

  const addLine = () => {
    setItemLines([...itemLines, { name: '', quantity: 50, price: 5 }]);
  };

  const removeLine = (idx: number) => {
    if (itemLines.length === 1) return;
    setItemLines(itemLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: any) => {
    setItemLines(
      itemLines.map((line, i) => {
        if (i === idx) {
          return { ...line, [field]: val };
        }
        return line;
      })
    );
  };

  const calculateTotal = () => {
    return itemLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Must select a medical vendor.');
      return;
    }
    if (!purchaseDate) {
      alert('Purchase date is required.');
      return;
    }
    if (!dueDate) {
      alert('Due date is required.');
      return;
    }
    if (!paymentStatus) {
      alert('Payment status category is required.');
      return;
    }
    if (!invoiceNo.trim()) {
      alert('Invoice Number is required.');
      return;
    }
    if (!remarks.trim()) {
      alert('Remarks / Purpose details are required.');
      return;
    }
    if (paidAmount === '') {
      alert('Paid amount is required.');
      return;
    }
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    if (!selectedSupplier) return;

    // Check if item lines are valid
    const emptyLine = itemLines.some((line) => !line.name);
    if (emptyLine) {
      alert('All items in the purchase invoice must have a name selected.');
      return;
    }

    const totalCost = calculateTotal();
    const paid = parseFloat(paidAmount || '0');
    const pending = Math.max(0, totalCost - paid);

    onAddPurchase({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      purchaseDate,
      dueDate: dueDate || purchaseDate,
      amount: totalCost,
      paidAmount: paid,
      pendingAmount: pending,
      paymentStatus: paymentStatus,
      items: JSON.stringify(itemLines),
      invoiceNo,
      remarks,
    });

    // Reset Form
    setSupplierId('');
    setPaidAmount('');
    setPaymentStatus('Pending');
    setInvoiceNo('');
    setRemarks('');
    setItemLines([{ name: '', quantity: 100, price: 10 }]);
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    if (!editingPurchase.invoiceNo || !editingPurchase.invoiceNo.trim()) {
      alert('Invoice Number is required.');
      return;
    }
    if (!editingPurchase.purchaseDate) {
      alert('Purchase date is required.');
      return;
    }
    if (!editingPurchase.dueDate) {
      alert('Due date is required.');
      return;
    }
    if (editingPurchase.amount === undefined || editingPurchase.amount <= 0) {
      alert('Valid purchase amount is required.');
      return;
    }
    if (editingPurchase.paidAmount === undefined || editingPurchase.paidAmount < 0) {
      alert('Valid paid amount is required.');
      return;
    }
    if (!editingPurchase.remarks || !editingPurchase.remarks.trim()) {
      alert('Remarks are required.');
      return;
    }

    onUpdatePurchase(editingPurchase);
    setEditingPurchase(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete purchase record ${id}?`)) {
      onDeletePurchase(id);
    }
  };

  return (
    <div className="space-y-6" id="inventory-purchases-tab text-slate-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="purchase-kpis">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
            <span className="text-2xl font-extrabold text-slate-800">₹{totalAmountVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-400 block">{totalPurchases} orders issued</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f2f0] text-[#007f6e] rounded-xl flex items-center justify-center font-bold">PO</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
            <span className="text-2xl font-extrabold text-emerald-600">₹{paidAmountVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-402 block">Settled with suppliers</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-650 rounded-xl flex items-center justify-center font-bold">✓</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
            <span className="text-2xl font-extrabold text-rose-500 font-mono">₹{pendingAmountVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-402 block">Unsettled invoices</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-bold">!</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Ledger</span>
            <span className="text-2xl font-extrabold text-amber-500 font-mono">0</span>
            <span className="text-[10px] text-slate-402 block">Past billing dates</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">∅</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="purchases-toolbar">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search invoice, vendor, payment status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => alert('Refreshing purchases registry...')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl cursor-pointer"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-[#007f6e] text-white hover:bg-[#006657] rounded-xl text-xs font-bold px-3.5 py-2 shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="purchases-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">PO Code</th>
                <th className="px-6 py-3">Supplier Vendor</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Line Items</th>
                <th className="px-6 py-3 font-semibold text-slate-400">Order Amount</th>
                <th className="px-6 py-3 font-semibold text-slate-400">Balance Pending</th>
                <th className="px-6 py-3">Payment Status</th>
                <th className="px-6 py-3">Closing Due Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-450 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-400">
                      <BookOpen size={24} className="text-slate-300" />
                      <p className="font-bold text-xs">No purchase transactions recorded yet</p>
                      <p className="text-[10px]">Issue new purchase orders to restock clinical assets.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => {
                  let parsedItems: any[] = [];
                  try {
                    parsedItems = JSON.parse(pur.items || '[]');
                  } catch {
                    parsedItems = [];
                  }
                  const itemsSummary = parsedItems.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');

                  return (
                    <tr key={pur.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{pur.id}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{pur.supplierName}</td>
                      <td className="px-6 py-3 text-slate-500 font-sans">{pur.purchaseDate}</td>
                      <td className="px-6 py-3 max-w-xs truncate text-slate-404 font-medium" title={itemsSummary}>
                        {itemsSummary || 'No list items'}
                      </td>
                      <td className="px-6 py-3 font-mono font-bold text-slate-800">₹{(pur.amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-3 font-mono text-rose-504">₹{(pur.pendingAmount || 0).toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          pur.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {pur.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-402">{pur.dueDate || pur.purchaseDate}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => setViewingPurchase(pur)}
                            title="Print Invoice / View details"
                            className="p-1.5 hover:text-slate-800 hover:bg-slate-50 rounded"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => setEditingPurchase(pur)}
                            title="Edit Payment balance"
                            className="p-1.5 hover:text-[#007f6e] hover:bg-slate-50 rounded"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(pur.id)}
                            title="Delete PO"
                            className="p-1.5 hover:text-rose-600 hover:bg-slate-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PO Form wizard modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-705">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col justify-between max-h-[92vh] animate-slide-up">
            <div className="bg-[#007f6e] text-white p-4 flex items-center justify-between shadow-2xs">
              <h3 className="text-sm font-bold">New Purchase Invoice Generator</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 p-1 rounded-full">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWizardSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trade Vendor Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                    required
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Invoice Date *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>

              {/* Items Line Fields */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-[10px] font-bold text-slate-404 uppercase tracking-widest">Billing Line Items Allocation</h4>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-[10px] text-[#007f6e] hover:text-[#006657] font-bold flex items-center gap-1 bg-[#e6f2f0]/60 px-2 py-1 rounded"
                  >
                    <PlusCircle size={12} /> Add Line Entry
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {itemLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 items-end">
                      <div className="col-span-6">
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Select Item Supply Name *</label>
                        <select
                          value={line.name}
                          onChange={(e) => updateLine(idx, 'name', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                          required
                        >
                          <option value="">-- Choose Stock Item --</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Qty *</label>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          required
                          min="1"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Cost Rate (₹) *</label>
                        <input
                          type="number"
                          value={line.price}
                          onChange={(e) => updateLine(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1 hover:text-rose-506 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <MinusCircle size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Costing Calculations and payment info */}
              <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="Pending">Pending Payment</option>
                    <option value="Paid">Fully Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="Rate paid down"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="p-3 bg-emerald-50 text-slate-705 border border-emerald-100/30 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Estimated Total</span>
                  <span className="text-lg font-black font-mono mt-0.5">₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Invoice Number & Remarks Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-2026-0041"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Special emergency supply batch"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs font-bold text-slate-500 border border-slate-180 bg-white px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleWizardSubmit}
                className="bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Confirm Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail printable slip invoice log modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700 select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            {/* printable layout */}
            <div className="p-6 space-y-4" id="viewable-purchase-invoice">
              {/* Header block with clinic metadata */}
              <div className="flex justify-between pb-4 border-b border-slate-150">
                <div className="space-y-1">
                  <span className="text-xl font-black text-slate-800 tracking-tight">Purchase Invoice Spec</span>
                  <p className="text-[10px] text-slate-400 leading-none">ID Ref Reference: {viewingPurchase.id}</p>
                </div>
                <span className={`h-fit text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                  viewingPurchase.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {viewingPurchase.paymentStatus}
                </span>
              </div>

              {/* Vendor & Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Trade Supplier Vendor</span>
                  <strong className="text-slate-800 mt-0.5 block">{viewingPurchase.supplierName}</strong>
                  {viewingPurchase.invoiceNo && (
                    <div className="mt-2">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase font-bold text-[#007f6e]">Invoice / Bill Ref</span>
                      <strong className="text-[#007f6e] mt-0.2 block font-mono">{viewingPurchase.invoiceNo}</strong>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Invoiced Timeline</span>
                  <span className="font-semibold block text-slate-700 mt-0.5">Issued: {viewingPurchase.purchaseDate}</span>
                  <span className="font-semibold text-rose-602 text-[10px] block mt-0.5">Due date: {viewingPurchase.dueDate}</span>
                  {viewingPurchase.remarks && (
                    <div className="mt-2">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Remarks</span>
                      <span className="text-slate-600 block text-[10px] italic">{viewingPurchase.remarks}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Table list */}
              <div className="border border-slate-150 rounded-xl overflow-hidden" id="po-lines-list">
                <table className="w-full text-left text-[11px] text-slate-600">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="px-4 py-2">Clinical Item Spec</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Cost Rate</th>
                      <th className="px-4 py-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      let parsed: any[] = [];
                      try {
                        parsed = JSON.parse(viewingPurchase.items || '[]');
                      } catch {
                        parsed = [];
                      }
                      return parsed.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-bold text-slate-800">{item.name}</td>
                          <td className="px-4 py-2 text-right font-mono">{item.quantity}</td>
                          <td className="px-4 py-2 text-right font-mono">₹{Number(item.price).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold">₹{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Balances */}
              <div className="flex justify-end pt-2 text-xs text-right">
                <div className="space-y-1 font-sans">
                  <div>
                    <span className="text-slate-404">Gross Subtotal: </span>
                    <strong className="font-mono pl-3 text-slate-800">₹{viewingPurchase.amount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-bold">Paid Down: </span>
                    <strong className="font-mono text-emerald-700 pl-3">₹{viewingPurchase.paidAmount.toFixed(2)}</strong>
                  </div>
                  <div className="border-t border-slate-150 pt-1 text-sm font-extrabold text-slate-800">
                    <span>Balance outstanding: </span>
                    <span className="font-mono text-rose-504 pl-3">₹{viewingPurchase.pendingAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => alert('Sending to local clinical workstation printer spooler...')}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setViewingPurchase(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Purchase payment status Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700 select-none">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-[#007f6e] text-white p-4">
              <h3 className="text-sm font-bold">Update Invoice Payment Balance</h3>
              <p className="text-[11px] text-emerald-100">PO: {editingPurchase.id}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Current gross total:</span>
                  <strong>₹{editingPurchase.amount.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Paid so far:</span>
                  <span>₹{editingPurchase.paidAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State payment status</label>
                <select
                  value={editingPurchase.paymentStatus}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, paymentStatus: e.target.value as any })}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid (Clears balance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modify Paid Amount (₹)</label>
                <input
                  type="number"
                  value={editingPurchase.paidAmount}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    const pending = Math.max(0, editingPurchase.amount - paid);
                    setEditingPurchase({ ...editingPurchase, paidAmount: paid, pendingAmount: pending });
                  }}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="text-xs font-bold text-slate-400 border border-slate-200 bg-white px-4 py-2 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Confirm upgrades
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
