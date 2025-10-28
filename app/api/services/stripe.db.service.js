import { query } from "../../../db/pool.js";

/**
 * Guarda el stripe_customer_id para un usuario
 */
export async function saveStripeCustomerForUser(userId, customerId) {
  const sql = `UPDATE neon_auth.users SET stripe_customer_id = $1 WHERE id = $2`;
  await query(sql, [customerId, userId]);
}

/**
 * Guarda la suscripción y actualiza el estado a 'active'
 */
export async function saveSubscriptionForUser(userId, subscription) {
  console.log('[saveSubscriptionForUser] subscription:', {
    id: subscription.id,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
  });

  // Validar que current_period_end exista y sea un número válido
  if (!subscription.current_period_end || isNaN(subscription.current_period_end)) {
    console.error('[saveSubscriptionForUser] Invalid current_period_end:', subscription.current_period_end);
    throw new Error('Invalid subscription period end date');
  }

  const expiresAt = new Date(subscription.current_period_end * 1000);
  const status = subscription.status === "active" ? "active" : "expired";

  console.log('[saveSubscriptionForUser] Updating user:', {
    userId,
    status,
    expiresAt: expiresAt.toISOString(),
  });

  const sql = `
    UPDATE neon_auth.users 
    SET stripe_subscription_id = $1, subscription_status = $2, subscription_expires_at = $3
    WHERE id = $4
  `;
  await query(sql, [subscription.id, status, expiresAt, userId]);
}

/**
 * Inicia el período de prueba de 10 días
 * Solo aplica si el usuario no es especial y no tiene suscripción
 */
export async function startTrialForUser(userId) {
  const trialStartedAt = new Date();
  const trialExpiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // +10 días

  const sql = `
    UPDATE neon_auth.users 
    SET subscription_status = $1, trial_started_at = $2, subscription_expires_at = $3
    WHERE id = $4 AND is_special = false AND subscription_status = 'none'
  `;
  await query(sql, ["trial", trialStartedAt, trialExpiresAt, userId]);
}

/**
 * Marca la suscripción como expirada
 */
export async function expireSubscriptionForUser(userId) {
  const sql = `
    UPDATE neon_auth.users 
    SET subscription_status = $1, subscription_expires_at = $2
    WHERE id = $3
  `;
  await query(sql, ["expired", new Date(), userId]);
}

/**
 * Obtiene el estado actual de suscripción del usuario
 */
export async function getUserSubscriptionStatus(userId) {
  const sql = `
    SELECT 
      is_special,
      subscription_status, 
      subscription_expires_at,
      trial_started_at
    FROM neon_auth.users 
    WHERE id = $1
  `;
  const result = await query(sql, [userId]);
  return result.rows[0] || null;
}

/**
 * Obtiene el usuario por su stripe_customer_id
 */
export async function getUserByStripeCustomerId(customerId) {
  const sql = `
    SELECT id, username, email FROM neon_auth.users WHERE stripe_customer_id = $1
  `;
  const result = await query(sql, [customerId]);
  return result.rows[0] || null;
}

/**
 * Marca la suscripción como cancelada de forma manual (usuario solicita cancelación)
 * IMPORTANTE: Conserva subscription_expires_at para que el usuario tenga acceso hasta el último día pagado
 * Solo cambia el estado a 'canceled' para indicar que no habrá renovación
 */
export async function cancelSubscriptionForUser(userId, subscriptionId) {
  const sql = `
    UPDATE neon_auth.users 
    SET subscription_status = $1
    WHERE id = $2
  `;
  
  console.log('[cancelSubscriptionForUser]', {
    userId,
    subscriptionId,
    newStatus: 'canceled',
    note: 'subscription_expires_at se conserva para acceso hasta el último día pagado'
  });
  
  await query(sql, ['canceled', userId]);
}
