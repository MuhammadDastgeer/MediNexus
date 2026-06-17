import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all departments
router.get('/', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM departments').all();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE department
router.post('/', (req, res) => {
  try {
    const { id, name, code, description, type, location, status } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO departments (id, name, code, description, type, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, code, description, type, location, status);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE department
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    db.prepare('DELETE FROM sub_departments WHERE departmentId = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
