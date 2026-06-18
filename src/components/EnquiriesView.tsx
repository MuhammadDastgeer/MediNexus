import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Edit2, 
  Edit3,
  Eye, 
  X,
  Mail,
  Phone,
  Calendar,
  Building,
  Download
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  query: string;
  status: 'Pending' | 'Resolved' | 'Spam';
  department: string;
  date: string;
}

interface EnquiriesViewProps {
  enquiries: Inquiry[];
  onUpdateStatus: (id: string, status: Inquiry['status']) => void;
  onRefresh: () => void;
  onSaveEnquiry: (enquiry: any) => void;
  onDeleteEnquiry: (id: string) => void;
}

export default function EnquiriesView({ 
  enquiries = [], 
  onUpdateStatus, 
  onRefresh,
  onSaveEnquiry,
  onDeleteEnquiry
}: EnquiriesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('General');
  const [status, setStatus] = useState<Inquiry['status']>('Pending');
  
  // Detail modal state
  const [viewingEnquiry, setViewingEnquiry] = useState<Inquiry | null>(null);

  const pendingCount = enquiries.filter(e => e.status === 'Pending').length;
  const resolvedCount = enquiries.filter(e => e.status === 'Resolved').length;
  const spamCount = enquiries.filter(e => e.status === 'Spam').length;

  const filtered = enquiries.filter((e) => {
    const matchSearch =
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.query || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setFormMode('add');
    setCurrentId(null);
    setName('');
    setPhone('');
    setEmail('');
    setQuery('');
    setDepartment('General');
    setStatus('Pending');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (e: Inquiry) => {
    setFormMode('edit');
    setCurrentId(e.id);
    setName(e.name || '');
    setPhone(e.phone || '');
    setEmail(e.email || '');
    setQuery(e.query || '');
    setDepartment(e.department || 'General');
    setStatus(e.status || 'Pending');
    setIsFormOpen(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) { alert('Enquirer name is required.'); return; }
    if (!phone.trim()) { alert('Phone number is required.'); return; }
    if (!email.trim()) { alert('Email address is required.'); return; }
    if (!query.trim()) { alert('Detailed query is required.'); return; }
    if (!department) { alert('Department selection is required.'); return; }
    if (!status) { alert('Status category is required.'); return; }

    onSaveEnquiry({
      id: currentId,
      name,
      phone,
      email,
      query,
      department,
      status,
      date: formMode === 'add' ? new Date().toISOString() : undefined
    });

    setIsFormOpen(false);
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="enquiries-view">
      {/* Title Header */}
      <div className="flex justify-between items-center" id="enquiries-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="enquiry-title">Enquiries Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">Review general hospital and consulting submission inquiries.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Plus size={14} />
            <span>Add Enquiry</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw size={12} className="text-[#007f6e]" />
            <span className="text-[#007f6e]">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI 4 Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="enquiries-kpis">
        {/* Total */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Enquiries</span>
            <span className="text-2xl font-extrabold text-slate-800">{enquiries.length}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <HelpCircle size={18} />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-semibold text-slate-400">Pending</span>
            <span className="text-2xl font-extrabold text-slate-800">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved</span>
            <span className="text-2xl font-extrabold text-slate-800">{resolvedCount}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-550 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Spam */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spam</span>
            <span className="text-2xl font-extrabold text-slate-800">{spamCount}</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>
      </div>

      {/* Primary Cards Container */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="enquiries-main-card">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e] text-slate-700"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Spam">Spam</option>
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
              placeholder="Search name, query details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {/* Data Rows or empty state */}
        {filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-enquiry-diagram">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <HelpCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No entries found</p>
              <p className="text-xs text-slate-400 mt-0.5">Website contact submissions will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Inquirer name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Query Detail</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{e.name}</td>
                    <td className="px-6 py-4">
                      <div>{e.email || 'No email'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{e.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate" title={e.query}>
                      {e.query}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {e.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                        e.status === 'Spam' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setViewingEnquiry(e)}
                          className="p-1.5 rounded bg-slate-55 text-slate-600 hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this enquiry?")) {
                              onDeleteEnquiry(e.id);
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

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-[#007f6e]" />
                {formMode === 'add' ? 'Add New Enquiry' : 'Edit Enquiry Details'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Inquirer Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Inquiry Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  >
                    <option value="General">General</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Enquiry Query / Notes</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Detail your requirements or inquiry message..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Status</label>
                <div className="flex gap-2">
                  {(['Pending', 'Resolved', 'Spam'] as Inquiry['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`text-xs px-3 py-1.5 border rounded-lg font-semibold transition-all ${
                        status === st 
                          ? st === 'Resolved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : st === 'Spam' ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
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
                  {formMode === 'add' ? 'Submit Entry' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/60 backdrop-blur-xs flex items-center justify-center p-4" id="enquiry-view-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#115e59] text-white p-6 relative">
              <button
                onClick={() => setViewingEnquiry(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
              >
                <X size={15} />
              </button>
              
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs">
                  {viewingEnquiry.name.trim().charAt(0) || 'E'}
                </div>
                <div>
                  <h2 className="text-md md:text-lg font-bold">{viewingEnquiry.name}</h2>
                  <span className="text-emerald-100 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 inline-block mt-1">
                    Enquiry ID: {viewingEnquiry.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Contents */}
            <div className="p-6 space-y-5 max-h-[30rem] overflow-y-auto">
              {/* Row 1: Contact Detail and Status */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Contact Detail & Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Phone Number</span>
                    <span className="text-slate-850 mt-0.5 block font-mono">{viewingEnquiry.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Email Address</span>
                    <span className="text-slate-850 mt-0.5 block break-all">{viewingEnquiry.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Department Room</span>
                    <span className="text-slate-850 mt-0.5 block">{viewingEnquiry.department || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Submission Date</span>
                    <span className="text-slate-850 mt-0.5 block">{new Date(viewingEnquiry.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Message text content */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Submission Query Question</h4>
                <div className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl">
                  <span className="text-slate-400 font-semibold block uppercase text-[8px] mb-1">Inquiry Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium pr-1">
                    {viewingEnquiry.query}
                  </p>
                </div>
              </div>

              {/* Row 3: Live Status badge details */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Oversight Status</h4>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`w-3 h-3 rounded-full ${
                    viewingEnquiry.status === 'Resolved' ? 'bg-emerald-500' :
                    viewingEnquiry.status === 'Spam' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-slate-700">Inquiry status marked as <strong className="text-slate-850">{viewingEnquiry.status}</strong></span>
                </div>
              </div>
            </div>

            {/* Footer with Edit, Delete, Download PDF & Close buttons */}
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
                    if (confirm(`Are you sure you want to delete this enquiry?`)) {
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
