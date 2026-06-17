import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all financial transactions
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM finance ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE financial transaction
router.post('/', (req, res) => {
  try {
    const { id, type, category, amount, date, description } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO finance (id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, type, category, Number(amount), date, description);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE financial transaction
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM finance WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
