import { selectPages } from '../../../db/queries/page.queries.js';

export async function getPages() {
  return await selectPages();
}
