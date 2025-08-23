import fs from "fs";
import path from "path";

export const getPages = async () => {
  try {
    // Ruta de la carpeta JSON
    const folderPath = path.join(process.cwd(), "JSON");

    // Verificar si la carpeta existe
    if (!fs.existsSync(folderPath)) {
      throw new Error("La carpeta JSON no existe");
    }

    // Leer todos los archivos en la carpeta JSON
    const files = fs.readdirSync(folderPath);

    // Extraer el atributo "name" de cada archivo
    const pages = files.map((file) => {
      const filePath = path.join(folderPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      // Retornar el nombre y el ID de la página
      return {
        id: file.replace(".json", ""), // Eliminar la extensión del archivo para obtener el ID
        name: data[0]?.slug || "Sin nombre", // Si no tiene un nombre, usar un valor predeterminado
      };
    });
    console.log(pages);
    return pages;
  } catch (error) {
    console.error("Error al obtener las páginas:", error);
    throw new Error("Error al obtener las páginas");
  }
};