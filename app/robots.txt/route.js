import { NextResponse } from 'next/server';
import { APP } from '../../lib/config';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const noindex = process.env.NOINDEX === '1';
  const content = noindex
    ? `User-agent: *\nDisallow: /`
    : `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`;
  return new NextResponse(content, { headers: { 'Content-Type': 'text/plain' }, status: 200 });
}
