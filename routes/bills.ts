import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all bills
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bills ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a bill
router.post('/', (req, res) => {
  try {
    const { id, patientName, amount, status, date, discount, pendingAmount, collectedAmount, items } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO bills (id, patientName, amount, status, date, discount, pendingAmount, collectedAmount, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, patientName, Number(amount), status, date, Number(discount || 0), Number(pendingAmount || 0), Number(collectedAmount || 0), items || '[]');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update general billing fields
router.patch('/:id', (req, res) => {
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

// DELETE a bill
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
