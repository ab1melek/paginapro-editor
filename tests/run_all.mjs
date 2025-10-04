#!/usr/bin/env node
import assert from 'assert';
import 'dotenv/config';
import { getPageBySlug } from '../app/api/services/getPageBySlug.db.service.js';
import { query } from '../db/pool.js';

const run = async () => {
  console.log('Running tests...');

  // 1) DB connectivity
  process.stdout.write('1) DB connectivity... ');
  const r1 = await query('SELECT 1 AS ok');
  assert(r1 && r1.rows && r1.rows[0] && (r1.rows[0].ok === 1 || r1.rows[0].ok === '1'));
  console.log('OK');

  // 2) current schema matches DB_SCHEMA or default 'editor'
  process.stdout.write('2) current_schema check... ');
  const r2 = await query("SELECT current_schema() AS schema");
  const expected = process.env.DB_SCHEMA ? process.env.DB_SCHEMA.split(',')[0] : 'editor';
  const actual = r2.rows[0].schema;
  assert(actual === expected, `expected search_path first entry ${expected}, got ${actual}`);
  console.log('OK (', actual, ')');

  // 3) pages table exists in editor schema
  process.stdout.write('3) pages table exists in schema... ');
  const r3 = await query("SELECT to_regclass('editor.pages') AS reg");
  assert(r3.rows[0].reg, 'editor.pages not found');
  console.log('OK');

  // 4) paginaprolanding page has blocks
  process.stdout.write('4) paginaprolanding has blocks... ');
  const page = await getPageBySlug('paginaprolanding');
  assert(page, 'page not found');
  const blocks = page.blocks || (Array.isArray(page) ? page[0]?.blocks : undefined);
  assert(Array.isArray(blocks) && blocks.length > 0, 'no blocks found in paginaprolanding');
  console.log('OK (blocks=', blocks.length, ')');

  console.log('\nAll tests passed ✅');
};

run().then(() => process.exit(0)).catch(err => {
  console.error('\nTest failed:', err && err.message ? err.message : err);
  process.exit(1);
});
