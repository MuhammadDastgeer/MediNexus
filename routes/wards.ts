import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all wards
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM wards').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE ward status and capacity
router.post('/', (req, res) => {
  try {
    const { id, name, type, bedsTotal, bedsOccupied, bedsAvailable, bedsMaintenance, roomsData } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO wards (id, name, type, bedsTotal, bedsOccupied, bedsAvailable, bedsMaintenance, roomsData) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, type, Number(bedsTotal), Number(bedsOccupied), Number(bedsAvailable), Number(bedsMaintenance), roomsData || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ward record
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM wards WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
