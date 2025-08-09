import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const db = getDatabase();
  const { user_id, equipment_id, purchase_date, warranty_expiry } = req.body;
  try {
    // Fetch the name from equipment table
    const eqRes = await db.query('SELECT name FROM equipment WHERE id = $1', [equipment_id]);
    if (!eqRes.rows.length) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const equipmentName = eqRes.rows[0].name;

    // Insert with equipment name
    await db.query(
  `INSERT INTO user_equipments (user_id, equipment_id, name, purchase_date, warranty_expiry)
   VALUES ($1, $2, $3, $4, $5)`,
  [user_id, equipment_id, equipmentName, purchase_date, warranty_expiry]
);

    res.status(201).json({ message: 'Equipment added to user successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add equipment', details: err.message });
  }
});


// GET /api/equipment_requests?ticket_id=123
router.get('/all', async (req, res) => {
  const { ticket_id } = req.query;
  try {
    const db = getDatabase();
    let query = 'SELECT * FROM equipment_requests';
    let params = [];
    if (ticket_id) {
      query += ' WHERE ticket_id = $1';
      params.push(ticket_id);
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching equipment requests:', error);
    res.status(500).json({ error: 'Failed to fetch equipment requests' });
  }
});
// DELETE /api/user_equipments/:id
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const id = req.params.id;
    // Optional: Only allow delete if the assignment exists
    const check = await db.query('SELECT * FROM user_equipments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    await db.query('DELETE FROM user_equipments WHERE id = $1', [id]);
    res.json({ message: 'Product removed from customer' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete equipment', details: err.message });
  }
});


export default router;