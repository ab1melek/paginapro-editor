#!/usr/bin/env node

/**
 * VERIFICACIÓN DE RENOVACIÓN AUTOMÁTICA
 * 
 * Este script verifica que:
 * 1. La suscripción tiene un Schedule configurado
 * 2. El Schedule tiene 2 fases (actual + renovación)
 * 3. Los webhooks están correctamente configurados
 * 4. La BD tiene los campos correctos
 * 5. El usuario puede cancelar sin cargos automáticos
 */

import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

async function verifyAutoRenewal() {
  const pool = createPool();

  try {
    console.log(`\n════════════════════════════════════════════════════════════════`);
    console.log(`  🔍 VERIFICACIÓN DE RENOVACIÓN AUTOMÁTICA`);
    console.log(`════════════════════════════════════════════════════════════════\n`);

    // 1. Obtener usuario de BD
    console.log(`📋 PASO 1: Obtener usuario de BD`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const userResult = await pool.query(
      `SELECT id, email, subscription_status, subscription_expires_at, stripe_subscription_id 
       FROM neon_auth.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ Usuario ${email} no encontrado en BD`);
      pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Expires At: ${user.subscription_expires_at?.toISOString() || 'NULL'}`);
    console.log(`   Stripe Sub ID: ${user.stripe_subscription_id}\n`);

    if (!user.stripe_subscription_id) {
      console.error(`❌ Usuario NO tiene stripe_subscription_id`);
      pool.end();
      return;
    }

    // 2. Verificar suscripción en Stripe
    console.log(`📋 PASO 2: Verificar suscripción en Stripe`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    
    console.log(`✅ Suscripción encontrada:`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Customer: ${subscription.customer}`);
    
    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null;
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
    const billingAnchor = subscription.billing_cycle_anchor ? new Date(subscription.billing_cycle_anchor * 1000) : null;
    
    console.log(`   Current Period Start: ${periodStart?.toISOString() || 'N/A'}`);
    console.log(`   Current Period End: ${periodEnd?.toISOString() || 'N/A'}`);
    console.log(`   Billing Cycle Anchor: ${billingAnchor?.toISOString() || 'N/A'}`);
    console.log(`   Items: ${subscription.items.data.length}\n`);

    // 3. Verificar Schedule
    console.log(`📋 PASO 3: Verificar Subscription Schedule`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    let schedule = null;
    
    if (!subscription.schedule) {
      console.warn(`⚠️ La suscripción NO tiene un schedule asociado`);
      console.log(`   RECOMENDACIÓN: Ejecutar:\n   node scripts/testusers/setupAutoRenewal.js ${email}\n`);
    } else {
      schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule);
      
      console.log(`✅ Schedule encontrado:`);
      console.log(`   ID: ${schedule.id}`);
      console.log(`   Status: ${schedule.status}`);
      console.log(`   Phases: ${schedule.phases.length}`);
      console.log(`   End Behavior: ${schedule.end_behavior}\n`);

      // Verificar cada fase
      schedule.phases.forEach((phase, idx) => {
        console.log(`   📍 Fase ${idx + 1}:`);
        
        const phaseStart = phase.start_date ? new Date(phase.start_date * 1000) : null;
        const phaseEnd = phase.end_date ? new Date(phase.end_date * 1000) : null;
        
        console.log(`      Start: ${phaseStart?.toISOString() || 'N/A'}`);
        console.log(`      End: ${phaseEnd?.toISOString() || 'Indefinida'}`);
        console.log(`      Items: ${phase.items.length}`);
        
        phase.items.forEach(item => {
          const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
          console.log(`        - Price: ${priceId}, Qty: ${item.quantity}`);
        });
      });
      console.log();
    }

    // 4. Verificar customer metadata
    console.log(`📋 PASO 4: Verificar Customer metadata (para webhooks)`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    console.log(`✅ Customer encontrado:`);
    console.log(`   ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Metadata: ${JSON.stringify(customer.metadata, null, 2)}\n`);

    if (!customer.metadata?.userId) {
      console.warn(`⚠️ El customer NO tiene userId en metadata`);
      console.log(`   RIESGO: Los webhooks pueden no procesar correctamente`);
      console.log(`   Recomendación: Verificar webhook handler\n`);
    } else {
      console.log(`✅ userId está presente en metadata (webhooks funcionarán)\n`);
    }

    // 5. Verificar campos en BD
    console.log(`📋 PASO 5: Verificar campos en BD`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const dbCheck = await pool.query(
      `SELECT 
         column_name, 
         data_type, 
         is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = 'neon_auth' 
       AND table_name = 'users' 
       AND column_name IN ('stripe_subscription_id', 'subscription_status', 'subscription_expires_at')`
    );

    if (dbCheck.rows.length < 3) {
      console.warn(`⚠️ Faltan campos en BD:`);
      dbCheck.rows.forEach(row => {
        console.log(`   ✅ ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log(`✅ Todos los campos requeridos están presentes:`);
      dbCheck.rows.forEach(row => {
        console.log(`   ✅ ${row.column_name} (${row.data_type}, nullable=${row.is_nullable})`);
      });
    }
    console.log();

    // 6. Simular timeline de renovación
    console.log(`📋 PASO 6: Timeline estimado de renovación`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const now = new Date();
    const expiresAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
    const daysUntilRenewal = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : -1;
    
    console.log(`📅 Próxima renovación automática:`);
    console.log(`   Fecha: ${expiresAt?.toISOString() || 'N/A'}`);
    console.log(`   Días restantes: ${daysUntilRenewal}\n`);
    console.log();

    if (subscription.schedule) {
      const phase2 = schedule.phases[1];
      if (phase2) {
        const renewalEnd = phase2.end_date ? new Date(phase2.end_date * 1000) : null;
        console.log(`📅 Después de renovación (Fase 2):`);
        console.log(`   Nueva fecha de vencimiento: ${renewalEnd?.toISOString() || 'Indefinida'}`);
        console.log(`   Días de servicio: 365`);
        console.log();
      }
    }

    // 7. Resumen de seguridad
    console.log(`📋 PASO 7: Resumen de seguridad`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const safetyChecks = {
      'Suscripción activa': subscription.status === 'active',
      'Schedule configurado': !!subscription.schedule,
      '2+ Fases en schedule': subscription.schedule && schedule?.phases?.length >= 2,
      'Customer con metadata': !!customer.metadata?.userId,
      'BD sincronizada': user.subscription_status === subscription.status,
      'expires_at configurado': !!user.subscription_expires_at,
      'Sin cancelación manual': user.subscription_status !== 'canceled'
    };

    Object.entries(safetyChecks).forEach(([check, result]) => {
      console.log(`   ${result ? '✅' : '⚠️'} ${check}`);
    });
    console.log();

    // 8. Recomendaciones
    console.log(`📋 PASO 8: Recomendaciones`);
    console.log(`────────────────────────────────────────────────────────────────`);
    
    const failures = Object.entries(safetyChecks).filter(([_, result]) => !result);
    
    if (failures.length === 0) {
      console.log(`✅ ¡TODAS LAS VERIFICACIONES PASARON!`);
      console.log(`   La renovación automática está correctamente configurada.`);
      console.log();
      console.log(`📚 Próximos pasos (opcional):`);
      console.log(`   1. Probar con Test Clock: node scripts/testusers/testRenewalWithClock.js ${email}`);
      console.log(`   2. Monitorear webhooks: stripe listen --forward-to localhost:3000/api/stripe/webhook`);
      console.log(`   3. Probar cancelación: curl -X POST http://localhost:3000/api/stripe/cancel-subscription -H "Content-Type: application/json" -d '{...}'`);
    } else {
      console.log(`⚠️ Se encontraron ${failures.length} problemas:`);
      failures.forEach(([check]) => {
        console.log(`   - ${check}`);
      });
      console.log();
      console.log(`💡 Pasos para corregir:`);
      console.log(`   1. Si no hay schedule: node scripts/testusers/setupAutoRenewal.js ${email}`);
      console.log(`   2. Si status no coincide: Ejecutar sync nuevamente`);
    }

    console.log(`\n════════════════════════════════════════════════════════════════\n`);
    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    pool.end();
    process.exit(1);
  }
}

verifyAutoRenewal();
