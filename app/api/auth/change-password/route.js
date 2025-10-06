import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { query } from '../../../../db/pool.js';
import { COOKIE_NAME, verifyToken } from '../../../../lib/auth.js';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const res = await query('SELECT password_hash FROM neon_auth.users WHERE id=$1', [user.id]);
    const row = res.rows[0];
    if (!row) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) return NextResponse.json({ error: 'Actual contraseña incorrecta' }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE neon_auth.users SET password_hash=$2, updated_at=now() WHERE id=$1', [user.id, hash]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
