import React, { useState } from 'react';
import { 
  User, Plus, Search, Calendar, RefreshCw, BarChart2, Users, 
  CheckSquare, Activity, ShieldCheck, CreditCard, Clock, MapPin, 
  ArrowLeft, Eye, Edit, Trash2, X, Check, EyeOff, Landmark,
  FolderPlus, Heart, FileText, UserPlus, FileDown
} from 'lucide-react';
import { Patient, Doctor, Bill, Appointment } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface PatientsViewProps {
  patients: Patient[];
  doctors: Doctor[];
  wards: any[];
  bills: Bill[];
  appointments: Appointment[];
  onAddPatient: (patient: Omit<Patient, 'id' | 'registeredAt'> & { id?: string }) => void;
  onDeletePatient: (id: string) => void;
  onAddAppointment: (appt: Omit<Appointment, 'id'>) => void;
  onRefresh: () => void;
}

export default function PatientsView({
  patients,
  doctors,
  wards = [],
  bills = [],
  appointments = [],
  onAddPatient,
  onDeletePatient,
  onAddAppointment,
  onRefresh
}: PatientsViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'overview'>('members');
  const [showForm, setShowForm] = useState<'add' | 'edit' | false>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (filteredPatients.length === 0) {
      alert("No patient logs to export.");
      return;
    }
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Address', 'Status', 'Registered At'];
    const keys = ['id', 'name', 'age', 'gender', 'phone', 'bloodGroup', 'address', 'status', 'registeredAt'];
    const filename = `patients_directory_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filteredPatients, headers, keys, filename);
    } else if (format === 'Excel') {
      downloadExcel(filteredPatients, headers, keys, filename);
    } else if (format === 'Word') {
      downloadWord(filteredPatients, headers, keys, filename, 'Hospital Admitted Patients Board');
    } else if (format === 'PDF') {
      downloadPDFFile(filteredPatients, headers, keys, filename, 'Hospital Admitted Patients Roll');
    }
  };

  // Patient Registration state variables
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patientStatus, setPatientStatus] = useState<'New' | 'Follow-up'>('New');

  // IPD Bed Allocation variables (Optional)
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [selectedBedNumber, setSelectedBedNumber] = useState('');

  // Inline Appointment Variables (Optional check box)
  const [bookAppointmentNow, setBookAppointmentNow] = useState(false);
  const [appointmentDept, setAppointmentDept] = useState('Outpatient Department (OPD)');
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('2026-06-16');
  const [appointmentSlot, setAppointmentSlot] = useState('09:00 AM');

  const [search, setSearch] = useState('');

  // Prepopulate rooms and beds dynamically based on selected ward
  const activeWard = wards.find((w) => String(w.id) === selectedWardId);
  let parsedRooms: any[] = [];
  if (activeWard) {
    try {
      parsedRooms = activeWard.roomsData ? JSON.parse(activeWard.roomsData) : [];
    } catch {
      parsedRooms = [];
    }
  }

  const activeRoom = parsedRooms.find((r) => r.name === selectedRoomName);
  const bedsAvailable = activeRoom ? activeRoom.beds || [] : [];

  // Start Editing Patient Mode
  const startEdit = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setName(patient.name || '');
    setPhone(patient.phone || '');
    setGender(patient.gender || 'Male');
    setDob(patient.dob || '');
    setBloodGroup(patient.bloodGroup || '');
    setAddress(patient.address || '');
    setEmail(patient.email || '');
    setPassword(patient.password || '');
    setPatientStatus(patient.status || 'New');

    // Bed allocations
    setSelectedWardId(patient.wardId || '');
    setSelectedRoomName(patient.roomId || '');
    setSelectedBedNumber(patient.bedNumber || '');

    // Reset inline booking for editing
    setBookAppointmentNow(false);
    setShowForm('edit');
  };

  // Start Add Patient Mode
  const startAdd = () => {
    setSelectedPatientId(null);
    setName('');
    setPhone('');
    setGender('Male');
    setDob('');
    setBloodGroup('');
    setAddress('');
    setEmail('');
    setPassword('');
    setPatientStatus('New');

    setSelectedWardId('');
    setSelectedRoomName('');
    setSelectedBedNumber('');

    setBookAppointmentNow(false);
    setSelectedDoctorName(doctors[0] ? doctors[0].name : '');
    setAppointmentReason('');
    setShowForm('add');
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !gender) {
      alert('Please fill in Name, Phone, and Gender to register the patient.');
      return;
    }

    // Age calculation helper based on Date of Birth
    let calculatedAge = 30;
    if (dob) {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (birthYear && birthYear <= currentYear) {
        calculatedAge = currentYear - birthYear;
      }
    }

    const payload: Omit<Patient, 'id' | 'registeredAt'> & { id?: string } = {
      name,
      phone,
      gender,
      status: patientStatus,
      dob,
      bloodGroup,
      address,
      email,
      password,
      wardId: selectedWardId || null,
      roomId: selectedRoomName || null,
      bedNumber: selectedBedNumber || null,
      age: calculatedAge,
    };

    if (showForm === 'edit' && selectedPatientId) {
      payload.id = selectedPatientId;
    }

    // Call callback to save
    onAddPatient(payload);

    // Book Inline Appointment if checked (Only for fresh additions)
    if (bookAppointmentNow && showForm === 'add') {
      const selectedDoc = doctors.find((d) => d.name === selectedDoctorName);
      onAddAppointment({
        patientName: name,
        doctorName: selectedDoctorName || 'Duty Doctor',
        specialization: selectedDoc ? selectedDoc.specialization : 'General Medicine',
        date: appointmentDate,
        time: appointmentSlot,
        status: 'Scheduled',
        type: patientStatus === 'New' ? 'Regular' : 'Follow-up',
        patientEmail: email || '',
        patientPassword: password || '',
        patientPhone: phone,
        patientGender: gender,
        age: calculatedAge,
      });
    }

    setShowForm(false);
  };

  // Filter and Search logic
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
    (p.bloodGroup && p.bloodGroup.toLowerCase().includes(search.toLowerCase()))
  );

  // Overview metrics calculations
  const totalCount = patients.length;
  const newVisitCount = patients.filter((p) => p.status === 'New').length;
  const followUpCount = patients.filter((p) => p.status === 'Follow-up').length;
  const admittedCount = patients.filter((p) => p.bedNumber).length;

  const maleCount = patients.filter((p) => p.gender === 'Male').length;
  const femaleCount = patients.filter((p) => p.gender === 'Female').length;
  const otherGenderCount = patients.filter((p) => p.gender === 'Other').length;

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans" id="patient-management-view-container">
      
      {/* Dynamic Upper Tab selector pill-bar */}
      {!showForm && (
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4" id="patient-tab-pills">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#e6f4f1] text-[#007f6e] border border-[#007f6e]'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Patients Records</span>
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
            <span>Overview & Stats</span>
          </button>
        </div>
      )}

      {/* Main Mode Handler */}
      {showForm ? (
        <div className="space-y-6 max-w-5xl" id="register-patient-form-block">
          
          {/* Form navigation back header bar */}
          <div className="flex items-center justify-between" id="form-header-bar">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <ArrowLeft size={14} />
                <span>Back to Patients</span>
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800" id="form-main-title">
                  {showForm === 'edit' ? 'Update Patient Records' : 'Register New Patient'}
                </h2>
                <p className="text-xs text-slate-400">Fill in all clinical and contact info below</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowForm(false)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={15} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CARD 1: Basic Information */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <User size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Basic Information</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Patient's full name"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">MOBILE NUMBER *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">GENDER *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">DATE OF BIRTH</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">BLOOD GROUP</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  >
                    <option value="">Select Blood Group</option>
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">PATIENT STATUS TYPE</label>
                  <select
                    value={patientStatus}
                    onChange={(e) => setPatientStatus(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 font-medium"
                  >
                    <option value="New">New Visit</option>
                    <option value="Follow-up">Follow-Up Patient</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">ADDRESS</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address details"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>
            </div>

            {/* OPTIONAL SEC: Patient Online Portal Access Profile */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Login Credentials (Optional)</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>
              </div>
            </div>

            {/* OPTIONAL SEC: IPD Ward & Bed Allocation */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Landmark size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">IPD Ward & Bed Allocation (Optional)</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">IPD WARD SELECT</label>
                  <select
                    value={selectedWardId}
                    onChange={(e) => {
                      setSelectedWardId(e.target.value);
                      setSelectedRoomName('');
                      setSelectedBedNumber('');
                    }}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  >
                    <option value="">— Choose Ward —</option>
                    {wards.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">ROOM SELECT</label>
                  <select
                    disabled={!selectedWardId}
                    value={selectedRoomName}
                    onChange={(e) => {
                      setSelectedRoomName(e.target.value);
                      setSelectedBedNumber('');
                    }}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 disabled:opacity-50"
                  >
                    <option value="">— Choose Room —</option>
                    {parsedRooms.map((r, index) => (
                      <option key={index} value={r.name}>{r.name} - ({r.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">BED NUMBER</label>
                  <select
                    disabled={!selectedRoomName}
                    value={selectedBedNumber}
                    onChange={(e) => setSelectedBedNumber(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 disabled:opacity-50"
                  >
                    <option value="">— Choose Bed —</option>
                    {bedsAvailable.map((b: any, bIdx: number) => (
                      <option key={bIdx} value={String(b.number)}>
                        Bed {b.number} ({b.status || 'Available'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* EXPANDABLE CARD 2: Inline direct appointment scheduler exactly like Image 3 */}
            {showForm === 'add' && (
              <div 
                className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                  bookAppointmentNow 
                    ? 'border-[#007f6e] bg-[#f2faf8]' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Turquoise Checkable Toggle Header block */}
                <div 
                  onClick={() => setBookAppointmentNow(!bookAppointmentNow)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bookAppointmentNow}
                      onChange={(e) => setBookAppointmentNow(e.target.checked)}
                      className="w-4 h-4 accent-[#007f6e]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Book an appointment for this patient now
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    bookAppointmentNow ? 'bg-[#007f6e] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {bookAppointmentNow ? 'Active Selection' : 'Optional Booking'}
                  </span>
                </div>

                {bookAppointmentNow && (
                  <div className="p-6 border-t border-emerald-100 space-y-5 animate-slide-down">
                    <div className="bg-white p-5 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5" id="visit-details-box">
                      
                      <div className="md:col-span-2 text-xs font-bold text-emerald-700 pb-1 border-b border-slate-50 flex items-center gap-1.5">
                        <Activity size={14} />
                        <span>Visit Details</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">DEPARTMENT *</label>
                        <select
                          value={appointmentDept}
                          onChange={(e) => setAppointmentDept(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                        >
                          <option value="Outpatient Department (OPD)">Outpatient Department (OPD)</option>
                          <option value="Emergency Care Ward">Emergency Care Ward</option>
                          <option value="Cardiology Center">Cardiology Department</option>
                          <option value="Pediatrics Clinic">Pediatrics Clinic</option>
                          <option value="Orthopedics Lab">Orthopedics Lab</option>
                          <option value="Neurology Dept">Neurology Dept</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">DOCTOR *</label>
                        <select
                          value={selectedDoctorName}
                          onChange={(e) => setSelectedDoctorName(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 font-bold text-slate-705"
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((doc) => (
                            <option key={doc.id} value={doc.name}>
                              {doc.name} — ({doc.specialization})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">REASON FOR VISIT / CHIEF COMPLAINT</label>
                        <input
                          type="text"
                          value={appointmentReason}
                          onChange={(e) => setAppointmentReason(e.target.value)}
                          placeholder="e.g. Fever, Headache, Routine Checkup"
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5" id="schedule-details-box">
                      <div className="md:col-span-2 text-xs font-bold text-emerald-700 pb-1 border-b border-slate-50 flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>Appointment Schedule</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">APPOINTMENT DATE *</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SELECTED SLOT *</label>
                        <select
                          value={appointmentSlot}
                          onChange={(e) => setAppointmentSlot(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                        >
                          <option value="09:00 AM">09:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="03:00 PM">03:00 PM</option>
                          <option value="04:00 PM">04:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM CONTROLS */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100" id="form-actions">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-500 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs bg-[#007f6e] text-white font-bold rounded-xl hover:bg-[#006657] transition-all shadow-sm"
              >
                {showForm === 'edit' ? 'Save Changes' : (bookAppointmentNow ? 'Register & Book Appointment' : 'Register Patient')}
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'overview' ? (
        
        /* ================= OVERVIEW TAB ================= */
        <div className="space-y-6" id="patients-overview-screen">
          
          {/* Main Top Welcome Banner */}
          <div className="bg-[#005f54] text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <h2 className="text-lg font-extrabold tracking-tight">Patient Registry Overview</h2>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">
                {totalCount} total registered profiles • {newVisitCount} new onboards • {admittedCount} admitted in IPD beds
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startAdd}
                className="bg-[#00473e] hover:bg-[#003d35] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Register Patient
              </button>
              <button
                onClick={onRefresh}
                className="bg-[#0c6b60] hover:bg-[#0a5c52] text-white p-2 rounded-xl"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="overview-kpi-blocks">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">All Patients</span>
                <span className="text-2xl font-black text-slate-800">{totalCount}</span>
              </div>
              <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Visits</span>
                <span className="text-2xl font-black text-emerald-500">{newVisitCount}</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckSquare size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Follow-Ups</span>
                <span className="text-2xl font-black text-indigo-500">{followUpCount}</span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">IPD Admissions</span>
                <span className="text-2xl font-black text-purple-600">{admittedCount}</span>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Landmark size={18} />
              </div>
            </div>
          </div>

          {/* Lower level widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-graphs">
            
            {/* Widget 1: Gender Distribution */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Demographic breakdown</h3>
                <span className="text-[10px] text-slate-400">Gender parity metrics</span>
              </div>
              
              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <User size={24} className="text-slate-205" />
                  <p className="text-xs font-semibold mt-1">No patient data available</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  {/* Male */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Male Patients</span>
                      <span className="text-[#007f6e]">{maleCount} ({Math.round((maleCount / totalCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-[#007f6e] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(maleCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Female */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Female Patients</span>
                      <span className="text-purple-600">{femaleCount} ({Math.round((femaleCount / totalCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(femaleCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Other */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Other demographics</span>
                      <span className="text-amber-600">{otherGenderCount} ({Math.round((otherGenderCount / totalCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-amber-400 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(otherGenderCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Patient distribution by Clinical status */}
            <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Clinical Enrolment Status</h3>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">New vs Follow up</span>
              </div>

              {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Activity size={24} className="text-slate-205" />
                  <p className="text-xs font-semibold mt-1">No onboarding logs</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 flex-1 items-center">
                  <div className="bg-teal-50/35 border border-teal-50 rounded-xl p-4 text-center space-y-1">
                    <span className="text-2xl font-black text-[#007f6e]">{newVisitCount}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Registrations</p>
                    <p className="text-[9px] text-emerald-600 font-medium">First-time visitors</p>
                  </div>

                  <div className="bg-indigo-50/35 border border-indigo-50 rounded-xl p-4 text-center space-y-1">
                    <span className="text-2xl font-black text-indigo-600">{followUpCount}</span>
                    <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">Follow-Up list</p>
                    <p className="text-[9px] text-indigo-500 font-medium">Scheduled reviews</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (

        /* ================= LISTING VIEW (First Tab) ================= */
        <div className="space-y-6" id="patients-listing-screen">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="patients-header">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight" id="patients-title">Patient Management</h1>
              <p className="text-xs text-slate-400 mt-0.5">Live - {patients.length} registered patients profile entries</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={startAdd}
                className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Plus size={14} />
                <span>Register New Patient</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FileDown size={14} />
                  <span>Export List</span>
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
            </div>
          </div>

          {/* Quick Metrics Bar directly aligned above the table list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="quick-listing-counters">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Patients</span>
                <span className="text-lg font-black text-slate-850">{totalCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#007f6e] flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IPD Admitted</span>
                <span className="text-lg font-black text-purple-600">{admittedCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Landmark size={14} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Clinical status</span>
                <span className="text-lg font-black text-emerald-600">{newVisitCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckSquare size={14} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Follow-Up review</span>
                <span className="text-lg font-black text-indigo-600">{followUpCount}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50/50 text-indigo-500 flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden" id="patients-table-block">
            
            {/* Filter Search Header */}
            <div className="p-4 border-b border-slate-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative w-full sm:w-85">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search by full name, contact, email, or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-white border border-slate-205 rounded-xl focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-bold text-slate-650">
                <button 
                  onClick={() => alert("Date filters applied.")} 
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Calendar size={12} />
                  <span>Filters</span>
                </button>
                <button 
                  onClick={onRefresh} 
                  className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-[#007f6e] flex items-center justify-center gap-1.5 h-8"
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* List empty state check */}
            {filteredPatients.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-patients">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-355 text-slate-400">
                  <User size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">No patients registered yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Register New Patient" to start adding patient folders.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-405 uppercase tracking-wider border-b border-[#edeff2]">
                    <tr>
                      <th className="px-6 py-4">Patient Folder info</th>
                      <th className="px-6 py-4">Gender & DOB</th>
                      <th className="px-6 py-4">Contact Detail</th>
                      <th className="px-6 py-4">Clinical status</th>
                      <th className="px-6 py-4">Ward Admission status</th>
                      <th className="px-6 py-4">Financial Invoice</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-[#edeff2]">
                    {filteredPatients.map((p) => {
                      // Lookup billing items under this specific patient name
                      const patientBills = bills.filter((b) => b.patientName.toLowerCase() === p.name.toLowerCase());
                      const totalBillAmount = patientBills.reduce((acc, current) => acc + (current.amount || 0), 0);
                      const pendingBillCount = patientBills.filter((b) => b.status === 'Pending').length;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8.5 h-8.5 rounded-xl bg-[#007f6e]/5 text-[#007f6e] flex items-center justify-center font-bold text-sm">
                                {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-800">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {p.id}</div>
                                {p.bloodGroup && (
                                  <span className="inline-block mt-0.5 px-2 py-0.2 bg-red-50 text-red-600 text-[9px] font-black rounded-md border border-red-50">
                                    Blood {p.bloodGroup}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700">{p.gender}</div>
                            <div className="text-[10px] text-slate-400">{p.dob || 'DOB Unavailable'}</div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-mono text-slate-650">{p.phone}</div>
                            {p.email ? (
                              <div className="text-[10px] text-slate-400 font-light truncate max-w-40">{p.email}</div>
                            ) : (
                              <div className="text-[10px] text-slate-300">No portal credentials</div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              p.status === 'New' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                              {p.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {p.bedNumber ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-bold">
                                  <Landmark size={10} />
                                  <span>Bed {p.bedNumber}</span>
                                </span>
                                <div className="text-[9px] text-slate-400 truncate max-w-35">{p.roomId || 'General Room'}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Outpatient (OPD)</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {patientBills.length > 0 ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800">₹{totalBillAmount.toLocaleString()}</div>
                                <span className={`inline-block px-1.5 py-0.2 text-[8px] font-bold rounded-sm ${
                                  pendingBillCount > 0 
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {pendingBillCount > 0 ? `${pendingBillCount} Pending` : 'All Paid'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-350">No Bills record</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Clinical full details lookup */}
                              <button
                                onClick={() => setViewingPatient(p)}
                                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-lg transition-colors"
                                title="View Patient Details & Medical History"
                              >
                                <Eye size={13} />
                              </button>
                              
                              {/* Edit details */}
                              <button
                                onClick={() => startEdit(p)}
                                className="p-1.5 border border-slate-200 bg-white hover:bg-[#e6f4f1] text-[#007f6e] rounded-lg transition-colors"
                                title="Edit particulars"
                              >
                                <Edit size={13} />
                              </button>

                              {/* Delete patient profile entry */}
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to completely remove patient profile for "${p.name}"?`)) {
                                    onDeletePatient(p.id);
                                  }
                                }}
                                className="p-1.5 border border-red-105 bg-white hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                title="Delete patient history"
                              >
                                <Trash2 size={13} />
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

      {/* VIEW DETAILS MODAL: Full Slide-Over Medical & Account chart */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none" id="patient-details-chart-modal">
          <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-100 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Slide-over header banner block */}
            <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg">
                  {viewingPatient.name ? viewingPatient.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{viewingPatient.name}</h3>
                  <p className="text-[11px] text-teal-100/90 mt-0.5">Patient ID: {viewingPatient.id} • Registered {new Date(viewingPatient.registeredAt || '').toLocaleDateString()}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setViewingPatient(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable medical files */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-600">
              
              {/* Part 1: Vital and Contact statistics */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[#007f6e] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <User size={14} />
                  <span>General Registration & Contact</span>
                </h4>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Phone Contact</span>
                    <span className="text-slate-800 font-extrabold">{viewingPatient.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Email ID</span>
                    <span className="text-slate-800 font-bold">{viewingPatient.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Date of Birth</span>
                    <span className="text-slate-800 font-medium">{viewingPatient.dob || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Calculated Age</span>
                    <span className="text-slate-80s font-medium">{viewingPatient.age ? `${viewingPatient.age} yrs` : '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Blood classification</span>
                    <span className="inline-block mt-0.5 px-2 py-0.2 bg-red-50 text-red-600 text-[10px] font-black rounded-md">{viewingPatient.bloodGroup || 'Not Configured'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Admission Type</span>
                    <span className="text-slate-800 font-semibold">{viewingPatient.status} Visit</span>
                  </div>
                  <div className="col-span-2 lg:col-span-3">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Home Address</span>
                    <span className="text-slate-850 font-medium">{viewingPatient.address || 'Address information absent.'}</span>
                  </div>
                </div>
              </div>

              {/* Part 2: Ward admission status */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-purple-700 border-b border-purple-50 pb-1 flex items-center gap-1.5">
                  <Landmark size={14} />
                  <span>IPD Bed allocation status</span>
                </h4>
                {viewingPatient.bedNumber ? (
                  <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100/50 grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[9px] text-purple-400 font-bold uppercase">IPD Ward Assigned</span>
                      <span className="text-slate-800 font-bold">General Ward Block</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-purple-400 font-bold uppercase">Room Spec</span>
                      <span className="text-slate-800 font-bold">{viewingPatient.roomId || 'General Room'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-purple-400 font-bold uppercase">Bed Number</span>
                      <span className="text-purple-700 font-black">Bed {viewingPatient.bedNumber}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">This patient is visiting for outpatient consultation and is currently not admitted to any IPD Ward Bed.</p>
                )}
              </div>

              {/* Part 3: Related Consultation & Appointments matching user request */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-emerald-700 border-b border-emerald-50 pb-1 flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Appointments & Consultations scheduled</span>
                </h4>
                {appointments.filter((a) => a.patientName.toLowerCase() === viewingPatient.name.toLowerCase()).length === 0 ? (
                  <p className="text-slate-400 italic">No scheduled appointments logged for this patient.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs bg-slate-50/50">
                      <thead className="bg-slate-100/70 text-[9px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Appointment ID</th>
                          <th className="px-4 py-2">Consultation Doctor</th>
                          <th className="px-4 py-2">Department / Spec</th>
                          <th className="px-4 py-2">Schedule Date</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments
                          .filter((a) => a.patientName.toLowerCase() === viewingPatient.name.toLowerCase())
                          .map((a) => (
                            <tr key={a.id} className="bg-white">
                              <td className="px-4 py-2 text-slate-400 font-mono text-[9px]">{a.id}</td>
                              <td className="px-4 py-2 font-bold text-slate-700">{a.doctorName}</td>
                              <td className="px-4 py-2 text-slate-500">{a.specialization}</td>
                              <td className="px-4 py-2">
                                <span className="font-semibold text-slate-600">{a.date}</span> • <span className="text-slate-400">{a.time}</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md">
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Part 4: Billing history invoices registered for this patient */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-blue-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  <span>Bills summary invoice</span>
                </h4>
                {bills.filter((b) => b.patientName.toLowerCase() === viewingPatient.name.toLowerCase()).length === 0 ? (
                  <p className="text-slate-400 italic">No generated bills exist under this patient's registered credentials.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs bg-slate-50/50">
                      <thead className="bg-[#f0f4f8] text-[9px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Bill Ref ID</th>
                          <th className="px-4 py-2">Invoice Amount</th>
                          <th className="px-4 py-2">Billing Date</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bills
                          .filter((b) => b.patientName.toLowerCase() === viewingPatient.name.toLowerCase())
                          .map((b) => (
                            <tr key={b.id} className="bg-white">
                              <td className="px-4 py-2 font-mono text-slate-400 text-[10px]">{b.id}</td>
                              <td className="px-4 py-2 font-extrabold text-[#007f6e]">₹{b.amount.toLocaleString()}</td>
                              <td className="px-4 py-2 text-slate-500">{b.date}</td>
                              <td className="px-4 py-2 text-right">
                                <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-sm ${
                                  b.status === 'Paid' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {b.status}
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

            {/* Footer action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingPatient(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-xs"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
