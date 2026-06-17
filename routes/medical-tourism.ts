import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all medical tourism plans/enquiries
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM medical_tourism ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE medical tourism profile
router.post('/', (req, res) => {
  try {
    const { id, name, country, treatment, status, phone, email, passportNumber, notes, date } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO medical_tourism (id, name, country, treatment, status, phone, email, passportNumber, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      name,
      country,
      treatment,
      status || 'Received',
      phone || '',
      email || '',
      passportNumber || '',
      notes || '',
      date || new Date().toISOString()
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE medical tourism profile
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM medical_tourism WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
