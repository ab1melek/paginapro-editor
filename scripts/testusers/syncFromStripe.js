#!/usr/bin/env node

/**
 * SINCRONIZADOR: Actualiza BD desde Stripe
 * 
 * Sincroniza los datos de BD con el estado real en Stripe
 * Útil después de tests o cambios manuales en Stripe
 */

import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

async function syncFromStripe() {
  const pool = createPool();

  try {
    console.log(`\n🔄 SINCRONIZANDO BD CON STRIPE\n`);
    console.log(`Usuario: ${email}\n`);

    // 1. Obtener usuario
    console.log(`🔍 Paso 1: Obtener usuario de BD...`);
    
    const userResult = await pool.query(
      `SELECT id, email, stripe_subscription_id FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ Usuario ${email} no encontrado en BD`);
      pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado: ${user.id}\n`);

    if (!user.stripe_subscription_id) {
      console.error(`❌ Usuario no tiene stripe_subscription_id`);
      pool.end();
      return;
    }

    // 2. Obtener suscripción de Stripe
    console.log(`🔍 Paso 2: Obtener suscripción de Stripe...`);
    
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    
    console.log(`✅ Suscripción encontrada:\n`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status en Stripe: ${subscription.status}`);
    console.log(`   Canceled At: ${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : 'N/A'}`);
    console.log(`   Ended At: ${subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : 'N/A'}`);
    console.log(`   Current Period End: ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A'}\n`);

    // 3. Mapear status
    console.log(`🔍 Paso 3: Mapear status...`);
    
    let newStatus = 'active';
    let newExpiresAt = new Date();

    if (subscription.status === 'canceled') {
      newStatus = 'canceled';
      // Si fue cancelada, usar el ended_at o canceled_at
      if (subscription.ended_at) {
        newExpiresAt = new Date(subscription.ended_at * 1000);
      } else if (subscription.current_period_end) {
        newExpiresAt = new Date(subscription.current_period_end * 1000);
      }
      console.log(`   Status: canceled`);
      console.log(`   Expires At (desde Stripe): ${newExpiresAt.toISOString()}`);
    } else if (subscription.status === 'active') {
      newStatus = 'active';
      if (subscription.current_period_end) {
        newExpiresAt = new Date(subscription.current_period_end * 1000);
      }
      console.log(`   Status: active`);
      console.log(`   Expires At (próximo cobro): ${newExpiresAt.toISOString()}`);
    }

    // 4. Actualizar BD
    console.log(`\n🔄 Paso 4: Actualizar BD...`);
    
    const updateResult = await pool.query(
      `UPDATE neon_auth.users 
       SET subscription_status = $1, 
           subscription_expires_at = $2,
           stripe_subscription_id = $3
       WHERE id = $4
       RETURNING subscription_status, subscription_expires_at`,
      [newStatus, newExpiresAt, subscription.id, user.id]
    );

    const updated = updateResult.rows[0];
    
    console.log(`✅ BD Actualizada:\n`);
    console.log(`   Status: ${updated.subscription_status}`);
    console.log(`   Expires: ${updated.subscription_expires_at.toISOString()}\n`);

    // 5. Verificar diferencias
    console.log(`🔍 Paso 5: Verificar sincronización...`);

    const now = new Date();
    const daysRemaining = Math.ceil((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`   Hoy: ${now.toISOString()}`);
    console.log(`   Vencimiento: ${newExpiresAt.toISOString()}`);
    console.log(`   Días restantes: ${daysRemaining}\n`);

    // RESUMEN
    console.log(`════════════════════════════════════════════════════════════════`);
    console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
    console.log(`════════════════════════════════════════════════════════════════\n`);

    console.log(`ESTADO FINAL:\n`);
    console.log(`   Status BD: ${updated.subscription_status}`);
    console.log(`   Status Stripe: ${subscription.status}`);
    
    if (updated.subscription_status === subscription.status) {
      console.log(`   ✅ Status sincronizado\n`);
    } else {
      console.log(`   ⚠️  Status NO sincronizado\n`);
    }

    console.log(`EXPIRACIÓN:\n`);
    console.log(`   BD: ${updated.subscription_expires_at.toISOString()}`);
    console.log(`   Stripe: ${newExpiresAt.toISOString()}`);
    console.log(`   Días restantes: ${daysRemaining}\n`);

    if (daysRemaining < 0 && newStatus === 'canceled') {
      console.log(`⚠️  USUARIO EXPIRADO Y CANCELADO\n`);
      console.log(`   El usuario debe tener acceso bloqueado desde:\n`);
      console.log(`   ${newExpiresAt.toISOString()}\n`);
    } else if (daysRemaining > 0 && newStatus === 'canceled') {
      console.log(`ℹ️  USUARIO CANCELADO PERO AÚN ACTIVO\n`);
      console.log(`   El usuario tiene acceso por ${daysRemaining} días más\n`);
    } else if (newStatus === 'active') {
      console.log(`✅ USUARIO ACTIVO - Renovación automática habilitada\n`);
    }

    pool.end();

  } catch (error) {
    console.error("❌ Error:", error.message);
    pool.end();
    process.exit(1);
  }
}

syncFromStripe();
