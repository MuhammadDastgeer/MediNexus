import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all signup-patients (unregistered clinical patients)
router.get('/signup-patients', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM ai_users 
      WHERE id NOT IN (SELECT id FROM patients) 
      ORDER BY registeredAt DESC
    `).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a signup-patient
router.delete('/signup-patients/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM ai_users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a signup-patient
router.put('/signup-patients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, phone, dob, bloodGroup, address, email, password } = req.body;
    db.prepare(`
      UPDATE ai_users 
      SET name = ?, age = ?, gender = ?, phone = ?, dob = ?, bloodGroup = ?, address = ?, email = ?, password = ?
      WHERE id = ?
    `).run(
      name, Number(age || 0), gender, phone, dob || null, bloodGroup || null, address || null, email || null, password || null, id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PROMOTE/ADD a signup-patient to the patients table
router.post('/signup-patients/promote/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM ai_users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'Signup user not found' });
    }
    
    db.prepare(`
      INSERT OR REPLACE INTO patients (
        id, name, age, gender, phone, registeredAt, status, 
        wardId, roomId, bedNumber, dob, bloodGroup, address, email, password, treatmentStatus,
        hospitalId, hospitalName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      Number(user.age || 0),
      user.gender || 'Male',
      user.phone,
      user.registeredAt || new Date().toISOString(),
      'New', // Default status
      null, null, null,
      user.dob || null,
      user.bloodGroup || null,
      user.address || null,
      user.email,
      user.password,
      'Active', // Default treatmentStatus
      user.hospitalId || null,
      user.hospitalName || null
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BULK PROMOTE signup-patients to the patients table
router.post('/signup-patients/bulk-promote', (req, res) => {
  try {
    const { ids } = req.body;
    let users: any[] = [];
    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      users = db.prepare(`SELECT * FROM ai_users WHERE id IN (${placeholders})`).all(...ids);
    } else {
      users = db.prepare(`
        SELECT * FROM ai_users 
        WHERE id NOT IN (SELECT id FROM patients)
      `).all();
    }

    if (users.length === 0) {
      return res.json({ success: true, count: 0, message: 'No signup patients to promote.' });
    }

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO patients (
        id, name, age, gender, phone, registeredAt, status, 
        wardId, roomId, bedNumber, dob, bloodGroup, address, email, password, treatmentStatus,
        hospitalId, hospitalName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((usersList) => {
      for (const user of usersList) {
        insertStmt.run(
          user.id,
          user.name,
          Number(user.age || 0),
          user.gender || 'Male',
          user.phone,
          user.registeredAt || new Date().toISOString(),
          'New',
          null, null, null,
          user.dob || null,
          user.bloodGroup || null,
          user.address || null,
          user.email,
          user.password,
          'Active',
          user.hospitalId || null,
          user.hospitalName || null
        );
      }
    });

    transaction(users);

    res.json({ success: true, count: users.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all patients
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM patients ORDER BY registeredAt DESC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a patient
router.post('/', (req, res) => {
  try {
    const { 
      id, name, age, gender, phone, registeredAt, status, 
      wardId, roomId, bedNumber, dob, bloodGroup, address, email, password,
      treatmentStatus, hospitalId, hospitalName
    } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO patients (
        id, name, age, gender, phone, registeredAt, status, 
        wardId, roomId, bedNumber, dob, bloodGroup, address, email, password,
        treatmentStatus, hospitalId, hospitalName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, name, Number(age || 0), gender, phone, registeredAt, status, 
      wardId || null, roomId || null, bedNumber || null,
      dob || null, bloodGroup || null, address || null, email || null, password || null,
      treatmentStatus || 'Active',
      hospitalId || null,
      hospitalName || null
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a patient
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
