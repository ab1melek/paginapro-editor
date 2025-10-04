#!/usr/bin/env node
/**
 * Seed pages into a specific schema using an unpooled client.
 * Usage:
 *   node scripts/seed_in_schema.js [schema] [slug]
 * If slug is omitted and schema is provided, this will run all seeds in db/seed_*.json
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();
const { Client } = pg;

const schema = process.argv[2] || 'editor';
const slug = process.argv[3];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSeedFile(name) {
  const file = path.resolve('db', `seed_${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Seed file not found: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function insertPage(client, page) {
  const id = page.id;
  const slug = page.slug;
  const title = page.title || null;
  // Store the whole seed object as JSONB in the `data` column (the repo expects the editor root here)
  const data = page; // pg will serialize object to JSONB
  const page_settings = page.pageSettings || null;

  const text = `INSERT INTO pages (id, slug, title, data, page_settings) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, title=EXCLUDED.title, data=EXCLUDED.data, page_settings=EXCLUDED.page_settings RETURNING *`;
  const values = [id, slug, title, data, page_settings];
  const res = await client.query(text, values);
  return res.rows[0];
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set in env');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SET search_path TO "${schema}";`);

    if (slug) {
      const page = readSeedFile(slug);
      console.log('Seeding', slug);
      await insertPage(client, page);
      console.log('Seeded', slug);
    } else {
      // load all seed_*.json in db/
      const files = fs.readdirSync(path.resolve('db')).filter(f => f.startsWith('seed_') && f.endsWith('.json'));
      for (const f of files) {
        const name = f.replace(/^seed_/, '').replace(/\.json$/, '');
        const page = JSON.parse(fs.readFileSync(path.resolve('db', f), 'utf8'));
        console.log('Seeding', name);
        await insertPage(client, page);
        console.log('Seeded', name);
      }
    }
  } catch (err) {
    console.error('Error seeding:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
