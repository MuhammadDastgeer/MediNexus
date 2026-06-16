import React, { useState } from 'react';
import { HelpCircle, Search, RefreshCw, Clock, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

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
}

export default function EnquiriesView({ enquiries, onUpdateStatus, onRefresh }: EnquiriesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const pendingCount = enquiries.filter(e => e.status === 'Pending').length;
  const resolvedCount = enquiries.filter(e => e.status === 'Resolved').length;
  const spamCount = enquiries.filter(e => e.status === 'Spam').length;

  const filtered = enquiries.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.query.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="enquiries-view">
      {/* Title Header */}
      <div className="flex justify-between items-center" id="enquiries-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="enquiry-title">Enquiries Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">Review user web submission forms and inquiries.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 border border-slate-155 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw size={12} className="text-[#007f6e]" />
          <span className="text-[#007f6e]">Refresh</span>
        </button>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold text-slate-400">Pending</span>
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
          <div className="w-10 h-15 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
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
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e]"
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
                  <th className="px-6 py-3">Inquirer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Query</th>
                  <th className="px-6 py-3">Dept</th>
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
                        {e.status === 'Pending' && (
                          <button
                            onClick={() => onUpdateStatus(e.id, 'Resolved')}
                            className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100"
                          >
                            Resolve
                          </button>
                        )}
                        {e.status !== 'Spam' && (
                          <button
                            onClick={() => onUpdateStatus(e.id, 'Spam')}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="Mark Spam"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
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
  );
}
