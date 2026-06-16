import React from 'react';
import { BarChart3, TrendingUp, Users, Download, Eye, RefreshCw } from 'lucide-react';

export default function ReportsView() {
  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="reports-view">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Analytical Reports</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gain business insights, daily traffic summaries, and department metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between h-48">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Footfall</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">0 Patients</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-3">
            <span>Last 24 Hours</span>
            <span className="text-emerald-500 font-bold">0% Change</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between h-48">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostics Utilization</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">0 %</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-3">
            <span>Critical Load status</span>
            <span className="text-[#007f6e] font-bold">Stable</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between h-48">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pharmacy Stock Integrity</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">100 % Healthy</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-3">
            <span>Low stocks alerts count</span>
            <span className="text-rose-500 font-bold">0 Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
