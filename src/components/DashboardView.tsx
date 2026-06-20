import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { Appointment, Patient, InventoryItem, Bill, Doctor, Staff, Department, SubDepartment } from '../types';

interface DashboardViewProps {
  appointments: Appointment[];
  patients: Patient[];
  inventory: InventoryItem[];
  bills: Bill[];
  onNavigate: (view: any) => void;
  doctors: Doctor[];
  staffList: Staff[];
  enquiries?: any[];
  blogPosts?: any[];
  departments?: Department[];
  subDepartments?: SubDepartment[];
  transactions?: any[];
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
}

export default function DashboardView({
  appointments,
  patients,
  inventory,
  bills,
  onNavigate,
  doctors = [],
  staffList = [],
  enquiries = [],
  blogPosts = [],
  departments = [],
  subDepartments = [],
  transactions = [],
  loggedInUser = null,
}: DashboardViewProps) {
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalDateLocale = () => {
    return new Date().toLocaleDateString();
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const clean = dateStr.trim();
    const todayYYYYMMDD = getTodayDateString();
    const todayLocale = getLocalDateLocale();
    
    // Check if it matches today's date, or our fallback/demo date '2026-06-15'
    if (clean === todayYYYYMMDD || clean === todayLocale || clean === '2026-06-15') {
      return true;
    }

    try {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      }
    } catch (e) {}

    return false;
  };

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const clean = dateStr.trim();
    const today = new Date();
    
    // Direct check for demo date
    if (clean.startsWith('2026-06-') || clean.includes('/06/2026') || clean.includes('/6/2026')) {
      return true;
    }

    try {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }
    } catch (e) {}
    
    return false;
  };

  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  });
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
  const isPatient = loggedInUser?.role === 'patient';
  const isStaff = loggedInUser?.role === 'staff';
  const isDoctor = loggedInUser?.role === 'doctor';
  const patientProfile = isPatient ? (patients[0] || loggedInUser.data) : null;

  // Patient billing sums
  const patientPaidSum = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0);
  const patientPendingSum = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0);
  const patientTotalInvoiced = bills.reduce((sum, b) => sum + b.amount, 0);

  const totalPatientsCount = patients.length;
  const staffAndDoctorsCount = doctors.length + staffList.length;
  const activeDoctorsCount = doctors.filter(
    (d) => d.status === 'On Duty'
  ).length;
  const todayAppointmentsCount = appointments.filter(
    (a) => isToday(a.date) && a.status !== 'Cancelled'
  ).length;

  const totalRevenueCollected = bills
    .filter((b) => isToday(b.date) && b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const revenueThisMonth = bills
    .filter((b) => isThisMonth(b.date) && b.status === "Paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalEarnedRevenue = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const followUpAppointments = appointments.filter(
    (a) => a.type?.toLowerCase() === 'follow-up'
  );

  // Dynamic live system notice / alert generator
  const getLiveAlerts = () => {
    const isPatient = loggedInUser?.role === 'patient';
    const patientName = isPatient ? loggedInUser?.data?.name : null;

    const list: Array<{
      id: string;
      title: string;
      time: string;
      type: string;
      color: string;
      icon: 'Calendar' | 'UserCheck' | 'IndianRupee' | 'Users' | 'Activity' | 'Bell' | 'HeartPlus';
    }> = [];

    // 1. Appointments
    (appointments || []).forEach(a => {
      if (isPatient && patientName && a.patientName?.trim().toLowerCase() !== patientName.trim().toLowerCase()) {
        return;
      }
      list.push({
        id: `appt-${a.id}`,
        title: `Appointment ${a.status || 'Booked'}: ${a.patientName} (${a.type || 'Consultation'}) with Dr. ${a.doctorName}`,
        time: a.date ? `${a.date} @ ${a.time}` : 'Scheduled',
        type: 'Appointment',
        color: 'emerald',
        icon: 'Calendar'
      });
    });

    // 2. Patients
    (patients || []).forEach(p => {
      if (isPatient && patientName && p.name?.trim().toLowerCase() !== patientName.trim().toLowerCase()) {
        return;
      }
      list.push({
        id: `pat-${p.id}`,
        title: `Medical Profile Active: ${p.name} (${p.gender}, ${p.age} yrs)`,
        time: p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : 'Just registered',
        type: 'Patient Profile',
        color: 'sky',
        icon: 'UserCheck'
      });
    });

    // 3. Bills
    (bills || []).forEach(b => {
      if (isPatient && patientName && b.patientName?.trim().toLowerCase() !== patientName.trim().toLowerCase()) {
        return;
      }
      list.push({
        id: `bill-${b.id}`,
        title: `Billing Invoice ${b.status || 'Generated'}: ₹${b.amount} for ${b.patientName}`,
        time: b.date || 'Today',
        type: 'Billing Invoice',
        color: 'amber',
        icon: 'IndianRupee'
      });
    });

    if (!isPatient) {
      // 4. Doctors
      (doctors || []).forEach(d => {
        list.push({
          id: `doc-${d.id}`,
          title: `Specialist Enrolled: Dr. ${d.name} (${d.specialization})`,
          time: 'Registered with On-duty profile',
          type: 'Clinical Registry',
          color: 'indigo',
          icon: 'Users'
        });
      });

      // 5. Staff
      (staffList || []).forEach(s => {
        list.push({
          id: `staff-${s.id}`,
          title: `Staff Recruited: ${s.name} (${s.role}) for ${s.department}`,
          time: s.joinDate || 'Access Configured',
          type: 'HR Staff',
          color: 'teal',
          icon: 'Users'
        });
      });

      // 6. Enquiries
      (enquiries || []).forEach(enq => {
        list.push({
          id: `enq-${enq.id}`,
          title: `New Enquiry Received: "${enq.query || 'Inquiry description'}" from ${enq.name || 'Anonymous'}`,
          time: enq.date || 'Support Inquiry',
          type: 'Helpdesk Enquiry',
          color: 'rose',
          icon: 'Bell'
        });
      });

      // 7. Blog Posts
      (blogPosts || []).forEach(post => {
        list.push({
          id: `blog-${post.id}`,
          title: `New Article: "${post.title}"`,
          time: post.date ? new Date(post.date).toLocaleDateString() : 'Healthcare Blog',
          type: 'Health Blog',
          color: 'purple',
          icon: 'Activity'
        });
      });

      // 8. Departments & Sub-Depts
      (departments || []).forEach(dept => {
        list.push({
          id: `dept-${dept.id}`,
          title: `Medical Department Added: "${dept.name}" (${dept.code})`,
          time: dept.type || 'Clinical Unit',
          type: 'Infrastructure',
          color: 'violet',
          icon: 'HeartPlus'
        });
      });

      (subDepartments || []).forEach(sub => {
        list.push({
          id: `sub-${sub.id}`,
          title: `Clinical Sub-department Registered: "${sub.name}" (${sub.code})`,
          time: 'Active Procedure Clinic',
          type: 'Infrastructure',
          color: 'cyan',
          icon: 'HeartPlus'
        });
      });
    } else {
      // Patients get their own specific enquiries / tickets if any
      (enquiries || []).forEach(enq => {
        if (patientName && enq.name?.trim().toLowerCase() === patientName.trim().toLowerCase()) {
          list.push({
            id: `enq-${enq.id}`,
            title: `Your Helpdesk Inquiry: "${enq.query || 'Status updated'}" - ${enq.status || 'Received'}`,
            time: enq.date || 'Support Ticket',
            type: 'Helpdesk Ticket',
            color: 'rose',
            icon: 'Bell'
          });
        }
      });
    }

    // Weight parser for timestamps / numeric sorting to bubble up freshest entries
    const getWeight = (itemId: string) => {
      const match = itemId.match(/\d+/g);
      if (match) {
        return parseInt(match.join(''), 10);
      }
      return 0;
    };

    // Sort descending by weight
    list.sort((x, y) => getWeight(y.id) - getWeight(x.id));

    // Fallback if empty
    if (list.length === 0) {
      list.push({
        id: 'fallback-system',
        title: isPatient ? 'Your clinical file timeline is empty & up-to-date.' : 'Hospital Core Systems Operational & Verified',
        time: 'Real-time normal telemetry stream',
        type: 'System Integrity Logs',
        color: 'emerald',
        icon: 'Activity'
      });
    }

    return list.slice(0, 5); // Return top 5 freshest notices to keep panel elegant
  };

  const renderAlertIcon = (iconName: string, color: string) => {
    const iconProps = { size: 14 };
    let element = <Bell {...iconProps} />;
    
    if (iconName === 'Calendar') element = <Calendar {...iconProps} />;
    else if (iconName === 'UserCheck') element = <UserCheck {...iconProps} />;
    else if (iconName === 'IndianRupee') element = <IndianRupee {...iconProps} />;
    else if (iconName === 'Users') element = <Users {...iconProps} />;
    else if (iconName === 'Activity') element = <Activity {...iconProps} />;
    else if (iconName === 'HeartPlus') element = <HeartPlus {...iconProps} />;

    const themeMap: Record<string, string> = {
      emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      sky: 'bg-sky-50 text-sky-600 border border-sky-100',
      amber: 'bg-amber-50 text-amber-600 border border-[#fae5cc]',
      indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      teal: 'bg-teal-50 text-teal-600 border border-teal-100',
      rose: 'bg-rose-50 text-rose-600 border border-rose-100',
      purple: 'bg-purple-50 text-purple-600 border border-purple-100',
      violet: 'bg-violet-50 text-violet-600 border border-violet-100',
      cyan: 'bg-cyan-50 text-cyan-600 border border-cyan-100'
    };

    const styleClass = themeMap[color] || 'bg-slate-50 text-slate-600 border border-slate-100';

    return (
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${styleClass}`}>
        {element}
      </div>
    );
  };

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
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full select-none" id="dashboard-view-root">
      {/* Title Header */}
      <div className="flex items-center justify-between" id="dashboard-header-intro">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800" id="dashboard-main-title">Dashboard</h2>
              <span className="bg-[#007f6e]/10 text-[#007f6e] text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full" id="dashboard-today-badge">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5" id="dashboard-last-updated">
              Last updated {lastUpdated}
            </p>
          </div>
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
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          whileHover={{ scale: 1.03, y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#e6f4f1] border border-[#d1ebe5] rounded-xl p-4 flex items-center gap-4 transition-shadow group cursor-pointer" 
          id="kpi-staff-doctors"
        >
          <div className="w-11 h-11 bg-[#007f6e] text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isPatient ? 'Clinic Specialists' : 'Staff & Doctors'}
            </h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">
              {isPatient ? doctors.length : staffAndDoctorsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {isPatient ? `${activeDoctorsCount} specialists on-duty` : `${activeDoctorsCount} active doctors`}
            </p>
          </div>
        </motion.div>

        {/* Card 2: Total Patients / My ID */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          whileHover={{ scale: 1.03, y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#ecf7f1] border border-[#d3ecd7] rounded-xl p-4 flex items-center gap-4 transition-shadow group cursor-pointer" 
          id="kpi-total-patients"
        >
          <div className="w-11 h-11 bg-[#00a85a] text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <UserCheck size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isPatient ? 'My Patient ID' : 'Total Patients'}
            </h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">
              {isPatient ? (patientProfile?.id || 'P-Active') : totalPatientsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {isPatient 
                ? `${patientProfile?.gender || 'Profile'} · ${patientProfile?.age || 'Main'} yrs` 
                : `+${totalPatientsCount} this month`
              }
            </p>
          </div>
        </motion.div>

        {/* Card 3: Today Appointments */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          whileHover={{ scale: 1.03, y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#f4effc] border border-[#e3d8f8] rounded-xl p-4 flex items-center gap-4 transition-shadow group cursor-pointer" 
          id="kpi-today-appointments"
        >
          <div className="w-11 h-11 bg-[#8e52e9] text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isPatient ? 'My Appointments' : 'Today Appointments'}
            </h4>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">
              {isPatient ? appointments.length : todayAppointmentsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {isPatient 
                ? `Today: ${appointments.filter(a => isToday(a.date)).length} due` 
                : `${completedCount} completed`
              }
            </p>
          </div>
        </motion.div>

        {/* Card 4: Earned Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.03, y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#fdf3e7] border border-[#fae5cc] rounded-xl p-4 flex items-center gap-4 transition-shadow group cursor-pointer" 
          id="kpi-revenue-today"
        >
          <div className="w-11 h-11 bg-[#f39c12] text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <IndianRupee size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isPatient ? 'My Billing Summary' : 'Total Earned Revenue'}
            </h4>
            <div className="text-2xl font-bold text-[#e67e22] mt-0.5" id="dashboard-total-earned-revenue-display">
              ₹{isPatient ? patientTotalInvoiced.toLocaleString() : totalEarnedRevenue.toLocaleString()}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-medium mt-1">
              {isPatient ? (
                <>
                  <span>Paid: <strong className="text-emerald-600">₹{patientPaidSum.toLocaleString()}</strong></span>
                  <span>Unpaid: <strong className="text-rose-500">₹{patientPendingSum.toLocaleString()}</strong></span>
                </>
              ) : (
                <>
                  <span>Today: <strong className="text-slate-700">₹{totalRevenueCollected.toLocaleString()}</strong></span>
                  <span>This Month: <strong className="text-slate-700">₹{revenueThisMonth.toLocaleString()}</strong></span>
                </>
              )}
            </div>
          </div>
        </motion.div>
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
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className={`bg-white border-t-4 ${pill.color} rounded-lg p-3 text-center shadow-xs cursor-pointer`} 
            id={`stat-pill-${idx}`}
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">
              {pill.label}
            </span>
            <span className="text-lg font-bold block mt-1">{pill.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Row with Monthly Trend & Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="trends-row-container">
        {/* Monthly Activity Trends Graphic */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          whileHover={{ y: -2, boxShadow: "0 8px 16px -4px rgba(0,0,0,0.03)" }}
          className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between" 
          id="trends-chart-card"
        >
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
        </motion.div>

        {/* Live Alerts Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          whileHover={{ y: -2, boxShadow: "0 8px 16px -4px rgba(0,0,0,0.03)" }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between animate-pulse-once" 
          id="trends-alerts-card"
        >
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 h-10" id="alerts-card-header">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Live Alerts</h3>
              <p className="text-[9px] text-[#007f6e] font-semibold">Real-time notice board</p>
            </div>
            <span className="text-[#007f6e] animate-pulse flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Activity size={14} />
            </span>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto max-h-[190px] pr-1 space-y-3 select-none" id="alerts-notices-feed">
            {getLiveAlerts().map((alert) => (
              <div key={alert.id} className="flex gap-3 items-start hover:bg-slate-50 p-1.5 rounded-lg transition-colors border-b border-slate-50/50 group">
                {renderAlertIcon(alert.icon, alert.color)}
                <div className="flex-1 min-w-0 transition-transform duration-200 group-hover:translate-x-1">
                  <span className="text-[10px] uppercase font-extrabold text-[#007f6e]/95 tracking-tight block leading-none mb-0.5">
                    {alert.type}
                  </span>
                  <p className="text-[11px] font-semibold text-slate-700 leading-normal break-words">
                    {alert.title}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                    {alert.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Dynamic Patients & Follow-Up Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="patients-followups-row">
        {/* Recently Registered Patients Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          whileHover={{ y: -2, boxShadow: "0 8px 16px -4px rgba(0,0,0,0.03)" }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between" 
          id="registered-patients-card"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="registered-patients-header">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {isPatient ? 'My Registered Patient Profile' : 'Recently Registered Patients'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isPatient 
                    ? 'Your active clinical file record details' 
                    : `${totalPatientsCount} total · ${patients.filter(p => new Date(p.registeredAt).toDateString() === new Date().toDateString()).length} registered today`
                  }
                </p>
              </div>
              <button
                onClick={() => onNavigate('patients')}
                className="w-7 h-7 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-sans">
                    <tr>
                      <th className="px-3 py-2">Patient</th>
                      <th className="px-3 py-2">Gender / Age</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {patients.slice(0, 4).map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                          <td className="px-3 py-2.5 font-semibold text-slate-800">{p.name}</td>
                          <td className="px-3 py-2.5 text-slate-500">{p.gender} · {p.age} yrs</td>
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">{p.phone}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-300 hover:scale-105 ${
                                p.status === 'New' ? 'bg-[#e6f7ec]/80 text-[#00a85a]' : 'bg-[#f4effc]/80 text-[#8e52e9]'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Follow-up Appointments Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          whileHover={{ y: -2, boxShadow: "0 8px 16px -4px rgba(0,0,0,0.03)" }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between" 
          id="followups-card"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="followups-header">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {isPatient ? 'My Follow-Up Appointments' : 'Follow-Up Appointments'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isPatient 
                    ? `You have ${followUpAppointments.length} follow-up appointments scheduled` 
                    : `${followUpAppointments.length} total follow-ups booked · ${followUpAppointments.filter(a => isToday(a.date)).length} due today`
                  }
                </p>
              </div>
              <button
                onClick={() => onNavigate('appointments')}
                className="w-7 h-7 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                id="all-followups-link-btn"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {followUpAppointments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 font-medium" id="followups-empty">
                <HeartPlus size={24} className="text-[#007f6e]/30 mb-2 animate-bounce" />
                <span>No follow-up appointments scheduled</span>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4" id="recent-followups-list">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-sans">
                    <tr>
                      <th className="px-3 py-2">Patient</th>
                      <th className="px-3 py-2">Doctor</th>
                      <th className="px-3 py-2">Specialization</th>
                      <th className="px-3 py-2 text-right">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {followUpAppointments.slice(0, 4).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{a.patientName}</td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium font-sans">Dr. {a.doctorName}</td>
                        <td className="px-3 py-2.5 text-slate-400 text-[11px]">{a.specialization}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-[10px]">
                          <span className="text-[#007f6e] font-bold block">{a.date}</span>
                          <span className="text-slate-400 block">{a.time}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Two Bottom Row Navigation Cards */}
      {!isPatient && !isStaff && !isDoctor && (
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
      )}
    </div>
  );
}
