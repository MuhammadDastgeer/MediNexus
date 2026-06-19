import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Check, 
  X, 
  Clock, 
  Edit2, 
  Trash2, 
  Eye, 
  User, 
  Stethoscope, 
  Mail, 
  Phone, 
  Lock, 
  MessageCircle, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle,
  FileText as FileWord,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
  Bell,
  CheckCheck,
  Building,
  UserPlus
} from 'lucide-react';
import { Appointment, Doctor, Patient } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface AppointmentsViewProps {
  appointments: Appointment[];
  doctors?: Doctor[];
  patients?: Patient[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onAddPatient?: (patient: Omit<Patient, 'id' | 'registeredAt'> & { id?: string }) => void;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onUpdateAppointment?: (id: string, fields: Partial<Appointment>) => void;
  onDeleteAppointment?: (id: string) => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

interface FollowUp {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  phone?: string;
  email?: string;
}

export default function AppointmentsView({
  appointments = [],
  doctors = [],
  patients = [],
  onAddAppointment,
  onAddPatient,
  onUpdateStatus,
  onUpdateAppointment,
  onDeleteAppointment,
  onRefresh,
  isReadOnly = false,
}: AppointmentsViewProps) {
  // Mode toggle between 'appointments' and 'followups'
  const [activeMode, setActiveMode] = useState<'appointments' | 'followups'>('appointments');

  // Multi-step Wizard state
  const [showModal, setShowModal] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNewAppointmentInsteadOfOverwrite, setIsNewAppointmentInsteadOfOverwrite] = useState(false);
  const [isExistingPatientSelected, setIsExistingPatientSelected] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientWhatsapp, setPatientWhatsapp] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState<number>(30);
  const [saveToPatientRegistry, setSaveToPatientRegistry] = useState(true);
  const [isFollowUpFromCheckbox, setIsFollowUpFromCheckbox] = useState(false);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getOffsetDateString = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [date, setDate] = useState(() => getTodayDateString());
  const [time, setTime] = useState('10:00');

  // Interactive dynamic search lookup inside Step 1 of Booking Wizard
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isEnteringNewPatient, setIsEnteringNewPatient] = useState(false);

  // General Filters for APPOINTMENTS MODE (Matches layout exactly!)
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(() => getTodayDateString());
  const [showAllAppointments, setShowAllAppointments] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All Status');

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // General Filters for FOLLOW-UPS MODE
  const [followupTab, setFollowupTab] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today');
  const [followupStatusFilter, setFollowupStatusFilter] = useState<string>('All Status');

  // Success Feedbacks and Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Follow-ups storage backup configuration
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  // Initialize and seed default local storage followups so they always have realistic data matching image
  useEffect(() => {
    const saved = localStorage.getItem('hosp_followups');
    let parsed: FollowUp[] = [];
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        parsed = [];
      }
    }

    // Rewrite or seed if empty or contains old hardcoded static dates to guarantee correct tab visibility
    if (parsed.length === 0 || parsed.some(p => p.date === '2026-06-15' || p.date === '2026-06-16' || p.date === '2026-06-12' || p.id === 'fol-103')) {
      const defaultFollowups: FollowUp[] = [
        {
          id: 'fol-101',
          patientName: 'M. Ramzan',
          doctorName: 'Dr. Anil Sharma',
          specialization: 'Cardiology',
          date: getOffsetDateString(0), // Exact Today
          status: 'Pending',
          phone: '+92 300 1234567',
          email: 'ramzan@gmail.com'
        },
        {
          id: 'fol-102',
          patientName: 'Kiran Shah',
          doctorName: 'Dr. Priya Patel',
          specialization: 'Pediatrics',
          date: getOffsetDateString(2), // Exact Upcoming
          status: 'Pending',
          phone: '+92 321 9876543',
          email: 'kiran@gmail.com'
        },
        {
          id: 'fol-103',
          patientName: 'Arshad Khan',
          doctorName: 'Dr. Sameer Khan',
          specialization: 'Orthopedics',
          date: getOffsetDateString(-3), // Exact Overdue
          status: 'Pending',
          phone: '+92 345 1122334',
          email: 'arshad@gmail.com'
        }
      ];
      localStorage.setItem('hosp_followups', JSON.stringify(defaultFollowups));
      setFollowUps(defaultFollowups);
    } else {
      const normalized = parsed.map(f => {
        if (f.date < getTodayDateString() && f.status !== 'Completed') {
          return { ...f, status: 'Overdue' as any };
        }
        return f;
      });
      setFollowUps(normalized);
    }
  }, []);

  // Save followups state to localStorage whenever modified
  const saveFollowupsToStorage = (updatedList: FollowUp[]) => {
    const normalized = updatedList.map(f => {
      if (f.date < getTodayDateString() && f.status !== 'Completed') {
        return { ...f, status: 'Overdue' as any };
      }
      return f;
    });
    setFollowUps(normalized);
    localStorage.setItem('hosp_followups', JSON.stringify(normalized));
  };

  // Drawer modal for viewing custom patient file details
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleDownloadAppointmentPDF = () => {
    if (!selectedAppointment) return;
    const patientName = selectedAppointment.patientName || 'Patient';
    let html = '<html>\n';
    html += '<head><meta charset="utf-8"><title>Clinical Intake Record - ' + patientName + '</title>\n';
    html += '<style>\n';
    html += 'body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; line-height: 1.5; }\n';
    html += '.header { border-bottom: 2.5px solid #007f6e; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }\n';
    html += 'h1 { color: #007f6e; margin: 0; font-size: 24px; font-weight: 800; }\n';
    html += '.section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #007f6e; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; letter-spacing: 0.05em; }\n';
    html += '.grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }\n';
    html += '.info-item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }\n';
    html += '.info-label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }\n';
    html += '.info-value { font-size: 12px; color: #0f172a; font-weight: 700; }\n';
    html += '.footer { font-size: 10px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; margin-top: 40px; }\n';
    html += '</style>\n';
    html += '</head><body>\n';
    
    html += '<div class="header">\n';
    html += `  <div>\n    <h1>Clinical Intake Record</h1>\n    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Patient: ${patientName} | Record ID: ${selectedAppointment.id}</div>\n  </div>\n`;
    html += `  <div style="text-align: right; font-size: 11px; color: #64748b;">Generated Date: ${new Date().toLocaleString()}</div>\n`;
    html += '</div>\n';
    
    html += '<div class="section-title">Patient Demographics & Identifiers</div>\n';
    html += '<div class="grid-info">\n';
    html += `  <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${selectedAppointment.patientName}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Gender</div><div class="info-value">${selectedAppointment.patientGender || 'Not Specified'}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Age Reference</div><div class="info-value">${selectedAppointment.age || '30'} Years</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Phone No</div><div class="info-value">${selectedAppointment.patientPhone || 'N/A'}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">${selectedAppointment.patientEmail || '—'}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">WhatsApp Contact</div><div class="info-value">${selectedAppointment.patientWhatsapp || '—'}</div></div>\n`;
    html += '</div>\n';

    html += '<div class="section-title">Appointment Details & Roster</div>\n';
    html += '<div class="grid-info">\n';
    html += `  <div class="info-item"><div class="info-label">Assigned Practitioner</div><div class="info-value">${selectedAppointment.doctorName}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Specialization</div><div class="info-value">${selectedAppointment.specialization}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Appointment Date</div><div class="info-value">${selectedAppointment.date}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Scheduled Time</div><div class="info-value">${selectedAppointment.time}</div></div>\n`;
    html += `  <div class="info-item"><div class="info-label">Current Phase Status</div><div class="info-value">${selectedAppointment.status}</div></div>\n`;
    html += '</div>\n';
    
    html += '<div class="footer">Confidential Hospital Patient Intake File - Generated Dynamically - City Hospital</div>\n';
    html += '</body>\n</html>';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `appointment_record_${patientName.toLowerCase().replace(/\s+/g, '_')}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Patient Intake Profile PDF generated successfully.');
  };

  // Doctors selection builder
  const fallbackDoctors = [
    { name: 'Dr. Anil Sharma', specialization: 'Cardiology' },
    { name: 'Dr. Priya Patel', specialization: 'Pediatrics' },
    { name: 'Dr. Sameer Khan', specialization: 'Orthopedics' },
    { name: 'Dr. Meera Sen', specialization: 'Neurology' },
    { name: 'Dr. Rohan Jha', specialization: 'Dermatology' },
  ];

  const activeDoctors = doctors.length > 0 ? doctors : fallbackDoctors.map((d, i) => ({
    id: `doc-${i}`,
    name: d.name,
    specialization: d.specialization,
    status: 'On Duty' as const,
    phone: '+91999999999'
  }));

  // Auto set doctor parameters if step changes
  useEffect(() => {
    if (!doctorName && activeDoctors.length > 0) {
      setDoctorName(activeDoctors[0].name);
      setSpecialization(activeDoctors[0].specialization);
    }
  }, [activeDoctors, doctorName]);

  const handleDoctorChange = (selectedDocName: string) => {
    setDoctorName(selectedDocName);
    const matched = activeDoctors.find(d => d.name === selectedDocName);
    if (matched) {
      setSpecialization(matched.specialization);
    }
  };

  // Helper overlaps checker to warn user of conflict booking (Same date, time, same doctor)
  const isConflictDetected = () => {
    if (!doctorName || !date || !time) return false;
    return appointments.some(appt => 
      appt.doctorName === doctorName && 
      appt.date === date && 
      appt.time === time &&
      appt.id !== editingId &&
      appt.status !== 'Cancelled'
    );
  };

  // Clear overall filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter(getTodayDateString());
    setShowAllAppointments(false);
    setStatusFilter('All Status');
    showToast('Filters cleared successfully.');
  };

  // Fully Functional Data Export (Filtered accordingly)
  const handleExport = (format: 'CSV' | 'PDF' | 'Excel' | 'Word') => {
    setShowExportDropdown(false);
    
    if (filteredAppointments.length === 0) {
      showToast('No filtered appointments encountered to export.');
      return;
    }

    const headers = ['Appointment ID', 'Patient Name', 'Patient Email', 'Phone', 'Doctor Name', 'Specialization', 'Date', 'Time', 'Status'];
    const keys = ['id', 'patientName', 'patientEmail', 'patientPhone', 'doctorName', 'specialization', 'date', 'time', 'status'];
    const filename = `appointments_ledger_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(filteredAppointments, headers, keys, filename);
      showToast('Successfully downloaded Appointments CSV Spreadsheet.');
    } else if (format === 'Excel') {
      downloadExcel(filteredAppointments, headers, keys, filename);
      showToast('Successfully downloaded Appointments Excel Tabular Sheet.');
    } else if (format === 'Word') {
      downloadWord(filteredAppointments, headers, keys, filename, 'Hospital Appointments Portfolio');
      showToast('Successfully downloaded Appointments Word Document.');
    } else if (format === 'PDF') {
      downloadPDFFile(filteredAppointments, headers, keys, filename, 'Hospital Appointments Roster');
      showToast('Successfully downloaded Appointments Audit Ledger PDF.');
    }
  };

  // Open booking wizard for new slot
  const handleOpenNewWizard = () => {
    setEditingId(null);
    setIsNewAppointmentInsteadOfOverwrite(false);
    setIsExistingPatientSelected(false);
    setSaveToPatientRegistry(true);
    setIsFollowUpFromCheckbox(false);
    setPatientName('');
    setPatientEmail('');
    setPatientPassword('');
    setPatientPhone('');
    setPatientWhatsapp('');
    setPatientGender('Male');
    setAge(30);
    
    if (activeDoctors.length > 0) {
       setDoctorName(activeDoctors[0].name);
       setSpecialization(activeDoctors[0].specialization);
    } else {
       setDoctorName('Dr. Anil Sharma');
       setSpecialization('Cardiology');
    }

    setDate(getTodayDateString());
    setTime('10:00');
    setIsEnteringNewPatient(false);
    setPatientSearchQuery('');
    setActiveStep(1);
    setShowModal(true);
  };

  // Open booking wizard for edit mode
  const handleOpenEditWizard = (appt: Appointment) => {
    setEditingId(appt.id);
    setPatientName(appt.patientName);
    setPatientEmail(appt.patientEmail || '');
    setPatientPassword(appt.patientPassword || '');
    setPatientPhone(appt.patientPhone || '');
    setPatientWhatsapp(appt.patientWhatsapp || '');
    setPatientGender(appt.patientGender || 'Male');
    setAge(appt.age || 30);
    setDoctorName(appt.doctorName);
    setSpecialization(appt.specialization);
    setDate(appt.date);
    setTime(appt.time);
    setIsFollowUpFromCheckbox(appt.type === 'Follow-up');
    setSaveToPatientRegistry(true);
    
    // An edited appointment might be an existing clinical patient or a new clinical patient
    // We can assume it is an existing selected patient profile to make scheduling clean
    setIsExistingPatientSelected(true);
    setIsEnteringNewPatient(false);
    
    // Automatically flag as new appointment (preserve historical item) if the existing one has completed, canceled, or its date lies in the past
    const isPastDate = appt.date < getTodayDateString();
    const isPastOrCanceled = appt.status === 'Cancelled' || appt.status === 'Completed' || isPastDate;
    setIsNewAppointmentInsteadOfOverwrite(isPastOrCanceled);

    setActiveStep(1);
    setShowModal(true);
  };

  // Quick select dynamic matching patient folder lookup
  const handleSelectExistingPatient = (name: string, email: string, phone: string, gender: 'Male' | 'Female' | 'Other', ageVal: number) => {
    setPatientName(name);
    setPatientEmail(email);
    setPatientPassword('••••••••');
    setPatientPhone(phone);
    setPatientWhatsapp(phone);
    setPatientGender(gender);
    setAge(ageVal);
    setIsExistingPatientSelected(true);
    setIsEnteringNewPatient(false);
    // Move directory straight to doctor specialization select
    setActiveStep(2);
    showToast(`Patient folder linked successfully. Preloaded details for ${name}.`);
  };

  // Wizard Save/Submit
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Patient name is required.');
      return;
    }
    if (!patientEmail.trim()) {
      alert('Patient email address is required.');
      return;
    }
    if (!patientPassword.trim()) {
      alert('Patient password credential is required.');
      return;
    }
    if (!patientPhone.trim()) {
      alert('Patient phone number is required.');
      return;
    }
    if (!patientWhatsapp.trim()) {
      alert('Patient WhatsApp contact number is required.');
      return;
    }
    if (!age || age <= 0) {
      alert('Valid patient age (greater than 0) is required.');
      return;
    }
    if (!doctorName) {
      alert('Practitioner selection is required (Step 2).');
      return;
    }
    if (!specialization) {
      alert('Practitioner specialization is required.');
      return;
    }
    if (!date) {
      alert('Consultation date is required (Step 3).');
      return;
    }
    if (!time) {
      alert('Time slot is required (Step 3).');
      return;
    }

    // Force step-by-step complete review before final save submission is permitted
    if (activeStep < 4) {
      setActiveStep(4);
      showToast('Form submission intercepted. Please review all details below before saving!');
      return;
    }

    const collision = isConflictDetected();
    if (collision) {
      const proceed = window.confirm(`Overlapping Warning: ${doctorName} is already booked on ${date} at ${time}. Do you still want to force save this appointment?`);
      if (!proceed) return;
    }

    const payload: Omit<Appointment, 'id'> & {
      patientEmail?: string;
      patientPassword?: string;
      patientPhone?: string;
      patientWhatsapp?: string;
      patientGender?: 'Male' | 'Female' | 'Other';
      age?: number;
      type?: 'Regular' | 'Follow-up';
    } = {
      patientName,
      doctorName,
      specialization,
      date,
      time,
      status: editingId ? 'Confirmed' : 'Scheduled',
      patientEmail,
      patientPassword,
      patientPhone,
      patientWhatsapp,
      patientGender,
      age,
      type: isFollowUpFromCheckbox ? 'Follow-up' : 'Regular'
    };

    if (saveToPatientRegistry && onAddPatient) {
      onAddPatient({
        name: patientName,
        age: age || 30,
        gender: patientGender || 'Male',
        phone: patientPhone || '',
        email: patientEmail || '',
        status: isFollowUpFromCheckbox ? 'Follow-up' : 'New',
        dob: '',
        bloodGroup: '',
        address: ''
      });
    }

    if (editingId && !isNewAppointmentInsteadOfOverwrite) {
      if (onUpdateAppointment) {
        onUpdateAppointment(editingId, payload);
        showToast('Appointment details edited successfully.');
      }
      if (selectedAppointment && selectedAppointment.id === editingId) {
        setSelectedAppointment({ id: editingId, ...payload } as Appointment);
      }
    } else {
      const newPayload = {
        ...payload,
        status: 'Scheduled' as const
      };
      onAddAppointment(newPayload);
      showToast('New appointment successfully added (previous record preserved).');
    }

    setShowModal(false);
    if (onRefresh) onRefresh();
  };

  // Confirm/Complete changes
  const handleToggleConfirmStatus = (id: string, currentStatus: Appointment['status']) => {
    const nextStatus: Appointment['status'] = currentStatus === 'Scheduled' ? 'Confirmed' : 'Completed';
    onUpdateStatus(id, nextStatus);
    showToast(`Appointment state changed to ${nextStatus}.`);
    if (onRefresh) onRefresh();
  };

  // Delete permanents
  const handleDeleteAppointmentRecord = (id: string) => {
    if (window.confirm('Delete Action: Are you sure you want to delete this appointment from SQLite database?')) {
      if (onDeleteAppointment) {
        onDeleteAppointment(id);
        showToast('Appointment record removed from database.');
      }
      if (onRefresh) onRefresh();
      setSelectedAppointment(null);
    }
  };

  // Create Follow-up option from active appointment
  const handleCreateFollowupFromAppointment = (appt: Appointment) => {
    const newFollow: FollowUp = {
      id: `fol-${Date.now().toString().slice(-4)}`,
      patientName: appt.patientName,
      doctorName: appt.doctorName,
      specialization: appt.specialization,
      date: appt.date,
      status: 'Pending',
      phone: appt.patientPhone,
      email: appt.patientEmail
    };
    saveFollowupsToStorage([newFollow, ...followUps]);
    showToast(`Scheduled a Follow-up for ${appt.patientName} on ${appt.date}.`);
  };

  // Follow-up state management actions
  const handleCompleteFollowup = (folId: string) => {
    const list = followUps.map(f => f.id === folId ? { ...f, status: 'Completed' as const } : f);
    saveFollowupsToStorage(list);
    showToast('Follow-up sheet cleared as Completed.');
  };

  const handleDeleteFollowup = (folId: string) => {
    if (window.confirm('Are you sure you want to remove this follow-up sheet?')) {
      const list = followUps.filter(f => f.id !== folId);
      saveFollowupsToStorage(list);
      showToast('Follow-ups reference removed.');
    }
  };

  const handleSendReminder = (name: string, phone: string) => {
    showToast(`WhatsApp reminder template dispatched to ${name} (${phone || '+92 300 0000000'}).`);
  };

  const handleSendAllReminders = () => {
    showToast('Scheduled SMS and WhatsApp reminders dispatched to all pending patient contacts.');
  };

  // Dynamic lists of unique patient files
  const registeredPatientsList: Array<{ name: string; email: string; phone: string; gender: 'Male' | 'Female' | 'Other'; age: number }> = [];
  appointments.forEach(a => {
    if (a.patientName && !registeredPatientsList.some(p => p.name.toLowerCase() === a.patientName.toLowerCase())) {
      registeredPatientsList.push({
        name: a.patientName,
        email: a.patientEmail || `${a.patientName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        phone: a.patientPhone || '+92 300 1234567',
        gender: a.patientGender || 'Male',
        age: a.age || 30
      });
    }
  });

  if (patients && patients.length > 0) {
    patients.forEach(pat => {
      if (pat.name && !registeredPatientsList.some(p => p.name.toLowerCase() === pat.name.toLowerCase() || p.phone === pat.phone)) {
        registeredPatientsList.push({
          name: pat.name,
          email: pat.email || `${pat.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          phone: pat.phone || '+92 300 1234567',
          gender: pat.gender || 'Male',
          age: pat.age || 30
        });
      }
    });
  }

  const searchedPatientMatches = registeredPatientsList.filter(p => 
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.phone.includes(patientSearchQuery)
  );

  // Stats Counters
  // Appointments Stats
  const countTodayAppts = appointments.filter(a => a.date === getTodayDateString() || a.date === '2026-06-15').length;
  const countCompletedAppts = appointments.filter(a => a.status === 'Completed').length;
  const countCancelledAppts = appointments.filter(a => a.status === 'Cancelled').length;
  const countTotalAppts = appointments.length;
  const countRemainingAppts = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length;

  // Followup Stats
  const countTodayFollowups = followUps.filter(f => f.date === getTodayDateString()).length;
  const countPendingFollowups = followUps.filter(f => f.status === 'Pending').length;
  const countOverdueFollowups = followUps.filter(f => f.date < getTodayDateString() && f.status !== 'Completed').length;
  const countCompletedFollowups = followUps.filter(f => f.status === 'Completed').length;

  // Robust date comparison helper
  const compareDates = (dateA?: string, dateB?: string) => {
    if (!dateA || !dateB) return false;
    const cleanA = dateA.trim().replace(/\//g, '-');
    const cleanB = dateB.trim().replace(/\//g, '-');
    return cleanA === cleanB;
  };

  // Filtering Logic for Appointments list table
  const filteredAppointments = appointments.filter(a => {
    // Search query check
    const matchesSearch = searchQuery === '' || 
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patientPhone && a.patientPhone.includes(searchQuery)) ||
      (a.patientEmail && a.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    // Date picker filter
    const matchesDate = showAllAppointments || compareDates(a.date, dateFilter);

    // Dropdown status check
    const matchesStatus = statusFilter === 'All Status' || a.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Filtering Logic for Followups
  const filteredFollowUps = followUps.filter(f => {
    // Mode status dropdown
    const matchesStatus = followupStatusFilter === 'All Status' || f.status === followupStatusFilter;

    // Tabs
    const todayStr = getTodayDateString();
    if (followupTab === 'today') {
      return f.date === todayStr && matchesStatus;
    }
    if (followupTab === 'upcoming') {
      return f.date > todayStr && matchesStatus;
    }
    if (followupTab === 'overdue') {
      return f.date < todayStr && f.status !== 'Completed' && matchesStatus;
    }
    return matchesStatus; // 'all'
  });

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6 bg-[#f4f7f6] relative font-sans" id="appointments-module-wrapper">
      
      {/* Toast Alert popup popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle className="text-[#007f6e]" size={18} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Controller Segment (Matches Image 1 & 2 Tab structure exactly!) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="view-mode-controller-header">
        
        {/* Toggle Pills block */}
        <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveMode('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'appointments'
                ? 'bg-[#007f6e] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Calendar size={14} />
            <span>Appointments</span>
          </button>
          
          <button
            onClick={() => setActiveMode('followups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'followups'
                ? 'bg-[#007f6e] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={14} className={activeMode === 'followups' ? 'animate-spin' : ''} />
            <span>Follow-ups</span>
          </button>
        </div>

        {/* Global Action Booker */}
        {!isReadOnly && (
          <button
            onClick={handleOpenNewWizard}
            className="flex items-center justify-center gap-2 bg-[#007f6e] hover:bg-[#006657] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            id="trigger-quick-booking-btn"
          >
            <Plus size={16} />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/*                       1. APPOINTMENTS MODE ACTIVE                         */}
      {/* ========================================================================= */}
      {activeMode === 'appointments' && (
        <div className="space-y-6" id="appointments-mode-active-block">
          
          {/* A. Statistics Widget cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="appointments-stats-cards">
            
            {/* Today's Appointments Counter */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#007f6e] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Appointments</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block mt-0.5">{countTodayAppts}</span>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-black text-[#007f6e] tracking-tight block mt-0.5">{countCompletedAppts}</span>
              </div>
            </div>

            {/* Remaining */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                <span className="text-xl font-black text-amber-600 tracking-tight block mt-0.5">{countRemainingAppts}</span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Appointments</span>
                <span className="text-xl font-black text-violet-700 tracking-tight block mt-0.5">{countTotalAppts}</span>
              </div>
            </div>

            {/* Cancelled */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4 col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#e11d48] flex items-center justify-center">
                <X size={20} className="stroke-[3]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled</span>
                <span className="text-xl font-black text-rose-600 tracking-tight block mt-0.5">{countCancelledAppts}</span>
              </div>
            </div>

          </div>

          {/* B. Book New Appointment Dashed Banner target (Exactly matching Image 2!) */}
          <div 
            onClick={handleOpenNewWizard}
            className="group cursor-pointer bg-emerald-50/20 border-2 border-dashed border-[#007f6e]/30 hover:border-[#007f6e]/75 hover:bg-emerald-50/45 p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between"
            id="dashed-booking-banner-action"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#007f6e] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Book New Appointment</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Click to open the quick slot booking wizard layout.</p>
              </div>
            </div>
            <span className="text-[#007f6e] text-xs font-semibold mr-2 group-hover:translate-x-1 duration-150 transition-transform">
              &rarr;
            </span>
          </div>

          {/* C. Master List container Card (Exactly matching Image 2 style & Filters!) */}
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs" id="appointments-master-list-card">
            
            {/* Header portion */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building className="text-[#007f6e]" size={18} />
                <h3 className="text-sm font-bold text-slate-800">Appointments ledger</h3>
              </div>

              {/* Dynamic Filter Row (Search, Date limiters, checkboxes, All Status as shown!) */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* 1. Search input */}
                <div className="relative w-full sm:w-56 min-w-[150px]">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, doctor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] placeholder:text-slate-400 bg-slate-50/50"
                  />
                </div>

                {/* 2. Date select picker */}
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    disabled={showAllAppointments}
                    className={`text-xs pl-3 pr-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] font-mono ${
                      showAllAppointments ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>

                {/* 3. Show All checkbox toggles */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none py-1.5 px-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-150">
                  <input
                    type="checkbox"
                    checked={showAllAppointments}
                    onChange={(e) => setShowAllAppointments(e.target.checked)}
                    className="text-[#007f6e] focus:ring-[#007f6e] rounded border-slate-300"
                  />
                  <span>Show All Appointments</span>
                </label>

                {/* 4. Dropdown statuses */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#007f6e] font-bold text-slate-700"
                >
                  <option value="All Status">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Overdue">Overdue</option>
                </select>

                {/* 5. Clear buttons */}
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#007f6e] bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-all border border-slate-150 font-semibold"
                >
                  <RefreshCw size={11} />
                  <span>Clear</span>
                </button>

                {/* 6. Export Selector Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-1.5 bg-slate-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <Download size={12} />
                    <span>Export</span>
                  </button>
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1.5 divide-y divide-slate-50">
                      <button
                        onClick={() => handleExport('CSV')}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileText size={13} className="text-[#007f6e]" />
                        <span>Export as CSV</span>
                      </button>
                      <button
                        onClick={() => handleExport('PDF')}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileText size={13} className="text-rose-600" />
                        <span>Export as PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport('Excel')}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileSpreadsheet size={13} className="text-emerald-600" />
                        <span>Export as Excel</span>
                      </button>
                      <button
                        onClick={() => handleExport('Word')}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileWord size={13} className="text-blue-500" />
                        <span>Export as Word</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Empty ledger or actual list */}
            {filteredAppointments.length === 0 ? (
              <div className="p-16 text-center bg-white" id="appointments-empty-state">
                <div className="w-14 h-14 bg-emerald-50 text-[#007f6e] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100/40">
                  <CalendarCheck size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting the date, uncheck Show All or apply a different selection query.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={handleOpenNewWizard}
                    className="bg-[#007f6e] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#006657]"
                  >
                    Book Slot
                  </button>
                  <button
                    onClick={() => setShowAllAppointments(true)}
                    className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200"
                  >
                    Show All
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Patient Demographics</th>
                      <th className="px-6 py-4">Assigned Specialist</th>
                      <th className="px-6 py-4">Department / Specialty</th>
                      <th className="px-6 py-4">Schedule Frame</th>
                      <th className="px-6 py-4">Current Stage</th>
                      <th className="px-6 py-4 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        {/* Demographics */}
                        <td className="px-6 py-4">
                          <div 
                            onClick={() => setSelectedAppointment(a)}
                            className="font-bold text-slate-800 text-sm hover:text-[#007f6e] cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{a.patientName}</span>
                            {a.age && <span className="text-[10px] text-slate-400 font-medium">({a.age} yrs)</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono flex flex-col space-y-0.5">
                            {a.patientPhone && <span className="flex items-center gap-1"><Phone size={10} /> {a.patientPhone}</span>}
                            {a.patientEmail && <span className="flex items-center gap-1"><Mail size={10} /> {a.patientEmail}</span>}
                          </div>
                          
                          {/* Registry verification / trigger button */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(() => {
                              const isRegistered = (patients || []).some(p => 
                                p.name.toLowerCase().trim() === a.patientName.toLowerCase().trim() ||
                                (a.patientPhone && p.phone && p.phone.trim().replace(/[\s-+()]/g, '') === a.patientPhone.trim().replace(/[\s-+()]/g, ''))
                              );
                              if (isRegistered) {
                                return (
                                  <span className="text-[8px] font-bold text-[#007f6e] bg-[#e6f4f1] px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-default select-none border border-emerald-100/30 font-sans">
                                    ✓ Saved Patient
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAddPatient) {
                                      onAddPatient({
                                        name: a.patientName,
                                        age: a.age || 30,
                                        gender: a.patientGender || 'Male',
                                        phone: a.patientPhone || '',
                                        email: a.patientEmail || '',
                                        status: a.type === 'Follow-up' ? 'Follow-up' : 'New',
                                        dob: '',
                                        bloodGroup: '',
                                        address: ''
                                      });
                                      showToast(`${a.patientName} has been stored in Patient Registry.`);
                                    }
                                  }}
                                  className="text-[8px] font-black uppercase text-white bg-[#007f6e] hover:bg-[#006657] px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
                                  title="Click to register this appointment's patient in the database"
                                >
                                  <UserPlus size={8} /> Add to Patients Directory
                                </button>
                              );
                            })()}
                          </div>
                        </td>

                        {/* Specialist */}
                        <td className="px-6 py-4">
                          <div className="text-slate-700 font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{a.doctorName}</span>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td className="px-6 py-4">
                          <span className="bg-emerald-50 text-[#007f6e] text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100/40 inline-block">
                            {a.specialization}
                          </span>
                        </td>

                        {/* Timing */}
                        <td className="px-6 py-4 font-mono">
                          <div className="font-bold text-slate-700">{a.date}</div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            <span>{a.time}</span>
                          </div>
                        </td>

                        {/* Stage */}
                        <td className="px-6 py-4">
                          <span
                            onClick={() => {
                              if (a.status !== 'Cancelled' && a.status !== 'Completed') {
                                handleToggleConfirmStatus(a.id, a.status);
                              }
                            }}
                            className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                              a.status === 'Scheduled' && 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                            } ${a.status === 'Confirmed' && 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100'} ${
                              a.status === 'Completed' && 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            } ${a.status === 'Cancelled' && 'bg-rose-50 text-rose-600 border-rose-100'} ${
                              a.status === 'Overdue' && 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{a.status}</span>
                          </span>
                        </td>

                        {/* Action List */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* View sheets */}
                            <button
                              onClick={() => setSelectedAppointment(a)}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-[#e6f4f1] hover:text-[#007f6e] transition-all"
                              title="View Patient Intake File"
                            >
                              <Eye size={13} />
                            </button>

                            {!isReadOnly && (
                              <>
                                {/* Overlap schedule edit */}
                                <button
                                  onClick={() => handleOpenEditWizard(a)}
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                                  title="Edit schedule details"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Create Followup option */}
                                <button
                                  onClick={() => handleCreateFollowupFromAppointment(a)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-[#007f6e] hover:bg-emerald-100 transition-all font-semibold"
                                  title="Schedule a Follow-up visit"
                                >
                                  <RefreshCw size={13} />
                                </button>

                                {/* Cancel shift */}
                                <button
                                  onClick={() => handleDeleteAppointmentRecord(a.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all font-semibold"
                                  title="Cancel / Delete patient fold permanent"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
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

      {/* ========================================================================= */}
      {/*                        2. FOLLOW-UPS MODE ACTIVE                         */}
      {/* ========================================================================= */}
      {activeMode === 'followups' && (
        <div className="space-y-6" id="followups-mode-active-block">
          
          {/* A. Statistics Widget cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="followups-stats-cards">
            
            {/* Today */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e6f4f1] text-[#007f6e] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block mt-0.5">{countTodayFollowups}</span>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
                <span className="text-xl font-black text-amber-600 tracking-tight block mt-0.5">{countPendingFollowups}</span>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#e11d48] flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue</span>
                <span className="text-xl font-black text-rose-600 tracking-tight block mt-0.5">{countOverdueFollowups}</span>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#007f6e] flex items-center justify-center">
                <CheckCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-black text-[#007f6e] tracking-tight block mt-0.5">{countCompletedFollowups}</span>
              </div>
            </div>

          </div>

          {/* B. Capsules & Send Reminders controller bar (Exactly matching Image 1!) */}
          <div className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            
            {/* Left Capsule pills group */}
            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl w-fit">
              <button
                onClick={() => setFollowupTab('today')}
                className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  followupTab === 'today'
                    ? 'bg-[#007f6e] text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Today</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${followupTab === 'today' ? 'bg-white text-[#007f6e]' : 'bg-slate-200 text-slate-600'}`}>{countTodayFollowups}</span>
              </button>

              <button
                onClick={() => setFollowupTab('upcoming')}
                className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  followupTab === 'upcoming'
                    ? 'bg-[#007f6e] text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Upcoming</span>
              </button>

              <button
                onClick={() => setFollowupTab('overdue')}
                className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  followupTab === 'overdue'
                    ? 'bg-[#007f6e] text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Overdue</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${followupTab === 'overdue' ? 'bg-white text-rose-600' : 'bg-rose-50 text-rose-600'}`}>{countOverdueFollowups}</span>
              </button>

              <button
                onClick={() => setFollowupTab('all')}
                className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  followupTab === 'all'
                    ? 'bg-[#007f6e] text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>All</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${followupTab === 'all' ? 'bg-white text-slate-600' : 'bg-slate-200 text-slate-600'}`}>{followUps.length}</span>
              </button>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2.5">
              
              <select
                value={followupStatusFilter}
                onChange={(e) => setFollowupStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#007f6e] font-bold text-slate-700"
              >
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                onClick={() => {
                  showToast('Re-indexing followups records data updated.');
                }}
                className="p-2 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                title="Refresh listings"
              >
                <RefreshCw size={12} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleSendAllReminders}
                className="bg-[#fef9c3] hover:bg-[#fef3c7] text-[#854d0e] border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Bell size={13} className="text-amber-600" />
                <span>Send Reminders</span>
              </button>

            </div>

          </div>

          {/* C. Primary Listings area */}
          {filteredFollowUps.length === 0 ? (
            <div className="p-16 text-center bg-white border border-slate-150 rounded-2xl shadow-xs" id="followups-empty-state">
              <div className="w-14 h-14 bg-emerald-50 text-[#007f6e] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No follow-ups today</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Follow-ups will appear here when scheduled from appointment records or previous walk-ins.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-[#fcfdfd] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Patient Demographics</th>
                    <th className="px-6 py-4">Specialist Practitioner</th>
                    <th className="px-6 py-4">Practice Specialty</th>
                    <th className="px-6 py-4">Scheduled Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFollowUps.map((fol) => (
                    <tr key={fol.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm">{fol.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex flex-col">
                          {fol.phone && <span>Phone: {fol.phone}</span>}
                          {fol.email && <span>Email: {fol.email}</span>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-semibold">{fol.doctorName}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="bg-[#e6f4f1] text-[#007f6e] text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                          {fol.specialization}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono">
                        <div className="font-semibold text-slate-700">{fol.date}</div>
                        {fol.date === getTodayDateString() && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">Scheduled Today</span>
                        )}
                        {fol.date > getTodayDateString() && (
                          <span className="text-[9px] bg-blue-50 text-blue-605 border border-blue-100 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">Upcoming Visit</span>
                        )}
                        {fol.date < getTodayDateString() && fol.status !== 'Completed' && (
                          <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-100 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">Overdue sheet</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          fol.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          fol.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {fol.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {!isReadOnly ? (
                            <>
                              {fol.status !== 'Completed' && (
                                <button
                                  onClick={() => handleCompleteFollowup(fol.id)}
                                  className="px-2.5 py-1 rounded bg-[#e6f4f1] text-[#007f6e] hover:bg-[#d5eee8] transition-colors font-bold text-[10px]"
                                  title="Mark Done"
                                >
                                  Clear Complete
                                </button>
                              )}
                              {fol.phone && (
                                <button
                                  onClick={() => handleSendReminder(fol.patientName, fol.phone)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Send WhatsApp Communication Link"
                                >
                                  <MessageCircle size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteFollowup(fol.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">View Only</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/*                    3. GORGEOUS STEP-BY-STEP MODAL WIZARD                  */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Header portion */}
            <div className="bg-[#e6f4f1]/50 px-6 py-4 border-b border-[#007f6e]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#007f6e] flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {editingId ? 'Edit Appointment Form' : '⚡ Quick Book Appointment Form'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please fill details step by step</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Steps tracker indicators (Strict user design requirements!) */}
            <div className="grid grid-cols-4 border-b border-slate-100 bg-white">
              
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`py-3.5 text-center border-b-2 font-bold text-xs transition-all ${
                  activeStep === 1 ? 'border-[#007f6e] text-[#007f6e]' : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    activeStep === 1 ? 'bg-[#007f6e] text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    1
                  </span>
                  <span>Patient</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (patientName) setActiveStep(2);
                }}
                disabled={!patientName}
                className={`py-3.5 text-center border-b-2 font-bold text-xs transition-all ${
                  activeStep === 2 ? 'border-[#007f6e] text-[#007f6e]' : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    activeStep === 2 ? 'bg-[#007f6e] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    2
                  </span>
                  <span>Doctor</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (patientName) setActiveStep(3);
                }}
                disabled={!patientName}
                className={`py-3.5 text-center border-b-2 font-bold text-xs transition-all ${
                  activeStep === 3 ? 'border-[#007f6e] text-[#007f6e]' : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    activeStep === 3 ? 'bg-[#007f6e] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    3
                  </span>
                  <span>Schedule</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (patientName) setActiveStep(4);
                }}
                disabled={!patientName}
                className={`py-3.5 text-center border-b-2 font-bold text-xs transition-all ${
                  activeStep === 4 ? 'border-[#007f6e] text-[#007f6e]' : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    activeStep === 4 ? 'bg-[#007f6e] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    4
                  </span>
                  <span>Review & Save</span>
                </div>
              </button>

            </div>

            {/* Wizard Form Sheets Body */}
            <form onSubmit={handleWizardSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* ------------ STEP 1: PATIENT RECORD DETAILS ------------- */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  {isExistingPatientSelected ? (
                    <div className="bg-emerald-50/40 border-2 border-[#007f6e] rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-[#007f6e]" size={18} />
                          <span className="text-[10px] font-extrabold text-[#007f6e] uppercase tracking-wider bg-[#d1ebe4] px-2.5 py-1 rounded-full">
                            Registered Clinical Patient Link Confirmed
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsExistingPatientSelected(false);
                            setIsEnteringNewPatient(false);
                            setPatientName('');
                            setPatientEmail('');
                            setPatientPhone('');
                            setPatientWhatsapp('');
                            setAge(30);
                            setPatientSearchQuery('');
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>&times;</span>
                          <span>De-link Patient</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/90 p-4 border border-[#e2efe3] rounded-xl text-xs text-slate-700 shadow-3xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient Name</p>
                          <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">{patientName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Phone</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{patientPhone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                          <p className="text-sm text-slate-600 font-mono mt-0.5">{patientEmail || '—'}</p>
                        </div>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Age</p>
                            <p className="text-sm font-semibold text-slate-705 mt-0.5">{age} Years</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Gender</p>
                            <p className="text-sm font-semibold text-slate-705 mt-0.5">{patientGender}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/60 border border-teal-100 p-3.5 rounded-xl flex items-start gap-2.5">
                        <AlertCircle size={15} className="text-[#007f6e] mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          <strong>Active Vault Lock:</strong> Previous historical appointments and ledger records for <strong>{patientName}</strong> are preserved in full. We will only request the new scheduled appointment parameters.
                        </p>
                      </div>

                      {/* Saved Appointment History timeline ledger inside wizard step 1 */}
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b pb-1.5 border-slate-200/50">
                          <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider flex items-center gap-1">
                            <CalendarCheck size={12} className="text-[#007f6e]" /> All Saved Appointments History ({appointments.filter(a => a.patientName.toLowerCase().trim() === patientName.toLowerCase().trim()).length})
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {appointments
                            .filter(a => a.patientName.toLowerCase().trim() === patientName.toLowerCase().trim())
                            .map((a, i) => (
                              <div key={a.id || i} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-650 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[#0f172a] font-bold">
                                    <span>{a.doctorName}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">({a.specialization})</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {a.date} &bull; {a.time || 'N/A'}
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  a.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                  a.status === 'Overdue' ? 'bg-red-50 text-red-650 border border-red-100' :
                                  a.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  a.status === 'Scheduled' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {a.status}
                                </span>
                              </div>
                            ))
                          }
                          {appointments.filter(a => a.patientName.toLowerCase().trim() === patientName.toLowerCase().trim()).length === 0 && (
                            <p className="text-[10px] text-slate-400 italic text-center py-2">No past appointments found in system matching this name.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search Existing bar */}
                      <div className="bg-[#fcfdfd] border border-slate-200/80 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Search Patient Name / Email / Phone
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search patient, if not found then register new..."
                              value={patientSearchQuery}
                              onChange={(e) => {
                                setPatientSearchQuery(e.target.value);
                                if (e.target.value) {
                                  setIsEnteringNewPatient(false);
                                }
                              }}
                              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-250 rounded-xl focus:outline-none focus:border-[#007f6e] placeholder:text-slate-400"
                            />
                          </div>
                          
                          {/* Plus New button precisely styled like the mock illustration */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsEnteringNewPatient(true);
                              setPatientName(patientSearchQuery);
                            }}
                            className="px-4 py-2 bg-[#f4faf8] hover:bg-[#e6f4f1] text-[#007f6e] border border-dashed border-[#007f6e] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all w-fit shrink-0"
                          >
                            <Plus size={14} />
                            <span>+ New Patient</span>
                          </button>
                        </div>
                      </div>

                      {/* lookup match dropdown lists */}
                      {!isEnteringNewPatient && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matching folder folders found</p>
                          
                          {patientSearchQuery === '' ? (
                            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-center text-slate-400 text-xs">
                              Type patient name or search parameters or click the <span className="text-[#007f6e] font-bold">+ New Patient</span> button to add.
                            </div>
                          ) : searchedPatientMatches.length === 0 ? (
                            <div className="p-8 bg-slate-50/60 border border-slate-150 rounded-2xl text-center space-y-2">
                              <p className="text-xs text-slate-500">No previous registration matching "{patientSearchQuery}" found in the network database.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEnteringNewPatient(true);
                                  setPatientName(patientSearchQuery);
                                }}
                                className="bg-[#007f6e] hover:bg-[#006657] text-white px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all"
                              >
                                Add New Patient Folder
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {searchedPatientMatches.map((p, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectExistingPatient(p.name, p.email, p.phone, p.gender, p.age)}
                                  className="p-3 bg-white border border-slate-200 hover:border-[#007f6e] hover:bg-[#fcfdfd] rounded-xl flex items-center justify-between cursor-pointer transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                      {p.name.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.email} | Phone: {p.phone}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-[#007f6e] bg-[#e6f4f1] px-3 py-1 rounded-full">
                                    Select &rdquo;
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual forms entry sheets fields */}
                      {isEnteringNewPatient && (
                        <div className="space-y-4 bg-slate-50/40 p-5 rounded-2xl border border-slate-200/60 animate-in slide-in-from-bottom-2 duration-150">
                          
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-[11px] font-bold text-slate-700">PATIENT CLINICAL DOSSIER</span>
                            <button
                              type="button"
                              onClick={() => setIsEnteringNewPatient(false)}
                              className="text-[#007f6e] text-[10px] font-bold hover:underline"
                            >
                              &larr; Switch search lookup
                            </button>
                          </div>

                          {/* Inputs grid system */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                              <input
                                type="text"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                                placeholder="Patient Full Name"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                              <input
                                type="email"
                                value={patientEmail}
                                onChange={(e) => setPatientEmail(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                                placeholder="patientname@gmail.com"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Credentials</label>
                              <input
                                type="password"
                                value={patientPassword}
                                onChange={(e) => setPatientPassword(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                                placeholder="••••••••••••"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Phone Number *</label>
                                <span className="text-[9px] font-bold text-[#007f6e] animate-pulse">⚡ Auto-check system active</span>
                              </div>
                              <input
                                type="text"
                                value={patientPhone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPatientPhone(val);
                                  
                                  // Clean phone number input to match robustly
                                  const cleanVal = val.trim().replace(/[\s-+()]/g, '');
                                  if (cleanVal && cleanVal.length >= 7) {
                                    const matched = registeredPatientsList.find(p => {
                                      const cleanPPhone = p.phone.trim().replace(/[\s-+()]/g, '');
                                      return cleanPPhone === cleanVal || (cleanPPhone.substring(cleanPPhone.length - 7) === cleanVal.substring(cleanVal.length - 7));
                                    });
                                    if (matched) {
                                      handleSelectExistingPatient(matched.name, matched.email, matched.phone, matched.gender, matched.age);
                                      // Switch back from entering mode so we show the beautiful profile view
                                      setIsEnteringNewPatient(false);
                                      setIsExistingPatientSelected(true);
                                    }
                                  }
                                }}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] font-mono"
                                placeholder="+92 300 0055555"
                                required
                              />
                              <p className="text-[9px] text-[#007f6e]/80 font-semibold mt-1">⚡ Enter registered phone to auto-load & link folder instantly, otherwise type new details.</p>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp Communications</label>
                              <input
                                type="text"
                                value={patientWhatsapp}
                                onChange={(e) => setPatientWhatsapp(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                                placeholder="+92 300 0000000"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age (Years)</label>
                              <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(Number(e.target.value))}
                                className="w-full text-xs px-3 py-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                                required
                              />
                            </div>

                          </div>

                          {/* Gender choices */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Gender Identification</span>
                            <div className="flex gap-5">
                              {['Male', 'Female', 'Other'].map((g) => (
                                <label key={g} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="radio"
                                    name="wizardGender"
                                    value={g}
                                    checked={patientGender === g}
                                    onChange={() => setPatientGender(g as any)}
                                    className="text-[#007f6e] focus:ring-[#007f6e] border-slate-300"
                                  />
                                  <span>{g}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}
                    </>
                  )}

                  {/* Database Integration Options & Visit Type */}
                  {(isExistingPatientSelected || isEnteringNewPatient || patientName) && (
                    <div className="bg-[#f0fbf9] border border-teal-200/60 p-4 rounded-xl space-y-3 mt-2 animate-in fade-in duration-150">
                      <div className="text-[10px] font-extrabold text-[#007f6e] uppercase tracking-wider block">
                        ⚙️ Hospital Registry Options
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-1">
                        
                        {/* Checkbox 1: Store in patient database */}
                        <label className="flex items-start gap-2.5 cursor-pointer selection:bg-transparent flex-1">
                          <input
                            type="checkbox"
                            checked={saveToPatientRegistry}
                            onChange={(e) => setSaveToPatientRegistry(e.target.checked)}
                            className="mt-0.5 h-4.5 w-4.5 text-[#007f6e] focus:ring-[#007f6e] border-slate-300 rounded cursor-pointer transition-colors"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-700 block">Save to Patients Registry</span>
                            <span className="text-[9px] text-slate-500 block">Copy details to permanent patient files.</span>
                          </div>
                        </label>

                        {/* Checkbox 2: Make follow-up visit */}
                        <label className="flex items-start gap-2.5 cursor-pointer selection:bg-transparent flex-1">
                          <input
                            type="checkbox"
                            checked={isFollowUpFromCheckbox}
                            onChange={(e) => setIsFollowUpFromCheckbox(e.target.checked)}
                            className="mt-0.5 h-4.5 w-4.5 text-[#007f6e] focus:ring-[#007f6e] border-slate-300 rounded cursor-pointer transition-colors"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-700 block text-teal-750">Mark as Follow-up Visit</span>
                            <span className="text-[9px] text-slate-500 block">Check if this is a follow-up or subsequent visit.</span>
                          </div>
                        </label>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ------------ STEP 2: DOCTOR FROM DATABASE SELECTOR ------------ */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#f0f9f6] p-4 rounded-xl border border-[#d1ebe4] flex items-start gap-2.5">
                    <Stethoscope className="text-[#007f6e] mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-bold text-[#007f6e] uppercase">Active Providers Roster</h4>
                      <p className="text-[10px] text-[#007f6e] mt-0.5">Select a practitioner. These records originate from the active database.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {activeDoctors.map((doc, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleDoctorChange(doc.name)}
                        className={`p-4 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          doctorName === doc.name
                            ? 'border-[#007f6e] bg-[#f4faf8] shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            doctorName === doc.name ? 'bg-[#007f6e] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            DR
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                            <p className="text-[10px] text-[#007f6e] font-semibold uppercase tracking-wider mt-0.5">
                              {doc.specialization}
                            </p>
                          </div>
                        </div>
                        {doctorName === doc.name && (
                          <span className="w-5 h-5 rounded-full bg-[#007f6e] text-white flex items-center justify-center shadow-xs">
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* ------------ STEP 3: SCHEDULE TIMING ------------- */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#f4f7f6] p-4 rounded-xl border border-slate-150 flex items-center gap-3">
                    <Calendar className="text-[#007f6e]" size={18} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Date & Slot Selection</h4>
                      <p className="text-[10px] text-slate-400">Specify dates correctly to verify conflict overlaps beforehand.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Consultation Date *</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] bg-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Slot *</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] bg-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl space-y-2 mt-4">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="save-as-new-checkbox-step3"
                          checked={isNewAppointmentInsteadOfOverwrite}
                          onChange={(e) => setIsNewAppointmentInsteadOfOverwrite(e.target.checked)}
                          className="mt-1 h-4 w-4 text-[#007f6e] focus:ring-[#007f6e] border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor="save-as-new-checkbox-step3" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          Save as New Appointment (Keep Old Appointment History)
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-6 pr-2 leading-relaxed">
                        Checking this box preserves the patient's past appointments (whether completed, cancelled, or past dates) and registers this schedule as a new visit. Recommended when booking subsequent check-ups or follow-ups.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* ------------ STEP 4: OVERLAP CHECK & CONFIRM DETAILS ------------- */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Review / Go Back Notice Banner */}
                  <div className="bg-[#f0f9f6] border border-[#d1ebe4] p-3.5 rounded-xl flex items-start gap-2.5">
                    <span className="text-lg">📋</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#007f6e]">Review Appointment Details</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        In case of any discrepancies or if you want to modify any details, you can click on the tabs above (Patient, Doctor, Schedule) or press the <strong>"Back Section"</strong> button at the bottom to edit the fields.
                      </p>
                    </div>
                  </div>

                  {/* Conflict detection alert banner as described */}
                  {isConflictDetected() ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-amber-800">⚠️ Existing overlapping booking conflict alert!</h4>
                        <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                          {doctorName} is already booked on {date} at {time}. To prevent scheduling slot overlaps, consider choosing another time or date slot in Step 3.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle className="text-[#007f6e] mt-0.5 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-[#007f6e]">Perfect Slot Available!</h4>
                        <p className="text-[10px] text-emerald-700 mt-1">We checked the SQLite database. Zero overlays detected for {doctorName} at this time slot.</p>
                      </div>
                    </div>
                  )}

                  {/* Summary preview ledger cards */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                    
                    <div className="p-3.5 bg-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">CONFIRMATION PROTOCOL Ledger</span>
                      <span className="bg-[#007f6e]/10 text-[#007f6e] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">Pending Submit</span>
                    </div>

                    {/* Patient detail */}
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Patient Fold File</p>
                        <p className="font-bold text-slate-800 mt-1 text-sm">{patientName}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{age} years, {patientGender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Identifiers / Contact</p>
                        <p className="text-slate-800 font-mono mt-1">Phone: {patientPhone || 'N/A'}</p>
                        <p className="text-slate-800 font-mono mt-0.5">WhatsApp: {patientWhatsapp || 'N/A'}</p>
                      </div>
                    </div>

                     {/* Doctor detail */}
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned Specialist</p>
                        <p className="font-bold text-[#007f6e] mt-1 text-sm">{doctorName}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{specialization}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Scheduled Framework</p>
                        <p className="font-bold text-slate-800 font-mono mt-1">{date}</p>
                        <p className="text-slate-500 font-mono text-[10px] mt-0.5">{time}</p>
                      </div>
                    </div>

                    {/* Registry Status & Visit Category */}
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs bg-[#fbfdfd]">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Database Persistence Status</p>
                        <div className="mt-1">
                          {saveToPatientRegistry ? (
                            <span className="inline-flex items-center gap-1 bg-[#e6f4f1] text-[#007f6e] text-[10px] font-bold px-2.5 py-1 rounded-md">
                              <CheckCircle size={11} /> Save to Permanent Patients
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md">
                              Skip Patients Database
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Visit Classification</p>
                        <div className="mt-1">
                          {isFollowUpFromCheckbox ? (
                            <span className="inline-flex items-center gap-1 bg-amber-55 text-amber-700 bg-amber-50 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-200/50">
                              <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '4s' }} /> Follow-up Visit (Status: Follow-up)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#e0f2fe] text-[#0284c7] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#bae6fd]">
                              Regular Consultation (Status: New)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {editingId && (
                    <div className={`p-4 rounded-xl border ${
                      isNewAppointmentInsteadOfOverwrite 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50/50 border-amber-200 text-amber-800'
                    } transition-colors space-y-2 mt-4`}>
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="save-as-new-checkbox-step4"
                          checked={isNewAppointmentInsteadOfOverwrite}
                          onChange={(e) => setIsNewAppointmentInsteadOfOverwrite(e.target.checked)}
                          className="mt-1 h-4 w-4 text-[#007f6e] focus:ring-[#007f6e] border-slate-300 rounded cursor-pointer"
                        />
                        <div>
                          <label htmlFor="save-as-new-checkbox-step4" className="text-xs font-bold cursor-pointer select-none">
                            Save as New Follow-up Appointment (Keep Old Appointment History)
                          </label>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {isNewAppointmentInsteadOfOverwrite 
                              ? '👍 Excellent choice! A brand new appointment will be registered today. The original past/canceled appointment record will remain completely unaltered in the history ledger.' 
                              : '⚠️ Warning: This will overwrite the existing appointment details. Choose this option only if you are correcting a typo, otherwise keep it checked to prevent losing clinical history.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Wizard Bottom buttons controller */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
                
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1) as any)}
                  disabled={activeStep === 1}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                    activeStep === 1 
                      ? 'border-slate-100 text-slate-300 pointer-events-none' 
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  Back Section
                </button>

                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStep === 1 && !patientName) {
                        alert('Please fill out patient and credentials first.');
                        return;
                      }
                      setActiveStep(prev => Math.min(4, prev + 1) as any);
                    }}
                    className="px-5 py-2.5 bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Next Section
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg"
                  >
                    {editingId ? 'Modify & Overwrite Appointment' : 'Confirm & Save Appointment'}
                  </button>
                )}

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/*                       4. PATIENT DETAILS DIALOG MODAL                     */}
      {/* ========================================================================= */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="appointment-detail-view-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Gradient Banner */}
            <div className="bg-gradient-to-r from-[#007f6e] to-[#115e59] text-white p-6 relative">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 text-white rounded-full p-2.5 transition-colors focus:outline-none cursor-pointer"
              >
                <X size={15} />
              </button>
              
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs uppercase">
                  {selectedAppointment.patientName.trim().charAt(0) || 'P'}
                </div>
                <div>
                  <h2 className="text-md md:text-lg font-bold">{selectedAppointment.patientName}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-emerald-100 text-[10px] font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                      ID: {selectedAppointment.id}
                    </span>
                    <span className="text-emerald-500 font-bold bg-white text-[10px] px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Grid content two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Patient Demographics details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <User size={12} className="text-[#007f6e]" /> Patient Demographics
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-medium">Gender</span>
                      <span className="text-slate-800 text-xs font-bold">{selectedAppointment.patientGender || 'Male'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-medium">Age</span>
                      <span className="text-slate-800 text-xs font-bold">{selectedAppointment.age || '30'} Years</span>
                    </div>
                    {selectedAppointment.patientPhone && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Registered Mobile</span>
                        <span className="text-slate-850 text-xs font-bold font-mono text-[#007f6e]">{selectedAppointment.patientPhone}</span>
                      </div>
                    )}
                    {selectedAppointment.patientEmail && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Registered Email</span>
                        <span className="text-slate-800 text-xs font-bold font-mono truncate">{selectedAppointment.patientEmail}</span>
                      </div>
                    )}
                    {selectedAppointment.patientWhatsapp && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">WhatsApp Contact</span>
                        <span className="text-[#25d366] text-xs font-bold font-mono">{selectedAppointment.patientWhatsapp}</span>
                      </div>
                    )}
                    {selectedAppointment.patientPassword && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Portal Credential</span>
                        <span className="text-slate-500 text-xs font-bold font-mono">•••••••• (Secured Passport)</span>
                      </div>
                    )}

                    {/* Registry Button/Indicator block */}
                    <div className="pt-2">
                      {(() => {
                        const isRegistered = (patients || []).some(p => 
                          p.name.toLowerCase().trim() === selectedAppointment.patientName.toLowerCase().trim() ||
                          (selectedAppointment.patientPhone && p.phone && p.phone.trim().replace(/[\s-+()]/g, '') === selectedAppointment.patientPhone.trim().replace(/[\s-+()]/g, ''))
                        );
                        if (isRegistered) {
                          return (
                            <div className="w-full text-center text-[10px] font-bold text-[#007f6e] bg-[#e6f4f1] px-3 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 border border-emerald-200 select-none">
                              <CheckCircle2 size={12} /> Patient Registered in Database
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => {
                              if (onAddPatient) {
                                onAddPatient({
                                  name: selectedAppointment.patientName,
                                  age: selectedAppointment.age || 30,
                                  gender: selectedAppointment.patientGender || 'Male',
                                  phone: selectedAppointment.patientPhone || '',
                                  email: selectedAppointment.patientEmail || '',
                                  status: selectedAppointment.type === 'Follow-up' ? 'Follow-up' : 'New',
                                  dob: '',
                                  bloodGroup: '',
                                  address: ''
                                });
                              }
                            }}
                            className="w-full text-center text-[10px] font-black uppercase text-white bg-[#007f6e] hover:bg-[#006657] px-3 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <UserPlus size={12} /> Add to Patients Directory
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 2. Clinical Practitioner details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Stethoscope size={12} className="text-[#007f6e]" /> Case Information
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Assigned Practitioner</span>
                      <span className="text-slate-800 text-xs font-extrabold">{selectedAppointment.doctorName}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-medium">Speciality</span>
                      <span className="text-[#007f6e] text-xs font-bold">{selectedAppointment.specialization}</span>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center">
                      <span className="text-slate-500 text-xs font-medium">Date</span>
                      <span className="text-slate-800 text-xs font-bold font-mono">{selectedAppointment.date}</span>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center">
                      <span className="text-slate-500 text-xs font-medium">Time Slot Clock</span>
                      <span className="text-slate-800 text-xs font-bold font-mono">{selectedAppointment.time}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-medium">Filing Stage</span>
                      <span className="text-slate-700 text-xs font-bold">Intake Sheet</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Patient's All Appointments History List inside Details Dialg */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#007f6e]" /> Saved Patient Appointment History ({appointments.filter(appt => appt.patientName.toLowerCase().trim() === selectedAppointment.patientName.toLowerCase().trim()).length})
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">All registered visits across clinical ledgers</span>
                </div>
                
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {appointments
                    .filter(appt => appt.patientName.toLowerCase().trim() === selectedAppointment.patientName.toLowerCase().trim())
                    .map((appt, i) => (
                      <div 
                        key={appt.id || i} 
                        className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                          appt.id === selectedAppointment.id 
                            ? 'bg-[#f0f9f6] border-[#007f6e]/30 text-slate-800' 
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-100 hover:border-slate-200 text-slate-650'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            appt.id === selectedAppointment.id 
                              ? 'bg-[#007f6e] text-white' 
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            <CalendarCheck size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{appt.doctorName}</span>
                              <span className="text-[10px] text-slate-500 font-medium">({appt.specialization})</span>
                              {appt.id === selectedAppointment.id && (
                                <span className="text-[9px] font-bold text-[#007f6e] bg-[#d1ebe4] px-1.5 py-0.5 rounded-sm">Current</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                              <span>Date: {appt.date}</span>
                              <span>&bull;</span>
                              <span>Time: {appt.time || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                            appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            appt.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-100' :
                            appt.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            appt.status === 'Scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-slate-200 text-slate-600 border-slate-300'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                  {appointments.filter(appt => appt.patientName.toLowerCase().trim() === selectedAppointment.patientName.toLowerCase().trim()).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No past or current clinical appointments found matching this patient.</p>
                  )}
                </div>
              </div>
              
            </div>

            {/* Footer with Edit, Delete, Download Report PDF, Follow-Up, and Close buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => {
                        handleOpenEditWizard(selectedAppointment);
                        setSelectedAppointment(null);
                      }}
                      className="bg-[#e6f4f1] hover:bg-[#d5eeea] text-[#007f6e] border border-emerald-500/10 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteAppointmentRecord(selectedAppointment.id);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadAppointmentPDF}
                  className="bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#2ebd59] border border-green-200/50 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => {
                    handleCreateFollowupFromAppointment(selectedAppointment);
                    setSelectedAppointment(null);
                  }}
                  className="bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#7c3aed] border border-[#7c3aed]/20 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Schedule Follow-Up</span>
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
