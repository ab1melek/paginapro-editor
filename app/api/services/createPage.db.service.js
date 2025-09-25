import { insertPage } from '../../../db/queries/page.queries.js';

export async function createPage(data) {
  try {
    const page = await insertPage(data);
    return { message: 'Página creada correctamente', data: page };
  } catch (err) {
    if (err?.message?.includes('duplicate key')) {
      throw new Error('SLUG_DUPLICATE');
    }
    throw err;
  }
}
