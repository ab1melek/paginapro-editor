"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Button from "../../../components/Button";
import { extractPageSettingsFromBlocks } from "../../../components/utils/editorRender";
import styles from "./Editor.module.css";

const Editor = dynamic(() => import("../../../components/Editor"), {
  ssr: false,
});

const callEditorService = async (data, isEditing) => {
  try {
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/editor?id=${data.id}` : "/api/editor";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Fallo en el guardado");
    return await response.json();
  } catch (error) {
    console.error("Error al enviar los datos al servidor:", error);
    alert("Error al enviar los datos al servidor");
  }
};

function EditorPageInner() {
  const editorRef = useRef(null);
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");
  const previewKey = searchParams.get("previewKey");
  const [initialData, setInitialData] = useState(null);
  const [pageStyle, setPageStyle] = useState({ backgroundColor: '#ffffff', containerBackgroundColor: '#ffffff' });

  // Solo leer y mostrar en consola los datos existentes si hay un id
  useEffect(() => {
    const loadPage = async () => {
      // Priorizar borrador en sessionStorage si viene previewKey
      if (previewKey && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(previewKey);
          if (raw) {
            const data = JSON.parse(raw);
            console.log("[Editor] Cargando borrador desde previewKey:", previewKey);
            setInitialData(data);
            return;
          }
        } catch (e) {
          console.warn("[Editor] No se pudo leer previewKey:", e);
        }
      }

      if (!pageId) return;
      try {
        const res = await fetch(`/api/editor?id=${pageId}`);
        if (res.ok) {
          const data = await res.json();
          console.log("[Editor] Datos cargados para edición:", data);
          setInitialData(data);
          try {
            // Backfill desde bloque pageSettings si no existe en root (compatibilidad JSON legado)
            let ps = (Array.isArray(data) ? data[0]?.pageSettings : data?.pageSettings) || {};
            if (!ps || !Object.keys(ps).length) {
              const root = Array.isArray(data) ? (data[0] || {}) : (data || {});
              ps = extractPageSettingsFromBlocks(root.blocks || []);
            }
            setPageStyle({
              backgroundColor: ps.backgroundColor || '#ffffff',
              containerBackgroundColor: ps.containerBackgroundColor || '#ffffff',
            });
          } catch {}
        } else {
          console.warn("[Editor] No se pudo cargar la página", pageId);
        }
      } catch (e) {
        console.error("[Editor] Error al cargar la página:", e);
      }
    };
    loadPage();
  }, [pageId, previewKey]);

  // Aplicar estilos inmediatos al cambiar pageStyle (modo edición)
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        if (pageStyle?.backgroundColor) document.body.style.backgroundColor = pageStyle.backgroundColor;
      }
    } catch {}
  }, [pageStyle?.backgroundColor]);

  const updatePageSettings = (partial) => {
    setPageStyle((prev) => {
      const next = { ...prev, ...partial };
      // Propagar a initialData para que Editor.save() lo preserve en el root
      setInitialData((prevData) => {
        if (!prevData) return prevData;
        const root = Array.isArray(prevData) ? (prevData[0] || {}) : (prevData || {});
        // Solo persistir backgroundColor y containerBackgroundColor para evitar maxWidth
        const updated = { ...root, pageSettings: { ...(root.pageSettings || {}), backgroundColor: next.backgroundColor, containerBackgroundColor: next.containerBackgroundColor } };
        return Array.isArray(prevData) ? [updated] : updated;
      });
      return next;
    });
  };

  const handleSaveClick = async () => {
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save(); // Llama a la función save del editor
        // Inyectar los colores elegidos en la barra si existen
        savedData.pageSettings = {
          ...(savedData.pageSettings || {}),
          ...(pageStyle?.backgroundColor ? { backgroundColor: pageStyle.backgroundColor } : {}),
          ...(pageStyle?.containerBackgroundColor ? { containerBackgroundColor: pageStyle.containerBackgroundColor } : {}),
        };
        
        // Solicitar el nombre de la página si no está presente
        if (!savedData.slug) {
          const slug = prompt("Ingresa el nombre de la nueva página:");
          if (!slug || slug.trim() === "") {
            alert("El nombre de la página no puede estar vacío.");
            return; // Detener el guardado si no hay un nombre válido
          }
          savedData.slug = slug; // Asignar el nombre ingresado
        }

  // Si estamos editando, aseguramos que mantenga el id original
  if (pageId) savedData.id = pageId;
  console.log(pageId ? "Datos a actualizar:" : "Datos generados:", savedData);
  await callEditorService(savedData, !!pageId);
        alert("Datos guardados correctamente");
      } catch (error) {
        console.error("Error al guardar los datos:", error);
        alert("Error al guardar los datos");
      }
    }
  };

  const handlePreviewClick = async () => {
    if (!editorRef.current) return;
    try {
      const savedData = await editorRef.current.save();
      // Asegurar que el preview refleje los colores de la barra superior
      savedData.pageSettings = {
        ...(savedData.pageSettings || {}),
        ...(pageStyle?.backgroundColor ? { backgroundColor: pageStyle.backgroundColor } : {}),
        ...(pageStyle?.containerBackgroundColor ? { containerBackgroundColor: pageStyle.containerBackgroundColor } : {}),
      };
      // Guardar borrador temporal en sessionStorage
      const key = `preview-${Date.now()}`;
      try {
        sessionStorage.setItem(key, JSON.stringify(savedData));
      } catch (e) {
        console.warn("No se pudo guardar preview en sessionStorage:", e);
      }
      // Redirigir al preview incluyendo previewKey y opcionalmente id
      const url = pageId
        ? `/dashboard/editor/preview?id=${pageId}&previewKey=${key}`
        : `/dashboard/editor/preview?previewKey=${key}`;
      window.location.href = url;
    } catch (e) {
      console.error("Error al generar preview:", e);
      alert("No se pudo generar el preview. Intenta guardar primero.");
    }
  };


  
  return (
    <main className={styles.main}>
      {/* Barra superior de estilos (responsive: acciones arriba, colores abajo en móvil) */}
      <div className={styles.styleBar}>
        <div className={styles.actionsRow}>
          <Button label="Dashboard" onClick={() => window.location.href = "/dashboard"} className={styles.actionButton} />
          <div className={styles.actionsSpacer} />
          <div className={styles.actionsGroupRight}>
            <Button label="Preview" onClick={handlePreviewClick} className={styles.actionButton} />
            <Button label="Guardar" onClick={handleSaveClick} className={styles.actionButton} />
          </div>
        </div>

        <div className={styles.colorsRow}>
          <div className={styles.styleControl}>
            <label>Color Fondo</label>
            <input
              type="color"
              value={pageStyle.backgroundColor || '#ffffff'}
              onChange={(e) => updatePageSettings({ backgroundColor: e.target.value })}
            />
          </div>
          <div className={styles.styleControl}>
            <label>Color Página</label>
            <input
              type="color"
              value={pageStyle.containerBackgroundColor || '#ffffff'}
              onChange={(e) => updatePageSettings({ containerBackgroundColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Canvas del editor con fondo aplicado */}
      <div className={styles.editorCanvas} style={{ margin: '0 auto', backgroundColor: pageStyle.containerBackgroundColor || '#ffffff', padding: '0 16px', borderRadius: 6 }}>
        <Editor ref={editorRef} initialData={initialData} />
      </div>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Cargando editor…</div>}>
      <EditorPageInner />
    </Suspense>
  );
}
