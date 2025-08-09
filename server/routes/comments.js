import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

// Add a comment to a ticket
router.post('/:ticketId', async (req, res) => {
  const db = getDatabase();
  const { ticketId } = req.params;
  const { userId, content } = req.body;

  if (!content || !userId) {
    return res.status(400).json({ error: 'Missing content or userId' });
  }

  try {
    const result = await db.query(
      `INSERT INTO comments (ticket_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [ticketId, userId, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get all comments for a ticket
router.get('/:ticketId', async (req, res) => {
  const db = getDatabase();
  const { ticketId } = req.params;

  try {
    const result = await db.query(
      `SELECT c.*, u.name as user_name
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = $1
        ORDER BY c.created_at ASC`,
      [ticketId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;
