"use client";

import EditorJS from "@editorjs/editorjs";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EDITOR_JS_TOOLS } from "./utils/tools.js";

const INITIAL_DATA = {
  time: new Date().getTime(),
  blocks: [
    {
      type: "paragraph",
      data: { text: "Escribe algo aquí..." },
    },
  ],
};

const Editor = forwardRef((props, ref) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: "editorjs",
        tools: EDITOR_JS_TOOLS,
        data: INITIAL_DATA,
      });
      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save();
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