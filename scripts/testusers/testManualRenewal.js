#!/usr/bin/env node

/**
 * TEST MANUAL DE RENOVACIÓN AUTOMÁTICA
 * 
 * Este script te guía paso a paso por un test manual de renovación.
 * Tú controlas cuándo ejecutar cada acción y ves los resultados en tiempo real.
 */

import readline from 'readline';
import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function printSection(title) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(80)}\n`);
}

function printStep(step, description) {
  console.log(`\n📍 PASO ${step}: ${description}`);
  console.log(`${'─'.repeat(80)}\n`);
}

async function testManualRenewal() {
  const pool = createPool();

  try {
    printSection('🕐 TEST MANUAL DE RENOVACIÓN AUTOMÁTICA');

    console.log(`Este test te guiará paso a paso para verificar que la renovación`);
    console.log(`automática funciona correctamente.\n`);
    console.log(`Usuario: ${email}\n`);

    // PASO 1: Obtener usuario
    printStep(1, 'Obtener datos del usuario');
    
    console.log(`🔍 Buscando usuario en BD...`);
    
    const userResult = await pool.query(
      `SELECT id, email, subscription_status, subscription_expires_at, stripe_subscription_id, stripe_customer_id 
       FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`\n❌ Usuario ${email} no encontrado en BD`);
      pool.end();
      rl.close();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado:\n`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Expires: ${user.subscription_expires_at?.toISOString() || 'N/A'}`);
    console.log(`   Stripe Sub ID: ${user.stripe_subscription_id}\n`);

    let response = await question('¿Continuar? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    // PASO 2: Verificar suscripción actual en Stripe
    printStep(2, 'Verificar suscripción actual en Stripe');
    
    console.log(`🔍 Obteniendo suscripción de Stripe...`);
    
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    
    console.log(`✅ Suscripción encontrada:\n`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Customer: ${subscription.customer}`);
    
    const currentEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : 'N/A';
    
    console.log(`   Current Period End: ${currentEnd}`);
    console.log(`   Schedule: ${subscription.schedule || 'No hay schedule'}\n`);

    response = await question('¿Continuar? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    // PASO 3: Verificar Schedule
    printStep(3, 'Verificar Subscription Schedule');
    
    if (!subscription.schedule) {
      console.log(`⚠️  La suscripción NO tiene un schedule.\n`);
      console.log(`RECOMENDACIÓN: Ejecuta primero:\n`);
      console.log(`   node scripts/testusers/setupAutoRenewal.js ${email}\n`);
      pool.end();
      rl.close();
      return;
    }

    console.log(`🔍 Obteniendo schedule de Stripe...`);
    
    const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule);
    
    console.log(`✅ Schedule encontrado:\n`);
    console.log(`   ID: ${schedule.id}`);
    console.log(`   Status: ${schedule.status}`);
    console.log(`   Phases: ${schedule.phases.length}`);
    console.log(`   End Behavior: ${schedule.end_behavior}\n`);

    schedule.phases.forEach((phase, idx) => {
      const start = new Date(phase.start_date * 1000).toISOString();
      const end = phase.end_date ? new Date(phase.end_date * 1000).toISOString() : 'Indefinida';
      console.log(`   Fase ${idx + 1}:`);
      console.log(`      Start: ${start}`);
      console.log(`      End: ${end}`);
      console.log(`      Items: ${phase.items.length}\n`);
    });

    response = await question('¿Continuar? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    // PASO 4: Crear Test Clock
    printStep(4, 'Crear Test Clock (simula avance de tiempo)');
    
    console.log(`⏰ Preparando Test Clock...`);
    console.log(`   Esto avanzará el tiempo 1 año + 1 mes`);
    console.log(`   Stripe generará invoice automáticamente\n`);

    const frozenTime = new Date();
    frozenTime.setFullYear(frozenTime.getFullYear() + 1);
    frozenTime.setMonth(frozenTime.getMonth() + 1);

    console.log(`🕐 Tiempo congelado será: ${frozenTime.toISOString()}\n`);

    response = await question('¿Crear Test Clock ahora? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    console.log(`\n⏳ Creando Test Clock...`);
    
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock creado:\n`);
    console.log(`   ID: ${testClock.id}`);
    console.log(`   Frozen Time: ${new Date(testClock.frozen_time * 1000).toISOString()}\n`);

    response = await question('¿Continuar? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    // PASO 5: Avanzar Test Clock
    printStep(5, 'Avanzar Test Clock (dispara renovación)');
    
    console.log(`⏳ Avanzando tiempo...\n`);
    console.log(`ATENCIÓN: Este paso debe estar escuchando webhooks con:\n`);
    console.log(`   stripe listen --forward-to localhost:3000/api/stripe/webhook\n`);

    response = await question('¿Tienes Stripe CLI escuchando? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('\n⚠️  IMPORTANTE: Abre otra terminal y ejecuta:\n');
      console.log(`   stripe listen --forward-to localhost:3000/api/stripe/webhook\n`);
      response = await question('¿Listo? (s/n): ');
      if (response.toLowerCase() !== 's') {
        console.log('❌ Test cancelado');
        pool.end();
        rl.close();
        return;
      }
    }

    console.log(`\n⏳ Avanzando Test Clock...\n`);
    
    await stripe.testHelpers.testClocks.advance(testClock.id, {
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock avanzado!\n`);
    console.log(`STRIPE DEBERÍA HABER GENERADO AUTOMÁTICAMENTE:\n`);
    console.log(`   ✓ invoice.created\n`);
    console.log(`   ✓ invoice.payment_succeeded\n`);
    console.log(`   ✓ invoice.paid ← Tu webhook debe actualizarse aquí\n`);

    console.log(`Verifica en la terminal de Stripe CLI si los webhooks aparecen.\n`);

    response = await question('¿Presiona Enter cuando veas los webhooks en Stripe CLI: ');

    // PASO 6: Verificar suscripción renovada
    printStep(6, 'Verificar suscripción después de renovación');
    
    console.log(`🔍 Obteniendo suscripción actualizada de Stripe...\n`);
    
    const subscriptionUpdated = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    
    console.log(`✅ Suscripción actualizada:\n`);
    console.log(`   ID: ${subscriptionUpdated.id}`);
    console.log(`   Status: ${subscriptionUpdated.status}`);
    
    const newEnd = subscriptionUpdated.current_period_end 
      ? new Date(subscriptionUpdated.current_period_end * 1000).toISOString()
      : 'N/A';
    
    console.log(`   NEW Current Period End: ${newEnd}\n`);

    response = await question('¿Continuar? (s/n): ');
    if (response.toLowerCase() !== 's') {
      console.log('❌ Test cancelado');
      pool.end();
      rl.close();
      return;
    }

    // PASO 7: Verificar BD actualizada
    printStep(7, 'Verificar Base de Datos actualizada');
    
    console.log(`🔍 Consultando BD...\n`);
    
    const userUpdated = await pool.query(
      `SELECT subscription_status, subscription_expires_at FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    const userDB = userUpdated.rows[0];
    
    console.log(`✅ Datos en BD:\n`);
    console.log(`   Status: ${userDB.subscription_status}`);
    console.log(`   Expires: ${userDB.subscription_expires_at?.toISOString() || 'N/A'}\n`);

    if (userDB.subscription_status === 'active') {
      console.log(`✅ Status = 'active' (Correcto para renovación)`);
    } else {
      console.log(`⚠️  Status = '${userDB.subscription_status}' (Debería ser 'active')`);
    }

    const expiresDate = userDB.subscription_expires_at;
    const newExpiresDate = new Date(frozenTime);
    newExpiresDate.setFullYear(newExpiresDate.getFullYear() + 1);

    if (expiresDate) {
      const diffDays = Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      console.log(`✅ Días restantes: ~${diffDays}`);
    }

    console.log();

    // PASO 8: Ejecutar verificación
    printStep(8, 'Ejecutar verificación automática');
    
    response = await question('¿Ejecutar verificación completa? (s/n): ');
    if (response.toLowerCase() === 's') {
      console.log(`\n⏳ Ejecutando: verifyAutoRenewal.js\n`);
      
      // Aquí importamos y ejecutamos el verificador
      // (En un proyecto real, ejecutarías el script)
      console.log(`⚠️  Para ejecutar la verificación manualmente, usa:\n`);
      console.log(`   node scripts/testusers/verifyAutoRenewal.js ${email}\n`);
    }

    // RESUMEN FINAL
    printSection('✅ TEST COMPLETADO');

    console.log(`Si todo salió bien, deberías ver:\n`);
    console.log(`   ✅ Webhooks en Stripe CLI`);
    console.log(`   ✅ BD actualizada con nuevo expires_at`);
    console.log(`   ✅ Status = 'active'\n`);

    console.log(`¿QUÉ SIGNIFICA?\n`);
    console.log(`   ✅ Renovación automática FUNCIONA`);
    console.log(`   ✅ Webhooks se procesan correctamente`);
    console.log(`   ✅ BD se sincroniza automáticamente\n`);

    console.log(`PRÓXIMOS PASOS:\n`);
    console.log(`   1. Ejecutar: node scripts/testusers/verifyAutoRenewal.js ${email}`);
    console.log(`   2. Confirmar que todas las verificaciones pasan`);
    console.log(`   3. ¡Renovación automática está lista!\n`);

    pool.end();
    rl.close();

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    pool.end();
    rl.close();
    process.exit(1);
  }
}

testManualRenewal();
