#!/usr/bin/env node
/**
 * Simula una renovación de suscripción
 * Actualiza subscription_expires_at al siguiente período (1 mes o 1 año)
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST_APP,
  port: parseInt(process.env.DB_PORT_APP || '5432'),
  database: process.env.DB_NAME_APP,
  user: process.env.DB_USER_APP,
  password: process.env.DB_PASSWORD_APP,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function simulateRenewal(username) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔄 Simulando renovación de suscripción para: ${username}\n`);

    // 1. Obtener usuario actual
    const userResult = await client.query(
      'SELECT id, username, email, subscription_status, subscription_expires_at, stripe_subscription_id FROM neon_auth.users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    const user = userResult.rows[0];
    
    console.log('📋 Estado actual:');
    console.log(`   Usuario: ${user.username} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Estado: ${user.subscription_status}`);
    console.log(`   Expira: ${user.subscription_expires_at}`);
    console.log(`   Subscription ID: ${user.stripe_subscription_id || 'N/A'}\n`);

    if (user.subscription_status !== 'active') {
      console.error('❌ La suscripción no está activa. Primero debe hacer un pago.');
      return;
    }

    if (!user.subscription_expires_at) {
      console.error('❌ No hay fecha de expiración. Primero debe hacer un pago.');
      return;
    }

    // 2. Calcular nueva fecha de expiración (1 mes después)
    const currentExpiry = new Date(user.subscription_expires_at);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + 1); // Sumar 1 mes

    // 3. Actualizar en la base de datos
    await client.query(
      'UPDATE neon_auth.users SET subscription_expires_at = $1 WHERE id = $2',
      [newExpiry, user.id]
    );

    console.log('✅ Renovación simulada exitosamente:\n');
    console.log(`   Fecha anterior: ${currentExpiry.toISOString()}`);
    console.log(`   Nueva fecha: ${newExpiry.toISOString()}`);
    console.log(`   Período extendido: 1 mes\n`);

    // 4. Verificar
    const verifyResult = await client.query(
      'SELECT id, username, subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1',
      [user.id]
    );

    console.log('🔍 Verificación:');
    console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    console.log('\n✨ La suscripción se renovó por 1 mes más');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
const username = process.argv[2];
if (!username) {
  console.error('❌ Uso: node simulateRenewal.js <username>');
  console.error('   Ejemplo: node simulateRenewal.js test1');
  process.exit(1);
}

simulateRenewal(username).catch(console.error);
