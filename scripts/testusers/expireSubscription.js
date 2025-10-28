#!/usr/bin/env node
/**
 * Script para expirar la suscripción de un usuario de prueba
 * Uso: node scripts/testusers/expireSubscription.js [email]
 * Ejemplo: node scripts/testusers/expireSubscription.js test1@mail.com
 */

import 'dotenv/config';
import { createPool } from './dbPool.js';

const pool = createPool();

async function expireSubscription(email) {
  try {
    if (!email) {
      console.error('❌ Por favor proporciona un correo');
      console.log('Uso: node scripts/testusers/expireSubscription.js <email>');
      process.exit(1);
    }

    console.log(`\n🔄 Expirando suscripción para: ${email}`);

    // Primero obtener el usuario
    const getUserRes = await pool.query(
      `SELECT id, username, email, subscription_status FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (getUserRes.rows.length === 0) {
      console.error(`❌ Usuario ${email} no encontrado`);
      process.exit(1);
    }

    const user = getUserRes.rows[0];
    console.log(`\n📋 Estado actual:`);
    console.log(`   Usuario: ${user.username} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Estado: ${user.subscription_status}`);

    // Actualizar subscription_status a 'expired'
    const updateRes = await pool.query(
      `UPDATE neon_auth.users SET subscription_status = $1, subscription_expires_at = $2 WHERE id = $3 RETURNING id, subscription_status, subscription_expires_at`,
      ['expired', new Date(), user.id]
    );

    const updated = updateRes.rows[0];
    console.log(`\n✅ Suscripción expirada:`);
    console.log(`   Nuevo estado: ${updated.subscription_status}`);
    console.log(`   Expiración: ${updated.subscription_expires_at}`);

    // Verificar el estado
    const verifyRes = await pool.query(
      `SELECT id, username, subscription_status, subscription_expires_at, trial_started_at FROM neon_auth.users WHERE id = $1`,
      [user.id]
    );

    const verified = verifyRes.rows[0];
    console.log(`\n🔍 Verificación:`);
    console.log(JSON.stringify(verified, null, 2));

    console.log(`\n✨ Ahora intenta acceder a la página pública - debería estar bloqueada con el mensaje de suscripción expirada\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
expireSubscription(email);
