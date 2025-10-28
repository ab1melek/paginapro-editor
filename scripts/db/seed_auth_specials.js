#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { nanoid } from 'nanoid';
import { query } from '../db/pool.js';

async function upsert(username, plain) {
  const hash = await bcrypt.hash(plain, 10);
  const id = nanoid();
  const sql = `
    INSERT INTO neon_auth.users (id, username, email, password_hash, is_special)
    VALUES ($1,$2,NULL,$3,true)
    ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, is_special=true, updated_at=now()
    RETURNING id, username, is_special;
  `;
  const r = await query(sql, [id, username, hash]);
  return r.rows[0];
}

(async () => {
  const users = [
    ['gatunoide', process.env.SEED_GAT_PASS || 'adminñ06'],
    ['mozarelle20', process.env.SEED_MOZ_PASS || 'adminñ20'],
  ];
  for (const [u, p] of users) {
    const r = await upsert(u, p);
    console.log('Upserted', r);
  }
  process.exit(0);
})();
