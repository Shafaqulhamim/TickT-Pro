import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hvac',
  password: 'your_pg_password',
  port: 5432,
});

export const getDatabase = () => pool;