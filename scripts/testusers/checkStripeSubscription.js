import Stripe from 'stripe';
import { createPool } from './dbPool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2] || 'test5@mail.com';

async function checkStripeSubscription() {
  const pool = createPool();

  try {
    console.log(`\n📊 Verificando suscripción en Stripe para: ${email}\n`);

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
    console.log(`📋 Usuario en BD:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Expires: ${user.subscription_expires_at}`);
    console.log(`   Stripe Sub ID: ${user.stripe_subscription_id}`);

    if (!user.stripe_subscription_id) {
      console.error(`❌ Usuario NO tiene stripe_subscription_id`);
      pool.end();
      return;
    }

    // 2. Obtener suscripción de Stripe
    console.log(`\n🔍 Buscando suscripción en Stripe...`);
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

    console.log(`\n📦 Suscripción en Stripe:`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current Period Start: ${new Date(subscription.current_period_start * 1000)}`);
    console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000)}`);
    console.log(`   Billing Cycle Anchor: ${subscription.billing_cycle_anchor ? new Date(subscription.billing_cycle_anchor * 1000) : 'N/A'}`);
    console.log(`   Renewal Settings: ${JSON.stringify(subscription.renewal_settings || {}, null, 2)}`);
    console.log(`   Items: ${subscription.items.data.length}`);

    subscription.items.data.forEach((item, i) => {
      console.log(`\n   Item ${i + 1}:`);
      console.log(`     Price ID: ${item.price.id}`);
      console.log(`     Price Amount: $${(item.price.unit_amount / 100).toFixed(2)}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Recurring: ${JSON.stringify(item.price.recurring, null, 2)}`);
    });

    console.log(`\n⏰ Información de cobro:`);
    console.log(`   Automatic Tax: ${subscription.automatic_tax?.enabled}`);
    console.log(`   Default Payment Method: ${subscription.default_payment_method || 'N/A'}`);
    console.log(`   Default Source: ${subscription.default_source || 'N/A'}`);

    // 3. Listar facturas recientes
    console.log(`\n📃 Últimas facturas:`);
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 5
    });

    if (invoices.data.length === 0) {
      console.log(`   No invoices found`);
    } else {
      invoices.data.forEach((invoice, i) => {
        console.log(`\n   Invoice ${i + 1}:`);
        console.log(`     ID: ${invoice.id}`);
        console.log(`     Status: ${invoice.status}`);
        console.log(`     Amount: $${(invoice.amount_due / 100).toFixed(2)}`);
        console.log(`     Created: ${new Date(invoice.created * 1000)}`);
        console.log(`     Period Start: ${new Date(invoice.period_start * 1000)}`);
        console.log(`     Period End: ${new Date(invoice.period_end * 1000)}`);
      });
    }

    console.log(`\n✅ Verificación completada`);
    pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    pool.end();
    process.exit(1);
  }
}

checkStripeSubscription();
