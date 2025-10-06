import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReadOnlyPage from "../../components/ReadOnlyPage";
import { COOKIE_NAME, verifyToken } from '../../lib/auth.js';
import { APP } from '../../lib/config.js';

export default async function PaginaPorSlug({ params }) {
  // Await params antes de destructurar
  const { slug } = await params;
  // Regla exclusiva: solo "gatunoide" puede ver la landing principal por slug
  const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
  if (String(slug).toLowerCase() === HOME_SLUG) {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) {
      redirect('/login');
    }
    const payload = await verifyToken(token);
    const uname = String(payload?.username || '').toLowerCase();
    if (uname !== 'gatunoide') {
      redirect('/dashboard');
    }
  }
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const res = await fetch(`${baseURL}/api/editor?slug=${slug}`, { cache: "no-store" });
  if (!res.ok) return <ReadOnlyPage pageData={null} />;
  const pageData = await res.json();
  return <ReadOnlyPage pageData={pageData} />;
}

// SEO por página (no afecta el render). Extrae título/descr del HERO y primer párrafo.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || baseURL;
  const url = `${site}/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(`${baseURL}/api/editor?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const root = Array.isArray(data) ? (data[0] || {}) : (data || {});
      const blocks = Array.isArray(root.blocks) ? root.blocks : [];
      const ps = root.pageSettings || {};

      // 1) Overrides SEO si existieran en pageSettings
      let title = ps.seoTitle || root.slug || root.name || slug;
      let description = ps.seoDescription || '';

      // 2) Prioriza HERO: header + paragraph (sin CTA)
      if (!ps.seoTitle || !ps.seoDescription) {
        const hero = blocks.find(b => b?.type === 'hero');
        if (hero && Array.isArray(hero.data?.blocks)) {
          const heroHeader = hero.data.blocks.find(b => b?.type === 'header');
          const heroParagraph = hero.data.blocks.find(b => b?.type === 'paragraph');
          if (!ps.seoTitle && heroHeader?.data?.text) {
            title = heroHeader.data.text.replace(/<[^>]+>/g, '').trim() || title;
          }
          if (!ps.seoDescription && heroParagraph?.data?.text) {
            description = heroParagraph.data.text.replace(/<[^>]+>/g, '').trim().slice(0, 160);
          }
        }
      }

      // 3) Fallback: primer párrafo fuera del HERO
      if (!description) {
        const firstParagraph = blocks.find(b => b.type === 'paragraph');
        description = firstParagraph?.data?.text?.replace(/<[^>]+>/g, '').trim().slice(0, 160) || '';
      }

      const meta = {
        title,
        description: description || undefined,
        alternates: { canonical: url },
        openGraph: { title, description: description || undefined, url, type: 'article' },
        twitter: { card: 'summary_large_image', title, description: description || undefined },
      };

      if (process.env.NOINDEX === '1') {
        meta.robots = { index: false, follow: false };
      }
      return meta;
    }
  } catch {}

  const fallback = { title: slug, alternates: { canonical: url } };
  if (process.env.NOINDEX === '1') fallback.robots = { index: false, follow: false };
  return fallback;
}