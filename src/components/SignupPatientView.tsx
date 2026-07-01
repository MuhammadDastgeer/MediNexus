import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Trash2, Edit, Eye, Search, Plus, Sparkles, 
  Users, HeartPulse, RefreshCw, X, Check, Clock, ShieldAlert,
  Calendar, Phone, MapPin, Mail, CreditCard, BarChart2, Activity,
  EyeOff
} from 'lucide-react';

interface SignupPatientViewProps {
  onRefreshPatients?: () => void;
}

export default function SignupPatientView({ onRefreshPatients }: SignupPatientViewProps) {
  const [signupPatients, setSignupPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'overview'>('members');
  
  // Modals state
  const [viewingPatient, setViewingPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  
  // Edit Form Fields
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formPhone, setFormPhone] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // Password Visibility toggles
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);

  // Status/Toast Message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk confirmation state
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleBulkPromote = async () => {
    try {
      setBulkLoading(true);
      const res = await fetch('/api/patients/signup-patients/bulk-promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] }) // Empty array promotes all unregistered
      });
      if (res.ok) {
        const data = await res.json();
        showToast('success', `Successfully activated ${data.count || 0} signup patients into the Clinical Registry!`);
        setShowBulkConfirm(false);
        fetchSignupPatients();
        if (onRefreshPatients) onRefreshPatients();
      } else {
        showToast('error', 'Failed to run bulk activation.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error while attempting bulk activation.');
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchSignupPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patients/signup-patients');
      if (res.ok) {
        const data = await res.json();
        setSignupPatients(data);
      } else {
        showToast('error', 'Failed to fetch signup patients list.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error while fetching signup patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignupPatients();
  }, []);

  const handleOpenEdit = (patient: any) => {
    setEditingPatient(patient);
    setFormName(patient.name || '');
    setFormAge(patient.age ? String(patient.age) : '');
    setFormGender(patient.gender || 'Male');
    setFormPhone(patient.phone || '');
    setFormDob(patient.dob || '');
    setFormBloodGroup(patient.bloodGroup || '');
    setFormAddress(patient.address || '');
    setFormEmail(patient.email || '');
    setFormPassword(patient.password || '');
    setShowEditPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    if (!formName.trim() || !formPhone.trim() || !formEmail.trim()) {
      showToast('error', 'Name, contact phone, and email are required fields.');
      return;
    }

    try {
      const res = await fetch(`/api/patients/signup-patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          age: Number(formAge) || 25,
          gender: formGender,
          phone: formPhone.trim(),
          dob: formDob || null,
          bloodGroup: formBloodGroup || null,
          address: formAddress.trim() || null,
          email: formEmail.trim().toLowerCase(),
          password: formPassword || 'password123'
        })
      });

      if (res.ok) {
        showToast('success', `Details of ${formName} successfully updated.`);
        setEditingPatient(null);
        fetchSignupPatients();
        if (onRefreshPatients) onRefreshPatients();
      } else {
        const errData = await res.json();
        showToast('error', errData.error || 'Failed to update patient details.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error while updating details.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/signup-patients/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('success', 'User signup registration successfully removed.');
        setDeletingPatientId(null);
        fetchSignupPatients();
        if (onRefreshPatients) onRefreshPatients();
      } else {
        showToast('error', 'Failed to delete signup record.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error during record removal.');
    }
  };

  const handlePromote = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/patients/signup-patients/promote/${id}`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('success', `Patient ${name} has been successfully added to the Clinical Patients Registry.`);
        fetchSignupPatients();
        if (onRefreshPatients) onRefreshPatients();
      } else {
        showToast('error', 'Failed to add user to Clinical Patients.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error while adding user to Patients.');
    }
  };

  // Filter patients based on Search Query
  const filteredPatients = signupPatients.filter((p) => {
    const query = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(query) ||
      (p.phone || '').includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.address || '').toLowerCase().includes(query) ||
      (p.gender || '').toLowerCase().includes(query) ||
      (p.bloodGroup || '').toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const totalCount = signupPatients.length;
  const maleCount = signupPatients.filter(p => p.gender === 'Male').length;
  const femaleCount = signupPatients.filter(p => p.gender === 'Female').length;
  const otherCount = signupPatients.filter(p => p.gender !== 'Male' && p.gender !== 'Female').length;

  return (
    <div className="space-y-6" id="signup-patients-main-view">
      {/* Toast Alert */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all animate-bounce ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
          id="signup-patient-toast-indicator"
        >
          {toast.type === 'success' ? <Check size={16} /> : <ShieldAlert size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:scale-110">
            <X size={14} className="opacity-70" />
          </button>
        </div>
      )}

      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="signup-patients-header">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck className="text-[#007f6e] h-6 w-6" />
            <span>Signup Patients Console</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage users who registered via the AI Assistant Portal but did not opt to be listed as Clinical Patients initially.
          </p>
        </div>
        
        <button
          onClick={fetchSignupPatients}
          className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Dynamic Upper Tab selector pill-bar */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit gap-1 pb-1.5 mb-4" id="signup-patient-tab-pills">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'members'
              ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md shadow-teal-600/10'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Users size={15} />
          <span>Signup Records</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md shadow-teal-600/10'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <BarChart2 size={15} />
          <span>Overview & Stats</span>
        </button>
      </div>

      {activeTab === 'members' ? (
        /* ================= MEMBERS/LISTING TAB ================= */
        <div className="space-y-6" id="signup-listing-screen">
          {/* Main Table Container */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs" id="signup-patients-table-container">
            {/* Search Bar / Filter Area */}
            <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search by name, phone, email, details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8.5 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] h-10 shadow-3xs"
                />
              </div>
              
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                Showing {filteredPatients.length} of {totalCount} Records
              </div>
            </div>

            {/* Table representation */}
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3" id="signup-patients-loading-state">
                <RefreshCw className="h-7 w-7 text-[#007f6e] animate-spin" />
                <p className="text-xs font-bold text-slate-500">Loading signup accounts records database...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2" id="signup-patients-empty-state">
                <Users className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-500">No unregistered patient signup accounts found.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  All signed up users are already registered as clinical patients or no such accounts exist in the hospital registry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="signup-patients-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-6 py-4">ID & Name</th>
                      <th className="px-6 py-4">Demographics</th>
                      <th className="px-6 py-4">Contacts Info</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Registered Date</th>
                      <th className="px-6 py-4 text-center">Core Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs text-slate-650">
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors" id={`signup-row-${p.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-[13px]">{p.name}</div>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="font-mono text-[9px] text-slate-400 uppercase font-bold tracking-wider">{p.id}</span>
                            {p.hospitalName && (
                              <div className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 max-w-fit font-sans">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                {p.hospitalName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="font-semibold text-slate-700">{p.age || 'N/A'} yrs • <span className="font-extrabold">{p.gender}</span></div>
                          {p.bloodGroup && (
                            <span className="inline-block bg-rose-50 text-rose-600 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md border border-rose-100">
                              Blood: {p.bloodGroup}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 space-y-0.5 font-medium">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone size={10} className="text-[#007f6e] shrink-0" />
                            <span>{p.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-[11px] hover:text-[#007f6e] transition-colors">
                            <Mail size={10} className="shrink-0" />
                            <span className="truncate max-w-[160px]">{p.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-black text-[9px] px-2.5 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
                            <Clock size={10} />
                            <span>Not in Registry</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-semibold text-[11px]">
                          {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* PROMOTE / ADD AS PATIENT BUTTON */}
                            <button
                              onClick={() => handlePromote(p.id, p.name)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#007f6e] hover:bg-[#006657] text-white text-[10px] font-black rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                              title="Add user to Clinical Patients Registry immediately"
                              id={`action-promote-${p.id}`}
                            >
                              <Plus size={12} />
                              <span>Add in Patient</span>
                            </button>

                            <button
                              onClick={() => setViewingPatient(p)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-slate-800 transition-colors cursor-pointer"
                              title="View Details"
                              id={`action-view-${p.id}`}
                            >
                              <Eye size={13} />
                            </button>
                            
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg hover:text-blue-800 transition-colors cursor-pointer"
                              title="Edit Details"
                              id={`action-edit-${p.id}`}
                            >
                              <Edit size={13} />
                            </button>
                            
                            <button
                              onClick={() => setDeletingPatientId(p.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-800 transition-colors cursor-pointer"
                              title="Delete Account Record"
                              id={`action-delete-${p.id}`}
                            >
                              <Trash2 size={13} />
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
        </div>
      ) : (
        /* ================= OVERVIEW TAB ================= */
        <div className="space-y-6" id="signup-overview-screen">
          {/* Main Top Welcome Banner */}
          <div className="bg-[#005f54] text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="signup-welcome-banner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck size={18} />
                <h2 className="text-lg font-extrabold tracking-tight">Onboarding Signups Overview</h2>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">
                {totalCount} total pending signup records • {maleCount} male signups • {femaleCount} female signups
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={totalCount === 0}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer ${
                  totalCount > 0
                    ? 'bg-[#00473e] hover:bg-[#003d35] text-white shadow-sm'
                    : 'bg-teal-800/50 text-teal-300/50 cursor-not-allowed shadow-none'
                }`}
                id="signup-patients-bulk-activate-btn-overview"
              >
                <UserCheck size={14} className="shrink-0" />
                <span>Bulk Activate All ({totalCount})</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="overview-kpi-blocks">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Signups</span>
                <span className="text-2xl font-black text-slate-800">{totalCount}</span>
              </div>
              <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Male Signups</span>
                <span className="text-2xl font-black text-blue-600">{maleCount}</span>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Female Signups</span>
                <span className="text-2xl font-black text-pink-600">{femaleCount}</span>
              </div>
              <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Other/Pending</span>
                <span className="text-2xl font-black text-indigo-600">{otherCount}</span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                <Sparkles size={18} />
              </div>
            </div>
          </div>

          {/* Lower Level Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-graphs">
            {/* Widget 1: Gender Distribution */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Demographic breakdown</h3>
                <span className="text-[10px] text-slate-400">Gender parity metrics</span>
              </div>
              
              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Users size={24} className="text-slate-205" />
                  <p className="text-xs font-semibold mt-1">No signup data available</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  {/* Male */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Male Signups</span>
                      <span className="text-[#007f6e]">{maleCount} ({Math.round((maleCount / (totalCount || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-[#007f6e] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(maleCount / (totalCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Female */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Female Signups</span>
                      <span className="text-purple-600">{femaleCount} ({Math.round((femaleCount / (totalCount || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(femaleCount / (totalCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Other */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Other demographics</span>
                      <span className="text-amber-600">{otherCount} ({Math.round((otherCount / (totalCount || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-amber-400 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(otherCount / (totalCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Setup Status */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Registration Profile Status</h3>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">AI Portal Onboarding</span>
              </div>

              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Activity size={24} className="text-slate-205" />
                  <p className="text-xs font-semibold mt-1">No onboarding logs</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 flex-1 items-center">
                  <div className="bg-teal-50/35 border border-teal-50 rounded-xl p-4 text-center space-y-1">
                    <span className="text-2xl font-black text-[#007f6e]">{totalCount}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Activation</p>
                    <p className="text-[9px] text-[#007f6e] font-medium">Bypassed clinical checkbox</p>
                  </div>

                  <div className="bg-amber-50/35 border border-amber-50 rounded-xl p-4 text-center space-y-1">
                    <span className="text-2xl font-black text-amber-600">100%</span>
                    <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">Conversion Ready</p>
                    <p className="text-[9px] text-amber-500 font-medium">Immediate clinical match</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="signup-view-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Signup Account Profile</h3>
                  <p className="text-[10px] text-emerald-100 font-semibold">{viewingPatient.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPatient(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#007f6e]/10 text-[#007f6e] flex items-center justify-center font-extrabold text-base border border-[#007f6e]/20">
                  {viewingPatient.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">{viewingPatient.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingPatient.age || 'N/A'} years old • <span className="font-extrabold">{viewingPatient.gender}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{viewingPatient.dob || 'Not Specified'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <HeartPulse size={13} className="text-rose-500" />
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-100">
                      {viewingPatient.bloodGroup || 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Phone Contact</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <Phone size={13} className="text-slate-400" />
                    <span>{viewingPatient.phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate max-w-[180px]">{viewingPatient.email}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Home Address</span>
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 font-bold">
                    <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <span>{viewingPatient.address || 'Not Specified'}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Security Password</span>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span>{showViewPassword ? (viewingPatient.password || 'N/A') : '••••••••'}</span>
                    <button
                      type="button"
                      onClick={() => setShowViewPassword(!showViewPassword)}
                      className="text-slate-400 hover:text-[#007f6e] p-1 focus:outline-none cursor-pointer flex items-center justify-center"
                      title={showViewPassword ? "Hide password" : "Show password"}
                    >
                      {showViewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-2.5 items-start">
                <Clock size={16} className="text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">Unregistered clinical status</span>
                  <p className="text-[10px] text-amber-700 leading-normal font-semibold mt-0.5">
                    This user registered via the AI Assistant portal but is currently NOT in the clinic's core patient list. Press "Add in Patient" to admit or register them.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const id = viewingPatient.id;
                  const name = viewingPatient.name;
                  setViewingPatient(null);
                  handlePromote(id, name);
                }}
                className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs cursor-pointer active:scale-95"
              >
                <Plus size={13} />
                <span>Add in Patient</span>
              </button>

              <button
                onClick={() => setViewingPatient(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="signup-edit-modal">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Edit Signup Account</h3>
                  <p className="text-[10px] text-blue-100 font-semibold">Updating details for {editingPatient.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPatient(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-blue-100 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Age *</label>
                  <input
                    type="number"
                    required
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gender *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
                  <input
                    type="text"
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    placeholder="e.g. O+ve, B-ve"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Phone Contact *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold text-slate-700 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Portal Password *</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full text-xs pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-10 font-bold font-mono text-slate-700 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                      title={showEditPassword ? "Hide password" : "Show password"}
                    >
                      {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Home Address</label>
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700 bg-slate-50"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer h-10 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingPatientId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="signup-delete-confirm-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete this user signup record from the database? This action is irreversible.
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setDeletingPatientId(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                No, Keep it
              </button>
              <button
                onClick={() => handleDelete(deletingPatientId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK ACTIVATE MODAL */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="signup-bulk-activate-confirm-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <UserCheck size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Confirm Bulk Activation</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to promote all <span className="font-extrabold text-[#007f6e]">{totalCount}</span> unregistered signup patients into the Clinical Patients database?
              </p>
              <p className="text-[10px] text-slate-400">
                This will automatically create patient registry records for them, making them immediately viewable in the Clinical Patients dashboard.
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center gap-2">
              <button
                disabled={bulkLoading}
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={bulkLoading}
                onClick={handleBulkPromote}
                className="flex-1 py-2 bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                <span>{bulkLoading ? 'Processing...' : 'Yes, Activate All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
