import { query } from '../pool.js';

export async function migrate() {
  // Eliminar únicamente las columnas relacionadas con Mercado Pago en neon_auth.users
  await query(`
    ALTER TABLE IF EXISTS neon_auth.users
      DROP COLUMN IF EXISTS mp_subscription_id,
      DROP COLUMN IF EXISTS mp_customer_id;
  `);
  console.log('Migration drop_mp_columns_from_users applied');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
  });
}
