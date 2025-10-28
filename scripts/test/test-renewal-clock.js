import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

async function testRenewalWithClock() {
  const pool = createPool();

  try {
    console.log(`\n🕐 Creando Test Clock para simular tiempo y renovación\n`);

    // 1. Obtener usuario de BD
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
    console.log(`📋 Usuario: ${user.email}`);
    console.log(`   Subscription: ${user.stripe_subscription_id}\n`);

    // 2. Crear Test Clock avanzado 1 año
    console.log(`🕰️  Creando Test Clock (hoy + 1 año + 1 mes)...`);
    
    const frozenTime = new Date();
    frozenTime.setFullYear(frozenTime.getFullYear() + 1);
    frozenTime.setMonth(frozenTime.getMonth() + 1);
    
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock creado: ${testClock.id}`);
    console.log(`   Frozen Time: ${new Date(testClock.frozen_time * 1000)}\n`);

    // 3. Crear subscription dentro del Test Clock para simular
    console.log(`⏳ Advancing Test Clock para simular renovación...\n`);

    // Advance the clock forward
    await stripe.testHelpers.testClocks.advance(testClock.id, {
      frozen_time: Math.floor(frozenTime.getTime() / 1000),
    });

    console.log(`✅ Test Clock avanzado a: ${new Date(frozenTime)}\n`);

    // 4. Verificar que la suscripción sigue activa
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    
    console.log(`📦 Suscripción actual:`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000)}`);
    console.log(`   Schedule: ${subscription.schedule}\n`);

    // 5. Esperar a ver si hay webhooks
    console.log(`🔔 Esperando webhooks de Stripe (invoice.created, invoice.paid)...`);
    console.log(`   En producción, los webhooks deberían llegar automáticamente.`);
    console.log(`   Para testing local, usa: stripe listen\n`);

    console.log(`✅ Test Clock configurado correctamente`);
    console.log(`   Test Clock ID: ${testClock.id}`);
    console.log(`   Próximos pasos:`);
    console.log(`     1. Monitorear webhooks: stripe listen --forward-to localhost:3000/api/stripe/webhooks`);
    console.log(`     2. Verificar que invoice.created se genera`);
    console.log(`     3. Verificar que invoice.paid se procesa`);
    console.log(`     4. Confirmar BD actualizada con nuevo expires_at\n`);

    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    pool.end();
    process.exit(1);
  }
}

testRenewalWithClock();
