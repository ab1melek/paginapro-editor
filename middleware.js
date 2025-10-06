import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from './lib/auth.js';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const homeSlug = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();

  // Landing exclusiva: solo "gatunoide" puede acceder a "/" y `/${homeSlug}`
  if (pathname === '/' || pathname.toLowerCase() === `/${homeSlug}`) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    const uname = String(payload.username || '').toLowerCase();
    if (uname !== 'gatunoide') {
      const url = new URL('/dashboard', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // API editor: permitir GET público; proteger POST/PUT/DELETE
  if (pathname.startsWith('/api/editor')) {
    if (req.method === 'GET') {
      return NextResponse.next();
    }
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const protectedPrefixes = ['/dashboard'];
  if (!protectedPrefixes.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    const url = new URL('/login', req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/paginaprolanding', '/dashboard/:path*', '/api/editor/:path*'],
};
