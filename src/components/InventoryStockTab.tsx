import React, { useState } from 'react';
import { Search, Sparkles, ShoppingBag, Plus, Eye, CheckCircle, PackageOpen } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryStockTabProps {
  inventory: InventoryItem[];
  onRestock: (id: string, amount: number) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
}

export default function InventoryStockTab({
  inventory,
  onRestock,
  onUpdateInventoryItem,
}: InventoryStockTabProps) {
  const [search, setSearch] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'All' | 'Low' | 'OutOfStock'>('All');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'Restock' | 'Override'>('Restock');

  const stockValue = inventory.reduce((sum, item) => sum + (item.stock * (item.price || 0)), 0);
  const lowStockCount = inventory.filter((item) => item.stock <= (item.minStock || 0)).length;
  const outOfStockCount = inventory.filter((item) => item.stock <= 0).length;

  // Filter items
  const filtered = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    
    if (selectedStockStatus === 'Low') {
      return matchesSearch && item.stock <= (item.minStock || 0);
    }
    if (selectedStockStatus === 'OutOfStock') {
      return matchesSearch && item.stock <= 0;
    }
    return matchesSearch;
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || !adjustQty) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty < 0) {
      alert('Invalid quantity.');
      return;
    }

    if (adjustType === 'Restock') {
      onRestock(adjustingItem.id, qty);
    } else {
      onUpdateInventoryItem({
        ...adjustingItem,
        stock: qty,
      });
    }

    setAdjustQty('');
    setAdjustingItem(null);
  };

  return (
    <div className="space-y-6" id="inventory-stock-tab">
      {/* Top Cards in Stock Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stock-kpis">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
            <span className="text-2xl font-extrabold text-slate-800">{inventory.length}</span>
            <span className="text-[10px] text-emerald-600 block">✓ Healthy directory</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f2f0] text-[#007f6e] rounded-xl flex items-center justify-center font-bold">✓</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Value</span>
            <span className="text-2xl font-extrabold text-[#007f6e]">₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-400 block">Physical valuation</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#007f6e] rounded-xl flex items-center justify-center font-bold">₹</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Limit</span>
            <span className="text-2xl font-extrabold text-amber-500">{lowStockCount}</span>
            <span className="text-[10px] text-slate-400 block">Below warning level</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">!</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Out of stock</span>
            <span className="text-2xl font-extrabold text-rose-500">{outOfStockCount}</span>
            <span className="text-[10px] text-slate-400 block">Zero physical units</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-bold">0</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="stock-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search items by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex rounded-xl bg-slate-100 p-0.5" id="stock-status-segment-control">
            {[
              { id: 'All', label: 'All Qty' },
              { id: 'Low', label: 'Low Stock' },
              { id: 'OutOfStock', label: 'OutOfStock' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStockStatus(st.id as any)}
                className={`text-[10px] px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedStockStatus === st.id
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('AI Bulk Importer: Triggering intelligence parsing modules for invoices.')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-650 text-white hover:from-indigo-650 hover:to-violet-600 border-none rounded-xl text-xs font-bold px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles size={13} />
            <span>AI Bulk Import</span>
          </button>
        </div>
      </div>

      {/* Stock Levels Table grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="stock-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Clinic Asset</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit Name</th>
                <th className="px-6 py-3">Current Stock</th>
                <th className="px-6 py-3">Min Level</th>
                <th className="px-6 py-3">Stock Valuation</th>
                <th className="px-6 py-3">Health Status</th>
                <th className="px-6 py-3 text-right">Quick Stock actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <PackageOpen size={24} className="text-slate-300" />
                      <p className="font-bold text-xs">No matching supplies checked</p>
                      <p className="text-[10px]">Adjust search queries or reset segment controllers.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOutOfStock = item.stock <= 0;
                  const isLowStock = item.stock <= (item.minStock || 0);
                  const isHealthy = !isLowStock && !isOutOfStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[9px] font-bold font-mono text-slate-400">ID: {item.id}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3">{item.unit || 'Pcs'}</td>
                      <td className={`px-6 py-3 font-mono font-black ${
                        isOutOfStock ? 'text-rose-504' : isLowStock ? 'text-amber-500' : 'text-[#007f6e]'
                      }`}>
                        {item.stock} {item.unit || 'Pcs'}
                      </td>
                      <td className="px-6 py-3 font-mono">{item.minStock || 0} {item.unit || 'Pcs'}</td>
                      <td className="px-6 py-3 font-mono font-semibold text-slate-800">
                        ₹{(item.stock * (item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3">
                        {isOutOfStock ? (
                          <span className="bg-rose-50 text-rose-600 text-[9px] px-2 py-0.5 rounded-full font-bold">OutOfStock</span>
                        ) : isLowStock ? (
                          <span className="bg-amber-50 text-amber-600 text-[9px] px-2 py-0.5 rounded-full font-bold">Low warning alert</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                            <CheckCircle size={10} /> Fully Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustType('Restock');
                          }}
                          className="text-[10px] font-bold bg-emerald-50 text-[#007f6e] px-2.5 py-1.5 rounded-xl hover:bg-[#e6f2f0] transition-colors cursor-pointer mr-1"
                        >
                          + Restock
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustType('Override');
                          }}
                          className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Overide count
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock counts Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700">
          <form onSubmit={handleAdjustSubmit} className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-[#007f6e] text-white p-4">
              <h3 className="text-sm font-bold">
                {adjustType === 'Restock' ? 'Restock order helper' : 'Override Inventory Count'}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-1">{adjustingItem.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs">
                <span>Current catalog count:</span>
                <strong>{adjustingItem.stock} {adjustingItem.unit || 'Pcs'}</strong>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {adjustType === 'Restock' ? 'Restock Quantity' : 'Absolute Qty override'}
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder={adjustType === 'Restock' ? 'e.g. 50' : 'e.g. 0'}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                  required
                  min="0"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                {adjustType === 'Restock' 
                  ? 'Adds this value onto the stock tally.' 
                  : 'Adjusts the actual available quantity in clinical registries immediately.'
                }
              </p>
            </div>

            <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="text-xs font-bold text-slate-500 hover:bg-slate-105 border border-slate-200 bg-white px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Confirm adjustments
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
