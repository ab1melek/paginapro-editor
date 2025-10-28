#!/usr/bin/env node

/**
 * Script para resetear usuario de prueba a estado inicial
 * Uso: node scripts/testusers/resetTestUser.js [email]
 */

import 'dotenv/config';
import { createPool } from './dbPool.js';

const pool = createPool();

async function resetTestUser() {
  const email = process.argv[2] || "test1@mail.com";

  try {
    console.log(`🔄 Reseteando usuario: ${email}\n`);

    const res = await pool.query(
      `UPDATE neon_auth.users 
       SET subscription_status = 'none', 
           trial_started_at = NULL, 
           subscription_expires_at = NULL,
           stripe_customer_id = NULL,
           stripe_subscription_id = NULL
       WHERE email = $1
       RETURNING id, username, email, subscription_status`,
      [email]
    );

    if (res.rows.length === 0) {
      console.error(`❌ Usuario no encontrado: ${email}`);
      process.exit(1);
    }

    const user = res.rows[0];
    console.log("✅ Usuario reseteado:");
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Estado: ${user.subscription_status}`);
    console.log("\n🔗 Ahora puedes:"); 
    console.log("   1. Ejecutar: node scripts/testusers/testSubscriptionFlow.js");
    console.log("   2. O acceder a: http://localhost:3000/login");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetTestUser();
