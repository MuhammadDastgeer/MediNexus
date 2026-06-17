import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all appointments
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM appointments').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE an appointment
router.post('/', (req, res) => {
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

    // Automatically check if a patient with the same name exists
    if (patientName && patientName.trim()) {
      const existingPatient = db.prepare('SELECT id FROM patients WHERE LOWER(name) = LOWER(?)').get(patientName.trim());
      if (!existingPatient) {
        // Create new patient automatically
        const patId = `pat-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
        const regAt = new Date().toISOString();
        const insertPat = db.prepare(`
          INSERT INTO patients (
            id, name, age, gender, phone, registeredAt, status, email, password
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertPat.run(
          patId,
          patientName.trim(),
          Number(age || 30),
          patientGender || 'Male',
          patientPhone || '',
          regAt,
          'New',
          patientEmail || '',
          patientPassword || ''
        );
      }
    }

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

// UPDATE specific appointment fields
router.patch('/:id', (req, res) => {
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

// DELETE an appointment
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
