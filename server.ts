import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite Database
const db = new Database('hospital.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

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

db.exec(`
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
  if (apptsCount.count === 0) {
    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        id, patientName, doctorName, specialization, date, time, status, type, department,
        patientEmail, patientPassword, patientPhone, patientWhatsapp, patientGender, age
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAppt.run(
      'apt-201', 'M. Ramzan', 'Dr. Anil Sharma', 'Cardiology', '2026-06-15', '10:30 AM', 'Confirmed', 'Follow-up', 'Cardiology',
      'ramzan@gmail.com', 'pass123', '+92 300 1234567', '+92 300 1234567', 'Male', 45
    );
    insertAppt.run(
      'apt-202', 'Kiran Shah', 'Dr. Priya Patel', 'Pediatrics', '2026-06-15', '11:45 AM', 'Scheduled', 'Regular', 'Pediatrics',
      'kiran@gmail.com', 'pass123', '+92 321 9876543', '+92 321 9876543', 'Female', 28
    );
    insertAppt.run(
      'apt-203', 'Arshad Khan', 'Dr. Sameer Khan', 'Orthopedics', '2026-06-15', '02:15 PM', 'Completed', 'Follow-up', 'Orthopedics',
      'arshad@gmail.com', 'pass123', '+92 345 1122334', '+92 345 1122334', 'Male', 35
    );
    insertAppt.run(
      'apt-204', 'Saira Banu', 'Dr. Rohan Jha', 'Dermatology', '2026-06-15', '04:00 PM', 'Cancelled', 'Regular', 'Dermatology',
      'saira@gmail.com', 'pass123', '+92 312 4455667', '+92 312 4455667', 'Female', 52
    );
    insertAppt.run(
      'apt-205', 'M. Ramzan', 'Dr. Anil Sharma', 'Cardiology', '2026-06-12', '09:00 AM', 'Completed', 'Regular', 'Cardiology',
      'ramzan@gmail.com', 'pass123', '+92 300 1234567', '+92 300 1234567', 'Male', 45
    );
  }
};

prepopulate();

// API REST Endpoints

// Settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settingsObj: Record<string, string> = {};
    rows.forEach((r) => {
      settingsObj[r.key] = r.value;
    });
    res.json(settingsObj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const body = req.body;
    const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.keys(body).forEach((k) => {
      updateSetting.run(k, String(body[k]));
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Patients
app.get('/api/patients', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM patients ORDER BY registeredAt DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const { id, name, age, gender, phone, registeredAt, status } = req.body;
    const stmt = db.prepare('INSERT INTO patients (id, name, age, gender, phone, registeredAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, Number(age), gender, phone, registeredAt, status);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments
app.get('/api/appointments', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM appointments').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const {
      id,
      patientName,
      doctorName,
      specialization,
      date,
      time,
      status,
      type,
      department,
      patientEmail,
      patientPassword,
      patientPhone,
      patientWhatsapp,
      patientGender,
      age
    } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO appointments (id, patientName, doctorName, specialization, date, time, status, type, department, patientEmail, patientPassword, patientPhone, patientWhatsapp, patientGender, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(
      id,
      patientName,
      doctorName,
      specialization,
      date,
      time,
      status,
      type || 'OPD',
      department || 'General',
      patientEmail || '',
      patientPassword || '',
      patientPhone || '',
      patientWhatsapp || '',
      patientGender || 'Male',
      Number(age || 30)
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const fields = ['status', 'patientName', 'doctorName', 'specialization', 'date', 'time', 'type', 'department', 'patientEmail', 'patientPassword', 'patientPhone', 'patientWhatsapp', 'patientGender', 'age'];
    const updates: string[] = [];
    const values: any[] = [];

    fields.forEach(f => {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(f === 'age' ? Number(body[f]) : body[f]);
      }
    });

    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Doctors
app.get('/api/doctors', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM doctors').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', (req, res) => {
  try {
    const {
      id, name, specialization, status, phone, email, fee,
      gender, dob, bloodGroup, address, qualification, experience,
      medicalRegNo, licenseNumber, department, consultationFee, followUpFee,
      isActive, availableForBooking, password
    } = req.body;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO doctors (
        id, name, specialization, status, phone, email, fee,
        gender, dob, bloodGroup, address, qualification, experience,
        medicalRegNo, licenseNumber, department, consultationFee, followUpFee,
        isActive, availableForBooking, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      name,
      specialization,
      status || 'On Duty',
      phone || '',
      email || '',
      Number(fee || consultationFee || 500),
      gender || 'Male',
      dob || '',
      bloodGroup || '',
      address || '',
      qualification || '',
      Number(experience || 0),
      medicalRegNo || '',
      licenseNumber || '',
      department || specialization || 'General Medicine',
      Number(consultationFee || fee || 500),
      Number(followUpFee || 300),
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      availableForBooking !== undefined ? (availableForBooking ? 1 : 0) : 1,
      password || ''
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/doctors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const fields = [
      'name', 'specialization', 'status', 'phone', 'email', 'fee',
      'gender', 'dob', 'bloodGroup', 'address', 'qualification', 'experience',
      'medicalRegNo', 'licenseNumber', 'department', 'consultationFee', 'followUpFee',
      'isActive', 'availableForBooking', 'password'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    fields.forEach((f) => {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`);
        if (f === 'fee' || f === 'consultationFee' || f === 'followUpFee' || f === 'experience') {
          values.push(Number(body[f]));
        } else if (f === 'isActive' || f === 'availableForBooking') {
          values.push(body[f] ? 1 : 0);
        } else {
          values.push(body[f]);
        }
      }
    });

    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE doctors SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/doctors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM doctors WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff
