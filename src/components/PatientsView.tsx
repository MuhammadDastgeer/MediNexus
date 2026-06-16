import React, { useState } from 'react';
import { User, Plus, Search, FileDown, Calendar, RefreshCw } from 'lucide-react';
import { Patient } from '../types';

interface PatientsViewProps {
  patients: Patient[];
  onAddPatient: (patient: Omit<Patient, 'id' | 'registeredAt'>) => void;
  onRefresh: () => void;
}

export default function PatientsView({ patients, onAddPatient, onRefresh }: PatientsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [status, setStatus] = useState<'New' | 'Follow-up'>('New');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone) {
      alert('Please fill all critical patient registration details');
      return;
    }
    onAddPatient({
      name,
      age: parseInt(age),
      gender,
      phone,
      status,
    });
    setName('');
    setAge('');
    setPhone('');
    setStatus('New');
    setShowAddForm(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="patients-management-view">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="patients-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="patients-title">Patient Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live - {patients.length} registered patients (all time)</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Register New Patient</span>
          </button>
          <button
            onClick={() => alert('Exporting raw Excel schema')}
            className="flex items-center gap-1.5 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileDown size={14} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm max-w-lg">
          <h3 className="text-sm font-bold text-slate-800">New Patient Onboarding</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patient Full name"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Years"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Mobile Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
              >
                <option value="New">New Visit</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#007f6e] text-white font-semibold rounded-lg hover:bg-[#006657]"
            >
              Confirm Register
            </button>
          </div>
        </form>
      )}

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="patients-main-card">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 border border-slate-150 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600">
              <span>Date Range</span>
              <Calendar size={12} className="text-slate-400" />
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-user-diagram">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <User size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No patients found</p>
              <p className="text-xs text-slate-400 mt-0.5">Register your first patient to get started.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">FullName</th>
                  <th className="px-6 py-3">Gender/Age</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Onboarded</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{p.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.gender} · {p.age} yrs</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{p.phone}</td>
                    <td className="px-6 py-4 text-slate-400 text-[10px]">
                      {new Date(p.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'New' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                      }`}>
                        {p.status}
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
