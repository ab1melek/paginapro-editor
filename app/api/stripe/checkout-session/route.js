import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { COOKIE_NAME, verifyToken } from "../../../../lib/auth.js";

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

    const { plan } = await req.json(); // 'monthly' | 'yearly'

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan inválido" },
        { status: 400 }
      );
    }

    // Obtener el price_id según el plan
    const priceId = plan === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId) {
      return NextResponse.json(
        { error: "Configuración de precios incompleta" },
        { status: 500 }
      );
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.API_BASE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.API_BASE_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId: payload.id,
      },
    });

    return NextResponse.json(
      { url: session.url },
      { status: 201 }
    );
  } catch (err) {
    console.error("stripe/checkout-session error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
