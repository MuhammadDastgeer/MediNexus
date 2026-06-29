import { useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu, Sparkles } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
  onMenuClick?: () => void;
  activeView?: ActiveView;
  onNavigate?: (view: ActiveView) => void;
}

export default function Header({ 
  loggedInUser = null, 
  onMenuClick, 
  activeView, 
  onNavigate 
}: HeaderProps) {
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.removeItem('theme');
    } catch (e) {
      console.warn("Could not clean up dark class or theme preference:", e);
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "MH";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const displayName = loggedInUser?.data?.name || "Admin";
  const displayRole = loggedInUser 
    ? (loggedInUser.role === 'patient' 
        ? "Patient Console" 
        : loggedInUser.role === 'doctor' 
            ? "Doctor Console" 
            : "Staff Console") 
    : "Admin Console";

  const initials = loggedInUser?.data?.name ? getInitials(loggedInUser.data.name) : "AD";

  // Check if current tab qualifies for specialized AI button (No dashboard, landing, ai-assistant, or sub-AI page itself)
  const showAIButton = false;

  const getAIButtonLabel = (view: string) => {
    const labels: Record<string, string> = {
      'appointments': 'Appointments AI',
      'consultation': 'Consultation AI',
      'billing': 'Billing AI',
      'inventory': 'Inventory AI',
      'ipd-wards': 'IPD & Wards AI',
      'staff': 'Staff Roster AI',
      'doctors': 'Doctors AI',
      'patients': 'Patients AI',
      'departments': 'Departments AI',
      'enquiries': 'Enquiries AI',
      'medical-tourism': 'Medical Tourism AI',
      'blogs': 'Blogs AI',
      'reports': 'Reports Analytics AI',
      'finance': 'Finance AI',
      'configure-hospital': 'Hospital Settings AI',
      'support': 'Support Desk AI'
    };
    return labels[view] || `${view.charAt(0).toUpperCase() + view.slice(1)} AI`;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 select-none shrink-0" id="app-header">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1 shrink-0"
            title="Toggle Sidebar Menu"
          >
            <Menu size={20} />
          </button>
        )}
        {/* Search Bar */}
        <div className="relative w-full max-w-[150px] sm:max-w-[240px] md:max-w-[320px]" id="search-bar-container">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search CarePoint database..."
            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-50/80 border border-slate-200/60 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all placeholder:text-slate-400"
            id="search-input"
          />
        </div>

        {/* Console Role Indicator (Vibrant Pill badge) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-teal-50/80 to-indigo-50/80 border border-teal-100/80 rounded-full px-3.5 py-1 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-teal-800 font-extrabold uppercase tracking-wider">{displayRole} Active</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4" id="header-user-actions">
        {/* Specialized Tab AI Assistant Button */}
        {showAIButton && onNavigate && (
          <button
            onClick={() => onNavigate(`${activeView}-ai` as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-850 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-103 active:scale-97"
            title={`Ask Assistant about ${activeView}`}
            id="header-tab-specialized-ai-btn"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
            <span className="hidden sm:inline">{getAIButtonLabel(activeView)}</span>
            <span className="sm:hidden">AI</span>
          </button>
        )}

        {/* Notification Bell */}
        <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl transition-all relative" id="bell-btn">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full animate-bounce" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-100 cursor-pointer hover:opacity-95" id="header-profile-dropdown">
          <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-xs font-extrabold shadow-sm shadow-teal-500/10" id="dropdown-initial">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-950 leading-tight" id="dropdown-name">{displayName}</h4>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded uppercase block mt-0.5 tracking-wider" id="dropdown-role">{displayRole}</span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
