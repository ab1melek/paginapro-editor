import 'dotenv/config';
import pg from 'pg';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

async function check() {
  const pool = new pg.Pool();
  try {
    console.log('Connecting to DB...');
    const res = await pool.query(
      `SELECT id, username, email, is_special, subscription_status, trial_started_at, subscription_expires_at FROM neon_auth.users WHERE username = $1`,
      ['test1']
    );
    
    if (res.rows[0]) {
      console.log('\n✅ User test1 Status:');
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('❌ User test1 not found');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

check();
