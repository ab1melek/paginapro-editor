import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { findUserByIdentifier } from '../../../../db/queries/auth.queries.js';
import { COOKIE_NAME, signToken } from '../../../../lib/auth.js';

// Rate limiting sencillo en memoria (reinicia al redeploy)
const attempts = new Map(); // key -> { count, firstAt }
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 5;

function shouldBlock(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec) return false;
  if (now - rec.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFail(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec) attempts.set(key, { count: 1, firstAt: now });
  else attempts.set(key, { count: rec.count + 1, firstAt: rec.firstAt });
}
function recordSuccess(key) { attempts.delete(key); }

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for') || 'local';
    const key = `${ip}:${identifier}`;
    if (shouldBlock(key)) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta más tarde.' }, { status: 429 });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      recordFail(key);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      recordFail(key);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    recordSuccess(key);

    const token = await signToken({ id: user.id, username: user.username, email: user.email, is_special: user.is_special });
    const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email, is_special: user.is_special } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8h, alineado con JWT
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
