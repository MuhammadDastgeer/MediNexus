import React, { useState } from 'react';
import { 
  Building2, 
  Activity, 
  Stethoscope, 
  Layers, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw, 
  MapPin, 
  BadgeCheck, 
  TrendingUp, 
  ChevronRight, 
  X, 
  CheckCircle, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Department, SubDepartment, Doctor } from '../types';

interface DepartmentsViewProps {
  departments: Department[];
  subDepartments: SubDepartment[];
  doctors: Doctor[];
  onAddDepartment: (dept: Omit<Department, 'id'> & { id?: string }) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
  onAddSubDepartment: (sub: Omit<SubDepartment, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSubDepartment: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onNavigate?: (view: any) => void;
}

export default function DepartmentsView({
  departments = [],
  subDepartments = [],
  doctors = [],
  onAddDepartment,
  onDeleteDepartment,
  onAddSubDepartment,
  onDeleteSubDepartment,
  onRefresh,
  onNavigate,
}: DepartmentsViewProps) {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'departments' | 'sub-departments' | 'overview'>('departments');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Forms State
  const [showDeptModal, setShowDeptModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [showSubModal, setShowSubModal] = useState<'add' | 'edit' | 'view' | null>(null);
  
  // Selection for edit/view
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubDepartment | null>(null);

  // Form Fields - Department
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    type: 'Clinical',
    location: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Form Fields - Sub Department
  const [subForm, setSubForm] = useState({
    departmentId: '',
    name: '',
    code: '',
    description: '',
    type: 'Clinical Division',
    location: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Unique list of types for filter
  const allTypes = Array.from(new Set([
    ...departments.map(d => d.type),
    ...subDepartments.map(s => s.type)
  ])).filter(Boolean);

  // Stats calculation
  const totalDepts = departments.length;
  const activeDepts = departments.filter(d => d.status === 'Active').length;
  const totalSubDepts = subDepartments.length;
  const totalDocsCount = doctors.length;

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Open Add Dept Modal
  const openAddDept = () => {
    setDeptForm({
      name: '',
      code: '',
      description: '',
      type: 'Clinical',
      location: '',
      status: 'Active'
    });
    setSelectedDept(null);
    setShowDeptModal('add');
  };

  // Open Edit Dept Modal
  const openEditDept = (dept: Department) => {
    setSelectedDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      type: dept.type,
      location: dept.location,
      status: dept.status
    });
    setShowDeptModal('edit');
  };

  // Open View Dept Modal
  const openViewDept = (dept: Department) => {
    setSelectedDept(dept);
    setShowDeptModal('view');
  };

  // Open Add Sub Dept Modal
  const openAddSub = () => {
    setSubForm({
      departmentId: departments[0]?.id || '',
      name: '',
      code: '',
      description: '',
      type: 'Clinical Division',
      location: '',
      status: 'Active'
    });
    setSelectedSub(null);
    setShowSubModal('add');
  };

  // Open Edit Sub Dept Modal
  const openEditSub = (sub: SubDepartment) => {
    setSelectedSub(sub);
    setSubForm({
      departmentId: sub.departmentId,
      name: sub.name,
      code: sub.code,
      description: sub.description,
      type: sub.type,
      location: sub.location,
      status: sub.status
    });
    setShowSubModal('edit');
  };

  // Open View Sub Dept Modal
  const openViewSub = (sub: SubDepartment) => {
    setSelectedSub(sub);
    setShowSubModal('view');
  };

  // Submit Dept Form
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) { alert("Department name is required."); return; }
    if (!deptForm.code.trim()) { alert("Department code is required."); return; }
    if (!deptForm.description.trim()) { alert("Department description is required."); return; }
    if (!deptForm.type) { alert("Department type is required."); return; }
    if (!deptForm.location.trim()) { alert("Department location/building is required."); return; }
    if (!deptForm.status) { alert("Department status is required."); return; }

    await onAddDepartment({
      ...deptForm,
      ...(selectedDept ? { id: selectedDept.id } : {})
    });
    setShowDeptModal(null);
  };

