import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

// GET /api/equipment_requests?ticket_id=123
router.get('/', async (req, res) => {
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

export default router;