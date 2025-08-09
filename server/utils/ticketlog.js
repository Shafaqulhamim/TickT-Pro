// utils/ticketLog.js
import { getDatabase } from '../database/pg.js';

// Accepts ticketId, userId (may be null for system), content
export async function addSystemComment(ticketId, userId, content) {
  const db = getDatabase();
  await db.query(
    `INSERT INTO comments (ticket_id, user_id, content) VALUES ($1, $2, $3)`,
    [ticketId, userId, content]
  );
}
