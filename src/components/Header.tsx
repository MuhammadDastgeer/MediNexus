import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
}

export default function Header({ loggedInUser = null }: HeaderProps) {
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

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 select-none" id="app-header">
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-80" id="search-bar-container">
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
