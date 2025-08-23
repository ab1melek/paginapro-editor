import fs from "fs";
import path from "path";

export const editPageById = async (id, updatedData) => {
  try {
    const filePath = path.join(process.cwd(), "JSON", `${id}.json`);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error("La página no existe");
    }

    // Leer el archivo existente
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const existingData = JSON.parse(fileContent);

    // Actualizar los datos
    const updatedPage = { ...existingData[0], ...updatedData }; // Combinar los datos existentes con los nuevos
    fs.writeFileSync(filePath, JSON.stringify([updatedPage], null, 2));

    return { message: "Página actualizada correctamente", updatedPage };
  } catch (error) {
    console.error("Error al actualizar la página:", error);
    throw new Error("Error al actualizar la página");
  }
};