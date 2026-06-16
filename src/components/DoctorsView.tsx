import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Stethoscope, 
  ArrowRight, 
  Users, 
  CheckCircle, 
  Paperclip, 
  Navigation, 
  IndianRupee, 
  Briefcase, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Activity, 
  Check, 
  X, 
  Filter, 
  Download,
  AlertCircle,
  User,
  Shield,
  CreditCard,
  Send,
  Building
} from 'lucide-react';
import { Doctor } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface DoctorsViewProps {
  doctors: Doctor[];
  onAddDoctor: (doc: Omit<Doctor, 'id'>) => void;
  onToggleStatus: (id: string) => void;
  onUpdateDoctor: (id: string, fields: Partial<Doctor>) => void;
  onDeleteDoctor: (id: string) => void;
  onNavigate?: (view: any) => void;
}

export default function DoctorsView({ 
  doctors, 
  onAddDoctor, 
  onToggleStatus,
  onUpdateDoctor,
  onDeleteDoctor,
  onNavigate
}: DoctorsViewProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'overview'>('overview');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  
  // Custom Alerts / Messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Field State Variables (Image 3 - 6)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    address: '',
    specialization: '',
    qualification: '',
    experience: '0',
    medicalRegNo: '',
    licenseNumber: '',
    department: '',
    consultationFee: '500',
    followUpFee: '300',
    isActive: true,
    availableForBooking: true
  });

  // Directory Search and Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [dutyFilter, setDutyFilter] = useState('All');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAddForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      gender: '',
      dob: '',
      bloodGroup: '',
      address: '',
      specialization: 'Cardiology',
      qualification: '',
      experience: '0',
      medicalRegNo: '',
      licenseNumber: '',
      department: 'Cardiology',
      consultationFee: '500',
      followUpFee: '300',
      isActive: true,
      availableForBooking: true
    });
    setIsEditingId(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (doc: Doctor) => {
    setFormData({
      name: doc.name || '',
      email: doc.email || '',
      password: doc.password || '',
      phone: doc.phone || '',
      gender: doc.gender || '',
      dob: doc.dob || '',
      bloodGroup: doc.bloodGroup || '',
      address: doc.address || '',
      specialization: doc.specialization || 'Cardiology',
      qualification: doc.qualification || '',
      experience: String(doc.experience || 0),
      medicalRegNo: doc.medicalRegNo || '',
      licenseNumber: doc.licenseNumber || '',
      department: doc.department || doc.specialization || 'Cardiology',
      consultationFee: String(doc.consultationFee || doc.fee || 500),
      followUpFee: String(doc.followUpFee || 300),
      isActive: doc.isActive !== false,
      availableForBooking: doc.availableForBooking !== false
    });
    setIsEditingId(doc.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      triggerToast('Doctor Full Name is required.');
      return;
    }
    if (!formData.email) {
      triggerToast('Doctor Email Address is required.');
      return;
    }

    const payload: Omit<Doctor, 'id'> = {
      name: formData.name,
      specialization: formData.specialization || 'General',
      phone: formData.phone || '',
      email: formData.email,
      password: formData.password,
      gender: formData.gender,
      dob: formData.dob,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      qualification: formData.qualification,
      experience: Number(formData.experience || 0),
      medicalRegNo: formData.medicalRegNo,
      licenseNumber: formData.licenseNumber,
      department: formData.department || formData.specialization || 'General Medicine',
      consultationFee: Number(formData.consultationFee || 500),
      followUpFee: Number(formData.followUpFee || 300),
      status: formData.isActive ? 'On Duty' : 'Off Duty',
      isActive: formData.isActive,
      availableForBooking: formData.availableForBooking
    };

    if (isEditingId) {
      onUpdateDoctor(isEditingId, {
        ...payload,
        id: isEditingId
      });
      triggerToast(`Doctor ${formData.name} updated successfully!`);
    } else {
      onAddDoctor(payload);
      triggerToast(`Doctor ${formData.name} enrolled successfully!`);
    }

    setShowForm(false);
    setIsEditingId(null);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the clinical record for ${name}?`)) {
      onDeleteDoctor(id);
      triggerToast(`Doctor ${name} has been removed.`);
    }
  };

  // Metrics calculation
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.status === 'On Duty' || d.isActive === true).length;
  const availableToBook = doctors.filter(d => d.availableForBooking !== false && (d.status === 'On Duty' || d.isActive === true)).length;
  const portalAccessSent = doctors.filter(d => d.email && d.email.trim() !== '').length;

  const getFees = () => {
    const validFees = doctors.map(d => Number(d.consultationFee || d.fee || 0)).filter(f => f > 0);
    if (validFees.length === 0) return { avg: 0, min: 0, max: 0 };
    const sum = validFees.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / validFees.length),
      min: Math.min(...validFees),
      max: Math.max(...validFees)
    };
  };
  const fees = getFees();

  // Department Count breakdown from actual list
  const departmentsList = ['Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology'];
  const getDeptCount = (dept: string) => {
    return doctors.filter(d => (d.department || d.specialization || '').toLowerCase() === dept.toLowerCase()).length;
  };

  // Recent additions
  const recentDoctors = [...doctors].slice(-3).reverse();

  // Doctor on duty lists
  const dutyDoctorsToday = doctors.filter(d => d.status === 'On Duty' || d.isActive === true);

  // Search filter
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
                          (doc.phone && doc.phone.includes(search));
    const matchesDept = deptFilter === 'All' ? true : (doc.department || doc.specialization || '').toLowerCase() === deptFilter.toLowerCase();
    const matchesDuty = dutyFilter === 'All' ? true : (dutyFilter === 'Active' ? (doc.status === 'On Duty') : (doc.status === 'Off Duty'));
    return matchesSearch && matchesDept && matchesDuty;
  });

  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (filteredDoctors.length === 0) {
      triggerToast('No doctor profiles to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Specialization', 'Dept', 'Contact', 'Email', 'Consultation Fee', 'Status'];
    const keys = ['id', 'name', 'specialization', 'department', 'phone', 'email', 'consultationFee', 'status'];
    const filename = `doctors_specialists_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filteredDoctors, headers, keys, filename);
      triggerToast('Specialist Roster exported smoothly as CSV.');
    } else if (format === 'Excel') {
      downloadExcel(filteredDoctors, headers, keys, filename);
      triggerToast('Specialist Roster exported smoothly as Excel.');
    } else if (format === 'Word') {
      downloadWord(filteredDoctors, headers, keys, filename, 'Hospital Medical Board');
      triggerToast('Specialist Roster exported smoothly as Word document.');
    } else if (format === 'PDF') {
      downloadPDFFile(filteredDoctors, headers, keys, filename, 'Hospital Specialist Roll');
      triggerToast('Specialist Roster exported smoothly as PDF / HTML.');
    }
  };

  const handleSendAllInvites = () => {
    triggerToast('Sending credentials invite link to all on-boarded medical specialists.');
  };

  return (
    <div className="p-6 h-full overflow-y-auto select-none space-y-6 bg-[#f8fafc]/90" id="doctors-unified-view">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#007f6e] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce border border-emerald-500/35 text-xs font-semibold" id="doctors-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Tabs Switch & Header Wrapper */}
      {!showForm && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2">
          {/* Pills Tabs Switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit" id="doctors-tabs-container">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#007f6e] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-overview-btn"
            >
              <Activity size={14} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-[#007f6e] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-roster-btn"
            >
              <Stethoscope size={14} />
              <span>Doctors</span>
            </button>
          </div>

          <div>
             <span className="text-slate-400 text-xs font-medium">
               {activeTab === 'overview' 
                 ? 'Summary of doctor distribution, department breakdown, on-duty stats, and recent additions'
                 : 'Manage doctor profiles, schedules and credentials'
               }
             </span>
          </div>
        </div>
      )}

      {/* ======================= CASE 1: MULTI-PART ENROLL / EDIT FORM (IMAGE 3 - 6) ======================= */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto" id="multi-part-doctor-form">
          
          {/* Form Header block representation */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center justify-center border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 transition-colors"
              id="back-to-doctors-btn"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back to Doctors
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {isEditingId ? 'Edit Doctor Profile' : 'Add New Doctor'}
              </h1>
              <p className="text-[11px] text-slate-400">Fill in all required information below</p>
            </div>
          </div>

          {/* SECTION 1: Basic Information (Image 3) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="form-basic-info-panel">
            <div className="px-5 py-4 border-b border-slate-50 bg-[#e6f4f1]/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <User size={16} />
              </div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide uppercase">Basic Information</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. John Smith"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-name"
                  />
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@hospital.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-email"
                  />
                </div>

                {/* Password Box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-password"
                  />
                </div>

                {/* Contact phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-phone"
                  />
                </div>

                {/* Gender select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-gender"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-dob"
                  />
                </div>

                {/* Blood Group select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-blood"
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

              </div>

              {/* Home Address textarea */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address..."
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                  id="doctor-input-address"
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: Professional Information (Image 4) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="form-professional-info-panel">
            <div className="px-5 py-4 border-b border-slate-50 bg-[#e6f4f1]/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide uppercase">Professional Information</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Specialization */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Cardiology, Ortho"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-specialization"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD, MS"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-qualification"
                  />
                </div>

                {/* Experience in Years */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-experience"
                  />
                </div>

                {/* Medical Registration Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Medical Registration No.
                  </label>
                  <input
                    type="text"
                    value={formData.medicalRegNo}
                    onChange={(e) => setFormData({ ...formData, medicalRegNo: e.target.value })}
                    placeholder="e.g. MCI-12345"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-reg"
                  />
                </div>

              </div>

              {/* License Number (Full width) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. LIC-67890"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                  id="doctor-input-license"
                />
              </div>

            </div>
          </div>

          {/* SECTION 3: Department & Fees (Image 5) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="form-fees-panel">
            <div className="px-5 py-4 border-b border-slate-50 bg-[#e6f4f1]/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <IndianRupee size={16} />
              </div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide uppercase">Department & Fees</h3>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Department Option */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 transition-all focus:border-[#007f6e] focus:outline-none"
                  id="doctor-input-dept"
                >
                  <option value="">— Select Department —</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Consultation Fee */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Consultation Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-fee"
                  />
                </div>

                {/* Follow-up Fee */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Follow-up Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.followUpFee}
                    onChange={(e) => setFormData({ ...formData, followUpFee: e.target.value })}
                    placeholder="300"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 border border-slate-200 rounded-lg transition-all focus:border-[#007f6e] focus:outline-none"
                    id="doctor-input-followup-fee"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* SECTION 4: Status Settings (Image 6) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="form-status-panel">
            <div className="px-5 py-4 border-b border-slate-50 bg-[#e6f4f1]/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-wide uppercase">Status Settings</h3>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Toggle 1: Active Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/30 transition-all">
                <div>
                  <span className="font-semibold text-xs text-slate-700 block">Active Status</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Doctor can accept and manage appointments</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-all ${
                    formData.isActive ? 'bg-[#007f6e]' : 'bg-slate-300'
                  }`}
                  id="toggle-active-status"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Available for Booking */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/30 transition-all">
                <div>
                  <span className="font-semibold text-xs text-slate-700 block">Available for Booking</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Show in available list for new bookings</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, availableForBooking: !formData.availableForBooking })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-all ${
                    formData.availableForBooking ? 'bg-[#007f6e]' : 'bg-slate-300'
                  }`}
                  id="toggle-available-booking"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    formData.availableForBooking ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Form Action Buttons (Cancel / Add Doctor) */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsEditingId(null);
              }}
              className="px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-2xs transition-all"
              id="cancel-doctor-form-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#007f6e] hover:bg-[#006657] text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
              id="submit-doctor-form-btn"
            >
              <Check size={14} />
              {isEditingId ? 'Save Changes' : 'Add Doctor'}
            </button>
          </div>

        </form>
      ) : (
        /* ============================ MAIN LAYOUT WITH TABS ============================ */
        <>
          
          {/* ======================= TAB CASE A: OVERVIEW TAB (IMAGE 1) ======================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6" id="doctors-overview-pane">
              
              {/* Top Banner Box */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center border border-emerald-500/10">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-md">Doctors Overview</h2>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {totalDoctors} registered • {activeDoctors} active • {availableToBook} available for booking
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('roster')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all"
                    id="manage-doctors-shortcut"
                  >
                    Manage Doctors
                  </button>
                  <button
                    onClick={handleOpenAddForm}
                    className="bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    id="add-doc-shortcut"
                  >
                    <Plus size={14} />
                    <span>Add New Doctor</span>
                  </button>
                </div>
              </div>

              {/* Row of 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-counter-cards">
                
                {/* 1. Total Doctors Card */}
                <div className="bg-[#f0e7ff]/30 p-5 rounded-2xl border border-purple-100/50 flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-3xs border border-purple-100/20">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="block text-[#7c3aed] text-lg font-extrabold leading-none">{totalDoctors}</span>
                    <span className="block text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Total Doctors</span>
                  </div>
                </div>

                {/* 2. Active Doctors Card */}
                <div className="bg-[#e0f2fe]/40 p-5 rounded-2xl border border-sky-100/50 flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-sky-600 shadow-3xs border border-sky-100/20">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="block text-sky-700 text-lg font-extrabold leading-none">{activeDoctors}</span>
                    <span className="block text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Active Doctors</span>
                  </div>
                </div>

                {/* 3. Available for booking */}
                <div className="bg-[#dcfce7]/30 p-5 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-3xs border border-emerald-100/20">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <span className="block text-[#00a85a] text-lg font-extrabold leading-none">{availableToBook}</span>
                    <span className="block text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Available to Book</span>
                  </div>
                </div>

                {/* 4. Portal Access */}
                <div className="bg-[#fef9c3]/30 p-5 rounded-2xl border border-amber-100/50 flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-3xs border border-amber-100/20">
                    <Send size={18} />
                  </div>
                  <div>
                    <span className="block text-[#b45309] text-lg font-extrabold leading-none">{portalAccessSent}</span>
                    <span className="block text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Portal Access Sent</span>
                  </div>
                </div>

              </div>

              {/* Two Column Layout: Doctors by Dept vs Recently Onboarded */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Left Panel: Doctors By Department */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Doctors by Department</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Distribution across all clinical lines</p>
                    </div>
                    <span className="w-7 h-7 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                      <Building size={14} />
                    </span>
                  </div>

                  <div className="py-4 space-y-3">
                    {departmentsList.map(dept => {
                      const count = getDeptCount(dept);
                      const pct = totalDoctors > 0 ? (count / totalDoctors) * 100 : 0;
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>{dept}</span>
                            <span>{count} doctors</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#007f6e] transition-all duration-500" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {totalDoctors === 0 && (
                      <div className="p-12 text-center text-slate-400/70 text-xs font-semibold">
                        No department data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Recently Added */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recently Added</h3>
                      <p className="text-[10px] text-slate-400 font-medium font-semibold">Latest doctors onboarded</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('roster')} 
                      className="text-[#007f6e] text-[10px] font-bold hover:underline"
                    >
                      View All ›
                    </button>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {recentDoctors.map((doc, idx) => (
                      <div key={doc.id || idx} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {doc.name.charAt(0) || 'D'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {doc.specialization} · Phone: {doc.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenEditForm(doc)}
                          className="p-1 text-slate-400 hover:text-[#007f6e]"
                          title="Edit Specialist Record"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    ))}

                    {recentDoctors.length === 0 && (
                      <div className="p-12 text-center text-slate-400/70 text-xs font-medium">
                        No doctors yet. Click on Roster to start on-boarding.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Doctors on Duty Today Panel */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs" id="doctors-on-duty-pane">
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Doctors on Duty Today</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{dutyDoctorsToday.length} clinician(s) actively on schedule</p>
                  </div>
                </div>

                <div className="py-2">
                  {dutyDoctorsToday.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {dutyDoctorsToday.map(doc => (
                        <div key={doc.id} className="p-3 bg-slate-50 hover:bg-[#e6f4f1]/30 rounded-xl border border-slate-100 transition-all flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{doc.name}</span>
                            <span className="text-[10px] text-[#007f6e] font-semibold mt-0.5 block">{doc.specialization}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 block">{doc.phone}</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                            On Duty
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Stethoscope size={28} className="text-slate-300" />
                      <p className="text-xs font-medium">No doctors have appointments scheduled today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Structure Overview Widgets */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Fee Structure Overview</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mb-3">Consultation fees across active clinical rosters</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Average */}
                  <div className="bg-[#fcf8ff] border border-purple-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg. Consultation Fee</span>
                      <h4 className="text-lg font-extrabold text-[#7c3aed] mt-1">₹{fees.avg}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7c3aed] flex items-center justify-center font-bold text-sm">₹</div>
                  </div>

                  {/* Card 2: Lowest */}
                  <div className="bg-[#f0fdf4] border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lowest Fee</span>
                      <h4 className="text-lg font-extrabold text-[#00a85a] mt-1">₹{fees.min}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#00a85a] flex items-center justify-center font-bold text-sm">₹</div>
                  </div>

                  {/* Card 3: Highest */}
                  <div className="bg-[#fffbeb] border border-amber-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Highest Fee</span>
                      <h4 className="text-lg font-extrabold text-amber-600 mt-1">₹{fees.max}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center font-bold text-sm">₹</div>
                  </div>
                </div>
              </div>

              {/* Three bottom colored CTA actions cards (Image 1 Bottom) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Add Doctor panel */}
                <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white rounded-2xl p-5 flex flex-col justify-between h-40 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 text-white rounded-lg flex items-center justify-center">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Add New Doctor</span>
                      <span className="text-[10px] text-purple-100 mt-0.5 block">Register a new doctor with full profile and credentials</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleOpenAddForm}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 rounded-lg py-2 mt-4 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>Add Doctor</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* 2. Manage Staff panel */}
                <div className="bg-[#115e59] text-white rounded-2xl p-5 flex flex-col justify-between h-40 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 text-white rounded-lg flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Manage Staff</span>
                      <span className="text-[10px] text-[#ccfbf1] mt-0.5 block">View and manage all non-doctor hospital staff members</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('staff')}
                    className="w-full bg-white hover:bg-slate-50 text-[#115e59] rounded-lg py-2 mt-4 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Go to Staff</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* 3. View Appointments panel */}
                <div className="bg-[#059669] text-white rounded-2xl p-5 flex flex-col justify-between h-40 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 text-white rounded-lg flex items-center justify-center">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">View Appointments</span>
                      <span className="text-[10px] text-emerald-100 mt-0.5 block">Check today's appointments and doctor schedules</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('appointments')}
                    className="w-full bg-white hover:bg-slate-50 text-[#059669] rounded-lg py-2 mt-4 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>View Appointments</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ======================= TAB CASE B: ROSTER LIST TAB (IMAGE 2) ======================= */}
          {activeTab === 'roster' && (
            <div className="space-y-4" id="doctors-roster-pane">
              
              {/* Directory Filter Bars */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
                
                {/* Search query box */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search doctors, specialities, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e] focus:bg-white transition-all text-slate-800"
                    id="search-doctors-main"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Department select */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
                    <Filter size={13} />
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer font-bold"
                    >
                      <option value="All">All Departments</option>
                      {departmentsList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
                    <Activity size={13} />
                    <select
                      value={dutyFilter}
                      onChange={(e) => setDutyFilter(e.target.value)}
                      className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer font-bold"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">On Duty</option>
                      <option value="Inactive">Off Duty</option>
                    </select>
                  </div>

                  {/* Export and invite action triggers */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl border border-slate-150 font-bold text-xs transition-colors cursor-pointer"
                      title="Export filtered doctor profiles list"
                    >
                      <Download size={13} />
                      <span>Export</span>
                    </button>
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1 divide-y divide-slate-50 text-[11px]">
                        <button onClick={() => handleExport('CSV')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-705 font-medium block cursor-pointer">CSV format</button>
                        <button onClick={() => handleExport('Excel')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-medium block cursor-pointer">Excel sheet</button>
                        <button onClick={() => handleExport('Word')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-blue-600 font-medium block cursor-pointer">Word document</button>
                        <button onClick={() => handleExport('PDF')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 font-medium block cursor-pointer">PDF file</button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSendAllInvites}
                    className="flex items-center gap-1.5 bg-[#e6f4f1] hover:bg-[#d5eeea] text-[#007f6e] px-3 py-2 rounded-xl border border-[#007f6e]/10 font-bold text-xs transition-colors"
                  >
                    <Send size={13} />
                    <span>Send All Invites</span>
                  </button>

                  {/* Trigger Main Form Enroll */}
                  <button
                    onClick={handleOpenAddForm}
                    className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Doctor</span>
                  </button>

                </div>

              </div>

              {/* Roster database Grid / table layout */}
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
                {filteredDoctors.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Stethoscope size={36} className="text-slate-300 animate-pulse" />
                    <h3 className="text-sm font-semibold text-slate-700 mt-2">No doctors found</h3>
                    <p className="text-xs text-slate-400">Click "+ Add Doctor" to register clinical specialists</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Specialist Details</th>
                          <th className="px-6 py-4">Specialization</th>
                          <th className="px-6 py-4">Roster Availability</th>
                          <th className="px-6 py-4">Dept / Fee Struct</th>
                          <th className="px-6 py-4 text-center">Interactive Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredDoctors.map((doc) => {
                          const isDocActive = doc.status === 'On Duty' || doc.isActive !== false;
                          return (
                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                              
                              {/* Name, email, phone */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] border border-[#007f6e]/10 text-[#007f6e] font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0">
                                    {doc.name.replace('Dr. ', '').trim().charAt(0) || 'D'}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800 text-xs block">{doc.name}</span>
                                    {doc.email ? (
                                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{doc.email}</span>
                                    ) : (
                                      <span className="text-[10px] text-slate-300 block italic mt-0.5">no email cataloged</span>
                                    )}
                                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{doc.phone || 'N/A Phone'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Specialization with design pill */}
                              <td className="px-6 py-4">
                                <span className="bg-[#e6f4f1] text-[#007f6e] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#007f6e]/10 uppercase tracking-wider">
                                  {doc.specialization}
                                </span>
                              </td>

                              {/* Availability Tag and Controls Toggle */}
                              <td className="px-6 py-4">
                                <span
                                  onClick={() => onToggleStatus(doc.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors border select-none ${
                                    isDocActive
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/50'
                                  }`}
                                  title="Click to toggle availability"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isDocActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span>{isDocActive ? 'On Duty' : 'Off Duty'}</span>
                                </span>
                              </td>

                              {/* Dept / Consultation Fee */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-slate-700 font-semibold">{doc.department || doc.specialization || 'Clinical General'}</span>
                                  <span className="text-slate-500 text-[10px] font-bold mt-0.5">
                                    ₹{doc.consultationFee || doc.fee || 500} per consultation
                                  </span>
                                </div>
                              </td>

                              {/* View / Edit / Delete interactive operations */}
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1">
                                  
                                  {/* View profile details card modal */}
                                  <button
                                    onClick={() => setViewingDoctor(doc)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Medical Specialist Dossier"
                                    id={`view-btn-${doc.id}`}
                                  >
                                    <Eye size={15} />
                                  </button>

                                  {/* Edit custom profile records form */}
                                  <button
                                    onClick={() => handleOpenEditForm(doc)}
                                    className="p-1.5 text-slate-400 hover:text-[#007f6e] hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Edit Specialist Profile"
                                    id={`edit-btn-${doc.id}`}
                                  >
                                    <Edit3 size={15} />
                                  </button>

                                  {/* Delete specialist record */}
                                  <button
                                    onClick={() => handleDeleteClick(doc.id, doc.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Specialist Dossier"
                                    id={`delete-btn-${doc.id}`}
                                  >
                                    <Trash2 size={15} />
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </>
      )}

      {/* ======================= CASE C: COMPREHENSIVE VIEW PROFILE MODAL ======================= */}
      {viewingDoctor && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/60 backdrop-blur-xs flex items-center justify-center p-4" id="doctor-view-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header banner with credentials and identity summary */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#115e59] text-white p-6 relative">
              <button
                onClick={() => setViewingDoctor(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
                id="close-view-modal-btn"
              >
                <X size={15} />
              </button>
              
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                  {viewingDoctor.name.replace('Dr. ', '').trim().charAt(0) || 'D'}
                </div>
                <div>
                  <h2 className="text-md md:text-lg font-bold">{viewingDoctor.name}</h2>
                  <span className="text-emerald-100 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 inline-block mt-1">
                    {viewingDoctor.specialization} · Specialist
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Contents organized in grids */}
            <div className="p-6 space-y-5 max-h-[32rem] overflow-y-auto">
              
              {/* Row 1: Contact and Basic parameters */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Basic Information Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Gender</span>
                    <span className="text-slate-800 mt-0.5 block">{viewingDoctor.gender || 'Not Specified'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Date of Birth</span>
                    <span className="text-slate-800 mt-0.5 block">{viewingDoctor.dob || 'Not Specified'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Blood Group</span>
                    <span className="text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-md inline-block mt-0.5 font-bold">
                      {viewingDoctor.bloodGroup || 'unknown'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Phone Number</span>
                    <span className="text-slate-800 mt-0.5 block font-mono">{viewingDoctor.phone || 'No phone'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Email Address</span>
                    <span className="text-slate-800 mt-0.5 block break-all">{viewingDoctor.email || 'No email registered'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Home Address</span>
                    <span className="text-slate-800 mt-0.5 block leading-normal">{viewingDoctor.address || 'N/A'}</span>
                  </div>

                </div>
              </div>

              {/* Row 2: Licensing and Qualifications */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Credentials & Hospital Registry</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium">
                  
                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Qualification</span>
                    <span className="text-slate-800 mt-0.5 block">{viewingDoctor.qualification || 'MBBS / General Record'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Clinical Experience</span>
                    <span className="text-[#007f6e] mt-0.5 block font-bold">{viewingDoctor.experience || '0'} Year(s) practice</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Medical Registration No</span>
                    <span className="text-slate-800 mt-0.5 block font-mono">{viewingDoctor.medicalRegNo || 'N/A Certificate'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">System License Certificate</span>
                    <span className="text-slate-800 mt-0.5 block font-mono">{viewingDoctor.licenseNumber || 'N/A License'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Designated Department</span>
                    <span className="text-slate-800 mt-0.5 block">{viewingDoctor.department || viewingDoctor.specialization || 'Clinical General'}</span>
                  </div>

                </div>
              </div>

              {/* Row 3: Service Fee Structures */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Oversight Billing & Consultation Rates</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Consultation Fee (₹)</span>
                    <span className="text-[#7c3aed] text-sm mt-1 block font-extrabold">₹{viewingDoctor.consultationFee || viewingDoctor.fee || 500}</span>
                  </div>

                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Follow-up Fee (₹)</span>
                    <span className="text-indigo-600 text-sm mt-1 block font-extrabold">₹{viewingDoctor.followUpFee || 300}</span>
                  </div>

                </div>
              </div>

              {/* Row 4: Digital Settings status list */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2.5">Roster Status Status Settings</h4>
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${viewingDoctor.status === 'On Duty' || viewingDoctor.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-slate-700">On Active Hospital Duty</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${viewingDoctor.availableForBooking !== false ? 'bg-[#007f6e]' : 'bg-slate-300'}`} />
                    <span className="text-slate-700">Visible for Public Bookings</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setViewingDoctor(null);
                  handleOpenEditForm(viewingDoctor);
                }}
                className="bg-[#e6f4f1] hover:bg-[#d5eeea] text-[#007f6e] rounded-xl px-4 py-1.5 text-xs font-bold border border-emerald-500/10 transition-all flex items-center gap-1"
                id="edit-from-modal-btn"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setViewingDoctor(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl px-4 py-1.5 text-xs font-bold border border-slate-200 transition-all"
                id="close-from-modal-btn"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
