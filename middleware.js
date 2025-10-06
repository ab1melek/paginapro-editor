import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from './lib/auth.js';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  // make the landing ("/" and HOME_SLUG) public - no redirects here
  const homeSlug = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();

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
