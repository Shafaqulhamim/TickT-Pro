import express from 'express';
import { getDatabase } from '../database/pg.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  try {
    const customerResult = await db.query(
      'SELECT id, name, address, email FROM users WHERE id = $1 AND role = $2',
      [id, 'customer']
    );
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = customerResult.rows[0];

    // Fetch products from user_equipments joined with equipment
    // New version (JOIN user_equipments with equipment for product list)
const productsResult = await db.query(
  `SELECT ue.id, e.name, ue.warranty_expiry
   FROM user_equipments ue
   JOIN equipment e ON ue.equipment_id = e.id
   WHERE ue.user_id = $1`,
  [id]
);
customer.products = productsResult.rows;


    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
});

export default router;