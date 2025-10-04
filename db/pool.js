import 'dotenv/config';
import pg from 'pg';
import appConfig from '../app/config.js';

const { Pool } = pg;

const base = {
  max: 10,
  idleTimeoutMillis: 30000,
};

const poolConfig = appConfig?.db?.databaseUrl
  ? { connectionString: appConfig.db.databaseUrl, ...base }
  : {
      host: appConfig.db.host,
      port: Number(appConfig.db.port),
      user: appConfig.db.user,
      password: appConfig.db.password,
      database: appConfig.db.name,
      ...base,
    };

export const pool = new Pool(poolConfig);

// Ensure each pooled client sets the desired search_path for the session.
// Use DB_SCHEMA env var if provided, otherwise default to 'editor'.
const schema = process.env.DB_SCHEMA || 'editor';
if (schema) {
  pool.on('connect', async (client) => {
    try {
      await client.query(`SET search_path TO "${schema}";`);
    } catch (err) {
      // Log and continue; some hosts may reject SET depending on permissions.
      console.error('Failed to set search_path on new client:', err.message || err);
    }
  });
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('db query', { text, duration, rows: res.rowCount });
  }
  return res;
}
