import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database/pg.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createNotification } from '../utils/notifications.js';
import { addTicketHistory } from '../utils/ticketHistory.js';
import { addSystemComment } from '../utils/ticketlog.js';

const router = express.Router();

// Validation schemas
const createTicketSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  equipment_id: Joi.number().integer().required(),
  location_id: Joi.number().integer().required(),
  customer_id: Joi.number().integer().optional() // For manager creating tickets
});

// Get tickets based on user role
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    let query = '';
    let params = [];

    switch (req.user.role) {
      case 'customer':
        query = `
          SELECT t.*, 
                 e.name as equipment_name, e.model as equipment_model,
                 l.name as location_name, l.address as location_address,
                 eng.name as engineer_name, eng.phone as engineer_phone,
                 mgr.name as manager_name
          FROM tickets t
          LEFT JOIN equipment e ON t.equipment_id = e.id
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN users eng ON t.engineer_id = eng.id
          LEFT JOIN users mgr ON t.manager_id = mgr.id
          WHERE t.customer_id = ?
          ORDER BY t.created_at DESC
        `;
        params = [req.user.id];
        break;

      case 'engineer':
        query = `
          SELECT t.*, 
                 e.name as equipment_name, e.model as equipment_model,
                 l.name as location_name, l.address as location_address,
                 c.name as customer_name, c.phone as customer_phone,
                 mgr.name as manager_name
          FROM tickets t
          LEFT JOIN equipment e ON t.equipment_id = e.id
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN users c ON t.customer_id = c.id
          LEFT JOIN users mgr ON t.manager_id = mgr.id
          WHERE t.engineer_id = ? OR t.status = 'assigned'
          ORDER BY t.created_at DESC
        `;
        params = [req.user.id];
        break;

      case 'manager':
      case 'admin':
        query = `
          SELECT t.*, 
                 e.name as equipment_name, e.model as equipment_model,
                 l.name as location_name, l.address as location_address,
                 c.name as customer_name, c.phone as customer_phone,
                 eng.name as engineer_name, eng.phone as engineer_phone
          FROM tickets t
          LEFT JOIN equipment e ON t.equipment_id = e.id
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN users c ON t.customer_id = c.id
          LEFT JOIN users eng ON t.engineer_id = eng.id
          ORDER BY t.created_at DESC
        `;
        break;
    }

    const tickets = db.prepare(query).all(...params);
    
    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create new ticket
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      customer_id,
      engineer_id,
      equipment_id,
      location,
      deadline,
      progress,
    } = req.body;
    const db = getDatabase();
    const result = await db.query(
      `INSERT INTO tickets
        (title, description, customer_id, engineer_id, equipment_id, location, deadline, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description,
        customer_id ? Number(customer_id) : null,
        engineer_id ? Number(engineer_id) : null,
        equipment_id ? Number(equipment_id) : null,
        location,
        deadline || null,
        progress
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

// Assign ticket to engineer (manager only)
router.patch('/:id/assign', requireRole(['manager', 'admin']), (req, res) => {
  try {
    const { engineer_id, manager_notes } = req.body;
    
    if (!engineer_id) {
      return res.status(400).json({ error: 'engineer_id is required' });
    }

    const db = getDatabase();
    
    // Verify engineer exists and has correct role
    const engineer = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(engineer_id, 'engineer');
    if (!engineer) {
      return res.status(400).json({ error: 'Engineer not found' });
    }

    // Update ticket
    const updateTicket = db.prepare(`
      UPDATE tickets 
      SET engineer_id = ?, manager_id = ?, manager_notes = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateTicket.run(engineer_id, req.user.id, manager_notes || null, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Add to history
    addTicketHistory(
      req.params.id, 
      'assigned', 
      `Ticket assigned to ${engineer.name}`, 
      req.user.id, 
      req.user.name, 
      req.user.role
    );

    // Notify engineer
    createNotification(
      engineer_id,
      'New Ticket Assignment',
      `You have been assigned a new ticket. Please review and accept/reject it.`,
      'info',
      req.params.id
    );

    res.json({ message: 'Ticket assigned successfully' });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

// Accept/Reject ticket (engineer only)
router.patch('/:id/respond', requireRole(['engineer']), (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or reject' });
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const db = getDatabase();
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? AND engineer_id = ?').get(req.params.id, req.user.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found or not assigned to you' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    const updateTicket = db.prepare(`
      UPDATE tickets 
      SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateTicket.run(newStatus, rejection_reason || null, req.params.id);

    // Add to history
    addTicketHistory(
      req.params.id, 
      action, 
      action === 'accept' ? 'Ticket accepted by engineer' : `Ticket rejected: ${rejection_reason}`, 
      req.user.id, 
      req.user.name, 
      req.user.role
    );

    // Notify customer and manager
    const notifications = [];
    if (ticket.customer_id) {
      notifications.push({
        user_id: ticket.customer_id,
        title: `Ticket ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: action === 'accept' 
          ? `Your ticket has been accepted by ${req.user.name}` 
          : `Your ticket has been rejected. Reason: ${rejection_reason}`,
        type: action === 'accept' ? 'success' : 'warning'
      });
    }

    if (ticket.manager_id) {
      notifications.push({
        user_id: ticket.manager_id,
        title: `Ticket ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: `Engineer ${req.user.name} has ${action}ed the ticket${action === 'reject' ? ': ' + rejection_reason : ''}`,
        type: action === 'accept' ? 'success' : 'warning'
      });
    }

    notifications.forEach(notif => {
      createNotification(notif.user_id, notif.title, notif.message, notif.type, req.params.id);
    });

    res.json({ message: `Ticket ${action}ed successfully` });
  } catch (error) {
    console.error('Respond to ticket error:', error);
    res.status(500).json({ error: 'Failed to respond to ticket' });
  }
});

// Get ticket history
router.get('/:id/history', (req, res) => {
  try {
    const db = getDatabase();
    
    // Verify user has access to this ticket
    let hasAccess = false;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    switch (req.user.role) {
      case 'customer':
        hasAccess = ticket.customer_id === req.user.id;
        break;
      case 'engineer':
        hasAccess = ticket.engineer_id === req.user.id;
        break;
      case 'manager':
      case 'admin':
        hasAccess = true;
        break;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const history = db.prepare(`
      SELECT * FROM ticket_history 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({ history });
  } catch (error) {
    console.error('Get ticket history error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket history' });
  }
});

// Get active tickets (for dashboard)
router.get('/active', async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      `SELECT t.*, 
              c.name AS customer, 
              e.name AS engineer, 
              eq.name AS equipment
         FROM tickets t
         LEFT JOIN users c ON t.customer_id = c.id
         LEFT JOIN users e ON t.engineer_id = e.id
         LEFT JOIN equipment eq ON t.equipment_id = eq.id
        ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
  }
});

// Get tickets assigned to the logged-in engineer
router.get('/engineer', authenticateToken, async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: user not found' });
  }
  try {
    const db = getDatabase();
    const engineerId = req.user.id;

    const result = await db.query(
      `SELECT t.*, 
              c.name AS customer, 
              e.name AS engineer, 
              eq.name AS equipment,
              t.location AS location,
              t.created_at AS date
         FROM tickets t
         LEFT JOIN users c ON t.customer_id = c.id
         LEFT JOIN users e ON t.engineer_id = e.id
         LEFT JOIN equipment eq ON t.equipment_id = eq.id
         LEFT JOIN locations l ON t.location = l.name
        WHERE t.engineer_id = $1
        ORDER BY t.created_at DESC`,
      [engineerId]
    );
    res.json({ tickets: Array.isArray(result.rows) ? result.rows : [] }); // Always send an array
  } catch (err) {
    console.error('Engineer tickets fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
  }
});

// POST /api/tickets/:id/equipment-request
router.post('/:id/equipment-request', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const ticketId = req.params.id;
    const requestedBy = req.user.id;
    const { equipment_details } = req.body;

    if (!equipment_details) {
      return res.status(400).json({ error: 'Equipment details are required' });
    }

    const result = await db.query(
      `INSERT INTO equipment_requests (ticket_id, requested_by, equipment_details, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [ticketId, requestedBy, equipment_details]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Equipment request error:', err);
    res.status(500).json({ error: 'Failed to create equipment request', details: err.message });
  }
});

