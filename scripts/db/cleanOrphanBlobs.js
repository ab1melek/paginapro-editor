// Script para limpiar blobs huérfanos en Vercel Blob
// Ejecuta: node scripts/cleanOrphanBlobs.js

import { del, list } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config();

import { getAllPagesWithData } from '../app/api/services/getAllPagesWithData.db.service.js';

const VERCEL_BLOB_TOKEN = process.env.PAGINAPRO_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

if (!VERCEL_BLOB_TOKEN) {
  console.error('Falta PAGINAPRO_READ_WRITE_TOKEN en el entorno.');
  process.exit(1);
}

function collectAllImageUrls(pages) {
  const urls = new Set();
  const visit = (blocks) => {
    if (!Array.isArray(blocks)) return;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image') {
        const u = b.data?.file?.url || b.data?.url;
        if (u) urls.add(u);
      }
      if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
        for (const col of b.data.blocks) {
          const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
          visit(colBlocks);
        }
      }
    }
  };
  for (const p of pages || []) {
    const data = Array.isArray(p) ? (p[0] || {}) : (p || {});
    visit(Array.isArray(data.blocks) ? data.blocks : []);
  }
  return urls;
}

async function main() {
  // 1. Obtener todas las URLs referenciadas
  const pages = await getAllPagesWithData();
  const usedUrls = collectAllImageUrls(pages);

  // 2. Listar todos los blobs en Vercel Blob
  const blobs = await list({ token: VERCEL_BLOB_TOKEN });

  // Debug: imprime las URLs recolectadas y las URLs de blobs
  console.log('--- URLs de imágenes referenciadas en páginas ---');
  for (const u of usedUrls) console.log(u);
  console.log('--- URLs de blobs en Vercel Blob ---');
  for (const blob of blobs.blobs) console.log(blob.url);

  let deleted = 0;
  for (const blob of blobs.blobs) {
    if (!usedUrls.has(blob.url)) {
      console.log('Borrando blob huérfano:', blob.url);
      await del(blob.url, { token: VERCEL_BLOB_TOKEN });
      deleted++;
    }
  }
  console.log(`Limpieza terminada. Blobs borrados: ${deleted}`);
}

main().catch(e => {
  console.error('Error en limpieza:', e);
  process.exit(1);
});
