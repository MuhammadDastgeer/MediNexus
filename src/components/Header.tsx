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
  const showAIButton = activeView && 
    activeView !== 'landing' && 
    activeView !== 'dashboard' && 
    activeView !== 'ai-assistant' && 
    !activeView.endsWith('-ai');

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
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100/80 rounded-lg focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all placeholder:text-slate-400"
            id="search-input"
          />
        </div>

        {/* Dynamic Ask AI Button */}
        {showAIButton && (
          <button
            onClick={() => onNavigate && onNavigate(`${activeView}-ai` as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#007f6e] to-[#047857] text-white hover:from-[#0f766e] hover:to-[#065f46] hover:scale-[1.02] active:scale-95 transition-all rounded-lg text-xs font-semibold shadow-xs cursor-pointer select-none"
            id="header-tab-specific-ai-btn"
            title={`Ask custom AI questions about ${getAIButtonLabel(activeView)}`}
          >
            <Sparkles size={13} className="animate-pulse" />
            <span>{getAIButtonLabel(activeView)}</span>
          </button>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4" id="header-user-actions">
        {/* Notification Bell */}
        <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg transition-colors relative" id="bell-btn">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-white" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-100 cursor-pointer hover:opacity-95" id="header-profile-dropdown">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold" id="dropdown-initial">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-semibold text-slate-800 leading-tight" id="dropdown-name">{displayName}</h4>
            <span className="text-[10px] text-slate-400 font-medium" id="dropdown-role">{displayRole}</span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
