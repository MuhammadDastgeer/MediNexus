import React, { useState } from 'react';
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  HeartPulse,
  Receipt,
  ClipboardList,
  Bed,
  Users,
  UserCheck,
  User,
  Building2,
  HelpCircle,
  Globe,
  BookOpen,
  BarChart3,
  IndianRupee,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { ActiveView, Staff } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  loggedInUser: { role: 'patient' | 'doctor' | 'staff' | 'admin'; data: any; isAiUser?: boolean } | null;
  setLoggedInUser: (user: { role: 'patient' | 'doctor' | 'staff' | 'admin'; data: any; isAiUser?: boolean } | null) => void;
  onUpdateStaff: (staff: Omit<Staff, 'id'> & { id?: string }) => Promise<void> | void;
  onUpdateDoctor?: (id: string, fields: any) => Promise<void> | void;
  onUpdatePatient?: (patient: any) => Promise<void> | void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  loggedInUser,
  setLoggedInUser,
  onUpdateStaff,
  onUpdateDoctor,
  onUpdatePatient,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Define All possible navigation items
  const allGeneralItems = [
    { id: 'landing' as ActiveView, label: 'Public Website', icon: Globe },
    { id: 'ai-assistant' as ActiveView, label: 'AI Assistant', icon: Sparkles },
    { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments' as ActiveView, label: 'Appointments', icon: Calendar },
    { id: 'consultation' as ActiveView, label: 'Consultation', icon: HeartPulse },
    { id: 'billing' as ActiveView, label: 'Billing', icon: Receipt },
    { id: 'inventory' as ActiveView, label: 'Inventory', icon: ClipboardList },
    { id: 'ipd-wards' as ActiveView, label: 'IPD / Wards', icon: Bed },
    { id: 'staff' as ActiveView, label: 'Staff', icon: Users },
    { id: 'doctors' as ActiveView, label: 'Doctors', icon: UserCheck },
    { id: 'patients' as ActiveView, label: 'Patients', icon: User },
    { id: 'signup-patient' as ActiveView, label: 'signup patient', icon: UserCheck },
    { id: 'departments' as ActiveView, label: 'Departments', icon: Building2 },
    { id: 'enquiries' as ActiveView, label: 'Enquiries', icon: HelpCircle },
    { id: 'medical-tourism' as ActiveView, label: 'Medical Tourism', icon: Globe },
    { id: 'blogs' as ActiveView, label: 'Blogs', icon: BookOpen },
  ];

  const allSystemItems = [
    { id: 'reports' as ActiveView, label: 'Reports', icon: BarChart3 },
    { id: 'finance' as ActiveView, label: 'Finance', icon: IndianRupee },
    { id: 'configure-hospital' as ActiveView, label: 'Configure Hospital', icon: Settings },
    { id: 'support' as ActiveView, label: 'Support', icon: HelpCircle },
  ];

  // Dynamic Filtering based on login state
  let generalItems = allGeneralItems;
  let systemItems = allSystemItems;

  const isStaff = loggedInUser?.role === 'staff' && !loggedInUser?.isAiUser;
  const isDoctor = loggedInUser?.role === 'doctor' && !loggedInUser?.isAiUser;
  const isPatient = loggedInUser?.role === 'patient' && !loggedInUser?.isAiUser;

  if (loggedInUser?.isAiUser) {
    const aiUserAllowedTabs = ['landing', 'ai-assistant'];
    generalItems = allGeneralItems.filter((item) => aiUserAllowedTabs.includes(item.id));
    systemItems = [];
  } else if (isStaff) {
    // Staff displays: Dashboard, Appointments, Consultations, Billing, Staff, Patients, Blogs, Public Website
    const staffAllowedLocalTabs = ['landing', 'dashboard', 'ai-assistant', 'appointments', 'consultation', 'billing', 'staff', 'patients', 'blogs'];
    generalItems = allGeneralItems.filter((item) => staffAllowedLocalTabs.includes(item.id));
    systemItems = []; // Staff has no system administration access
  } else if (isDoctor) {
    // Doctor displays: Dashboard, Appointments, Consultations, Billing, Doctors (own profile), Patients, Public Website, Staff
    const doctorAllowedLocalTabs = ['landing', 'dashboard', 'ai-assistant', 'appointments', 'consultation', 'billing', 'doctors', 'patients', 'staff', 'blogs'];
    generalItems = allGeneralItems.filter((item) => doctorAllowedLocalTabs.includes(item.id));
    systemItems = []; // Doctors have no system administration access
  } else if (isPatient) {
    // Patient displays: Dashboard, Appointments, Billing, Patients (own profile), Doctors (all), Public Website
    const patientAllowedLocalTabs = ['landing', 'dashboard', 'ai-assistant', 'appointments', 'billing', 'patients', 'doctors'];
    generalItems = allGeneralItems.filter((item) => patientAllowedLocalTabs.includes(item.id));
    systemItems = []; // Patients have no system administration access
  }

  // Display fields for sidebar profile widget
  const displayName = loggedInUser?.data?.name || "Admin";
  const displayRole = loggedInUser 
    ? (loggedInUser.isAiUser 
        ? "AI Assistant Portal" 
        : (loggedInUser.role === 'patient' 
            ? "Patient Console" 
            : loggedInUser.role === 'doctor' 
              ? "Doctor Console" 
              : loggedInUser.role === 'admin'
                ? "Admin Console"
                : "Staff Console")) 
    : "Admin Console";
  const displayInitial = displayName.slice(0, 2).toUpperCase();

  // Populate dynamic form state on modal open
  const openEditProfile = () => {
    setEditName(loggedInUser?.data?.name || "Admin");
    setEditEmail(loggedInUser?.data?.email || "admin@hospital.com");
    setEditPassword(loggedInUser?.data?.password || "admin123");
    setShowPwd(false);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    setShowProfileModal(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg('');
    setSaveSuccessMsg('');

    if (!editName.trim()) {
      setSaveErrorMsg('Name field is required.');
      return;
    }

    try {
      if (loggedInUser && loggedInUser.role === 'staff') {
        const updatedStaffData = {
          ...loggedInUser.data,
          name: editName,
          email: editEmail,
          password: editPassword,
        };

        // Call parents persistent edit handler
        await onUpdateStaff(updatedStaffData);

        // Update local session state
        setLoggedInUser({
          ...loggedInUser,
          data: updatedStaffData,
        });

        setSaveSuccessMsg('Profile elements updated in database successfully!');
        setTimeout(() => {
          setShowProfileModal(false);
        }, 1500);
      } else if (loggedInUser && loggedInUser.role === 'doctor') {
        const updatedDoctorData = {
          ...loggedInUser.data,
          name: editName,
          email: editEmail,
          password: editPassword,
        };

        if (onUpdateDoctor) {
          await onUpdateDoctor(loggedInUser.data.id, {
            name: editName,
            email: editEmail,
            password: editPassword,
          });
        }

        // Update local session state
        setLoggedInUser({
          ...loggedInUser,
          data: updatedDoctorData,
        });

        setSaveSuccessMsg('Profile elements updated in database successfully!');
        setTimeout(() => {
          setShowProfileModal(false);
        }, 1500);
      } else if (loggedInUser && loggedInUser.role === 'patient') {
        const updatedPatientData = {
          ...loggedInUser.data,
          name: editName,
          email: editEmail,
          password: editPassword,
        };

        if (onUpdatePatient) {
          await onUpdatePatient(updatedPatientData);
        }

        // Update local session state
        setLoggedInUser({
          ...loggedInUser,
          data: updatedPatientData,
        });

        setSaveSuccessMsg('Profile elements updated in database successfully!');
        setTimeout(() => {
          setShowProfileModal(false);
        }, 1500);
      } else {
        // If they are local static Admin
        setSaveSuccessMsg('Admin profile override simulated successfully!');
        setTimeout(() => {
          setShowProfileModal(false);
        }, 1500);
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Error occurred while changing credentials.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveView('landing');
  };

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogoutWithClose = () => {
    handleNavClick('landing');
    setLoggedInUser(null);
  };

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 md:hidden"
          id="sidebar-mobile-backdrop"
        />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-50 md:z-20 bg-white border-r border-slate-100 flex flex-col h-screen overflow-y-auto select-none transition-all duration-300 ${
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      } ${collapsed ? 'md:w-20' : 'md:w-64'}`} id="app-sidebar">
        {/* Brand Logo & Collapse Toggle */}
        <div className={`p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 ${collapsed ? 'flex-col gap-4 py-6' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10 animate-pulse shrink-0" id="brand-logo-icon">
              <Stethoscope size={22} />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-extrabold text-slate-900 text-[16px] leading-tight tracking-tight flex items-center gap-1.5" id="brand-logo-name">
                  <span>CarePoint</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h2>
                <span className="text-[10px] bg-slate-200/60 text-slate-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block mt-0.5" id="brand-logo-subtitle">{displayRole}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/60 bg-white shadow-xs cursor-pointer`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            id="collapse-sidebar-toggle-btn"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 px-3 py-4 space-y-6 animate-fade-in">
          <div>
            {!collapsed && (
              <h3 className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-3 mb-2" id="general-menu-header">
                General
              </h3>
            )}
            <ul className="space-y-1">
              {generalItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all duration-300 text-left cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-md shadow-teal-600/15'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
                      }`}
                      title={collapsed ? item.label : undefined}
                      id={`menu-item-${item.id}`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {systemItems.length > 0 && (
            <div>
              {!collapsed && (
                <h3 className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-3 mb-2" id="system-menu-header">
                  System
                </h3>
              )}
              <ul className="space-y-1">
                {systemItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all duration-300 text-left cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-md shadow-teal-600/15'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
                        }`}
                        title={collapsed ? item.label : undefined}
                        id={`menu-item-${item.id}`}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Profile & Logout (Bottom) */}
        <div className="p-3 border-t border-slate-50 space-y-3">
          <div
            onClick={openEditProfile}
            className={`bg-slate-50 hover:bg-slate-100 rounded-xl p-2.5 flex ${collapsed ? 'justify-center' : 'items-center gap-3'} transition-all cursor-pointer border border-transparent hover:border-slate-200`} 
            id="profile-card"
            title="Click to view/edit profile particulars"
          >
            <div className="w-10 h-10 bg-[#3b82f6] text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shrink-0 uppercase" id="profile-card-initial">
              {displayInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-800 truncate" id="profile-card-name">
                  {displayName}
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold truncate capitalize" id="profile-card-role">
                  {displayRole}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogoutWithClose}
            className={`w-full flex items-center justify-center ${collapsed ? 'py-2.5 px-0' : 'gap-2 px-4 py-2'} bg-red-50 text-red-600 rounded-xl border border-red-100/30 font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer`}
            id="logout-btn"
            title="Disconnect current session"
          >
            <LogOut size={14} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Edit Profile Dynamic Modal (down ma name clicked popup) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#020617]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="staff-profile-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden" id="staff-profile-modal-content">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#005f54] to-[#007f6e] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Edit Corporate Profile</h3>
                <p className="text-[11px] text-teal-100/80 font-medium">Manage database security settings for {displayRole}</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleProfileSave} className="p-6 space-y-4">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 animate-pulse">
                  {saveSuccessMsg}
                </div>
              )}
              
              {saveErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                  {saveErrorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs focus:bg-white focus:outline-hidden focus:border-[#007f6e] font-semibold text-slate-700"
                    placeholder="Enter your registered name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-10 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs focus:bg-white focus:outline-hidden focus:border-[#007f6e] font-semibold text-slate-705"
                    placeholder="name@hospital.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">Profile Security Key</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 pr-10 text-xs focus:bg-white focus:outline-hidden focus:border-[#007f6e] font-semibold text-slate-706"
                    placeholder="Enter new credential key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007f6e] hover:bg-[#005f54] text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
