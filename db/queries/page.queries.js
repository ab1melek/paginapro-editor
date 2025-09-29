import { fromPageRow, toPageRow } from '../models/page.model.js';
import { query } from '../pool.js';

export async function insertPage(data) {
  const row = toPageRow(data);
  const text = `INSERT INTO pages (id, slug, title, data, page_settings) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const values = [row.id, row.slug, row.title, row.data, row.page_settings];
  const res = await query(text, values);
  return fromPageRow(res.rows[0]);
}

export async function updatePageById(id, data) {
  // merge server-side: tomamos el row actual y lo actualizamos completamente con "data"
  const text = `UPDATE pages SET slug=$2, title=$3, data=$4, page_settings=$5 WHERE id=$1 RETURNING *`;
  const row = toPageRow({ ...data, id });
  const values = [id, row.slug, row.title, row.data, row.page_settings];
  const res = await query(text, values);
  return fromPageRow(res.rows[0]);
}

export async function selectPageById(id) {
  const res = await query(`SELECT * FROM pages WHERE id=$1`, [id]);
  return fromPageRow(res.rows[0]);
}

export async function selectPageBySlug(slug) {
  const res = await query(`SELECT * FROM pages WHERE slug = $1`, [slug]);
  return fromPageRow(res.rows[0]);
}

export async function selectPages() {
  const res = await query(`SELECT id, slug, title, created_at FROM pages ORDER BY created_at DESC`);
  return res.rows.map(r => ({ id: r.id, name: r.slug || r.title || 'Sin nombre' }));
}

// Devuelve todas las páginas con sus datos completos (incluye blocks)
export async function selectAllPagesWithData() {
  const res = await query(`SELECT * FROM pages`);
  return res.rows.map(fromPageRow);
}

export async function deletePageById(id) {
  const res = await query(`DELETE FROM pages WHERE id=$1`, [id]);
  return { ok: res.rowCount > 0 };
}
