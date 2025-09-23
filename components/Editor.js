"use client";

import EditorJS from "@editorjs/editorjs";
import DragDrop from 'editorjs-drag-drop';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EDITOR_JS_TOOLS } from "./utils/tools.js";

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
      const editor = new EditorJS({
        holder: "editorjs",
        tools: EDITOR_JS_TOOLS,
        data: initialData || INITIAL_DATA,
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

      if (initialData) loadedRef.current = true;
    } else if (initialData && !loadedRef.current) {
      try {
        editorRef.current.render(initialData);
        loadedRef.current = true;
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
        // Preservar slug si venía en los datos iniciales (para no pedirlo de nuevo en ediciones)
        if (initialData?.slug && !savedData.slug) {
          savedData.slug = initialData.slug;
        }
        if (initialData?.id && !savedData.id) {
          savedData.id = initialData.id;
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

export default Editor;