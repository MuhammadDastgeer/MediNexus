import React, { useState } from 'react';
import { Truck, RotateCw, Plus, Eye, Trash2, X, PlusCircle, MinusCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { DeptTransfer, InventoryItem } from '../types';

interface InventoryTransfersTabProps {
  transfers: DeptTransfer[];
  inventory: InventoryItem[];
  onAddTransfer: (transfer: Omit<DeptTransfer, 'id'>) => void;
  onDeleteTransfer: (id: string) => void;
}

export default function InventoryTransfersTab({
  transfers,
  inventory,
  onAddTransfer,
  onDeleteTransfer,
}: InventoryTransfersTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<DeptTransfer | null>(null);

  // Form states
  const [department, setDepartment] = useState('OPD');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Completed' | 'Pending'>('Completed');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');

  const [transferLines, setTransferLines] = useState<Array<{ name: string; quantity: number; price: number }>>([
    { name: '', quantity: 10, price: 0 },
  ]);

  const uniqueDeptsCount = Array.from(new Set(transfers.map((t) => t.department))).length;
  const totalQtyDistributed = transfers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
  const totalValDistributed = transfers.reduce((sum, t) => sum + (t.totalValue || 0), 0);

  const addLine = () => {
    setTransferLines([...transferLines, { name: '', quantity: 5, price: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (transferLines.length === 1) return;
    setTransferLines(transferLines.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, itemName: string) => {
    const matchedItem = inventory.find((i) => i.name === itemName);
    const itemPrice = matchedItem ? matchedItem.price : 0;
    
    setTransferLines(
      transferLines.map((line, i) => {
        if (i === idx) {
          return { ...line, name: itemName, price: itemPrice };
        }
        return line;
      })
    );
  };

  const updateLineQty = (idx: number, qty: number) => {
    setTransferLines(
      transferLines.map((line, i) => {
        if (i === idx) {
          return { ...line, quantity: qty };
        }
        return line;
      })
    );
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emptyLine = transferLines.some((line) => !line.name || line.quantity <= 0);
    if (emptyLine) {
      alert('Must select a valid clinical item and positive quantity.');
      return;
    }

    // Verify stock availability
    for (const line of transferLines) {
      const centralItem = inventory.find((i) => i.name === line.name);
      if (!centralItem) {
        alert(`Item ${line.name} not found in catalog.`);
        return;
      }
      if (centralItem.stock < line.quantity) {
        alert(`Insufficient central stock for ${line.name}. Available: ${centralItem.stock}, Requested: ${line.quantity}`);
        return;
      }
    }

    const calculatedQty = transferLines.reduce((sum, line) => sum + line.quantity, 0);
    const calculatedValue = transferLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);

    onAddTransfer({
      department,
      transferDate,
      totalQty: calculatedQty,
      totalValue: calculatedValue,
      items: JSON.stringify(transferLines),
      status,
      priority,
      notes,
    });

    // Reset
    setDepartment('OPD');
    setPriority('Normal');
    setNotes('');
    setTransferLines([{ name: '', quantity: 10, price: 0 }]);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete/undo transfer ${id}? This only removes the transfer history entry; manual stock adjustments apply.`)) {
      onDeleteTransfer(id);
    }
  };

  return (
    <div className="space-y-6" id="inventory-transfers-tab text-slate-700 select-none">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="transfers-kpis">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Departments</span>
            <span className="text-2xl font-extrabold text-slate-800">{uniqueDeptsCount}</span>
            <span className="text-[10px] text-emerald-600 block">With active stock</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f2f0] text-[#007f6e] rounded-xl flex items-center justify-center font-bold">DEPT</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Distributed qty</span>
            <span className="text-2xl font-extrabold text-[#007f6e] font-mono">{totalQtyDistributed}</span>
            <span className="text-[10px] text-slate-410 block">Unique clinical units</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#007f6e] rounded-xl flex items-center justify-center font-bold">#</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Total value</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono">₹{totalValDistributed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-410 block">Valuated at cost</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-bold">₹</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Deliveries Complete</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">100%</span>
            <span className="text-[10px] text-slate-410 block">Transfer rate success</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">✓</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="transfers-toolbar">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Departmental Stock Allocations</h4>
          <p className="text-[10px] text-slate-405 mt-0.5">Manage stock transfers from central storage to wards and clinics.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Refreshing transfer queue logs...')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl cursor-pointer"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-[#007f6e] text-white hover:bg-[#006657] rounded-xl text-xs font-bold px-3.5 py-2 shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Transfer stock</span>
          </button>
        </div>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Truck size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No departmental stock transfers recorded yet</h4>
            <p className="text-xs text-slate-400">Transfer items from central inventory to Emergency, OPD, ICU, or Surgery wards.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#007f6e] text-white hover:bg-[#006657] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Transfer Now
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="transfers-list-card">
          <div className="p-4 border-b border-slate-50 font-bold text-xs text-slate-800 bg-slate-50/40">
            Internal Allocation Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Transfer Ref</th>
                  <th className="px-6 py-3">Recipient Department</th>
                  <th className="px-6 py-3">Allocation Date</th>
                  <th className="px-6 py-3 font-semibold text-slate-403">Allocated Qty</th>
                  <th className="px-6 py-3 font-semibold text-slate-403">Valuation Cost</th>
                  <th className="px-6 py-3">Items allocated</th>
                  <th className="px-6 py-3">Delivery Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => {
                  let parsed: any[] = [];
                  try {
                    parsed = JSON.parse(t.items || '[]');
                  } catch {
                    parsed = [];
                  }
                  const itemsSummary = parsed.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{t.id}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">
                        <div>{t.department}</div>
                        {t.priority && (
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-1 font-sans font-bold uppercase tracking-wider ${
                            t.priority === 'Urgent' ? 'bg-red-50 text-red-650 border border-red-100' :
                            t.priority === 'High' ? 'bg-amber-50 text-amber-650 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {t.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-sans">{t.transferDate}</td>
                      <td className="px-6 py-3 font-mono text-[#007f6e] font-bold">{t.totalQty} Units</td>
                      <td className="px-6 py-3 font-mono">₹{(t.totalValue || 0).toFixed(2)}</td>
                      <td className="px-6 py-3 max-w-xs truncate text-slate-404 font-medium" title={itemsSummary}>
                        {itemsSummary}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {t.status || 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-404">
                          <button
                            onClick={() => setViewingTransfer(t)}
                            title="View log"
                            className="p-1.5 hover:text-slate-700 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            title="Delete transfer log"
                            className="p-1.5 hover:text-rose-600 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Stock modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-707">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 flex flex-col justify-between max-h-[85vh] animate-slide-up">
            <div className="bg-[#007f6e] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Initiate Stock Transfer</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 p-1 rounded-full">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWizardSubmit} className="p-5 space-y-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Ward / Dept *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="OPD">Out-Patient Department (OPD)</option>
                    <option value="IPD">In-Patient Department (IPD)</option>
                    <option value="Emergency">Emergency / Trauma</option>
                    <option value="ICU">Intensive Care (ICU)</option>
                    <option value="Surgery">Surgery / Operation Theatre</option>
                    <option value="Pharmacy">Hospital Pharmacy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              {/* Priority & Delivery Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transfer Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent / Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Completed">Completed (Auto-subtract)</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Authorization / Transfer Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Authorized by Dr. Sharma for emergency ward restock"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              {/* Items list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-404 uppercase tracking-wider">Allocation list</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-[10px] text-[#007f6e] font-bold flex items-center gap-1 bg-[#e6f2f0]/60 px-2 py-1 rounded"
                  >
                    <PlusCircle size={12} /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {transferLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 items-end">
                      <div className="col-span-8">
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Select Item *</label>
                        <select
                          value={line.name}
                          onChange={(e) => updateLineItem(idx, e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                          required
                        >
                          <option value="">-- Select Item --</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.name}>{item.name} ({item.stock} left)</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">Allocation Qty *</label>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 0)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          required
                          min="1"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1 hover:text-rose-600 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <MinusCircle size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#e6f2f0] rounded-xl border border-emerald-100/30 text-[10px] text-slate-600">
                <span className="font-extrabold text-[#007f6e] text-xs block mb-1">Transfer Validation Guard</span>
                Upon submitting, quantities will be subtracted from central storage automatically and allocated to {department} inventories.
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
                Complete Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View manifest log modal */}
      {viewingTransfer && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700 select-none">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold">Internal Manifest Log</h3>
                <p className="text-[9px] text-emerald-105">Code: {viewingTransfer.id}</p>
              </div>
              <button onClick={() => setViewingTransfer(null)} className="text-white hover:bg-white/10 p-1 rounded-full">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Target Department:</span>
                  <strong className="text-slate-800">{viewingTransfer.department}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Transfer Date:</span>
                  <strong className="text-slate-800">{viewingTransfer.transferDate}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Total volume allocated:</span>
                  <strong className="text-[#007f6e] font-mono">{viewingTransfer.totalQty} Units</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Gross bookkeeping rate:</span>
                  <strong className="font-mono">₹{viewingTransfer.totalValue.toFixed(2)}</strong>
                </div>
                {viewingTransfer.priority && (
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Priority Level:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-sans uppercase ${
                      viewingTransfer.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      viewingTransfer.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {viewingTransfer.priority}
                    </span>
                  </div>
                )}
                {viewingTransfer.notes && (
                  <div className="py-2 border-b border-slate-50 text-left space-y-1">
                    <span className="block text-[9px] uppercase font-bold text-slate-400 leading-none">Authorization Memo</span>
                    <p className="text-[11px] text-slate-600 italic leading-snug">{viewingTransfer.notes}</p>
                  </div>
                )}
              </div>

              {/* Table check */}
              <div className="border border-slate-150 rounded-xl overflow-hidden text-[10px]">
                <table className="w-full text-left text-slate-600">
                  <thead className="bg-slate-50 font-bold uppercase text-slate-404">
                    <tr>
                      <th className="px-3 py-1.5">clinical item</th>
                      <th className="px-3 py-1.5 text-right">qty sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      let parsed: any[] = [];
                      try {
                        parsed = JSON.parse(viewingTransfer.items || '[]');
                      } catch {
                        parsed = [];
                      }
                      return parsed.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-bold text-slate-800">{item.name}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-600">{item.quantity}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex">
              <button
                onClick={() => setViewingTransfer(null)}
                className="flex-grow border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-xs py-2.5 rounded-xl text-center cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
