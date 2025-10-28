import { createPool } from "./dbPool.js";

const email = process.argv[2] || "test5@mail.com";

async function expireWithoutCancelingSubscription() {
  const pool = createPool();

  try {
    console.log(`🕐 Adelantando tiempo para ${email}...`);
    console.log(`   Status: 'active' (sin cancelar)`);
    console.log(`   expires_at: ahora - 1 hora (suscripción expirada naturalmente)`);

    // Obtener usuario
    const userResult = await pool.query(
      `SELECT id, email, subscription_status, subscription_expires_at FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ Usuario ${email} no encontrado`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`\n📋 Usuario actual:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Expires: ${user.subscription_expires_at}`);

    // Adelantar el tiempo: expires_at = ahora - 1 hora
    const pastDate = new Date(Date.now() - 3600000); // 1 hora atrás

    await pool.query(
      `UPDATE neon_auth.users SET subscription_expires_at = $1 WHERE email = $2`,
      [pastDate, email]
    );

    // Verificar cambios
    const updatedResult = await pool.query(
      `SELECT id, email, subscription_status, subscription_expires_at FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    const updated = updatedResult.rows[0];
    console.log(`\n✅ Usuario actualizado:`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Status: ${updated.subscription_status} (MANTIENE 'active')`);
    console.log(`   Expires: ${updated.subscription_expires_at}`);

    console.log(`\n⏰ Ahora puedes:`);
    console.log(`   1. Abrir dashboard y ver si muestra que la suscripción expiró`);
    console.log(`   2. Intentar acceder a una página y ver si está bloqueada`);
    console.log(`   3. Revisar si Stripe envía webhooks`);

    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    pool.end();
    process.exit(1);
  }
}

expireWithoutCancelingSubscription();