  // Submit Sub Dept Form
  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.departmentId) { alert("Parent Department selection is required."); return; }
    if (!subForm.name.trim()) { alert("Sub Department name is required."); return; }
    if (!subForm.code.trim()) { alert("Sub Department code is required."); return; }
    if (!subForm.description.trim()) { alert("Sub Department description is required."); return; }
    if (!subForm.type) { alert("Sub Department type category is required."); return; }
    if (!subForm.location.trim()) { alert("Sub Department room/wing location is required."); return; }
    if (!subForm.status) { alert("Sub Department status is required."); return; }

    await onAddSubDepartment({
      ...subForm,
      ...(selectedSub ? { id: selectedSub.id } : {})
    });
    setShowSubModal(null);
  };

  // Filtered lists
  const filteredDepartments = departments.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'All' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredSubDepartments = subDepartments.filter(s => {
    const parentDept = departments.find(d => d.id === s.departmentId);
    const parentNameStr = parentDept ? parentDept.name : '';

    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      parentNameStr.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50/50 space-y-6 flex flex-col select-none" id="departments-container">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="departments-header-row">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Departments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hospital clinical wings, service stations, and medical divisions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap" id="departments-header-actions">
          {onNavigate && (
            <button
              onClick={() => onNavigate('departments-ai')}
              type="button"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#007f6e] hover:from-emerald-700 hover:to-[#006657] text-[#ffffff] px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition duration-150 cursor-pointer"
              id="trigger-departments-ai"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>Departments AI</span>
            </button>
          )}

          <button 
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 transition duration-150"
            id="refresh-departments-btn"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            type="button"
            onClick={openAddDept}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007f6e] hover:bg-[#006658] rounded-lg shadow-sm transition duration-150"
            id="add-department-btn"
          >
            <Plus size={14} />
            <span>Department</span>
          </button>

          <button 
            type="button"
            onClick={openAddSub}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#007f6e] bg-emerald-55/40 border border-[#007f6e]/30 hover:bg-emerald-50 rounded-lg shadow-sm transition duration-150"
            id="add-sub-department-btn"
          >
            <Plus size={14} />
            <span>Sub-Department</span>
          </button>
        </div>
      </div>

      {/* Top statistical status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="departments-stats-grid">
        
        {/* Card 1: Total Departments */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="stat-total-depts">
          <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-800 block leading-tight">{totalDepts}</span>
            <span className="text-[11px] text-slate-400 font-medium block">Total Departments</span>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="stat-active-depts">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-800 block leading-tight">{activeDepts}</span>
            <span className="text-[11px] text-slate-400 font-medium block">Active</span>
          </div>
        </div>

        {/* Card 3: Total Doctors */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="stat-total-doctors">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-800 block leading-tight">{totalDocsCount}</span>
            <span className="text-[11px] text-slate-400 font-medium block">Total Doctors</span>
          </div>
        </div>

        {/* Card 4: Sub-Departments */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm" id="stat-sub-departments">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Layers size={21} />
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-800 block leading-tight">{totalSubDepts}</span>
            <span className="text-[11px] text-slate-400 font-medium block">Sub-Departments</span>
          </div>
        </div>

      </div>

      {/* Tabs list for navigation */}
      <div className="flex border-b border-slate-200" id="departments-view-tabs">
        <button
          onClick={() => { setActiveTab('departments'); setSearch(''); }}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition duration-200 -mb-px ${
            activeTab === 'departments' 
              ? 'border-[#007f6e] text-[#007f6e]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="tab-departments-btn"
        >
          Clinical Departments ({departments.length})
        </button>
        <button
          onClick={() => { setActiveTab('sub-departments'); setSearch(''); }}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition duration-200 -mb-px ${
            activeTab === 'sub-departments' 
              ? 'border-[#007f6e] text-[#007f6e]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="tab-sub-departments-btn"
        >
          Sub-Departments ({subDepartments.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition duration-200 -mb-px ${
            activeTab === 'overview' 
              ? 'border-[#007f6e] text-[#007f6e]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="tab-overview-btn"
        >
          Interactive Overview
        </button>
      </div>

      {/* Main functional views */}
      {activeTab !== 'overview' && (
        <div className="space-y-4" id="departments-list-view">
          
          {/* Search, Filter, & Count Row */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs" id="search-filters-panel">
            
            {/* Search Input */}
            <div className="relative flex-1" id="search-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'departments'
                    ? "Search by name, code, location or description..."
                    : "Search by sub-dept name, code, location, or parent..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]/70 transition"
              />
            </div>

            {/* Selection dropdown filters */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0" id="filters-wrapper">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-600 focus:outline-none focus:border-[#007f6e]"
                >
                  <option value="All">All Types</option>
                  {allTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-600 focus:outline-none focus:border-[#007f6e]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
                <button
                  onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }}
                  className="text-xs text-slate-400 hover:text-red-500 font-semibold px-1 py-0.5 ml-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results count label */}
            <div className="text-[11px] font-semibold text-slate-500" id="results-count-badge">
              {activeTab === 'departments' 
                ? `${filteredDepartments.length} of ${departments.length} departments`
                : `${filteredSubDepartments.length} of ${subDepartments.length} sub-departments`
              }
            </div>

          </div>

          {/* Tab 1: Departments cards list */}
          {activeTab === 'departments' && (
            <>
              {filteredDepartments.length === 0 ? (
                <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center space-y-3" id="no-depts-found">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Building2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-700">No departments found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Could not find matching results. Try altering filters or add a new clinical unit.
                    </p>
                  </div>
                  <button
                    onClick={openAddDept}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#007f6e] hover:bg-[#006658] rounded-lg transition"
                  >
                    <Plus size={13} />
                    <span>Create Department</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="departments-grid">
                  {filteredDepartments.map((dept) => {
                    const linkedSubs = subDepartments.filter(s => s.departmentId === dept.id);
                    const linkedDoctors = doctors.filter(doc => doc.department === dept.name || (doc.specialization && doc.specialization.toLowerCase() === dept.name.toLowerCase()));

                    return (
                      <div 
                        key={dept.id} 
                        className="bg-white border border-slate-200/75 rounded-xl p-5 space-y-4 shadow-xs relative hover:border-slate-300 hover:shadow-sm transition duration-200 group"
                        id={`dept-card-${dept.id}`}
                      >
                        {/* Header row in card */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-800 leading-tight block truncate max-w-[150px]" title={dept.name}>
                                  {dept.name}
                                </h3>
                                <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-tight bg-slate-100 text-slate-500 rounded">
                                  {dept.code}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">{dept.type}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            dept.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {dept.status}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 line-clamp-2 h-8 leading-snug">
                          {dept.description || "No description provided for this hospital division."}
                        </p>

                        {/* Info list */}
                        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/60 rounded-lg text-[11px] border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-tight">Location</span>
                            <div className="flex items-center gap-1 mt-0.5 text-slate-700 font-semibold">
                              <MapPin size={10} className="text-[#007f6e]" />
                              <span className="truncate max-w-[100px]">{dept.location || "N/A"}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-tight">Assigned Doctors</span>
                            <span className="text-slate-750 font-bold block mt-0.5">{linkedDoctors.length} Doctors</span>
                          </div>
                        </div>

                        {/* Sub departments listing indicators */}
                        <div>
                          <div className="flex items-center justify-between pointer-events-none mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Sub-departments ({linkedSubs.length})
                            </span>
                          </div>
                          {linkedSubs.length === 0 ? (
                            <span className="text-[10px] italic text-slate-400 block">No sub-departments defined yet.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {linkedSubs.map(s => (
                                <span 
                                  key={s.id}
                                  onClick={(e) => { e.stopPropagation(); openViewSub(s); }}
                                  className="text-[9px] text-[#007f6e] bg-[#e6f4f1]/50 border border-[#007f6e]/10 py-0.5 px-1.5 rounded cursor-pointer hover:bg-[#e6f4f1]"
                                  title="View details"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card bottom action bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <button
                            onClick={() => openViewDept(dept)}
                            className="text-[11px] font-bold text-slate-500 hover:text-[#007f6e] flex items-center gap-1 transition"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditDept(dept)}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition"
                              title="Edit department"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${dept.name}? This will also remove associated sub-departments.`)) {
                                  onDeleteDepartment(dept.id);
                                }
                              }}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-red-55 text-slate-500 hover:text-red-600 flex items-center justify-center transition"
                              title="Delete department"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab 2: Sub-departments cards list */}
          {activeTab === 'sub-departments' && (
            <>
              {filteredSubDepartments.length === 0 ? (
                <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center space-y-3" id="no-subs-found">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Layers size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-700">No sub-departments found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Create clinical subdivisions and link them to parent clinical wings.
                    </p>
                  </div>
                  <button
                    onClick={openAddSub}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#007f6e] hover:bg-[#006658] rounded-lg transition"
                  >
                    <Plus size={13} />
                    <span>Create Sub-Department</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="sub-departments-grid">
                  {filteredSubDepartments.map((sub) => {
                    const parent = departments.find(d => d.id === sub.departmentId);

                    return (
                      <div 
                        key={sub.id} 
                        className="bg-white border border-slate-200/75 rounded-xl p-5 space-y-4 shadow-xs relative hover:border-slate-300 hover:shadow-sm transition duration-200 group flex flex-col justify-between h-56"
                        id={`sub-card-${sub.id}`}
                      >
                        <div className="space-y-3">
                          {/* Top Row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Layers size={14} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[130px]">{sub.name}</h4>
                                  <span className="text-[9px] uppercase font-bold tracking-tight text-slate-400">
                                    ({sub.code})
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">{sub.type || "Clinical Room"}</span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              sub.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {sub.status}
                            </span>
                          </div>

                          {/* Parent Department */}
                          <div className="text-[11px] flex items-center gap-1 text-slate-500 font-medium">
                            <span className="text-slate-400">Parent Wing:</span>
                            <span className="text-[#007f6e] font-semibold flex items-center gap-0.5">
                              {parent ? parent.name : "Unknown Department"}
                              <ChevronRight size={11} className="inline text-slate-300" />
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                            {sub.description || "Divisional specialized operations & tests."}
                          </p>

                          {/* Location */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <MapPin size={11} className="text-slate-400" />
                            <span className="font-semibold text-slate-700">{sub.location || "Main wing"}</span>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-105">
                          <button
                            onClick={() => openViewSub(sub)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-[#007f6e] flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>View details</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditSub(sub)}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition"
                              title="Edit sub-department"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${sub.name}?`)) {
                                  onDeleteSubDepartment(sub.id);
                                }
                              }}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-red-55 text-slate-500 hover:text-red-600 flex items-center justify-center transition"
                              title="Delete sub-department"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* Tab 3: Interactive Overview Section */}
      {activeTab === 'overview' && (
        <div className="space-y-6" id="departments-overview-tab">
          
          {/* Welcome Dashboard Block */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <BadgeCheck size={18} className="text-[#007f6e]" />
                Hospital Infrastructure Directory
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl">
                Explore parent medicine fields, diagnostic labs, critical wings, and their nested sub-departments at a glances. Ensure correct room numbers and assignments.
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-semibold px-4 py-2 bg-slate-50 rounded-lg">
              <div className="text-center">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Total Hubs</span>
                <span className="text-slate-800 text-sm font-bold">{departments.length}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Sub Stations</span>
                <span className="text-[#007f6e] text-sm font-bold">{subDepartments.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-tree-panel">
            
            {/* Visual Department Tree mapping list */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 lg:col-span-2 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nested Division Mapping</h4>
              
              {departments.length === 0 ? (
                <p className="text-xs text-slate-400">No departments configured to map.</p>
              ) : (
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-2">
                  {departments.map((dept) => {
                    const linkedSubs = subDepartments.filter(s => s.departmentId === dept.id);

                    return (
                      <div key={dept.id} className="border border-slate-100 rounded-lg p-3.5 hover:bg-slate-50/50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#007f6e]" />
                            <span className="text-xs font-bold text-slate-800">{dept.name}</span>
                            <span className="text-[10px] text-slate-400">({dept.code} • {dept.type})</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {linkedSubs.length} sub-depts
                          </span>
                        </div>

                        {linkedSubs.length > 0 ? (
                          <div className="mt-2.5 ml-4 pl-3.5 border-l-2 border-slate-100 space-y-2">
                            {linkedSubs.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-2 text-[11px]">
                                <ChevronRight size={10} className="text-[#007f6e]/70" />
                                <span className="font-semibold text-slate-700">{sub.name}</span>
                                <span className="text-slate-400 text-[10px]">({sub.code})</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-slate-400 text-[10px]">{sub.location}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic ml-4 mt-1">No nested subdivisions assigned.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Metrics Widgets */}
            <div className="space-y-4">
              
              {/* Type distribution summary */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wings by Category</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Clinical Medicine</span>
                      <span>{departments.filter(d => d.type === 'Clinical').length} wings</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#007f6e] h-full" 
                        style={{ width: `${departments.length > 0 ? (departments.filter(d => d.type === 'Clinical').length / departments.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Lab Testing & Diagnostics</span>
                      <span>{subDepartments.filter(s => s.type?.toLowerCase().includes('lab')).length} divisions</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full" 
                        style={{ width: `${subDepartments.length > 0 ? (subDepartments.filter(s => s.type?.toLowerCase().includes('lab')).length / subDepartments.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Critical / Emergency ICU</span>
                      <span>{subDepartments.filter(s => s.type?.toLowerCase().includes('icu') || s.type?.toLowerCase().includes('emergency')).length} stations</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full" 
                        style={{ width: `${subDepartments.length > 0 ? (subDepartments.filter(s => s.type?.toLowerCase().includes('icu') || s.type?.toLowerCase().includes('emergency')).length / subDepartments.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status breakdown card */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Status Ratio</h4>
                <div className="flex items-center justify-around py-2">
                  <div className="text-center">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Active</span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      {departments.filter(d => d.status === 'Active').length + subDepartments.filter(s => s.status === 'Active').length}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-slate-100" />
                  <div className="text-center">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Inactive</span>
                    <span className="text-xl font-extrabold text-slate-400">
                      {departments.filter(d => d.status === 'Inactive').length + subDepartments.filter(s => s.status === 'Inactive').length}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* DEPARTMENT FORM MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition" id="dept-modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150" id="dept-modal-box">
            
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#e6f4f1]/40">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#007f6e]" />
                <h3 className="text-sm font-bold text-slate-800">
                  {showDeptModal === 'add' ? 'Add Hospital Department' : showDeptModal === 'edit' ? 'Edit Department details' : 'Department specifications'}
                </h3>
              </div>
              <button 
                onClick={() => setShowDeptModal(null)}
                className="text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal content body */}
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              
              {showDeptModal === 'view' && selectedDept ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedDept.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Code</span>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded select-all inline-block mt-0.5">
                        {selectedDept.code}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Type Category</span>
                    <span className="text-slate-700 font-semibold">{selectedDept.type}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Location Location</span>
                    <span className="text-slate-700 font-semibold">{selectedDept.location || "Not assigned"}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Description</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed text-[11px] whitespace-pre-line">
                      {selectedDept.description || "No description set for this wing."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-tight">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedDept.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-450'
                    }`}>
                      {selectedDept.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight mb-1.5">Connected Sub-divisions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {subDepartments.filter(s => s.departmentId === selectedDept.id).length === 0 ? (
                        <span className="text-slate-400 italic">None registered.</span>
                      ) : (
                        subDepartments.filter(s => s.departmentId === selectedDept.id).map(s => (
                          <span key={s.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px]">
                            {s.name} ({s.code})
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Department Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Department Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Cardiology, Neurology, Orthopedics"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-850"
                    />
                  </div>

                  {/* Code */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Department Code (Abbreviation) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. CARD, NEU, PED"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({...deptForm, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] font-mono text-slate-850"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Type Category</label>
                    <select
                      value={deptForm.type}
                      onChange={(e) => setDeptForm({...deptForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-850"
                    >
                      <option value="Clinical">Clinical</option>
                      <option value="Non-Clinical">Non-Clinical</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Diagnostics">Diagnostics</option>
                      <option value="ICU / High Care">ICU / High Care</option>
                      <option value="Outpatient">Outpatient</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Location / Room Allocation</label>
                    <input 
                      type="text"
                      placeholder="e.g. Ground Floor, Wing B room 101"
                      value={deptForm.location}
                      onChange={(e) => setDeptForm({...deptForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-850"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Write brief purpose or medical wings specifications..."
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({...deptForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-850"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Active status</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold">
                        <input
                          type="radio"
                          name="dept_status"
                          value="Active"
                          checked={deptForm.status === 'Active'}
                          onChange={() => setDeptForm({...deptForm, status: 'Active'})}
                          className="text-[#007f6e] focus:ring-[#007f6e]"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold">
                        <input
                          type="radio"
                          name="dept_status"
                          value="Inactive"
                          checked={deptForm.status === 'Inactive'}
                          onChange={() => setDeptForm({...deptForm, status: 'Inactive'})}
                          className="text-slate-400 focus:ring-slate-300"
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal action bar footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  Close
                </button>
                {showDeptModal !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#007f6e] hover:bg-[#006658] rounded-lg shadow-sm"
                  >
                    {showDeptModal === 'add' ? 'Save details' : 'Save Changes'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SUB-DEPARTMENT FORM MODAL */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition" id="sub-modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150" id="sub-modal-box">
            
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/40">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  {showSubModal === 'add' ? 'Add Hospital Sub-Department' : showSubModal === 'edit' ? 'Edit Sub-Department details' : 'Sub-Department specifications'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSubModal(null)}
                className="text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal content body */}
            <form onSubmit={handleSubSubmit} className="p-6 space-y-4">
              
              {showSubModal === 'view' && selectedSub ? (
                <div className="space-y-4 text-xs">
                  
                  {/* Parent department linkage view */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                    <Building2 size={13} className="text-[#007f6e]" />
                    <span className="text-slate-400 font-semibold">Linked Parent:</span>
                    <span className="text-[#007f6e] font-bold">
                      {departments.find(d => d.id === selectedSub.departmentId)?.name || "Unknown Department"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedSub.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Code</span>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded select-all inline-block mt-0.5">
                        {selectedSub.code}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Division Type</span>
                    <span className="text-slate-700 font-semibold">{selectedSub.type}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Location Location</span>
                    <span className="text-slate-700 font-semibold">{selectedSub.location || "Not assigned"}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-tight">Description</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed text-[11px] whitespace-pre-line">
                      {selectedSub.description || "No specific guidelines provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-tight">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedSub.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-450'
                    }`}>
                      {selectedSub.status}
                    </span>
                  </div>

                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  
                  {/* Select Parent Department * MUST is shown */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Parent Department *</label>
                    <select
                      required
                      value={subForm.departmentId}
                      onChange={(e) => setSubForm({...subForm, departmentId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-850"
                    >
                      <option value="" disabled>--- Select Department ---</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Specify which clinical department or wing this subdivision belongs to.</p>
                  </div>

                  {/* Sub Department Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Sub-Department Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. ECO-Cardiography, Neonatology Unit, Trauma ICU"
                      value={subForm.name}
                      onChange={(e) => setSubForm({...subForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-850"
                    />
                  </div>

                  {/* Code */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Sub-Department Code *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. ECO, NEO, CICU"
                      value={subForm.code}
                      onChange={(e) => setSubForm({...subForm, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-slate-850"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Type Category</label>
                    <input 
                      type="text"
                      placeholder="e.g. Lab Testing, Emergency, Outpatient Consultation"
                      value={subForm.type}
                      onChange={(e) => setSubForm({...subForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-850"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Location / Room Allocation</label>
                    <input 
                      type="text"
                      placeholder="e.g. Room 103, Wing A-1"
                      value={subForm.location}
                      onChange={(e) => setSubForm({...subForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-850"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Write brief purpose or medical wings specifications..."
                      value={subForm.description}
                      onChange={(e) => setSubForm({...subForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-850"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Active status</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold">
                        <input
                          type="radio"
                          name="sub_status"
                          value="Active"
                          checked={subForm.status === 'Active'}
                          onChange={() => setSubForm({...subForm, status: 'Active'})}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold">
                        <input
                          type="radio"
                          name="sub_status"
                          value="Inactive"
                          checked={subForm.status === 'Inactive'}
                          onChange={() => setSubForm({...subForm, status: 'Inactive'})}
                          className="text-slate-400 focus:ring-slate-300"
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal action bar footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  Close
                </button>
                {showSubModal !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                  >
                    {showSubModal === 'add' ? 'Save details' : 'Save Changes'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
