import { selectPageBySlug } from '../../../db/queries/page.queries.js';

export async function getPageBySlug(slug) {
  return await selectPageBySlug(slug);
}
