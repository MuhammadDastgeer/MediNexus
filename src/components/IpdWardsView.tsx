import React, { useState } from 'react';
import { Bed, Plus, Search, RefreshCw, FileSpreadsheet, Lock } from 'lucide-react';
import { Patient } from '../types';

interface IpdWardsViewProps {
  patients: Patient[];
  onAdmitPatient: () => void;
  onRefresh: () => void;
}

export default function IpdWardsView({ patients, onAdmitPatient, onRefresh }: IpdWardsViewProps) {
  const [activeTab, setActiveTab] = useState<'bed-map' | 'admissions'>('bed-map');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('Name');

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="ipd-wards-view">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="ipd-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="ipd-title">IPD — Ward & Bed Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Allocate, track, and configure wards and hospital bed systems.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onAdmitPatient}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            id="admit-patient-btn"
          >
            <Plus size={14} />
            <span>Admit Patient</span>
          </button>
          <button
            onClick={() => alert('Export IPD Records CSV')}
            className="flex items-center gap-1.5 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center justify-center p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Bed Map, Admissions) */}
      <div className="flex border-b border-slate-100" id="ipd-tabs-row">
        <button
          onClick={() => setActiveTab('bed-map')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bed-map'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Bed Map
        </button>
        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'admissions'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Admissions
        </button>
      </div>

      {/* Bed System Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="ipd-metrics">
        {/* Total Beds */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Beds</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <Bed size={18} />
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupied</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <Bed size={18} className="text-rose-400" />
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <Bed size={18} className="text-emerald-450" />
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maintenance</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">
            0
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="ipd-main-card">
        {/* Sort and search bar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e]"
            >
              <option value="Name">Sort: Name</option>
              <option value="Type">Sort: Type</option>
              <option value="Availability">Sort: Available</option>
              <option value="Occupied">Sort: Occupied</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search ward or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {activeTab === 'bed-map' ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-wards">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <Bed size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No wards configured</p>
              <p className="text-xs text-slate-400 mt-0.5">Configure wards in Configure Hospital to view real-time bed allocation diagrams.</p>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-xs text-slate-400" id="empty-admissions">
            No active patient admissions recorded. Admit patients using the upper-right button.
          </div>
        )}
      </div>
    </div>
  );
}
