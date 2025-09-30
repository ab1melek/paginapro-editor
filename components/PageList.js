export default function PageList({ pages, onEdit, onDelete }) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return (
      <div style={{
        border: '1px dashed #d1d5db', padding: 24, borderRadius: 12, textAlign: 'center', color: '#6b7280'
      }}>
        No hay páginas aún. Crea tu primera página desde el botón “+ Crear página”.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {pages.map((page) => (
        <div key={page.id} style={{
          border: '1px solid #e9ecef', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>{page.slug || page.name || page.id}</div>
            {page.slug ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>/{page.slug}</div>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button onClick={() => onEdit(page.id)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Editar</button>
            <button onClick={() => onDelete(page.id)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}