import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export function getDatabase() {
  if (!db) {
    db = new Database(join(__dirname, 'hvac.db'));
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDatabase();
  
  // Create tables
  const createTables = `
    -- Users table with role-based structure
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'engineer', 'customer')),
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Equipment table
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      installation_date DATE,
      warranty_expiry DATE,
      location_id INTEGER,
      customer_id INTEGER,
      specifications TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    -- Locations table
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      customer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    -- Tickets table
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'rejected', 'in_progress', 'equipment_requested', 'equipment_purchased', 'completed', 'verified', 'resolved')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      customer_id INTEGER NOT NULL,
      engineer_id INTEGER,
      manager_id INTEGER,
      equipment_id INTEGER,
      location_id INTEGER,
      manager_notes TEXT,
      engineer_notes TEXT,
      rejection_reason TEXT,
      completion_notes TEXT,
      customer_verified BOOLEAN DEFAULT FALSE,
      manager_verified BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (engineer_id) REFERENCES users(id),
      FOREIGN KEY (manager_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    -- Ticket history for audit trail
    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Equipment requests
    CREATE TABLE IF NOT EXISTS equipment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      engineer_id INTEGER NOT NULL,
      equipment_list TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'purchased')),
      manager_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (engineer_id) REFERENCES users(id)
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
      read BOOLEAN DEFAULT FALSE,
      related_ticket_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (related_ticket_id) REFERENCES tickets(id)
    );

    -- Indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_engineer_id ON tickets(engineer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_customer_id ON equipment(customer_id);
  `;

  database.exec(createTables);
  
  // Insert initial data
  insertInitialData(database);
  
  console.log('✅ Database initialized successfully');
}

function insertInitialData(database) {
  // Check if users already exist
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    console.log('🔄 Inserting initial data...');
    
    // Create default users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const insertUser = database.prepare(`
      INSERT INTO users (email, password, name, role, phone, address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Admin user
    insertUser.run('admin@hvac.com', hashedPassword, 'System Administrator', 'admin', '+1-555-0001', '123 Admin St');
    
    // Manager user
    insertUser.run('manager@hvac.com', hashedPassword, 'John Manager', 'manager', '+1-555-0002', '456 Manager Ave');
    
    // Engineer users
    insertUser.run('engineer1@hvac.com', hashedPassword, 'Mike Engineer', 'engineer', '+1-555-0003', '789 Engineer Dr');
    insertUser.run('engineer2@hvac.com', hashedPassword, 'Sarah Tech', 'engineer', '+1-555-0004', '321 Tech Blvd');
    
    // Customer users
    insertUser.run('customer1@hvac.com', hashedPassword, 'ABC Corporation', 'customer', '+1-555-0005', '100 Business Plaza');
    insertUser.run('customer2@hvac.com', hashedPassword, 'XYZ Industries', 'customer', '+1-555-0006', '200 Industrial Park');

    // Create locations
    const insertLocation = database.prepare(`
      INSERT INTO locations (name, address, customer_id) 
      VALUES (?, ?, ?)
    `);

    insertLocation.run('Main Office Building', '100 Business Plaza, Suite 101', 5);
    insertLocation.run('Warehouse Facility', '100 Business Plaza, Building B', 5);
    insertLocation.run('Manufacturing Plant', '200 Industrial Park, Zone A', 6);
    insertLocation.run('Office Complex', '200 Industrial Park, Building 1', 6);

    // Create equipment
    const insertEquipment = database.prepare(`
      INSERT INTO equipment (name, model, serial_number, installation_date, warranty_expiry, location_id, customer_id, specifications) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(currentDate.getFullYear() + 2);
    const pastDate = new Date();
    pastDate.setFullYear(currentDate.getFullYear() - 1);

    insertEquipment.run(
      'Central Air Conditioning Unit', 
      'CAC-2000X', 
      'CAC001', 
      '2023-01-15', 
      futureDate.toISOString().split('T')[0], 
      1, 5, 
      'Capacity: 5 Ton, Refrigerant: R-410A, Voltage: 240V'
    );
    
    insertEquipment.run(
      'Industrial Heater', 
      'IH-500', 
      'IH001', 
      '2022-06-10', 
      pastDate.toISOString().split('T')[0], 
      2, 5, 
      'BTU: 500,000, Fuel: Natural Gas, Efficiency: 95%'
    );
    
    insertEquipment.run(
      'Rooftop HVAC Unit', 
      'RTU-350', 
      'RTU001', 
      '2023-03-20', 
      futureDate.toISOString().split('T')[0], 
      3, 6, 
      'Capacity: 35 Ton, Type: Package Unit, Controls: DDC'
    );

    console.log('✅ Initial data inserted successfully');
  }
}