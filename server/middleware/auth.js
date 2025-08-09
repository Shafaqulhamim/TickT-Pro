import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/pg.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const db = getDatabase();
    db.query('SELECT * FROM users WHERE id = $1', [user.id])
      .then(result => {
        const userData = result.rows[0];
        if (!userData) {
          return res.status(403).json({ error: 'User not found' });
        }
        req.user = userData;
        next();
      })
      .catch(err => {
        return res.status(500).json({ error: 'Database error', details: err.message });
      });
  });
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}