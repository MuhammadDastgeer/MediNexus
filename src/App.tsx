import { useState, useEffect } from 'react';
import { ActiveView, Patient, Appointment, Doctor, Staff, Bill, InventoryItem, Department, SubDepartment } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RightSidebar from './components/RightSidebar';

// 17 Module Subcomponents!
import DashboardView from './components/DashboardView';
import AppointmentsView from './components/AppointmentsView';
import PatientsView from './components/PatientsView';
import BillingView from './components/BillingView';
import InventoryView from './components/InventoryView';
import DoctorsView from './components/DoctorsView';
import StaffView from './components/StaffView';
import DepartmentsView from './components/DepartmentsView';
import ConsultationView from './components/ConsultationView';
import IpdWardsView from './components/IpdWardsView';
import EnquiriesView from './components/EnquiriesView';
import MedicalTourismView from './components/MedicalTourismView';
import BlogsView from './components/BlogsView';
import FinanceView from './components/FinanceView';
import ConfigureHospitalView from './components/ConfigureHospitalView';
import ReportsView from './components/ReportsView';
import SupportView from './components/SupportView';

export default function App() {
  const [activeView, setActiveViewState] = useState<ActiveView>('dashboard');

  const viewToPathMap: Record<ActiveView, string> = {
    'dashboard': '/admin/dashboard',
    'appointments': '/admin/appointments',
    'consultation': '/admin/consultation',
    'billing': '/admin/billing',
    'inventory': '/admin/inventory',
    'ipd-wards': '/admin/ipd-wards',
    'staff': '/admin/staff',
    'doctors': '/admin/doctors',
    'patients': '/admin/patients',
    'departments': '/admin/departments',
    'enquiries': '/admin/enquiries',
    'medical-tourism': '/admin/medical-tourism',
    'blogs': '/admin/blogs',
    'reports': '/admin/reports',
    'finance': '/admin/finance',
    'configure-hospital': '/admin/configure-hospital',
    'support': '/admin/support',
  };

  const getViewFromPath = (pathname: string): ActiveView => {
    const cleanPath = pathname.toLowerCase().replace(/^\/+/g, '').replace(/\/+$/g, '');
    if (cleanPath.includes('dashboard') || cleanPath.includes('desboard')) return 'dashboard';
    if (cleanPath.includes('appointment')) return 'appointments';
    if (cleanPath.includes('consultation')) return 'consultation';
    if (cleanPath.includes('billing') || cleanPath.includes('bill')) return 'billing';
    if (cleanPath.includes('inventory')) return 'inventory';
    if (cleanPath.includes('ipd-wards') || cleanPath.includes('ward') || cleanPath.includes('ipd')) return 'ipd-wards';
    if (cleanPath.includes('staff')) return 'staff';
    if (cleanPath.includes('doctor')) return 'doctors';
    if (cleanPath.includes('patient')) return 'patients';
    if (cleanPath.includes('department')) return 'departments';
    if (cleanPath.includes('enquiries') || cleanPath.includes('enquiry')) return 'enquiries';
    if (cleanPath.includes('medical-tourism') || cleanPath.includes('tourism')) return 'medical-tourism';
    if (cleanPath.includes('blog')) return 'blogs';
    if (cleanPath.includes('report')) return 'reports';
    if (cleanPath.includes('finance')) return 'finance';
    if (cleanPath.includes('configure-hospital') || cleanPath.includes('configure')) return 'configure-hospital';
    if (cleanPath.includes('support')) return 'support';
    
    return 'dashboard';
  };

  const setActiveView = (view: ActiveView) => {
    setActiveViewState(view);
    const targetPath = viewToPathMap[view] || `/admin/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const matchedView = getViewFromPath(window.location.pathname);
      setActiveViewState(matchedView);
    };

    const initialView = getViewFromPath(window.location.pathname);
    setActiveViewState(initialView);

    const targetPath = viewToPathMap[initialView];
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dynamic state arrays backed up by SQLite Database
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [medicalTourismEnquiries, setMedicalTourismEnquiries] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);

  // Global Refresh Routine
  const handleRefreshAll = async () => {
    try {
      // Patients
      const patientsRes = await fetch('/api/patients');
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data);
      }

      // Appointments
      const apptsRes = await fetch('/api/appointments');
      if (apptsRes.ok) {
        const data = await apptsRes.json();
        setAppointments(data);
      }

      // Bills
      const billsRes = await fetch('/api/bills');
      if (billsRes.ok) {
        const data = await billsRes.json();
        setBills(data);
      }

      // Doctors
      const doctorsRes = await fetch('/api/doctors');
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setDoctors(data);
      }

      // Inventory
      const invRes = await fetch('/api/inventory');
      if (invRes.ok) {
        const data = await invRes.json();
        setInventory(data);
      }

      // Staff
      const staffRes = await fetch('/api/staff');
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data);
      }

      // Enquiries
      const enquiriesRes = await fetch('/api/enquiries');
      if (enquiriesRes.ok) {
        const data = await enquiriesRes.json();
        setEnquiries(data);
      }

      // Medical Tourism Enquiries
      const mtRes = await fetch('/api/medical-tourism');
      if (mtRes.ok) {
        const data = await mtRes.json();
        setMedicalTourismEnquiries(data);
      }

      // Blogs
      const blogsRes = await fetch('/api/blogs');
      if (blogsRes.ok) {
        const data = await blogsRes.json();
        setBlogPosts(data);
      }

      // Finance
      const financeRes = await fetch('/api/finance');
      if (financeRes.ok) {
        const data = await financeRes.json();
        setTransactions(data);
      }

      // Wards
      const wardsRes = await fetch('/api/wards');
      if (wardsRes.ok) {
        const data = await wardsRes.json();
        setWards(data);
      }

      // Settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setHospitalSettings(data);
      }

      // Departments & Sub-departments
      const deptRes = await fetch('/api/departments');
      if (deptRes.ok) {
        setDepartments(await deptRes.json());
      }
      const subRes = await fetch('/api/sub-departments');
      if (subRes.ok) {
        setSubDepartments(await subRes.json());
      }
    } catch (err) {
      console.warn('Backend REST server is preparing container...', err);
    }
  };

  // Onmount loader
  useEffect(() => {
    handleRefreshAll();
  }, []);

  // Automated daily doctor roster status checker and system verification
  useEffect(() => {
    // Only proceed once doctors and appointments are cataloged
    if (!doctors || doctors.length === 0) return;

    // Get current calendar day in local system format
    const todayStr = new Date().toDateString();
    const lastDailyRosterSync = localStorage.getItem('last_daily_hospital_roster_sync');

    if (lastDailyRosterSync === todayStr) return; // Already finished daily verification check

    const syncRosterDaily = async () => {
      console.log("Initiating daily hospital roster automatic sync.");
      let changedAny = false;
      const SwedishDate = new Date();
      const todayDateStr = `${SwedishDate.getFullYear()}-${String(SwedishDate.getMonth() + 1).padStart(2, '0')}-${String(SwedishDate.getDate()).padStart(2, '0')}`;
      
      for (const doc of doctors) {
        // Find if they have any scheduled appointment today
        const hasApptToday = appointments.some(
          a => (a.doctorName === doc.name || a.doctorName.toLowerCase().includes(doc.name.toLowerCase())) 
               && a.date === todayDateStr 
               && a.status !== 'Cancelled'
        );

        // If today they have work booked, but standard status is Off Duty, auto-correct roster to On Duty!
        if (hasApptToday && doc.status !== 'On Duty') {
          try {
            await fetch(`/api/doctors/${doc.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'On Duty', isActive: 1 })
            });
            changedAny = true;
          } catch (e) {
            console.warn(`Error auto-checking roster for ${doc.name}`, e);
          }
        }
      }

      if (changedAny) {
        handleRefreshAll();
      }
      localStorage.setItem('last_daily_hospital_roster_sync', todayStr);
    };

    syncRosterDaily();
  }, [doctors, appointments]);

  // Post Patient / Edit
  const handleAddPatient = async (patientInput: Omit<Patient, 'id' | 'registeredAt'> & { id?: string }) => {
    const isEdit = !!patientInput.id;
    const existing = isEdit ? patients.find(p => p.id === patientInput.id) : null;
    const newPatient: Patient = {
      ...patientInput,
      id: patientInput.id || `pat-${Date.now().toString().slice(-4)}`,
      registeredAt: existing ? existing.registeredAt : new Date().toISOString(),
    } as Patient;

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setPatients((prev) => isEdit ? prev.map(p => p.id === newPatient.id ? newPatient : p) : [newPatient, ...prev]);
      }
    } catch {
      setPatients((prev) => isEdit ? prev.map(p => p.id === newPatient.id ? newPatient : p) : [newPatient, ...prev]);
    }
  };

  const handleDeletePatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Post Appointment
  const handleAddAppointment = async (apptInput: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...apptInput,
      id: `apt-${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setAppointments((prev) => [newAppt, ...prev]);
      }
    } catch {
      setAppointments((prev) => [newAppt, ...prev]);
    }
  };

  // Change Appointment status
  const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
  };

  // Full Update / Edit Appointment
  const handleUpdateAppointment = async (id: string, fields: Partial<Appointment>) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...fields } : a))
        );
      }
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...fields } : a))
      );
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Ward handlers
  const handleAddWard = async (ward: any) => {
    try {
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ward),
      });
      if (res.ok) {
        handleRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWard = async (id: string) => {
    try {
      const res = await fetch(`/api/wards/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePatient = async (patient: any) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      if (res.ok) {
        handleRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Invoice
  const handleAddBill = async (billInput: Omit<Bill, 'id' | 'date'>) => {
    const newBill: Bill = {
      ...billInput,
      id: `INV-${Date.now().toString().slice(-5)}`,
      date: new Date().toLocaleDateString(),
    };

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBill),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBills((prev) => [newBill, ...prev]);
      }
    } catch {
      setBills((prev) => [newBill, ...prev]);
    }
  };

  // Update Invoice
  const handleUpdateBill = async (bill: Bill) => {
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
      }
    } catch {
      setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    }
  };

  // Delete Invoice
  const handleDeleteBill = async (id: string) => {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBills((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      setBills((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Post Inventory Item
  const handleAddInventoryItem = async (itemInput: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemInput,
      id: `inv-${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setInventory((prev) => [newItem, ...prev]);
      }
    } catch {
      setInventory((prev) => [newItem, ...prev]);
    }
  };

  // Restock Qty
  const handleRestock = async (id: string, amount: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: item.stock + amount }),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setInventory((prev) =>
          prev.map((i) => (i.id === id ? { ...i, stock: i.stock + amount } : i))
        );
      }
    } catch {
      setInventory((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stock: i.stock + amount } : i))
      );
    }
  };

  // Update Inventory Item
  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    try {
      const res = await fetch(`/api/inventory/${updatedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setInventory((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );
      }
    } catch {
      setInventory((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
      );
    }
  };

  // Delete Inventory Item
  const handleDeleteInventoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setInventory((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      setInventory((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Post Doctor specialist
  const handleAddDoctor = async (docInput: Omit<Doctor, 'id'>) => {
    const newDoc: Doctor = {
      ...docInput,
      id: `doc-${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDoctors((prev) => [...prev, newDoc]);
      }
    } catch {
      setDoctors((prev) => [...prev, newDoc]);
    }
  };

  // Toggle Doctor status
  const handleToggleDoctorStatus = async (id: string) => {
    const doc = doctors.find((d) => d.id === id);
    if (!doc) return;
    const newStatus = doc.status === 'On Duty' ? 'Off Duty' : 'On Duty';
    const isNowActive = newStatus === 'On Duty' ? 1 : 0;

    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, isActive: isNowActive }),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDoctors((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus, isActive: isNowActive === 1 } : d))
        );
      }
    } catch {
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus, isActive: isNowActive === 1 } : d))
      );
    }
  };

  // Update Doctor profile
  const handleUpdateDoctor = async (id: string, fields: Partial<Doctor>) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDoctors((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...fields } : d))
        );
      }
    } catch {
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...fields } : d))
      );
    }
  };

  // Delete Doctor entry
  const handleDeleteDoctor = async (id: string) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Post Staff member
  const handleAddStaff = async (staffInput: Omit<Staff, 'id'> & { id?: string }) => {
    const isEdit = !!staffInput.id;
    const newS: Staff = {
      ...staffInput,
      id: staffInput.id || `st-${Date.now().toString().slice(-4)}`,
    } as Staff;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newS),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setStaffList((prev) => isEdit ? prev.map(s => s.id === newS.id ? newS : s) : [...prev, newS]);
      }
    } catch {
      setStaffList((prev) => isEdit ? prev.map(s => s.id === newS.id ? newS : s) : [...prev, newS]);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Post Enquiry
  const handleAddEnquiry = async (name: string, phone: string, query: string) => {
    const newEnq = {
      id: `enq-${Date.now().toString().slice(-4)}`,
      name,
      phone,
      email: '',
      query,
      status: 'Pending',
      department: 'General',
      date: new Date().toLocaleDateString(),
    };

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnq),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setEnquiries((prev) => [newEnq, ...prev]);
      }
    } catch {
      setEnquiries((prev) => [newEnq, ...prev]);
    }
  };

  // Update Enquiry status
  const handleUpdateEnquiryStatus = async (id: string, status: 'Pending' | 'Resolved' | 'Spam') => {
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status } : e))
        );
      }
    } catch {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
  };

  // Post Blog
  const handleAddBlog = async (title: string, category: string) => {
    const newBlog = {
      id: `blog-${Date.now().toString().slice(-4)}`,
      title,
      status: 'Published',
      category,
      date: new Date().toLocaleDateString(),
    };

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlog),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBlogPosts((prev) => [newBlog, ...prev]);
      }
    } catch {
      setBlogPosts((prev) => [newBlog, ...prev]);
    }
  };

  // FULL CRUD HANDLERS
  const handleSaveEnquiry = async (enquiry: any) => {
    const freshEnq = {
      ...enquiry,
      id: enquiry.id || `enq-${Date.now().toString().slice(-4)}`,
      date: enquiry.date || new Date().toISOString()
    };
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(freshEnq),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setEnquiries((prev) => {
          const exists = prev.find(e => e.id === freshEnq.id);
          if (exists) {
            return prev.map(e => e.id === freshEnq.id ? freshEnq : e);
          }
          return [freshEnq, ...prev];
        });
      }
    } catch {
      setEnquiries((prev) => {
        const exists = prev.find(e => e.id === freshEnq.id);
        if (exists) {
          return prev.map(e => e.id === freshEnq.id ? freshEnq : e);
        }
        return [freshEnq, ...prev];
      });
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setEnquiries((prev) => prev.filter(e => e.id !== id));
      }
    } catch {
      setEnquiries((prev) => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveTourismEnquiry = async (enquiry: any) => {
    const freshTourism = {
      ...enquiry,
      id: enquiry.id || `mt-${Date.now().toString().slice(-4)}`,
      date: enquiry.date || new Date().toISOString()
    };
    try {
      const res = await fetch('/api/medical-tourism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(freshTourism),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setMedicalTourismEnquiries((prev) => {
          const exists = prev.find(e => e.id === freshTourism.id);
          if (exists) {
            return prev.map(e => e.id === freshTourism.id ? freshTourism : e);
          }
          return [freshTourism, ...prev];
        });
      }
    } catch {
      setMedicalTourismEnquiries((prev) => {
        const exists = prev.find(e => e.id === freshTourism.id);
        if (exists) {
          return prev.map(e => e.id === freshTourism.id ? freshTourism : e);
        }
        return [freshTourism, ...prev];
      });
    }
  };

  const handleDeleteTourismEnquiry = async (id: string) => {
    try {
      const res = await fetch(`/api/medical-tourism/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setMedicalTourismEnquiries((prev) => prev.filter(e => e.id !== id));
      }
    } catch {
      setMedicalTourismEnquiries((prev) => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveBlog = async (blog: any) => {
    const freshBlog = {
      ...blog,
      id: blog.id || `blog-${Date.now().toString().slice(-4)}`,
      date: blog.date || new Date().toISOString()
    };
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(freshBlog),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBlogPosts((prev) => {
          const exists = prev.find(b => b.id === freshBlog.id);
          if (exists) {
            return prev.map(b => b.id === freshBlog.id ? freshBlog : b);
          }
          return [freshBlog, ...prev];
        });
      }
    } catch {
      setBlogPosts((prev) => {
        const exists = prev.find(b => b.id === freshBlog.id);
        if (exists) {
          return prev.map(b => b.id === freshBlog.id ? freshBlog : b);
        }
        return [freshBlog, ...prev];
      });
    }
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setBlogPosts((prev) => prev.filter(b => b.id !== id));
      }
    } catch {
      setBlogPosts((prev) => prev.filter(b => b.id !== id));
    }
  };

  // Post / Save Transaction
  const handleSaveTransaction = async (txInput: { id?: string; type: 'income' | 'expense'; category: string; amount: number; date: string; description: string }) => {
    const newTx = {
      ...txInput,
      id: txInput.id || `tx-${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setTransactions((prev) => {
          const exists = prev.find(t => t.id === newTx.id);
          if (exists) {
            return prev.map(t => t.id === newTx.id ? newTx : t);
          }
          return [newTx, ...prev];
        });
      }
    } catch {
      setTransactions((prev) => {
        const exists = prev.find(t => t.id === newTx.id);
        if (exists) {
          return prev.map(t => t.id === newTx.id ? newTx : t);
        }
        return [newTx, ...prev];
      });
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setTransactions((prev) => prev.filter(t => t.id !== id));
      }
    } catch {
      setTransactions((prev) => prev.filter(t => t.id !== id));
    }
  };

  // Save Settings
  const handleSaveSettings = async (settings: Record<string, string>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setHospitalSettings((prev) => ({ ...prev, ...settings }));
      }
    } catch {
      setHospitalSettings((prev) => ({ ...prev, ...settings }));
    }
  };

  // Departments CRUD
  const handleAddDepartment = async (deptInput: Omit<Department, 'id'> & { id?: string }) => {
    const isEdit = !!deptInput.id;
    const newDept: Department = {
      ...deptInput,
      id: deptInput.id || `dept-${Date.now().toString().slice(-4)}`
    } as Department;

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDepartments(prev => isEdit ? prev.map(d => d.id === newDept.id ? newDept : d) : [newDept, ...prev]);
      }
    } catch {
      setDepartments(prev => isEdit ? prev.map(d => d.id === newDept.id ? newDept : d) : [newDept, ...prev]);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDepartments(prev => prev.filter(d => d.id !== id));
        setSubDepartments(prev => prev.filter(s => s.departmentId !== id));
      }
    } catch {
      setDepartments(prev => prev.filter(d => d.id !== id));
      setSubDepartments(prev => prev.filter(s => s.departmentId !== id));
    }
  };

  const handleAddSubDepartment = async (subInput: Omit<SubDepartment, 'id'> & { id?: string }) => {
    const isEdit = !!subInput.id;
    const newSub: SubDepartment = {
      ...subInput,
      id: subInput.id || `sub-${Date.now().toString().slice(-4)}`
    } as SubDepartment;

    try {
      const res = await fetch('/api/sub-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setSubDepartments(prev => isEdit ? prev.map(s => s.id === newSub.id ? newSub : s) : [newSub, ...prev]);
      }
    } catch {
      setSubDepartments(prev => isEdit ? prev.map(s => s.id === newSub.id ? newSub : s) : [newSub, ...prev]);
    }
  };

  const handleDeleteSubDepartment = async (id: string) => {
    try {
      const res = await fetch(`/api/sub-departments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setSubDepartments(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      setSubDepartments(prev => prev.filter(s => s.id !== id));
    }
  };

  // Switch rendered view dynamically to match user clicks
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            appointments={appointments}
            patients={patients}
            inventory={inventory}
            onNavigate={setActiveView}
            bills={bills}
            doctors={doctors}
            staffList={staffList}
          />
        );
      case 'patients':
        return (
          <PatientsView
            patients={patients}
            doctors={doctors}
            wards={wards}
            bills={bills}
            appointments={appointments}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onAddAppointment={handleAddAppointment}
            onRefresh={handleRefreshAll}
          />
        );
      case 'appointments':
        return (
          <AppointmentsView
            appointments={appointments}
            doctors={doctors}
            onAddAppointment={handleAddAppointment}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onRefresh={handleRefreshAll}
          />
        );
      case 'billing':
        return (
          <BillingView
            bills={bills}
            patients={patients}
            onAddBill={handleAddBill}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
            onRefresh={handleRefreshAll}
          />
        );
      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            onAddInventoryItem={handleAddInventoryItem}
            onUpdateInventoryItem={handleUpdateInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
            onRestock={handleRestock}
            onRefresh={handleRefreshAll}
          />
        );
      case 'doctors':
        return (
          <DoctorsView
            doctors={doctors}
            onAddDoctor={handleAddDoctor}
            onToggleStatus={handleToggleDoctorStatus}
            onUpdateDoctor={handleUpdateDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onNavigate={setActiveView}
          />
        );
      case 'staff':
        return (
          <StaffView
            staffList={staffList}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onRefresh={handleRefreshAll}
            onNavigate={setActiveView}
          />
        );
      case 'departments':
        return (
          <DepartmentsView
            departments={departments}
            subDepartments={subDepartments}
            doctors={doctors}
            onAddDepartment={handleAddDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onAddSubDepartment={handleAddSubDepartment}
            onDeleteSubDepartment={handleDeleteSubDepartment}
            onRefresh={handleRefreshAll}
          />
        );
      case 'consultation':
        return (
          <ConsultationView
            appointments={appointments}
            doctors={doctors}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onRefresh={handleRefreshAll}
            onOpenBooking={() => setActiveView('appointments')}
          />
        );
      case 'ipd-wards':
        return (
          <IpdWardsView
            patients={patients}
            wards={wards}
            onAdmitPatient={() => setActiveView('appointments')}
            onRefresh={handleRefreshAll}
            onAddWard={handleAddWard}
            onDeleteWard={handleDeleteWard}
            onUpdatePatient={handleUpdatePatient}
          />
        );
      case 'enquiries':
        return (
          <EnquiriesView
            enquiries={enquiries}
            onUpdateStatus={handleUpdateEnquiryStatus}
            onSaveEnquiry={handleSaveEnquiry}
            onDeleteEnquiry={handleDeleteEnquiry}
            onRefresh={handleRefreshAll}
          />
        );
      case 'medical-tourism':
        return (
          <MedicalTourismView
            enquiries={medicalTourismEnquiries}
            onSaveEnquiry={handleSaveTourismEnquiry}
            onDeleteEnquiry={handleDeleteTourismEnquiry}
            onRefresh={handleRefreshAll}
          />
        );
      case 'blogs':
        return (
          <BlogsView
            posts={blogPosts}
            onSaveBlog={handleSaveBlog}
            onDeleteBlog={handleDeleteBlog}
            onRefresh={handleRefreshAll}
          />
        );
      case 'finance':
        return (
          <FinanceView
            transactions={transactions}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onRefresh={handleRefreshAll}
          />
        );
      case 'configure-hospital':
        return (
          <ConfigureHospitalView
            settings={hospitalSettings}
            onSaveSettings={handleSaveSettings}
            onNavigate={setActiveView}
          />
        );
      case 'reports':
        return (
          <ReportsView
            appointments={appointments}
            bills={bills}
            staffList={staffList}
            doctors={doctors}
            patients={patients}
            departments={departments}
            subDepartments={subDepartments}
            inventory={inventory}
            onRefresh={handleRefreshAll}
          />
        );
      case 'support':
        return <SupportView />;
      default:
        return (
          <div className="p-8 text-center text-slate-500" id="fallback-view">
            <h3 className="text-sm font-semibold text-slate-700 capitalize">
              {activeView.replace('-', ' ')}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              This module is prepared and fully linked to your central hospital manager.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f7f6] overflow-hidden select-none font-sans" id="hospital-admin-app">
      {/* 1. Left Navigation Drawer */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* 2. Primary Admin Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="central-column">
        {/* Top Search-Bell Bar */}
        <Header />

        {/* Central Component Swapper */}
        <main className="flex-1 overflow-hidden" id="workspace-scroll">
          {renderActiveView()}
        </main>
      </div>

      {/* 3. Right Sidebar widgets (Calendar, duty doctor shifts & today stats summary) - Only on Dashboard */}
      {activeView === 'dashboard' && (
        <RightSidebar
          appointments={appointments}
          patients={patients}
          inventory={inventory}
          doctors={doctors}
          bills={bills}
        />
      )}
    </div>
  );
}
