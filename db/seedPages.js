// Seeder para páginas principales: paginaprolanding, mislinks y pro
// Ejecuta este archivo con Node para insertar las páginas en la base de datos
// Requiere que la tabla `pages` exista y la conexión esté configurada

import fs from 'fs';
import path from 'path';
import { insertPage } from './queries/page.queries.js';

const seeds = [
  JSON.parse(fs.readFileSync(path.resolve('db/seed_paginaprolanding.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.resolve('db/seed_mislinks.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.resolve('db/seed_pro.json'), 'utf8')),
];

async function seed() {
  for (const page of seeds) {
    try {
      await insertPage(page);
      console.log(`Página insertada: ${page.slug}`);
    } catch (e) {
      console.error(`Error insertando ${page.slug}:`, e.message);
    }
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
