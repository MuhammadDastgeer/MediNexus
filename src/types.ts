export type ActiveView =
  | 'dashboard'
  | 'appointments'
  | 'consultation'
  | 'billing'
  | 'inventory'
  | 'ipd-wards'
  | 'staff'
  | 'doctors'
  | 'patients'
  | 'departments'
  | 'enquiries'
  | 'medical-tourism'
  | 'blogs'
  | 'reports'
  | 'finance'
  | 'configure-hospital'
  | 'support';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  registeredAt: string;
  status: 'New' | 'Follow-up';
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  type?: 'Regular' | 'Follow-up';
  patientEmail?: string;
  patientPassword?: string;
  patientPhone?: string;
  patientWhatsapp?: string;
  patientGender?: 'Male' | 'Female' | 'Other';
  age?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: 'On Duty' | 'Off Duty';
  phone: string;
  email?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  qualification?: string;
  experience?: string | number;
  medicalRegNo?: string;
  licenseNumber?: string;
  department?: string;
  consultationFee?: number;
  followUpFee?: number;
  isActive?: boolean;
  availableForBooking?: boolean;
  fee?: number;
  password?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive';
}

export interface Bill {
  id: string;
  patientName: string;
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
  discount?: number;
  pendingAmount?: number;
  collectedAmount?: number;
  items?: string; // stringified JSON array of { name: string, value: number }
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  unit?: string;
  hsnCode?: string;
  mrp?: number;
  gst?: number;
  status?: 'Active' | 'Inactive';
  genericName?: string;
  brandName?: string;
  subCategory?: string;
  preferredSupplier?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  barcode?: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  status: 'Active' | 'Inactive';
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  items: string; // JSON array of items purchased: { name: string, quantity: number, price: number }
  invoiceNo?: string;
  remarks?: string;
}

export interface DeptTransfer {
  id: string;
  department: string;
  transferDate: string;
  totalQty: number;
  totalValue: number;
  items: string; // JSON array of items transferred: { name: string, quantity: number, price: number }
  status: 'Completed' | 'Pending';
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  notes?: string;
}
