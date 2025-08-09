import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/pg.js';
import { generateToken } from '../middleware/auth.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('customer', 'engineer', 'manager', 'admin').required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional()
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDatabase();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  // Generate JWT
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Register (admin/manager only)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name, role, phone, address } = value;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    const insertResult = await db.query(
      `INSERT INTO users (email, password, name, role, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, hashedPassword, name, role, phone || null, address || null]
    );

    const newUser = insertResult.rows[0];
    delete newUser.password;

    res.status(201).json({
      user: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete user.password;
    res.json({ user });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

export default router;