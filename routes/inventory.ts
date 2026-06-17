import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all inventory items
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventory').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE an inventory item
router.post('/', (req, res) => {
  try {
    const { 
      id, name, category, stock, minStock, price, unit, hsnCode, mrp, gst, status,
      genericName, brandName, subCategory, preferredSupplier, purchasePrice, sellingPrice, barcode, description
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO inventory (
        id, name, category, stock, minStock, price, unit, hsnCode, mrp, gst, status,
        genericName, brandName, subCategory, preferredSupplier, purchasePrice, sellingPrice, barcode, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, name, category, Number(stock || 0), Number(minStock || 0), Number(price || 0), unit || 'pcs', hsnCode || '', Number(mrp || price || 0), Number(gst || 0), status || 'Active',
      genericName || '', brandName || '', subCategory || '', preferredSupplier || '', Number(purchasePrice || price || 0), Number(sellingPrice || price || 0), barcode || '', description || ''
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH / UPDATE inventory fields
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    if (body.stock !== undefined && body.name === undefined) {
      // Light update for quick restock
      const stmt = db.prepare('UPDATE inventory SET stock = ? WHERE id = ?');
      stmt.run(Number(body.stock), id);
    } else {
      // Complete edit
      const fields = [
        'name', 'category', 'stock', 'minStock', 'price', 'unit', 'hsnCode', 'mrp', 'gst', 'status',
        'genericName', 'brandName', 'subCategory', 'preferredSupplier', 'purchasePrice', 'sellingPrice', 'barcode', 'description'
      ];
      
      const updates: string[] = [];
      const values: any[] = [];
      
      fields.forEach((f) => {
        if (body[f] !== undefined) {
          updates.push(`${f} = ?`);
          if (['stock', 'minStock', 'price', 'mrp', 'gst', 'purchasePrice', 'sellingPrice'].includes(f)) {
            values.push(Number(body[f]));
          } else {
            values.push(body[f]);
          }
        }
      });
      
      if (updates.length > 0) {
        values.push(id);
        const stmt = db.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an inventory item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
