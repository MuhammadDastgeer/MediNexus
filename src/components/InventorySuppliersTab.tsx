import React, { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, X, ShieldCheck, Mail, Phone, MapPin, Building2, User, Check, ChevronLeft, ChevronRight, FileText, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier } from '../types';

interface InventorySuppliersTabProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export default function InventorySuppliersTab({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}: InventorySuppliersTabProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Add flow states
  const [addStep, setAddStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [certifyCorrect, setCertifyCorrect] = useState(false);

  // Edit flow states
  const [editStep, setEditStep] = useState(1);
  const [editCertifyCorrect, setEditCertifyCorrect] = useState(true);

  // Form Steps schema
  const steps = [
    { number: 1, label: 'Profile', desc: 'Identity & Status' },
    { number: 2, label: 'Contact', desc: 'Hotline & Channels' },
    { number: 3, label: 'Tax & Address', desc: 'GSTIN & Office' },
    { number: 4, label: 'Summary', desc: 'Review & Verify' },
  ];

  // Validation checkers
  const isAddStepValid = (step: number) => {
    if (step >= 1) {
      if (!name.trim()) return false;
    }
    if (step >= 2) {
      if (!phone.trim() || !email.trim()) return false;
      if (!email.includes('@') || !email.includes('.')) return false;
    }
    if (step >= 3) {
      // GST and Address optional, but if entered, some basic validations are helpful
    }
    if (step >= 4) {
      if (!certifyCorrect) return false;
    }
    return true;
  };

  const isEditStepValid = (step: number) => {
    if (!editingSupplier) return false;
    if (step >= 1) {
      if (!editingSupplier.name.trim()) return false;
    }
    if (step >= 2) {
      if (!editingSupplier.phone.trim() || !editingSupplier.email.trim()) return false;
      if (!editingSupplier.email.includes('@') || !editingSupplier.email.includes('.')) return false;
    }
    if (step >= 4) {
      if (!editCertifyCorrect) return false;
    }
    return true;
  };

  const handleNextAddStep = () => {
    if (addStep < 4 && isAddStepValid(addStep)) {
      setAddStep((prev) => prev + 1);
    }
  };

  const handlePrevAddStep = () => {
    if (addStep > 1) {
      setAddStep((prev) => prev - 1);
    }
  };

  const handleNextEditStep = () => {
    if (editStep < 4 && isEditStepValid(editStep)) {
      setEditStep((prev) => prev + 1);
    }
  };

  const handlePrevEditStep = () => {
    if (editStep > 1) {
      setEditStep((prev) => prev - 1);
    }
  };

  const handleAddStepClick = (stepNum: number) => {
    // Can only switch tabs if steps preceding are verified
    let allowed = true;
    for (let i = 1; i < stepNum; i++) {
      if (!isAddStepValid(i)) {
        allowed = false;
        break;
      }
    }
    if (allowed) {
      setAddStep(stepNum);
    }
  };

  const handleEditStepClick = (stepNum: number) => {
    let allowed = true;
    for (let i = 1; i < stepNum; i++) {
      if (!isEditStepValid(i)) {
        allowed = false;
        break;
      }
    }
    if (allowed) {
      setEditStep(stepNum);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    return s.name.toLowerCase().includes(search.toLowerCase()) || 
           s.email.toLowerCase().includes(search.toLowerCase()) || 
           s.phone.includes(search);
  });

  const handleResetAddForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstNumber('');
    setStatus('Active');
    setAddStep(1);
    setCertifyCorrect(false);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      alert('Company Profile, Hotline and Email are mandatory fields.');
      return;
    }
    if (!certifyCorrect) {
      alert('Please check the verification checkbox to certify this listing.');
      return;
    }
    onAddSupplier({
      name,
      phone,
      email,
      address,
      gstNumber,
      status,
    });
    handleResetAddForm();
  };

  const handleResetEditForm = () => {
    setEditingSupplier(null);
    setEditStep(1);
    setEditCertifyCorrect(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (!editingSupplier.name || !editingSupplier.phone || !editingSupplier.email) {
      alert('Profile details, Email and Phone Hotline are required.');
      return;
    }
    if (!editCertifyCorrect) {
      alert('Please check the confirmation check to verify your update.');
      return;
    }
    onUpdateSupplier(editingSupplier);
    handleResetEditForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"? This removes their contact registration.`)) {
      onDeleteSupplier(id);
    }
  };

  return (
    <div className="space-y-6" id="inventory-suppliers-tab">
      {/* Control row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs" id="suppliers-toolbar">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search suppliers by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-colors animate-fade-in"
          />
        </div>

        <button
          onClick={() => {
            setAddStep(1);
            setCertifyCorrect(false);
            setShowAddForm(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-[#007f6e] text-white hover:bg-[#006657] rounded-xl text-xs font-bold px-3.5 py-2 shadow-xs self-end sm:self-auto cursor-pointer transition-all hover:scale-[1.02]"
          id="btn-add-supplier"
        >
          <Plus size={14} />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-[#e6f2f0] text-[#007f6e] rounded-full flex items-center justify-center">
            <Building2 size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No medical suppliers catalogued yet</h4>
            <p className="text-xs text-slate-400">Add suppliers to start organizing purchase invoices and restock workflows.</p>
          </div>
          <button
            onClick={() => {
              setAddStep(1);
              setCertifyCorrect(false);
              setShowAddForm(true);
            }}
            className="bg-[#007f6e] text-white hover:bg-[#006657] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            id="btn-add-supplier-empty"
          >
            + Add Supplier Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="suppliers-grid">
          {filteredSuppliers.map((sup) => (
            <div key={sup.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#e6f2f0] transition-all relative flex flex-col justify-between text-slate-700">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                      REF ID: {sup.id}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-tight block">{sup.name}</h4>
                  </div>
                  <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full ${
                    sup.status === 'Inactive' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
                  }`}>
                    {sup.status || 'Active'}
                  </span>
                </div>

                {/* Sub-details */}
                <div className="space-y-2 text-[11px] text-slate-500 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-[#007f6e] shrink-0" />
                    <span className="font-semibold">{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[#007f6e] shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-slate-400 font-medium">{sup.address || 'No physical address specified'}</span>
                  </div>
                </div>
              </div>

              {/* Actions segment */}
              <div className="flex justify-end gap-1.5 border-t border-slate-50 mt-4 pt-3">
                <button
                  onClick={() => setViewingSupplier(sup)}
                  className="p-1 px-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  id={`btn-view-${sup.id}`}
                >
                  <Eye size={11} />
                  <span>View</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSupplier(sup);
                    setEditStep(1);
                    setEditCertifyCorrect(true);
                  }}
                  className="p-1 px-2.5 text-[#007f6e] bg-[#e6f2f0]/45 hover:bg-[#e6f2f0]/90 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  id={`btn-edit-${sup.id}`}
                >
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(sup.id, sup.name)}
                  className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  id={`btn-delete-${sup.id}`}
                >
                  <Trash2 size={11} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Title Banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#016558] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight" id="add-modal-title">New Supplier Registration</h3>
                  <p className="text-[10px] text-emerald-100/70">Catalogue external medical or clinical products provider</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleResetAddForm} 
                className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                id="btn-close-add-modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper Tabs Selector (Multi-step + clickable Tab combination) */}
            <div className="grid grid-cols-4 border-b border-rose-50/10 bg-slate-50/50 p-4 gap-1.5" id="add-stepper-tabs">
              {steps.map((s, idx) => {
                const isActive = s.number === addStep;
                const isCompleted = s.number < addStep;
                const isClickable = isAddStepValid(s.number - 1) || s.number === 1;

                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => isClickable && handleAddStepClick(s.number)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                      isActive 
                        ? 'bg-white border border-[#e6f2f0] shadow-sm text-[#007f6e] scale-[1.01]' 
                        : isCompleted
                        ? 'bg-slate-100/70 hover:bg-slate-100 text-[#007f6e]'
                        : 'text-slate-400 hover:text-slate-500'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    disabled={!isClickable}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold transition-all border shrink-0 ${
                        isActive
                          ? 'bg-[#007f6e] text-white border-[#007f6e]'
                          : isCompleted
                          ? 'bg-[#007f6e]/10 text-[#007f6e] border-[#007f6e]/20'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {isCompleted ? <Check size={10} strokeWidth={3} /> : s.number}
                      </div>
                      <span className="text-[10px] font-extrabold hidden sm:inline">{s.label}</span>
                    </div>
                    <span className="text-[8px] font-medium text-slate-400 mt-1 block sm:hidden">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {addStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <Building2 className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Establish corporate identity</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please specify the legal operational name of the vendor and their active status representation.</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company/Vendor Legal Name *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Building2 size={13} />
                            </span>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Acme Pharmaceuticals Pvt Ltd"
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Operational Licensing Status</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setStatus('Active')}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                status === 'Active'
                                  ? 'border-[#007f6e] bg-[#e6f2f0]/20 text-slate-800 shadow-2xs'
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-extrabold ${status === 'Active' ? 'text-[#007f6e]' : 'text-slate-700'}`}>Active Partner</span>
                                {status === 'Active' && <CheckCircle2 size={14} className="text-[#007f6e]" />}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1 font-medium leading-normal">Fully authorized to tender invoices & clinical orders.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStatus('Inactive')}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                status === 'Inactive'
                                  ? 'border-rose-300 bg-rose-50/20 text-slate-850 shadow-2xs'
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-extrabold ${status === 'Inactive' ? 'text-rose-600' : 'text-slate-700'}`}>Temporarily Suspended</span>
                                {status === 'Inactive' && <ShieldAlert size={14} className="text-rose-500" />}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1 font-medium leading-normal">Hold fresh procurement requests until verified.</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <Mail className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Establish Communications</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please supply primary hotlines and email ID channels to bind purchase orders smoothly.</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primary Contact Hotline Phone *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Phone size={13} />
                            </span>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="e.g. +91 98765 43210 (or 10-digit hotline)"
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Official email Address *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Mail size={13} />
                            </span>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="e.g. procurement@supplier.com"
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                          {email && (!email.includes('@') || !email.includes('.')) && (
                            <p className="text-[9px] text-rose-500 flex items-center gap-1 mt-1">
                              <AlertCircle size={10} />
                              <span>Please enter a valid structured email address (containing @ and .).</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <FileText className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Business Registry & Location</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Supply tax registry identification (GSTIN) and primary office mailing addresses for dispatch logistics.</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">GSTIN Tax Registration Number</label>
                            <span className="text-[8.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">15 Characters Alphanumeric</span>
                          </div>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-mono text-[10px]">
                              GST
                            </span>
                            <input
                              type="text"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                              placeholder="e.g. 07AAAAA1111A1Z1"
                              maxLength={15}
                              className="w-full text-xs pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-mono tracking-wider"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Registered Corporate Office Address</label>
                          <div className="relative">
                            <span className="absolute top-3 left-3 flex items-start text-slate-400">
                              <MapPin size={13} />
                            </span>
                            <textarea
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Street name, landmark, City, Zipcode, State coordinates..."
                              rows={3}
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all resize-none font-medium leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Review Supplier Profile</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please check everything before filing the record in the main hospital directory.</p>
                        </div>
                      </div>

                      {/* Display Data summary */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 font-medium text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Supplier Identity</span>
                          <span className="text-xs font-black text-slate-850">{name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">Hotline</span>
                            <strong className="text-slate-800">{phone}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">Email</span>
                            <strong className="text-slate-800 truncate block">{email}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">GST TAX CODE</span>
                            <strong className="text-slate-800 font-mono tracking-wide">{gstNumber || 'Not provided'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">Partnership status</span>
                            <span className={`inline-block font-extrabold text-[9px] px-2 py-0.5 rounded-full mt-0.5 ${
                              status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] pb-1">
                          <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">Mailing / Delivery address</span>
                          <p className="text-slate-600 line-clamp-2 mt-0.5 bg-white p-2 border border-slate-100 rounded-lg">{address || 'No physical delivery location provided.'}</p>
                        </div>
                      </div>

                      {/* Explicit Verification constraint */}
                      <label className="flex items-start gap-2.5 p-3.5 bg-[#e6f2f0]/20 rounded-2xl border border-[#007f6e]/10 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={certifyCorrect}
                          onChange={(e) => setCertifyCorrect(e.target.checked)}
                          className="mt-0.5 accent-[#007f6e] w-3.5 h-3.5"
                          required
                          id="chk-add-certify"
                        />
                        <div className="text-[10px] leading-snug">
                          <span className="font-extrabold text-slate-850 block">Authorize Registrar Listing</span>
                          <span className="text-slate-400">I certify that the credentials supplied above correspond to an audited external healthcare supplier partner.</span>
                        </div>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action row footer */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 px-6 py-4.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevAddStep}
                  disabled={addStep === 1}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white transition-all ${
                    addStep === 1 
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border-slate-150' 
                      : 'text-slate-650 hover:bg-slate-100 cursor-pointer'
                  }`}
                  id="btn-add-prev"
                >
                  <ChevronLeft size={13} />
                  <span>Previous</span>
                </button>

                {addStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextAddStep}
                    disabled={!isAddStepValid(addStep)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white transition-all ${
                      isAddStepValid(addStep)
                        ? 'bg-[#007f6e] hover:bg-[#006657] cursor-pointer shadow-xs'
                        : 'bg-slate-200 cursor-not-allowed text-slate-400'
                    }`}
                    id="btn-add-next"
                  >
                    <span>Continue</span>
                    <ChevronRight size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!certifyCorrect}
                    className={`flex items-center gap-1.5 text-xs font-extrabold px-5 py-2.5 rounded-xl text-white transition-all cursor-pointer ${
                      certifyCorrect 
                        ? 'bg-[#007f6e] hover:bg-[#006657] shadow-md hover:scale-[1.01]' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    id="btn-add-submit"
                  >
                    <ShieldCheck size={14} />
                    <span>Confirm & File Catalogue</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Form Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Title Banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#016558] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl animate-pulse">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight" id="edit-modal-title">Edit Supplier Specs</h3>
                  <p className="text-[10px] text-emerald-100/70">Modify catalog ID #{editingSupplier.id}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleResetEditForm} 
                className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                id="btn-close-edit-modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper Tabs Selector (Multi-step + clickable Tab combination for editing) */}
            <div className="grid grid-cols-4 border-b border-rose-50/10 bg-slate-50/50 p-4 gap-1.5" id="edit-stepper-tabs">
              {steps.map((s, idx) => {
                const isActive = s.number === editStep;
                const isCompleted = s.number < editStep;
                const isClickable = isEditStepValid(s.number - 1) || s.number === 1;

                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => isClickable && handleEditStepClick(s.number)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                      isActive 
                        ? 'bg-white border border-[#e6f2f0] shadow-sm text-[#007f6e] scale-[1.01]' 
                        : isCompleted
                        ? 'bg-slate-100/70 hover:bg-slate-100 text-[#007f6e]'
                        : 'text-slate-400 hover:text-slate-500'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    disabled={!isClickable}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold transition-all border shrink-0 ${
                        isActive
                          ? 'bg-[#007f6e] text-white border-[#007f6e]'
                          : isCompleted
                          ? 'bg-[#007f6e]/10 text-[#007f6e] border-[#007f6e]/20'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {isCompleted ? <Check size={10} strokeWidth={3} /> : s.number}
                      </div>
                      <span className="text-[10px] font-extrabold hidden sm:inline">{s.label}</span>
                    </div>
                    <span className="text-[8px] font-medium text-slate-400 mt-1 block sm:hidden">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto flex flex-col justify-between">
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {editStep === 1 && (
                    <motion.div
                      key="editSt1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <Building2 className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Operational Profile Identity</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please modify the legal operational name or correct vendor partnership status below.</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company/Vendor legal Name</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-medium">
                              <Building2 size={13} />
                            </span>
                            <input
                              type="text"
                              value={editingSupplier.name}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Corporate Partnership Status</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setEditingSupplier({ ...editingSupplier, status: 'Active' })}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                editingSupplier.status === 'Active'
                                  ? 'border-[#007f6e] bg-[#e6f2f0]/20 text-slate-800 shadow-2xs'
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-extrabold ${editingSupplier.status === 'Active' ? 'text-[#007f6e]' : 'text-slate-700'}`}>Active Partner</span>
                                {editingSupplier.status === 'Active' && <CheckCircle2 size={14} className="text-[#007f6e]" />}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1 font-medium leading-normal">Eligible for invoice and stock requests.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingSupplier({ ...editingSupplier, status: 'Inactive' })}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                editingSupplier.status === 'Inactive'
                                  ? 'border-rose-300 bg-rose-50/20 text-slate-850 shadow-2xs'
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-extrabold ${editingSupplier.status === 'Inactive' ? 'text-rose-600' : 'text-slate-700'}`}>Inactive / Held</span>
                                {editingSupplier.status === 'Inactive' && <ShieldAlert size={14} className="text-rose-500" />}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1 font-medium leading-normal">Reject restocks until administrative review is resolved.</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {editStep === 2 && (
                    <motion.div
                      key="editSt2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <Mail className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Modify Contact Channels</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please update the email inbox or phone helpline coordinates.</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Hotline number *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Phone size={13} />
                            </span>
                            <input
                              type="tel"
                              value={editingSupplier.phone}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Official email Address *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-medium">
                              <Mail size={13} />
                            </span>
                            <input
                              type="email"
                              value={editingSupplier.email}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-medium"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {editStep === 3 && (
                    <motion.div
                      key="editSt3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <FileText className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Registered Office & Tax ID</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Edit corporate postal location and GST code parameters.</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GST Tax Identification (GSTIN)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-mono text-[10px]">
                              GST
                            </span>
                            <input
                              type="text"
                              value={editingSupplier.gstNumber || ''}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, gstNumber: e.target.value.toUpperCase() })}
                              maxLength={15}
                              className="w-full text-xs pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all font-mono tracking-wider font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Registered dispatch address</label>
                          <div className="relative">
                            <span className="absolute top-3 left-3 flex items-start text-slate-400">
                              <MapPin size={13} />
                            </span>
                            <textarea
                              value={editingSupplier.address || ''}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                              rows={3}
                              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all resize-none font-medium leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {editStep === 4 && (
                    <motion.div
                      key="editSt4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#e6f2f0]/30 border border-[#007f6e]/10 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="text-[#007f6e] mt-0.5 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Summary of Modifiable Specs</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Verify that the amended attributes match legal vendor documentation.</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 font-medium text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vendor Business Name</span>
                          <span className="text-xs font-black text-slate-800">{editingSupplier.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wider">Hotline</span>
                            <span className="text-slate-810 font-bold">{editingSupplier.phone}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wider">Official Email</span>
                            <span className="text-[#007f6e] truncate block font-bold">{editingSupplier.email}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wider">GSTIN Code</span>
                            <span className="font-mono text-slate-800 tracking-wide">{editingSupplier.gstNumber || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wider">Operational Relations</span>
                            <span className={`inline-block font-bold text-[9px] px-2 py-0.5 rounded-full mt-0.5 ${
                              editingSupplier.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                              {editingSupplier.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] pb-1">
                          <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wider">Mailing Address</span>
                          <p className="text-slate-600 font-bold mt-0.5 bg-white p-2 border border-slate-100 rounded-lg">{editingSupplier.address || 'No physical address specified'}</p>
                        </div>
                      </div>

                      {/* Explicit confirmation check before edit submit */}
                      <label className="flex items-start gap-2.5 p-3.5 bg-[#e6f2f0]/20 rounded-2xl border border-[#007f6e]/10 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editCertifyCorrect}
                          onChange={(e) => setEditCertifyCorrect(e.target.checked)}
                          className="mt-0.5 accent-[#007f6e] w-3.5 h-3.5"
                          required
                          id="chk-edit-certify"
                        />
                        <div className="text-[10px] leading-snug">
                          <span className="font-extrabold text-[#007f6e] block">Verify Modifications</span>
                          <span className="text-slate-400">I confirm that I have verified the authenticity of these corrections.</span>
                        </div>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action row footer */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 px-6 py-4.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevEditStep}
                  disabled={editStep === 1}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white transition-all ${
                    editStep === 1 
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border-slate-150' 
                      : 'text-slate-650 hover:bg-slate-100 cursor-pointer'
                  }`}
                  id="btn-edit-prev"
                >
                  <ChevronLeft size={13} />
                  <span>Previous</span>
                </button>

                {editStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextEditStep}
                    disabled={!isEditStepValid(editStep)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white transition-all ${
                      isEditStepValid(editStep)
                        ? 'bg-[#007f6e] hover:bg-[#006657] cursor-pointer shadow-xs'
                        : 'bg-slate-200 cursor-not-allowed text-slate-400'
                    }`}
                    id="btn-edit-next"
                  >
                    <span>Continue</span>
                    <ChevronRight size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!editCertifyCorrect}
                    className={`flex items-center gap-1.5 text-xs font-extrabold px-5 py-2.5 rounded-xl text-white transition-all cursor-pointer ${
                      editCertifyCorrect 
                        ? 'bg-[#007f6e] hover:bg-[#006657] shadow-md hover:scale-[1.01]' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    id="btn-edit-submit"
                  >
                    <ShieldCheck size={14} />
                    <span>Apply Updates</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Details Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-700">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#016558] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/10 text-white rounded-xl flex items-center justify-center font-extrabold">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black leading-tight block truncate w-44">{viewingSupplier.name}</h3>
                  <p className="text-[10px] text-emerald-100/80 mt-0.5">Supplier catalogue ID: {viewingSupplier.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingSupplier(null)} 
                className="text-white hover:bg-white/10 p-1 rounded-full transition-colors cursor-pointer"
                id="btn-close-view-modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-4">
              <div className="space-y-2.5 text-xs font-medium">
                
                <div className="flex justify-between py-2 border-b border-slate-50 items-center">
                  <span className="text-slate-400 text-[10.5px] uppercase font-bold tracking-wider">Hotline Link</span>
                  <a href={`tel:${viewingSupplier.phone}`} className="text-slate-800 font-extrabold hover:text-[#007f6e] transition-colors">{viewingSupplier.phone}</a>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50 items-center">
                  <span className="text-slate-400 text-[10.5px] uppercase font-bold tracking-wider">Mailing Box</span>
                  <a href={`mailto:${viewingSupplier.email}`} className="text-[#007f6e] font-extrabold hover:underline truncate max-w-44 block">{viewingSupplier.email}</a>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50 items-center">
                  <span className="text-slate-400 text-[10.5px] uppercase font-bold tracking-wider">GST TAX REGISTRY</span>
                  <strong className="text-slate-755 font-mono tracking-wider">{viewingSupplier.gstNumber || 'Not filed'}</strong>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50 items-center">
                  <span className="text-slate-400 text-[10.5px] uppercase font-bold tracking-wider font-sans">Corporate Status</span>
                  <span className={`font-extrabold px-2.5 py-0.5 rounded text-[10px] ${
                    viewingSupplier.status === 'Inactive' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-[#007f6e]'
                  }`}>
                    {viewingSupplier.status || 'Active'}
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-slate-400 text-[10.5px] uppercase block mb-1 font-bold tracking-wider">Office Dispatch Address</span>
                  <p className="p-3 bg-slate-50 rounded-xl leading-relaxed text-slate-650 font-semibold border border-slate-100">
                    {viewingSupplier.address || 'No postal layout catalogued.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4.5 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => {
                  setViewingSupplier(null);
                  setEditingSupplier(viewingSupplier);
                  setEditStep(1);
                  setEditCertifyCorrect(true);
                }}
                className="flex-1 bg-[#007f6e] hover:bg-[#006657] text-white font-extrabold text-xs py-2.5 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.015]"
                id="btn-view-edit-redirect"
              >
                Modify specs
              </button>
              <button
                onClick={() => setViewingSupplier(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl text-center cursor-pointer transition-all"
                id="btn-view-dismiss"
              >
                Dismiss View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
