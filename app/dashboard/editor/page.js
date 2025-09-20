"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Button from "../../../components/Button";
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

export default function EditorPage() {
  const editorRef = useRef(null);
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");
  const previewKey = searchParams.get("previewKey");
  const [initialData, setInitialData] = useState(null);

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
        } else {
          console.warn("[Editor] No se pudo cargar la página", pageId);
        }
      } catch (e) {
        console.error("[Editor] Error al cargar la página:", e);
      }
    };
    loadPage();
  }, [pageId, previewKey]);

  const handleSaveClick = async () => {
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save(); // Llama a la función save del editor
        
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
      <Editor ref={editorRef} initialData={initialData} />
      <div className={styles.actionsBar}>
        <Button label="Preview" onClick={handlePreviewClick} className={styles.actionButton} />
        <Button label="Guardar" onClick={handleSaveClick} className={styles.actionButton} />
      </div>
      <Button label="Dashboard" onClick={() => window.location.href = "/dashboard"} className={styles.dashboardButton} />
    </main>
  );
}
