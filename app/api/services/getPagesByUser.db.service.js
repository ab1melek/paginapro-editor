import { selectPageBySlug, selectPagesByOwner } from '../../../db/queries/page.queries.js';

export async function getPagesByUser({ userId, username }) {
  const pages = await selectPagesByOwner(userId);

  // Excepción: la portada (HOME_SLUG) sólo la ve "gatunoide" en su lista
  const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
  if (String(username || '').toLowerCase() === 'gatunoide') {
    try {
      const landing = await selectPageBySlug(HOME_SLUG);
      if (landing && !pages.some(p => p.id === landing.id)) {
        pages.unshift({ id: landing.id, slug: landing.slug, title: landing.slug || 'portada' });
      }
    } catch {}
  } else {
    // Asegurar que ningún otro usuario vea la portada en su lista
    return pages.filter(p => (p?.slug || '').toLowerCase() !== HOME_SLUG);
  }

  return pages;
}
