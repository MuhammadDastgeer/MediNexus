import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET admin dashboard stats
router.get('/', (req, res) => {
  try {
    const patients = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    const doctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
    const staff = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
    const appointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    
    // Financial calculations
    const bills = db.prepare('SELECT SUM(amount) as total, SUM(collectedAmount) as collected, SUM(pendingAmount) as pending FROM bills').get() as { total: number; collected: number; pending: number };
    
    // Status counts
    const activeDoctors = db.prepare("SELECT COUNT(*) as count FROM doctors WHERE status = 'On Duty'").get() as { count: number };
    const confirmedAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Confirmed'").get() as { count: number };

    res.json({
      patients: patients.count,
      doctors: doctors.count,
      staff: staff.count,
      appointments: appointments.count,
      activeDoctors: activeDoctors.count,
      confirmedAppointments: confirmedAppointments.count,
      finance: {
        totalBilled: bills.total || 0,
        totalCollected: bills.collected || 0,
        totalPending: bills.pending || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
