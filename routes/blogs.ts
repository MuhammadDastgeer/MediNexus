import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all blogs
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM blogs ORDER BY date DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a blog
router.post('/', (req, res) => {
  try {
    const { id, title, status, category, date, description } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO blogs (id, title, status, category, date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, status || 'Published', category, date || new Date().toISOString(), description || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a blog
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM blogs WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
