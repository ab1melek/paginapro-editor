import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST_APP,
    port: parseInt(process.env.DB_PORT_APP || '5432'),
    database: process.env.DB_NAME_APP,
    user: process.env.DB_USER_APP,
    password: process.env.DB_PASSWORD_APP,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });
}
