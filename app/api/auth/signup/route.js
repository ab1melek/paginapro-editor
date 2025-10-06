import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import { createUser, findUserByIdentifier } from '../../../../db/queries/auth.queries.js';
import { COOKIE_NAME, signToken } from '../../../../lib/auth.js';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 });
    }

    // Unicidad por email
    const existsByEmail = await findUserByIdentifier(email);
    if (existsByEmail) return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });

    // Derivar username a partir del email
    const local = String(email).split('@')[0] || 'user';
    const base = local.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'user';
    let username = base;
    let tries = 0;
    while (tries < 3) {
      const clash = await findUserByIdentifier(username);
      if (!clash) break;
      username = `${base}-${nanoid(6)}`;
      tries++;
    }

    const hash = await bcrypt.hash(password, 10);
    // Nuevos registros nunca son especiales; los especiales se crean por seed/admin
    const is_special = false;

    const user = await createUser({ id: nanoid(), username, email, password_hash: hash, is_special });

    const token = await signToken({ id: user.id, username: user.username, email: user.email, is_special: user.is_special });
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    if (String(e?.message || '').toLowerCase().includes('duplicate key')) {
      return NextResponse.json({ error: 'Conflicto de registro, intenta de nuevo' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
