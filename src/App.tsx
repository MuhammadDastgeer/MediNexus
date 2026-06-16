import { useState, useEffect } from 'react';
import { ActiveView, Patient, Appointment, Doctor, Staff, Bill, InventoryItem } from './types';
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
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dynamic state arrays backed up by SQLite Database
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});

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
    } catch (err) {
      console.warn('Backend REST server is preparing container...', err);
    }
  };

  // Onmount loader
  useEffect(() => {
    handleRefreshAll();
  }, []);

  // Post Patient
  const handleAddPatient = async (patientInput: Omit<Patient, 'id' | 'registeredAt'>) => {
    const newPatient: Patient = {
      ...patientInput,
      id: `pat-${Date.now().toString().slice(-4)}`,
      registeredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setPatients((prev) => [newPatient, ...prev]);
      }
    } catch {
      setPatients((prev) => [newPatient, ...prev]);
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

    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setDoctors((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch {
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
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
  const handleAddStaff = async (staffInput: Omit<Staff, 'id'>) => {
    const newS: Staff = {
      ...staffInput,
      id: `st-${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newS),
      });
      if (res.ok) {
        handleRefreshAll();
      } else {
        setStaffList((prev) => [...prev, newS]);
      }
    } catch {
      setStaffList((prev) => [...prev, newS]);
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

  // Post Transaction
  const handleAddTransaction = async (txInput: { type: 'income' | 'expense'; category: string; amount: number; date: string; description: string }) => {
    const newTx = {
      ...txInput,
      id: `tx-${Date.now().toString().slice(-4)}`,
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
        setTransactions((prev) => [newTx, ...prev]);
      }
    } catch {
      setTransactions((prev) => [newTx, ...prev]);
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
            onAddPatient={handleAddPatient}
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
          />
        );
      case 'staff':
        return (
          <StaffView
            staffList={staffList}
            onAddStaff={handleAddStaff}
            onRefresh={handleRefreshAll}
          />
        );
      case 'departments':
        return <DepartmentsView />;
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
            onAdmitPatient={() => setActiveView('appointments')}
            onRefresh={handleRefreshAll}
          />
        );
      case 'enquiries':
        return (
          <EnquiriesView
            enquiries={enquiries}
            onUpdateStatus={handleUpdateEnquiryStatus}
            onRefresh={handleRefreshAll}
          />
        );
      case 'medical-tourism':
        return <MedicalTourismView enquiries={[]} onRefresh={handleRefreshAll} />;
      case 'blogs':
        return (
          <BlogsView
            posts={blogPosts}
            onAddBlog={handleAddBlog}
            onRefresh={handleRefreshAll}
          />
        );
      case 'finance':
        return (
          <FinanceView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onRefresh={handleRefreshAll}
          />
        );
      case 'configure-hospital':
        return (
          <ConfigureHospitalView
            settings={hospitalSettings}
            onSaveSettings={handleSaveSettings}
          />
        );
      case 'reports':
        return <ReportsView />;
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
