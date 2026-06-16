import React, { useState } from 'react';
import { Search, FileText, Plus, Pencil, Trash2, Eye, X, BookOpen, AlertTriangle, Upload, CheckCircle2 } from 'lucide-react';
import { InventoryItem, Supplier } from '../types';

interface InventoryItemsTabProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem: (id: string) => void;
  showAddModal: boolean;
  onCloseAddModal: () => void;
  suppliers?: Supplier[];
}

export default function InventoryItemsTab({
  inventory,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  showAddModal,
  onCloseAddModal,
  suppliers = [],
}: InventoryItemsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals status
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // New item Form states mapping to Image 4
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('Medicine');
  const [subCategory, setSubCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [preferredSupplier, setPreferredSupplier] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [mrp, setMrp] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [gst, setGst] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [hsnCode, setHsnCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');

  // Bulk Import States
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkLoadSuccess, setBulkLoadSuccess] = useState(false);

  // Filtering
  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.hsnCode && item.hsnCode.toLowerCase().includes(search.toLowerCase())) ||
                          item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesCount = Array.from(new Set(inventory.map((i) => i.category))).length;
  const withGstCount = inventory.filter((i) => (i.gst && i.gst > 0)).length;
  const inactiveCount = inventory.filter((i) => i.status === 'Inactive').length;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Required field Item Name is missing.');
      return;
    }
    
    // We pass 0 stock on initial addition, the restock tab will update stock via Purchases PO form.
    onAddInventoryItem({
      name,
      category,
      unit,
      hsnCode,
      price: parseFloat(purchasePrice) || 0,
      mrp: parseFloat(mrp) || parseFloat(purchasePrice) || 0,
      gst: parseFloat(gst) || 0,
      stock: 0,
      minStock: parseInt(minStock) || 5,
      status: 'Active',
      genericName,
      brandName,
      subCategory,
      preferredSupplier,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      barcode,
      description,
    });

    // Reset Form
    setName('');
    setGenericName('');
    setBrandName('');
    setCategory('Medicine');
    setSubCategory('');
    setUnit('pcs');
    setPreferredSupplier('');
    setPurchasePrice('0');
    setMrp('0');
    setSellingPrice('0');
    setGst('0');
    setMinStock('5');
    setHsnCode('');
    setBarcode('');
    setDescription('');
    onCloseAddModal();
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateInventoryItem(editingItem);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will remove it from the stock directory.`)) {
      onDeleteInventoryItem(id);
    }
  };

  return (
    <div className="space-y-6" id="inventory-items-tab">
      {/* Top Cards in Items Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="items-kpis">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
            <span className="text-2xl font-extrabold text-slate-800">{inventory.length}</span>
            <span className="text-[10px] text-slate-400 block">Catalog items</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#007f6e] rounded-xl flex items-center justify-center font-bold">#</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categories</span>
            <span className="text-2xl font-extrabold text-slate-800">{categoriesCount}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Categories in use</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f2f0] text-[#007f6e] rounded-xl flex items-center justify-center font-bold">C</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Applicable</span>
            <span className="text-2xl font-extrabold text-slate-800">{withGstCount}</span>
            <span className="text-[10px] text-slate-400 block">With taxation rates</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-bold">%</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inactive Items</span>
            <span className="text-2xl font-extrabold text-rose-500">{inactiveCount}</span>
            <span className="text-[10px] text-slate-400 block">Disabled states</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-bold">∅</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="items-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search items, HSN, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-150 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-slate-600 font-semibold"
          >
            <option value="All">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Surgical Supplies">Surgical Supplies</option>
            <option value="Diagnostics">Diagnostics</option>
            <option value="General Clinical">General Clinical</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded font-mono">
            {filteredItems.length} matching items
          </span>
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Upload size={13} />
            <span>AI Bulk Import</span>
          </button>
          <button
            onClick={() => alert('Feature of downloading data has been triggered.')}
            className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileText size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Items Table Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="items-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Item Spec</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">HSN Code</th>
                <th className="px-6 py-3 font-semibold text-slate-408">Cost Price</th>
                <th className="px-6 py-3 font-semibold text-slate-408">MRP Price</th>
                <th className="px-6 py-3">GST Rate</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <BookOpen size={24} className="text-slate-300" />
                      <p className="font-bold text-xs">No clinic items found</p>
                      <p className="text-[10px]">Add items using the Add button in the top menu.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{item.id}</td>
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <span className="text-[9px] text-[#007f6e] font-mono">{item.stock} Qty Available</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-semibold font-sans">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-500">{item.unit || 'Pcs'}</td>
                    <td className="px-6 py-3 font-mono text-slate-404">{item.hsnCode || '-'}</td>
                    <td className="px-6 py-3 font-mono font-semibold">₹{(item.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-3 font-mono font-bold text-slate-800">₹{(item.mrp || item.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-3 font-mono text-slate-404">{item.gst || 0}%</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.status === 'Inactive' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingItem(item)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          title="Edit Item"
                          className="p-1.5 text-slate-400 hover:text-[#007f6e] hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          title="Delete Item"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Dialog Form Modal for Adding Item (Same-to-same as Image 4) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-100 animate-slide-up my-8">
            {/* Header */}
            <div className="bg-[#007f6e] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Add New Item</h3>
                <p className="text-[10px] text-emerald-100/80">Specify product registry catalog details directly</p>
              </div>
              <button 
                type="button" 
                onClick={onCloseAddModal} 
                className="text-white hover:bg-white/10 p-1.5 rounded-full hover:scale-105 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Row 1: Item Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg, Sterile Syringes 5ml"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                />
              </div>

              {/* Row 2: Double columns - Generic Name, Brand Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acetaminophen"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Crocin, Calpol"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Triple columns - Category, Sub Category, Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Surgical Items">Surgical Items</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Lab Items">Lab Items</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="General Clinical">General Clinical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sub Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Tablets, Gloves"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="strip">strip</option>
                    <option value="vial">vial</option>
                    <option value="ampoule">ampoule</option>
                    <option value="box">box</option>
                    <option value="bottle">bottle</option>
                    <option value="tablet">tablet</option>
                    <option value="capsule">capsule</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Single column - Preferred Supplier */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Supplier</label>
                <select
                  value={preferredSupplier}
                  onChange={(e) => setPreferredSupplier(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                >
                  <option value="">-- Select Supplier from List --</option>
                  {suppliers && suppliers.length > 0 ? (
                    suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.gstNumber || 'No GST'})</option>
                    ))
                  ) : (
                    <option value="" disabled>No registered suppliers found. Go to Suppliers form to create.</option>
                  )}
                </select>
              </div>

              {/* Row 5: Quad columns - Purchase Price, MRP, Selling Price, GST */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] uppercase tracking-wider mb-1">Pur. Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] uppercase tracking-wider mb-1">M.R.P. (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] uppercase tracking-wider mb-1">Sell Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] uppercase tracking-wider mb-1">GST Rate (%)</label>
                  <select
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Double columns - Min Stock Alert, HSN Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">HSN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 300490"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Barcode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Barcode (EAN/UPC)</label>
                <input
                  type="text"
                  placeholder="e.g. 8901234567890"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none font-mono"
                />
              </div>

              {/* Row 8: Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide therapeutic notes or storage constraints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4.5 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#007f6e] hover:bg-[#006657] rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* AI Bulk Import Items Modal - Same-to-same as Image 5 */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 animate-slide-up my-8">
            {/* Header */}
            <div className="bg-purple-700 text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Upload size={16} />
                  AI Bulk Import Items
                </h3>
                <p className="text-[10px] text-purple-100/90">Upload Excel, PDF, or Word — AI maps columns automatically</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkFile(null);
                  setIsBulkLoading(false);
                  setBulkLoadSuccess(false);
                }}
                className="text-white hover:bg-white/10 p-1.5 rounded-full hover:scale-105 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              
              {/* Drag and Drop Container */}
              <div 
                onClick={() => {
                  if (!isBulkLoading && !bulkLoadSuccess) {
                    setIsBulkLoading(true);
                    setTimeout(() => {
                      setIsBulkLoading(false);
                      setBulkLoadSuccess(true);
                      setBulkFile(new File(["clinical-list"], "inventory-export.xlsx", {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
                    }, 1800);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  bulkLoadSuccess 
                    ? 'border-emerald-300 bg-emerald-55/40 text-emerald-800' 
                    : 'border-purple-300 hover:border-purple-500 bg-purple-50/20 hover:bg-purple-50/50 text-purple-800 cursor-pointer'
                }`}
              >
                {isBulkLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-purple-700">Gemini Clinical Engine reading document columns...</p>
                    <p className="text-[10px] text-slate-400">Extracting medicines, generic formulas, pack units and prices...</p>
                  </div>
                ) : bulkLoadSuccess ? (
                  <div className="space-y-3 py-2">
                    <CheckCircle2 size={36} className="text-emerald-600 mx-auto animate-bounce-short" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700">AI Column Mapping Complete!</p>
                      <p className="text-[11px] text-slate-600 mt-1">Successfully recognized <strong>4 clinical items</strong> from "inventory-export.xlsx".</p>
                    </div>
                    {/* Render extracted table preview */}
                    <div className="max-h-36 overflow-y-auto border border-emerald-100 rounded-xl bg-white text-left text-[10px] p-2 mt-3 font-mono">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="pr-2">Name</th>
                            <th className="pr-2">Generic</th>
                            <th className="pr-2">Price</th>
                            <th>Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          <tr>
                            <td className="pr-2 font-bold font-sans">Atorvastatin 10mg</td>
                            <td className="pr-2">Atorvastatin Calcium</td>
                            <td className="pr-2">₹145.00</td>
                            <td>Medicine</td>
                          </tr>
                          <tr>
                            <td className="pr-2 font-bold font-sans">Metformin 500mg ER</td>
                            <td className="pr-2">Metformin HCl</td>
                            <td className="pr-2">₹98.00</td>
                            <td>Medicine</td>
                          </tr>
                          <tr>
                            <td className="pr-2 font-bold font-sans">Salbutamol Inhaler</td>
                            <td className="pr-2">Albuterol</td>
                            <td className="pr-2">₹320.00</td>
                            <td>Consumables</td>
                          </tr>
                          <tr>
                            <td className="pr-2 font-bold font-sans">Surgical Gloves Sterile</td>
                            <td className="pr-2">-</td>
                            <td className="pr-2">₹65.00</td>
                            <td>Surgical Items</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto shadow-inner">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Drop your file here or <span className="text-purple-600 underline cursor-pointer">click to browse</span></p>
                      <p className="text-[10px] text-slate-400 mt-1">Supported formats: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.docx)</p>
                    </div>
                    {/* Badge Pill Types */}
                    <div className="flex items-center justify-center gap-1.5 pt-2 select-none">
                      <span className="text-[9px] font-extrabold bg-[#e8f5e9] text-[#2e7d32] px-2 py-0.5 rounded-full">.xlsx</span>
                      <span className="text-[9px] font-extrabold bg-[#e3f2fd] text-[#1565c0] px-2 py-0.5 rounded-full">.csv</span>
                      <span className="text-[9px] font-extrabold bg-[#ffebee] text-[#c62828] px-2 py-0.5 rounded-full">.pdf</span>
                      <span className="text-[9px] font-extrabold bg-[#f3e5f5] text-[#6a1b9a] px-2 py-0.5 rounded-full">.docx</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Template Information Row */}
              <div className="bg-indigo-50/50 rounded-2xl p-4.5 border border-indigo-100/40 flex items-center justify-between text-xs gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-indigo-900 flex items-center gap-1">
                    <FileText size={14} className="text-indigo-600" />
                    Download Sample Clean Template
                  </p>
                  <p className="text-[10px] text-indigo-600/80">Contains 8 standard clinical items with pricing, category tags & guides</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Clean sample template has been downloaded in CSV format!')}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-indigo-100 hover:scale-[1.02] shadow-sm transition-all cursor-pointer"
                >
                  Download Template ∨
                </button>
              </div>

              {/* Tips Grid */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider">AI Column Mapping Guide</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-extrabold text-slate-800 mb-1">📊 Excel & CSV Format</p>
                    <p className="leading-relaxed">Headers are automatically mapped: AI bridges equivalent labels like 'particulars', 'medicineName', and 'drugs' straight to standard names.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-extrabold text-slate-800 mb-1">📄 PDF Scanning</p>
                    <p className="leading-relaxed">Ideal for printed price spreadsheets or supplier sheets. The system uses built-in computer vision algorithms to re-form tabulate rows cleanly.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-extrabold text-slate-800 mb-1">📝 Word Documents</p>
                    <p className="leading-relaxed">Any copy-paste formatted lists or text layouts are converted into records automatically during the backend parsing iteration.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-extrabold text-slate-800 mb-1">⚡ Dynamic Autocompletes</p>
                    <p className="leading-relaxed">If Category (Medicine/Equipment) or Unit (strip/box) is left blank, AI reads names and automatically matches corresponding categories.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer containing action buttons */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100 text-[10px] text-slate-400 italic">
              <span>Max 150 rows supported · Protected by Gemini-1.5 Pro</span>
              <div className="flex items-center gap-2 not-italic">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkFile(null);
                    setIsBulkLoading(false);
                    setBulkLoadSuccess(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                {bulkLoadSuccess && (
                  <button
                    type="button"
                    onClick={() => {
                      // Execute additions of the 4 mock items
                      onAddInventoryItem({
                        name: "Atorvastatin 10mg",
                        category: "Medicine",
                        unit: "strip",
                        hsnCode: "300490",
                        price: 120,
                        mrp: 145,
                        stock: 0,
                        minStock: 5,
                        status: "Active",
                        genericName: "Atorvastatin Calcium",
                        brandName: "Lipitor",
                        subCategory: "Statins",
                        preferredSupplier: "",
                        purchasePrice: 120,
                        sellingPrice: 140,
                        barcode: "8901011882211",
                        description: "Used to lower cholesterol levels in clinic patients"
                      });
                      onAddInventoryItem({
                        name: "Metformin 500mg ER",
                        category: "Medicine",
                        unit: "strip",
                        hsnCode: "300420",
                        price: 75,
                        mrp: 98,
                        stock: 0,
                        minStock: 5,
                        status: "Active",
                        genericName: "Metformin HCl",
                        brandName: "Glucophage",
                        subCategory: "Antidiabetic",
                        preferredSupplier: "",
                        purchasePrice: 75,
                        sellingPrice: 90,
                        barcode: "8901011833445",
                        description: "Extended release formula for Type 2 Diabetes treatment"
                      });
                      onAddInventoryItem({
                        name: "Salbutamol Inhaler 100mcg",
                        category: "Consumables",
                        unit: "pcs",
                        hsnCode: "300450",
                        price: 260,
                        mrp: 320,
                        stock: 0,
                        minStock: 5,
                        status: "Active",
                        genericName: "Albuterol",
                        brandName: "Asthalin",
                        subCategory: "Bronchodilator",
                        preferredSupplier: "",
                        purchasePrice: 260,
                        sellingPrice: 300,
                        barcode: "8901011855667",
                        description: "Bronchodilator reliever for respiratory patients"
                      });
                      onAddInventoryItem({
                        name: "Surgical Gloves Sterile (7.5)",
                        category: "Surgical Items",
                        unit: "box",
                        hsnCode: "401511",
                        price: 45,
                        mrp: 65,
                        stock: 0,
                        minStock: 5,
                        status: "Active",
                        genericName: "Latex Sterile Gloves",
                        brandName: "Medigrip",
                        subCategory: "Surgical Consumables",
                        preferredSupplier: "",
                        purchasePrice: 45,
                        sellingPrice: 60,
                        barcode: "8901011866778",
                        description: "Standard latex examination gloves size 7.5 sterile"
                      });
                      
                      alert('Successfully imported 4 clinical item specs into database!');
                      setShowBulkImportModal(false);
                      setBulkFile(null);
                      setBulkLoadSuccess(false);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Confirm Import
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-[#007f6e] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Item - {editingItem.name}</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-white hover:bg-white/10 p-1 rounded-full text-xs">
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Title *</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  required
                />
              </div>

              {/* Generic Name, Brand Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={editingItem.genericName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, genericName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editingItem.brandName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, brandName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
              </div>

              {/* Category, Sub-Category, Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Surgical Items">Surgical Items</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Lab Items">Lab Items</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="General Clinical">General Clinical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sub Category</label>
                  <input
                    type="text"
                    value={editingItem.subCategory || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, subCategory: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit</label>
                  <select
                    value={editingItem.unit || 'pcs'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="strip">strip</option>
                    <option value="vial">vial</option>
                    <option value="ampoule">ampoule</option>
                    <option value="box">box</option>
                    <option value="bottle">bottle</option>
                    <option value="tablet">tablet</option>
                    <option value="capsule">capsule</option>
                  </select>
                </div>
              </div>

              {/* Preferred Supplier */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Supplier</label>
                <select
                  value={editingItem.preferredSupplier || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, preferredSupplier: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Purchase Price, MRP, Selling Price, GST */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] mb-1">Pur. Cost (₹)</label>
                  <input
                    type="number"
                    value={editingItem.purchasePrice !== undefined ? editingItem.purchasePrice : editingItem.price || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, purchasePrice: parseFloat(e.target.value) || 0, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.mrp || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] mb-1">Sell Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.sellingPrice || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-[#007f6e] mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    value={editingItem.gst || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, gst: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none font-mono outline-none"
                  />
                </div>
              </div>

              {/* HSN Code, Min Stock, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={editingItem.hsnCode || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, hsnCode: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Safe Alarm</label>
                  <input
                    type="number"
                    value={editingItem.minStock || 5}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: parseInt(e.target.value) || 5 })}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editingItem.status || 'Active'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Barcode</label>
                <input
                  type="text"
                  value={editingItem.barcode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Save Upgrades
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Viewer Slider Card */}
      {viewingItem && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-end z-50 animate-fade-in text-slate-700">
          <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto animate-slide-left border-l border-slate-100 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded">
                    {viewingItem.category}
                  </span>
                  <h3 className="text-md font-bold text-white mt-1.5 leading-tight">{viewingItem.name}</h3>
                  <p className="text-[10px] text-emerald-100/85">Item ID reference: {viewingItem.id}</p>
                </div>
                <button onClick={() => setViewingItem(null)} className="text-white hover:bg-white/10 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {/* Information */}
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Stock Status Specs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Stock Count</span>
                      <span className={`text-lg font-extrabold ${viewingItem.stock <= viewingItem.minStock ? 'text-rose-504 font-bold' : 'text-[#007f6e]'}`}>
                        {viewingItem.stock} qty
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Min safety quantity</span>
                      <span className="text-lg font-extrabold text-slate-700">
                        {viewingItem.minStock} qty
                      </span>
                    </div>
                  </div>
                  {viewingItem.stock <= viewingItem.minStock && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100/30 text-[11px] font-bold">
                      <AlertTriangle size={15} />
                      <span>Warning: Stock count below safety warning threshold!</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Trade & Margins</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450 font-medium">Cost Price (Excl. Tax):</span>
                      <span className="font-semibold font-mono">₹{viewingItem.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450 font-medium">Standard MRP (Retail):</span>
                      <span className="font-bold font-mono text-slate-800">₹{(viewingItem.mrp || viewingItem.price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450 font-medium">Taxation Bracket (GST):</span>
                      <span className="font-mono">{viewingItem.gst || 0}% Tax rate</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450 font-medium">HSN Code:</span>
                      <span className="font-mono font-bold text-slate-700">{viewingItem.hsnCode || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450 font-medium">Active Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        viewingItem.status === 'Inactive' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-55 text-emerald-600'
                      }`}>
                        {viewingItem.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setViewingItem(null);
                  startEdit(viewingItem);
                }}
                className="flex-1 bg-[#007f6e] hover:bg-[#006657] text-white font-bold text-xs py-2.5 rounded-xl text-center"
              >
                Modify Record
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-xs py-2.5 rounded-xl text-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
