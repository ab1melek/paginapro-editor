import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const IMAGE_DIR = path.join(process.cwd(), "public", "uploads"); // Ruta para guardar las imágenes
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_MIME_TYPES = ["image/png", "image/jpeg"];

export async function saveImage(file) {
  // Validar tipo de archivo
  if (!VALID_MIME_TYPES.includes(file.type)) {
    throw new Error("Solo se permiten archivos PNG o JPG");
  }

  // Validar tamaño del archivo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo supera el límite de 2 MB");
  }

  // Generar un nombre único para el archivo
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = path.join(IMAGE_DIR, fileName);

  // Crear el directorio si no existe
  await fs.mkdir(IMAGE_DIR, { recursive: true });

  // Guardar el archivo en el sistema
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  // Devolver la URL relativa de la imagen
  return `/uploads/${fileName}`;
}