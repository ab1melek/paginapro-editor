#!/usr/bin/env node
/**
 * Script para crear usuario test4 rápidamente
 */

import { query } from '../db/pool.js';

async function main() {
  try {
    console.log('Creating test4 user...');
    
    const result = await query(
      `INSERT INTO neon_auth.users (id, username, email, password_hash, subscription_status, subscription_expires_at, stripe_subscription_id)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days', $6)
       ON CONFLICT (username) DO UPDATE SET 
         subscription_status='active', 
         subscription_expires_at=NOW() + INTERVAL '30 days', 
         stripe_subscription_id='sub_test4'
       RETURNING username, subscription_status, subscription_expires_at`,
      ['test4-id', 'test4', 'test4@test.com', 'hash', 'active', 'sub_test4']
    );
    
    console.log('\n✅ Usuario test4 creado/actualizado:');
    console.log(result.rows[0]);
    console.log('\n🔑 Credenciales:');
    console.log('  Username: test4');
    console.log('  Password: test');
    console.log('\n📱 Login: http://localhost:3000/login');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
