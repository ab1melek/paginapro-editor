import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { COOKIE_NAME, verifyToken } from "../../../../lib/auth.js";
import { cancelSubscriptionForUser } from "../../services/stripe.db.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // Verificar que el usuario esté autenticado
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const payload = await verifyToken(token);

    if (!payload?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Leer body una sola vez
    const { confirmed, subscriptionId } = await req.json();

    if (confirmed !== true) {
      return NextResponse.json(
        { error: "Cancelación no confirmada" },
        { status: 400 }
      );
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscription_id requerido" },
        { status: 400 }
      );
    }

    console.log(`[cancel-subscription] Usuario ${payload.id} solicita cancelar ${subscriptionId}`);

    // IMPORTANTE: Cancelar en Stripe INMEDIATAMENTE
    // Usar cancel() para que NO haya renovación automática
    // Esto garantiza que:
    // 1. No se cobra nuevamente
    // 2. El acceso se revoca al final del período actual
    const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    console.log(`[cancel-subscription] Suscripción cancelada en Stripe:`, {
      id: cancelledSubscription.id,
      status: cancelledSubscription.status,
      canceled_at: cancelledSubscription.canceled_at,
      current_period_end: cancelledSubscription.current_period_end,
    });

    // Marcar como cancelada en BD
    await cancelSubscriptionForUser(payload.id, subscriptionId);

    console.log(`[cancel-subscription] Usuario ${payload.id} tiene su suscripción marcada como 'canceled'`);

    // Preparar respuesta con timestamps seguros
    const responseData = {
      message: "Suscripción cancelada exitosamente",
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
      }
    };

    // Solo agregar timestamps si existen
    if (cancelledSubscription.canceled_at && typeof cancelledSubscription.canceled_at === 'number') {
      responseData.subscription.canceled_at = new Date(cancelledSubscription.canceled_at * 1000).toISOString();
    }
    
    if (cancelledSubscription.current_period_end && typeof cancelledSubscription.current_period_end === 'number') {
      responseData.subscription.current_period_end = new Date(cancelledSubscription.current_period_end * 1000).toISOString();
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("[cancel-subscription] Error:", err.message);

    // Si es error de Stripe (subscription no existe, etc)
    if (err.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Error de Stripe: ${err.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Error al cancelar la suscripción" },
      { status: 500 }
    );
  }
}
