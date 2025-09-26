"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageList from "../../components/PageList";

export default function DashboardPage() {
  const [pages, setPages] = useState([]);
  const router = useRouter();

  // Obtener las páginas existentes
  const fetchPages = async () => {
    const response = await fetch("/api/editor");
    const data = await response.json();
    setPages(data);
  };

  // Manejar la creación de una nueva página
  const handleCreate = () => {
    router.push(`/dashboard/editor`); // Redirigir al editor sin un ID
  };

  // Manejar la edición de una página: primero obtener y loguear datos
  const handleEdit = async (id) => {
    try {
      const res = await fetch(`/api/editor?id=${id}`);
      if (res.ok) {
        const pageData = await res.json();
        console.log("Datos de la página antes de navegar:", pageData);
      } else {
        console.warn("No se pudo obtener la página", id);
      }
    } catch (e) {
      console.error("Error al obtener la página antes de editar:", e);
    }
    router.push(`/dashboard/editor?id=${id}`); // Redirigir al editor con el ID de la página
  };

  // Manejar la eliminación de una página
  const handleDelete = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar esta página?");
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/editor?id=${id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        alert(result.message);
        fetchPages(); // Actualizar la lista después de eliminar
      } catch (error) {
        console.error("Error al eliminar la página:", error);
        alert("Error al eliminar la página");
      }
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={handleCreate}>
        Crear nueva página
        </button>
      </div>
      <PageList pages={pages} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}