
import { del, put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";


const IMAGE_DIR = path.join(process.cwd(), "public", "uploads"); // Ruta para guardar las imágenes
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_MIME_TYPES = ["image/png", "image/jpeg"];
const VERCEL_BLOB_TOKEN = process.env.PAGINAPRO_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

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

  // Si hay token de Vercel Blob, sube ahí
  if (VERCEL_BLOB_TOKEN) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name?.split('.').pop() || 'png';
    const filename = `${uuidv4()}.${ext}`;
    const upload = await put(filename, buffer, {
      access: 'public',
      token: VERCEL_BLOB_TOKEN,
      contentType: file.type,
    });
    return upload.url;
  }

  // Fallback: guardar localmente en public/uploads
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = path.join(IMAGE_DIR, fileName);
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

// Intenta borrar una imagen a partir de su URL. Devuelve true si se borró o no existía.
export async function deleteImage(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') return true;

    // Si es una URL de Vercel Blob y hay token, intenta borrar
    if (VERCEL_BLOB_TOKEN) {
      try {
        const u = new URL(imageUrl);
        const host = u.hostname || '';
        // Vercel Blob v2 usa dominios *.vercel-storage.com
        const isVercelBlob = host.endsWith('vercel-storage.com') || host.includes('.blob.vercel-storage.com');
        if (isVercelBlob) {
          await del(imageUrl, { token: VERCEL_BLOB_TOKEN });
          return true;
        }
      } catch {
        // Si no es una URL válida, seguimos con otros casos
      }
    }

    // Caso local: rutas relativas bajo /uploads/
    if (imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
      try {
        await fs.unlink(localPath);
        return true;
      } catch (e) {
        if (e && e.code === 'ENOENT') return true; // ya no existe
        throw e;
      }
    }

    // Si es una URL absoluta externa que no controlamos, no la borramos
    return true;
  } catch (e) {
    console.warn('deleteImage error:', e);
    return false;
  }
}

function defaultPort(protocol) {
  return protocol === 'https:' ? '443' : '80';
}

function isLoopback(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}