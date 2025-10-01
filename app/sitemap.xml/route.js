import { NextResponse } from 'next/server';
import { APP } from '../../lib/config';
import { getPages } from '../api/services/getPages.db.services';

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
    if (process.env.NOINDEX === '1') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
      return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' }, status: 200 });
    }
    const pages = await getPages();
    const urls = (pages || []).map((p) => {
      const d = Array.isArray(p) ? (p[0] || {}) : (p || {});
      const slug = d.slug || d.name || null;
      if (!slug) return null;
      return `<url><loc>${base}/${encodeURIComponent(slug)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }).filter(Boolean).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' }, status: 200 });
  } catch (e) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' }, status: 200 });
  }
}
