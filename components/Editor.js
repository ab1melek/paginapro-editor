"use client";

import EditorJS from "@editorjs/editorjs";
import DragDrop from 'editorjs-drag-drop';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EDITOR_JS_TOOLS, makeEditorTools } from "./utils/tools.js";

const INITIAL_DATA = {
  time: new Date().getTime(),
  pageSettings: {
    backgroundColor: '#ffffff',
    containerBackgroundColor: '#ffffff',
    containerOpacity: 1,
  },
  blocks: [
    {
      type: "paragraph",
      data: { text: "Escribe algo aquí..." },
    },
  ],
};

const Editor = forwardRef(({ initialData }, ref) => {
  const editorRef = useRef(null);
  const loadedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const holderExists = document.getElementById("editorjs");
    if (!holderExists) return;

    if (!editorRef.current) {
      const root = Array.isArray(initialData) ? (initialData[0] || {}) : (initialData || {});
      const slugForUpload = (root?.slug || root?.title || 'general').toString();
      try {
        if (typeof window !== 'undefined') {
          window.__PP_UPLOAD_SLUG__ = slugForUpload;
        }
      } catch {}
      const editor = new EditorJS({
        holder: "editorjs",
        tools: makeEditorTools(slugForUpload) || EDITOR_JS_TOOLS,
        data: initialData || INITIAL_DATA,
        sanitizer: {
          span: { style: true, class: true },
          mark: { style: true, class: true },
        },
        onChange: async () => {
          try {
            // Debounce simple por frame
            if (editorRef.__onChangeScheduled) return;
            editorRef.__onChangeScheduled = true;
            requestAnimationFrame(async () => {
              editorRef.__onChangeScheduled = false;
              if (!editorRef.current?.save) return;
              const data = await editorRef.current.save();
              const urlsNow = collectImageUrls(data);
              const urlsPrev = editorRef.__lastImageUrls || new Set();
              // Detectar removidas
              for (const u of urlsPrev) {
                if (!urlsNow.has(u)) {
                  // Llamar a API DELETE (best-effort)
                  try {
                    await fetch('/api/images', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: u })
                    });
                  } catch {}
                }
              }
              editorRef.__lastImageUrls = urlsNow;
            });
          } catch {}
        },
      });

      editorRef.current = editor;
      // Activar DragDrop sólo cuando EditorJS termina su ciclo de inicialización
      editor.isReady
        .then(() => {
          try {
            new DragDrop(editorRef.current);
            // console.debug('DragDrop inicializado');
          } catch (ddErr) {
            console.warn('Fallo al inicializar DragDrop', ddErr);
          }
        })
        .catch((err) => {
          console.warn('EditorJS no terminó de inicializarse', err);
        });

      if (initialData) {
        loadedRef.current = true;
        // Inicializamos baseline de imágenes para comparación
        try {
          editor.save().then(d => {
            editorRef.__lastImageUrls = collectImageUrls(d);
          }).catch(()=>{});
        } catch {}
      }
    } else if (initialData && !loadedRef.current) {
      try {
        editorRef.current.render(initialData);
        loadedRef.current = true;
        try {
          if (typeof window !== 'undefined') {
            const r = Array.isArray(initialData) ? (initialData[0] || {}) : (initialData || {});
            const s = (r?.slug || r?.title || 'general').toString();
            window.__PP_UPLOAD_SLUG__ = s;
          }
        } catch {}
        // Actualizar baseline post-render
        try {
          editorRef.current.save().then(d => {
            editorRef.__lastImageUrls = collectImageUrls(d);
          }).catch(()=>{});
        } catch {}
      } catch (e) {
        console.warn("No se pudo renderizar initialData en EditorJS", e);
      }
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [mounted]);

  const handleSave = async () => {
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save();
        // Actualizar el slug global si viene definido en los datos guardados
        try {
          if (typeof window !== 'undefined' && savedData?.slug) {
            window.__PP_UPLOAD_SLUG__ = savedData.slug.toString();
          }
        } catch {}
        // Preservar slug/id si venían en los datos iniciales (array wrapper compatible)
        const rootInit = Array.isArray(initialData) ? (initialData[0] || {}) : (initialData || {});
        if (rootInit?.slug && !savedData.slug) {
          savedData.slug = rootInit.slug;
        }
        if (rootInit?.id && !savedData.id) {
          savedData.id = rootInit.id;
        }
        // Si el bloque pageSettings está presente, promover sus datos al root para facilitar render SSR/cliente
        // Buscamos un bloque de tipo 'pageSettings' y copiamos su data a savedData.pageSettings
        try {
          const psBlock = Array.isArray(savedData?.blocks)
            ? savedData.blocks.find(b => b?.type === 'pageSettings')
            : null;
          if (psBlock?.data && typeof psBlock.data === 'object') {
            savedData.pageSettings = {
              backgroundColor: psBlock.data.backgroundColor ?? initialData?.pageSettings?.backgroundColor ?? '#ffffff',
              containerBackgroundColor: psBlock.data.containerBackgroundColor ?? initialData?.pageSettings?.containerBackgroundColor ?? '#ffffff',
              containerOpacity: typeof psBlock.data.containerOpacity === 'number' ? psBlock.data.containerOpacity : (initialData?.pageSettings?.containerOpacity ?? 1),
            };
          } else if (initialData?.pageSettings) {
            // Si no hay bloque, preservamos lo que venía
            savedData.pageSettings = initialData.pageSettings;
          }
        } catch {}
        return savedData;
      } catch (error) {
        console.error("Error al guardar los datos:", error);
        throw error;
      }
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return <div id="editorjs" />;
});

// Recorre la estructura de datos de Editor.js y extrae URLs de imágenes (bloque image y columnas anidadas)
function collectImageUrls(data) {
  const out = new Set();
  const visitBlocks = (blocks) => {
    if (!Array.isArray(blocks)) return;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image') {
        const url = b.data?.file?.url || b.data?.url;
        if (typeof url === 'string' && url) out.add(url);
      }
      // hero: data.bg puede ser 'url(...) ...'
      if (b.type === 'hero' && b.data && typeof b.data.bg === 'string') {
        const m = b.data.bg.match(/url\(([^)]+)\)/i);
        if (m && m[1]) {
          const raw = m[1].replace(/['"]/g, '');
          if (raw) out.add(raw);
        }
      }
      // columns: data.blocks -> array de columnas -> cada columna es array de bloques
      if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
        for (const col of b.data.blocks) {
          const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
          visitBlocks(colBlocks);
        }
      }
    }
  };
  const rootBlocks = Array.isArray(data?.blocks) ? data.blocks : [];
  visitBlocks(rootBlocks);
  return out;
}

export default Editor;