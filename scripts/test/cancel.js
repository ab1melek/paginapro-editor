#!/usr/bin/env node
/**
 * Simula la cancelación de una suscripción
 * Marca la suscripción como cancelada y establece fecha de expiración
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

async function cancelSubscription(username) {
  const client = await pool.connect();
  
  try {
    console.log(`\n❌ Cancelando suscripción para: ${username}\n`);

    // 1. Obtener usuario actual
    const userResult = await client.query(
      'SELECT id, username, email, subscription_status, subscription_expires_at FROM neon_auth.users WHERE username = $1',
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
    console.log(`   Expira: ${user.subscription_expires_at}\n`);

    if (user.subscription_status !== 'active') {
      console.error('⚠️  La suscripción no está activa.');
    }

    // 2. Marcar como expirada
    await client.query(
      'UPDATE neon_auth.users SET subscription_status = $1, subscription_expires_at = NOW() WHERE id = $2',
      ['expired', user.id]
    );

    console.log('✅ Suscripción cancelada:\n');
    console.log(`   Nuevo estado: expired`);
    console.log(`   Expiración: ${new Date().toISOString()}\n`);

    // 3. Verificar
    const verifyResult = await client.query(
      'SELECT id, username, subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1',
      [user.id]
    );

    console.log('🔍 Verificación:');
    console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    console.log('\n✨ La suscripción ha sido cancelada. Las páginas ahora estarán bloqueadas.');

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
  console.error('❌ Uso: node cancelSubscription.js <username>');
  console.error('   Ejemplo: node cancelSubscription.js test1');
  process.exit(1);
}

cancelSubscription(username).catch(console.error);
