import { getDatabase } from '../database/pg.js';
import { io } from '../index.js';

export function createNotification(userId, title, message, type = 'info', relatedTicketId = null) {
  try {
    const db = getDatabase();
    
    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_ticket_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertNotification.run(userId, title, message, type, relatedTicketId);
    
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
    
    // Emit real-time notification
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export function markNotificationAsRead(notificationId, userId) {
  try {
    const db = getDatabase();
    
    const updateNotification = db.prepare(`
      UPDATE notifications 
      SET read = TRUE 
      WHERE id = ? AND user_id = ?
    `);

    const result = updateNotification.run(notificationId, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export function getUserNotifications(userId, limit = 50) {
  try {
    const db = getDatabase();
    
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit);

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}