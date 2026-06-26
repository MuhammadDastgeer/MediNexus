import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Image as ImageIcon, 
  X,
  RefreshCw,
  ShieldAlert,
  Mic,
  ArrowUp,
  Upload,
  Volume2,
  StopCircle,
  FileText,
  Activity,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Play,
  Square,
  ArrowLeft,
  Wrench,
  Edit2,
  Trash,
  Database,
  Search,
  PlusCircle,
  Check,
  Settings,
  XCircle,
  Briefcase,
  Layers,
  HelpCircle,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Attempt {
  provider: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  modelUsed?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 string
  audio?: string; // base64 string
  voiceRecorded?: boolean;
  audioUrl?: string;
  audioSize?: string;
  audioDuration?: number;
  attempts?: Attempt[];
  timestamp: Date;
  docName?: string;
  docType?: string;
  docSize?: string;
  docContent?: string;
  tool?: TabTool;
}

interface AIAssistantViewProps {
  contextData: {
    activeTab: string;
    userRole: string;
    userName: string;
    data: any;
  };
  backendApiEndpoint?: string;
  restrictFileTypes?: boolean;
  onBack?: () => void;
  onNavigate?: (view: string, initialMessageData?: any) => void;
  onExecuteAction?: (action: { type: string; tab: string; item?: any; id?: string }) => void;
  initialMessage?: any;
  onClearInitialMessage?: () => void;
}

// Mock Clinical Images/Scans to let users test Vision capability easily inside the sandbox
const SAMPLE_CLINICAL_SCANS = [
  {
    id: 'chest_xray',
    name: '🩻 Chest X-Ray (Normal Roster)',
    url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'derma_rash',
    name: '🔬 Skin Dermatology Rash',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'prescription',
    name: '📝 Handwritten Rx Prescription',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
  }
];

// Presets for Voice Recording transcribed requests 
const MOCK_TRANSCRIPTS = [
  "Check Dr. Priya Patel's schedule for tomorrow and tell me if she is treating any chest congestion patients.",
  "Write an analysis on the pending bills for Ward-A and check if any medicines in our pharmacy are low on stock.",
  "What is the recommended pharmacological treatment for a patient presenting with an acute asthma attack and allergic rhinitis?"
];

interface Chip {
  label: string;
  icon: string;
  prompt: string;
}

