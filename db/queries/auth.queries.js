import { query } from '../pool.js';

export async function createUser({ id, username, email, password_hash, is_special = false }) {
  const sql = `
    INSERT INTO neon_auth.users (id, username, email, password_hash, is_special)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (username) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, neon_auth.users.email),
      password_hash = EXCLUDED.password_hash,
      is_special = EXCLUDED.is_special,
      updated_at = now()
    RETURNING id, username, email, is_special, created_at, updated_at;
  `;
  const res = await query(sql, [id, username, email || null, password_hash, is_special]);
  return res.rows[0];
}

export async function findUserByIdentifier(identifier) {
  const sql = `
    SELECT id, username, email, password_hash, is_special
    FROM neon_auth.users
    WHERE username = $1 OR email = $1
    LIMIT 1
  `;
  const res = await query(sql, [identifier]);
  return res.rows[0] || null;
}

export async function countPagesByOwner(ownerId) {
  const res = await query('SELECT COUNT(1) AS cnt FROM pages WHERE owner_id = $1', [ownerId]);
  return Number(res.rows[0]?.cnt || 0);
}

export async function getPageOwnerById(id) {
  const res = await query('SELECT owner_id FROM pages WHERE id=$1', [id]);
  return res.rows[0]?.owner_id || null;
}
