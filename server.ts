import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import db from './db.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Execute Schema Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    registeredAt TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patientName TEXT,
    doctorName TEXT,
    specialization TEXT,
    date TEXT,
    time TEXT,
    status TEXT,
    type TEXT,
    department TEXT,
    patientEmail TEXT,
    patientPassword TEXT,
    patientPhone TEXT,
    patientWhatsapp TEXT,
    patientGender TEXT,
    age INTEGER
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT,
    specialization TEXT,
    status TEXT,
    phone TEXT,
    email TEXT,
    fee INTEGER,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    department TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    patientName TEXT,
    amount REAL,
    status TEXT,
    date TEXT,
    discount REAL,
    pendingAmount REAL,
    collectedAmount REAL,
    items TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    stock INTEGER,
    minStock INTEGER,
    price REAL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstNumber TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    supplierId TEXT,
    supplierName TEXT,
    purchaseDate TEXT,
    amount REAL,
    paidAmount REAL,
    pendingAmount REAL,
    paymentStatus TEXT,
    dueDate TEXT,
    items TEXT
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    department TEXT,
    transferDate TEXT,
    totalQty INTEGER,
    totalValue REAL,
    items TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    query TEXT,
    status TEXT,
    department TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT,
    status TEXT,
    category TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS medical_tourism (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    treatment TEXT,
    status TEXT,
    phone TEXT,
    email TEXT,
    passportNumber TEXT,
    notes TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS finance (
    id TEXT PRIMARY KEY,
    type TEXT,
    category TEXT,
    amount REAL,
    date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    description TEXT,
    type TEXT,
    location TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS sub_departments (
    id TEXT PRIMARY KEY,
    departmentId TEXT,
    name TEXT,
    code TEXT,
    description TEXT,
    type TEXT,
    location TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS wards (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    bedsTotal INTEGER,
    bedsOccupied INTEGER,
    bedsAvailable INTEGER,
    bedsMaintenance INTEGER
  );
`);

// Safety column upgrades for existing SQLite tables
const addColumnSafely = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`Upgraded ${table} table: added ${column}`);
  } catch (err) {
    // Column already exists, safe to ignore
  }
};

addColumnSafely('bills', 'items', 'TEXT');
addColumnSafely('bills', 'discount', 'REAL');
addColumnSafely('bills', 'pendingAmount', 'REAL');
addColumnSafely('bills', 'collectedAmount', 'REAL');

addColumnSafely('inventory', 'unit', 'TEXT');
addColumnSafely('inventory', 'hsnCode', 'TEXT');
addColumnSafely('inventory', 'mrp', 'REAL');
addColumnSafely('inventory', 'gst', 'REAL');
addColumnSafely('inventory', 'status', 'TEXT');
addColumnSafely('inventory', 'genericName', 'TEXT');
addColumnSafely('inventory', 'brandName', 'TEXT');
addColumnSafely('inventory', 'subCategory', 'TEXT');
addColumnSafely('inventory', 'preferredSupplier', 'TEXT');
addColumnSafely('inventory', 'purchasePrice', 'REAL');
addColumnSafely('inventory', 'sellingPrice', 'REAL');
addColumnSafely('inventory', 'barcode', 'TEXT');
addColumnSafely('inventory', 'description', 'TEXT');

addColumnSafely('purchases', 'invoiceNo', 'TEXT');
addColumnSafely('purchases', 'remarks', 'TEXT');

addColumnSafely('transfers', 'priority', 'TEXT');
addColumnSafely('transfers', 'notes', 'TEXT');

addColumnSafely('appointments', 'patientEmail', 'TEXT');
addColumnSafely('appointments', 'patientPassword', 'TEXT');
addColumnSafely('appointments', 'patientPhone', 'TEXT');
addColumnSafely('appointments', 'patientWhatsapp', 'TEXT');
addColumnSafely('appointments', 'patientGender', 'TEXT');
addColumnSafely('appointments', 'age', 'INTEGER');

addColumnSafely('doctors', 'gender', 'TEXT');
addColumnSafely('doctors', 'dob', 'TEXT');
addColumnSafely('doctors', 'bloodGroup', 'TEXT');
addColumnSafely('doctors', 'address', 'TEXT');
addColumnSafely('doctors', 'qualification', 'TEXT');
addColumnSafely('doctors', 'experience', 'INTEGER');
addColumnSafely('doctors', 'medicalRegNo', 'TEXT');
addColumnSafely('doctors', 'licenseNumber', 'TEXT');
addColumnSafely('doctors', 'department', 'TEXT');
addColumnSafely('doctors', 'consultationFee', 'INTEGER');
addColumnSafely('doctors', 'followUpFee', 'INTEGER');
addColumnSafely('doctors', 'isActive', 'INTEGER');
addColumnSafely('doctors', 'availableForBooking', 'INTEGER');
addColumnSafely('doctors', 'password', 'TEXT');

addColumnSafely('wards', 'roomsData', 'TEXT');
addColumnSafely('patients', 'wardId', 'TEXT');
addColumnSafely('patients', 'roomId', 'TEXT');
addColumnSafely('patients', 'bedNumber', 'TEXT');
addColumnSafely('patients', 'dob', 'TEXT');
addColumnSafely('patients', 'bloodGroup', 'TEXT');
addColumnSafely('patients', 'address', 'TEXT');
addColumnSafely('patients', 'email', 'TEXT');
addColumnSafely('patients', 'password', 'TEXT');

addColumnSafely('staff', 'email', 'TEXT');
addColumnSafely('staff', 'phone', 'TEXT');
addColumnSafely('staff', 'joinDate', 'TEXT');
addColumnSafely('staff', 'dob', 'TEXT');
addColumnSafely('staff', 'workingDays', 'TEXT');
addColumnSafely('staff', 'address', 'TEXT');
addColumnSafely('staff', 'monthlySalary', 'REAL');
addColumnSafely('staff', 'bankName', 'TEXT');
addColumnSafely('staff', 'bankAccountNo', 'TEXT');
addColumnSafely('staff', 'panNo', 'TEXT');
addColumnSafely('staff', 'pfAccountNo', 'TEXT');
addColumnSafely('staff', 'pfUan', 'TEXT');
addColumnSafely('staff', 'password', 'TEXT');
addColumnSafely('blogs', 'description', 'TEXT');

// Prepopulate tables if empty
const prepopulate = () => {
  // Prep Settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('hospitalName', 'Code');
    insertSetting.run('website', 'https://hospital.com');
    insertSetting.run('bookingSlug', 'my-hospital');
    insertSetting.run('bookingUrl', 'https://medi-nex-plus-nine.vercel.app/appointment?hid=a00bb217-901a-4b14-8f4f-84369fb0f117');
    insertSetting.run('address', '123 Medical Lane, City');
    insertSetting.run('phone', '+923706939429');
    insertSetting.run('email', 'besamof549@afterdo.com');
    insertSetting.run('timezone', 'Asia/Kolkata (IST, UTC+5:30)');
    insertSetting.run('gst', '22AAAAA0000A1Z5');
    insertSetting.run('regNo', 'HOSP/2026/001');
  }

  // Prep Doctors
  const docsCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
  if (docsCount.count === 0) {
    const insertDoc = db.prepare('INSERT INTO doctors (id, name, specialization, status, phone, email, fee) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertDoc.run('doc-1', 'Dr. Anil Sharma', 'Cardiology', 'On Duty', '+91 98765 43210', 'anil@hospital.com', 500);
    insertDoc.run('doc-2', 'Dr. Priya Patel', 'Pediatrics', 'On Duty', '+91 87654 32109', 'priya@hospital.com', 400);
    insertDoc.run('doc-3', 'Dr. Sameer Khan', 'Orthopedics', 'On Duty', '+91 76543 21098', 'sameer@hospital.com', 600);
    insertDoc.run('doc-4', 'Dr. Meera Sen', 'Neurology', 'On Duty', '+91 65432 10987', 'meera@hospital.com', 700);
    insertDoc.run('doc-5', 'Dr. Rohan Jha', 'Dermatology', 'On Duty', '+91 54321 09876', 'rohan@hospital.com', 450);
  }

  // Prep Inventory
  const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };
  if (invCount.count === 0) {
    const insertInv = db.prepare('INSERT INTO inventory (id, name, category, stock, minStock, price) VALUES (?, ?, ?, ?, ?, ?)');
    insertInv.run('inv-1', 'Amoxicillin Pharma Injectable', 'Antibiotics', 120, 20, 45);
    insertInv.run('inv-2', 'Disposable Sterile Syringes 5ml', 'Surgical Supplies', 500, 100, 5);
    insertInv.run('inv-3', 'Paracetamol Tablets 500mg', 'Antibiotics', 350, 50, 12);
    insertInv.run('inv-4', 'Blood Pressure Monitor (Acoustic)', 'Diagnostics', 15, 3, 1400);
  }

  // Prep Staff
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
  if (staffCount.count === 0) {
    const insertStaff = db.prepare('INSERT INTO staff (id, name, role, department, status) VALUES (?, ?, ?, ?, ?)');
    insertStaff.run('st-1', 'Aman Verma', 'Frontdesk Officer', 'Billing & Reception', 'Active');
    insertStaff.run('st-2', 'Kiran Grewal', 'Senior Nurse', 'Emergency Care Ward', 'Active');
    insertStaff.run('st-3', 'Vijay Chawla', 'Ward Boy', 'Intensive Care Unit (ICU)', 'Active');
  }

  // Prep Patients
  const patientsCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
  if (patientsCount.count === 0) {
    const insertPat = db.prepare('INSERT INTO patients (id, name, age, gender, phone, registeredAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertPat.run('pat-2001', 'M. Ramzan', 45, 'Male', '+92 300 1234567', '2026-06-12T10:00:00Z', 'Follow-up');
    insertPat.run('pat-2002', 'Kiran Shah', 28, 'Female', '+92 321 9876543', '2026-06-12T11:00:00Z', 'New');
    insertPat.run('pat-2003', 'Arshad Khan', 35, 'Male', '+92 345 1122334', '2026-06-12T14:00:00Z', 'Follow-up');
    insertPat.run('pat-2004', 'Saira Banu', 52, 'Female', '+92 312 4455667', '2026-06-12T16:00:00Z', 'New');
  }

  // Prep Appointments
  const apptsCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
  
  const todayDate = new Date();
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayStr = formatYMD(todayDate);
  const threeDaysAgoDate = new Date(todayDate);
  threeDaysAgoDate.setDate(todayDate.getDate() - 3);
  const threeDaysAgoStr = formatYMD(threeDaysAgoDate);

  if (apptsCount.count === 0) {
    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        id, patientName, doctorName, specialization, date, time, status, type, department,
        patientEmail, patientPassword, patientPhone, patientWhatsapp, patientGender, age
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAppt.run(
      'apt-201', 'M. Ramzan', 'Dr. Anil Sharma', 'Cardiology', todayStr, '10:30 AM', 'Confirmed', 'Follow-up', 'Cardiology',
      'ramzan@gmail.com', 'pass123', '+92 300 1234567', '+92 300 1234567', 'Male', 45
    );
    insertAppt.run(
      'apt-202', 'Kiran Shah', 'Dr. Priya Patel', 'Pediatrics', todayStr, '11:45 AM', 'Scheduled', 'Regular', 'Pediatrics',
      'kiran@gmail.com', 'pass123', '+92 321 9876543', '+92 321 9876543', 'Female', 28
    );
    insertAppt.run(
      'apt-203', 'Arshad Khan', 'Dr. Sameer Khan', 'Orthopedics', todayStr, '02:15 PM', 'Completed', 'Follow-up', 'Orthopedics',
      'arshad@gmail.com', 'pass123', '+92 345 1122334', '+92 345 1122334', 'Male', 35
    );
    insertAppt.run(
      'apt-204', 'Saira Banu', 'Dr. Rohan Jha', 'Dermatology', todayStr, '04:00 PM', 'Cancelled', 'Regular', 'Dermatology',
      'saira@gmail.com', 'pass123', '+92 312 4455667', '+92 312 4455667', 'Female', 52
    );
    insertAppt.run(
      'apt-205', 'M. Ramzan', 'Dr. Anil Sharma', 'Cardiology', threeDaysAgoStr, '09:00 AM', 'Completed', 'Regular', 'Cardiology',
      'ramzan@gmail.com', 'pass123', '+92 300 1234567', '+92 300 1234567', 'Male', 45
    );
  } else {
    // If table already exists, update these seeded records to be relative to today's date so data is updated daily
    try {
      db.prepare("UPDATE appointments SET date = ? WHERE id IN ('apt-201', 'apt-202', 'apt-203', 'apt-204')").run(todayStr);
      db.prepare("UPDATE appointments SET date = ? WHERE id = 'apt-205'").run(threeDaysAgoStr);
      console.log(`Successfully synced seeded appointment dates to current date: ${todayStr}`);
    } catch (e) {
      console.warn("Failed to automatically update existing seeded appointment dates:", e);
    }
  }

  // Prep Departments
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (deptCount.count === 0) {
    const insertDept = db.prepare('INSERT INTO departments (id, name, code, description, type, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertDept.run('dept-1', 'Cardiology', 'CARD', 'Heart health and cardiovascular disorders', 'Clinical', 'Ground Floor, Room 101-105', 'Active');
    insertDept.run('dept-2', 'Pediatrics', 'PED', 'Medical care of infants, children, and adolescents', 'Clinical', 'First Floor, Room 201-208', 'Active');
    insertDept.run('dept-3', 'Neurology', 'NEUR', 'Brain and nervous system disorders treatment', 'Clinical', 'Second Floor, Room 301-304', 'Active');
    insertDept.run('dept-4', 'Orthopedics', 'ORTH', 'Musculoskeletal system, spine and joints care', 'Clinical', 'Ground Floor, Room 110-115', 'Active');
    insertDept.run('dept-5', 'Emergency & Trauma Care', 'TRAU', 'Immediate critical and trauma medical response', 'Clinical', 'Ground Floor, Red Zone', 'Active');

    // Prep Sub-departments
    const insertSub = db.prepare('INSERT INTO sub_departments (id, departmentId, name, code, description, type, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertSub.run('sub-1', 'dept-1', 'Eco-Cardiography', 'ECO', 'Ultrasound imaging of the heart chambers', 'Lab Testing', 'Room 103', 'Active');
    insertSub.run('sub-2', 'dept-1', 'Cardiac ICU', 'CICU', 'Intensive monitoring for heart attack patients', 'Emergency', 'Wing A-1', 'Active');
    insertSub.run('sub-3', 'dept-2', 'Neonatology Unit', 'NEO', 'Specialized care for premature newborn infants', 'Critical ICU', 'Room 205', 'Active');
    insertSub.run('sub-4', 'dept-2', 'Immunization Center', 'IMM', 'Routine and specialized pediatric vaccinations', 'Outpatient', 'Room 208', 'Active');
    insertSub.run('sub-5', 'dept-3', 'EEG Labs', 'EEG', 'Electrophysiological testing for brain signals', 'Lab Testing', 'Room 304', 'Active');
  }

  // Prep Enquiries
  const enquiriesCount = db.prepare('SELECT COUNT(*) as count FROM enquiries').get() as { count: number };
  if (enquiriesCount.count === 0) {
    const insertEnquiry = db.prepare('INSERT INTO enquiries (id, name, phone, email, query, status, department, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertEnquiry.run('enq-1', 'Amit Patel', '+91 99223 34455', 'amit.patel@gmail.com', 'I want to ask about bypass surgery costing and recovery protocols.', 'Pending', 'Cardiology', '2026-06-16T04:00:00Z');
    insertEnquiry.run('enq-2', 'Sana Mir', '+92 321 4455667', 'sana.mir@yahoo.com', 'Are newborn vaccinations available on weekends?', 'Resolved', 'Pediatrics', '2026-06-15T09:30:00Z');
    insertEnquiry.run('enq-3', 'John Doe', '+1 415 555 2671', 'john.doe@gmail.com', 'Do you provide EEG testing facilities for seizure patients?', 'Pending', 'Neurology', '2026-06-14T11:20:00Z');
  }

  // Prep Blogs
  const blogsCount = db.prepare('SELECT COUNT(*) as count FROM blogs').get() as { count: number };
  if (blogsCount.count === 0) {
    const insertBlog = db.prepare('INSERT INTO blogs (id, title, status, category, date) VALUES (?, ?, ?, ?, ?)');
    insertBlog.run('blog-1', 'Understanding Cardiac Bypass: What Patients Should Know', 'Published', 'Medical Breakthroughs', '2026-06-10T12:00:00Z');
    insertBlog.run('blog-2', 'Routine Vaccine Calendars: Protecting Your Toddler', 'Published', 'Wellness & Lifestyle', '2026-06-12T14:30:00Z');
    insertBlog.run('blog-3', 'Advancements in Non-Invasive Brain Analysis (EEG/EMG)', 'Draft', 'Research & Clinical', '2026-06-15T08:00:00Z');
  }

  // Prep Medical Tourism
  const tourismCount = db.prepare('SELECT COUNT(*) as count FROM medical_tourism').get() as { count: number };
  if (tourismCount.count === 0) {
    const insertTourism = db.prepare('INSERT INTO medical_tourism (id, name, country, treatment, status, phone, email, passportNumber, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertTourism.run('mt-1', 'Al-Mamun', 'Bangladesh', 'Coronary Angioplasty', 'Received', '+880 1711-223344', 'mamun@gmail.com', 'A8839401', 'Patient requires letter for fast-track medical visa.', '2026-06-15T10:00:00Z');
    insertTourism.run('mt-2', 'Abdul Rahman', 'Oman', 'Hip Replacement', 'VISA Assistance', '+968 9912 3456', 'rahman.oman@hotmail.com', 'OM293847', 'Needs airport pickup and single private deluxe room ward.', '2026-06-14T08:15:00Z');
    insertTourism.run('mt-3', 'Michael Davies', 'United Kingdom', 'Spine Rehabilitation', 'Scheduled', '+44 7911 123456', 'michael.dav@gmail.com', 'UK930491', 'Tentative date of arrival scheduled for June 28th.', '2026-06-13T16:45:00Z');
  }
};

prepopulate();

// Import separate API routers
import patientsRouter from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import doctorsRouter from './routes/doctors.js';
import staffRouter from './routes/staff.js';
import billsRouter from './routes/bills.js';
import inventoryRouter from './routes/inventory.js';
import suppliersRouter from './routes/suppliers.js';
import purchasesRouter from './routes/purchases.js';
import transfersRouter from './routes/transfers.js';
import enquiriesRouter from './routes/enquiries.js';
import medicalTourismRouter from './routes/medical-tourism.js';
import blogsRouter from './routes/blogs.js';
import financeRouter from './routes/finance.js';
import wardsRouter from './routes/wards.js';
import settingsRouter from './routes/settings.js';
import departmentsRouter from './routes/departments.js';
import subDepartmentsRouter from './routes/sub-departments.js';
import dashboardRouter from './routes/dashboard.js';
import aiAssistantRouter from './routes/ai-assistant.js';

// API Route Mountings
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/bills', billsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/transfers2', transfersRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/medical-tourism', medicalTourismRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/wards', wardsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/sub-departments', subDepartmentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai-assistant', aiAssistantRouter);

// Integrate Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only listen locally if not running on Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

export default app;
