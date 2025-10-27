import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
    expireSubscriptionForUser,
    saveStripeCustomerForUser,
    saveSubscriptionForUser
} from "../../services/stripe.db.service.js";

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

      // Cuando la suscripción se crea o actualiza
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        console.log(`[webhook] Subscription event:`, {
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

        console.log(`🔄 Suscripción ${event.type === 'customer.subscription.created' ? 'creada' : 'actualizada'}: ${sub.id} para usuario ${userId}`);
        await saveSubscriptionForUser(userId, sub);
        console.log(`✅ Suscripción guardada exitosamente`);
        break;
      }

      // Cuando la suscripción se cancela
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          console.log(`❌ Suscripción cancelada: ${sub.id}`);
          await expireSubscriptionForUser(userId);
        }
        break;
      }

      // Cuando un pago exitoso ocurre (renovación mensual/anual)
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log(`💰 Invoice pagado: ${invoice.id}`);
        // La suscripción se guarda en checkout.session.completed o customer.subscription.updated
        // No necesitamos hacer nada aquí para suscripciones nuevas
        break;
      }

      // Cuando un pago falla
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`⚠️ Pago fallido para factura: ${invoice.id}`);
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
