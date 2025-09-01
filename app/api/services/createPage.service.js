import fs from "fs";
import path from "path";

export const createPage = async (data) => {
  try {
    // Verificar si los datos ya tienen un ID
    if (!data.id) {
      data.id = `editor-${Date.now()}`; // Generar un ID único si no existe
    }

    // Generar la ruta del archivo dinámicamente usando data.id
    const filePath = path.join(process.cwd(), "JSON", `${data.id}.json`);

    // Verificar si el archivo ya existe
    if (fs.existsSync(filePath)) {
      throw new Error("La página ya existe");
    }

    // Guardar los datos en un nuevo archivo
    fs.writeFileSync(filePath, JSON.stringify([data], null, 2));

    return { message: "Página creada correctamente", data };
  } catch (error) {
    console.error("Error al crear la página:", error);
    throw new Error("Error al crear la página");
  }
};