const getChipsForTab = (tab: string, userRole?: string): Chip[] => {
  const normalized = tab ? tab.toLowerCase() : '';

  if (normalized === 'staff' || normalized === 'staff-ai') {
    return [
      { label: 'Total Active Staff', icon: '👥', prompt: 'Give me a summary of total active staff members currently on duty and their roles.' },
      { label: 'Staff Roles Breakdown', icon: '👔', prompt: 'What are the main staff roles (Doctors, Nurses, Receptionists, Admins) and their counts?' },
      { label: 'Add New Staff Member', icon: '➕', prompt: 'How do I add a new staff member to the system? Explain the required fields and access levels.' },
      { label: 'Edit Staff Records', icon: '✏️', prompt: 'Explain the process of editing or updating a staff member\'s contact info or department.' },
      { label: 'Staff Shift Allocations', icon: '📅', prompt: 'How can we view or update the roster/shifts of our nursing staff and general practitioners?' },
      { label: 'Safely Delete Staff', icon: '🗑️', prompt: 'What is the procedure to deactivate or safely delete a staff record if they leave the hospital?' },
      { label: 'Grant Portal Access', icon: '🔑', prompt: 'How can I grant, edit, or revoke dashboard portal access and credentials for a staff member?' },
      { label: 'Nurses Shift Coverage', icon: '🩺', prompt: 'Check if we have adequate nursing shift coverage for the ICU and Emergency departments tonight.' },
      { label: 'Staff Contact Directory', icon: '📞', prompt: 'Show the quick phone contact and email directory list of our active staff members.' },
      { label: 'Check Admin Roles', icon: '🛡️', prompt: 'Who are the active administrators currently registered with portal system privileges?' },
      { label: 'Shift Coverage Hours', icon: '⏰', prompt: 'How do I generate a report of scheduled duty hours for our hospital staff this week?' },
      { label: 'Staff Attendance Logs', icon: '📈', prompt: 'Summarize standard staff attendance logs, performance records, or duty logs.' },
      { label: 'Emergency Shift Alerts', icon: '🚨', prompt: 'How are emergency shifts assigned and what is the current checklist for on-call nursing staff?' },
      { label: 'License & Credentials', icon: '📜', prompt: 'How can I update an employee\'s medical license or clinical certification expiry date in the profile?' },
      { label: 'Staff Leave Requests', icon: '🌴', prompt: 'How do we track staff leave requests, holidays, or temporary duty substitutes?' }
    ];
  }

  if (normalized === 'doctors' || normalized === 'doctors-ai') {
    return [
      { label: 'Active Doctors List', icon: '👨‍⚕️', prompt: 'Provide a list of all active doctors currently registered, along with their availability statuses.' },
      { label: 'Specialties Breakdown', icon: '🩺', prompt: 'Give me a breakdown of our registered doctors grouped by their specialty and department loads.' },
      { label: 'Add Doctor Profile', icon: '➕', prompt: 'Explain the steps to add a new doctor profile, schedule, and their consultation fees.' },
      { label: 'Edit Doctor Profile', icon: '✏️', prompt: 'How do I update a doctor\'s fee, designation, consultation rooms, or email details?' },
      { label: 'On-Call Doctors Today', icon: '⏰', prompt: 'Check who are the on-call doctors and specialists available right now in the hospital.' },
      { label: 'Room Allocations', icon: '🏢', prompt: 'Which doctors are assigned to Room 101, Room 102, and Room 201? Show room allocations.' },
      { label: 'Doctor Shift Schedules', icon: '📅', prompt: 'How do we configure or adjust the morning, evening, and night timetables for our doctors?' },
      { label: 'Delete Doctor Profile', icon: '🗑️', prompt: 'Explain the protocol to deactivate or delete a doctor\'s record when they resign or retire.' },
      { label: 'Consultation Fees List', icon: '💰', prompt: 'Show a summary list of doctors along with their active consultation fee structures.' },
      { label: 'Cardiology Status', icon: '❤️', prompt: 'Are there cardiology specialists active on the roster right now? Check Dr. Anil Sharma\'s availability.' },
      { label: 'Pediatricians Status', icon: '👶', prompt: 'Are there pediatric doctors active on the scheduling chart right now? Check Dr. Priya Patel\'s status.' },
      { label: 'Doctor Booking Loads', icon: '📊', prompt: 'Identify which doctor has the highest appointment load and patient bookings today.' },
      { label: 'License Verification', icon: '📜', prompt: 'How do I keep doctor credentials, clinical license keys, or MD certificates updated?' },
      { label: 'Department Transfers', icon: '🔄', prompt: 'How can I transfer a doctor to another clinical department roster or sub-specialization?' },
      { label: 'Emergency Coverage', icon: '🚨', prompt: 'Who is the backup doctor assigned to handle emergency trauma and cardiac arrests tonight?' }
    ];
  }

  if (normalized === 'appointments' || normalized === 'appointments-ai') {
    return [
      { label: 'Overdue Appointments', icon: '📅', prompt: 'Summarize any pending appointments that have overdue status or require urgent rescheduled action.' },
      { label: 'Available Doctors Roster', icon: '👨‍⚕️', prompt: 'Analyze doctor roster statuses and check who is available for immediate patient consultation.' },
      { label: 'Clinic Peak Hours', icon: '🕒', prompt: 'Tell me which departments have the highest volume of patient appointments scheduled today.' },
      { label: 'Add New Appointment', icon: '➕', prompt: 'What is the procedure to book or create a new patient appointment slot in the system?' },
      { label: 'Edit Scheduled Slot', icon: '✏️', prompt: 'How do I reschedule, shift, or update an existing patient\'s appointment timing?' },
      { label: 'Cancel Appointment', icon: '❌', prompt: 'Explain how to cancel or safely delete an appointment while notifying the clinical department.' },
      { label: 'Today\'s Appointments List', icon: '📋', prompt: 'Show me a structured list of patient appointments scheduled for today.' },
      { label: 'Pending Checkups Search', icon: '🔍', prompt: 'List any pending clinical appointments awaiting doctor approval or check-in.' },
      { label: 'Completed Sessions Report', icon: '✅', prompt: 'Show recently completed patient consultations and their logged outcome status.' },
      { label: 'Appointment Status Stats', icon: '📈', prompt: 'Give a breakdown of appointments grouped by status: Scheduled, Checked-In, Done, and Cancelled.' },
      { label: 'Specialization Load Chart', icon: '📊', prompt: 'Which clinical specialties (e.g., Cardiology, Pediatrics) have the largest booking queue this week?' },
      { label: 'Doctor-Specific Booking', icon: '🩺', prompt: 'How do I check the scheduled patient booking list for a specific doctor?' },
      { label: 'Patient Queue Delay', icon: '⚠️', prompt: 'Identify any ongoing delays or slot clashes in the clinical consultation rooms.' },
      { label: 'Auto Slot Allocation', icon: '🔄', prompt: 'How does the reservation queue system handle double-booking safety and slot conflicts?' },
      { label: 'Follow-Up Scheduling', icon: '🚨', prompt: 'What is the protocol to book secondary follow-up slots for chronic care patients?' }
    ];
  }

  if (normalized === 'patients' || normalized === 'patients-ai') {
    return [
      { label: 'Active Patients Summary', icon: '🩺', prompt: 'Give me a breakdown of currently admitted active patients, summarizing their conditions and ages.' },
      { label: 'High Risk Patients', icon: '⚠️', prompt: 'Are there patient records presenting critical or severe statuses? Summarize their recent logs.' },
      { label: 'Demographics Analysis', icon: '📈', prompt: 'Analyze our patient age patterns to inspect specialized pediatric or geriatric trends.' },
      { label: 'Add New Patient Record', icon: '➕', prompt: 'What are the required data fields and registration flows to add a new patient profile?' },
      { label: 'Edit Patient Details', icon: '✏️', prompt: 'How can I update a patient\'s medical history, blood group, contact, or insurance information?' },
      { label: 'Delete/Archive Profile', icon: '🗑️', prompt: 'Explain how to archive or remove a redundant patient record while maintaining clinical audits.' },
      { label: 'Registered Patients List', icon: '📋', prompt: 'Show me a directory list of the most recently registered patients.' },
      { label: 'Patient Admission Flow', icon: '🏥', prompt: 'What is the clinical intake checklist for admitting a patient to inpatient care?' },
      { label: 'Check Symptoms Chart', icon: '🌡️', prompt: 'How can we record or log daily patient clinical symptoms and key vitals?' },
      { label: 'Allergy Alerts & Warning', icon: '🚫', prompt: 'Search patient profiles for registered severe drug allergies or dietary flags.' },
      { label: 'Chronic Disease Group', icon: '🧬', prompt: 'Summarize patients registered under chronic disease groups like diabetes or hypertension.' },
      { label: 'Patient Vital Signs Log', icon: '💓', prompt: 'How do I record heart rate, blood pressure, temperature, and SpO2 in the logs?' },
      { label: 'Discharge Checklist', icon: '📋', prompt: 'What is the standard procedure to discharge a patient and settle their medical charts?' },
      { label: 'Insurance Information', icon: '💳', prompt: 'Explain how insurance provider files and policy coverage terms are assigned to a patient\'s profile.' },
      { label: 'Pediatric Demographics', icon: '🍼', prompt: 'Show pediatric registrations and summarize their primary clinical consultants.' }
    ];
  }

  if (normalized.includes('bill') || normalized.includes('finance')) {
    return [
      { label: 'High Pending Bills', icon: '💰', prompt: 'Identify patient billing records with high outstanding or pending payments.' },
      { label: 'Fee Collection Efficiency', icon: '📊', prompt: 'Provide a report comparing completed collected fees versus pending amounts.' },
      { label: 'Unpaid Invoices List', icon: '💳', prompt: 'Which departments or appointments have the largest unpaid billing logs?' },
      { label: 'Create New Invoice', icon: '➕', prompt: 'Explain how to generate and log a new patient bill, including consultation and pharmacy charges.' },
      { label: 'Edit Billing Record', icon: '✏️', prompt: 'How do I update an invoice amount, apply discounts, or adjust taxes?' },
      { label: 'Settle/Delete Bill', icon: '🗑️', prompt: 'What is the protocol to cancel, refund, or delete a wrongly recorded billing entry?' },
      { label: 'Completed Payments Report', icon: '✅', prompt: 'Show a summary of recently completed fee collections and methods used (Cash, Card, UPI).' },
      { label: 'Outstanding Balance Alert', icon: '⚠️', prompt: 'Generate a list of patients with active outstanding balance totals above emergency limits.' },
      { label: 'Department Fee Analysis', icon: '🏢', prompt: 'Provide a breakdown of total revenue generated by each medical department this month.' },
      { label: 'Tax & Discount Audits', icon: '📜', prompt: 'How are clinician discounts, insurance covers, and government taxes calculated on invoices?' },
      { label: 'Refund Protocol Flow', icon: '🔄', prompt: 'What is the workflow to process payment refunds and log receipt adjustment entries?' },
      { label: 'Payment Reminders List', icon: '📞', prompt: 'How can we trigger outstanding payment reminders for patients with pending balances?' },
      { label: 'Daily Receipts Summary', icon: '🕒', prompt: 'Provide a summary analysis of total cash receipts and digital collections since morning.' },
      { label: 'Pharmacy Drug Billing', icon: '💊', prompt: 'How are medicine purchases synced automatically from inventory to patient bills?' },
      { label: 'Ward Occupancy Costing', icon: '🛌', prompt: 'Explain how daily ward charges and nursing service fees are calculated in the main bill.' }
    ];
  }

  if (normalized.includes('invent') || normalized.includes('pharmacy') || normalized.includes('purchases') || normalized.includes('transfers')) {
    return [
      { label: 'Low Stock Safeguard', icon: '🧱', prompt: 'Confirm which critical pharmacological items in the inventory have stock levels below their warning threshold limit.' },
      { label: 'Pharmacy Spends Analysis', icon: '💊', prompt: 'Report on our pharmacy inventory categories and identify our highest value assets.' },
      { label: 'Replenishment Schedule', icon: '📦', prompt: 'Based on active stock counts versus minimum thresholds, formulate a pharmacy replenishment priority order.' },
      { label: 'Add Inventory Item', icon: '➕', prompt: 'Explain how to register a new clinical equipment unit or pharmacological medicine batch in stock.' },
      { label: 'Edit Stock Item Details', icon: '✏️', prompt: 'How can I update an item\'s description, supplier, minimum threshold, or cost prices?' },
      { label: 'Remove Defective Stock', icon: '🗑️', prompt: 'What are the rules and logs to delete, discard, or report decayed or expired stock items?' },
      { label: 'Supplier Directory List', icon: '📞', prompt: 'Provide a list of registered pharmaceutical suppliers along with their active contacts.' },
      { label: 'Expired Batches Alert', icon: '🚨', prompt: 'Scan medicine shelves and report on batches approaching their expiration date.' },
      { label: 'Stock Transfer Log', icon: '🔄', prompt: 'How do I log a stock transfer from the main central medical store to ward pharmacies?' },
      { label: 'Supplier Purchase Orders', icon: '📋', prompt: 'Explain the procedure to generate a draft purchase order for low-stock antibiotics.' },
      { label: 'Restocking Protocols', icon: '📦', prompt: 'How are items restocked, and what logs track bulk inventory delivery receipts?' },
      { label: 'Shelf Location Audit', icon: '🗺️', prompt: 'How do we record shelf codes, cold storage temperature zones, and location tags for vaccines?' },
      { label: 'Valuation Reports', icon: '💰', prompt: 'Calculate the total financial asset valuation of our pharmacy and equipment stock.' },
      { label: 'Narcotics & Controlled Drugs', icon: '🔒', prompt: 'How do we audit or record high-risk narcotic substance logs and restricted drug dispensations?' },
      { label: 'Daily Dispensed Medicines', icon: '🩺', prompt: 'How can I view a report of dispensed stock items linked to doctor prescriptions?' }
    ];
  }

  if (normalized === 'consultation' || normalized === 'consultation-ai') {
    return [
      { label: 'General Drug Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
      { label: 'Allergy Symptoms Check', icon: '🌡️', prompt: 'How are clinical allergy skin symptoms and diagnostic rashes diagnosed?' },
      { label: 'Add Consultation Record', icon: '➕', prompt: 'Detail the steps to log a patient\'s consultation notes, symptom logs, and vitals.' },
      { label: 'Modify Prescription Notes', icon: '✏️', prompt: 'Explain how to edit or modify clinical prescriptions and drug dosages on file.' },
      { label: 'Delete Wrong Prescription', icon: '🗑️', prompt: 'What is the safety rule to safely delete or retract a wrong prescription entry?' },
      { label: 'General Lab Tests Checklist', icon: '🔬', prompt: 'What are the standard recommended lab tests for suspected blood sugar or anemia?' },
      { label: 'Chronic Care Guidance', icon: '💖', prompt: 'Generate guidelines for chronic hypertension wellness and low-sodium diets.' },
      { label: 'Pediatrics Dose Formula', icon: '🍼', prompt: 'How are standard drug dosages adjusted based on pediatric patient weights?' },
      { label: 'Pregnancy Drug Safety', icon: '🤰', prompt: 'Summarize critical FDA drug category restrictions during patient pregnancies.' },
      { label: 'Clinical Followup Rules', icon: '📅', prompt: 'What are the clinical indicators for booking patient follow-up consults?' },
      { label: 'Patient Symptoms Triage', icon: '⏱️', prompt: 'Outline an emergency clinical triage workflow for acute abdominal pain.' },
      { label: 'Vaccine Scheduler Guide', icon: '💉', prompt: 'Provide a standard pediatric vaccination schedule and dose intervals.' },
      { label: 'Cardiac Vitals Watch', icon: '💓', prompt: 'What are critical physiological alerts for resting heart rates and ECG anomalies?' },
      { label: 'Write Medication Plan', icon: '📝', prompt: 'Suggest a model therapeutic medication schedule for standard Type-2 diabetes.' },
      { label: 'OTC Treatment Guides', icon: '🍃', prompt: 'Are there any standard OTC recommendations for mild cold and throat irritation?' }
    ];
  }

  if (normalized.includes('ward') || normalized.includes('ipd')) {
    return [
      { label: 'Ward Occupancy Count', icon: '🛌', prompt: 'Give me the total available versus occupied beds count in our general wards.' },
      { label: 'ICU Critical Bed Alert', icon: '🚨', prompt: 'Check ICU bed availability and count occupied beds for trauma emergencies.' },
      { label: 'Add New Ward Bed', icon: '➕', prompt: 'How can I add a new bed, room number, or special ward category to our database register?' },
      { label: 'Edit Bed Placement', icon: '✏️', prompt: 'How do we edit bed assignments, swap patient beds, or update daily room tariff costs?' },
      { label: 'Discharge Room Cleaning', icon: '🗑️', prompt: 'Explain the protocol to set a bed status to cleaning or delete redundant entries.' },
      { label: 'Patient Admission Map', icon: '🏥', prompt: 'Show the current directory list of admitted patients mapped to their specific ward rooms.' },
      { label: 'Pediatric Ward Occupancy', icon: '🍼', prompt: 'Check the active patient occupancy status in our pediatric ward block.' },
      { label: 'ICU On-Call Nursing Shift', icon: '👩‍⚕️', prompt: 'Who are the nurses assigned to ICU Ward A and Emergency Room duties tonight?' },
      { label: 'Ward Tariff Comparison', icon: '💰', prompt: 'Provide a room tariff comparison list showing daily bed rates for ICU, Semi-Private, and General Wards.' },
      { label: 'Bed Maintenance Logs', icon: '🔧', prompt: 'How do we report defective bedside monitors or mark beds as under maintenance?' },
      { label: 'Bed Transfer Protocols', icon: '🔄', prompt: 'Explain how to transfer an admitted patient from General Ward to Private ICU Care.' },
      { label: 'Emergency Room Placements', icon: '🏎️', prompt: 'Are there vacant resuscitation beds registered in our triage emergency department?' },
      { label: 'Daily Admitted Vitals', icon: '📋', prompt: 'Show the scheduled times nurses check vitals (BP, SpO2) in General Ward beds.' },
      { label: 'Quarantine Room Allocation', icon: '🛡️', prompt: 'What beds or wings are isolated for infectious diseases or quarantine requirements?' },
      { label: 'Doctors Ward Visits', icon: '🩺', prompt: 'How are doctor morning ward rounds and check-ins recorded for admitted patients?' }
    ];
  }

  // Fallback for dashboard, general, or others based on user role
  if (userRole === 'patient') {
    return [
      { label: 'My Appointments Schedule', icon: '📅', prompt: 'Show me my current scheduled appointments and times.' },
      { label: 'My Bills & Payments', icon: '💳', prompt: 'Summarize my personal outstanding bills and recent payments.' },
      { label: 'My Registered Profile', icon: '👤', prompt: 'Show my active patient registration file and diagnostic history.' },
      { label: 'Allergy & Cough Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
      { label: 'Consult Specialty Doctor', icon: '🩺', prompt: 'Explain how I can consult an active on-duty specialist.' },
      { label: 'All Active Doctors', icon: '👨‍⚕️', prompt: 'Who are the doctors currently available on duty and what are their specializations?' },
      { label: 'Emergency Protocol Trait', icon: '🚨', prompt: 'What is the hospital\'s priority emergency dispatch protocol for clinical trauma?' }
    ];
  }

  if (userRole === 'doctor') {
    return [
      { label: 'My Assigned Appointments', icon: '📅', prompt: 'Show appointments scheduled with me today.' },
      { label: 'My Patient Register', icon: '🩺', prompt: 'Provide a list of patients scheduled for clinical sessions under my care.' },
      { label: 'Allergy & Cough Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
      { label: 'Consultation Notes', icon: '📝', prompt: 'What are the standard guidelines for logging a clinical prescription?' },
      { label: 'Room Occupancy Check', icon: '🛌', prompt: 'What is the overall occupancy level of our wards and private rooms?' },
      { label: 'Emergency Roster', icon: '⏰', prompt: 'Check my upcoming patient appointment charts.' },
      { label: 'Emergency Protocol Trait', icon: '🚨', prompt: 'What is the hospital\'s priority emergency dispatch protocol for clinical trauma?' }
    ];
  }

  if (userRole === 'staff') {
    return [
      { label: 'Clinic Appointments', icon: '🗂️', prompt: 'Analyze pending hospital appointments in our dashboard context.' },
      { label: 'Allergy & Cough Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
      { label: 'Billing Standing', icon: '📊', prompt: 'Review our total pending clinical bills versus collected amounts.' },
      { label: 'Pharmacy Inventory', icon: '🧱', prompt: 'Generate a summary list of medication inventory items with low-stock count.' },
      { label: 'All Active Doctors', icon: '👨‍⚕️', prompt: 'Who are the doctors currently available on duty and what are their specializations?' },
      { label: 'Patient Condition Trends', icon: '🩺', prompt: 'Give me a breakdown of active patient registers and high-risk case reports.' },
      { label: 'Room Occupancy Check', icon: '🛌', prompt: 'What is the overall occupancy level of our wards and private rooms?' },
      { label: 'Nurse Shifts & Roster', icon: '⏰', prompt: 'Provide current nurse duty shift allocations and emergency coverage records.' },
      { label: 'Drug Refill List', icon: '📦', prompt: 'Show pharmaceutical supplier contacts and our lowest stock antibiotics list.' },
      { label: 'Emergency Protocol Trait', icon: '🚨', prompt: 'What is the hospital\'s priority emergency dispatch protocol for clinical trauma?' },
      { label: 'Insurance Claim Setup', icon: '💳', prompt: 'What insurance providers do we accept and how is policy billing calculated?' },
      { label: 'Discharge Daily List', icon: '📋', prompt: 'Show patients scheduled for discharge today and check if bills are settled.' }
    ];
  }

  return [
    { label: 'Clinic Appointments', icon: '🗂️', prompt: 'Analyze pending hospital appointments in our dashboard context.' },
    { label: 'Allergy & Cough Guidance', icon: '💊', prompt: 'Outline general clinical drug guidance for a cough and skin allergies.' },
    { label: 'Billing Standing', icon: '📊', prompt: 'Review our total pending clinical bills versus collected amounts.' },
    { label: 'Pharmacy Inventory', icon: '🧱', prompt: 'Generate a summary list of medication inventory items with low-stock count.' },
    { label: 'All Active Doctors', icon: '👨‍⚕️', prompt: 'Who are the doctors currently available on duty and what are their specializations?' },
    { label: 'Patient Condition Trends', icon: '🩺', prompt: 'Give me a breakdown of active patient registers and high-risk case reports.' },
    { label: 'Room Occupancy Check', icon: '🛌', prompt: 'What is the overall occupancy level of our wards and private rooms?' },
    { label: 'Clinic Revenue Sheet', icon: '💰', prompt: 'Summarize this month\'s financial fee collections and outstanding balance totals.' },
    { label: 'Nurse Shifts & Roster', icon: '⏰', prompt: 'Provide current nurse duty shift allocations and emergency coverage records.' },
    { label: 'Drug Refill List', icon: '📦', prompt: 'Show pharmaceutical supplier contacts and our lowest stock antibiotics list.' },
    { label: 'Emergency Protocol Trait', icon: '🚨', prompt: 'What is the hospital\'s priority emergency dispatch protocol for clinical trauma?' },
    { label: 'Insurance Claim Setup', icon: '💳', prompt: 'What insurance providers do we accept and how is policy billing calculated?' },
    { label: 'Discharge Daily List', icon: '📋', prompt: 'Show patients scheduled for discharge today and check if bills are settled.' },
    { label: 'System Configuration Info', icon: '⚙️', prompt: 'Describe system parameters, active modules, and helpdesk contact details.' },
    { label: 'Support & Access Help', icon: '🔑', prompt: 'How do I resolve user password resets, tech issues, or modify portal permissions?' }
  ];
};

const PlayAudioButton: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.warn("Audio play error:", err));
      setIsPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 bg-teal-500 hover:bg-teal-400 text-white rounded-full transition-all focus:outline-none hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer shadow-xs"
      id="audio-play-trigger-btn"
    >
      {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
    </button>
  );
};

const isQueryRelatedToTab = (query: string, tab: string): boolean => {
  const q = query.toLowerCase();
  const t = tab.toLowerCase().trim();

  // If it's the main ai-assistant tab or general, it's always related.
  if (t === 'ai-assistant' || t === 'general' || t === 'general-ai' || !t) {
    return true;
  }

  const tabKeywords: Record<string, string[]> = {
    appointments: ['appointment', 'appt', 'book', 'schedule', 'date', 'time', 'slot', 'calendar', 'visit', 'checkup', 'roster', 'patient name', 'doctor name', 'confirm', 'cancel', 'delay', 'milna', 'tarikh', 'waqt', 'milne'],
    consultation: ['consultation', 'consult', 'prescription', 'prescribe', 'diagnose', 'diagnosis', 'advice', 'symptom', 'medicine', 'checkup', 'note', 'clinical note', 'nuskh', 'dawai', 'dawae', 'marz'],
    billing: ['bill', 'invoice', 'pay', 'cost', 'fee', 'charge', 'price', 'financial', 'unpaid', 'paid', 'balance', 'receipt', 'card', 'tax', 'discount', 'paise', 'rupay', 'paisa', 'billin'],
    inventory: ['inventory', 'stock', 'medicine', 'supply', 'supplies', 'purchase', 'warehouse', 'reorder', 'item', 'batch', 'expiry', 'supplier', 'vendor', 'dawai', 'dawae', 'store'],
    'ipd-wards': ['ward', 'room', 'bed', 'admit', 'discharge', 'inpatient', 'icu', 'occupancy', 'allocated', 'allot', 'floor', 'kamra', 'bistar'],
    staff: ['staff', 'roster', 'employee', 'shift', 'nurse', 'duty', 'salary', 'profile', 'work', 'cleaner', 'admin', 'operator', 'hire', 'mulazim', 'kaam'],
    doctors: ['doctor', 'physician', 'specialist', 'opd', 'duty', 'specialization', 'surgeon', 'fee', 'charge', 'profile', 'hakeem'],
    patients: ['patient', 'medical record', 'history', 'portfolio', 'age', 'gender', 'blood group', 'disease', 'record', 'allergic', 'diagnosis', 'mareez', 'bimar'],
    departments: ['department', 'cardiology', 'pediatrics', 'orthopedics', 'dermatology', 'icu', 'opd', 'clinical section', 'wing', 'shuba'],
    enquiries: ['enquiry', 'inquiry', 'ticket', 'question', 'query', 'ask', 'support ticket', 'contact', 'resolved', 'pending', 'sawaal', 'puchna'],
    'medical-tourism': ['tourism', 'foreign', 'visa', 'package', 'travel', 'airport', 'currency', 'international', 'passport', 'medical-tourism', 'flight', 'bahar', 'safar'],
    blogs: ['blog', 'post', 'article', 'publish', 'draft', 'title', 'research', 'news', 'author', 'content', 'khabar'],
    reports: ['report', 'analytics', 'chart', 'statistics', 'export', 'pdf', 'csv', 'print', 'data', 'download', 'visualize'],
    finance: ['finance', 'transaction', 'payment', 'expense', 'income', 'ledger', 'account', 'revenue', 'profit', 'tax', 'cash', 'earn', 'hisaab', 'kharcha'],
    'configure-hospital': ['setting', 'configuration', 'config', 'hospital name', 'contact', 'phone', 'theme', 'title', 'update details'],
    support: ['support', 'help', 'contact', 'issue', 'technical', 'password', 'error', 'login', 'logout', 'bug', 'madad']
  };

  const keywords = tabKeywords[t] || [];
  const allKeywords = [...keywords, t];
  if (t.includes('-')) {
    allKeywords.push(...t.split('-'));
  }

  // Check if any keyword for the current tab is matched
  const matchedCurrent = allKeywords.some(keyword => q.includes(keyword));
  if (matchedCurrent) return true;

  // Let's check if it matches keywords of other tabs. If it matches another tab's keywords, it belongs to that other tab!
  let matchedOther = false;
  for (const otherTab of Object.keys(tabKeywords)) {
    if (otherTab === t) continue;
    const otherKeywords = [...(tabKeywords[otherTab] || []), otherTab];
    if (otherKeywords.some(keyword => q.includes(keyword))) {
      matchedOther = true;
      break;
    }
  }

  // If it didn't match current, and matched other, it is NOT related to current.
  if (matchedOther) {
    return false;
  }

  // If it's a completely generic greeting or generic query, we can allow it or keep it here.
  return true;
};

export interface TabTool {
  label: string;
  type: 'add' | 'edit' | 'delete' | 'view';
  prompt: string;
  icon: string;
}

export const getToolsForTab = (tab: string, userRole?: string): TabTool[] => {
  const normalized = tab ? tab.toLowerCase().trim() : '';

  if (normalized === 'staff' || normalized === 'staff-ai') {
    return [
      { label: 'Add Staff Member', type: 'add', icon: '➕', prompt: 'Create/Add a new staff member to the system. Enter their Name, Role (e.g. Ward Assistant, Lab Assistant), Contact number, and Shift timings.' },
      { label: 'Edit Staff Record', type: 'edit', icon: '✏️', prompt: 'Update/Edit an existing staff member\'s registration details, role designation, or on-duty schedule.' },
      { label: 'Delete Staff Profile', type: 'delete', icon: '🗑️', prompt: 'Deactivate or safely delete a staff member\'s record from the hospital directory.' },
      { label: 'View Staff Statuses', type: 'view', icon: '📋', prompt: 'Show the list of registered hospital staff members with their active status, role, and department.' }
    ];
  }

  if (normalized === 'doctors' || normalized === 'doctors-ai') {
    return [
      { label: 'Add Doctor Profile', type: 'add', icon: '➕', prompt: 'Create/Add a new doctor profile, including their full name, specialization department (e.g. Cardiology), consultation room, and baseline outpatient fee.' },
      { label: 'Edit Doctor Details', type: 'edit', icon: '✏️', prompt: 'Update/Edit doctor profile details such as room code, OPD schedule times, contact details, or active fee.' },
      { label: 'Delete Doctor Profile', type: 'delete', icon: '🗑️', prompt: 'Delete or safely remove a doctor\'s roster file when they retire or transfer.' },
      { label: 'View Doctors List', type: 'view', icon: '📋', prompt: 'Provide a directory list of all active doctors with their consultation rooms, fee levels, and shift availability status.' }
    ];
  }

  if (normalized === 'appointments' || normalized === 'appointments-ai') {
    return [
      { label: 'Book Appointment Slot', type: 'add', icon: '➕', prompt: 'Create/Add a new patient appointment: Book a doctor slot, patient name, date, time, and type of visit.' },
      { label: 'Reschedule Appointment', type: 'edit', icon: '✏️', prompt: 'Update/Edit appointment slot: How do I reschedule, shift timings, or change the assigned doctor of an active slot?' },
      { label: 'Cancel Appointment Slot', type: 'delete', icon: '🗑️', prompt: 'Delete/Cancel appointment: Show the procedure to safely cancel or delete an appointment slot.' },
      { label: 'View Today\'s Appointments', type: 'view', icon: '📋', prompt: 'Show me a list of patient appointments scheduled for today.' }
    ];
  }

  if (normalized === 'patients' || normalized === 'patients-ai') {
    return [
      { label: 'Register New Patient', type: 'add', icon: '➕', prompt: 'Create/Add a new patient registration: Register details including age, gender, contact number, blood group, and medical history.' },
      { label: 'Edit Patient Profile', type: 'edit', icon: '✏️', prompt: 'Update/Edit patient record: How do I update a patient\'s clinical profile, email address, or emergency contacts?' },
      { label: 'Archive Patient File', type: 'delete', icon: '🗑️', prompt: 'Delete/Archive patient: Archive a redundant patient log while preserving clinical audit history.' },
      { label: 'View Patients Register', type: 'view', icon: '📋', prompt: 'Show a directory list of recently registered hospital patients.' }
    ];
  }

  if (normalized.includes('bill') || normalized.includes('finance')) {
    return [
      { label: 'Generate New Invoice', type: 'add', icon: '➕', prompt: 'Create/Add a new hospital billing invoice: Log custom patient fee, items list, discount, tax, and status.' },
      { label: 'Edit Invoice Details', type: 'edit', icon: '✏️', prompt: 'Update/Edit billing invoice: How do I apply a discount percentage, adjust tax, or update invoice item totals?' },
      { label: 'Cancel/Delete Invoice', type: 'delete', icon: '🗑️', prompt: 'Delete/Cancel invoice: Void, cancel, or delete a wrongly recorded billing entry.' },
      { label: 'View Unpaid Invoices', type: 'view', icon: '📋', prompt: 'Show a list of outstanding unpaid patient invoices with high outstanding balances.' }
    ];
  }

  if (normalized.includes('invent') || normalized.includes('pharmacy') || normalized.includes('purchases') || normalized.includes('transfers')) {
    return [
      { label: 'Add Stock Item', type: 'add', icon: '➕', prompt: 'Create/Add a new medicine or stock item: Register drug name, category, batch code, expiry, unit price, and supplier.' },
      { label: 'Edit Stock Details', type: 'edit', icon: '✏️', prompt: 'Update/Edit stock details: Adjust minimum threshold limits, unit costs, or supplier profiles.' },
      { label: 'Remove Expired Stock', type: 'delete', icon: '🗑️', prompt: 'Delete/Discard expired stock: Log, discard, or delete expired medication batches from database.' },
      { label: 'View Low Stock Items', type: 'view', icon: '📋', prompt: 'Show a list of pharmacy and inventory items that are currently below warning threshold levels.' }
    ];
  }

  if (normalized === 'consultation' || normalized === 'consultation-ai') {
    return [
      { label: 'Log Clinical Consultation', type: 'add', icon: '➕', prompt: 'Create/Add consultation report: Log patient consultation details, diagnostic notes, and medication prescription.' },
      { label: 'Modify Prescription Notes', type: 'edit', icon: '✏️', prompt: 'Update/Edit prescription: Edit prescription items, dosages, or administration instructions.' },
      { label: 'Delete Consultation Record', type: 'delete', icon: '🗑️', prompt: 'Delete/Retract prescription: Void or delete a wrongly entered prescription item or consult.' },
      { label: 'View Past Diagnosis Logs', type: 'view', icon: '📋', prompt: 'Show a list of past patient clinical diagnoses, prescriptions, and lab test checkups.' }
    ];
  }

  if (normalized.includes('ward') || normalized.includes('ipd')) {
    return [
      { label: 'Allot Ward Bed', type: 'add', icon: '➕', prompt: 'Create/Add ward allotment: Admit a patient to a ward room, select bed number, and intake checklist.' },
      { label: 'Transfer Bed Allocation', type: 'edit', icon: '✏️', prompt: 'Update/Edit ward allocation: Transfer an admitted patient to ICU or a different room/bed.' },
      { label: 'Discharge Patient & Release Bed', type: 'delete', icon: '🗑️', prompt: 'Delete/Discharge ward allotment: Discharge an inpatient, settle billing, and release bed allocation.' },
      { label: 'View Ward Bed Occupancy', type: 'view', icon: '📋', prompt: 'Show a bed occupancy summary of general wards, emergency rooms, and ICU blocks.' }
    ];
  }

  if (normalized === 'departments' || normalized === 'departments-ai') {
    return [
      { label: 'Add Department Unit', type: 'add', icon: '➕', prompt: 'Create/Add a new department: Set department name, doctor charge level, and on-duty head.' },
      { label: 'Edit Department Config', type: 'edit', icon: '✏️', prompt: 'Update/Edit department: Update room codes, department head, or active status.' },
      { label: 'Delete Empty Department', type: 'delete', icon: '🗑️', prompt: 'Delete/Remove department: Delete or deactivate a department wing when not in use.' },
      { label: 'View Departments Status', type: 'view', icon: '📋', prompt: 'Show breakdown of clinical departments, their registered doctor counts, and occupancy load.' }
    ];
  }

  if (normalized === 'enquiries' || normalized === 'enquiries-ai') {
    return [
      { label: 'Log Support Enquiry', type: 'add', icon: '➕', prompt: 'Create/Add public enquiry: File patient question, email address, phone, and selected department.' },
      { label: 'Resolve Support Ticket', type: 'edit', icon: '✏️', prompt: 'Update/Edit enquiry: Update enquiry status from pending to resolved with response comments.' },
      { label: 'Delete Spam Enquiry', type: 'delete', icon: '🗑️', prompt: 'Delete/Remove enquiry ticket: Delete spam or invalid patient enquiries from database.' },
      { label: 'View Unresolved Enquiries', type: 'view', icon: '📋', prompt: 'Show list of pending unresolved patient inquiries that require assistance.' }
    ];
  }

  if (normalized.includes('tourism')) {
    return [
      { label: 'Add Tourism Request', type: 'add', icon: '➕', prompt: 'Create/Add medical tourism request: Set up patient country, passport ref, fast-track visa letter, and surgery name.' },
      { label: 'Update Visa/Flight Details', type: 'edit', icon: '✏️', prompt: 'Update/Edit tourism details: Edit medical visa status, flight dates, or hotel pickup options.' },
      { label: 'Cancel Tourism File', type: 'delete', icon: '🗑️', prompt: 'Delete/Cancel tourism file: Safely cancel or delete an international medical tourism record.' },
      { label: 'View Received Tourism Enquiries', type: 'view', icon: '📋', prompt: 'Show summary of all international medical tourism requests received by country of origin.' }
    ];
  }

  if (normalized === 'blogs' || normalized === 'blogs-ai') {
    return [
      { label: 'Publish Blog Article', type: 'add', icon: '➕', prompt: 'Create/Add blog post: Compose title, draft content, select category tags, and set status to published.' },
      { label: 'Edit Post Content', type: 'edit', icon: '✏️', prompt: 'Update/Edit blog post: Update an existing article title, content, or change author names on file.' },
      { label: 'Delete/Draft Post', type: 'delete', icon: '🗑️', prompt: 'Delete/Draft blog post: Delete or retract a blog article from public viewing.' },
      { label: 'View Blog Drafts List', type: 'view', icon: '📋', prompt: 'Show directory of draft clinical research articles and blogs awaiting editorial review.' }
    ];
  }

  if (normalized === 'reports' || normalized === 'reports-ai') {
    return [
      { label: 'Generate Monthly Report', type: 'add', icon: '➕', prompt: 'Create/Add report compilation: Generate a fresh monthly statistics report for clinical services.' },
      { label: 'Modify Report Filters', type: 'edit', icon: '✏️', prompt: 'Update/Edit report filters: Filter reports dynamically by custom start date or CSV columns.' },
      { label: 'Delete Archival Report', type: 'delete', icon: '🗑️', prompt: 'Delete/Remove report file: Purge or delete exported report file logs from history tab.' },
      { label: 'View Analytics Statistics', type: 'view', icon: '📋', prompt: 'Show summary of main hospital revenue, active bed loads, and doctor productivity charts.' }
    ];
  }

  if (normalized.includes('config')) {
    return [
      { label: 'Configure Hospital Settings', type: 'add', icon: '➕', prompt: 'Create/Add hospital configuration: Set primary institute name, contact phone, and timezone.' },
      { label: 'Edit Contact Information', type: 'edit', icon: '✏️', prompt: 'Update/Edit hospital info: Change the institute address, emergency hotline, or default fee currency.' },
      { label: 'Reset Default Theme', type: 'delete', icon: '🗑️', prompt: 'Delete/Reset configuration: Clear custom portal theme settings back to system defaults.' },
      { label: 'View Hospital Configuration', type: 'view', icon: '📋', prompt: 'Show current portal configuration profile, emergency details, and support phone numbers.' }
    ];
  }

  if (normalized === 'support' || normalized === 'support-ai') {
    return [
      { label: 'Submit Support Issue', type: 'add', icon: '➕', prompt: 'Create/Add technical issue ticket: Describe system errors, password lockouts, or application lags.' },
      { label: 'Edit Ticket Urgency', type: 'edit', icon: '✏️', prompt: 'Update/Edit support ticket: Change the priority level of a ticket from low to high priority.' },
      { label: 'Close/Delete Ticket', type: 'delete', icon: '🗑️', prompt: 'Delete/Close support ticket: Safely dismiss or delete closed technical issues.' },
      { label: 'View Active Issues Log', type: 'view', icon: '📋', prompt: 'Show active technical issue tickets currently assigned to support engineers.' }
    ];
  }

  if (normalized === 'ai-assistant' || normalized === 'general' || normalized === 'general-ai' || !normalized) {
    if (userRole === 'patient') {
      return [
        { label: 'Book Appointment Slot', type: 'add', icon: '➕', prompt: 'Create/Add a new patient appointment: Book a doctor slot, patient name, date, time, and type of visit.' },
        { label: 'Edit My Profile', type: 'edit', icon: '✏️', prompt: 'Update/Edit patient record: How do I update a patient\'s clinical profile, email address, or emergency contacts?' },
        { label: 'View My Bills', type: 'view', icon: '📋', prompt: 'Show a list of my outstanding or paid bills.' }
      ];
    }
    if (userRole === 'doctor') {
      return [
        { label: 'Update Doctor Details', type: 'edit', icon: '✏️', prompt: 'Update/Edit doctor profile details such as room code, OPD schedule times, contact details, or active fee.' },
        { label: 'Log Clinical Consultation', type: 'add', icon: '➕', prompt: 'Create/Add consultation report: Log patient consultation details, diagnostic notes, and medication prescription.' },
        { label: 'View My Schedule', type: 'view', icon: '📋', prompt: 'Show me a list of my patient appointments scheduled for today.' }
      ];
    }
    if (userRole === 'staff') {
      return [
        { label: 'Register New Patient', type: 'add', icon: '➕', prompt: 'Create/Add a new patient registration: Register details including age, gender, contact number, blood group, and medical history.' },
        { label: 'Book Appointment Slot', type: 'add', icon: '➕', prompt: 'Create/Add a new patient appointment: Book a doctor slot, patient name, date, time, and type of visit.' },
        { label: 'Generate New Invoice', type: 'add', icon: '➕', prompt: 'Create/Add a new hospital billing invoice: Log custom patient fee, items list, discount, tax, and status.' },
        { label: 'View Active Staff', type: 'view', icon: '📋', prompt: 'Show the list of registered hospital staff members with their active status, role, and department.' }
      ];
    }
    // Admin / Fallback
    return [
      { label: 'Book Appointment Slot', type: 'add', icon: '➕', prompt: 'Create/Add a new patient appointment: Book a doctor slot, patient name, date, time, and type of visit.' },
      { label: 'Register New Patient', type: 'add', icon: '➕', prompt: 'Create/Add a new patient registration: Register details including age, gender, contact number, blood group, and medical history.' },
      { label: 'Generate New Invoice', type: 'add', icon: '➕', prompt: 'Create/Add a new hospital billing invoice: Log custom patient fee, items list, discount, tax, and status.' },
      { label: 'Configure Hospital Settings', type: 'edit', icon: '✏️', prompt: 'Update/Edit hospital info: Change the institute address, emergency hotline, or default fee currency.' }
    ];
  }

  return [];
};

export default function AIAssistantView({ 
  contextData, 
  backendApiEndpoint = '/api/ai-assistant/chat', 
  restrictFileTypes = false,
  onBack,
  onNavigate,
  onExecuteAction,
  initialMessage,
  onClearInitialMessage
}: AIAssistantViewProps) {
  const activeTabLower = (contextData?.activeTab || '').toLowerCase().trim();
  const isTabSpecific = activeTabLower && 
                        activeTabLower !== 'general' && 
                        activeTabLower !== 'general-ai' && 
                        activeTabLower !== 'ai-assistant';

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (isTabSpecific) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome to the specialized **${activeTabLower.toUpperCase()} AI Assistant**! 🩺
  
This assistant is strictly dedicated to managing, listing, adding, editing, and deleting **${activeTabLower}** data and operations in this tab.

⚠️ **Strict Boundary Policy:**
I am **restricted** and will only answer and handle questions or tasks related to the ${activeTabLower} workflow. Any general medical, general clinical, or unrelated queries will be politely refused.

💡 For general medical advice, symptoms, or other general helper features, please close this assistant and use the main **AI Assistant** tab.

Feel free to try the **15 Quick Prompts** below or type your specialized query now!`,
          timestamp: new Date()
        }
      ]);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello there! I am your **Clinical & Hospital Management AI Assistant**. \n\nI can assist you with:\n- **Medical & Clinical Queries**: Diagnostic indicators, healthy guidelines, clinical procedures, or drug info.\n- **Hospital Administration & Data**: Active appointment summaries, billing standings, department levels, or staff counts from your current screen.\n- **Vision Recognition**: Upload an image of a clinical prescription, lab report, or diagnostic screen to analyze.\n\n*Security Guideline:* To maintain focus, I will politely decline any off-topic queries that are not related to medical science or hospital context. Let me know how I can help you today!`,
          timestamp: new Date()
        }
      ]);
    }
    setSelectedTool(null);
  }, [contextData?.activeTab]);

  const [input, setInput] = useState('');
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [selectedTool, setSelectedTool] = useState<TabTool | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [docSize, setDocSize] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    url: string;
    size: string;
    duration: number;
    base64?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isSendingRef = useRef(false);

  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  // Multi-model live attempt status records (for developer insight and verification)
  const [latestAttempts, setLatestAttempts] = useState<Attempt[]>([
    { provider: 'Google Gemini', status: 'skipped', error: 'Not run yet' },
    { provider: 'OpenAI', status: 'skipped', error: 'Not run yet' },
    { provider: 'Anthropic Claude', status: 'skipped', error: 'Not run yet' }
  ]);

  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeakText = (messageId: string, text: string) => {
    if (activeSpeechId === messageId) {
      window.speechSynthesis.cancel();
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Clean text of markdown format and trigger actions
    const cleanText = text
      .replace(/\[NAVIGATE:\s*[a-zA-Z0-9_-]+\]/gi, '')
      .replace(/\[ACTION:\s*({.*?})\s*\]/gis, '')
      .replace(/[\*\_`\#\-\+]/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const hasUrduArabic = /[\u0600-\u06FF]/.test(cleanText);
    const hasHindiDev = /[\u0900-\u097F]/.test(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    if (hasUrduArabic || hasHindiDev) {
      const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.lang.startsWith('hi'));
      if (urduVoice) {
        utterance.voice = urduVoice;
      }
    } else {
      const engVoice = voices.find(v => v.lang.startsWith('en'));
      if (engVoice) {
        utterance.voice = engVoice;
      }
    }

    utterance.onend = () => {
      setActiveSpeechId(null);
    };
    utterance.onerror = () => {
      setActiveSpeechId(null);
    };

    setActiveSpeechId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Recording Simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showVoiceSimulator, setShowVoiceSimulator] = useState(false);
  const [simulatedVoiceText, setSimulatedVoiceText] = useState('');
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const shouldSubmitRef = useRef<boolean>(false);
  const selectedTranscriptRef = useRef<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified Hospital Command Console states
  const [activePanel, setActivePanel] = useState<'chat' | 'commands'>('chat');
  const [activeConsoleCategory, setActiveConsoleCategory] = useState<string>('patients');
  const [consoleSearchQuery, setConsoleSearchQuery] = useState<string>('');
  const [showCrudModal, setShowCrudModal] = useState<boolean>(false);
  const [crudOperation, setCrudOperation] = useState<'add' | 'edit'>('add');
  const [crudCategory, setCrudCategory] = useState<string>('patients');
  const [crudEditingItem, setCrudEditingItem] = useState<any>(null);
  const [crudFormData, setCrudFormData] = useState<any>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToastIcon, setShowToastIcon] = useState<boolean>(true);

  const showConsoleToast = (msg: string, success: boolean = true) => {
    setToastMessage(msg);
    setShowToastIcon(success);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getFieldsForCategory = (category: string) => {
    switch (category) {
      case 'patients':
        return [
          { name: 'name', label: 'Patient Name', type: 'text', required: true, placeholder: 'e.g. Ali Khan' },
          { name: 'age', label: 'Age', type: 'number', required: true, placeholder: 'e.g. 28' },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
          { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'], required: true },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true, placeholder: 'e.g. 0300-1234567' },
          { name: 'status', label: 'Status', type: 'select', options: ['New', 'Active', 'Discharged', 'Admitted'], required: true },
        ];
      case 'doctors':
        return [
          { name: 'name', label: 'Doctor Name', type: 'text', required: true, placeholder: 'e.g. Dr. Sarah Ahmad' },
          { name: 'specialization', label: 'Specialization', type: 'text', required: true, placeholder: 'e.g. Cardiologist' },
          { name: 'consultationFee', label: 'Consultation Fee (PKR)', type: 'number', required: true, placeholder: 'e.g. 1500' },
          { name: 'phone', label: 'Contact Phone', type: 'text', required: true, placeholder: 'e.g. 0312-3456789' },
          { name: 'status', label: 'Status', type: 'select', options: ['On Duty', 'Off Duty', 'On Leave'], required: true },
        ];
      case 'appointments':
        return [
          { name: 'patientName', label: 'Patient Name', type: 'text', required: true, placeholder: 'e.g. Ali Khan' },
          { name: 'doctorName', label: 'Doctor Name', type: 'text', required: true, placeholder: 'e.g. Dr. Sarah Ahmad' },
          { name: 'date', label: 'Date', type: 'text', required: true, placeholder: 'e.g. 2026-06-28 or Today' },
          { name: 'time', label: 'Time Slot', type: 'text', required: true, placeholder: 'e.g. 11:30 AM' },
          { name: 'type', label: 'Visit Type', type: 'select', options: ['Opd', 'Ipd', 'Emergency'], required: true },
          { name: 'specialization', label: 'Specialization / Dept', type: 'text', required: true, placeholder: 'e.g. Cardiology' },
          { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled', 'Pending'], required: true },
        ];
      case 'staff':
        return [
          { name: 'name', label: 'Staff Name', type: 'text', required: true, placeholder: 'e.g. Nurse Fatima' },
          { name: 'role', label: 'Staff Role', type: 'text', required: true, placeholder: 'e.g. Senior Nurse' },
          { name: 'department', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Emergency' },
          { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'On Leave'], required: true },
        ];
      case 'billing':
        return [
          { name: 'patientName', label: 'Patient Name', type: 'text', required: true, placeholder: 'e.g. Ali Khan' },
          { name: 'amount', label: 'Total Amount (PKR)', type: 'number', required: true, placeholder: 'e.g. 5000' },
          { name: 'collectedAmount', label: 'Collected Amount (PKR)', type: 'number', required: true, placeholder: 'e.g. 4500' },
          { name: 'discount', label: 'Discount Amount (PKR)', type: 'number', required: true, placeholder: 'e.g. 500' },
          { name: 'status', label: 'Payment Status', type: 'select', options: ['Paid', 'Unpaid', 'Partially Paid', 'Refunded'], required: true },
        ];
      case 'inventory':
        return [
          { name: 'name', label: 'Item Name', type: 'text', required: true, placeholder: 'e.g. Panadol 500mg' },
          { name: 'category', label: 'Category', type: 'select', options: ['Medicine', 'Consumable', 'Equipment', 'Surgical'], required: true },
          { name: 'stock', label: 'Current Stock Qty', type: 'number', required: true, placeholder: 'e.g. 250' },
          { name: 'minStock', label: 'Minimum Stock Level', type: 'number', required: true, placeholder: 'e.g. 50' },
          { name: 'price', label: 'Cost Price (PKR)', type: 'number', required: true, placeholder: 'e.g. 100' },
          { name: 'sellingPrice', label: 'Selling Price (PKR)', type: 'number', required: true, placeholder: 'e.g. 120' },
        ];
      case 'ipd-wards':
        return [
          { name: 'name', label: 'Ward Bed Code / Name', type: 'text', required: true, placeholder: 'e.g. Bed-ICU-04' },
          { name: 'type', label: 'Ward Class Type', type: 'select', options: ['General', 'Semi-Private', 'Private', 'ICU', 'Deluxe'], required: true },
          { name: 'totalBeds', label: 'Total Beds', type: 'number', required: true, placeholder: 'e.g. 10' },
          { name: 'occupiedBeds', label: 'Occupied Beds', type: 'number', required: true, placeholder: 'e.g. 3' },
          { name: 'pricePerDay', label: 'Daily Tariff (PKR)', type: 'number', required: true, placeholder: 'e.g. 3500' },
        ];
      case 'departments':
        return [
          { name: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Cardiology' },
          { name: 'head', label: 'Department Head', type: 'text', required: true, placeholder: 'e.g. Dr. Sarah Ahmad' },
          { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
        ];
      case 'enquiries':
        return [
          { name: 'name', label: 'Sender Name', type: 'text', required: true, placeholder: 'e.g. Hassan Raza' },
          { name: 'email', label: 'Sender Email', type: 'text', required: true, placeholder: 'e.g. hassan@gmail.com' },
          { name: 'subject', label: 'Subject Line', type: 'text', required: true, placeholder: 'e.g. Consultation Slots Inquiry' },
          { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Resolved', 'Ignored'], required: true },
        ];
      default:
        return [];
    }
  };

  const handleOpenAdd = (category: string) => {
    const fields = getFieldsForCategory(category);
    const initialForm: any = {};
    fields.forEach(f => {
      if (f.type === 'select' && f.options) {
        initialForm[f.name] = f.options[0];
      } else if (f.type === 'number') {
        initialForm[f.name] = 0;
      } else {
        initialForm[f.name] = '';
      }
    });
    setCrudCategory(category);
    setCrudOperation('add');
    setCrudEditingItem(null);
    setCrudFormData(initialForm);
    setShowCrudModal(true);
  };

  const handleOpenEdit = (category: string, item: any) => {
    setCrudCategory(category);
    setCrudOperation('edit');
    setCrudEditingItem(item);
    
    // Map existing summary fields to form fields
    const formMap: any = { ...item };
    if (category === 'patients' && item.name) {
      formMap.name = item.name;
    } else if (category === 'appointments') {
      formMap.patientName = item.patient;
      formMap.doctorName = item.doctor;
    } else if (category === 'billing') {
      formMap.patientName = item.patient;
    }
    
    setCrudFormData(formMap);
    setShowCrudModal(true);
  };

  const handleCrudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onExecuteAction) {
      showConsoleToast("Action execution handler not connected.", false);
      return;
    }

    try {
      // Map form fields to backend expected format
      const payload: any = { ...crudFormData };
      
      // Let's adapt keys back to what App.tsx handles
      if (crudCategory === 'appointments') {
        payload.patientName = crudFormData.patientName;
        payload.doctorName = crudFormData.doctorName;
      } else if (crudCategory === 'billing') {
        payload.patientName = crudFormData.patientName;
      }

      if (crudOperation === 'add') {
        onExecuteAction({
          type: 'add',
          tab: crudCategory,
          item: payload
        });
        showConsoleToast(`Successfully added new record to ${crudCategory}!`);
      } else {
        onExecuteAction({
          type: 'edit',
          tab: crudCategory,
          id: crudEditingItem.id,
          item: payload
        });
        showConsoleToast(`Successfully updated record in ${crudCategory}!`);
      }
      setShowCrudModal(false);
    } catch (err: any) {
      showConsoleToast(`Error: ${err.message}`, false);
    }
  };

  const handleCrudDelete = (category: string, item: any) => {
    if (!onExecuteAction) return;
    if (window.confirm(`Are you sure you want to delete this ${category} record (${item.name || item.patient || item.title || item.id})?`)) {
      onExecuteAction({
        type: 'delete',
        tab: category,
        id: item.id
      });
      showConsoleToast(`Successfully deleted ${category} record!`);
    }
  };

  const handleCrudCancel = (category: string, item: any) => {
    if (!onExecuteAction) return;
    if (window.confirm(`Are you sure you want to cancel this appointment (${item.patient || item.id})?`)) {
      onExecuteAction({
        type: 'edit',
        tab: category,
        id: item.id,
        item: { status: 'Cancelled' }
      });
      showConsoleToast(`Appointment cancelled successfully!`);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isRecording]);

  // Handle carried initialMessage from other tabs
  useEffect(() => {
    if (initialMessage) {
      const msg = initialMessage;
      if (onClearInitialMessage) {
        onClearInitialMessage();
      }

      const userMsgId = 'user-' + Date.now();
      const newUserMessage: Message = {
        id: userMsgId,
        role: 'user',
        content: msg.content,
        image: msg.image,
        audio: msg.audio,
        docName: msg.docName,
        docType: msg.docType,
        docSize: msg.docSize,
        docContent: msg.docContent,
        voiceRecorded: msg.voiceRecorded,
        audioUrl: msg.audioUrl,
        audioSize: msg.audioSize,
        audioDuration: msg.audioDuration,
        timestamp: new Date()
      };

      const initialWelcome: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello there! I am your **Clinical & Hospital Management AI Assistant**. \n\nI can assist you with:\n- **Medical & Clinical Queries**: Diagnostic indicators, healthy guidelines, clinical procedures, or drug info.\n- **Hospital Administration & Data**: Active appointment summaries, billing standings, department levels, or staff counts from your current screen.\n- **Vision Recognition**: Upload an image of a clinical prescription, lab report, or diagnostic screen to analyze.\n\n*Security Guideline:* To maintain focus, I will politely decline any off-topic queries that are not related to medical science or hospital context. Let me know how I can help you today!`,
        timestamp: new Date()
      };

      setMessages([initialWelcome, newUserMessage]);
      
      const triggerSend = async () => {
        setIsSending(true);
        try {
          const chatPayload = {
            messages: [initialWelcome, newUserMessage].map(m => ({
              role: m.role,
              content: m.docName 
                ? `[Document Attached: ${m.docName} (${m.docType}, ${m.docSize})]\n${m.docContent ? `Document Content:\n${m.docContent}\n\n` : ''}${m.content}`
                : m.content,
              image: m.image,
              audio: m.audio
            })),
            context: contextData,
            selectedModel: selectedModel
          };

          const response = await fetch(backendApiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatPayload)
          });

          if (!response.ok) {
            throw new Error(`Server returned code ${response.status}`);
          }

          const resData = await response.json();
          if (resData.attempts) {
            setLatestAttempts(resData.attempts);
          }

          let replyContent = resData.reply || "Unable to formulate response from downstream services.";
          
          const navMatch = replyContent.match(/\[NAVIGATE:\s*([a-zA-Z0-9_-]+)\]/i);
          if (navMatch && onNavigate) {
            const targetView = navMatch[1].trim();
            replyContent = replyContent.replace(/\[NAVIGATE:\s*[a-zA-Z0-9_-]+\]/gi, '').trim();
            setTimeout(() => {
              onNavigate(targetView);
            }, 3000);
          }

          const assistantMsg: Message = {
            id: 'assistant-' + Date.now(),
            role: 'assistant',
            content: replyContent,
            attempts: resData.attempts,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
          console.error(err);
          const errorMsg: Message = {
            id: 'error-' + Date.now(),
            role: 'assistant',
            content: `⚠️ System error: (${err.message}). No fallback endpoints could respond. \n\nPlease request support or review active API parameter credentials.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
        } finally {
          setIsSending(false);
        }
      };

      triggerSend();
    }
  }, [initialMessage]);

  // Voice recording timer simulation
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const nextVal = prev + 1;
          recordingSecondsRef.current = nextVal;
          if (nextVal >= 15) {
            // Auto stop at 15s
            stopVoiceRecording(true);
            return 15;
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);



  // Quick Action trigger
  const executeQuickAction = (text: string) => {
    if (isSending) return;
    sendMessage(text);
  };

  // Compress and resize images on client-side to prevent large payload transmit errors (avoiding 413 bodies)
  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024px for swift, legibly sharp vision analysis
          const MAX_DIM = 1024;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Dynamic JPEG quality compression down to 0.75 for ultra-fast light weight
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Process any selected or dropped file (image or document)
  const processSelectedFile = (file: File) => {
    if (isTabSpecific) {
      alert("File uploads (including Excel or CSV) are disabled in this specialized assistant. Please use the main AI Assistant tab for document/image processing.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("File exceeds the maximum limit of 8MB.");
      return;
    }

    if (restrictFileTypes) {
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
      const isExcel = file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isCsv && !isExcel) {
        alert("In this specialized assistant, only CSV and Excel spreadsheets are supported for analysis. PDFs and clinical images are restricted.");
        return;
      }
    }

    // Clear previous selection first
    removeAttachedFile();

    if (file.type.startsWith('image/')) {
      setImageFile(file);
      resizeAndCompressImage(file).then((compressedBase64) => {
        setImagePreview(compressedBase64);
      }).catch((err) => {
        console.error("Compression failed:", err);
        // Fallback to standard reader
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      setDocFile(file);
      setDocName(file.name);
      
      const sizeInKb = (file.size / 1024).toFixed(1);
      const readableSize = parseFloat(sizeInKb) > 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${sizeInKb} KB`;
      setDocSize(readableSize);

      const extension = file.name.split('.').pop()?.toUpperCase() || 'DOC';
      setDocType(extension);

      // Read text contents for raw text, CSV, JSON, spreadsheet representation or XML files
      const lowerName = file.name.toLowerCase();
      if (
        file.type.includes('text') || 
        file.type.includes('csv') || 
        lowerName.endsWith('.csv') || 
        lowerName.endsWith('.txt') || 
        lowerName.endsWith('.json') || 
        lowerName.endsWith('.xml') || 
        lowerName.endsWith('.tsv')
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setDocContent(event.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        // For binary files (like PDF or Excel sheets), read as binary/base64 or provide a brief text marker
        setDocContent(`[Raw binary file attachment of type ${file.type || 'unknown'}]`);
      }
    }
  };

  // Remove current attachment (photo, document, or audio states)
  const removeAttachedFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setDocFile(null);
    setDocName(null);
    setDocType(null);
    setDocSize(null);
    setDocContent(null);
    setRecordedAudio(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keep removeImage matching removeAttachedFile for compatibility
  const removeImage = removeAttachedFile;

  // Handle standard file picker selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag and drop image file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Clear transient stream memory
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat history cleared. How can I assist you with clinical, medical, or administrative inquiries?`,
        timestamp: new Date()
      }
    ]);
  };

  // Helper to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Mock Silent Audio base64 string to support high fidelity Voice simulation when mic hardware is unavailable
  const MOCK_SILENT_AUDIO_BASE64 = "data:audio/webm;base64,GkXfo59ChoEBQveBAULzgQBUg4EAQxuBAXWzgQRzxYREg3uBArSBAZ9B3uBArYIAnUuBArSBAZ9B3uBArYIAko6BAZ9B3uBArYIAn0uBArSBAZ9B3uBArYIAmU6BAZ9B3uBArYIAnEuBArSBAZ9B3uBArYIAmU6BAZ9B";

  const sendSimulatedVoice = (phrase: string) => {
    if (!phrase.trim()) return;
    const sizeInKb = (phrase.length / 140 + 0.5).toFixed(1);
    const mockAudioObj = {
      blob: new Blob([], { type: 'audio/webm' }),
      url: 'blob:mock-simulated-audio-blob',
      size: `${sizeInKb} KB`,
      duration: Math.max(2, Math.min(10, Math.ceil(phrase.length / 10))),
      base64: MOCK_SILENT_AUDIO_BASE64
    };
    sendMessage(phrase, mockAudioObj);
    setShowVoiceSimulator(false);
    setSimulatedVoiceText('');
  };

  // Start Voice recording with MediaRecorder
  const startVoiceRecording = async () => {
    if (isSending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const sizeInKb = (audioBlob.size / 1024).toFixed(1);

        let base64String = '';
        try {
          base64String = await blobToBase64(audioBlob);
        } catch (base64Err) {
          console.error("Base64 audio load failed:", base64Err);
        }

        const audioObj = {
          blob: audioBlob,
          url: audioUrl,
          size: `${sizeInKb} KB`,
          duration: recordingSecondsRef.current || 1,
          base64: base64String
        };

        setRecordedAudio(audioObj);

        if (shouldSubmitRef.current) {
          // Send immediately with only the typed text (if any) or blank (if only voice)
          const textToSend = selectedTranscriptRef.current || input || "";
          sendMessage(textToSend, audioObj);
          shouldSubmitRef.current = false;
          selectedTranscriptRef.current = '';
        }
      };

      recordingSecondsRef.current = 0;
      setIsRecording(true);
      mediaRecorder.start();
    } catch (err) {
      console.warn("Microphone hardware is not available or permission was denied. Falling back to Simulated Speech Mode:", err);
      setShowVoiceSimulator(true);
    }
  };

  // Stop recording and process
  const stopVoiceRecording = (submit: boolean) => {
    setIsRecording(false);
    shouldSubmitRef.current = submit;

    // Do NOT generate any arbitrary simulated text transcripts or autofill the chatbox input.
    // If there is existing typed input, we preserve it, otherwise it stays empty.
    selectedTranscriptRef.current = input.trim();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };



  // Multi-model delivery action
  const sendMessage = async (overrideText?: string, overrideAudio?: {
    blob: Blob;
    url: string;
    size: string;
    duration: number;
    base64?: string;
  }) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    const audioToUse = overrideAudio !== undefined ? overrideAudio : recordedAudio;
    if (!textToSend.trim() && !imagePreview && !docName && !audioToUse && !selectedTool) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      image: imagePreview || undefined,
      audio: audioToUse?.base64 || undefined,
      docName: docName || undefined,
      docType: docType || undefined,
      docSize: docSize || undefined,
      docContent: docContent || undefined,
      voiceRecorded: !!audioToUse,
      audioUrl: audioToUse?.url || undefined,
      audioSize: audioToUse?.size || undefined,
      audioDuration: audioToUse?.duration || undefined,
      tool: selectedTool || undefined,
      timestamp: new Date()
    };

    // Strict boundary rule for Voice/Speech: If the query is a voice recording and is NOT related to this tab, redirect to general assistant
    const isVoice = !!audioToUse;
    if (isVoice && isTabSpecific && !isQueryRelatedToTab(textToSend, activeTabLower)) {
      setInput('');
      removeAttachedFile();
      setRecordedAudio(null);
      setSelectedTool(null);
      if (onNavigate) {
        alert(`This query is not related to the ${activeTabLower.toUpperCase()} workflow. Redirecting to the main AI Assistant...`);
        onNavigate('ai-assistant', newUserMessage);
      }
      return;
    }

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    removeAttachedFile();
    setSelectedTool(null);
    setIsSending(true);

    try {
      const chatPayload = {
        messages: messages.concat(newUserMessage).map(m => {
          let content = m.content;
          if (m.tool) {
            content = `[Contextual Tool selected: ${m.tool.label} (Operation: ${m.tool.type.toUpperCase()})]\nTool Instruction Guide: ${m.tool.prompt}\n\n${content}`;
          }
          if (m.docName) {
            content = `[Document Attached: ${m.docName} (${m.docType}, ${m.docSize})]\n${m.docContent ? `Document Content:\n${m.docContent}\n\n` : ''}${content}`;
          }
          return {
            role: m.role,
            content,
            image: m.image,
            audio: m.audio
          };
        }),
        context: contextData,
        selectedModel
      };

      const response = await fetch(backendApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatPayload)
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const resData = await response.json();
      
      if (resData.attempts) {
        setLatestAttempts(resData.attempts);
      }

      let replyContent = resData.reply || "Unable to formulate response from downstream services.";
      
      // Look for custom [ACTION: {...}] tag inside the reply text (emitted by LLMs)
      let parsedActionFromTag = null;
      const actionMatch = replyContent.match(/\[ACTION:\s*({.*?})\s*\]/s);
      if (actionMatch) {
        try {
          parsedActionFromTag = JSON.parse(actionMatch[1]);
        } catch (e) {
          console.error("Failed to parse [ACTION] json inside reply tag:", e);
        }
        // Always strip the tag from display text so user doesn't see raw JSON blocks
        replyContent = replyContent.replace(/\[ACTION:\s*({.*?})\s*\]/gs, '').trim();
      }

      const finalAction = parsedActionFromTag || resData.action;
      if (finalAction && onExecuteAction) {
        onExecuteAction(finalAction);
      }
      
      const navMatch = replyContent.match(/\[NAVIGATE:\s*([a-zA-Z0-9_-]+)\]/i);
      if (navMatch && onNavigate) {
        const targetView = navMatch[1].trim();
        replyContent = replyContent.replace(/\[NAVIGATE:\s*[a-zA-Z0-9_-]+\]/gi, '').trim();
        setTimeout(() => {
          onNavigate(targetView);
        }, 3000);
      }

      const assistantMsg: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: replyContent,
        attempts: resData.attempts,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `⚠️ System error: (${err.message}). No fallback endpoints could respond. 

Please request support or review active API parameter credentials.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col min-h-0 h-full w-full text-slate-800 overflow-hidden pb-1" 
      id="ai-assistant-container-parent"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden focus-within:border-teal-500/35 transition-all min-h-0" 
        id="chat-subpanel-left"
      >
        {/* Chat Title bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4" id="chat-header-bar">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500 text-white rounded-2xl shadow-md shadow-teal-500/10">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Clinical Hospital AI Assistant</h2>
              <p className="text-xs text-slate-500 font-medium">Transient Secure Stream • Medical Validation Guardrails Active</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" id="header-settings-actions">
            {/* High-Fidelity Model Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all" id="model-selector-container">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 font-mono hidden lg:inline">Engine:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 focus:outline-none cursor-pointer pr-1 py-0"
                title="Select AI Model Engine Cascade Order"
                id="engine-select-dropdown"
              >
                <option value="auto">⚡ Auto (OpenAI ➔ Claude ➔ Google)</option>
                <option value="openai">🟢 OpenAI GPT-4o First</option>
                <option value="claude">🟠 Claude 3.5 Sonnet First</option>
                <option value="gemini">🔵 Google Gemini 1.5 First</option>
              </select>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-750 bg-teal-50 hover:bg-teal-100/90 hover:scale-102 active:scale-95 border border-teal-200/60 rounded-xl transition-all cursor-pointer shadow-xs"
                title="Go Back to last active Tab"
                id="back-to-tab-btn"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Go Back to Tab</span>
              </button>
            )}
            <button 
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-600 hover:bg-slate-105 rounded-xl transition-all cursor-pointer bg-white border border-slate-200 shadow-sm"
              title="Clear current stream history"
              id="clear-chat-history-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Messaging Stream Area */}
        <div 
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-0 transition-all relative scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-50 border-b border-slate-100 ${dragActive ? 'bg-teal-50/20 border-2 border-dashed border-teal-400' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          id="messaging-stream-viewport"
          style={{ scrollBehavior: 'smooth' }}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-teal-50/60 flex flex-col items-center justify-center pointer-events-none z-10">
              <p className="text-sm font-semibold text-teal-700 animate-pulse">Release to upload your diagnostic file scan</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                className={`flex gap-4 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                id={`message-row-${msg.id}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/10 self-end">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none shadow-lg shadow-slate-950/5' 
                    : 'bg-slate-50 text-slate-800 rounded-bl-none border border-slate-100'
                }`}>
                  {/* Image attachment inside bubble */}
                  {msg.image && (
                    <div className="relative mb-3 rounded-2xl overflow-hidden border border-slate-200/50 bg-black/5 max-h-64 w-fit">
                      <img 
                        src={msg.image} 
                        alt="Uploaded file scan" 
                        className="object-contain max-h-64 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Document attachment inside bubble */}
                  {msg.docName && (
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-2xl border ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-teal-50/50 border-teal-100/80 text-slate-800'
                    } max-w-sm`}>
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-teal-500 text-white'
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          {msg.docName}
                        </p>
                        <p className={`text-[10px] font-mono ${msg.role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                          {msg.docType} • {msg.docSize}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio attachment inside bubble */}
                  {msg.voiceRecorded && msg.audioUrl && (
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-2xl border ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-teal-50/50 border-teal-100/80 text-slate-800'
                    } max-w-sm`}>
                      <div className="shrink-0 flex items-center justify-center">
                        <PlayAudioButton url={msg.audioUrl} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          Voice Snippet
                        </p>
                        <p className={`text-[10px] font-mono ${msg.role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                          {msg.audioSize || 'Unknown size'} • 00:{msg.audioDuration ? (msg.audioDuration < 10 ? '0' + msg.audioDuration : msg.audioDuration) : '00'}s
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tool attachment inside bubble */}
                  {msg.tool && (
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-2xl border ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-indigo-50/50 border-indigo-100/80 text-slate-800'
                    } max-w-sm`}>
                      <div className={`p-2.5 rounded-xl shrink-0 text-lg font-bold flex items-center justify-center h-10 w-10 ${
                        msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-indigo-500 text-white'
                      }`}>
                        {msg.tool.icon || '🔧'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          {msg.tool.label}
                        </p>
                        <p className={`text-[10px] font-mono uppercase font-semibold ${msg.role === 'user' ? 'text-indigo-200' : 'text-indigo-600'}`}>
                          {msg.tool.type} Operation
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  {msg.content && msg.content.trim() !== '' && (
                    <div className="text-[13.5px] whitespace-pre-wrap leading-relaxed space-y-2.5 mt-2">
                      {msg.content.split('\n\n').map((paragraph, idx) => {
                        if (!paragraph.trim()) return null;
                        if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                          const items = paragraph.split('\n');
                          return (
                            <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
                              {items.map((item, itemIdx) => {
                                const cleanedItem = item.replace(/^[-*]\s+/, '');
                                return <li key={itemIdx}>{parseBoldText(cleanedItem)}</li>;
                              })}
                            </ul>
                          );
                        }
                        return <p key={idx}>{parseBoldText(paragraph)}</p>;
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-slate-100/10">
                    <span className={`text-[10px] block font-mono tracking-wider text-slate-400`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.content!)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all ${
                          activeSpeechId === msg.id
                            ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 animate-pulse border border-red-500/25'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                        title={activeSpeechId === msg.id ? "Stop Speaking" : "Listen to Response (TTS)"}
                      >
                        {activeSpeechId === msg.id ? (
                          <>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                            Stop Voice
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                            </svg>
                            Listen Voice
                          </>
                        )}
                      </button>
                    )}
                  </div>


                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="h-9 w-9 rounded-2xl bg-teal-50 text-teal-600 border border-teal-150 flex items-center justify-center shrink-0 self-end">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {isSending && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                className="flex gap-4 justify-start"
                id="message-loader-bubble"
              >
                <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-50 text-slate-800 rounded-3xl rounded-bl-none border border-slate-100 p-5 max-w-[200px] flex items-center gap-2">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Formulating...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* LIVE AUDIO RECORDING MOCK SCREEN INDICATOR OVERLAY */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-teal-50/80 border-t border-teal-100 px-6 py-4 flex items-center justify-between"
              id="voice-mic-active-bar"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-10 w-10 rounded-full bg-red-400 animate-ping opacity-75" />
                  <div className="relative h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <Mic className="h-4 w-4 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-teal-850 uppercase tracking-wider">Clinical Audio Recording In Action...</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">00:{recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds} / 00:15s</span>
                    <span className="text-[10px] text-teal-600 font-medium animate-pulse">• Waveform active</span>
                  </div>
                </div>

                {/* Animated Voice/Audio level visualization */}
                <div className="hidden sm:flex items-center gap-0.5 ml-6 h-4">
                  <span className="w-0.5 h-2.5 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-4 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-0.5 h-1.5 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-0.5 h-3 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-0.5 h-4 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2 bg-teal-600 rounded animate-bounce" style={{ animationDelay: '250ms' }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => stopVoiceRecording(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-xl transition-all cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => stopVoiceRecording(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-xl transition-all cursor-pointer font-medium flex items-center gap-1"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  Stop & Process Speech
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Context and Guardrail indicator on bottom of chat */}
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2" id="chat-context-microinfo">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-600" />
            <span>Hospital Screen: <strong>{contextData.activeTab.toUpperCase()}</strong> context loaded with <strong>real database summary objects</strong>.</span>
          </div>
          <span className="font-mono text-[10px] bg-teal-100/60 text-teal-800 px-2 py-0.5 rounded-full font-semibold">Validation Guardrail Level: HIGH</span>
        </div>

        {/* CHAT INPUT FORM (STYLING DIRECTLY INSPIRED BY THE UPLOADED SCREENSHOT) */}
        <div className="p-3 sm:p-5 border-t border-slate-100 bg-white shadow-inner flex flex-col gap-2.5 shrink-0 min-h-0" id="chat-input-controls-parent">
          
          {/* Quick Tab-Sensitive & Suggested Chips */}
          {!isRecording && (
            <div className="mb-1 sm:mb-2" id="quick-chips-wrapper">
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider px-0.5 select-none">
                <Sparkles className="h-3 w-3 text-teal-600 animate-pulse" />
                <span>
                  {input.trim() ? "Active Search Matches & Intelligent Options:" : `Suggested for ${contextData.activeTab.toUpperCase()}:`}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="quick-chips-scroll-grid">
                {(() => {
                  const defaultChips = getChipsForTab(contextData.activeTab, contextData.userRole);
                  let displayChips = defaultChips;
                  if (input.trim()) {
                    const cleanSearch = input.toLowerCase().trim();
                    const filtered = defaultChips.filter(chip =>
                      chip.label.toLowerCase().includes(cleanSearch) || 
                      chip.prompt.toLowerCase().includes(cleanSearch)
                    );
                    if (filtered.length > 0) {
                      displayChips = filtered;
                    } else {
                      const truncateStr = (str: string, len: number) => str.length > len ? str.substring(0, len) + "..." : str;
                      displayChips = [
                        { 
                          label: `Ask clinical model: "${truncateStr(input, 20)}"`, 
                          icon: '✨', 
                          prompt: input 
                        },
                        { 
                          label: `Check "${truncateStr(input, 15)}" pharmacy/logs`, 
                          icon: '💊', 
                          prompt: `Find hospital resources, medication records, or catalog items matching: ${input}` 
                        },
                        { 
                          label: `Clinical procedure for "${truncateStr(input, 15)}"`, 
                          icon: '🩺', 
                          prompt: `Formulate a clinical treatment workflow and risk factors assessment for: ${input}` 
                        }
                      ];
                    }
                  }
                  return displayChips.map((chip, index) => (
                    <button
                      key={index}
                      onClick={() => executeQuickAction(chip.prompt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 rounded-full text-[11px] text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 select-none"
                      title={chip.prompt}
                      id={`quick-chip-item-${index}`}
                    >
                      <span className="text-xs shrink-0">{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}

          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-preview-wrapper"
              >
                <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src={imagePreview} alt="Attached Miniature" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col pr-5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Diagnostic Scan Attached</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse">Ready for vision analysis</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Image"
                  id="remove-attached-image-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}

            {docName && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-doc-preview-wrapper"
              >
                <div className="relative h-11 w-11 rounded-lg bg-teal-500 text-white flex items-center justify-center border border-teal-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col pr-5 max-w-[150px] sm:max-w-[240px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate">{docName}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">{docType} • {docSize}</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse font-semibold">Ready for context ingestion</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Document"
                  id="remove-attached-doc-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}

            {recordedAudio && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs max-w-fit" 
                id="attached-audio-preview"
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <PlayAudioButton url={recordedAudio.url} />
                </div>
                <div className="flex flex-col pr-5 max-w-[150px] sm:max-w-[240px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Audio Recording Snippet</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">{recordedAudio.size} • 00:{recordedAudio.duration < 10 ? '0' + recordedAudio.duration : recordedAudio.duration}s</span>
                  <span className="text-[8px] sm:text-[9px] text-teal-600 font-mono tracking-wider uppercase animate-pulse font-semibold">Ready for voice transmission</span>
                </div>
                <button 
                  onClick={removeAttachedFile}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Attached Audio"
                  id="remove-attached-audio-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}

            {selectedTool && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative inline-flex items-center gap-2.5 p-2 bg-indigo-50/75 rounded-2xl border border-indigo-200 shadow-xs max-w-fit" 
                id="selected-tool-preview-wrapper"
              >
                <div className="relative h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-base">
                  {selectedTool.icon}
                </div>
                <div className="flex flex-col pr-5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-800">{selectedTool.label}</span>
                  <span className="text-[8px] sm:text-[9px] text-indigo-700 font-mono tracking-wider uppercase font-semibold">Active {selectedTool.type.toUpperCase()} command loaded</span>
                </div>
                <button 
                  onClick={() => setSelectedTool(null)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-full border border-indigo-200 cursor-pointer shadow-xs transition-all hover:scale-110 active:scale-90"
                  title="Remove Selected Tool"
                  id="remove-selected-tool-btn"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {showVoiceSimulator && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className="mb-3.5 p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl"
              id="clinical-voice-simulator-card"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center animate-pulse">
                    <Mic className="h-3.5 w-3.5 text-slate-950" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">Hospital Voice Command Simulator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoiceSimulator(false)}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                  title="Dismiss Simulator"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-white/80 leading-relaxed mb-3">
                Your browser microphone permission is currently disabled or hardware is unavailable in the sandboxed preview. 
                No worries! Select a predefined hospital command below or type any query to simulate a voice speech transmission:
              </p>

              <div className="mb-3">
                <span className="text-[9px] font-bold text-white/45 uppercase tracking-widest block mb-1.5">Common Spoken Queries & Navigation Shortcuts:</span>
                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {[
                    { label: "💳 Go to Billing (Urdu)", val: "Aap billing tab par jayen aur outstanding invoice check karein" },
                    { label: "📅 Check Appointments", val: "Check doctor queue status in appointments tab" },
                    { label: "🏥 Check IPD Wards occupancy", val: "IPD ward tab par chalain aur check karein beds" },
                    { label: "👩‍⚕️ List Medical Staff", val: "Show list of nurse staff and coordinators" },
                    { label: "💊 Check Medicine Stocks", val: "Go to Pharmacy Inventory list to verify medication stock" },
                    { label: "🩺 See Doctor slots", val: "Mera doctor schedule table check karein" },
                    { label: "📋 Verify Patient Profiles", val: "Aap patient list record check karein" },
                    { label: "🤖 General Help query", val: "AOA, what clinical capabilities do you possess?" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSimulatedVoiceText(item.val);
                      }}
                      className="text-[10px] py-1 px-2 mb-0.5 bg-white/5 hover:bg-white/15 active:bg-teal-500/10 active:text-teal-400 border border-white/10 rounded-lg text-slate-200 transition-all text-left cursor-pointer truncate max-w-full"
                      title={item.val}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulatedVoiceText}
                  onChange={(e) => setSimulatedVoiceText(e.target.value)}
                  placeholder="Enter what you would speak (e.g. 'Go to billing tab')..."
                  className="flex-1 text-xs py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendSimulatedVoice(simulatedVoiceText);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => sendSimulatedVoice(simulatedVoiceText)}
                  disabled={!simulatedVoiceText.trim()}
                  className="px-3.5 py-2 bg-teal-500 hover:bg-teal-600 active:scale-95 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md select-none shrink-0"
                >
                  <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                  Transmit Speech
                </button>
              </div>
            </motion.div>
          )}

          {/* Screenshot-Style Custom Input Bar Box Wrapper */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="relative flex items-center border border-slate-220 rounded-[24px] bg-slate-50/40 p-1 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all gap-1.5" 
            id="screenshot-input-box-wrapper"
          >
            {/* Input prompt area */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 min-w-0 bg-transparent py-2 px-2.5 sm:py-3 sm:px-4 text-[13px] sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none min-h-[38px] max-h-[100px] scrollbar-none"
              id="prompt-textarea-input"
            />

            {/* Icons Actions Row aligned horizontally (matching screenshot group) */}
            <div className="flex items-center gap-1 sm:gap-1.5 pr-1 shrink-0" id="inner-action-strip">
              
              {/* TAB-SPECIFIC TOOLS DROPDOWN */}
              {isTabSpecific && (
                <div className="relative" id="tab-tools-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer flex items-center justify-center ${
                      showToolsMenu 
                        ? 'bg-teal-500 text-white border border-teal-500' 
                        : 'text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20'
                    }`}
                    title="Tab Operations (Add, Edit, Delete, View)"
                    id="tab-tools-action-btn"
                  >
                    <Wrench className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  </button>

                  <AnimatePresence>
                    {showToolsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full right-0 mb-3.5 w-56 sm:w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 flex flex-col"
                        id="tab-tools-menu-box"
                      >
                        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            ⚙️ {activeTabLower.toUpperCase()} TOOLS
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 font-bold rounded-full uppercase">
                            Contextual
                          </span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto pr-0.5" id="tab-tools-items-list">
                          {(() => {
                            const tools = getToolsForTab(contextData.activeTab, contextData.userRole);
                            if (tools.length === 0) {
                              return (
                                <div className="px-4 py-3 text-center text-xs text-slate-400">
                                  No specific tools loaded for this tab.
                                </div>
                              );
                            }
                            return tools.map((tool, index) => {
                              // Define styles based on tool type
                              let badgeColor = "bg-slate-50 text-slate-600";
                              let hoverBg = "hover:bg-slate-50";
                              if (tool.type === 'add') {
                                badgeColor = "bg-emerald-50 text-emerald-700";
                                hoverBg = "hover:bg-emerald-50/50";
                              } else if (tool.type === 'edit') {
                                badgeColor = "bg-amber-50 text-amber-700";
                                hoverBg = "hover:bg-amber-50/50";
                              } else if (tool.type === 'delete') {
                                badgeColor = "bg-rose-50 text-rose-700";
                                hoverBg = "hover:bg-rose-50/50";
                              } else if (tool.type === 'view') {
                                badgeColor = "bg-blue-50 text-blue-700";
                                hoverBg = "hover:bg-blue-50/50";
                              }

                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTool(tool);
                                    setShowToolsMenu(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-all ${hoverBg} border-b border-slate-50 last:border-0 cursor-pointer`}
                                  title={tool.prompt}
                                  id={`tool-menu-item-${tool.type}`}
                                >
                                  <span className={`text-[10px] h-5 w-5 rounded-md flex items-center justify-center font-bold shrink-0 ${badgeColor}`}>
                                    {tool.icon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-semibold block truncate text-[11px] text-slate-800">
                                      {tool.label}
                                    </span>
                                    <span className="text-[9px] text-slate-400 truncate block font-mono">
                                      {tool.type.toUpperCase()} command
                                    </span>
                                  </div>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* MICROPHONE VOICE BUTTON */}
              <button
                type="button"
                onClick={startVoiceRecording}
                disabled={isRecording}
                className={`p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer ${
                  isRecording ? 'opacity-50 pointer-events-none animate-pulse' : ''
                }`}
                title="Voice Recording"
                id="mic-action-btn"
              >
                <Mic className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </button>

              {/* DIRECT FILE UPLOAD BUTTON */}
              {!isTabSpecific && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-slate-600 hover:text-teal-600 bg-white border border-slate-200 hover:border-teal-200 hover:bg-teal-50/20 shadow-2xs cursor-pointer"
                  title="Upload Image/Document"
                  id="direct-file-upload-btn"
                >
                  <Upload className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                </button>
              )}

              {/* Hidden classic file input for image analysis and documents (Excel, CSV, doc, pdf, txt, etc.) */}
              <input 
                type="file" 
                accept={restrictFileTypes ? ".csv,.xls,.xlsx" : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.xml"} 
                onChange={handleImageChange} 
                ref={fileInputRef} 
                className="hidden" 
                id="hidden-screenshot-file-input"
              />

              {/* ARROW UP SEND ACTION BUTTON */}
              <button
                type="submit"
                disabled={isSending || (!input.trim() && !imagePreview && !docName && !recordedAudio && !selectedTool)}
                className="p-2 sm:p-2.5 bg-slate-900 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-600/10 text-white rounded-full transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 animate-fade-in"
                id="arrow-send-message-btn"
              >
                <ArrowUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 stroke-[2.5]" />
              </button>

            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>

  );
}

// Simple regex parser for inline bold text e.g. **text** -> matching React elements safely
function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-950">{p.slice(2, -2)}</strong>;
        }
        return p;
      })}
    </>
  );
}
