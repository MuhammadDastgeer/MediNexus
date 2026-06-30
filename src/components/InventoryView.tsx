import React, { useState, useEffect } from 'react';
import { RefreshCw, ClipboardList, ListCollapse, PlaySquare, HelpCircle, Sparkles } from 'lucide-react';
import { InventoryItem, Supplier, Purchase, DeptTransfer } from '../types';

// Tab Subcomponents
import InventoryOverviewTab from './InventoryOverviewTab';
import InventoryItemsTab from './InventoryItemsTab';
import InventoryStockTab from './InventoryStockTab';
import InventorySuppliersTab from './InventorySuppliersTab';
import InventoryPurchasesTab from './InventoryPurchasesTab';
import InventoryTransfersTab from './InventoryTransfersTab';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem: (id: string) => void;
  onRestock: (id: string, amount: number) => void;
  onRefresh: () => void;
  onNavigate?: (view: any) => void;
  loggedInUser?: any;
}

export default function InventoryView({
  inventory,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onRestock,
  onRefresh,
  onNavigate,
  loggedInUser = null,
}: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sub-modules state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transfers, setTransfers] = useState<DeptTransfer[]>([]);

  // Fetch SQLite backends for tabs
  const fetchLocalTables = async () => {
    // 1. Fetch Suppliers
    try {
      const supRes = await fetch('/api/suppliers');
      if (supRes.ok) {
        const data = await supRes.json();
        setSuppliers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }

    // 2. Fetch Purchases
    try {
      const purRes = await fetch('/api/purchases');
      if (purRes.ok) {
        const data = await purRes.json();
        setPurchases(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }

    // 3. Fetch Transfers
    try {
      const trRes = await fetch('/api/transfers2');
      if (trRes.ok) {
        const data = await trRes.json();
        setTransfers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    }
  };

  useEffect(() => {
    fetchLocalTables();
  }, [inventory]);

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const id = `sup-${Date.now().toString().slice(-4)}`;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...supplier, id }),
      });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
      });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    const id = `po-${Date.now().toString().slice(-4)}`;
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...purchase, id }),
      });
      if (res.ok) {
        // Automatically increment physical stock of items purchased!
        try {
          const itemsList = JSON.parse(purchase.items);
          for (const item of itemsList) {
            const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            if (invItem) {
              onRestock(invItem.id, item.quantity);
            }
          }
        } catch (e) {
          console.error(e);
        }
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePurchase = async (purchase: Purchase) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
      });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransfer = async (transfer: Omit<DeptTransfer, 'id'>) => {
    const id = `tr-${Date.now().toString().slice(-4)}`;
    try {
      const res = await fetch('/api/transfers2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transfer, id }),
      });
      if (res.ok) {
        // Subtract stock from central storage
        try {
          const itemsList = JSON.parse(transfer.items);
          for (const item of itemsList) {
            const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            if (invItem) {
              const newStock = Math.max(0, invItem.stock - item.quantity);
              await fetch(`/api/inventory/${invItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock }),
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
        onRefresh();
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/transfers2/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocalTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMasterRefresh = () => {
    onRefresh();
    fetchLocalTables();
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans" id="inventory-workspace">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="inventory-header">
        <div>
          <h1 className="text-xl font-extrabold text-[#007f6e] tracking-tight" id="inventory-title">Clinic Inventory Suite</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control items, stock warnings, trade vendors, purchases orders & department transfers.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setActiveTab('items');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <span>+ Add New Item</span>
          </button>
          <button
            onClick={handleMasterRefresh}
            title="Refresh inventory catalog"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-100 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto whitespace-nowrap scrollbar-hide" id="inventory-navigation">
        {[
          { id: 'overview', label: 'Overview', badge: null },
          { id: 'items', label: 'Items', badge: inventory.length },
          { id: 'stock', label: 'Stock', badge: inventory.filter(i => i.stock <= i.minStock).length || null },
          { id: 'suppliers', label: 'Suppliers', badge: suppliers.length },
          { id: 'purchases', label: 'Purchases', badge: null },
          { id: 'transfers', label: 'Dept Transfers', badge: null },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'border-[#007f6e] text-[#007f6e]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{t.label}</span>
            {t.badge !== null && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === t.id 
                  ? 'bg-[#007f6e] text-white' 
                  : t.id === 'stock' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ACTIVE VIEW TAB */}
      <div className="mt-4" id="inventory-tab-pannel">
        {activeTab === 'overview' && (
          <InventoryOverviewTab
            inventory={inventory}
            suppliers={suppliers}
            purchases={purchases}
            transfers={transfers}
            onSwitchTab={setActiveTab}
            onOpenAddModal={() => {
              setActiveTab('items');
              setShowAddModal(true);
            }}
          />
        )}

        {activeTab === 'items' && (
          <InventoryItemsTab
            inventory={inventory}
            onAddInventoryItem={onAddInventoryItem}
            onUpdateInventoryItem={onUpdateInventoryItem}
            onDeleteInventoryItem={onDeleteInventoryItem}
            showAddModal={showAddModal}
            onCloseAddModal={() => setShowAddModal(false)}
            suppliers={suppliers}
            onRefresh={onRefresh}
            loggedInUser={loggedInUser}
          />
        )}

        {activeTab === 'stock' && (
          <InventoryStockTab
            inventory={inventory}
            onRestock={onRestock}
            onUpdateInventoryItem={onUpdateInventoryItem}
          />
        )}

        {activeTab === 'suppliers' && (
          <InventorySuppliersTab
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeTab === 'purchases' && (
          <InventoryPurchasesTab
            purchases={purchases}
            suppliers={suppliers}
            inventory={inventory}
            onAddPurchase={handleAddPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {activeTab === 'transfers' && (
          <InventoryTransfersTab
            transfers={transfers}
            inventory={inventory}
            onAddTransfer={handleAddTransfer}
            onDeleteTransfer={handleDeleteTransfer}
          />
        )}
      </div>
    </div>
  );
}
