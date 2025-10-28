import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  expireSubscriptionForUser,
  getUserSubscriptionStatus,
  saveStripeCustomerForUser,
  saveSubscriptionForUser
} from "../../services/stripe.db.service.js";
import {
  syncSubscriptionFromStripe
} from "../../services/sync.db.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  try {
    // Verificar la firma del webhook
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("🔔 Webhook recibido:", event.type);

    switch (event.type) {
      // Cuando el usuario completa el checkout exitosamente
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId && session.customer) {
          console.log(`✅ Checkout completado para usuario ${userId}`);

          // Actualizar el customer con metadata para futuros webhooks
          await stripe.customers.update(session.customer, {
            metadata: { userId }
          });

          // Guardar el customer ID en la BD
          await saveStripeCustomerForUser(userId, session.customer);
          
          // La suscripción se guardará en customer.subscription.created que tiene current_period_end
          console.log(`✅ Customer metadata actualizado, la suscripción se guardará automáticamente`);
        }
        break;
      }

      // Cuando la suscripción se crea
      case "customer.subscription.created": {
        const sub = event.data.object;
        console.log(`[webhook] Nueva suscripción:`, {
          id: sub.id,
          customer: sub.customer,
          status: sub.status,
          current_period_end: sub.current_period_end,
        });

        // Intentar obtener userId del customer metadata primero
        const customer = await stripe.customers.retrieve(sub.customer);
        let userId = customer.metadata?.userId;

        // Si no hay userId en customer metadata, buscar en checkout sessions recientes
        if (!userId) {
          console.log(`[webhook] Customer ${sub.customer} no tiene userId en metadata, buscando en sesiones recientes...`);
          try {
            const sessions = await stripe.checkout.sessions.list({
              customer: sub.customer,
              limit: 5
            });
            
            const sessionWithUserId = sessions.data.find(s => s.metadata?.userId);
            if (sessionWithUserId) {
              userId = sessionWithUserId.metadata.userId;
              console.log(`✅ userId encontrado en sesión: ${userId}`);
              
              // Actualizar customer metadata para futuros webhooks
              await stripe.customers.update(sub.customer, {
                metadata: { userId }
              });
            }
          } catch (err) {
            console.error(`Error buscando sesiones:`, err.message);
          }
        }

        if (!userId) {
          console.warn(`[webhook] No se pudo obtener userId para subscription ${sub.id}`);
          break;
        }

        console.log(`✅ Suscripción creada: ${sub.id} para usuario ${userId}`);
        
        // Guardar la suscripción primero
        await saveSubscriptionForUser(userId, sub);
        console.log(`✅ Suscripción guardada en BD`);
        
        // Sincronizar desde Stripe para garantizar consistencia
        console.log(`[webhook] 🔄 Sincronizando nueva suscripción desde Stripe...`);
        const synced = await syncSubscriptionFromStripe(userId, sub.id);
        
        if (synced) {
          console.log(`[webhook] ✅ Nueva suscripción sincronizada correctamente`);
        } else {
          console.warn(`[webhook] ⚠️ Sincronización de nueva suscripción falló`);
        }
        break;
      }

      // Cuando la suscripción se actualiza
      case "customer.subscription.updated": {
        const sub = event.data.object;
        console.log(`[webhook] Suscripción actualizada:`, {
          id: sub.id,
          customer: sub.customer,
          status: sub.status,
          current_period_end: sub.current_period_end,
        });

        const customer = await stripe.customers.retrieve(sub.customer);
        const userId = customer.metadata?.userId;

        if (!userId) {
          console.warn(`[webhook] No se pudo obtener userId para subscription ${sub.id}`);
          break;
        }

        console.log(`🔄 Suscripción actualizada: ${sub.id} para usuario ${userId}`);
        
        // Guardar los cambios de la suscripción
        await saveSubscriptionForUser(userId, sub);
        console.log(`✅ Cambios de suscripción guardados en BD`);
        
        // Sincronizar desde Stripe para garantizar consistencia
        console.log(`[webhook] 🔄 Sincronizando actualización desde Stripe...`);
        const synced = await syncSubscriptionFromStripe(userId, sub.id);
        
        if (synced) {
          console.log(`[webhook] ✅ Actualización sincronizada correctamente`);
        } else {
          console.warn(`[webhook] ⚠️ Sincronización de actualización falló`);
        }
        break;
      }

      // Cuando la suscripción se cancela (ya sea por el usuario o por nosotros)
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          console.log(`❌ Suscripción cancelada: ${sub.id} para usuario ${userId}`);
          console.log(`   - canceled_at: ${new Date(sub.canceled_at * 1000).toISOString()}`);
          console.log(`   - Status en Stripe: ${sub.status}`);
          
          // NUEVA LÓGICA: Sincronizar automáticamente desde Stripe
          console.log(`[webhook] 🔄 Sincronizando desde Stripe...`);
          const synced = await syncSubscriptionFromStripe(userId, sub.id);
          
          if (synced) {
            console.log(`[webhook] ✅ Sincronización completada automáticamente`);
          } else {
            console.warn(`[webhook] ⚠️ Sincronización automática falló, usando lógica legacy`);
            
            // Fallback a lógica anterior si sincronización falla
            const userStatus = await getUserSubscriptionStatus(userId);
            if (userStatus?.subscription_status === 'canceled') {
              console.log(`✅ Usuario ${userId} ya tiene status='canceled'`);
            } else {
              await expireSubscriptionForUser(userId);
              console.log(`✅ Usuario ${userId} marcado con subscription_status='expired'`);
            }
          }
        } else {
          console.warn(`[webhook] No se pudo obtener userId para subscription ${sub.id}`);
        }
        break;
      }

      // Cuando un pago exitoso ocurre (renovación mensual/anual)
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log(`💰 Invoice pagado: ${invoice.id}`);
        console.log(`   - Customer: ${invoice.customer}`);
        console.log(`   - Subscription: ${invoice.subscription}`);
        console.log(`   - Amount: ${invoice.amount_paid}${invoice.currency.toUpperCase()}`);
        
        // Si hay una suscripción asociada, sincronizar desde Stripe
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const customer = await stripe.customers.retrieve(subscription.customer);
            const userId = customer.metadata?.userId;
            
            if (userId) {
              console.log(`[webhook] 🔄 Sincronizando renovación desde Stripe...`);
              const synced = await syncSubscriptionFromStripe(userId, subscription.id);
              
              if (synced) {
                console.log(`[webhook] ✅ Renovación sincronizada correctamente`);
              } else {
                console.warn(`[webhook] ⚠️ Sincronización de renovación falló`);
              }
            }
          } catch (err) {
            console.error(`⚠️ Error procesando renovación:`, err.message);
          }
        }
        break;
      }

      // Cuando un pago falla
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`⚠️ Pago fallido para factura: ${invoice.id}`);
        console.warn(`   - Customer: ${invoice.customer}`);
        console.warn(`   - Subscription: ${invoice.subscription}`);
        console.warn(`   - Razón: ${invoice.last_finalization_error?.message || 'desconocida'}`);
        
        // IMPORTANTE: Si está cancelada en BD, no hay problema
        // Si no está cancelada pero el pago falla, Stripe reintentará según su política
        // Pero NO renovará si la suscripción está en status 'canceled'
        
        // Aquí puedes enviar un email al usuario notificándole del fallo
        // TODO: Implementar notificación por email
        break;
      }

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ stripe/webhook error:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
