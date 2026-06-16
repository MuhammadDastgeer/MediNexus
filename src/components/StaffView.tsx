import React, { useState } from 'react';
import { Users, Plus, Search, Calendar, Award, RefreshCw, Clock, CheckSquare } from 'lucide-react';
import { Staff } from '../types';

interface StaffViewProps {
  staffList: Staff[];
  onAddStaff: (s: Omit<Staff, 'id'>) => void;
  onRefresh: () => void;
}

export default function StaffView({ staffList, onAddStaff, onRefresh }: StaffViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'attendance' | 'overview'>('members');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Nurse');
  const [department, setDepartment] = useState('Outpatient Department (OPD)');
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAddStaff({
      name,
      role,
      department,
      status: 'Active',
    });
    setName('');
    setShowForm(false);
  };

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="staff-management-view">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="staff-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="staff-title">Human Resources (HR)</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage hospital nursing teams, clinic administrators, and rosters.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Add Staff Member</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm max-w-lg">
          <h3 className="text-sm font-bold text-slate-800">Enroll Team Member</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nurse / Staff Name"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Designation</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
              >
                <option value="Senior Nurse">Senior Nurse</option>
                <option value="Duty Nurse">Duty Nurse</option>
                <option value="Ward Boy">Ward Assistant / Ward Boy</option>
                <option value="Pharmacy Lead">Pharmacy Lead</option>
                <option value="Frontdesk Officer">Frontdesk Officer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
              >
                <option value="Emergency Care Ward">Emergency Care Ward</option>
                <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                <option value="Outpatient Department (OPD)">Outpatient Department (OPD)</option>
                <option value="Billing & Reception">Billing & Reception Desk</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#007f6e] text-white font-semibold rounded-lg hover:bg-[#006657]"
            >
              Confirm Enrolment
            </button>
          </div>
        </form>
      )}

      {/* TABS (Staff Members, Attendance Matrix, Overview) */}
      <div className="flex border-b border-slate-100" id="staff-tabs">
        {[
          { id: 'members', label: 'Staff Members' },
          { id: 'attendance', label: 'Attendance Matrix' },
          { id: 'overview', label: 'Overview' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-[#007f6e] text-[#007f6e]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' ? (
        <div className="space-y-6" id="staff-members-tab">
          {/* HR METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="staff-kpis">
            {/* Total Staff */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                <span className="text-2xl font-extrabold text-slate-800">{staffList.length}</span>
              </div>
              <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            {/* Present count */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Duty</span>
                <span className="text-2xl font-extrabold text-emerald-500">{staffList.length}</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-400 rounded-xl flex items-center justify-center">
                <CheckSquare size={18} />
              </div>
            </div>

            {/* Late Duty */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold">Late Arrivals</span>
                <span className="text-2xl font-extrabold text-slate-800">0</span>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>

            {/* On Leave count */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Leave</span>
                <span className="text-2xl font-extrabold text-slate-800">0</span>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-400 rounded-xl flex items-center justify-center text-xs font-bold">
                0
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="staff-table-card">
            {/* Search filter */}
            <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-end">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search staff registry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-205 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-staff">
                <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No staff found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enroll administrative or clinical staff using upper-right button.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Staff Name</th>
                      <th className="px-6 py-3">Assigned Role</th>
                      <th className="px-6 py-3">Department Ward</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{s.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{s.role}</td>
                        <td className="px-6 py-4 text-slate-500">{s.department}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                            {s.status}
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
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl p-8 max-w-2xl text-center shadow-xs">
          <Calendar size={32} className="text-slate-350 mx-auto mb-3 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-800 capitalize">{activeTab} system loaded</h3>
          <p className="text-xs text-slate-400 mt-2">
            Roster availability charts, clock-ins, shift handovers, and monthly statistics will display here dynamically based on SQLite check-ins.
          </p>
        </div>
      )}
    </div>
  );
}
