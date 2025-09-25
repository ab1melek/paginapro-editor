import { pool, query } from './pool.js';

async function main() {
  try {
    const r = await query('SELECT 1 as ok');
    console.log('DB OK:', r.rows[0]);
  } catch (e) {
    console.error('DB ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
