"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import Button from "../../../components/Button";
import styles from "./Editor.module.css";

const Editor = dynamic(() => import("../../../components/Editor"), {
  ssr: false,
});

const callEditorService = async (data) => {
  try {
    const response = await fetch("/api/editor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await response.json();
    } else {
      alert("Error al guardar los datos en el servidor");
    }
  } catch (error) {
    console.error("Error al enviar los datos al servidor:", error);
    alert("Error al enviar los datos al servidor");
  }
};

export default function EditorPage() {
  const editorRef = useRef(null);

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

        console.log("Datos generados:", savedData);
        await callEditorService(savedData);
        alert("Datos guardados correctamente");
      } catch (error) {
        console.error("Error al guardar los datos:", error);
        alert("Error al guardar los datos");
      }
    }
  };


  
  return (
    <main className={styles.main}>
      <h1>Editor 🚀</h1>
      <Editor ref={editorRef} />
      <Button label="Guardar" onClick={handleSaveClick} className={styles.saveButton} />
    </main>
  );
}
