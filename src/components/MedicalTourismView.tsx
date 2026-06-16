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
  Calendar
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Globe size={15} className="text-[#007f6e]" />
                International Consultation Case File
              </h3>
              <button 
                onClick={() => setViewingEnquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={15} className="text-slate-400" />
                    {viewingEnquiry.name}
                  </h4>
                  <span className={`inline-block px-2.5 py-0.5 mt-1.5 rounded-full text-[10px] font-bold ${
                    viewingEnquiry.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' :
                    viewingEnquiry.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' :
                    viewingEnquiry.status === 'VISA Assistance' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {viewingEnquiry.status}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 justify-end font-mono text-slate-400">
                    <Calendar size={12} />
                    <span>{new Date(viewingEnquiry.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end font-bold text-[#007f6e]">
                    <Globe size={13} />
                    <span>{viewingEnquiry.country}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200/60 font-medium">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Expected Treatment</span>
                    <span className="text-slate-805 text-xs font-bold block mt-0.5">{viewingEnquiry.treatment}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Passport Number</span>
                    <span className="text-slate-700 text-xs font-mono block mt-0.5">{viewingEnquiry.passportNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono text-slate-705">{viewingEnquiry.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={13} className="text-slate-400" />
                    <span className="text-slate-755 truncate" title={viewingEnquiry.email}>{viewingEnquiry.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Consulting Logs & Notes</span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{viewingEnquiry.notes || 'No custom consultation notes provided yet.'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingEnquiry(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
