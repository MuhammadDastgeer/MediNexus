import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all purchases
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM purchases').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE a purchase
router.post('/', (req, res) => {
  try {
    const { id, supplierId, supplierName, purchaseDate, amount, paidAmount, pendingAmount, paymentStatus, dueDate, items, invoiceNo, remarks } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO purchases (id, supplierId, supplierName, purchaseDate, amount, paidAmount, pendingAmount, paymentStatus, dueDate, items, invoiceNo, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, supplierId, supplierName, purchaseDate, Number(amount), Number(paidAmount || 0), Number(pendingAmount || 0), paymentStatus || 'Pending', dueDate || purchaseDate, items || '[]', invoiceNo || '', remarks || '');
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a purchase
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
