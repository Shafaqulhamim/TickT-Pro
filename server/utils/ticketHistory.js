import { getDatabase } from '../database/pg.js';

export function addTicketHistory(ticketId, action, description, userId, userName, userRole) {
  try {
    const db = getDatabase();
    
    const insertHistory = db.prepare(`
      INSERT INTO ticket_history (ticket_id, action, description, user_id, user_name, user_role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertHistory.run(ticketId, action, description, userId, userName, userRole);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error adding ticket history:', error);
    return null;
  }
}

export function getTicketHistory(ticketId) {
  try {
    const db = getDatabase();
    
    const history = db.prepare(`
      SELECT * FROM ticket_history 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `).all(ticketId);

    return history;
  } catch (error) {
    console.error('Error getting ticket history:', error);
    return [];
  }
}