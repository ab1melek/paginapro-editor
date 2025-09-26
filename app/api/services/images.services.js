import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { BLOB } from '../../../lib/config.js';

const IMAGE_DIR = path.join(process.cwd(), "public", "uploads"); // Ruta para guardar las imágenes
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_MIME_TYPES = ["image/png", "image/jpeg"];

// Soporta subir a un servidor de blobs local (compatible con dev/blob-server.js)
// Configure BLOB_URL en .env (por ejemplo: http://localhost:4001)
export async function saveImage(file) {
  // Validar tipo de archivo
  if (!VALID_MIME_TYPES.includes(file.type)) {
    throw new Error("Solo se permiten archivos PNG o JPG");
  }

  // Validar tamaño del archivo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo supera el límite de 2 MB");
  }

  const blobUrl = BLOB?.url || null;
  if (blobUrl) {
    // Subir al blob server remoto (dev)
    const form = new FormData();
    const buf = Buffer.from(await file.arrayBuffer());
    // En Node/Next la Web API FormData acepta Blobs/Files; usamos Blob de la plataforma
    const blob = new Blob([buf], { type: file.type });
    form.append('file', blob, file.name || `${uuidv4()}.png`);

    const res = await fetch(`${blobUrl.replace(/\/$/, '')}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'error');
      throw new Error(`Blob upload failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // El blob server devuelve { id, url, filename }
    if (json?.url) return json.url;
    // fallback a id relativo
    if (json?.id) return `${blobUrl.replace(/\/$/, '')}/blob/${encodeURIComponent(json.id)}`;
    throw new Error('Blob server returned unexpected response');
  }

  // Fallback: guardar localmente en public/uploads
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = path.join(IMAGE_DIR, fileName);
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}