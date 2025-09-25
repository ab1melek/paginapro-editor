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

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('db query', { text, duration, rows: res.rowCount });
  }
  return res;
}
