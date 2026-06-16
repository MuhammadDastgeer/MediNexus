import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Calendar, RefreshCw, 
  Clock, CheckSquare, ArrowLeft, Shield, Landmark, 
  Trash2, Edit, Eye, X, Check, Mail, Phone, 
  MapPin, CreditCard, UserCheck, BarChart2, Camera, Download 
} from 'lucide-react';
import { Staff } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface StaffViewProps {
  staffList: Staff[];
  onAddStaff: (s: Omit<Staff, 'id'> & { id?: string }) => void;
  onDeleteStaff: (id: string) => void;
  onRefresh: () => void;
  onNavigate?: (view: any) => void;
}

export default function StaffView({ staffList, onAddStaff, onDeleteStaff, onRefresh, onNavigate }: StaffViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'overview'>('members');
  const [showForm, setShowForm] = useState<'add' | 'edit' | false>(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'financials'>('overview');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (filtered.length === 0) {
      alert("No matching staff members to export.");
      return;
    }
    const headers = ['Staff ID', 'Name', 'Role', 'Department', 'Email', 'Phone', 'Join Date', 'Status'];
    const keys = ['id', 'name', 'role', 'department', 'email', 'phone', 'joinDate', 'status'];
    const filename = `staff_members_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filtered, headers, keys, filename);
    } else if (format === 'Excel') {
      downloadExcel(filtered, headers, keys, filename);
    } else if (format === 'Word') {
      downloadWord(filtered, headers, keys, filename, 'Hospital Staff Portfolio');
    } else if (format === 'PDF') {
      downloadPDFFile(filtered, headers, keys, filename, 'Hospital Employee Roll');
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState('12/06/2026');
  const [dob, setDob] = useState('');
  const [workingDays, setWorkingDays] = useState<string | number>('26');
  const [address, setAddress] = useState('');
  
  const [role, setRole] = useState('Nurse');
  const [department, setDepartment] = useState('Outpatient Department (OPD)');
  const [monthlySalary, setMonthlySalary] = useState<string | number>('0');

  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [pfAccountNo, setPfAccountNo] = useState('');
  const [pfUan, setPfUan] = useState('');
  
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [search, setSearch] = useState('');

  // Handle Edit mode prepopulation
  const startEdit = (staff: Staff) => {
    setSelectedStaffId(staff.id);
    setName(staff.name || '');
    setEmail(staff.email || '');
    setPhone(staff.phone || '');
    setJoinDate(staff.joinDate || '12/06/2026');
    setDob(staff.dob || '');
    setWorkingDays(staff.workingDays !== undefined ? staff.workingDays : '26');
    setAddress(staff.address || '');
    setRole(staff.role || 'Nurse');
    setDepartment(staff.department || 'Outpatient Department (OPD)');
    setMonthlySalary(staff.monthlySalary !== undefined ? staff.monthlySalary : '0');
    setBankName(staff.bankName || '');
    setBankAccountNo(staff.bankAccountNo || '');
    setPanNo(staff.panNo || '');
    setPfAccountNo(staff.pfAccountNo || '');
    setPfUan(staff.pfUan || '');
    setStatus(staff.status || 'Active');
    setShowForm('edit');
  };

  const startAdd = () => {
    setSelectedStaffId(null);
    setName('');
    setEmail('');
    setPhone('');
    setJoinDate('12/06/2026');
    setDob('');
    setWorkingDays('26');
    setAddress('');
    setRole('Nurse');
    setDepartment('Outpatient Department (OPD)');
    setMonthlySalary('0');
    setBankName('');
    setBankAccountNo('');
    setPanNo('');
    setPfAccountNo('');
    setPfUan('');
    setStatus('Active');
    setShowForm('add');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      alert("Please fill in all required fields marked with an asterisk (*).");
      return;
    }

    const payload: Omit<Staff, 'id'> & { id?: string } = {
      name,
      email,
      phone,
      joinDate,
      dob,
      workingDays,
      address,
      role,
      department,
      monthlySalary,
      bankName,
      bankAccountNo,
      panNo,
      pfAccountNo,
      pfUan,
      status,
    };

    if (showForm === 'edit' && selectedStaffId) {
      payload.id = selectedStaffId;
    }

    onAddStaff(payload);
    setShowForm(false);
    startAdd(); // reset form
  };

  // Metrics calculations for the Overview screen
  const totalCount = staffList.length;
  const activeCount = staffList.filter(s => s.status === 'Active').length;
  const inactiveCount = staffList.filter(s => s.status === 'Inactive').length;
  const credentialsSentCount = staffList.filter(s => s.email && s.status === 'Active').length;
  const pendingSendCount = staffList.filter(s => !s.email && s.status === 'Active').length;
  const inactiveNoLoginCount = staffList.filter(s => s.status === 'Inactive').length;

  // Group by role for Overview distribution widget
  const roleDistributionMap: Record<string, number> = {};
  staffList.forEach(s => {
    roleDistributionMap[s.role] = (roleDistributionMap[s.role] || 0) + 1;
  });

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
    (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  if (viewingStaff) {
    const handleDownloadStaffCardPDF = () => {
      const staffName = viewingStaff.name || 'Staff';
      let html = '<html>\n';
      html += '<head><meta charset="utf-8"><title>Staff Portfolio - ' + staffName + '</title>\n';
      html += '<style>\n';
      html += 'body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; line-height: 1.5; }\n';
      html += '.header { border-bottom: 2.5px solid #007f6e; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }\n';
      html += 'h1 { color: #007f6e; margin: 0; font-size: 24px; font-weight: 800; }\n';
      html += '.section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #007f6e; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; letter-spacing: 0.05em; }\n';
      html += '.grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }\n';
      html += '.info-item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }\n';
      html += '.info-label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }\n';
      html += '.info-value { font-size: 12px; color: #0f172a; font-weight: 705; }\n';
      html += '.footer { font-size: 10px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; margin-top: 40px; }\n';
      html += '</style>\n';
      html += '</head><body>\n';
      
      html += '<div class="header">\n';
      html += `  <div>\n    <h1>${staffName}</h1>\n    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Role Profile: ${viewingStaff.role} | Department: ${viewingStaff.department || 'Clinical General'}</div>\n  </div>\n`;
      html += `  <div style="text-align: right; font-size: 11px; color: #64748b;">Generated Date: ${new Date().toLocaleString()}</div>\n`;
      html += '</div>\n';
      
      html += '<div class="section-title">Staff Member Demographics</div>\n';
      html += '<div class="grid-info">\n';
      html += `  <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${viewingStaff.name}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Phone No</div><div class="info-value">${viewingStaff.phone || 'N/A'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">${viewingStaff.email || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Joining Date</div><div class="info-value">${viewingStaff.joinDate || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">${viewingStaff.dob || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Working Days (per month)</div><div class="info-value">${viewingStaff.workingDays || '26'} Days</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Home Address</div><div class="info-value">${viewingStaff.address || '—'}</div></div>\n`;
      html += '</div>\n';

      html += '<div class="section-title">Employment Role & Financial Roster</div>\n';
      html += '<div class="grid-info">\n';
      html += `  <div class="info-item"><div class="info-label">Designated Role</div><div class="info-value">${viewingStaff.role}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Assigned Department</div><div class="info-value">${viewingStaff.department || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Monthly Wages (₹)</div><div class="info-value">₹${Number(viewingStaff.monthlySalary || 0).toLocaleString()}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Account Status</div><div class="info-value">${viewingStaff.status || 'Active'}</div></div>\n`;
      html += '</div>\n';

      html += '<div class="section-title">Verified Bank Credentials & Direct Deposit</div>\n';
      html += '<div class="grid-info">\n';
      html += `  <div class="info-item"><div class="info-label">Direct Deposit Bank</div><div class="info-value">${viewingStaff.bankName || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Bank Account Number</div><div class="info-value">${viewingStaff.bankAccountNo || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Permanent PAN Badge No</div><div class="info-value">${viewingStaff.panNo || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Provident Fund PF Account No</div><div class="info-value">${viewingStaff.pfAccountNo || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">PF Universal Access No (UAN)</div><div class="info-value">${viewingStaff.pfUan || '—'}</div></div>\n`;
      html += '</div>\n';
      
      html += '<div class="footer">Confidential Hospital Staff Member Record - Generated Dynamically</div>\n';
      html += '</body>\n</html>';
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `staff_profile_${staffName.toLowerCase().replace(/\s+/g, '_')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans animate-fade-in" id="staff-dashboard-container">
        {/* Navigation Breadcrumb / Top bar */}
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-3xs" id="staff-dashboard-breadcrumbs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button 
              onClick={() => setViewingStaff(null)}
              className="flex items-center gap-1 hover:text-[#007f6e] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>All Staff Members</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">{viewingStaff.name}</span>
          </div>

          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            <RefreshCw size={13} className="text-white" />
            <span>Refresh</span>
          </button>
        </div>

        {/* PROFILE HEADER BLOCK styled matches user-uploaded patients image specs */}
        <div className="bg-gradient-to-r from-[#eefaf7] to-[#e8f6f4] rounded-2xl border border-teal-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-sm" id="staff-main-avatar-profile">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white border-2 border-teal-50 rounded-full flex items-center justify-center font-black text-2xl text-[#007f6e] shadow-xs">
                {viewingStaff.name ? viewingStaff.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-teal-600 border border-white text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 shadow-sm">
                <Camera size={10} />
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">{viewingStaff.name}</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 font-mono">{viewingStaff.role} • {viewingStaff.department}</p>
              <div className="flex items-center gap-4 text-xs text-slate-505 mt-2 font-medium font-mono">
                <span className="flex items-center gap-1 font-sans">
                  <Phone size={13} className="text-slate-400 font-bold" />
                  <span>{viewingStaff.phone || 'N/A'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400 font-bold" />
                  <span>Joined {viewingStaff.joinDate || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Role and Salary and Working Days score cards of the side block */}
          <div className="flex gap-3 self-stretch md:self-auto">
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[70px] shadow-3xs text-slate-700 text-xs font-bold font-mono">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-sans">Days</span>
              <span className="text-xl font-black">{viewingStaff.workingDays || '26'}</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[102px] shadow-3xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-sans">Wage Salary</span>
              <span className="text-xl font-black text-[#007f6e]">₹{Number(viewingStaff.monthlySalary || 0).toLocaleString()}</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[102px] shadow-3xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-sans">Status</span>
              <span className={`text-xl font-black ${viewingStaff.status === 'Active' ? 'text-emerald-600' : 'text-amber-500'}`}>{viewingStaff.status}</span>
            </div>
          </div>
        </div>

        {/* Row of 4 metric counters styled beautifully in a matching schema */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="staff-stats-four-box">
          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-teal-50 text-[#007f6e] rounded-lg flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Role</span>
              <span className="text-xs font-bold text-slate-700 block">{viewingStaff.role}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[150px] block">{viewingStaff.department || '—'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Wage</span>
              <span className="text-xs font-bold text-slate-700 block">₹{Number(viewingStaff.monthlySalary || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registry Days</span>
              <span className="text-xs font-bold text-[#007f6e] block">{viewingStaff.workingDays || 26} Days</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons bar matching the horizontal underline style index */}
        <div className="flex border-b border-slate-200" id="staff-dashboard-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'financials', label: 'Financial & Banking Audit' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailActiveTab(tab.id as any)}
              className={`px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer pb-2.5 -mb-px ${
                detailActiveTab === tab.id
                  ? 'border-[#007f6e] text-[#007f6e] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DETAILS CORE CONTENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {detailActiveTab === 'overview' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs" id="personal-info-block">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Clinical Staff Record</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        startEdit(viewingStaff);
                        setViewingStaff(null);
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit this staff profile"
                    >
                      <Edit size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you absolutely sure you want to remove staff member ${viewingStaff.name}?`)) {
                          onDeleteStaff(viewingStaff.id);
                          setViewingStaff(null);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Permanently delete recorded info"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={handleDownloadStaffCardPDF}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#007f6e] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Download PDF medical record"
                    >
                      <Download size={11} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs" id="staff-overview-fields">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Staff Name</span>
                    <span className="text-[#0f172a] font-extrabold text-right">{viewingStaff.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Role / Profile</span>
                    <span className="text-slate-800 font-bold text-right font-mono text-[#007f6e]">{viewingStaff.role}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Active Department</span>
                    <span className="text-slate-800 font-bold text-right uppercase">{viewingStaff.department || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone Contact</span>
                    <span className="text-[#0f172a] font-bold text-right font-mono">{viewingStaff.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 text-wrap">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Email ID</span>
                    <span className="text-slate-800 font-medium text-right break-all">{viewingStaff.email || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth</span>
                    <span className="text-slate-808 font-medium text-right">{viewingStaff.dob || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Joining Date</span>
                    <span className="text-slate-800 font-medium text-right font-mono">{viewingStaff.joinDate || '12/06/2026'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">System Status</span>
                    <span className={`px-2 py-0.2 rounded font-black text-[10px] ${viewingStaff.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'}`}>{viewingStaff.status}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 md:col-span-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Home Residential Address</span>
                    <span className="text-[#0f172a] font-medium text-right leading-normal">{viewingStaff.address || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {detailActiveTab === 'financials' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs" id="financial-banking-pane">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Payroll Banking & Accounts Ledger</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs" id="staff-financial-fields">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Monthly Base Salary</span>
                    <span className="text-[#007f6e] font-extrabold text-right">₹{Number(viewingStaff.monthlySalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Designated Deposit Bank</span>
                    <span className="text-slate-800 font-bold text-right uppercase">{viewingStaff.bankName || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Bank Account Number</span>
                    <span className="text-slate-805 font-bold font-mono text-right">{viewingStaff.bankAccountNo || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Permanent PAN Code No</span>
                    <span className="text-slate-800 font-bold font-mono text-right uppercase">{viewingStaff.panNo || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Provident Fund (PF) Account No</span>
                    <span className="text-slate-800 font-medium font-mono text-right">{viewingStaff.pfAccountNo || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">PF Universal Access No (UAN)</span>
                    <span className="text-slate-800 font-medium font-mono text-right">{viewingStaff.pfUan || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs animate-fade-in" id="staff-sidebar-ledger-pane">
              <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b pb-2 mb-4">Banking direct Deposit</h3>
              <div className="space-y-3.5" id="staff-sidebar-bank-cards">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Landmark size={12} className="text-slate-400" />
                    <span>Direct Deposit Bank</span>
                  </div>
                  <span className="text-md font-black text-slate-800 block">{viewingStaff.bankName || 'NOT ONBOARDED'}</span>
                  <span className="text-slate-500 font-mono text-[10.5px] block">{viewingStaff.bankAccountNo ? `A/C: ${viewingStaff.bankAccountNo}` : 'No Registered Account'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PAN Registration code</span>
                  <span className="text-sm font-extrabold text-purple-700 font-mono uppercase block">{viewingStaff.panNo || 'NOT RECORDED'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans" id="staff-management-view-container">
      
      {/* Tab selection pill bar */}
      {!showForm && (
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4" id="staff-tab-pillbar">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#e6f4f1] text-[#007f6e] border border-[#007f6e]'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Staff Members</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#e6f4f1] text-[#007f6e] border border-[#007f6e]'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart2 size={15} />
            <span>Overview</span>
          </button>
        </div>
      )}

      {/* Main Mode Toggle: Form View vs Listing View */}
      {showForm ? (
        <div className="space-y-6 max-w-5xl" id="staff-member-form-section">
          {/* Back Action Bar */}
          <div className="flex items-center justify-between" id="form-header-bar">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-55 transition-colors shadow-xs"
              >
                <ArrowLeft size={14} />
                <span>Back to Staff</span>
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800" id="form-main-title">
                  {showForm === 'edit' ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <p className="text-xs text-slate-400">Fill in all required information below</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CARD 1: Basic Information */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="form-section-basic">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Basic Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@hospital.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Join Date</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Working Days / Month</label>
                  <input
                    type="number"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    placeholder="26"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Role & Department */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="form-section-role">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role & Department</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Staff Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 font-medium"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Senior Nurse">Senior Nurse</option>
                    <option value="Duty Nurse">Duty Nurse</option>
                    <option value="Ward Assistant">Ward Assistant / Ward Boy</option>
                    <option value="Pharmacy Lead">Pharmacy Lead</option>
                    <option value="Frontdesk Officer">Frontdesk Officer</option>
                    <option value="Duty Doctor">Duty Doctor</option>
                    <option value="Billing Officer">Billing Officer</option>
                    <option value="Lab Assistant">Lab Assistant</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  >
                    <option value="Outpatient Department (OPD)">Outpatient Department (OPD)</option>
                    <option value="Emergency Care Ward">Emergency Care Ward</option>
                    <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                    <option value="Billing & Reception">Billing & Reception Desk</option>
                    <option value="Pharmacy">Pharmacy Department</option>
                    <option value="Medical Laboratory">Medical Laboratory</option>
                    <option value="— No Department —">— No Department —</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Bank & PF Details */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="form-section-bank">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Landmark size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank & PF Details</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bank Account No</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="Account number"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">PAN NO</label>
                  <input
                    type="text"
                    value={panNo}
                    onChange={(e) => setPanNo(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">PF Account No</label>
                  <input
                    type="text"
                    value={pfAccountNo}
                    onChange={(e) => setPfAccountNo(e.target.value)}
                    placeholder="PF A/c No"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">PF UAN</label>
                  <input
                    type="text"
                    value={pfUan}
                    onChange={(e) => setPfUan(e.target.value)}
                    placeholder="UAN number"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: Account Status Toggle (Teal/White themed) */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="form-section-status">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Account Status</h4>
                <p className="text-xs text-slate-400 mt-1">Toggle to activate or deactivate this staff account</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {status}
                </span>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                    status === 'Active' ? 'bg-[#007f6e]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${
                    status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* BOTTOM FORM CONTROLS */}
            <div className="flex items-center gap-3 pt-2" id="form-action-buttons">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-500 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs bg-[#007f6e] text-white font-bold rounded-xl hover:bg-[#006657] transition-colors shadow-sm"
              >
                {showForm === 'edit' ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'overview' ? (
        
        /* ================= OVERVIEW TAB ================= */
        <div className="space-y-6" id="overview-dashboard-container">
          
          {/* Header Banner Block */}
          <div className="bg-[#005f54] text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="overview-jumbotron">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <h2 className="text-lg font-extrabold tracking-tight">Staff & Team Overview</h2>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">
                {totalCount} total staff members • {activeCount} active • {inactiveCount} inactive
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={startAdd}
                className="bg-[#00473e] hover:bg-[#003d35] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Manage Staff
              </button>
              <button
                onClick={onRefresh}
                className="bg-[#0c6b60] hover:bg-[#0a5c52] text-white p-2 rounded-xl"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
              </button>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="overview-kpis">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                <span className="text-2xl font-black text-slate-800">{totalCount}</span>
              </div>
              <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active</span>
                <span className="text-2xl font-black text-emerald-500">{activeCount}</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <CheckSquare size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inactive</span>
                <span className="text-2xl font-black text-amber-500">{inactiveCount}</span>
              </div>
              <div className="w-10 h-10 bg-amber-5px text-amber-500 rounded-xl flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portal Access Sent</span>
                <span className="text-2xl font-black text-purple-600">{credentialsSentCount}</span>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                <UserCheck size={18} />
              </div>
            </div>
          </div>

          {/* Center widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-widgets">
            {/* Widget 1: Staff By Role distribution */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Staff by Role</h3>
                <span className="text-[10px] text-slate-450">Distribution across roles</span>
              </div>
              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-1.5">
                  <Shield size={24} className="text-slate-200" />
                  <p className="text-xs font-semibold">No staff data available</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  {Object.entries(roleDistributionMap).map(([roleName, count]) => {
                    const pct = Math.round((count / totalCount) * 100);
                    return (
                      <div key={roleName} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{roleName}</span>
                          <span className="text-[#007f6e]">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="bg-[#007f6e] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget 2: Recently Added list */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recently Added</h3>
                <span className="text-[10px] text-slate-450 bg-[#007f6e]/10 text-[#007f6e] px-2 py-0.5 rounded-full font-bold">Latest onboarded</span>
              </div>
              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-1.5">
                  <Users size={24} className="text-slate-200" />
                  <p className="text-xs font-semibold">No staff members yet</p>
                </div>
              ) : (
                <div className="space-y-3.5 divide-y divide-slate-50 flex-1">
                  {staffList.slice(-3).reverse().map((s) => (
                    <div key={s.id} className="flex items-center justify-between pt-3 first:pt-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#007f6e]/5 text-[#007f6e] rounded-xl flex items-center justify-center font-bold text-sm">
                          {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{s.role} • {s.department}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-550 font-semibold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {s.joinDate || 'Joined Recently'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Widget 3: Portal Access Status status bar */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs" id="portal-access-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-3 mb-4 gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Portal Access Status</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Staff members who can log into the portal</p>
              </div>
              <button 
                onClick={() => alert("Credentials sent successfully to all active staff members with configured email addresses.")}
                className="flex items-center gap-1 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold shadow-xs active:scale-95 transition-transform"
              >
                <span>Send Credentials</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {credentialsSentCount}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Credentials Sent</p>
                  <p className="text-[10px] text-slate-400">Ready to log in</p>
                </div>
              </div>

              <div className="bg-amber-50/40 border border-amber-100/50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                  {pendingSendCount}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Pending Send</p>
                  <p className="text-[10px] text-slate-400">Requires email address</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                  {inactiveNoLoginCount}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Inactive (No Login)</p>
                  <p className="text-[10px] text-slate-400">Account status disabled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tasks Bottom cards exactly matching Image 1 layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="overview-ctas">
            <div className="bg-[#0a6659] text-white border border-[#09574c] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white mb-3">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Add New Staff</h4>
                <p className="text-[11px] text-teal-100 mt-1">Onboard a new staff member to your hospital team</p>
              </div>
              <button 
                onClick={startAdd}
                className="w-full py-2 bg-[#004d44] hover:bg-[#003d35] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <span>Add Staff</span>
                <span>→</span>
              </button>
            </div>

            <div className="bg-[#6b5cd8] text-white border border-[#5a4cc2] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white mb-3">
                  <Shield size={16} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Configure Roles</h4>
                <p className="text-[11px] text-indigo-100 mt-1">Manage staff roles, permissions, and access levels</p>
              </div>
              <button 
                onClick={() => onNavigate?.('configure-hospital')}
                className="w-full py-2 bg-[#5749bb] hover:bg-[#473aa3] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Configure</span>
                <span>→</span>
              </button>
            </div>

            <div className="bg-[#00a884] text-white border border-[#009473] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white mb-3">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Manage Doctors</h4>
                <p className="text-[11px] text-teal-50/90 mt-1">View and manage all registered doctors and credentials</p>
              </div>
              <button 
                onClick={() => onNavigate?.('doctors')}
                className="w-full py-2 bg-[#008f6f] hover:bg-[#007a5e] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Go to Doctors</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      ) : (

        /* ================= LISTING VIEW (First Tab) ================= */
        <div className="space-y-6" id="staff-members-listing-screen">
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="listing-header">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Staff Members</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage all hospital staff — add, edit, assign roles, and control portal access.</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={startAdd}
                className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-97"
              >
                <Plus size={14} />
                <span>Add Staff</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="listing-counters">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                <span className="text-xl font-extrabold text-slate-850">{totalCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                <Users size={15} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Accounts</span>
                <span className="text-xl font-extrabold text-emerald-600">{activeCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={14} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inactive Accounts</span>
                <span className="text-xl font-extrabold text-amber-500">{inactiveCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50/50 text-amber-500 flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Profiles</span>
                <span className="text-xl font-extrabold text-[#007f6e]">{staffList.filter(s => s.bankName).length}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#007f6e] flex items-center justify-center">
                <Landmark size={14} />
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden" id="staff-table-card">
            {/* Search filter banner matching Image 2 style */}
            <div className="p-4 border-b border-slate-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search by name, email or designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-white border border-slate-205 rounded-xl focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-bold text-slate-650">
                <button 
                  onClick={() => alert("Filters applied.")} 
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <span>Filters</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowExportDropdown(!showExportDropdown)} 
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Export</span>
                  </button>
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1 divide-y divide-slate-50 text-[11px]">
                      <button onClick={() => handleExport('CSV')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium block">CSV format</button>
                      <button onClick={() => handleExport('Excel')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-medium block">Excel sheet</button>
                      <button onClick={() => handleExport('Word')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-blue-600 font-medium block">Word document</button>
                      <button onClick={() => handleExport('PDF')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 font-medium block">PDF file</button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => alert("Credentials sent to all staff members.")} 
                  className="px-3 py-1.5 bg-[#e6f4f1] text-[#007f6e] rounded-xl hover:bg-emerald-50/80 flex items-center gap-1.5"
                >
                  <span>Send All</span>
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-staff">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">No staff members found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Staff" to onboarding your hospital staff list.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-405 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Staff Basic Details</th>
                      <th className="px-6 py-3.5">Assigned Role</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Monthly Salary (₹)</th>
                      <th className="px-6 py-3.5">Join Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#007f6e]/5 text-[#007f6e] flex items-center justify-center font-bold">
                              {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{s.name}</div>
                              {s.email && <div className="text-[10px] text-slate-400 font-medium">{s.email}</div>}
                              {s.phone && <div className="text-[10px] text-slate-400">{s.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{s.role}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {s.department || '— No Department —'}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-650">
                          ₹{Number(s.monthlySalary || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">
                          {s.joinDate || '12/06/2026'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingStaff(s)}
                              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"
                              title="View full profiles"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => startEdit(s)}
                              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 rounded-lg transition-colors"
                              title="Edit particulars"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete staff member "${s.name}"?`)) {
                                  onDeleteStaff(s.id);
                                }
                              }}
                              className="p-1.5 border border-red-100 bg-white hover:bg-red-50/50 text-red-500 rounded-lg transition-colors"
                              title="Delete record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODAL (Elegant slide-over or styled modal) */}
      {viewingStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in" id="staff-profile-view-modal">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-100 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg">
                  {viewingStaff.name ? viewingStaff.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{viewingStaff.name}</h3>
                  <p className="text-[11px] text-teal-100 mt-0.5">{viewingStaff.role} • {viewingStaff.department}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingStaff(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-600">
              
              {/* Basic Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#007f6e] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Basic Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Date of Birth</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.dob || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Join Date</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.joinDate || '12/06/2026'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Working Days / Month</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.workingDays || '26'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Account Status</span>
                    <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-bold ${
                      viewingStaff.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'
                    }`}>
                      {viewingStaff.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Address</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#007f6e] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Shield size={14} />
                  <span>Role & Compensation</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Designation</span>
                    <span className="text-slate-800 font-semibold">{viewingStaff.role}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Department</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.department || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Monthly Salary</span>
                    <span className="text-slate-800 font-mono font-bold">₹{Number(viewingStaff.monthlySalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bank & PF Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#007f6e] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Landmark size={14} />
                  <span>Bank & PF details</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Bank Name</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.bankName || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Bank Account Number</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.bankAccountNo || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">PAN Card Number</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.panNo || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">PF Account Number</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.pfAccountNo || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">PF Universal Account Number (UAN)</span>
                    <span className="text-slate-800 font-medium">{viewingStaff.pfUan || '—'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Control */}
            <div className="bg-[#fafbfc] border-t border-slate-100 p-4 flex justify-end">
              <button
                onClick={() => setViewingStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
