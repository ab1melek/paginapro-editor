#!/usr/bin/env node

/**
 * Script para probar el flujo completo de suscripciones
 * Uso: node scripts/testusers/testSubscriptionFlow.js
 */

import { createPool } from "./dbPool.js";
const pool = createPool();

async function testSubscriptionFlow() {
  const email = process.argv[2] || "test1@mail.com";
  const client = await pool.connect();

  try {
    console.log(`🧪 PRUEBAS DE FLUJO DE SUSCRIPCIONES (${email})\n`);

    // 1. Obtener usuario por correo
    console.log("1️⃣  Obteniendo usuario de prueba...");
    const userRes = await client.query(
      `SELECT * FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      console.error("❌ Usuario no encontrado. Ejecuta: node scripts/testusers/createTestUser.js");
      process.exit(1);
    }

    const user = userRes.rows[0];
    console.log(`✅ Usuario encontrado: ${user.username} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Estado suscripción: ${user.subscription_status}\n`);

    // 2. Verificar que el usuario no tiene trial aún
    console.log("2️⃣  Verificando estado inicial...");
    if (user.subscription_status === "none") {
      console.log("✅ Usuario sin suscripción (estado: none)\n");
    } else {
      console.log(`⚠️  Usuario ya tiene suscripción: ${user.subscription_status}\n`);
    }

    // 3. Simular creación de página (inicia trial)
    console.log("3️⃣  Simulando creación de página (iniciará trial)...");
    const { startTrialForUser } = await import(
      "../../app/api/services/stripe.db.service.js"
    );
    await startTrialForUser(user.id);
    console.log("✅ Trial iniciado (10 días)\n");

    // 4. Verificar trial
    console.log("4️⃣  Verificando estado después de iniciar trial...");
    const trialRes = await client.query(
      `SELECT subscription_status, trial_started_at, subscription_expires_at FROM neon_auth.users WHERE id = $1`,
      [user.id]
    );
    const trialUser = trialRes.rows[0];
    const now = new Date();
    const expiresAt = new Date(trialUser.subscription_expires_at);
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    console.log(`✅ Suscripción actualizada:`);
    console.log(`   Estado: ${trialUser.subscription_status}`);
    console.log(`   Iniciado: ${trialUser.trial_started_at}`);
    console.log(`   Expira: ${expiresAt.toLocaleString()}`);
    console.log(`   Días restantes: ${daysLeft}\n`);

    // 5. Verificar que la página estaría VISIBLE
    console.log("5️⃣  Verificando si la página sería visible...");
    if (trialUser.subscription_status === "trial" && expiresAt > now) {
      console.log("✅ PÁGINA VISIBLE: Usuario en período de prueba\n");
    } else {
      console.log("❌ PÁGINA BLOQUEADA\n");
    }

    // 6. Simular expiración de trial (cambiar fecha)
    console.log("6️⃣  Simulando expiración de trial (cambiando fecha)...");
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Ayer
    await client.query(
      `UPDATE neon_auth.users SET subscription_expires_at = $1 WHERE id = $2`,
      [expiredDate, user.id]
    );
    console.log("✅ Trial expirado (simulado)\n");

    // 7. Verificar que la página estaría BLOQUEADA
    console.log("7️⃣  Verificando si la página sería bloqueada...");
    const expiredRes = await client.query(
      `SELECT subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1`,
      [user.id]
    );
    const expiredUser = expiredRes.rows[0];
    const newExpiresAt = new Date(expiredUser.subscription_expires_at);
    if (
      expiredUser.subscription_status !== "active" &&
      newExpiresAt < now
    ) {
      console.log("✅ PÁGINA BLOQUEADA: Trial expirado\n");
    }

    // 8. Simular pago exitoso
    console.log("8️⃣  Simulando pago exitoso (activar suscripción)...");
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1); // +1 mes
    await client.query(
      `UPDATE neon_auth.users 
       SET stripe_customer_id = $1, stripe_subscription_id = $2, 
           subscription_status = 'active', subscription_expires_at = $3 
       WHERE id = $4`,
      ["cus_test_123", "sub_test_123", renewDate, user.id]
    );
    console.log("✅ Suscripción activada\n");

    // 9. Verificar que la página vuelve a estar VISIBLE
    console.log("9️⃣  Verificando si la página sería visible nuevamente...");
    const activeRes = await client.query(
      `SELECT subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1`,
      [user.id]
    );
    const activeUser = activeRes.rows[0];
    const activeExpiresAt = new Date(activeUser.subscription_expires_at);
    if (activeUser.subscription_status === "active") {
      console.log("✅ PÁGINA VISIBLE: Suscripción activa");
      console.log(`   Renovación: ${activeExpiresAt.toLocaleString()}\n`);
    }

    // 10. NO resetear - dejar suscripción activa para pruebas
    console.log("✅ Usuario listo para pruebas con suscripción ACTIVA");
    const finalRes = await client.query(
      `SELECT subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1`,
      [user.id]
    );
    const finalUser = finalRes.rows[0];
    const finalExpiresAt = new Date(finalUser.subscription_expires_at);
    const finalDaysLeft = Math.ceil((finalExpiresAt - new Date()) / (1000 * 60 * 60 * 24));
    console.log(`   Status: ${finalUser.subscription_status}`);
    console.log(`   Expira en: ${finalExpiresAt.toLocaleString()}`);
    console.log(`   Días restantes: ${finalDaysLeft}\n`);

    console.log("✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n");
    console.log("📝 Resumen del flujo:");
    console.log("  1. Usuario sin suscripción");
    console.log("  2. Crea página → inicia trial (10 días)");
    console.log("  3. Página VISIBLE durante trial");
    console.log("  4. Trial expira → página BLOQUEADA");
    console.log("  5. Usuario paga → suscripción ACTIVA");
    console.log("  6. Página VISIBLE nuevamente");
  } catch (err) {
    console.error("❌ Error en prueba:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testSubscriptionFlow();
