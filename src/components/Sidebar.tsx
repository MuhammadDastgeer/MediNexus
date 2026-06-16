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
} from 'lucide-react';
import { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }: SidebarProps) {
  const generalItems = [
    { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments' as ActiveView, label: 'Appointments', icon: Calendar },
    { id: 'consultation' as ActiveView, label: 'Consultation', icon: HeartPulse },
    { id: 'billing' as ActiveView, label: 'Billing', icon: Receipt },
    { id: 'inventory' as ActiveView, label: 'Inventory', icon: ClipboardList },
    { id: 'ipd-wards' as ActiveView, label: 'IPD / Wards', icon: Bed },
    { id: 'staff' as ActiveView, label: 'Staff', icon: Users },
    { id: 'doctors' as ActiveView, label: 'Doctors', icon: UserCheck },
    { id: 'patients' as ActiveView, label: 'Patients', icon: User },
    { id: 'departments' as ActiveView, label: 'Departments', icon: Building2 },
    { id: 'enquiries' as ActiveView, label: 'Enquiries', icon: HelpCircle },
    { id: 'medical-tourism' as ActiveView, label: 'Medical Tourism', icon: Globe },
    { id: 'blogs' as ActiveView, label: 'Blogs', icon: BookOpen },
  ];

  const systemItems = [
    { id: 'reports' as ActiveView, label: 'Reports', icon: BarChart3 },
    { id: 'finance' as ActiveView, label: 'Finance', icon: IndianRupee },
    { id: 'configure-hospital' as ActiveView, label: 'Configure Hospital', icon: Settings },
    { id: 'support' as ActiveView, label: 'Support', icon: HelpCircle },
  ];

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-100 flex flex-col h-screen overflow-y-auto select-none transition-all duration-300 relative`} id="app-sidebar">
      {/* Brand Logo & Collapse Toggle */}
      <div className={`p-5 flex items-center justify-between border-b border-slate-50 ${collapsed ? 'flex-col gap-4 py-6' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#007f6e] rounded-xl flex items-center justify-center text-white shrink-0" id="brand-logo-icon">
            <Stethoscope size={22} />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-slate-800 text-[16px] leading-tight" id="brand-logo-name">Code</h2>
              <span className="text-xs text-slate-400 font-medium" id="brand-logo-subtitle">Hospital Admin</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors border border-slate-100 bg-white shadow-xs`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          id="collapse-sidebar-toggle-btn"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-4 space-y-6">
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
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2'} rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-[#e6f4f1] text-[#007f6e]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                    id={`menu-item-${item.id}`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#007f6e]' : 'text-slate-400'} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

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
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2'} rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-[#e6f4f1] text-[#007f6e]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                    id={`menu-item-${item.id}`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#007f6e]' : 'text-slate-400'} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Profile & Logout (Bottom) */}
      <div className="p-3 border-t border-slate-50 space-y-3">
        <div className={`bg-slate-50 rounded-xl p-2.5 flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`} id="profile-card">
          <div className="w-10 h-10 bg-[#3b82f6] text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shrink-0" id="profile-card-initial">
            MH
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-800 truncate" id="profile-card-name">
                Muhammad Hamza
              </h4>
              <p className="text-[11px] text-slate-400 font-medium truncate" id="profile-card-role">
                Hospital Admin
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => alert('Log out clicked!')}
          className={`w-full flex items-center justify-center ${collapsed ? 'py-2.5 px-0' : 'gap-2 px-4 py-2'} bg-red-50 text-red-600 rounded-xl border border-red-100/30 font-medium text-xs hover:bg-red-100 transition-colors`}
          id="logout-btn"
          title="Log Out"
        >
          <LogOut size={14} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
