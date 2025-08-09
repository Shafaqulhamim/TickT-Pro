import bcrypt from 'bcryptjs';
import { getDatabase } from './pg.js';

async function initializeDatabase() {
  const db = getDatabase();

  // 1. Create tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'engineer', 'customer')),
      phone TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      customer_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      installation_date DATE,
      warranty_expiry DATE,
      location_id INTEGER REFERENCES locations(id),
      customer_id INTEGER REFERENCES users(id),
      specifications TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
      location TEXT,
      deadline DATE,
      progress TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending', 'in_progress')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_equipments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
      purchase_date DATE,
      warranty_expiry DATE,
      UNIQUE(user_id, equipment_id)
   );
   CREATE TABLE IF NOT EXISTS equipment_requests (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
      requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      equipment_details TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Insert initial data if users table is empty
  const { rows } = await db.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count, 10) === 0) {
    console.log('🔄 Inserting initial data...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert users
    const userInserts = [
      ['admin@hvac.com', hashedPassword, 'System Administrator', 'admin', '+1-555-0001', '123 Admin St'],
      ['manager@hvac.com', hashedPassword, 'John Manager', 'manager', '+1-555-0002', '456 Manager Ave'],
      ['engineer1@hvac.com', hashedPassword, 'Mike Engineer', 'engineer', '+1-555-0003', '789 Engineer Dr'],
      ['engineer2@hvac.com', hashedPassword, 'Sarah Tech', 'engineer', '+1-555-0004', '321 Tech Blvd'],
      ['customer1@hvac.com', hashedPassword, 'ABC Corporation', 'customer', '+1-555-0005', '100 Business Plaza'],
      ['customer2@hvac.com', hashedPassword, 'XYZ Industries', 'customer', '+1-555-0006', '200 Industrial Park'],
    ];

    const userIds = [];
    for (const user of userInserts) {
      const result = await db.query(
        `INSERT INTO users (email, password, name, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        user
      );
      userIds.push(result.rows[0].id);
    }

    // Insert locations (using the correct customer IDs)
    const locationInserts = [
      ['Main Office Building', '100 Business Plaza, Suite 101', userIds[4]],
      ['Warehouse Facility', '100 Business Plaza, Building B', userIds[4]],
      ['Manufacturing Plant', '200 Industrial Park, Zone A', userIds[5]],
      ['Office Complex', '200 Industrial Park, Building 1', userIds[5]],
    ];
    const locationIds = [];
    for (const loc of locationInserts) {
      const result = await db.query(
        `INSERT INTO locations (name, address, customer_id)
         VALUES ($1, $2, $3) RETURNING id`,
        loc
      );
      locationIds.push(result.rows[0].id);
    }

    // Insert equipment
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(currentDate.getFullYear() + 2);

    await db.query(
      `INSERT INTO equipment (name, model, serial_number, installation_date, warranty_expiry, location_id, customer_id, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Central Air Conditioning Unit',
        'CAC-2000X',
        'CAC001',
        '2023-01-15',
        futureDate.toISOString().split('T')[0],
        locationIds[0],
        userIds[4],
        'Capacity: 5 Ton, Refrigerant: R-410A, Voltage: 240V'
      ]
    );
  }

  console.log('✅ PostgreSQL database initialized successfully');
}

initializeDatabase().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error initializing database:', err);
  process.exit(1);
});