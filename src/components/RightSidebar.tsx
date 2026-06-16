import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Stethoscope, AlertCircle } from 'lucide-react';
import { Appointment, Patient, InventoryItem, Doctor, Bill } from '../types';

interface RightSidebarProps {
  appointments: Appointment[];
  patients: Patient[];
  inventory: InventoryItem[];
  doctors: Doctor[];
  bills: Bill[];
}

export default function RightSidebar({ appointments, patients, inventory, doctors, bills }: RightSidebarProps) {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(5); // June is index 5
  const [selectedDay, setSelectedDay] = useState<number>(15);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getStartDayOffset = (year: number, monthIndex: number) => {
    const day = new Date(year, monthIndex, 1).getDay();
    return (day + 6) % 7;
  };

  const totalDays = getDaysInMonth(currentYear, currentMonthIndex);
  const startDayOffset = getStartDayOffset(currentYear, currentMonthIndex);

  useEffect(() => {
    if (selectedDay > totalDays) {
      setSelectedDay(totalDays);
    }
  }, [currentMonthIndex, currentYear, totalDays]);

  const prevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  // Date parsing matcher for currently selected month + day
  const isSelectedDay = (dateStr: string, dayNum: number) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.getDate() === dayNum && d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
      }
    } catch {
      // string matching fallback
    }
    const cleanStr = dateStr.trim();
    // format like YYYY-MM-DD
    const expectedMonthStr = String(currentMonthIndex + 1).padStart(2, '0');
    const expectedDayStr = String(dayNum).padStart(2, '0');
    if (cleanStr.includes(`${currentYear}-${expectedMonthStr}-${expectedDayStr}`)) {
      return true;
    }
    return false;
  };

  // Quick stats computed live for selected day
  const lowStockCount = inventory.filter(item => item.stock <= item.minStock).length;

  const newPatientsToday = patients.filter(
    (p) => p.status === 'New' && isSelectedDay(p.registeredAt, selectedDay)
  ).length;

  const followUpsToday = patients.filter(
    (p) => p.status === 'Follow-up' && isSelectedDay(p.registeredAt, selectedDay)
  ).length;

  // Let's compute doctors on duty as those having appointment duties scheduled on the selected day
  const appointmentsForDay = appointments.filter(
    a => isSelectedDay(a.date, selectedDay) && a.status !== 'Cancelled'
  );

  const uniqueDoctorsOnDuty = Array.from(new Set(appointmentsForDay.map(a => a.doctorName)));
  const doctorsOnDutyCount = uniqueDoctorsOnDuty.length;

  // Compute Revenue dynamically from Paid invoices on selected day
  const dailyPaidRevenue = bills
    .filter((b) => b.status === 'Paid' && isSelectedDay(b.date, selectedDay))
    .reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <aside className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto h-screen select-none" id="right-sidebar">
      {/* Date & Calendar */}
      <div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider" id="date-label">
          Hospital Calendar
        </span>
        <div className="flex items-center justify-between mt-1 mb-4" id="calendar-header">
          <h3 className="font-bold text-slate-800 text-sm" id="calendar-month-text">
            {monthNames[currentMonthIndex]} {selectedDay}, {currentYear}
          </h3>
          <div className="flex gap-1" id="calendar-actions">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 rounded-md transition-colors"
              id="calendar-prev-month-btn"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 rounded-md transition-colors"
              id="calendar-next-month-btn"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 text-center text-xs gap-y-2" id="calendar-grid">
          {/* Weekday headers */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <span key={idx} className="text-slate-400 font-medium pb-2 text-[10px]">
              {day}
            </span>
          ))}

          {/* Gaps for previous month days alignment */}
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <span key={`empty-${idx}`} className="w-7 h-7" />
          ))}

          {/* Monthly Days */}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-[#007f6e] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id={`calendar-day-${day}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctors on Duty */}
      <div className="border-t border-slate-50 pt-5">
        <div className="flex items-center justify-between mb-4" id="doctors-on-duty-header">
          <h4 className="text-xs font-bold text-slate-800">Doctors Active Today</h4>
          <span className="text-[11px] font-bold text-[#007f6e] bg-[#e6f4f1] px-2 py-0.5 rounded-full" id="doctors-on-duty-badge">
            {doctorsOnDutyCount}
          </span>
        </div>

        {doctorsOnDutyCount > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="doctors-on-duty-list">
            {uniqueDoctorsOnDuty.map((docName, idx) => {
              const appt = appointmentsForDay.find(a => a.doctorName === docName);
              const spec = appt ? appt.specialization : 'General Medicine';
              return (
                <div key={idx} className="flex items-center gap-3 p-2 bg-[#f4faf8] hover:bg-[#ebf5f2] border border-[#d1ebe4] rounded-xl transition-all" id={`duty-doctor-${idx}`}>
                  <div className="w-7 h-7 rounded-full bg-[#007f6e] flex items-center justify-center text-white font-bold text-xs">
                    {docName.split(' ').pop()?.[0] || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{docName}</p>
                    <p className="text-[10px] text-[#007f6e] font-medium truncate">{spec}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state visual */
          <div className="bg-slate-50/50 border border-dashed border-slate-100 rounded-xl p-6 text-center flex flex-col items-center justify-center" id="doctors-on-duty-empty">
            <Stethoscope size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400 font-medium" id="doctors-on-duty-empty-text">No active bookings for this day</p>
          </div>
        )}
      </div>

      {/* Today's Summary */}
      <div className="border-t border-slate-50 pt-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-3" id="todays-summary-header">
            Stats for June {selectedDay}
          </h4>
          <div className="space-y-2.5" id="todays-summary-list">
            {/* Follow ups */}
            <div className="flex items-center justify-between p-2.5 bg-[#fcf8ff] border border-violet-50/30 rounded-lg" id="summary-follow-ups">
              <span className="text-xs text-slate-500 font-medium">Follow-ups</span>
              <span className="text-xs font-bold text-[#8e52e9]">{followUpsToday}</span>
            </div>

            {/* New Patients */}
            <div className="flex items-center justify-between p-2.5 bg-[#f0fbf5] border border-emerald-50/30 rounded-lg" id="summary-new-patients">
              <span className="text-xs text-slate-500 font-medium">New Patients</span>
              <span className="text-xs font-bold text-[#00a85a]">{newPatientsToday}</span>
            </div>

            {/* Revenue */}
            <div className="flex items-center justify-between p-2.5 bg-[#fdf8f2] border border-amber-50/30 rounded-lg" id="summary-revenue">
              <span className="text-xs text-slate-500 font-medium">Earned Revenue</span>
              <span className="text-xs font-bold text-[#e67e22]">Rs. {dailyPaidRevenue.toLocaleString()}</span>
            </div>

            {/* Low stock */}
            <div className="flex items-center justify-between p-2.5 bg-[#f4fafc] border border-cyan-50/30 rounded-lg" id="summary-low-stock">
              <span className="text-xs text-slate-500 font-medium">Low Stock alerts</span>
              <span className="text-xs font-bold text-[#00a2c9]">{lowStockCount}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
