"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import Button from "../../../components/Button";
import styles from "./Editor.module.css";

const Editor = dynamic(() => import("../../../components/Editor"), {
  ssr: false,
});

export default function EditorPage() {
  const editorRef = useRef(null);

  const handleSaveClick = async () => {
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save(); // Llama a la función save del editor
        console.log("Datos guardados:", savedData);
        alert("Datos guardados correctamente");
      } catch (error) {
        console.error("Error al guardar los datos:", error);
        alert("Error al guardar los datos");
      }
    }
  };
  
  return (
    <main className={styles.main}>
      <h1>Mi Editor 🚀</h1>
      <Editor ref={editorRef} />
      <Button label="Guardar" onClick={handleSaveClick} className={styles.saveButton} />
    </main>
  );
}
