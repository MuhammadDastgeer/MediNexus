import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all suppliers
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM suppliers').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a supplier
router.post('/', (req, res) => {
  try {
    const { id, name, phone, email, address, gstNumber, status } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO suppliers (id, name, phone, email, address, gstNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, phone, email, address, gstNumber, status || 'Active');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a supplier
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
