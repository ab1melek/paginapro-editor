import { insertPage } from '../../../db/queries/page.queries.js';
import { startTrialForUser } from './stripe.db.service.js';

export async function createPage(data) {
  try {
    const page = await insertPage(data);

    // Iniciar prueba de 10 días si es la primera página
    if (data.owner_id) {
      try {
        await startTrialForUser(data.owner_id);
      } catch (err) {
        console.warn('⚠️ Error al iniciar trial:', err.message);
        // No fallar la creación de página si hay error en trial
      }
    }

    return { message: 'Página creada correctamente', data: page };
  } catch (err) {
    if (err?.message?.includes('duplicate key')) {
      throw new Error('SLUG_DUPLICATE');
    }
    throw err;
  }
}
