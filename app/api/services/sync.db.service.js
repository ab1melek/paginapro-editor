/**
 * SERVICIO DE SINCRONIZACIÓN
 * 
 * Sincroniza automáticamente la BD con Stripe para garantizar
 * que los datos siempre estén actualizados en producción
 */

import Stripe from 'stripe';
import { query } from '../../../db/pool.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Sincroniza datos de una suscripción desde Stripe a BD
 * Se ejecuta en cada webhook para garantizar consistencia
 */
export async function syncSubscriptionFromStripe(userId, stripeSubscriptionId) {
  try {
    if (!userId || !stripeSubscriptionId) {
      console.warn('[syncSubscriptionFromStripe] Parámetros inválidos', { userId, stripeSubscriptionId });
      return false;
    }

    console.log(`[sync] Sincronizando suscripción ${stripeSubscriptionId} para usuario ${userId}`);

    // 1. Obtener suscripción de Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // 2. Mapear status
    let newStatus = 'active';
    let expiresAt = new Date();

    if (subscription.status === 'canceled') {
      newStatus = 'canceled';
      // Usar ended_at si existe, sino current_period_end
      if (subscription.ended_at) {
        expiresAt = new Date(subscription.ended_at * 1000);
      } else if (subscription.current_period_end) {
        expiresAt = new Date(subscription.current_period_end * 1000);
      }
    } else if (subscription.status === 'active') {
      newStatus = 'active';
      if (subscription.current_period_end) {
        expiresAt = new Date(subscription.current_period_end * 1000);
      }
    } else if (subscription.status === 'past_due') {
      newStatus = 'active'; // Seguir considerando como activa (Stripe está retentando)
      if (subscription.current_period_end) {
        expiresAt = new Date(subscription.current_period_end * 1000);
      }
    } else if (subscription.status === 'incomplete') {
      newStatus = 'active'; // Incompleta pero aún en proceso
      if (subscription.current_period_end) {
        expiresAt = new Date(subscription.current_period_end * 1000);
      }
    }

    // 3. Actualizar BD
    const sql = `
      UPDATE neon_auth.users 
      SET subscription_status = $1, 
          subscription_expires_at = $2,
          stripe_subscription_id = $3
      WHERE id = $4
      RETURNING subscription_status, subscription_expires_at
    `;

    const result = await query(sql, [newStatus, expiresAt, subscription.id, userId]);

    if (result.rows.length === 0) {
      console.warn(`[sync] Usuario ${userId} no encontrado para actualizar`);
      return false;
    }

    const updated = result.rows[0];

    console.log(`[sync] ✅ Sincronización completada:`);
    console.log(`   BD Status: ${updated.subscription_status}`);
    console.log(`   BD Expires: ${updated.subscription_expires_at.toISOString()}`);
    console.log(`   Stripe Status: ${subscription.status}`);
    console.log(`   Match: ${updated.subscription_status === newStatus ? '✅' : '❌'}`);

    return true;

  } catch (error) {
    console.error(`[sync] ❌ Error sincronizando:`, error.message);
    return false;
  }
}

/**
 * Verifica si BD y Stripe están sincronizadas
 * Útil para detectar problemas
 */
export async function validateSync(userId, stripeSubscriptionId) {
  try {
    // 1. Obtener datos de BD
    const bdResult = await query(
      `SELECT subscription_status, subscription_expires_at FROM neon_auth.users WHERE id = $1`,
      [userId]
    );

    if (bdResult.rows.length === 0) {
      return { synced: false, error: 'Usuario no encontrado en BD' };
    }

    const bd = bdResult.rows[0];

    // 2. Obtener datos de Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // 3. Mapear status esperado
    let expectedStatus = 'active';
    if (stripeSubscription.status === 'canceled') {
      expectedStatus = 'canceled';
    }

    // 4. Validar
    const statusMatch = bd.subscription_status === expectedStatus;
    
    return {
      synced: statusMatch,
      bd: {
        status: bd.subscription_status,
        expiresAt: bd.subscription_expires_at?.toISOString()
      },
      stripe: {
        status: stripeSubscription.status,
        currentPeriodEnd: stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null
      },
      match: statusMatch ? '✅' : '❌'
    };

  } catch (error) {
    console.error(`[validate] ❌ Error validando:`, error.message);
    return { synced: false, error: error.message };
  }
}

/**
 * Ejecuta sincronización de emergencia si detecta desincronización
 */
export async function emergencySyncIfNeeded(userId, stripeSubscriptionId) {
  try {
    const validation = await validateSync(userId, stripeSubscriptionId);

    if (!validation.synced) {
      console.warn(`[emergency] ⚠️ DESINCRONIZACIÓN DETECTADA:`);
      console.warn(`   Usuario: ${userId}`);
      console.warn(`   BD Status: ${validation.bd?.status}`);
      console.warn(`   Stripe Status: ${validation.stripe?.status}`);
      
      // Sincronizar de emergencia
      console.log(`[emergency] 🔄 Ejecutando sincronización de emergencia...`);
      const synced = await syncSubscriptionFromStripe(userId, stripeSubscriptionId);
      
      if (synced) {
        console.log(`[emergency] ✅ Sincronización de emergencia completada`);
        return true;
      } else {
        console.error(`[emergency] ❌ Sincronización de emergencia FALLÓ`);
        return false;
      }
    }

    return true;

  } catch (error) {
    console.error(`[emergency] ❌ Error en sincronización de emergencia:`, error.message);
    return false;
  }
}
