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

  // Manejar la edición de una página
  const handleEdit = (id) => {
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
      <PageList pages={pages} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}