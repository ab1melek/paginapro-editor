"use client";

import EditorJS from "@editorjs/editorjs";
import { useEffect, useRef } from "react";
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

export default function Editor() {
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

  return <div id="editorjs" />;
}
