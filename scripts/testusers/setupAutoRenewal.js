import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

async function setupAutoRenewal() {
  const pool = createPool();

  try {
    console.log(`\n🔄 Configurando renovación automática para: ${email}\n`);

    // 1. Obtener usuario de BD
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
    console.log(`📋 Usuario encontrado:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Stripe Sub ID: ${user.stripe_subscription_id}`);

    if (!user.stripe_subscription_id) {
      console.error(`❌ Usuario NO tiene stripe_subscription_id`);
      pool.end();
      return;
    }

    // 2. Obtener suscripción actual de Stripe
    console.log(`\n🔍 Obteniendo suscripción actual de Stripe...`);
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

    console.log(`📦 Suscripción actual:`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Customer: ${subscription.customer}`);
    console.log(`   Items: ${subscription.items.data.length}`);

    // Si ya tiene un schedule, libéralo primero
    if (subscription.schedule) {
      console.log(`\n⚠️  La suscripción ya tiene un schedule: ${subscription.schedule}`);
      console.log(`📌 Liberando schedule anterior...`);
      try {
        await stripe.subscriptionSchedules.release(subscription.schedule);
        console.log(`✅ Schedule liberado`);
      } catch (err) {
        console.warn(`⚠️  No se pudo liberar: ${err.message}`);
      }
    }

    // 3. Crear Subscription Schedule básico
    console.log(`\n📅 Creando nuevo Subscription Schedule...`);
    
    let schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });

    console.log(`✅ Schedule creado: ${schedule.id}`);

    // 4. Actualizar el schedule para agregar fase de renovación
    console.log(`\n🔄 Configurando renovación automática indefinida...`);
    
    const currentPhase = schedule.phases[0];
    
    console.log(`📍 Fase actual:`);
    console.log(`   Start: ${new Date(currentPhase.start_date * 1000)}`);
    console.log(`   End: ${new Date(currentPhase.end_date * 1000)}`);
    console.log(`   Items: ${currentPhase.items.length}`);
    
    // Obtener información correcta del item
    const itemsForRenewal = currentPhase.items.map(item => {
      console.log(`   - Item structure:`, JSON.stringify(item, null, 2));
      // El price en schedule.phases es un objeto con id, no solo el id
      const priceId = item.price?.id || item.price;
      console.log(`   - Price ID: ${priceId}`);
      return {
        price: priceId,
        quantity: item.quantity,
      };
    });
    
    // Crear un schedule con fase de renovación indefinida
    schedule = await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          // Fase actual
          items: itemsForRenewal,
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date,
        },
        {
          // Fase de renovación: continúa indefinidamente
          items: itemsForRenewal,
          duration: {
            interval: 'year',
            interval_count: 1,
          },
          billing_cycle_anchor: 'phase_start',
        },
      ],
      end_behavior: 'release',
    });

    console.log(`\n✅ Subscription Schedule creado:`);
    console.log(`   Schedule ID: ${schedule.id}`);
    console.log(`   Status: ${schedule.status}`);
    console.log(`   Fases: ${schedule.phases.length}`);

    schedule.phases.forEach((phase, index) => {
      console.log(`\n   📍 Fase ${index + 1}:`);
      console.log(`      Start: ${new Date(phase.start_date * 1000)}`);
      if (phase.end_date) {
        console.log(`      End: ${new Date(phase.end_date * 1000)}`);
      } else {
        console.log(`      End: Indefinida (renovación automática)`);
      }
      console.log(`      Items: ${phase.items.length}`);
      phase.items.forEach(item => {
        // item.price can be a string (price ID) or an object with id
        const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
        console.log(`        - Price ID: ${priceId}`);
        console.log(`        - Quantity: ${item.quantity}`);
      });
    });

    console.log(`\n🎯 Próximos pasos:`);
    console.log(`   1. Stripe cobrará automáticamente en: ${new Date(subscription.current_period_end * 1000)}`);
    console.log(`   2. Luego renovará anualmente`);
    console.log(`   3. Recibiremos webhooks: invoice.created → invoice.paid`);
    console.log(`   4. Actualizaremos BD en webhook`);

    console.log(`\n✅ Renovación automática configurada correctamente`);
    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    pool.end();
    process.exit(1);
  }
}

setupAutoRenewal();
