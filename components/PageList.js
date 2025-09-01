export default function PageList({ pages, onEdit, onDelete }) {
  return (
    <div>
      <h2>Lista de páginas</h2>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            {page.name}
            <button onClick={() => onEdit(page.id)}>Editar</button>
            <button onClick={() => onDelete(page.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}