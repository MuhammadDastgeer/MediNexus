import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET settings
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settingsObj: Record<string, string> = {};
    rows.forEach((r) => {
      settingsObj[r.key] = r.value;
    });
    res.json(settingsObj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE settings
router.post('/', (req, res) => {
  try {
    const body = req.body;
    const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.keys(body).forEach((k) => {
      updateSetting.run(k, String(body[k]));
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
