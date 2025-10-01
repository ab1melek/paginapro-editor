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

// Función para generar un slug único
const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  let counter = 0;
  let uniqueSlug = slug;
  
  while (true) {
    try {
      // Verificar si el slug existe
      const response = await fetch(`/api/editor?slug=${uniqueSlug}`);
      if (response.status === 404) {
        // Slug disponible
        return uniqueSlug;
      }
      // Slug existe, intentar con siguiente número
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    } catch (error) {
      console.error("Error verificando slug:", error);
      // En caso de error, usar timestamp como fallback
      return `${slug}-${Date.now()}`;
    }
  }
};

const callEditorService = async (data, isEditing) => {
  try {
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/editor?id=${data.id}` : "/api/editor";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error === "Slug ya existe") {
        throw new Error("El nombre de la página ya está en uso. Por favor, elige otro nombre.");
      }
      throw new Error("Fallo en el guardado");
    }
    return await response.json();
  } catch (error) {
    console.error("Error al enviar los datos al servidor:", error);
    const message = error.message || "Error al enviar los datos al servidor";
    alert(message);
    throw error;
  }
};

// Normalizador de slug: minúsculas, sin acentos, con guiones
const toSlug = (value) => {
  try {
    if (!value) return '';
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  } catch {
    return '';
  }
};

function EditorPageInner() {
  const editorRef = useRef(null);
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");
  const pageSlug = searchParams.get("slug");
  const previewKey = searchParams.get("previewKey");
  const [initialData, setInitialData] = useState(null);
  const [pageStyle, setPageStyle] = useState({ backgroundColor: '#ffffff', containerBackgroundColor: '#ffffff' });

  // Pide un slug y valida que sea único. Devuelve { slug, name } o null si cancelan.
  const promptUniqueSlug = async (preset = '') => {
    // Esperar a que el navegador esté listo para prompts
    if (typeof window === 'undefined') return null;
    // Bucle hasta tener un slug válido o cancelar
    // Nota: usamos prompt/alert/confirm por simplicidad, reemplazable por UI propia
    // Normalizador de slug ya definido como toSlug
    while (true) {
      const input = window.prompt('Ingresa el título (se usará como slug para la URL):', preset);
      if (input === null) return null; // cancelado
      const s = toSlug(input || '');
      if (!s) {
        window.alert('El título/slug no puede estar vacío.');
        continue;
      }
      try {
        const res = await fetch(`/api/editor?slug=${encodeURIComponent(s)}`);
        if (res.status === 404) {
          return { slug: s, name: input };
        }
        // Si ya existe, sugerir uno libre automáticamente
        const suggestion = await generateUniqueSlug(s);
        const accept = window.confirm(`El slug "${s}" ya está en uso. ¿Quieres usar "${suggestion}"?`);
        if (accept) return { slug: suggestion, name: input || suggestion };
        // Si no acepta, repetir
      } catch (e) {
        console.error('Error verificando slug:', e);
        // Como fallback, aceptar s con timestamp
        const fallback = `${s}-${Date.now()}`;
        const accept = window.confirm(`No se pudo verificar el slug. ¿Usar "${fallback}" igualmente?`);
        if (accept) return { slug: fallback, name: input || fallback };
      }
    }
  };

  // Cargar datos iniciales y forzar slug antes de montar el editor
  useEffect(() => {
    // Exponer slug global si viene en la URL
    try {
      if (typeof window !== 'undefined') {
        const current = (pageSlug || '').toString();
        if (current) window.__PP_UPLOAD_SLUG__ = current;
      }
    } catch {}

    const loadPage = async () => {
      // Caso 1: Borrador (previewKey)
      if (previewKey && typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem(previewKey);
          if (raw) {
            let data = JSON.parse(raw);
            const root = Array.isArray(data) ? (data[0] || {}) : (data || {});
            if (!root.slug) {
              const picked = await promptUniqueSlug(root.title || '');
              if (!picked) { window.location.href = '/dashboard'; return; }
              const withSlug = { ...root, slug: picked.slug, name: picked.name || picked.slug };
              data = Array.isArray(data) ? [withSlug] : withSlug;
            }
            try { if (typeof window !== 'undefined') window.__PP_UPLOAD_SLUG__ = (Array.isArray(data) ? data[0] : data).slug; } catch {}
            setInitialData(data);
            return;
          }
        } catch (e) {
          console.warn('[Editor] No se pudo leer previewKey:', e);
        }
      }

      // Caso 2: Edición existente por id/slug
      if (pageId || pageSlug) {
        try {
          const res = pageId ? await fetch(`/api/editor?id=${pageId}`) : await fetch(`/api/editor?slug=${encodeURIComponent(pageSlug)}`);
          if (res.ok) {
            const data = await res.json();
            setInitialData(data);
            try {
              const psRoot = Array.isArray(data) ? (data[0] || {}) : (data || {});
              let ps = psRoot.pageSettings || {};
              if (!ps || !Object.keys(ps).length) {
                ps = extractPageSettingsFromBlocks(psRoot.blocks || []);
              }
              setPageStyle({
                backgroundColor: ps.backgroundColor || '#ffffff',
                containerBackgroundColor: ps.containerBackgroundColor || '#ffffff',
              });
              // Exponer slug global
              const s = (psRoot.slug || psRoot.title || '').toString();
              if (s && typeof window !== 'undefined') window.__PP_UPLOAD_SLUG__ = s;
            } catch {}
          } else {
            console.warn('[Editor] No se pudo cargar la página', pageId);
          }
        } catch (e) {
          console.error('[Editor] Error al cargar la página:', e);
        }
        return;
      }

      // Caso 3: Nueva página -> pedir slug
      const picked = await promptUniqueSlug('');
      if (!picked) { if (typeof window !== 'undefined') window.location.href = '/dashboard'; return; }
      const bootstrap = {
        slug: picked.slug,
        name: picked.name || picked.slug,
        pageSettings: { backgroundColor: '#ffffff', containerBackgroundColor: '#ffffff', containerOpacity: 1 },
        blocks: [ { type: 'paragraph', data: { text: 'Escribe algo aquí...' } } ],
      };
      try { if (typeof window !== 'undefined') window.__PP_UPLOAD_SLUG__ = picked.slug; } catch {}
      setInitialData(bootstrap);
    };

    loadPage();
  }, [pageId, pageSlug, previewKey]);

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
        // Persistir colores y heroBackground (sin tocar maxWidth ni otros campos)
        const updated = {
          ...root,
          pageSettings: {
            ...(root.pageSettings || {}),
            backgroundColor: next.backgroundColor,
            containerBackgroundColor: next.containerBackgroundColor,
          }
        };
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
        
        // Solicitar el título/slug si no está presente
        if (!savedData.slug) {
          const input = prompt("Ingresa el título (se usará como slug para la URL):");
          const slug = toSlug(input || '');
          if (!slug) {
            alert("El título/slug no puede estar vacío.");
            return; // Detener el guardado si no hay un nombre válido
          }
          savedData.slug = slug; // Guardar slug normalizado
          // Guardar nombre visible: usa el input original si existe, sino el slug
          if (!savedData.name) savedData.name = input || slug;
        } else {
          // Normalizar slug existente por consistencia
          savedData.slug = toSlug(savedData.slug);
          if (!savedData.name) savedData.name = savedData.slug;
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
