import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all patients
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM patients ORDER BY registeredAt DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a patient
router.post('/', (req, res) => {
  try {
    const { 
      id, name, age, gender, phone, registeredAt, status, 
      wardId, roomId, bedNumber, dob, bloodGroup, address, email, password 
    } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO patients (
        id, name, age, gender, phone, registeredAt, status, 
        wardId, roomId, bedNumber, dob, bloodGroup, address, email, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, name, Number(age || 0), gender, phone, registeredAt, status, 
      wardId || null, roomId || null, bedNumber || null,
      dob || null, bloodGroup || null, address || null, email || null, password || null
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a patient
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
