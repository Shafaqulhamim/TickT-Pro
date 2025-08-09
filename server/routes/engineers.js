import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    // Select users where role is 'engineer' and include specialization
    const engineersResult = await db.query(
      'SELECT id, name, email, specialization FROM users WHERE role = $1',
      ['engineer']
    );
    if (engineersResult.rows.length === 0) {
      return res.status(404).json({ error: 'No engineers found' });
    }
    const engineers = engineersResult.rows;

    // (Optional: fetch related data for each engineer)

    res.json(engineers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch engineers', details: err.message });
  }
});

export default router;