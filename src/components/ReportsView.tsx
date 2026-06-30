import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  Eye, 
  RefreshCw, 
  Calendar, 
  ArrowLeft, 
  Stethoscope, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  Package,
  Layers,
  Building,
  User,
  ShieldAlert,
  Search,
  CheckCircle,
  HelpCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { Patient, Appointment, Doctor, Staff, Bill, InventoryItem, Department, SubDepartment } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface ReportsViewProps {
  appointments?: Appointment[];
  bills?: Bill[];
  staffList?: Staff[];
  doctors?: Doctor[];
  patients?: Patient[];
  departments?: Department[];
  subDepartments?: SubDepartment[];
  inventory?: InventoryItem[];
  onRefresh?: () => void;
  onNavigate?: (view: any) => void;
}

export default function ReportsView({
  appointments = [],
  bills = [],
  staffList = [],
  doctors = [],
  patients = [],
  departments = [],
  subDepartments = [],
  inventory = [],
  onRefresh,
  onNavigate
}: ReportsViewProps) {
  // Global Month Filter
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  
  // Selected detail view state
  // null | 'appointments' | 'bills' | 'staff' | 'doctors' | 'patients' | 'departments' | 'inventory'
  const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);

  // Search inside detail view
  const [detailSearch, setDetailSearch] = useState('');

  // Render export buttons helper
  const renderExportButtonsBlock = (matchingList: any[], headers: string[], keys: string[], reportName: string) => {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Export:</span>
        <button
          onClick={() => {
            const filename = `${reportName}_report_${new Date().toISOString().slice(0, 10)}`;
            downloadCSV(matchingList, headers, keys, filename);
          }}
          className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
          title="Download as CSV spreadsheet"
        >
          CSV
        </button>
        <button
          onClick={() => {
            const filename = `${reportName}_report_${new Date().toISOString().slice(0, 10)}`;
            downloadExcel(matchingList, headers, keys, filename);
          }}
          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-110 text-[#007f6e] rounded-md border border-emerald-150 transition-all flex items-center gap-1 cursor-pointer"
          title="Download as Excel ledger"
        >
          Excel
        </button>
        <button
          onClick={() => {
            const filename = `${reportName}_report_${new Date().toISOString().slice(0, 10)}`;
            downloadWord(matchingList, headers, keys, filename, reportName.toUpperCase().replace(/_/g, ' ') + ' PORTFOLIO');
          }}
          className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md border border-blue-150 transition-all flex items-center gap-1 cursor-pointer"
          title="Download as Word dynamic format"
        >
          Word
        </button>
        <button
          onClick={() => {
            const filename = `${reportName}_report_${new Date().toISOString().slice(0, 10)}`;
            downloadPDFFile(matchingList, headers, keys, filename, reportName.toUpperCase().replace(/_/g, ' ') + ' AUDIT');
          }}
          className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md border border-rose-150 transition-all flex items-center gap-1 cursor-pointer"
          title="Download as PDF/Print-ready format"
        >
          PDF
        </button>
      </div>
    );
  };

  // 1. Dynamic month-years list extraction (e.g. "2026-06", "2026-05") - past, present, and upcoming
  const monthsList = useMemo(() => {
    const list: string[] = [];
    const keysSet = new Set<string>();

    const addMonthYear = (year: number, month: number) => {
      const monthNum = String(month).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      if (!keysSet.has(key)) {
        keysSet.add(key);
        // Get readable month name safely
        const dObj = new Date(year, month - 1, 15);
        const monthLabel = dObj.toLocaleString('default', { month: 'long' });
        const label = `${monthLabel} ${year}`;
        list.push(`${key}|${label}`);
      }
    };

    // Dynamically populate 3 years before and 2 years after the current year to give complete calendar choices
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 3;
    const endYear = currentYear + 2;

    // Generate everything in this range
    for (let year = endYear; year >= startYear; year--) {
      for (let month = 12; month >= 1; month--) {
        addMonthYear(year, month);
      }
    }

    // Also parse any month-years outside this range from active database elements to ensure no records are orphaned
    const parseAndAddDate = (dateStr?: string) => {
      if (!dateStr) return;
      const cleanDate = dateStr.slice(0, 10); // "YYYY-MM-DD"
      if (/^\d{4}-\d{2}/.test(cleanDate)) {
        const parts = cleanDate.split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (!isNaN(year) && !isNaN(month)) {
          addMonthYear(year, month);
        }
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          addMonthYear(d.getFullYear(), d.getMonth() + 1);
        }
      }
    };

    appointments.forEach(a => parseAndAddDate(a.date));
    bills.forEach(b => parseAndAddDate(b.date));
    patients.forEach(p => parseAndAddDate(p.registeredAt));
    staffList.forEach(s => parseAndAddDate(s.joinDate));

    // Sort descending so the most future months are on top of list
    list.sort((a, b) => b.split('|')[0].localeCompare(a.split('|')[0]));
    return list;
  }, [appointments, bills, patients, staffList]);

  // Helper date checker for current dynamic filter
  const isSelectedDate = (dateStr?: string) => {
    if (selectedMonth === 'All') return true;
    if (!dateStr) return false;
    return dateStr.startsWith(selectedMonth);
  };

  // 2. Filtered Data Calculations
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => isSelectedDate(a.date));
  }, [appointments, selectedMonth]);

  const filteredBills = useMemo(() => {
     return bills.filter(b => isSelectedDate(b.date));
  }, [bills, selectedMonth]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => isSelectedDate(p.registeredAt));
  }, [patients, selectedMonth]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => isSelectedDate(s.joinDate));
  }, [staffList, selectedMonth]);

  // Static collections (don't usually depend strictly on months, but we filter if matching dates, 
  // or keep overall status clearly stated with beautiful indications)
  const filteredDoctors = doctors;
  const filteredDepartments = departments;
  const filteredSubDepartments = subDepartments;
  const filteredInventory = inventory;

  // Global KPIs of filtered items
  const totalBillAmount = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [filteredBills]);

  const paidBillAmount = useMemo(() => {
    return filteredBills
      .filter(b => b.status === 'Paid')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [filteredBills]);

  const collectableAmount = useMemo(() => {
    return filteredBills
      .filter(b => b.status === 'Pending')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [filteredBills]);

  // Inventory value metric
  const totalInventoryStockVal = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (Number(item.stock || 0) * Number(item.price || 0)), 0);
  }, [filteredInventory]);

  const lowStockItemsCount = useMemo(() => {
    return filteredInventory.filter(item => Number(item.stock || 0) <= Number(item.minStock || 0)).length;
  }, [filteredInventory]);

  // Click on Card drills down to specific view detail
  const renderMainDashboard = () => {
    return (
      <div className="space-y-6">
        {/* KPI Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="reports-bento-grid">
          
          {/* Card 1: Appointments */}
          <div 
            onClick={() => { setActiveDrilldown('appointments'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Appointments Queue</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredAppointments.length}
                </span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-indigo-550 flex items-center gap-1">
                Scheduled: {filteredAppointments.filter(a => a.status === 'Scheduled').length}
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Monitor List <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 2: Billing & Total Finance */}
          <div 
            onClick={() => { setActiveDrilldown('bills'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Billing Collections</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block truncate">
                  ₹{totalBillAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <FileText size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                Collected: {filteredBills.filter(b => b.status === 'Paid').length} invoices
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Analyze Billing <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 3: Total Staff count */}
          <div 
            onClick={() => { setActiveDrilldown('staff'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Hospital Directory</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredStaff.length} Employees
                </span>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <Users size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-amber-600">
                Active: {filteredStaff.filter(s => s.status === 'Active').length} on-duty
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Review Staff <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 4: Doctors roster */}
          <div 
            onClick={() => { setActiveDrilldown('doctors'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Active Doctors</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredDoctors.length} Practitioners
                </span>
              </div>
              <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <Stethoscope size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-sky-600">
                On Duty: {filteredDoctors.filter(d => d.status === 'On Duty').length} assigned
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Check Roster <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 5: Total Patients */}
          <div 
            onClick={() => { setActiveDrilldown('patients'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Patients Registered</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredPatients.length} Patients
                </span>
              </div>
              <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <User size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-violet-600">
                New: {filteredPatients.filter(p => p.status === 'New').length} admitted
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                View Register <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 6: Departments & Sub-departments */}
          <div 
            onClick={() => { setActiveDrilldown('departments'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Clinical Structure</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredDepartments.length} Departments
                </span>
              </div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <Layers size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-teal-600">
                Sub-Departments: {filteredSubDepartments.length} divisions
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                See Clinical Units <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 7: Total Inventory purchases and items */}
          <div 
            onClick={() => { setActiveDrilldown('inventory'); setDetailSearch(''); }}
            className="group bg-white border border-slate-100/80 hover:border-[#007f6e] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer select-none space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Inventory & Stock</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {filteredInventory.length} Items Listed
                </span>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[#007f6e] group-hover:text-white">
                <Package size={18} />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-50 pt-3">
              <span className={`font-semibold text-[11px] flex items-center gap-1 ${lowStockItemsCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
                {lowStockItemsCount > 0 ? `🚨 ${lowStockItemsCount} low stock` : '✓ Stocks secured'}
              </span>
              <span className="text-[#007f6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Check Warehouse <ChevronRight size={12} />
              </span>
            </div>
          </div>

        </div>

        {/* HELPFUL INFORMATION STATS / INSIGHT HERO BANNER */}
        <div className="bg-[#007f6e] text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 select-none">
          <div className="space-y-1.5 md:max-w-xl">
            <span className="flex items-center gap-1.5 text-[10px] bg-[#006657] text-teal-105 font-bold tracking-widest uppercase px-3 py-1 rounded-full w-max">
              <Info size={11} />
              Live Hospital Intelligence
            </span>
            <h2 className="text-base font-extrabold tracking-tight">Interactive Central Reporting System</h2>
            <p className="text-xs text-teal-50 ml-0.5 leading-relaxed">
              This intelligence module extracts real-time database numbers from other wings of your system including appointments schedules, billing cash books, staff files, doctor shifts, and stock inventories. Select a month on the top filter to update card states instantly, or click a card to drill down into a comprehensive report.
            </p>
          </div>
          <div className="flex items-center justify-center bg-[#006657] border border-teal-500/10 p-5 rounded-2xl w-full md:w-auto font-sans">
            <div className="text-center">
              <span className="block text-[9px] font-bold uppercase text-teal-105 tracking-wider">Aggregate Value in Invoices</span>
              <span className="block text-2xl font-black mt-1">₹{bills.reduce((total, b) => total + Number(b.amount || 0), 0).toLocaleString('en-IN')}</span>
              <span className="block text-[10px] text-teal-100/80 mt-0.5 mt-1 block">Full ledger records lifespan</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // DETAIL GRAPH VIEWS
  // -------------------------------------------------------------
  const renderDetailCard = () => {
    switch (activeDrilldown) {
      case 'appointments': {
        const matchingList = filteredAppointments.filter(item => {
          return detailSearch === '' || 
            (item.patientName || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.doctorName || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.specialization || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        const completedCount = filteredAppointments.filter(a => a.status === 'Completed').length;
        const confirmedCount = filteredAppointments.filter(a => a.status === 'Confirmed').length;
        const scheduledCount = filteredAppointments.filter(a => a.status === 'Scheduled').length;
        const cancelledCount = filteredAppointments.filter(a => a.status === 'Cancelled').length;

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Appointments Analytic Directory
              </h2>
            </div>

            {/* Sub summary metrics details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Completed</span>
                <span className="text-xl font-bold text-emerald-600 block mt-1">{completedCount} bookings</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Confirmed</span>
                <span className="text-xl font-bold text-teal-605 block mt-1">{confirmedCount} sessions</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Scheduled</span>
                <span className="text-xl font-bold text-amber-500 block mt-1">{scheduledCount} pending</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Cancelled</span>
                <span className="text-xl font-bold text-rose-500 block mt-1">{cancelledCount} alerts</span>
              </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Record Listing ({matchingList.length} total)</span>
                {renderExportButtonsBlock(matchingList, ['Patient Name', 'Doctor Assigned', 'Specialization Department', 'Timings', 'Status'], ['patientName', 'doctorName', 'specialization', 'time', 'status'], 'appointments')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search doctor, client name, specialization..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-mono text-xs">No matching appointments found.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Patient Name</th>
                        <th className="px-6 py-3">Doctor Assigned</th>
                        <th className="px-6 py-3">Specialization Department</th>
                        <th className="px-6 py-3">Timings</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-bold text-slate-800">{item.patientName}</td>
                          <td className="px-6 py-3.5 font-medium">{item.doctorName}</td>
                          <td className="px-6 py-3.5 font-semibold text-[#007f6e]">{item.specialization}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">{item.date} @ {item.time}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' :
                              item.status === 'Confirmed' ? 'bg-[#e6f4f1] text-[#007f6e]' :
                              item.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-605'
                            }`}>
                              {item.status}
                            </span>
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

      case 'bills': {
        const matchingList = filteredBills.filter(item => {
          return detailSearch === '' || 
            (item.patientName || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.status || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        const paidCount = filteredBills.filter(b => b.status === 'Paid').length;
        const pendingCount = filteredBills.filter(b => b.status === 'Pending').length;

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Invoicing & financial audit
              </h2>
            </div>

            {/* financial summary widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Logged Billing</span>
                <span className="text-xl font-bold text-slate-80 block mt-1">₹{totalBillAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Paid Invoices Balance</span>
                <span className="text-xl font-bold text-emerald-600 block mt-1">₹{paidBillAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Collectables Awaiting Payment</span>
                <span className="text-xl font-bold text-rose-500 block mt-1">₹{collectableAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Clearance Ratio</span>
                <span className="text-xl font-extrabold text-blue-600 block mt-1">
                  {totalBillAmount > 0 ? ((paidBillAmount / totalBillAmount) * 100).toFixed(1) : 0}% Paid
                </span>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs font-bold text-slate-500">Invoice Register ({matchingList.length} records)</span>
                  <span className="bg-[#bce6df] text-[#007f6e] px-2 py-0.2 rounded text-[10px] font-bold">{paidCount} Paid / {pendingCount} Pending</span>
                </div>
                {renderExportButtonsBlock(matchingList, ['Invoice ID', 'Patient Name', 'Date', 'Amount', 'Status'], ['id', 'patientName', 'date', 'amount', 'status'], 'invoice_bills')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search patient invoice name or status..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-450 font-mono text-xs">No invoices logged for the selected filter date.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Receipt Invoice ID</th>
                        <th className="px-6 py-3">Patient / Customer Client</th>
                        <th className="px-6 py-3">Value Date</th>
                        <th className="px-6 py-3">Settlement Status</th>
                        <th className="px-6 py-3 text-right">Invoice Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-mono text-slate-500 font-bold">#{item.id}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-805">{item.patientName}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-450">{item.date}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                              item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500 animate-pulse'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-extrabold font-mono text-slate-805">
                            ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

      case 'staff': {
        const matchingList = filteredStaff.filter(item => {
          return detailSearch === '' || 
            (item.name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.role || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.department || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        // Group rolls
        const rolesMap: Record<string, number> = {};
        filteredStaff.forEach(s => {
          const r = s.role || 'OtherStaff';
          rolesMap[r] = (rolesMap[r] || 0) + 1;
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Hospital Operations & Human Capital
              </h2>
            </div>

            {/* Roles widgets */}
            <div className="bg-white rounded-2xl border p-5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Staff Role Integrities</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(rolesMap).map((role) => (
                  <span key={role} className="px-3.5 py-1.5 bg-slate-50 text-slate-658 border border-slate-150 rounded-xl text-xs font-medium">
                    {role}: <strong className="text-slate-800">{rolesMap[role]}</strong>
                  </span>
                ))}
                {Object.keys(rolesMap).length === 0 && (
                  <p className="text-xs text-slate-400 font-mono">No staff joined in filtered dates.</p>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Hospital Employees Directory ({matchingList.length} listed)</span>
                {renderExportButtonsBlock(matchingList, ['Employee Name', 'Role', 'Department', 'Join Date', 'Status'], ['name', 'role', 'department', 'joinDate', 'status'], 'staff')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search name, role type, department..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-450 font-mono text-xs">No employees found.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Employee Name</th>
                        <th className="px-6 py-3">Work Role</th>
                        <th className="px-6 py-3">Assigned Wing / Dept</th>
                        <th className="px-6 py-3 font-mono">Join Date</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-bold text-slate-805">{item.name}</td>
                          <td className="px-6 py-3.5 font-semibold text-[#007f6e]">{item.role}</td>
                          <td className="px-6 py-3.5 font-medium">{item.department}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-505">{item.joinDate || 'Older Record'}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              item.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.status}
                            </span>
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

      case 'doctors': {
        const matchingList = filteredDoctors.filter(item => {
          return detailSearch === '' || 
            (item.name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.specialization || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.department || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        const activeCount = filteredDoctors.filter(d => d.status === 'On Duty').length;
        const offDutyCount = filteredDoctors.filter(d => d.status === 'Off Duty').length;

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Clinical specialists & shifts
              </h2>
            </div>

            {/* Doctors summary widgets */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Clinical Doctors</span>
                <span className="text-xl font-bold text-slate-800 block mt-1">{filteredDoctors.length} Practitioners</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Doctors on duty now</span>
                <span className="text-xl font-bold text-[#007f6e] block mt-1">{activeCount} assigned</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Doctors off duty</span>
                <span className="text-xl font-bold text-amber-500 block mt-1">{offDutyCount} on call</span>
              </div>
            </div>

            {/* Table Directory */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Doctors Registry Directory ({matchingList.length} specialists)</span>
                {renderExportButtonsBlock(matchingList, ['Specialist Name', 'Specialization', 'Fee', 'Status'], ['name', 'specialization', 'consultationFee', 'status'], 'doctors')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search doctor name or specialization area..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-mono text-xs">No doctors found in system records.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Specialist Practitioner Name</th>
                        <th className="px-6 py-3">Assigned Specialization</th>
                        <th className="px-6 py-3 font-mono">Cons. Fee (₹)</th>
                        <th className="px-6 py-3">Shift Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-bold text-slate-805">{item.name}</td>
                          <td className="px-6 py-3.5 font-semibold text-[#007f6e]">{item.specialization}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-600">₹{item.consultationFee || item.fee || 300}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.status === 'On Duty' ? 'bg-[#e6f4f1] text-[#007f6e]' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status}
                            </span>
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

      case 'patients': {
        const matchingList = filteredPatients.filter(item => {
          return detailSearch === '' || 
            (item.name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.phone || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.status || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Patient Census Demographics
              </h2>
            </div>

            {/* Brief summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Filtered Period admissions</span>
                <span className="text-xl font-bold text-slate-800 block mt-1">{filteredPatients.length} Patients</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">New Patients</span>
                <span className="text-xl font-bold text-indigo-505 block mt-1">
                  {filteredPatients.filter(p => p.status === 'New').length} cases
                </span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Registered Follow-ups</span>
                <span className="text-xl font-bold text-[#007f6e] block mt-1">
                  {filteredPatients.filter(p => p.status === 'Follow-up').length} cases
                </span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Critical Admissions</span>
                <span className="text-xl font-bold text-rose-500 block mt-1">
                  {filteredPatients.filter(p => p.wardId).length} in wards
                </span>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Demographic Admissions Registry ({matchingList.length} records)</span>
                {renderExportButtonsBlock(matchingList, ['Patient Name', 'Age', 'Gender', 'Phone', 'Status', 'Registered At'], ['name', 'age', 'gender', 'phone', 'status', 'registeredAt'], 'patients')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search name, phone contact or patient type..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-455 font-mono text-xs">No records registered for this filtered block.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Patient Admitted Name</th>
                        <th className="px-6 py-3">Age</th>
                        <th className="px-6 py-3">Gender</th>
                        <th className="px-6 py-3 font-mono">Contact Phone</th>
                        <th className="px-6 py-3">Registration Status</th>
                        <th className="px-6 py-3">Log Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-bold text-slate-805">{item.name}</td>
                          <td className="px-6 py-3.5 font-medium">{item.age} years</td>
                          <td className="px-6 py-3.5 font-medium">{item.gender || 'Other'}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-505">{item.phone}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.status === 'New' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#007f6e]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-450">
                            {item.registeredAt ? item.registeredAt.slice(0, 10) : 'Pre-existing'}
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

      case 'departments': {
        const matchingList = filteredDepartments.filter(item => {
          return detailSearch === '' || 
            (item.name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.code || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Structural clinical tree
              </h2>
            </div>

            {/* Structure Summary items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl p-5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Departments</span>
                <span className="text-2xl font-black text-[#007f6e] block">{filteredDepartments.length} Base Divisions</span>
                <p className="text-xs text-slate-400 font-medium">Core wings that run specialty diagnostics and operations.</p>
              </div>

              <div className="bg-white border rounded-xl p-5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sub Departments divisions</span>
                <span className="text-2xl font-black text-indigo-600 block">{filteredSubDepartments.length} Allied Cells</span>
                <p className="text-xs text-slate-400 font-medium">Subordinated medical units and test laboratories.</p>
              </div>
            </div>

            {/* Primary list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Core Depts list */}
              <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">Core Hospital Departments ({matchingList.length})</span>
                  {renderExportButtonsBlock(matchingList, ['Department Name', 'Code', 'Location', 'Status'], ['name', 'code', 'location', 'status'], 'departments_core')}
                </div>
                
                {matchingList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No departments specified yet.</div>
                ) : (
                  <div className="divide-y text-xs max-h-96 overflow-y-auto">
                    {matchingList.map((dept) => (
                      <div key={dept.id} className="p-4 hover:bg-slate-50/50 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="block font-bold text-slate-800">{dept.name}</span>
                          <span className="block text-[10px] text-slate-450">Code: <strong className="font-mono text-slate-600">{dept.code}</strong> | {dept.location}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[9px] uppercase">{dept.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub Depts list */}
              <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">Allied Divisions / Sub Departments ({filteredSubDepartments.length})</span>
                  {renderExportButtonsBlock(filteredSubDepartments, ['Division Name', 'Location', 'Status'], ['name', 'location', 'status'], 'departments_allied')}
                </div>

                {filteredSubDepartments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No active sub-departments loaded yet.</div>
                ) : (
                  <div className="divide-y text-xs max-h-96 overflow-y-auto">
                    {filteredSubDepartments.map((sub) => {
                      const parent = filteredDepartments.find(d => d.id === sub.departmentId);
                      return (
                        <div key={sub.id} className="p-4 hover:bg-slate-50/50 flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="block font-bold text-slate-805">{sub.name}</span>
                            <span className="block text-[10px] text-indigo-500 font-semibold uppercase">
                              Parent: {parent ? parent.name : 'Central Wing'}
                            </span>
                            <span className="block text-[10px] text-slate-400">Location : {sub.location || 'Consulting Rooms'}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded-full font-bold text-[9px] uppercase">{sub.status || 'Active'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      }

      case 'inventory': {
        const matchingList = filteredInventory.filter(item => {
          return detailSearch === '' || 
            (item.name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header back */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#007f6e] hover:text-[#006657] bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Reports</span>
              </button>
              <h2 className="text-sm font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-md">
                Module: Inventory stock & pharmaceuticals
              </h2>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Valued Net Stock capital</span>
                <span className="text-xl font-bold text-slate-800 block mt-1">₹{totalInventoryStockVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Unique Stock Skus</span>
                <span className="text-xl font-bold text-[#007f6e] block mt-1">{filteredInventory.length} products</span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Low Stock Threats</span>
                <span className={`text-xl font-bold block mt-1 ${lowStockItemsCount > 0 ? 'text-rose-600 animate-pulse font-extrabold' : 'text-emerald-600'}`}>
                  {lowStockItemsCount} Alerts
                </span>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Avg Price tier</span>
                <span className="text-xl font-bold text-indigo-600 block mt-1">
                  ₹{filteredInventory.length > 0 ? (filteredInventory.reduce((sum, item) => sum + Number(item.price || 0), 0) / filteredInventory.length).toFixed(1) : 0}
                </span>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-[#fafbfc] flex justify-between items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Warehouse Stocks Ledger ({matchingList.length} items)</span>
                {renderExportButtonsBlock(matchingList, ['Item Name', 'Category', 'Quantity', 'Min Stock', 'Price', 'Status'], ['name', 'category', 'quantity', 'minStock', 'price', 'status'], 'inventory_stocks')}
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405"><Search size={13} /></span>
                  <input
                    type="text"
                    placeholder="Search stock item name, brand category..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-4 py-1.5 border rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                  />
                </div>
              </div>

              {matchingList.length === 0 ? (
                <div className="p-12 text-center text-slate-450 font-mono text-xs">No matching products inside inventory.</div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-3">Warehouse Item Name</th>
                        <th className="px-6 py-3">Category classification</th>
                        <th className="px-6 py-3 font-mono">Count Stock</th>
                        <th className="px-6 py-3 font-mono">Mín Threshold</th>
                        <th className="px-6 py-3 text-right">Unit Price (₹)</th>
                        <th className="px-6 py-3 text-right">Stock Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-705">
                      {matchingList.map((item) => {
                        const isLow = Number(item.stock || 0) <= Number(item.minStock || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3.5 font-bold text-slate-805">
                              <div>{item.name}</div>
                              {item.brandName && <div className="text-[9px] text-[#007f6e] mt-0.5">{item.brandName} - {item.genericName || ''}</div>}
                            </td>
                            <td className="px-6 py-3.5 font-medium">{item.category}</td>
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{item.stock} {item.unit || 'units'}</td>
                            <td className="px-6 py-3.5 font-mono text-slate-400">{item.minStock}</td>
                            <td className="px-6 py-3.5 text-right font-mono font-semibold">₹{Number(item.price || 0).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium">
                              {isLow ? (
                                <span className="inline-block px-2 text-[9px] py-0.5 font-bold bg-rose-50 border border-slate-100 rounded text-rose-600 font-extrabold animate-pulse">
                                  🚨 RESTOCK NOW
                                </span>
                              ) : (
                                <span className="inline-block px-2 text-[9px] py-0.5 font-semibold bg-emerald-50 text-emerald-600 rounded">
                                  ✓ Secure Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="analytical-reports-root">
      
      {/* HEADER ROW WITH MONTH FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5" id="reports-top-deck">
        <div>
          <h1 className="text-xl font-bold text-slate-850 tracking-tight" id="analytical-title">Hospital Reports Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">Statistical indices, patient intake metrics, directory records summaries and billing audits.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-xs select-none">
          <Calendar size={14} className="text-[#007f6e]" />
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Analytical Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              // Clean search inside detail view when month swaps
              setDetailSearch('');
            }}
            className="text-xs border-none font-bold bg-transparent text-slate-700 focus:outline-none cursor-pointer p-0 w-44"
          >
            <option value="All">All Months (Full life-log)</option>
            {monthsList.map((m) => {
              const [key, label] = m.split('|');
              return (
                <option key={key} value={key}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
       </div>
      </div>

      {/* RENDER MODE switcher (Main bento grid vs custom details drilldown view) */}
      {activeDrilldown === null 
        ? renderMainDashboard() 
        : renderDetailCard()
      }

    </div>
  );
}
