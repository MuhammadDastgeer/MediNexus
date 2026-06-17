import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all doctors
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM doctors').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a doctor
router.post('/', (req, res) => {
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

// UPDATE specific doctor fields
router.patch('/:id', (req, res) => {
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

// DELETE a doctor
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM doctors WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