app.get('/api/staff', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM staff').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const { id, name, role, department, status } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO staff (id, name, role, department, status) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, role, department, status);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const stmt = db.prepare('UPDATE staff SET status = ? WHERE id = ?');
    stmt.run(status, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bills
app.get('/api/bills', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bills ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', (req, res) => {
  try {
    const { id, patientName, amount, status, date, discount, pendingAmount, collectedAmount, items } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO bills (id, patientName, amount, status, date, discount, pendingAmount, collectedAmount, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, patientName, Number(amount), status, date, Number(discount || 0), Number(pendingAmount || 0), Number(collectedAmount || 0), items || '[]');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bills/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { patientName, amount, status, discount, pendingAmount, collectedAmount, items } = req.body;
    const stmt = db.prepare(`
      UPDATE bills 
      SET patientName = ?, amount = ?, status = ?, discount = ?, pendingAmount = ?, collectedAmount = ?, items = ? 
      WHERE id = ?
    `);
    stmt.run(patientName, Number(amount), status, Number(discount || 0), Number(pendingAmount || 0), Number(collectedAmount || 0), items || '[]', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
app.get('/api/inventory', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventory').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const { 
      id, name, category, stock, minStock, price, unit, hsnCode, mrp, gst, status,
      genericName, brandName, subCategory, preferredSupplier, purchasePrice, sellingPrice, barcode, description
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO inventory (
        id, name, category, stock, minStock, price, unit, hsnCode, mrp, gst, status,
        genericName, brandName, subCategory, preferredSupplier, purchasePrice, sellingPrice, barcode, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, name, category, Number(stock || 0), Number(minStock || 0), Number(price || 0), unit || 'pcs', hsnCode || '', Number(mrp || price || 0), Number(gst || 0), status || 'Active',
      genericName || '', brandName || '', subCategory || '', preferredSupplier || '', Number(purchasePrice || price || 0), Number(sellingPrice || price || 0), barcode || '', description || ''
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    if (body.stock !== undefined && body.name === undefined) {
      // Light update for quick restock
      const stmt = db.prepare('UPDATE inventory SET stock = ? WHERE id = ?');
      stmt.run(Number(body.stock), id);
    } else {
      // Complete edit
      const fields = [
        'name', 'category', 'stock', 'minStock', 'price', 'unit', 'hsnCode', 'mrp', 'gst', 'status',
        'genericName', 'brandName', 'subCategory', 'preferredSupplier', 'purchasePrice', 'sellingPrice', 'barcode', 'description'
      ];
      
      const updates: string[] = [];
      const values: any[] = [];
      
      fields.forEach((f) => {
        if (body[f] !== undefined) {
          updates.push(`${f} = ?`);
          if (['stock', 'minStock', 'price', 'mrp', 'gst', 'purchasePrice', 'sellingPrice'].includes(f)) {
            values.push(Number(body[f]));
          } else {
            values.push(body[f]);
          }
        }
      });
      
      if (updates.length > 0) {
        values.push(id);
        const stmt = db.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers
app.get('/api/suppliers', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM suppliers').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { id, name, phone, email, address, gstNumber, status } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO suppliers (id, name, phone, email, address, gstNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, phone, email, address, gstNumber, status || 'Active');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Purchases
app.get('/api/purchases', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM purchases').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const { id, supplierId, supplierName, purchaseDate, amount, paidAmount, pendingAmount, paymentStatus, dueDate, items, invoiceNo, remarks } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO purchases (id, supplierId, supplierName, purchaseDate, amount, paidAmount, pendingAmount, paymentStatus, dueDate, items, invoiceNo, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, supplierId, supplierName, purchaseDate, Number(amount), Number(paidAmount || 0), Number(pendingAmount || 0), paymentStatus || 'Pending', dueDate || purchaseDate, items || '[]', invoiceNo || '', remarks || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transfers
app.get('/api/transfers2', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM transfers').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transfers2', (req, res) => {
  try {
    const { id, department, transferDate, totalQty, totalValue, items, status, priority, notes } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO transfers (id, department, transferDate, totalQty, totalValue, items, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, department, transferDate, Number(totalQty), Number(totalValue), items || '[]', status || 'Completed', priority || 'Normal', notes || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transfers2/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM transfers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Enquiries
app.get('/api/enquiries', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM enquiries ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/enquiries', (req, res) => {
  try {
    const { id, name, phone, email, query, status, department, date } = req.body;
    const stmt = db.prepare('INSERT INTO enquiries (id, name, phone, email, query, status, department, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, phone, email, query, status, department, date);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/enquiries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const stmt = db.prepare('UPDATE enquiries SET status = ? WHERE id = ?');
    stmt.run(status, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Blogs
app.get('/api/blogs', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM blogs ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/blogs', (req, res) => {
  try {
    const { id, title, status, category, date } = req.body;
    const stmt = db.prepare('INSERT INTO blogs (id, title, status, category, date) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, title, status, category, date);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Finance
app.get('/api/finance', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM finance ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance', (req, res) => {
  try {
    const { id, type, category, amount, date, description } = req.body;
    const stmt = db.prepare('INSERT INTO finance (id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, type, category, Number(amount), date, description);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wards
app.get('/api/wards', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM wards').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wards', (req, res) => {
  try {
    const { id, name, type, bedsTotal, bedsOccupied, bedsAvailable, bedsMaintenance } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO wards (id, name, type, bedsTotal, bedsOccupied, bedsAvailable, bedsMaintenance) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, type, Number(bedsTotal), Number(bedsOccupied), Number(bedsAvailable), Number(bedsMaintenance));
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

startServer();
