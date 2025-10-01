// Seeder puntual para restaurar o crear la landing paginaprolanding
// Uso: node db/seed_single.js paginaprolanding
// Si ya existe, actualiza; si no, inserta.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertPage, selectPageBySlug, updatePageById } from './queries/page.queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSeed(slug) {
  const candidate = path.resolve(__dirname, `seed_${slug}.json`);
  if (!fs.existsSync(candidate)) {
    throw new Error(`No existe ${candidate}.`);
  }
  const raw = fs.readFileSync(candidate, 'utf8');
  const json = JSON.parse(raw);
  if (!json || typeof json !== 'object') throw new Error('Seed inválido');
  return json;
}

async function main() {
  const slug = (process.argv[2] || '').trim();
  if (!slug) {
    console.error('Uso: node db/seed_single.js <slug>');
    process.exit(1);
  }
  const data = readSeed(slug);
  const existing = await selectPageBySlug(slug);
  if (existing && existing.id) {
    console.log(`Existe ${slug}, actualizando id=${existing.id}...`);
    await updatePageById(existing.id, { ...data, id: existing.id });
  } else {
    console.log(`No existe ${slug}, insertando...`);
    await insertPage(data);
  }
  console.log(`Listo: ${slug}`);
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('Error en seeder:', e);
    process.exit(1);
  });
}
