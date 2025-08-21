import fs from "fs";
import path from "path";

export const saveEditorData = async (data) => {
  try {
    // Verificar si los datos ya tienen un ID
    if (!data.id) {
      data.id = `editor-${Date.now()}`; // Generar un ID único si no existe
    }

    // Generar la ruta del archivo dinámicamente usando data.id
    const filePath = path.join(process.cwd(), "JSON", `${data.id}.json`);

    // Leer el archivo existente (si existe)
    let existingData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = JSON.parse(fileContent);
    }

    // Actualizar o agregar los datos
    const updatedData = existingData.filter((item) => item.id !== data.id); // Filtrar datos existentes con el mismo ID
    updatedData.push(data); // Agregar los nuevos datos

    // Guardar los datos actualizados en el archivo JSON
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    return { message: "Datos hola correctamente", data };
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    throw new Error("Error al guardar los datos");
  }
};