import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertPage } from './queries/page.queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateFromJson() {
  const folderPath = path.join(process.cwd(), 'JSON');
  if (!fs.existsSync(folderPath)) {
    console.log('No existe carpeta JSON, nada que migrar.');
    return;
  }
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  let ok = 0, fail = 0;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(folderPath, file), 'utf-8');
      const arr = JSON.parse(raw);
      const data = Array.isArray(arr) ? arr[0] : arr;
      if (!data) continue;
      // Asegurar id/slug
      if (!data.id) data.id = file.replace('.json','');
      if (!data.slug) {
        console.warn(`Archivo ${file} sin slug; se omite.`);
        continue;
      }
      await insertPage(data);
      ok++;
    } catch (e) {
      console.error('Error migrando', file, e.message);
      fail++;
    }
  }
  console.log(`Migración completa. OK=${ok}, FAIL=${fail}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFromJson().then(()=>process.exit(0)).catch(()=>process.exit(1));
}
