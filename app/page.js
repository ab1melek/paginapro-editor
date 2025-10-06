import ReadOnlyPage from "../components/ReadOnlyPage";
import { APP } from "../lib/config";
import { paginaproTemplate } from "./templates/paginapro";

export default async function HomePage() {
  // Slug que representa la portada del sitio; cámbialo con HOME_SLUG si lo deseas
  const HOME_SLUG = process.env.HOME_SLUG || 'paginaprolanding';
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  try {
    const res = await fetch(`${baseURL}/api/editor?slug=${encodeURIComponent(HOME_SLUG)}`, { cache: 'no-store' });
    if (res.ok) {
      const pageData = await res.json();
      return <ReadOnlyPage pageData={pageData} />;
    }
  } catch (e) {
    // Ignorar y usar fallback
  }
  // Fallback: si no existe aún la página con el slug, mostrar el template por defecto
  return <ReadOnlyPage pageData={paginaproTemplate} />;
}

// SEO para la portada (no afecta el render). Reutiliza lógica: hero header+paragraph y fallback al primer párrafo.
export async function generateMetadata() {
  const HOME_SLUG = process.env.HOME_SLUG || 'paginaprolanding';
  const baseURL = APP?.baseURL || `http://localhost:${APP?.port || 3000}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || baseURL;
  const url = `${site}/`;

  // Intenta cargar la portada real por slug; si no existe, usa el template por defecto
  let data = null;
  try {
    const res = await fetch(`${baseURL}/api/editor?slug=${encodeURIComponent(HOME_SLUG)}`, { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch {}
  const root = data ? (Array.isArray(data) ? (data[0] || {}) : data) : (Array.isArray(paginaproTemplate) ? (paginaproTemplate[0] || {}) : paginaproTemplate);
  const blocks = Array.isArray(root.blocks) ? root.blocks : [];
  const ps = root.pageSettings || {};

  let title = ps.seoTitle || root.slug || root.name || 'Inicio';
  let description = ps.seoDescription || '';

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

  if (!description) {
    const firstParagraph = blocks.find(b => b.type === 'paragraph');
    description = firstParagraph?.data?.text?.replace(/<[^>]+>/g, '').trim().slice(0, 160) || '';
  }

  const meta = {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    openGraph: { title, description: description || undefined, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description: description || undefined },
  };
  if (process.env.NOINDEX === '1') meta.robots = { index: false, follow: false };
  return meta;
}
