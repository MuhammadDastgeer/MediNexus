import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all enquiries
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM enquiries ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE an enquiry
router.post('/', (req, res) => {
  try {
    const { id, name, phone, email, query, status, department, date } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO enquiries (id, name, phone, email, query, status, department, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, phone, email, query, status || 'Pending', department, date || new Date().toISOString());
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an enquiry status
router.patch('/:id', (req, res) => {
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

// DELETE an enquiry
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
