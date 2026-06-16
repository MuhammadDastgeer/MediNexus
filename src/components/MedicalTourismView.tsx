import React, { useState } from 'react';
import { Globe, Search, RefreshCw, Plane, CreditCard, Shield } from 'lucide-react';

interface TourismEnquiry {
  id: string;
  name: string;
  country: string;
  treatment: string;
  status: 'Received' | 'VISA Assistance' | 'Scheduled' | 'Completed';
  date: string;
}

interface MedicalTourismViewProps {
  enquiries?: TourismEnquiry[];
  onRefresh: () => void;
}

export default function MedicalTourismView({ enquiries = [], onRefresh }: MedicalTourismViewProps) {
  const [search, setSearch] = useState('');

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="medical-tourism-view">
      {/* Title block */}
      <div className="flex justify-between items-center" id="tourism-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="tourism-title">Medical Tourism Enquiries</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and track international medical consulting inquiries and workflows.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw size={12} className="text-[#007f6e]" />
          <span className="text-[#007f6e]">Refresh</span>
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="tourism-kpis">
        {/* Total global enquiries */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Enquiries</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <Globe size={18} />
          </div>
        </div>

        {/* Foreign admissions */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Foreign Admissions</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <Plane size={18} />
          </div>
        </div>

        {/* Pending VISA */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending VISA Assistance</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Shield size={18} />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-slate-800">₹0.00</span>
          </div>
          <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="tourism-main-card">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-end" id="tourism-filter">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search country, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {enquiries.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-globe">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <Globe size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No enquiries found</p>
              <p className="text-xs text-slate-400 mt-0.5">International patient consulting queries will be displayed here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if any loaded */}
          </div>
        )}
      </div>
    </div>
  );
}
