import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all staff members
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM staff').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a staff member
router.post('/', (req, res) => {
  try {
    const { 
      id, name, role, department, status,
      email, phone, joinDate, dob, workingDays, address, 
      monthlySalary, bankName, bankAccountNo, panNo, pfAccountNo, pfUan
    } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO staff (
        id, name, role, department, status,
        email, phone, joinDate, dob, workingDays, address,
        monthlySalary, bankName, bankAccountNo, panNo, pfAccountNo, pfUan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, name, role, department, status,
      email || null, phone || null, joinDate || null, dob || null, 
      workingDays !== undefined ? String(workingDays) : null, address || null, 
      monthlySalary !== undefined ? Number(monthlySalary) : null, 
      bankName || null, bankAccountNo || null, panNo || null, pfAccountNo || null, pfUan || null
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a staff member
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM staff WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE specific staff field (e.g., status)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const stmt = db.prepare('UPDATE staff SET status = ? WHERE id = ?');
    stmt.run(status, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
