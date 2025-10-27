#!/usr/bin/env node

/**
 * Script para verificar el estado de suscripción de un usuario
 * Uso: node scripts/testusers/checkUserStatus.js [email]
 */

import 'dotenv/config';
import { createPool } from './dbPool.js';

const pool = createPool();

async function checkUserStatus() {
  const email = process.argv[2] || "test1@mail.com";

  try {
    console.log(`📊 Estado de usuario: ${email}\n`);

    const res = await pool.query(
      `SELECT 
        id, username, email, is_special, 
        subscription_status, 
        trial_started_at, 
        subscription_expires_at,
        stripe_customer_id,
        stripe_subscription_id,
        created_at
       FROM neon_auth.users 
       WHERE email = $1`,
      [email]
    );

    if (res.rows.length === 0) {
      console.error(`❌ Usuario no encontrado: ${email}`);
      process.exit(1);
    }

    const user = res.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at
      ? new Date(user.subscription_expires_at)
      : null;
    const daysLeft = expiresAt
      ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      : null;

    console.log("👤 Información del usuario:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Especial: ${user.is_special ? "✅ Sí" : "❌ No"}`);
    console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}\n`);

    console.log("💳 Estado de suscripción:");
    console.log(`   Estado: ${user.subscription_status}`);

    if (user.subscription_status === "none") {
      console.log("   ℹ️  Sin suscripción");
    } else if (user.subscription_status === "trial") {
      console.log(`   🎁 Prueba gratuita`);
      if (expiresAt && daysLeft > 0) {
        console.log(`   ⏰ ${daysLeft} días restantes`);
        console.log(`   📅 Expira: ${expiresAt.toLocaleString()}`);
      } else if (expiresAt && daysLeft <= 0) {
        console.log(`   ⚠️  EXPIRADO (hace ${Math.abs(daysLeft)} días)`);
        console.log(`   📅 Expiró: ${expiresAt.toLocaleString()}`);
      }
    } else if (user.subscription_status === "active") {
      console.log(`   ✅ Suscripción activa`);
      console.log(`   📅 Renovación: ${expiresAt?.toLocaleString()}`);
    } else if (user.subscription_status === "expired") {
      console.log(`   ❌ Suscripción expirada`);
      console.log(`   📅 Expiró: ${expiresAt?.toLocaleString()}`);
    }

    if (user.trial_started_at) {
      console.log(`   📍 Trial iniciado: ${new Date(user.trial_started_at).toLocaleString()}`);
    }

    console.log("\n💰 Información de Stripe:");
    if (user.stripe_customer_id) {
      console.log(`   Customer ID: ${user.stripe_customer_id}`);
    } else {
      console.log(`   Customer ID: (no asignado aún)`);
    }

    if (user.stripe_subscription_id) {
      console.log(`   Subscription ID: ${user.stripe_subscription_id}`);
    } else {
      console.log(`   Subscription ID: (no asignado aún)`);
    }

    console.log("\n" + "=".repeat(60));

    // Determinar estado visible de página
    let pageVisible = false;
    let reason = "";

    if (user.is_special) {
      pageVisible = true;
      reason = "Usuario especial";
    } else if (user.subscription_status === "active") {
      pageVisible = true;
      reason = "Suscripción activa";
    } else if (
      user.subscription_status === "trial" &&
      expiresAt &&
      expiresAt > now
    ) {
      pageVisible = true;
      reason = `Prueba activa (${daysLeft} días restantes)`;
    }

    console.log(`\n🔒 Página pública: ${pageVisible ? "✅ VISIBLE" : "❌ BLOQUEADA"}`);
    console.log(`   Razón: ${reason || "Sin suscripción activa"}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkUserStatus();
