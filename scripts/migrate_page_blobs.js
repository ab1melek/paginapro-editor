// Migrador de blobs: mueve assets de 'general/' a '<slug>/' para una página
// Uso: node scripts/migrate_page_blobs.js --slug <slug>
// Requiere: PAGINAPRO_READ_WRITE_TOKEN en .env

import { del, put } from '@vercel/blob';
import 'dotenv/config';
import { getAllPagesWithData } from '../app/api/services/getAllPagesWithData.db.service.js';
import { selectPageBySlug, updatePageById } from '../db/queries/page.queries.js';

const TOKEN = process.env.PAGINAPRO_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error('Falta PAGINAPRO_READ_WRITE_TOKEN en el entorno.');
  process.exit(1);
}

function parseArgs() {
  const out = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === '--slug') out.slug = process.argv[++i];
    if (a === '--dry') out.dry = true;
  }
  return out;
}

function collectImageUrls(root) {
  try {
    const set = new Set();
    const data = Array.isArray(root) ? (root[0] || {}) : (root || {});
    const visit = (blocks) => {
      if (!Array.isArray(blocks)) return;
      for (const b of blocks) {
        if (!b || typeof b !== 'object') continue;
        if (b.type === 'image') {
          const u = b.data?.file?.url || b.data?.url;
          if (typeof u === 'string' && u) set.add(u);
        }
        if (b.type === 'hero' && b.data && typeof b.data.bg === 'string') {
          const m = b.data.bg.match(/url\(([^)]+)\)/i);
          if (m && m[1]) {
            const raw = m[1].replace(/['"]/g, '');
            if (raw) set.add(raw);
          }
        }
        if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
          for (const col of b.data.blocks) {
            const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
            visit(colBlocks);
          }
        }
      }
    };
    visit(Array.isArray(data.blocks) ? data.blocks : []);
    return set;
  } catch {
    return new Set();
  }
}

function replaceUrlsInData(root, replaceMap) {
  const data = Array.isArray(root) ? (root[0] || {}) : (root || {});
  const clone = structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
  const visit = (blocks) => {
    if (!Array.isArray(blocks)) return;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image') {
        const prev = b.data?.file?.url || b.data?.url;
        const next = prev && replaceMap.get(prev);
        if (next) {
          if (b.data?.file?.url) b.data.file.url = next;
          if (b.data?.url) b.data.url = next;
        }
      }
      if (b.type === 'hero' && b.data && typeof b.data.bg === 'string') {
        for (const [oldU, newU] of replaceMap) {
          if (b.data.bg.includes(oldU)) {
            b.data.bg = b.data.bg.replace(oldU, newU);
          }
        }
      }
      if (b.type === 'columns' && Array.isArray(b.data?.blocks)) {
        for (const col of b.data.blocks) {
          const colBlocks = Array.isArray(col) ? col : (col?.blocks || []);
          visit(colBlocks);
        }
      }
    }
  };
  visit(clone.blocks || []);
  return Array.isArray(root) ? [clone] : clone;
}

async function copyBlob(oldUrl, newKey) {
  const res = await fetch(oldUrl);
  if (!res.ok) throw new Error(`No se pudo leer ${oldUrl} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || undefined;
  const up = await put(newKey, buf, { access: 'public', token: TOKEN, contentType: ct });
  return up.url;
}

function vercelBlobKeyFromUrl(u) {
  try {
    const url = new URL(u);
    return decodeURIComponent(url.pathname.replace(/^\//, ''));
  } catch { return null; }
}

function isGeneralUrl(u) {
  try {
    const url = new URL(u);
    if (!url.hostname.endsWith('vercel-storage.com')) return false;
    const key = vercelBlobKeyFromUrl(u);
    return key?.startsWith('general/');
  } catch { return false; }
}

async function main() {
  const { slug, dry } = parseArgs();
  if (!slug) {
    console.error('Falta --slug');
    process.exit(1);
  }
  const page = await selectPageBySlug(slug);
  if (!page || !page.id) {
    console.error(`No existe la página con slug=${slug}`);
    process.exit(1);
  }
  const urls = Array.from(collectImageUrls(page)).filter(isGeneralUrl);
  if (!urls.length) {
    console.log('No hay imágenes en general/ para migrar.');
    process.exit(0);
  }
  console.log('A migrar:', urls.length);

  const rep = new Map();
  for (const u of urls) {
    const key = vercelBlobKeyFromUrl(u);
    const [, filename] = key.split(/general\//);
    const newKey = `${slug}/${filename}`;
    if (dry) {
      console.log(`[dry] ${u} -> ${newKey}`);
      rep.set(u, u.replace(key, newKey));
      continue;
    }
    const newUrl = await copyBlob(u, newKey);
    rep.set(u, newUrl);
  }

  // Actualizar la página
  const updated = replaceUrlsInData(page, rep);
  if (!dry) await updatePageById(page.id, { ...updated, id: page.id });

  // Eliminar originales si quedan huérfanos
  if (!dry) {
    const all = await getAllPagesWithData();
    const isUsed = (url) => {
      for (const p of all) {
        const set = collectImageUrls(p);
        if (set.has(url)) return true;
      }
      return false;
    };
    for (const oldUrl of urls) {
      if (!isUsed(oldUrl)) {
        try { await del(oldUrl, { token: TOKEN }); console.log('Borrado origen:', oldUrl); } catch {}
      }
    }
  }

  console.log('Migración completada.');
}

main().catch((e) => { console.error(e); process.exit(1); });
