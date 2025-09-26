import { selectAllPagesWithData } from '../../../db/queries/page.queries.js';

export async function getAllPagesWithData() {
  return await selectAllPagesWithData();
}
