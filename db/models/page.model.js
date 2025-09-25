export function toPageRow(data) {
  // data es el objeto raíz del editor (o el primer item del wrapper [data])
  const id = data.id || `editor-${Date.now()}`;
  const slug = data.slug;
  const title = data.title || null;
  const page_settings = data.pageSettings || null;
  return { id, slug, title, data, page_settings };
}

export function fromPageRow(row) {
  if (!row) return null;
  // devolvemos el mismo shape que espera el editor (array wrapper [data]) o objeto según se usa hoy
  const root = row.data || {};
  // aseguramos id/slug/pageSettings en el objeto data para paridad
  root.id = row.id;
  root.slug = row.slug;
  if (row.page_settings) root.pageSettings = row.page_settings;
  if (row.title && !root.title) root.title = row.title;
  return root;
}
