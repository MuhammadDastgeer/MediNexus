import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  RefreshCw, 
  Plane, 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  X,
  CreditCard,
  User,
  Heart,
  FileText,
  Mail,
  Phone,
  Calendar,
  Edit3,
  Download
} from 'lucide-react';

interface TourismEnquiry {
  id: string;
  name: string;
  country: string;
  treatment: string;
  status: 'Received' | 'VISA Assistance' | 'Scheduled' | 'Completed';
  date: string;
  phone?: string;
  email?: string;
  passportNumber?: string;
  notes?: string;
}

interface MedicalTourismViewProps {
  enquiries?: TourismEnquiry[];
  onSaveEnquiry: (enquiry: any) => void;
  onDeleteEnquiry: (id: string) => void;
  onRefresh: () => void;
}

export default function MedicalTourismView({ 
  enquiries = [], 
  onSaveEnquiry, 
  onDeleteEnquiry, 
  onRefresh 
}: MedicalTourismViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [treatment, setTreatment] = useState('Cardiac Angioplasty');
  const [status, setStatus] = useState<TourismEnquiry['status']>('Received');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Reader details modal
  const [viewingEnquiry, setViewingEnquiry] = useState<TourismEnquiry | null>(null);

  const handleOpenAdd = () => {
    setFormMode('add');
    setCurrentId(null);
    setName('');
    setCountry('Bangladesh');
    setTreatment('Cardiac Angioplasty');
    setStatus('Received');
    setPhone('');
    setEmail('');
    setPassportNumber('');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (enq: TourismEnquiry) => {
    setFormMode('edit');
    setCurrentId(enq.id);
    setName(enq.name || '');
    setCountry(enq.country || 'Bangladesh');
    setTreatment(enq.treatment || 'Cardiac Angioplasty');
    setStatus(enq.status || 'Received');
    setPhone(enq.phone || '');
    setEmail(enq.email || '');
    setPassportNumber(enq.passportNumber || '');
    setNotes(enq.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !country || !treatment) return;

    onSaveEnquiry({
      id: currentId,
      name,
      country,
      treatment,
      status,
      phone,
      email,
      passportNumber,
      notes,
      date: formMode === 'add' ? new Date().toISOString() : undefined
    });

    setIsFormOpen(false);
  };

  // KPIs
  const totalCount = enquiries.length;
  const visaAssistanceCount = enquiries.filter(e => e.status === 'VISA Assistance').length;
  const scheduledCount = enquiries.filter(e => e.status === 'Scheduled').length;
  const completedCount = enquiries.filter(e => e.status === 'Completed').length;

  const filtered = enquiries.filter((e) => {
    const matchSearch =
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.country || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.treatment || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="medical-tourism-view">
      {/* Title block */}
      <div className="flex justify-between items-center" id="tourism-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="tourism-title">Medical Tourism Enquiries</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and track international medical consulting inquiries and workflows.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Add Tourism Enquiry</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw size={12} className="text-[#007f6e]" />
            <span className="text-[#007f6e]">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="tourism-kpis">
        {/* Total global enquiries */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-slate-405">Total Enquiries</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalCount}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-550 rounded-xl flex items-center justify-center">
            <Globe size={18} />
          </div>
        </div>

        {/* VISA assistance */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VISA Assistance</span>
            <span className="text-2xl font-extrabold text-slate-800">{visaAssistanceCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Shield size={18} />
          </div>
        </div>

        {/* Scheduled admissions */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1 block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Trips</span>
            <span className="text-2xl font-extrabold text-slate-800">{scheduledCount}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center font-bold">
            <Plane size={18} />
          </div>
        </div>

        {/* Completed Cases */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cases Completed</span>
            <span className="text-2xl font-extrabold text-slate-800">{completedCount}</span>
          </div>
          <div className="w-10 h-10 bg-violet-50 text-violet-550 rounded-xl flex items-center justify-center">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="tourism-main-card">
        {/* Search & Status Filters */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4" id="tourism-filter">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e] text-slate-700 font-sans"
            >
              <option value="All">All Workflows</option>
              <option value="Received">Received</option>
              <option value="VISA Assistance">VISA Assistance</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>

            {(search || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('All'); }}
                className="text-xs text-[#007f6e] hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search country, patient, treatment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-globe">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <Globe size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No international enquiries found</p>
              <p className="text-xs text-slate-400 mt-0.5">International patient workflows will be displayed here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Origin Country</th>
                  <th className="px-6 py-3">Expected Treatment</th>
                  <th className="px-6 py-3">Passport No.</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-805 text-sm">{enq.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{enq.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-[#007f6e]" strokeWidth={2.5} />
                        {enq.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-703 max-w-xs font-semibold">
                      {enq.treatment}
                    </td>
                    <td className="px-6 py-4 text-slate-450 font-mono">
                      {enq.passportNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        enq.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' :
                        enq.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' :
                        enq.status === 'VISA Assistance' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setViewingEnquiry(enq)}
                          className="p-1.5 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(enq)}
                          className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Edit Details"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if(confirm("Delete this medical tourism enquiry?")) {
                              onDeleteEnquiry(enq.id);
                            }
                          }}
                          className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Delete"
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

      {/* Tourism Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Globe size={15} className="text-[#007f6e]" />
                {formMode === 'add' ? 'New Medical Tourism Admission' : 'Edit Tourism Case File'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Al-Mamun"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Bangladesh"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="e.g. BP059385"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Target Treatment</label>
                  <input
                    type="text"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    placeholder="e.g. Orthopedic Knee Replacement"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 12345 6789"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Workflow Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700"
                >
                  <option value="Received">Received</option>
                  <option value="VISA Assistance">VISA Assistance</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Patient notes & Medical History Summary</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Insert consulting requests details, visa dates, flight arrivals, and deluxe room arrangements..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#007f6e] text-white rounded-lg hover:bg-[#006657] font-bold"
                >
                  {formMode === 'add' ? 'Confirm File' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tourism Details Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/60 backdrop-blur-xs flex items-center justify-center p-4" id="tourism-view-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Gradient Banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#115e59] text-white p-6 relative">
              <button
                onClick={() => setViewingEnquiry(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
              >
                <X size={15} />
              </button>
              
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs">
                  {viewingEnquiry.name.trim().charAt(0) || 'T'}
                </div>
                <div>
                  <h2 className="text-md md:text-lg font-bold">{viewingEnquiry.name}</h2>
                  <span className="text-emerald-100 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 inline-block mt-1">
                    Country of Origin: {viewingEnquiry.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Contents */}
            <div className="p-6 space-y-5 max-h-[30rem] overflow-y-auto">
              {/* Row 1: Passport & Basic Coordinates */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Credentials & Traveler Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Passport Number</span>
                    <span className="text-slate-800 mt-0.5 block font-mono font-bold">{viewingEnquiry.passportNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Contact Number</span>
                    <span className="text-slate-800 mt-0.5 block font-mono">{viewingEnquiry.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Email Coordinates</span>
                    <span className="text-slate-850 mt-0.5 block break-all">{viewingEnquiry.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Desired Treatment</span>
                    <span className="text-slate-850 mt-0.5 block text-[#007f6e] font-bold">{viewingEnquiry.treatment}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Case Created On</span>
                    <span className="text-slate-850 mt-0.5 block font-mono">{new Date(viewingEnquiry.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Assigned Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                      viewingEnquiry.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' :
                      viewingEnquiry.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' :
                      viewingEnquiry.status === 'VISA Assistance' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {viewingEnquiry.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Consult Logs / Medical Notes */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Consultation Logs & Treatment Notes</h4>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-slate-400 block text-[8px] uppercase font-bold mb-1">Diagnosis / Patient Background notes</span>
                  <p className="text-xs text-slate-705 leading-relaxed whitespace-pre-line font-medium pr-1">
                    {viewingEnquiry.notes || 'No custom consultation notes provided yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer with Edit, Delete, Download report PDF, Close */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleOpenEdit(viewingEnquiry);
                    setViewingEnquiry(null);
                  }}
                  className="bg-[#e6f4f1] hover:bg-[#d5eeea] text-[#007f6e] border border-emerald-500/10 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete this medical tourism admission case?`)) {
                      onDeleteEnquiry(viewingEnquiry.id);
                      setViewingEnquiry(null);
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/55 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Download size={12} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setViewingEnquiry(null)}
                  className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
