import { query } from '../../../db/pool.js';
import { selectPageBySlug } from '../../../db/queries/page.queries.js';

export async function getPageBySlug(slug, includeOwnerStatus = false) {
  const page = await selectPageBySlug(slug);
  
  if (page && includeOwnerStatus && page.owner_id) {
    try {
      const ownerRes = await query(
        `SELECT is_special, subscription_status, subscription_expires_at 
         FROM neon_auth.users 
         WHERE id = $1`,
        [page.owner_id]
      );
      page.ownerStatus = ownerRes.rows[0] || null;
    } catch (error) {
      console.error('Error fetching owner status:', error);
      page.ownerStatus = null;
    }
  }
  
  return page;
}
