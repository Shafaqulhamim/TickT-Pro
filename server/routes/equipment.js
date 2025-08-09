import express from 'express';
import { getDatabase } from '../database/pg.js';
const router = express.Router();

// GET /api/equipment - Get all equipment
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT id, name, model, serial_number, specifications, status FROM equipment'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// POST /api/equipment - Create new equipment
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      model,
      serial_number,
      installation_date,
      warranty_expiry,
      status,
      specifications,
    } = req.body;
    const db = getDatabase();
    const result = await db.query(
      `INSERT INTO equipment
        (name, model, serial_number, installation_date, warranty_expiry, status, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, model, serial_number, installation_date || null, warranty_expiry || null, status, specifications]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create equipment', details: err.message });
  }
});

// PUT /api/equipment/:id - Update equipment
router.put('/:id', async (req, res) => {
  try {
    // TODO: Implement equipment update logic
    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});


// DELETE /api/equipment/:id - Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const result = await db.query('DELETE FROM equipment WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});


// GET /api/equipment/:id - Get equipment by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDatabase();
    const equipment = await db.query('SELECT * FROM equipment WHERE id = $1', [id]);
    if (equipment.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(equipment.rows[0]);
  } catch (error) {
    console.error('Error fetching equipment by ID:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

export default router;