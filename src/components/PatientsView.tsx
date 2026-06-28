import React, { useState } from 'react';
import { 
  User, Plus, Search, Calendar, RefreshCw, BarChart2, Users, 
  CheckSquare, Activity, ShieldCheck, CreditCard, Clock, MapPin, 
  ArrowLeft, Eye, Edit, Trash2, X, Check, EyeOff, Landmark,
  FolderPlus, Heart, FileText, UserPlus, FileDown, Camera, Phone, Sparkles, CheckCircle
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
  isReadOnly?: boolean;
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
  onNavigate?: (view: any) => void;
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
  onRefresh,
  isReadOnly = false,
  loggedInUser = null,
  onNavigate,
}: PatientsViewProps) {
  const isPatient = loggedInUser?.role === 'patient';
  const patientProfileName = isPatient ? loggedInUser?.data?.name : null;

  const [activeTab, setActiveTab] = useState<'members' | 'overview'>('members');
  const [showForm, setShowForm] = useState<'add' | 'edit' | false>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'appointments' | 'medical-history' | 'billing' | 'treatment-plans'>('overview');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize viewingPatient state with parent patients updates
  React.useEffect(() => {
    if (viewingPatient) {
      const updated = patients.find((p) => p.id === viewingPatient.id);
      if (updated) {
        setViewingPatient(updated);
      } else {
        setViewingPatient(null);
      }
    }
  }, [patients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (filteredPatients.length === 0) {
      showToast("No patient logs to export.");
      return;
    }
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Address', 'Status', 'Registered At'];
    const keys = ['id', 'name', 'age', 'gender', 'phone', 'bloodGroup', 'address', 'status', 'registeredAt'];
    const filename = `patients_directory_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filteredPatients, headers, keys, filename);
      showToast("Patients list exported smoothly as CSV.");
    } else if (format === 'Excel') {
      downloadExcel(filteredPatients, headers, keys, filename);
      showToast("Patients list exported smoothly as Excel sheet.");
    } else if (format === 'Word') {
      downloadWord(filteredPatients, headers, keys, filename, 'Hospital Admitted Patients Board');
      showToast("Patients list exported smoothly as Word document.");
    } else if (format === 'PDF') {
      downloadPDFFile(filteredPatients, headers, keys, filename, 'Hospital Admitted Patients Roll');
      showToast("Patients list exported smoothly as PDF file.");
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

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Inline Appointment Variables (Optional check box)
  const [bookAppointmentNow, setBookAppointmentNow] = useState(false);
  const [appointmentDept, setAppointmentDept] = useState('Outpatient Department (OPD)');
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => getTodayDateString());
  const [appointmentSlot, setAppointmentSlot] = useState('09:00 AM');

  const [search, setSearch] = useState('');

  // Quick book appointment from table or slide-over
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);
  const [drawerBookingDept, setDrawerBookingDept] = useState('Outpatient Department (OPD)');
  const [drawerBookingDoc, setDrawerBookingDoc] = useState('');
  const [drawerBookingReason, setDrawerBookingReason] = useState('');
  const [drawerBookingDate, setDrawerBookingDate] = useState(() => getTodayDateString());
  const [drawerBookingSlot, setDrawerBookingSlot] = useState('09:00 AM');

  const handleQuickBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForBooking) return;
    if (!drawerBookingDoc) {
      alert("Please select a Doctor.");
      return;
    }
    if (!drawerBookingDate) {
      alert("Please select an Appointment Date.");
      return;
    }
    if (!drawerBookingSlot) {
      alert("Please select a Time Slot.");
      return;
    }
    if (!drawerBookingReason.trim()) {
      alert("Please specify a reason/notes for this booking.");
      return;
    }

    const chosenDoc = doctors.find((d) => d.name === drawerBookingDoc);
    onAddAppointment({
      patientName: selectedPatientForBooking.name,
      doctorName: drawerBookingDoc,
      specialization: chosenDoc ? chosenDoc.specialization : 'General Medicine',
      date: drawerBookingDate,
      time: drawerBookingSlot,
      status: 'Scheduled',
      type: selectedPatientForBooking.status === 'New' ? 'Regular' : 'Follow-up',
      patientEmail: selectedPatientForBooking.email || '',
      patientPassword: selectedPatientForBooking.password || '',
      patientPhone: selectedPatientForBooking.phone || '',
      patientGender: selectedPatientForBooking.gender || 'Male',
      age: selectedPatientForBooking.age || 30,
    });

    // Reset state & refresh
    alert(`Appointment successfully booked for ${selectedPatientForBooking.name} on ${drawerBookingDate} at ${drawerBookingSlot}!`);
    setSelectedPatientForBooking(null);
    setDrawerBookingDoc('');
    setDrawerBookingReason('');
    if (onRefresh) onRefresh();
  };

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
    if (!name.trim()) { alert('Patient Name is required.'); return; }
    if (!phone.trim()) { alert('Patient Phone is required.'); return; }
    if (!gender) { alert('Patient Gender selection is required.'); return; }
    if (!email.trim()) { alert('Patient Email Address is required.'); return; }
    if (!password.trim()) { alert('Patient Login Password is required.'); return; }
    if (!dob) { alert('Date of birth is required.'); return; }
    if (!bloodGroup) { alert('Blood Group selection is required.'); return; }
    if (!address.trim()) { alert('Home Address is required.'); return; }

    if (bookAppointmentNow && showForm === 'add') {
      if (!selectedDoctorName) {
        alert('Please choose a doctor for this inline appointment booking.');
        return;
      }
      if (!appointmentDate) {
        alert('Please specify a date for this inline appointment.');
        return;
      }
      if (!appointmentSlot) {
        alert('Please choose an appointment time slot.');
        return;
      }
      if (!appointmentReason.trim()) {
        alert('Please specify an appointment reason/symptoms.');
        return;
      }
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
  const filteredPatients = patients.filter((p) => {
    if (isPatient && patientProfileName && p.name?.trim().toLowerCase() !== patientProfileName.trim().toLowerCase()) {
      return false;
    }
    return (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.bloodGroup && p.bloodGroup.toLowerCase().includes(search.toLowerCase()));
  });

  // Overview metrics calculations
  const totalCount = patients.length;
  const newVisitCount = patients.filter((p) => p.status === 'New').length;
  const followUpCount = patients.filter((p) => p.status === 'Follow-up').length;
  const admittedCount = patients.filter((p) => p.bedNumber).length;

  const maleCount = patients.filter((p) => p.gender === 'Male').length;
  const femaleCount = patients.filter((p) => p.gender === 'Female').length;
  const otherGenderCount = patients.filter((p) => p.gender === 'Other').length;

  if (viewingPatient) {
    const patientAppts = appointments.filter((a) => (a.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase());
    const patientBills = bills.filter((b) => (b.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase());
    const visitsCount = patientAppts.length;
    const totalPaidAmount = patientBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0);
    const pendingPaymentAmount = patientBills.filter(b => b.status !== 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0);

    const handleDownloadPatientCardPDF = () => {
      const patientName = viewingPatient.name || 'Patient';
      let html = '<html>\n';
      html += '<head><meta charset="utf-8"><title>Patient Portfolio - ' + patientName + '</title>\n';
      html += '<style>\n';
      html += 'body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; line-height: 1.5; }\n';
      html += '.header { border-bottom: 2.5px solid #007f6e; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }\n';
      html += 'h1 { color: #007f6e; margin: 0; font-size: 24px; font-weight: 800; }\n';
      html += '.section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #007f6e; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; letter-spacing: 0.05em; }\n';
      html += '.grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }\n';
      html += '.info-item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }\n';
      html += '.info-label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }\n';
      html += '.info-value { font-size: 12px; color: #0f172a; font-weight: 705; }\n';
      html += 'table { width: 100%; border-collapse: collapse; margin-top: 15px; }\n';
      html += 'th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 8px 12px; border: 1px solid #1e293b; font-size: 11px; text-align: left; text-transform: uppercase; }\n';
      html += 'td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px; color: #334155; }\n';
      html += 'tr:nth-child(even) { background-color: #f8fafc; }\n';
      html += '.footer { font-size: 10px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; margin-top: 40px; }\n';
      html += '</style>\n';
      html += '</head><body>\n';
      
      html += '<div class="header">\n';
      html += `  <div>\n    <h1>${patientName}</h1>\n    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Patient ID: ${viewingPatient.id} | Registered: ${viewingPatient.registeredAt || 'N/A'}</div>\n  </div>\n`;
      html += `  <div style="text-align: right; font-size: 11px; color: #64748b;">Generated Date: ${new Date().toLocaleString()}</div>\n`;
      html += '</div>\n';
      
      html += '<div class="section-title">Personal Demographics</div>\n';
      html += '<div class="grid-info">\n';
      html += `  <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${viewingPatient.name}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Phone No</div><div class="info-value">${viewingPatient.phone || 'N/A'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">${viewingPatient.email || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Gender</div><div class="info-value">${viewingPatient.gender}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Age</div><div class="info-value">${viewingPatient.age || '—'} years</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Blood Group</div><div class="info-value">${viewingPatient.bloodGroup || '—'}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Visits Category</div><div class="info-value">${viewingPatient.status}</div></div>\n`;
      html += `  <div class="info-item"><div class="info-label">Residential Address</div><div class="info-value">${viewingPatient.address || '—'}</div></div>\n`;
      html += '</div>\n';

      if (viewingPatient.bedNumber) {
        html += '<div class="section-title">IPD Ward Bed Allocation</div>\n';
        html += '<div class="grid-info">\n';
        html += `  <div class="info-item"><div class="info-label">Ward Assigned</div><div class="info-value">General Admissions Ward</div></div>\n`;
        html += `  <div class="info-item"><div class="info-label">Room Identifier</div><div class="info-value">${viewingPatient.roomId || 'General Room'}</div></div>\n`;
        html += `  <div class="info-item"><div class="info-label">Bed Allocated</div><div class="info-value">Bed ${viewingPatient.bedNumber}</div></div>\n`;
        html += '</div>\n';
      }

      html += '<div class="section-title">Enrolled Clinical Appointments</div>\n';
      if (patientAppts.length === 0) {
        html += '<p style="font-size: 11px; color: #888; font-style: italic;">No appointments found for this patient.</p>\n';
      } else {
        html += '<table>\n<thead>\n<tr><th>Appointment ID</th><th>Assigned Doctor</th><th>Department</th><th>Date</th><th>Status</th></tr></thead>\n<tbody>\n';
        patientAppts.forEach(a => {
          html += `<tr><td>${a.id}</td><td>${a.doctorName}</td><td>${a.specialization}</td><td>${a.date} - ${a.time}</td><td>${a.status}</td></tr>\n`;
        });
        html += '</tbody>\n</table>\n';
      }

      html += '<div class="section-title">Financial Invoices Summary</div>\n';
      if (patientBills.length === 0) {
        html += '<p style="font-size: 11px; color: #888; font-style: italic;">No financial billing operations recorded.</p>\n';
      } else {
        html += '<table>\n<thead>\n<tr><th>Invoice ID</th><th>Amount</th><th>Tax</th><th>Discount</th><th>Paid</th><th>Status</th></tr></thead>\n<tbody>\n';
        patientBills.forEach(b => {
          const collected = b.collectedAmount === undefined ? b.amount : b.collectedAmount;
          html += `<tr><td>${b.id}</td><td>₹${b.amount}</td><td>₹${b.tax || 0}</td><td>₹${b.discount || 0}</td><td>₹${collected}</td><td>${b.status}</td></tr>\n`;
        });
        html += '</tbody>\n</table>\n';
      }
      
      html += '<div class="footer">Confidential Clinical Portfolio Report - Generated Dynamically</div>\n';
      html += '</body>\n</html>';
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `patient_portfolio_${patientName.toLowerCase().replace(/\s+/g, '_')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans" id="patients-dashboard-container">
        {/* Breadcrumb / Top bar */}
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-3xs" id="patient-dashboard-breadcrumbs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button 
              onClick={() => setViewingPatient(null)}
              className="flex items-center gap-1 hover:text-[#007f6e] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>All Patients</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">{viewingPatient.name}</span>
          </div>

          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        {/* PROFILE HEADER BLOCK styled exactly like the patient profile in the image */}
        <div className="bg-gradient-to-r from-[#eefaf7] to-[#e8f6f4] rounded-2xl border border-teal-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-sm" id="patient-main-avatar-profile">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white border-2 border-teal-50 rounded-full flex items-center justify-center font-black text-2xl text-[#007f6e] shadow-xs">
                {viewingPatient.name ? viewingPatient.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-teal-600 border border-white text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 shadow-sm">
                <Camera size={10} />
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">{viewingPatient.name}</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 font-mono">ID: {viewingPatient.id}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400 font-bold" />
                  <span>{viewingPatient.phone || 'N/A'}</span>
                </span>
                <span className="flex items-center gap-1 uppercase">
                  <User size={13} className="text-slate-400 font-bold" />
                  <span>{viewingPatient.gender || 'MALE'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Visits, Total Paid and Pending score cards of the side block */}
          <div className="flex gap-3 self-stretch md:self-auto">
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[70px] shadow-3xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Visits</span>
              <span className="text-xl font-black text-slate-700">{visitsCount}</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[95px] shadow-3xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Paid</span>
              <span className="text-xl font-black text-[#007f6e]">₹{totalPaidAmount}</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl py-2 px-4 text-center min-w-[95px] shadow-3xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pending</span>
              <span className="text-xl font-black text-rose-500">₹{pendingPaymentAmount}</span>
            </div>
          </div>
        </div>

        {/* Row of 4 metric counters styled beautifully in a matching schema */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="patient-stats-four-box">
          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-teal-50 text-[#007f6e] rounded-lg flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appointments</span>
              <span className="text-lg font-black text-slate-700">{visitsCount}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procedures</span>
              <span className="text-lg font-black text-slate-700">{viewingPatient.bedNumber ? 1 : 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Bills</span>
              <span className="text-lg font-black text-slate-700">₹{pendingPaymentAmount}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-lg font-black text-slate-700">₹{totalPaidAmount}</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons bar matching the horizontal underline style in Image */}
        <div className="flex border-b border-slate-200" id="detail-dashboard-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'appointments', label: 'Appointments' },
            { id: 'medical-history', label: 'Medical History' },
            { id: 'billing', label: 'Billing & Payments' },
            { id: 'treatment-plans', label: `Treatment Plans (${visitsCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailActiveTab(tab.id as any)}
              className={`px-4 md:px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer pb-2.5 -mb-px ${
                detailActiveTab === tab.id
                  ? 'border-[#007f6e] text-[#007f6e] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {detailActiveTab === 'overview' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs p-6" id="personal-info-block">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Personal Information</h3>
                  <div className="flex items-center gap-1.5">
                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => {
                            startEdit(viewingPatient);
                            setViewingPatient(null);
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit this patient record"
                        >
                          <Edit size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you absolutely sure you want to delete patient ${viewingPatient.name}?`)) {
                              onDeletePatient(viewingPatient.id);
                              setViewingPatient(null);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Permanently remove profile"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleDownloadPatientCardPDF}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#007f6e] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Download PDF medical record"
                    >
                      <FileDown size={11} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs" id="personal-info-fields-box">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Patient ID</span>
                    <span className="text-slate-800 font-bold font-mono text-right">{viewingPatient.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 flex-wrap">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Full Name</span>
                    <span className="text-slate-800 font-extrabold text-right">{viewingPatient.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone</span>
                    <span className="text-slate-800 font-bold text-right font-mono">{viewingPatient.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Email</span>
                    <span className="text-slate-800 font-medium text-right break-all">{viewingPatient.email || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Gender</span>
                    <span className="text-slate-800 font-bold text-right uppercase">{viewingPatient.gender || 'MALE'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth</span>
                    <span className="text-slate-800 font-medium text-right">{viewingPatient.dob || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Age</span>
                    <span className="text-slate-800 font-bold text-right">{viewingPatient.age || '—'} years</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Blood Group</span>
                    <span className="text-right inline-block px-2 py-0.2 bg-rose-50 text-rose-600 font-black rounded-md">{viewingPatient.bloodGroup || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Patient Type</span>
                    <span className="text-slate-800 font-bold text-right uppercase text-[#007f6e]">{viewingPatient.status || 'NEW'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Allergies</span>
                    <span className="text-slate-805 font-medium text-right text-slate-500">None</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 md:col-span-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Residential Address</span>
                    <span className="text-[#0f172a] font-bold text-right">{viewingPatient.address || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105 md:col-span-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Registered Date</span>
                    <span className="text-slate-800 font-medium text-right">
                      {viewingPatient.registeredAt ? new Date(viewingPatient.registeredAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {detailActiveTab === 'appointments' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs p-6" id="appointments-tab-pane">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scheduled Appointments</h3>
                  <span className="text-[10px] text-slate-500 font-bold">{patientAppts.length} Registered</span>
                </div>
                {patientAppts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                     <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
                     <p className="text-xs font-medium">No recorded appointments for this patient.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fafbfc] text-[9px] font-bold text-slate-500 uppercase border-b">
                        <tr>
                          <th className="px-4 py-2.5">Date & Time</th>
                          <th className="px-4 py-2.5">Doctor</th>
                          <th className="px-4 py-2.5">Department</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientAppts.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{a.date} • <span className="text-slate-400">{a.time}</span></td>
                            <td className="px-4 py-3 font-bold text-[#007f6e]">{a.doctorName}</td>
                            <td className="px-4 py-3 text-slate-500">{a.specialization}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${
                                a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                a.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                a.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                a.status === 'Scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-100 text-slate-650 border-slate-200'
                              }`}>{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {detailActiveTab === 'medical-history' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs p-6" id="medical-hist-pane">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Diagnostics & Medical History</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed flex gap-3 text-xs">
                    <Activity size={18} className="text-[#007f6e] shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800">Initial General Vitals Onboarded</h4>
                      <p className="text-slate-500 mt-1">Temperature: 98.6°F | Heart Rate: 72 bpm | BP: 120/80 mmHg</p>
                      <p className="text-[10px] text-slate-400 mt-2">Recorded on {viewingPatient.registeredAt ? new Date(viewingPatient.registeredAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed flex gap-3 text-xs">
                    <Heart size={18} className="text-rose-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800">Cardiovascular Review</h4>
                      <p className="text-slate-500 mt-1">Patient reports normal respiratory baseline; cardiac sounds audible and healthy with zero transient murmur indices.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailActiveTab === 'billing' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs p-6" id="billing-history-pane">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Transactions History</h3>
                  <span className="text-[10px] text-slate-400 font-bold">{patientBills.length} Invoices</span>
                </div>
                {patientBills.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                     <CreditCard size={24} className="mx-auto text-slate-300 mb-2" />
                     <p className="text-xs font-medium">No recorded financial operations exist.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fafbfc] text-[9px] font-bold text-slate-500 uppercase border-b">
                        <tr>
                          <th className="px-4 py-2.5">Invoice ID</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Billing Type</th>
                          <th className="px-4 py-2.5">Amount</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientBills.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-405 text-[10px]">{b.id}</td>
                            <td className="px-4 py-3 text-slate-600">{b.date}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-[10px]">{b.type || 'Opd Clinic'}</span></td>
                            <td className="px-4 py-3 font-extrabold text-[#007f6e]">₹{b.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${
                                b.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>{b.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {detailActiveTab === 'treatment-plans' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs p-6" id="treatment-plans-tab-pane">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Admissions & Active Care Treatment Modules</h3>
                </div>
                {viewingPatient.bedNumber ? (
                  <div className="bg-purple-50/45 p-5 rounded-2xl border border-purple-100 flex gap-4 text-xs">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 font-extrabold text-sm shrink-0">IPD</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800">Inpatient Bed Admissions Active (Wards Bed Entry)</h4>
                      <p className="text-slate-500">Currently admitted in <span className="font-bold text-purple-700">General Block Wards</span>. Allocation includes Bed number {viewingPatient.bedNumber} inside room {viewingPatient.roomId}.</p>
                      <p className="text-[10px] text-slate-400">Continuous patient monitoring scheduled indefinitely.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 bg-slate-50/55 rounded-xl border border-dashed border-slate-200">
                    <Activity size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-medium">No IPD active admissions recorded. Outpatient clinical visits are registered instead.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right hand sidebar showing recent appointments exactly as in image to look perfectly symmetrical */}
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl border-slate-100 p-6 shadow-2xs animate-fade-in" id="sidebar-recent-appts-v2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">Recent Appointments</h3>
              {patientAppts.length === 0 ? (
                <div className="py-6 text-center text-slate-400" id="no-sidebar-appt-notes">
                  <Calendar size={18} className="mx-auto text-slate-300 mb-1" />
                  <span className="text-[11px]">No appointments found</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppts.slice(0, 5).map(appt => (
                    <div key={appt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                        <span className="text-slate-400">{appt.date}</span>
                        <span className="text-[#007f6e]">{appt.time}</span>
                      </div>
                      <h4 className="font-extrabold text-[#0f172a]">Consultation with {appt.doctorName}</h4>
                      <p className="text-[10.5px] text-slate-505 font-medium">{appt.specialization}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-705 font-sans" id="patient-management-view-container">
      
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle className="text-[#007f6e]" size={18} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
      
      {/* Dynamic Upper Tab selector pill-bar */}
      {!showForm && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit gap-1 pb-1.5 mb-4" id="patient-tab-pills">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md shadow-teal-600/10'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Users size={15} />
            <span>Patients Records</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md shadow-teal-600/10'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <BarChart2 size={15} />
            <span>Overview & Stats</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('patients-ai')}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 hover:text-teal-900 border border-transparent hover:border-teal-100/30 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles size={15} className="text-teal-600 animate-pulse" />
              <span>AI Assistant</span>
            </button>
          )}
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

            {/* Patient Online Portal Access Profile */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#007f6e]" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Login Credentials *</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50/20 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
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
              {!isReadOnly && (
                <button
                  onClick={startAdd}
                  className="bg-[#00473e] hover:bg-[#003d35] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Register Patient
                </button>
              )}
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
              {!isPatient && !isReadOnly && (
                <button
                  onClick={startAdd}
                  className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>Register New Patient</span>
                </button>
              )}
              
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
                      const patientBills = bills.filter((b) => (b.patientName || '').toLowerCase() === (p.name || '').toLowerCase());
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
                              
                              {!isReadOnly && (
                                <>
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
                                </>
                              )}
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
                <h4 className="font-extrabold text-emerald-700 border-b border-emerald-50 pb-1 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Appointments & Consultations scheduled</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatientForBooking(viewingPatient);
                      setDrawerBookingDate(getTodayDateString());
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-[#007f6e] hover:bg-[#006657] text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Book Appt</span>
                  </button>
                </h4>
                {appointments.filter((a) => (a.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase()).length === 0 ? (
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
                          .filter((a) => (a.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase())
                          .map((a) => (
                            <tr key={a.id} className="bg-white">
                              <td className="px-4 py-2 text-slate-400 font-mono text-[9px]">{a.id}</td>
                              <td className="px-4 py-2 font-bold text-slate-700">{a.doctorName}</td>
                              <td className="px-4 py-2 text-slate-500">{a.specialization}</td>
                              <td className="px-4 py-2">
                                <span className="font-semibold text-slate-600">{a.date}</span> • <span className="text-slate-400">{a.time}</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${
                                  a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  a.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  a.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  a.status === 'Scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-100 text-slate-650 border-slate-200'
                                }`}>
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
                {bills.filter((b) => (b.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase()).length === 0 ? (
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
                          .filter((b) => (b.patientName || '').toLowerCase() === (viewingPatient.name || '').toLowerCase())
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

      {/* QUICK BOOK APPOINTMENT MODAL FOR A CLIENT */}
      {selectedPatientForBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="quick-book-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-[#007f6e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar size={18} />
                <div>
                  <h3 className="text-sm font-bold">Book Schedule Slot</h3>
                  <p className="text-[11px] text-teal-50/80">Registering appointment for {selectedPatientForBooking.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForBooking(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickBookingSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">PATIENT NAME</label>
                <input
                  type="text"
                  disabled
                  value={selectedPatientForBooking.name}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-505 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">DEPARTMENT *</label>
                  <select
                    value={drawerBookingDept}
                    onChange={(e) => setDrawerBookingDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  >
                    <option value="Outpatient Department (OPD)">Outpatient Department (OPD)</option>
                    <option value="Emergency Care Ward">Emergency Care Ward</option>
                    <option value="Cardiology Department">Cardiology Department</option>
                    <option value="Pediatrics Clinic">Pediatrics Clinic</option>
                    <option value="Orthopedics Lab">Orthopedics Lab</option>
                    <option value="Neurology Dept">Neurology Dept</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">DOCTOR *</label>
                  <select
                    value={drawerBookingDoc}
                    onChange={(e) => setDrawerBookingDoc(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10 font-bold text-slate-705"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">APPOINTMENT DATE *</label>
                  <input
                    type="date"
                    value={drawerBookingDate}
                    onChange={(e) => setDrawerBookingDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">TIME SLOT *</label>
                  <select
                    value={drawerBookingSlot}
                    onChange={(e) => setDrawerBookingSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-10"
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">REASON FOR VISIT / CHIEF COMPLAINT</label>
                <input
                  type="text"
                  value={drawerBookingReason}
                  onChange={(e) => setDrawerBookingReason(e.target.value)}
                  placeholder="e.g. Regular review, High blood pressure"
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForBooking(null)}
                  className="px-5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-500 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs bg-[#007f6e] text-white font-bold rounded-xl hover:bg-[#006657] transition-all shadow-md"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
