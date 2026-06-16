import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  IndianRupee,
  RefreshCw,
  Bell,
  CheckCircle2,
  ChevronRight,
  Activity,
  HeartPlus,
} from 'lucide-react';
import { Appointment, Patient, InventoryItem, Bill, Doctor, Staff } from '../types';

interface DashboardViewProps {
  appointments: Appointment[];
  patients: Patient[];
  inventory: InventoryItem[];
  bills: Bill[];
  onNavigate: (view: any) => void;
  doctors: Doctor[];
  staffList: Staff[];
}

export default function DashboardView({
  appointments,
  patients,
  inventory,
  bills,
  onNavigate,
  doctors = [],
  staffList = [],
}: DashboardViewProps) {
  const [lastUpdated, setLastUpdated] = useState('06:28:43');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trigger refreshing visual effect
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      setLastUpdated(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      setIsRefreshing(false);
    }, 650);
  };

  // Compute live states
  const totalPatientsCount = patients.length;
  const staffAndDoctorsCount = doctors.length + staffList.length;
  const activeDoctorsCount = doctors.filter(
    (d) => d.status === 'On Duty' || d.isActive === true
  ).length;
  const todayAppointmentsCount = appointments.filter(
    (a) => a.status !== 'Cancelled'
  ).length;

  const totalRevenueCollected = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  // Stats Pills computed live
  const scheduledCount = appointments.filter((a) => a.status === 'Scheduled').length;
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'Cancelled').length;
  const pendingBillsCount = bills.filter((b) => b.status === 'Pending').length;

  // Render a responsive custom SVG path for Monthly Trends line.
  // It is styled with green stroke and animated dot connectors. If there are values we can bend the line!
  // If the values are all 0, it renders flat at baseline as in image.
  const octVal = appointments.filter(a => a.date.includes('-10-') || a.time.includes('Oct')).length;
  const novVal = appointments.filter(a => a.date.includes('-11-') || a.time.includes('Nov')).length;
  const decVal = appointments.filter(a => a.date.includes('-12-') || a.time.includes('Dec')).length;
  const janVal = appointments.filter(a => a.date.includes('-01-') || a.time.includes('Jan')).length;
  const febVal = appointments.filter(a => a.date.includes('-02-') || a.time.includes('Feb')).length;
  const marVal = appointments.filter(a => a.date.includes('-03-') || a.time.includes('Mar')).length;
  const aprVal = appointments.filter(a => a.date.includes('-04-') || a.time.includes('Apr')).length;
  const mayVal = appointments.filter(a => a.date.includes('-05-') || a.time.includes('May')).length;
  const junVal = appointments.filter(a => a.date.includes('-06-') || a.time.includes('Jun')).length;

  const monthValues = [octVal, novVal, decVal, janVal, febVal, marVal, aprVal, mayVal, junVal];
  const totalActivityValues = monthValues.reduce((sum, v) => sum + v, 0);

  // Generate SVG path coordinate points. Heights correspond to value index (max height 160).
  // 0 activity yields flat baseline (y = 120), higher inputs drag up.
  const chartHeight = 120;
  const points = monthValues.map((val, idx) => {
    const x = 40 + idx * 80;
    // Base is 120, height scaling: subtract value * 20
    const y = chartHeight - Math.min(val * 24, 100);
    return { x, y, value: val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none" id="dashboard-view-root">
      {/* Title Header */}
      <div className="flex items-center justify-between" id="dashboard-header-intro">
        <div>
          <h2 className="text-xl font-bold text-slate-800" id="dashboard-main-title">Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5" id="dashboard-last-updated">
            Last updated {lastUpdated}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-100/90 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          id="refresh-btn"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#007f6e]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards (4 cards, horizontal row layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* Card 1: Staff & Doctors */}
        <div className="bg-[#e6f4f1] border border-[#d1ebe5] rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]" id="kpi-staff-doctors">
          <div className="w-11 h-11 bg-[#007f6e] text-white rounded-xl flex items-center justify-center shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Staff & Doctors</h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{staffAndDoctorsCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{activeDoctorsCount} active doctors</p>
          </div>
        </div>

        {/* Card 2: Total Patients */}
        <div className="bg-[#ecf7f1] border border-[#d3ecd7] rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]" id="kpi-total-patients">
          <div className="w-11 h-11 bg-[#00a85a] text-white rounded-xl flex items-center justify-center shadow-sm">
            <UserCheck size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Patients</h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{totalPatientsCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">+{totalPatientsCount} this month</p>
          </div>
        </div>

        {/* Card 3: Today Appointments */}
        <div className="bg-[#f4effc] border border-[#e3d8f8] rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]" id="kpi-today-appointments">
          <div className="w-11 h-11 bg-[#8e52e9] text-white rounded-xl flex items-center justify-center shadow-sm">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Today Appointments</h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{todayAppointmentsCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{completedCount} completed</p>
          </div>
        </div>

        {/* Card 4: Revenue Today */}
        <div className="bg-[#fdf3e7] border border-[#fae5cc] rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]" id="kpi-revenue-today">
          <div className="w-11 h-11 bg-[#f39c12] text-white rounded-xl flex items-center justify-center shadow-sm">
            <IndianRupee size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Revenue Today</h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">₹{totalRevenueCollected.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">₹{totalRevenueCollected.toLocaleString()} this month</p>
          </div>
        </div>
      </div>

      {/* 7 Stats Accent Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" id="stats-pills-row">
        {[
          { label: 'Scheduled', value: scheduledCount, color: 'border-blue-500 text-blue-600' },
          { label: 'Confirmed', value: confirmedCount, color: 'border-violet-500 text-violet-600' },
          { label: 'Completed', value: completedCount, color: 'border-emerald-500 text-emerald-600' },
          { label: 'Cancelled', value: cancelledCount, color: 'border-rose-500 text-rose-600' },
          { label: 'Pending Bills', value: pendingBillsCount, color: 'border-amber-500 text-amber-600' },
          { label: 'Active Plans', value: 0, color: 'border-cyan-500 text-cyan-600' },
          { label: 'Plans Done', value: 0, color: 'border-green-500 text-green-600' },
        ].map((pill, idx) => (
          <div key={idx} className={`bg-white border-t-4 ${pill.color} rounded-lg p-3 text-center shadow-xs`} id={`stat-pill-${idx}`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">
              {pill.label}
            </span>
            <span className="text-lg font-bold block mt-1">{pill.value}</span>
          </div>
        ))}
      </div>

      {/* Row with Monthly Trend & Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="trends-row-container">
        {/* Monthly Activity Trends Graphic */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="trends-chart-card">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="trends-chart-header">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Monthly Activity Trends</h3>
              <p className="text-[10px] text-slate-400 font-medium">Appointments & new patients - last 9 months</p>
            </div>
            {/* Chart Legend */}
            <div className="flex gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#007f6e] rounded-full" />
                Appointments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#00a85a] rounded-full" />
                New Patients
              </span>
            </div>
          </div>

          {/* Simple Custom Line Graph Representation */}
          <div className="relative pt-6 h-40 flex items-end w-full" id="trends-svg-container">
            {/* Grid line values labeled left */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-mono w-4 pr-1">
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* Dotted helper grid lines */}
            <div className="absolute left-6 right-0 top-0 h-full flex flex-col justify-between pointer-events-none select-none">
              <div className="w-full border-t border-dashed border-slate-100 mt-1" />
              <div className="w-full border-t border-dashed border-slate-100" />
              <div className="w-full border-t border-dashed border-slate-100" />
              <div className="w-full border-t border-dashed border-slate-100" />
              <div className="w-full border-b border-slate-100" />
            </div>

            {/* Path Drawing */}
            <div className="relative left-6 right-0 w-[calc(100%-24px)] h-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 720 120" preserveAspectRatio="none">
                {/* Connecting Line with subtle green/teal accents */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={totalActivityValues > 0 ? '#00a85a' : '#00a85a'}
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />

                {/* Individual Dots */}
                {points.map((p, i) => (
                  <g key={i}>
                    {/* Glowing highlight ring for active plot */}
                    {p.value > 0 && (
                      <circle cx={p.x} cy={p.y} r="8" fill="#e6f7ec" stroke="#00a85a" strokeWidth="1" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill={p.value > 0 ? '#00a85a' : '#00a85a'}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all duration-300 hover:r-6"
                      title={`${p.value} acts`}
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Months bottom axis layout */}
          <div className="flex justify-between pl-10 text-[10px] font-bold text-slate-400 mt-2 font-mono" id="trends-axis-months">
            {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
              <span key={month} className="w-12 text-center">{month}</span>
            ))}
          </div>
        </div>

        {/* Live Alerts Panel */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="trends-alerts-card">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="alerts-card-header">
            <h3 className="text-xs font-bold text-slate-800">Live Alerts</h3>
            <span className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <Activity size={16} />
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6" id="alerts-check-ring">
            <div className="w-16 h-16 bg-[#e6f7ec] border-4 border-white ring-4 ring-[#e6f7ec]/30 rounded-full flex items-center justify-center text-[#00a85a] mb-3">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-xs text-slate-400 font-medium">All systems normal</p>
          </div>
        </div>
      </div>

      {/* Recently Registered Patients Container */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs" id="registered-patients-card">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="registered-patients-header">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Recently Registered Patients</h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {totalPatientsCount} total · {patients.filter(p => new Date(p.registeredAt).toDateString() === new Date().toDateString()).length} registered today
            </p>
          </div>
          <button
            onClick={() => onNavigate('patients')}
            className="w-7 h-7 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            id="all-patients-link-btn"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {patients.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium" id="registered-patients-empty">
            No patients registered yet
          </div>
        ) : (
          <div className="overflow-x-auto mt-4" id="recent-patients-list">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2">Gender / Age</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Visit Type</th>
                  <th className="px-4 py-2">Active Appointment</th>
                  <th className="px-4 py-2 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.slice(0, 3).map((p) => {
                  const matchedAppt = appointments.find(
                    (a) => a.patientName.toLowerCase() === p.name.toLowerCase() && a.status !== 'Cancelled'
                  );
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.gender} · {p.age} yrs</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{p.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'New' ? 'bg-[#e6f7ec]/80 text-[#00a85a]' : 'bg-[#f4effc]/80 text-[#8e52e9]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {matchedAppt ? (
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-semibold">{matchedAppt.doctorName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {matchedAppt.date} @ {matchedAppt.time}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">No schedule booked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigate('appointments')}
                          className="bg-slate-100 hover:bg-[#e6f4f1] border border-slate-200 text-slate-600 hover:text-[#007f6e] px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Book Slot
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Bottom Row Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="quick-navigation-grid">
        {/* Card A: Services & Treatment Dashboard */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center justify-between" id="quick-nav-services">
          <div className="space-y-3 flex-1">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Services & Treatment Dashboard</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Service packages, treatment plan stats, session completion
              </p>
            </div>
            <div className="flex flex-wrap gap-2" id="nav-services-actions">
              <button
                onClick={() => onNavigate('consultation')}
                className="bg-sky-50 text-sky-600 border border-sky-100 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-sky-100 transition-colors"
              >
                Service Packages
              </button>
              <button
                onClick={() => onNavigate('consultation')}
                className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
              >
                Treatment Plans
              </button>
              <button
                onClick={() => onNavigate('configure-hospital')}
                className="bg-violet-50 text-violet-600 border border-violet-100 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-violet-100 transition-colors"
              >
                Permissions
              </button>
            </div>
          </div>
          <button
            onClick={() => onNavigate('consultation')}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Card B: Departments & Sub-Depts */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center justify-between" id="quick-nav-depts">
          <div className="space-y-3 flex-1">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Departments & Sub-Depts</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Manage departments, sub-departments and procedures
              </p>
            </div>
            <div className="flex flex-wrap gap-2" id="nav-depts-actions">
              <button
                onClick={() => onNavigate('departments')}
                className="bg-blue-50 text-blue-600 border border-blue-100 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-blue-100 transition-colors"
              >
                Departments
              </button>
              <button
                onClick={() => onNavigate('departments')}
                className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
              >
                Sub-Depts
              </button>
              <button
                onClick={() => onNavigate('staff')}
                className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-slate-100 transition-colors"
              >
                Staff
              </button>
            </div>
          </div>
          <button
            onClick={() => onNavigate('departments')}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