// Update ticket (engineer assignment and progress)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { engineer_id, progress, deadline, status } = req.body;

    // Only update if at least one field is provided
    if (!engineer_id && !progress && !deadline && !status) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    // Build dynamic query
    let query = 'UPDATE tickets SET ';
    const updates = [];
    const params = [];

    if (engineer_id) {
      updates.push(`engineer_id = $${params.length + 1}`);
      params.push(engineer_id);
    }
    if (progress) {
      updates.push(`progress = $${params.length + 1}`);
      params.push(progress);
    }
    if (deadline) {
      updates.push(`deadline = $${params.length + 1}`);
      params.push(deadline);
    }
    if (status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    query += updates.join(', ');
    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // --- ADD SYSTEM COMMENTS/LOGS ---
    // Always await comments after DB update, before sending response
    if (deadline) {
      await addSystemComment(req.params.id, req.user.id, `Deadline updated to ${deadline}`);
    }
    if (engineer_id) {
      let engineerName = '';
      // Optionally, lookup the engineer's name
      if (engineer_id) {
        const engRes = await db.query('SELECT name FROM users WHERE id = $1', [engineer_id]);
        engineerName = engRes.rows[0]?.name || engineer_id;
      }
      await addSystemComment(req.params.id, req.user.id, `Engineer assigned: ${engineerName}`);
    }
    if (status) {
      await addSystemComment(req.params.id, req.user.id, `Status updated to "${status}"`);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update ticket error:', err);
    res.status(500).json({ error: 'Failed to update ticket', details: err.message });
  }
});



// Update ticket status (all roles)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const ticketId = req.params.id;
    const { status, progress } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    // Build dynamic query for status and progress
    let query = 'UPDATE tickets SET status = $1';
    let params = [status];

    if (progress) {
      query += ', progress = $2';
      params.push(progress);
      query += ', updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
      params.push(ticketId);
    } else {
      query += ', updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      params.push(ticketId);
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket status', details: err.message });
  }
});

// GET /api/tickets/customer
router.get('/customer', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const customerId = req.user.id;

    const result = await db.query(
      `SELECT t.id, t.title, t.description, t.status, t.created_at,
              e.name AS equipment_name, e.model AS equipment_model,
              t.location AS location_name,
              eng.name AS engineer_name, eng.phone AS engineer_phone
         FROM tickets t
         LEFT JOIN equipment e ON t.equipment_id = e.id
         LEFT JOIN users eng ON t.engineer_id = eng.id
        WHERE t.customer_id = $1
        ORDER BY t.created_at DESC`,
      [customerId]
    );

    res.json({ tickets: Array.isArray(result.rows) ? result.rows : [] });
  } catch (err) {
    console.error('Customer tickets fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer tickets', details: err.message });
  }
});

export default router;