import bcrypt from 'bcrypt';
import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, email, phone, address, role, password } = req.body;
    if (!name || !email || !phone || !address || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const db = getDatabase();
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, phone, address, role, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, address, role`,
      [name, email, phone, address, role || 'customer', hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user error:", err); // <-- Add this for easier debugging!
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
});


// Example for Express + PostgreSQL
router.get('/', async (req, res) => {
  const db = await getDatabase();
  const { role } = req.query;
  let result;

  // If engineer, include specialization
  if (role === 'engineer') {
    result = await db.query(
      'SELECT id, name, email, specialization FROM users WHERE role = $1',
      [role]
    );
  } else {
    // For customer, etc.
    result = await db.query(
      'SELECT id, name, address as location FROM users WHERE role = $1',
      [role || 'customer']
    );
  }
  res.json(result.rows);
});
// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const id = req.params.id;
    await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'engineer']);
    res.json({ message: 'Engineer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete engineer', details: err.message });
  }
});


// Example Express route
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const db = getDatabase();
  try {
    // Fetch customer basic info
    const customerResult = await db.query(
      'SELECT id, name, location, email FROM users WHERE id = $1 AND role = $2',
      [id, 'customer']
    );
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = customerResult.rows[0];

    // Fetch products (equipments) for this customer
    const productsResult = await db.query(
      'SELECT id, name, warranty_expiry FROM equipment WHERE customer_id = $1',
      [id]
    );
    customer.products = productsResult.rows;

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
});

export default router;