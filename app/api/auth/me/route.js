import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { query } from '../../../../db/pool.js';
import { COOKIE_NAME, verifyToken } from '../../../../lib/auth.js';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  
  if (!payload?.id) {
    return NextResponse.json({ user: null });
  }

  try {
    // Obtener el usuario con todos sus datos de suscripción
    // Especificar el schema explícitamente para evitar conflictos con search_path
    console.log(`[/api/auth/me] Fetching user with ID: ${payload.id}`);
    const result = await query(
      `SELECT id, username, email, is_special, subscription_status, trial_started_at, subscription_expires_at, stripe_subscription_id FROM neon_auth.users WHERE id = $1`,
      [payload.id]
    );

    console.log(`[/api/auth/me] Query returned ${result.rows.length} rows`);

    if (result.rows.length === 0) {
      console.log(`[/api/auth/me] User not found in DB`);
      return NextResponse.json({ user: null });
    }

    console.log(`[/api/auth/me] Returning user:`, result.rows[0]);
    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[/api/auth/me] Error:', err);
    console.log(`[/api/auth/me] Falling back to token payload`);
    return NextResponse.json({ user: payload || null }); // Fallback to token payload
  }
}
