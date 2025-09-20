"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PreviewGrid = dynamic(() => import("./PreviewGrid"), { ssr: false });

export default function PreviewLoader({ id, previewKey }) {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Si hay previewKey, cargar desde sessionStorage
      if (previewKey && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(previewKey);
          if (raw) {
            setPageData(JSON.parse(raw));
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("No se pudo leer previewKey:", e);
        }
      }

      // Si no hay previewKey, intentar fetch por id
      if (id) {
        try {
          const res = await fetch(`/api/editor?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            setPageData(data);
          }
        } catch (e) {
          console.warn("Error al obtener page por id:", e);
        }
      }

      setLoading(false);
    };
    load();
  }, [id, previewKey]);

  if (loading) return <div>Cargando preview...</div>;
  if (!pageData) return <div>Página no encontrada</div>;

  const backToEditor = () => {
    const backUrl = id ? `/dashboard/editor?id=${id}&previewKey=${previewKey}` : `/dashboard/editor?previewKey=${previewKey}`;
    window.location.href = backUrl;
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={backToEditor}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "#fff",
            color: "#222",
            cursor: "pointer",
            fontWeight: 400,
            fontFamily: "Georgia, 'Times New Roman', serif",
            boxShadow: "inset 0 -1px 0 #f1f1f1",
          }}
        >
          Volver a edición
        </button>
      </div>
      <PreviewGrid pageData={pageData} />
    </div>
  );
}
