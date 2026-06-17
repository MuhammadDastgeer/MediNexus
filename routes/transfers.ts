import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all transfers
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM transfers').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a transfer
router.post('/', (req, res) => {
  try {
    const { id, department, transferDate, totalQty, totalValue, items, status, priority, notes } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO transfers (id, department, transferDate, totalQty, totalValue, items, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, department, transferDate, Number(totalQty), Number(totalValue), items || '[]', status || 'Completed', priority || 'Normal', notes || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a transfer
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM transfers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
