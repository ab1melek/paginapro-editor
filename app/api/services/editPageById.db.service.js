import { selectPageById, updatePageById } from '../../../db/queries/page.queries.js';

export async function getPageById(id) {
  const page = await selectPageById(id);
  if (!page) throw new Error('NOT_FOUND');
  return page;
}

export async function editPageById(id, newData) {
  const updated = await updatePageById(id, newData);
  if (!updated) throw new Error('NOT_FOUND');
  return { message: 'Página actualizada', data: updated };
}
