import pg from "pg";
import appConfig from "../../app/config.js";

const { Pool } = pg;

// Crear pool local para migración
const poolConfig = appConfig?.db?.databaseUrl
  ? { connectionString: appConfig.db.databaseUrl }
  : {
      host: appConfig.db.host,
      port: Number(appConfig.db.port),
      user: appConfig.db.user,
      password: appConfig.db.password,
      database: appConfig.db.name,
    };

const pool = new Pool(poolConfig);

export async function up() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Agregar columnas de suscripción a la tabla users
    await client.query(`
      ALTER TABLE neon_auth.users
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
      ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
    `);

    // Crear índice para consultas rápidas de estado de suscripción
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_status
      ON neon_auth.users(subscription_status);
    `);

    // Crear índice para consultas de expiración
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_expires
      ON neon_auth.users(subscription_expires_at);
    `);

    // Crear índice para stripe_customer_id
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
      ON neon_auth.users(stripe_customer_id);
    `);

    await client.query("COMMIT");
    console.log("✅ Migración: columnas de suscripción agregadas exitosamente");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error en migración:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function down() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Eliminar índices
    await client.query(`DROP INDEX IF NOT EXISTS idx_users_stripe_customer_id;`);
    await client.query(`DROP INDEX IF NOT EXISTS idx_users_subscription_expires;`);
    await client.query(`DROP INDEX IF NOT EXISTS idx_users_subscription_status;`);

    // Eliminar columnas
    await client.query(`
      ALTER TABLE neon_auth.users
      DROP COLUMN IF EXISTS subscription_expires_at,
      DROP COLUMN IF EXISTS trial_started_at,
      DROP COLUMN IF EXISTS subscription_status,
      DROP COLUMN IF EXISTS stripe_subscription_id,
      DROP COLUMN IF EXISTS stripe_customer_id;
    `);

    await client.query("COMMIT");
    console.log("✅ Rollback: columnas de suscripción eliminadas");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error en rollback:", err);
    throw err;
  } finally {
    client.release();
  }
}
