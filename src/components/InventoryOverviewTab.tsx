import React from 'react';
import { ClipboardList, AlertTriangle, ShieldCheck, ArrowRightLeft, TrendingUp, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { InventoryItem, Supplier, Purchase, DeptTransfer } from '../types';

interface InventoryOverviewTabProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchases: Purchase[];
  transfers: DeptTransfer[];
  onSwitchTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export default function InventoryOverviewTab({
  inventory,
  suppliers,
  purchases,
  transfers,
  onSwitchTab,
  onOpenAddModal,
}: InventoryOverviewTabProps) {
  const totalItems = inventory.length;
  const stockValue = inventory.reduce((sum, item) => sum + (item.stock * (item.price || 0)), 0);
  const totalQty = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockItems = inventory.filter((item) => item.stock <= (item.minStock || 0));
  const lowStockCount = lowStockItems.length;

  // Purchases stats
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPaymentAmount = purchases.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
  const paidPurchasesAmount = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  // Transfers stats
  const totalTransferredQty = transfers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
  const uniqueDepts = Array.from(new Set(transfers.map((t) => t.department))).length;

  return (
    <div className="space-y-6" id="inventory-overview-tab">
      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="inventory-metrics-grid">
        {/* Total Items */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalItems}</span>
            <span className="text-[10px] text-emerald-600 font-medium block">✓ Active clinical items</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#007f6e] rounded-xl flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Value</span>
            <span className="text-2xl font-extrabold text-[#007f6e]">₹{stockValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-400 font-medium block">{totalQty} units in stock</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f2f0] text-[#007f6e] rounded-xl flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="text-2xl font-extrabold text-rose-500">{lowStockCount}</span>
            <span className="text-[10px] text-slate-405 font-medium block">
              {lowStockCount > 0 ? 'Requires attention' : 'All stocks healthy'}
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purchases</span>
            <span className="text-2xl font-extrabold text-slate-800">₹{totalPurchasesAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-slate-400 font-medium block">{purchases.length} total orders</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Dept Stock */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dept Stock</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalTransferredQty}</span>
            <span className="text-[10px] text-purple-600 font-medium block">{uniqueDepts} departments</span>
          </div>
          <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={20} />
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="inventory-charts-grid">
        {/* Category Value Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between" id="chart-cat-distribution">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stock by Category</h4>
            <p className="text-[10px] text-slate-400">Distribution of items across categories</p>
          </div>
          
          <div className="py-2 flex flex-col items-center justify-center relative min-h-[140px]">
            {totalItems === 0 ? (
              <span className="text-xs text-slate-400">No category data yet</span>
            ) : (
              <div className="w-full space-y-3">
                {['Antibiotics', 'Surgical Supplies', 'Diagnostics', 'General Clinical'].map((category) => {
                  const catItems = inventory.filter((item) => item.category === category);
                  const count = catItems.length;
                  const percent = totalItems > 0 ? (count / totalItems) * 100 : 0;
                  const colorMap: Record<string, string> = {
                    'Antibiotics': 'bg-emerald-500',
                    'Surgical Supplies': 'bg-sky-500',
                    'Diagnostics': 'bg-amber-500',
                    'General Clinical': 'bg-purple-500',
                  };
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-semibold">{category} ({count})</span>
                        <span className="font-mono">{percent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${colorMap[category] || 'bg-slate-400'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stock Health */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between" id="chart-stock-health">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stock Health</h4>
            <p className="text-[10px] text-slate-400">Inventory warning levels and stats</p>
          </div>
          <div className="min-h-[140px] flex flex-col justify-center space-y-4">
            {totalItems === 0 ? (
              <span className="text-xs text-slate-400 mx-auto">No items in stock</span>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/30">
                    <span className="text-[9px] block font-bold text-emerald-600 uppercase">Healthy</span>
                    <span className="text-lg font-bold text-slate-800">{totalItems - lowStockCount}</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100/30">
                    <span className="text-[9px] block font-bold text-rose-600 uppercase">Low Stock</span>
                    <span className="text-lg font-bold text-rose-500">{lowStockCount}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalItems > 0 ? ((totalItems - lowStockCount) / totalItems) * 100 : 100}%` }} title="Healthy"></div>
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${totalItems > 0 ? (lowStockCount / totalItems) * 100 : 0}%` }} title="Low Stock"></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-405 font-medium px-1">
                  <span>✓ {totalItems - lowStockCount} Optimal qty</span>
                  <span>⚠ {lowStockCount} Critical limit</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Purchase spends */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between" id="chart-purchase-trends">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Spend</h4>
            <p className="text-[10px] text-slate-400">Spend statistics dashboard</p>
          </div>
          <div className="min-h-[140px] flex flex-col justify-center space-y-3">
            <div className="space-y-1.5">
              <span className="text-[9px] block font-semibold text-slate-400 uppercase">Paid Expenses</span>
              <span className="text-lg font-extrabold text-emerald-600">₹{paidPurchasesAmount.toLocaleString()}</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${totalPurchasesAmount > 0 ? (paidPurchasesAmount / totalPurchasesAmount) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] block font-semibold text-slate-400 uppercase">Outstanding Bills</span>
              <span className="text-lg font-extrabold text-rose-500">₹{pendingPaymentAmount.toLocaleString()}</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${totalPurchasesAmount > 0 ? (pendingPaymentAmount / totalPurchasesAmount) * 105 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dept Stock Distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between" id="chart-dept-distribution">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dept Transfers</h4>
            <p className="text-[10px] text-slate-400">Stocks allocated across wards</p>
          </div>
          <div className="min-h-[140px] flex flex-col justify-center">
            {transfers.length === 0 ? (
              <div className="text-center py-4">
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-mono block">No transfers recorded</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {Array.from(new Set(transfers.map(t => t.department))).map((dept) => {
                  const deptTransfers = transfers.filter(t => t.department === dept);
                  const qty = deptTransfers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
                  const val = deptTransfers.reduce((sum, t) => sum + (t.totalValue || 0), 0);
                  return (
                    <div key={dept} className="flex justify-between items-center text-[10px] p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                      <span className="font-bold text-slate-700 truncate">{dept}</span>
                      <span className="font-mono text-[#007f6e] font-semibold">{qty} units (₹{val})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="inventory-secondary-rows">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stock Alerts</h4>
          </div>

          {lowStockCount === 0 ? (
            <div className="py-6 text-center text-slate-450 flex flex-col items-center justify-center space-y-2">
              <ShieldCheck size={36} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">Supplies are healthy</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All clinical assets are fully optimal</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-rose-50/50 border border-rose-100/20 rounded-xl">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 block truncate leading-tight">{item.name}</span>
                    <span className="text-[9px] text-slate-400 tracking-wider uppercase font-medium">{item.category}</span>
                  </div>
                  <span className="text-rose-600 font-extrabold text-[11px] shrink-0 bg-white px-2 py-1 rounded-lg shadow-2xs font-mono">
                    {item.stock} / {item.minStock || 0} Left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h4>
            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3" id="overview-quick-action-btns">
            <button
              onClick={onOpenAddModal}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-[#007f6e] rounded-xl hover:bg-[#e6f2f0]/30 text-slate-700 transition-all text-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#007f6e] flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="text-[10px] font-bold">Add Item</span>
            </button>
            <button
              onClick={() => onSwitchTab('stock')}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-[#007f6e] rounded-xl hover:bg-[#e6f2f0]/30 text-slate-700 transition-all text-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <span className="text-[10px] font-bold">Restock Supplies</span>
            </button>
            <button
              onClick={() => onSwitchTab('suppliers')}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-[#007f6e] rounded-xl hover:bg-[#e6f2f0]/30 text-slate-700 transition-all text-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <ClipboardList size={16} />
              </div>
              <span className="text-[10px] font-bold">New Supplier</span>
            </button>
            <button
              onClick={() => onSwitchTab('transfers')}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-[#007f6e] rounded-xl hover:bg-[#e6f2f0]/30 text-slate-700 transition-all text-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-505 flex items-center justify-center">
                <ArrowRightLeft size={16} />
              </div>
              <span className="text-[10px] font-bold">Transfer Stock</span>
            </button>
          </div>
        </div>

        {/* Expenses Summary Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Summary</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <div>
                <span className="block text-[9px] font-bold text-slate-450 uppercase leading-none mb-0.5">Total Purchases</span>
                <span className="text-xs font-bold text-slate-705">₹{totalPurchasesAmount.toLocaleString()}</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">
                {purchases.length} Order(s)
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-xl">
              <div>
                <span className="block text-[9px] font-bold text-emerald-600 uppercase leading-none mb-0.5">Paid Amount</span>
                <span className="text-xs font-bold text-slate-800">₹{paidPurchasesAmount.toLocaleString()}</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">
                Fully paid
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl">
              <div>
                <span className="block text-[9px] font-bold text-rose-600 uppercase leading-none mb-0.5">Pending Balance</span>
                <span className="text-xs font-bold text-slate-800">₹{pendingPaymentAmount.toLocaleString()}</span>
              </div>
              <span className="text-[9px] font-bold text-rose-700 bg-rose-100/50 px-2 py-0.5 rounded">
                Outstanding
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
