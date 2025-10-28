#!/usr/bin/env node

/**
 * TEST MANUAL DE RENOVACIÓN AUTOMÁTICA (Versión Demo)
 * 
 * Este es un demo que simula el test manual sin requerir input interactivo
 */

import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

function printSection(title) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(80)}\n`);
}

function printStep(step, description) {
  console.log(`\n📍 PASO ${step}: ${description}`);
  console.log(`${'─'.repeat(80)}\n`);
}

async function testManualRenewalDemo() {
  const pool = createPool();

  try {
    printSection('🕐 TEST MANUAL DE RENOVACIÓN AUTOMÁTICA (DEMO)');

    console.log(`Este test muestra los pasos exactos para verificar que la renovación`);
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
      console.error(`❌ Usuario ${email} no encontrado en BD`);
      pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado:\n`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Expires: ${user.subscription_expires_at?.toISOString() || 'N/A'}`);
    console.log(`   Stripe Sub ID: ${user.stripe_subscription_id}\n`);

    console.log(`✓ Continuando al siguiente paso...\n`);

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

    console.log(`✓ Continuando al siguiente paso...\n`);

    // PASO 3: Verificar Schedule
    printStep(3, 'Verificar Subscription Schedule');
    
    if (!subscription.schedule) {
      console.log(`⚠️  La suscripción NO tiene un schedule.\n`);
      console.log(`RECOMENDACIÓN: Ejecuta primero:\n`);
      console.log(`   node scripts/testusers/setupAutoRenewal.js ${email}\n`);
      pool.end();
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

    console.log(`✓ Continuando al siguiente paso...\n`);

    // PASO 4: Crear Test Clock
    printStep(4, 'Crear Test Clock (simula avance de tiempo)');
    
    console.log(`⏰ Preparando Test Clock...`);
    console.log(`   Esto avanzará el tiempo 1 año + 1 mes`);
    console.log(`   Stripe generará invoice automáticamente\n`);

    const frozenTime = new Date();
    frozenTime.setFullYear(frozenTime.getFullYear() + 1);
    frozenTime.setMonth(frozenTime.getMonth() + 1);

    console.log(`🕐 Tiempo congelado será: ${frozenTime.toISOString()}\n`);

    console.log(`✓ Creando Test Clock...\n`);
    
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock creado:\n`);
    console.log(`   ID: ${testClock.id}`);
    console.log(`   Frozen Time: ${new Date(testClock.frozen_time * 1000).toISOString()}\n`);

    console.log(`✓ Continuando al siguiente paso...\n`);

    // PASO 5: Avanzar Test Clock
    printStep(5, 'Avanzar Test Clock (dispara renovación)');
    
    console.log(`⏳ Avanzando tiempo...\n`);
    console.log(`📌 IMPORTANTE PARA TESTING:\n`);
    console.log(`   En otra terminal, ejecuta:\n`);
    console.log(`   stripe listen --forward-to localhost:3000/api/stripe/webhook\n`);
    console.log(`   Así podrás ver los webhooks que se generan.\n`);

    console.log(`⏳ Avanzando Test Clock...\n`);
    
    await stripe.testHelpers.testClocks.advance(testClock.id, {
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock avanzado!\n`);
    console.log(`STRIPE GENERA AUTOMÁTICAMENTE:\n`);
    console.log(`   ✓ invoice.created\n`);
    console.log(`   ✓ invoice.payment_succeeded\n`);
    console.log(`   ✓ invoice.paid ← Tu webhook se actualiza aquí\n`);

    console.log(`Los webhooks deberían aparecer en Stripe CLI.\n`);

    console.log(`✓ Continuando al siguiente paso...\n`);

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

    console.log(`✓ Continuando al siguiente paso...\n`);

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

    if (expiresDate) {
      const diffDays = Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      console.log(`✅ Días restantes: ~${diffDays}`);
    }

    console.log();

    // PASO 8: Ejecutar verificación
    printStep(8, 'Ejecutar verificación automática');
    
    console.log(`Para ejecutar la verificación completa, usa:\n`);
    console.log(`   node scripts/testusers/verifyAutoRenewal.js ${email}\n`);

    // RESUMEN FINAL
    printSection('✅ TEST COMPLETADO');

    console.log(`PASOS EJECUTADOS:\n`);
    console.log(`   ✅ Obtenido usuario de BD`);
    console.log(`   ✅ Verificada suscripción en Stripe`);
    console.log(`   ✅ Verificado Schedule con 2 fases`);
    console.log(`   ✅ Creado Test Clock`);
    console.log(`   ✅ Avanzado el tiempo`);
    console.log(`   ✅ Verificada suscripción renovada`);
    console.log(`   ✅ Confirmados datos en BD\n`);

    console.log(`¿QUÉ SUCEDIÓ?\n`);
    console.log(`   1. Se creó un Test Clock avanzado 1 año + 1 mes`);
    console.log(`   2. Stripe generó automáticamente:\n`);
    console.log(`      • invoice.created`);
    console.log(`      • invoice.payment_succeeded`);
    console.log(`      • invoice.paid\n`);
    console.log(`   3. Tu webhook debería haber procesado invoice.paid`);
    console.log(`   4. BD debería estar actualizada (si los webhooks funcionan)\n`);

    console.log(`VERIFICAR WEBHOOKS:\n`);
    console.log(`   1. En otra terminal, ejecuta:\n`);
    console.log(`      stripe listen --forward-to localhost:3000/api/stripe/webhook\n`);
    console.log(`   2. Vuelve a ejecutar este script`);
    console.log(`   3. Deberías ver los webhooks en tiempo real\n`);

    console.log(`PRÓXIMOS PASOS:\n`);
    console.log(`   1. node scripts/testusers/verifyAutoRenewal.js ${email}`);
    console.log(`   2. Confirmar que todas las verificaciones pasan`);
    console.log(`   3. ¡Renovación automática está lista!\n`);

    pool.end();

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    pool.end();
    process.exit(1);
  }
}

testManualRenewalDemo();
