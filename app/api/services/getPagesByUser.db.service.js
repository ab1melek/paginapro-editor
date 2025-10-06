import { selectPageBySlug, selectPagesByOwner } from '../../../db/queries/page.queries.js';

export async function getPagesByUser({ userId, username }) {
  const pages = await selectPagesByOwner(userId);

  // Excepción: la portada (HOME_SLUG) sólo la ve "gatunoide" en su lista
  const HOME_SLUG = (process.env.HOME_SLUG || 'paginaprolanding').toLowerCase();
  if (String(username || '').toLowerCase() === 'gatunoide') {
    try {
      const landing = await selectPageBySlug(HOME_SLUG);
      if (landing && !pages.some(p => p.id === landing.id)) {
        pages.unshift({ id: landing.id, name: landing.slug || landing.title || 'portada' });
      }
    } catch {}
  } else {
    // Asegurar que ningún otro usuario vea la portada en su lista
    const filtered = pages.filter(p => (p?.name || '').toLowerCase() !== HOME_SLUG);
    return filtered;
  }

  return pages;
}
