"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageList from "../../components/PageList";

export default function DashboardPage() {
  const [pages, setPages] = useState([]);
  const router = useRouter();

  // Obtener las páginas existentes
  const fetchPages = async () => {
    try {
      console.log("Obteniendo lista de páginas...");
      const response = await fetch("/api/editor");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Páginas obtenidas:", data);
      setPages(data || []);
    } catch (error) {
      console.error("Error al obtener páginas:", error);
      alert(`Error al cargar las páginas: ${error.message}`);
      setPages([]); // Lista vacía como fallback
    }
  };

  // Manejar la creación de una nueva página
  const handleCreate = () => {
    router.push(`/dashboard/new`); // Redirigir al selector de plantillas
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
    if (!id) {
      console.error("ID de página no válido:", id);
      alert("Error: ID de página no válido");
      return;
    }

    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar esta página?");
    if (confirmDelete) {
      try {
        console.log("Eliminando página con ID:", id);
        const response = await fetch(`/api/editor?id=${encodeURIComponent(id)}`, { 
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log("Respuesta de eliminación:", response.status, response.statusText);
        
        let result = null;
        try { 
          result = await response.json(); 
          console.log("Resultado de eliminación:", result);
        } catch (jsonError) {
          console.warn("No se pudo parsear JSON de respuesta:", jsonError);
        }
        
        if (response.ok) {
          alert(result?.message || 'Página eliminada correctamente');
          await fetchPages(); // Recargar la lista
        } else {
          const errorMsg = result?.error || `Error ${response.status}: ${response.statusText}`;
          console.error("Error del servidor:", errorMsg);
          alert(`No se pudo eliminar la página: ${errorMsg}`);
        }
      } catch (error) {
        console.error("Error al eliminar la página:", error);
        alert(`Error de conexión al eliminar la página: ${error.message}`);
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