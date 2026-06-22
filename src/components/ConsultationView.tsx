import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  Stethoscope, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Activity, 
  XCircle, 
  Plus, 
  User, 
  Compass, 
  Phone, 
  Mail, 
  Hash, 
  FileText,
  Edit3,
  Download,
  X,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { Appointment, Doctor, Department, Patient } from '../types';

interface ConsultationViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments?: Department[];
  patients?: Patient[];
  onAddPatient?: (patient: Omit<Patient, 'id' | 'registeredAt'> & { id?: string }) => void;
  onAddAppointment: (appt: Omit<Appointment, 'id' | 'status'>) => void;
  onUpdateAppointment?: (id: string, fields: Partial<Appointment>) => void;
  onDeleteAppointment?: (id: string) => void;
  onRefresh: () => void;
  onOpenBooking: () => void;
  isReadOnly?: boolean;
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
  onNavigate?: (view: any) => void;
}

export default function ConsultationView({
  appointments = [],
  doctors = [],
  departments = [],
  patients = [],
  onAddPatient,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onRefresh,
  onOpenBooking,
  isReadOnly = false,
  loggedInUser = null,
  onNavigate,
}: ConsultationViewProps) {
  // Helper to parse date string into local timezone Date safely without shifts
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    const slashParts = dateStr.split('/');
    if (slashParts.length === 3) {
      return new Date(parseInt(slashParts[2]), parseInt(slashParts[1]) - 1, parseInt(slashParts[0]));
    }
    return new Date(dateStr);
  };

  // Today's hardcoded date matching application state
  const TODAY_DATE_STR = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const TODAY = parseLocalDate(TODAY_DATE_STR);

  const [currentDate, setCurrentDate] = useState<Date>(parseLocalDate(TODAY_DATE_STR));
  const [showAllDates, setShowAllDates] = useState(true);
  
  const isPatient = loggedInUser?.role === 'patient';
  const patientProfileName = isPatient ? loggedInUser?.data?.name : null;
  
  // Filter states
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedDoc, setSelectedDoc] = useState('All Doctors');
  const [selectedType, setSelectedType] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Interactivity States
  const [viewingAppt, setViewingAppt] = useState<Appointment | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [deletingID, setDeletingID] = useState<string | null>(null);

  // Edit fields temporary states
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled'>('Scheduled');
  const [editType, setEditType] = useState<'Regular' | 'Follow-up'>('Regular');
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');

  // Date Formatting Helpers
  const formatFullDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatSlashDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateIso = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const matchDate = (appointmentDateStr: string, targetDate: Date) => {
    if (!appointmentDateStr) return false;
    const targetYear = targetDate.getFullYear();
    const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
    const targetDay = String(targetDate.getDate()).padStart(2, '0');
    
    const targetIso = `${targetYear}-${targetMonth}-${targetDay}`;
    const targetSlash = `${targetDay}/${targetMonth}/${targetYear}`;
    
    const clean = appointmentDateStr.trim();
    return clean === targetIso || clean === targetSlash || clean.replace(/\//g, '-') === targetIso;
  };

  // Check if chosen date is "Today"
  const isTodaySelected = currentDate.toDateString() === TODAY.toDateString();

  // Date controls
  const handlePrevDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };

  const handleGoToToday = () => {
    setCurrentDate(parseLocalDate(TODAY_DATE_STR));
  };

  // Get unique departments from added database departments and active doctor specializations
  const uniqueDepartments = Array.from(new Set([
    ...departments.map(d => d.name),
    ...doctors.map(d => d.specialization)
  ])).filter(Boolean);

  // Compute live card counts for the selected date or all dates (Only includes active 'new' appointments: Scheduled & Confirmed)
  const selectedActiveAppts = (isPatient
    ? appointments.filter(a => isPatient && patientProfileName && a.patientName?.trim().toLowerCase() === patientProfileName.trim().toLowerCase())
    : (showAllDates 
      ? appointments 
      : appointments.filter(a => matchDate(a.date, currentDate))
    )
  ).filter(a => a.status === 'Scheduled' || a.status === 'Confirmed');
  
  const activeConsultationsCount = selectedActiveAppts.length;
  const remainingCount = selectedActiveAppts.filter(a => a.status === 'Scheduled').length; // Scheduled = Remaining
  const inProgressCount = selectedActiveAppts.filter(a => a.status === 'Confirmed').length; // Confirmed = In Progress

  // Filtered Appointments list to display in table (Only showing new active consultations, excluding completed/cancelled ones)
  const filteredAppointments = appointments.filter((a) => {
    // If patient is logged in, strictly enforce they can only see themselves
    if (isPatient && patientProfileName && a.patientName?.trim().toLowerCase() !== patientProfileName.trim().toLowerCase()) {
      return false;
    }

    // "consultation ma jo new ho es ke only new he show ho old wal ni"
    if (a.status === 'Completed' || a.status === 'Cancelled') return false;

    // Must match current selected date (ignored for patients so all dates are visible)
    if (!isPatient && !showAllDates && !matchDate(a.date, currentDate)) return false;

    // Search filter
    const matchSearch =
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.specialization.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDept = selectedDept === 'All Departments' || a.specialization === selectedDept;
    const matchDoc = selectedDoc === 'All Doctors' || a.doctorName === selectedDoc;
    
    let matchType = true;
    if (selectedType !== 'All Types') {
      if (selectedType === 'Regular') {
        matchType = a.type === 'Regular' || !a.type;
      } else if (selectedType === 'Follow-up') {
        matchType = a.type === 'Follow-up';
      } else {
        matchType = a.status === selectedType;
      }
    }

    return matchSearch && matchDept && matchDoc && matchType;
  });

  // Action: Open Edit modal
  const handleOpenEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    
    // Convert current appointment's date to ISO if needed
    let parsedIso = appt.date;
    if (appt.date.includes('/')) {
      const p = appt.date.split('/');
      if (p.length === 3) {
        // dd/mm/yyyy -> yyyy-mm-dd
         parsedIso = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      }
    }
    setEditDate(parsedIso);
    setEditTime(appt.time || '');
    setEditStatus(appt.status || 'Scheduled');
    setEditType(appt.type || 'Regular');
    setEditDoctorName(appt.doctorName || '');
    setEditSpecialization(appt.specialization || '');
  };

  // Action: Save Edit modal
  const handleSaveEdit = () => {
    if (!editingAppt || !onUpdateAppointment) return;
    
    onUpdateAppointment(editingAppt.id, {
      date: editDate,
      time: editTime,
      status: editStatus,
      type: editType,
      doctorName: editDoctorName,
      specialization: editSpecialization
    });

    setEditingAppt(null);
    onRefresh();
  };

  // Action: Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingID || !onDeleteAppointment) return;
    onDeleteAppointment(deletingID);
    setDeletingID(null);
    onRefresh();
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="consultation-view">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="consultation-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="consult-title">Patient Consultation</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and consult patients across all departments</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap animate-fade-in">
          {onNavigate && (
            <button
              onClick={() => onNavigate('consultation-ai')}
              type="button"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#007f6e] hover:from-emerald-700 hover:to-[#006657] text-[#ffffff] px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
              id="trigger-consultation-ai"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>Consultation AI</span>
            </button>
          )}
          <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-3 py-1.5 rounded-lg font-semibold shadow-xs" id="consult-date-badge">
            Today: {TODAY.getDate()} {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][TODAY.getMonth()]} {TODAY.getFullYear()}
          </div>
        </div>
      </div>

      {/* KPI 3 Cards Row (Active / Now only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none" id="consult-kpi">
        {/* Total Active Consultations */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-xl flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Consultations</span>
            <span className="text-2xl font-extrabold text-slate-800 block leading-none">{activeConsultationsCount}</span>
          </div>
        </div>

        {/* Remaining (Scheduled) */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Scheduled (Remaining)</span>
            <span className="text-2xl font-extrabold text-slate-800 block leading-none">{remainingCount}</span>
          </div>
        </div>

        {/* In Progress (Confirmed) */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-xs transition-shadow hover:shadow-sm mr-0">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">In Progress (Confirmed)</span>
            <span className="text-2xl font-extrabold text-slate-800 block leading-none">{inProgressCount}</span>
          </div>
        </div>
      </div>

      {/* Primary Container Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="consult-main-card">
        {/* Pagination subheader bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-white" id="main-pagination-bar">
          <div className="flex items-center gap-4">
            {/* Prev arrow button */}
            <button 
              onClick={handlePrevDay}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Flexible human-readable Title & Date subtitle */}
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
                {isTodaySelected ? "Today's Appointments" : "Appointments"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {formatFullDate(currentDate)}
              </p>
            </div>

            {/* Next arrow button */}
            <button 
              onClick={handleNextDay}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>

            {/* CONDITIONAL TODAY BUTTON (Only rendered if NOT on Today) */}
            {!isTodaySelected && (
              <button
                onClick={handleGoToToday}
                className="bg-emerald-50/70 hover:bg-emerald-50 text-[#007f6e] border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-all"
                title="Go to Today"
              >
                Today
              </button>
            )}

            {/* Custom interactive datepicker box */}
            <div className="relative flex items-center gap-2 border border-slate-200 hover:border-slate-350 focus-within:border-[#007f6e] rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 font-semibold cursor-pointer">
              <input
                type="date"
                value={formatDateIso(currentDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(parseLocalDate(e.target.value));
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <span className="font-semibold text-slate-700 select-none mr-1">{formatSlashDate(currentDate)}</span>
              <Calendar size={13} className="text-slate-400 pointer-events-none" />
            </div>

            {/* Show All Dates Checkbox Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 ml-2">
              <input
                type="checkbox"
                checked={showAllDates}
                onChange={(e) => setShowAllDates(e.target.checked)}
                className="rounded border-slate-300 text-[#007f6e] focus:ring-[#007f6e] w-3.5 h-3.5 cursor-pointer"
              />
              <span>Show All Dates</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 border border-emerald-100 bg-emerald-50/20 rounded-lg px-3.5 py-2 text-xs font-semibold text-[#007f6e] hover:bg-emerald-50 transition-colors"
            >
              <RefreshCw size={12} className="text-[#007f6e]" />
              <span className="text-[#007f6e]">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Department Dropdown (Only dynamic departments from database) */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:border-[#007f6e] cursor-pointer"
            >
              <option value="All Departments">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Doctor Dropdown */}
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-[#007f6e]"
            >
              <option value="All Doctors">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Type & Status Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-[#007f6e]"
            >
              <option value="All Types">All Types / Statuses</option>
              {/* Type Category */}
              <option value="Regular">Regular Only</option>
              <option value="Follow-up">Follow-up Only</option>
              {/* Status categories */}
              <option value="Scheduled">Scheduled (Remaining)</option>
              <option value="Confirmed">Confirmed (In Progress)</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Search bar input with search icon */}
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search patient, doctor, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-250 rounded-lg focus:outline-none focus:border-[#007f6e] placeholder-slate-400 text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Body content Table or Illustration */}
        {filteredAppointments.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3 bg-white" id="empty-stethoscope">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Stethoscope size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No appointments found</p>
              <p className="text-xs text-slate-400 mt-0.5">No appointments scheduled for this date.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 select-none">
                <tr>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Specialization</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{a.patientName}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{a.doctorName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-[#e6f4f1] text-[#007f6e] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {a.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.type === 'Follow-up' ? (
                        <span className="bg-purple-50 text-purple-600 border border-purple-100/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Follow-up
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-medium">{a.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        a.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                        a.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                        a.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {a.status === 'Completed' ? 'Completed' :
                         a.status === 'Confirmed' ? 'In Progress' :
                         a.status === 'Cancelled' ? 'Cancelled' : 
                         a.status === 'Overdue' ? 'Overdue' : 'Remaining'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => setViewingAppt(a)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {(!isReadOnly || isPatient || loggedInUser?.role === 'staff') && (
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 text-slate-400 hover:text-[#007f6e] hover:bg-emerald-50/50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {!isReadOnly && (
                          <button
                            onClick={() => setDeletingID(a.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Action"
                          >
                            <Trash2 size={14} />
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

      {/* VIEW DETAILS DIALOG MODAL */}
      {viewingAppt && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/60 backdrop-blur-xs flex items-center justify-center p-4" id="consultation-view-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Gradient Banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#115e59] text-white p-6 relative">
              <button
                onClick={() => setViewingAppt(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
              >
                <X size={15} />
              </button>
              
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs">
                  {viewingAppt.patientName.trim().charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="text-md md:text-lg font-bold">{viewingAppt.patientName}</h2>
                  <span className="text-emerald-100 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 inline-block mt-1">
                    Specialist: {viewingAppt.doctorName}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Contents */}
            <div className="p-6 space-y-5 max-h-[30rem] overflow-y-auto">
              {/* Row 1: Basic Appt Coordinates */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Schedule & Slot Parameters</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Specialty Field</span>
                    <span className="text-[#007f6e] mt-0.5 block font-bold">{viewingAppt.specialization}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Appointment Date</span>
                    <span className="text-slate-800 mt-0.5 block font-mono font-bold">{viewingAppt.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Assigned Slot</span>
                    <span className="text-slate-800 mt-0.5 block font-mono">{viewingAppt.time}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Consult Type</span>
                    <span className="text-slate-850 mt-0.5 block font-semibold">{viewingAppt.type || 'Regular / General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Case Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                      viewingAppt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      viewingAppt.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600' : 
                      viewingAppt.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 
                      viewingAppt.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {viewingAppt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Demographic parameters */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Patient Credentials</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Contact Phone</span>
                    <span className="text-slate-850 mt-0.5 block font-mono">{viewingAppt.patientPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Email Address</span>
                    <span className="text-slate-850 mt-0.5 block break-all">{viewingAppt.patientEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Demographics</span>
                    <span className="text-slate-850 mt-0.5 block">Age: {viewingAppt.age || 'N/A'} | {viewingAppt.patientGender || 'Unspecified'}</span>
                  </div>
                </div>

                {/* Patient Database Registry integration status & trigger */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-[#007f6e] block tracking-wider">🧬 Registry Integration</span>
                    <p className="text-[10px] text-slate-400">Synchronize this consultation's details with clinical databases.</p>
                  </div>
                  <div>
                    {(() => {
                      const isRegistered = (patients || []).some(p => 
                        p.name.toLowerCase().trim() === viewingAppt.patientName.toLowerCase().trim() ||
                        (viewingAppt.patientPhone && p.phone && p.phone.trim().replace(/[\s-+()]/g, '') === viewingAppt.patientPhone.trim().replace(/[\s-+()]/g, ''))
                      );
                      if (isRegistered) {
                        return (
                          <span className="text-[10px] font-bold text-[#007f6e] bg-[#e6f4f1] px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-emerald-200 select-none">
                            <CheckCircle2 size={12} /> Registry Active
                          </span>
                        );
                      }
                      return (
                        <button
                          onClick={() => {
                            if (onAddPatient) {
                              onAddPatient({
                                name: viewingAppt.patientName,
                                age: viewingAppt.age || 30,
                                gender: viewingAppt.patientGender || 'Male',
                                phone: viewingAppt.patientPhone || '',
                                email: viewingAppt.patientEmail || '',
                                dob: '',
                                status: viewingAppt.type === 'Follow-up' ? 'Follow-up' : 'New',
                                bloodGroup: '',
                                address: ''
                              });
                            }
                          }}
                          className="text-[10px] font-black uppercase text-white bg-[#007f6e] hover:bg-[#006657] px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <UserPlus size={12} /> Add to Patients Directory
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(!isReadOnly || loggedInUser?.role === 'staff') && (
                  <button
                    onClick={() => {
                      setEditingAppt(viewingAppt);
                      setViewingAppt(null);
                    }}
                    className="bg-[#e6f4f1] hover:bg-[#d5eeea] text-[#007f6e] border border-emerald-500/10 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete appointment clinical log for ${viewingAppt.patientName}?`)) {
                        if (onDeleteAppointment) onDeleteAppointment(viewingAppt.id);
                        setViewingAppt(null);
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                )}
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
                  onClick={() => setViewingAppt(null)}
                  className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG - Restricted Fields Edit */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs select-none p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Edit Appt: {editingAppt.patientName}</h3>
              </div>
              <button 
                onClick={() => setEditingAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-white hover:bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center border border-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Form Inputs */}
            <div className="p-6 space-y-4">
              {isPatient ? (
                <div className="space-y-4">
                  <div className="bg-[#f0f9f6]/80 border border-emerald-150 p-3 rounded-xl flex items-start gap-1">
                    <p className="text-[10px] text-emerald-800 leading-normal font-semibold">
                      Please customize your assigned practitioner, appointment date, or booking time slot below.
                    </p>
                  </div>

                  {/* Select Doctor */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#007f6e] uppercase tracking-widest mb-1.5">
                      Select Doctor *
                    </label>
                    <select
                      value={editDoctorName}
                      onChange={(e) => {
                        const dName = e.target.value;
                        setEditDoctorName(dName);
                        const matched = doctors.find(doc => doc.name === dName);
                        if (matched) {
                          setEditSpecialization(matched.specialization);
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-[#007f6e] font-semibold"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#007f6e] uppercase tracking-widest mb-1.5">
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-[#007f6e] font-sans"
                    />
                  </div>

                  {/* Schedule Time */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#007f6e] uppercase tracking-widest mb-1.5">
                      Time Slot *
                    </label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-[#007f6e] font-sans"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-[#f0f9f6]/80 border border-emerald-150 p-3 rounded-xl flex items-start gap-2 mb-2">
                    <Stethoscope size={15} className="text-[#007f6e] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      <strong>Consultation Mode:</strong> Only appointment status can be modified here. Clinical details, date, and doctor slots are preserved to prevent changes to medical records.
                    </p>
                  </div>

                  {/* Consultation Info (Read-Only) */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-slate-100/60 pb-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Patient Name</span>
                      <span className="font-semibold text-slate-800 capitalize">{editingAppt.patientName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/60 pb-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Assigned Specialist</span>
                      <span className="font-semibold text-slate-700">{editingAppt.doctorName} ({editingAppt.specialization})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/60 pb-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Original Date</span>
                      <span className="font-mono font-bold text-slate-700">{editingAppt.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/60 pb-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Scheduled Time</span>
                      <span className="font-mono text-slate-700">{editingAppt.time || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Appointment Type</span>
                      <span className="font-semibold text-slate-705 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{editingAppt.type || 'Regular / General'}</span>
                    </div>
                  </div>

                  {/* Status Select dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#007f6e] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <span>Modify Status State *</span>
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border-2 border-[#007f6e] text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold cursor-pointer shadow-xs"
                    >
                      <option value="Scheduled">Scheduled (Remaining)</option>
                      <option value="Confirmed">Confirmed (In Progress)</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE DIALOG OVERLAY */}
      {deletingID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs select-none p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Confirm Deletion</h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Are you absolutely sure you want to remove this appointment record? This command cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => setDeletingID(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Keep Record
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
